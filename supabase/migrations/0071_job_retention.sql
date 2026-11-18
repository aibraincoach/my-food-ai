-- #1097: retention for finished worker jobs, run by scripts/retention/run.mjs in small batches with a pause between them.
-- Kept: finished jobs for 14 days and failed jobs for 60 days after they ended. Kept for as long as the meal exists:
--   * a job a meal is working under (posts.active_job_id);
--   * a photo stage's cleanup job (post_photo_attachments.cleanup_job_id, post_upload_drafts.cleanup_job_id);
--   * an applied correction or a question's correction job: their payload holds the meal's correction sequence and
--     the comments already applied, which later corrections read;
--   * every leftovers (remainder) job: its payload holds the leftover items, and its unique index stops a photo
--     being processed twice;
--   * the latest failed job of a meal that is still failed: Try again reads its kind and payload.
-- A deleted job cannot be restored. What was deleted is counted in retention_summary, per day, rule and kind.

create table public.retention_summary (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default clock_timestamp(),
  table_name text not null check (table_name in ('jobs', 'model_calls')),
  rule text not null,
  day date not null,
  kind text not null,
  deleted integer not null check (deleted > 0)
);
alter table public.retention_summary enable row level security;
revoke all on public.retention_summary from public, anon, authenticated;

-- Candidates are found by end time without scanning the whole table.
create index jobs_ended_at on public.jobs (finished_at) where status in ('finished', 'error');
-- Retry's latest failure must not scan all jobs once per failed meal.
create index jobs_error_post_latest on public.jobs (post_id, finished_at desc nulls last, created_at desc, id desc) where status = 'error';

create function public.retention_job_candidates(p_now timestamptz)
returns table (id uuid, rule text, kind text, day date, finished_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select j.id, case when j.status = 'finished' then 'finished_14d' else 'failed_60d' end, j.kind,
         (j.finished_at at time zone 'UTC')::date, j.finished_at
  from public.jobs j
  where ((j.status = 'finished' and j.finished_at < p_now - interval '14 days')
      or (j.status = 'error' and j.finished_at < p_now - interval '60 days'))
    and j.kind <> 'remainder'
    and not (j.kind = 'correct' and coalesce(j.payload->>'correction_applied' = 'true' or j.payload->>'needs_input_question' = 'true', false))
    and not exists (select 1 from public.posts p where p.active_job_id = j.id)
    and not exists (select 1 from public.post_photo_attachments a where a.cleanup_job_id = j.id)
    and not exists (select 1 from public.post_upload_drafts d where d.cleanup_job_id = j.id)
    and not (j.status = 'error' and exists (
      select 1 from public.posts p where p.id = j.post_id and p.status = 'failed'
        and j.id = (select e.id from public.jobs e where e.post_id = p.id and e.status = 'error'
                    order by e.finished_at desc nulls last, e.created_at desc, e.id desc limit 1)))
$$;

-- Dry run: what every rule would remove now, per rule, kind and day. Deletes nothing.
create function public.retention_jobs_dry_run(p_now timestamptz default clock_timestamp())
returns table (rule text, kind text, day date, would_delete bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  select c.rule, c.kind, c.day, count(*) from public.retention_job_candidates(p_now) c group by 1, 2, 3 order by 3, 1, 2
$$;

-- One batch: at most p_limit jobs, oldest first, each counted in retention_summary. Returns the number deleted.
create function public.retention_jobs_batch(p_limit integer)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare v_deleted integer;
begin
  if p_limit is null or p_limit < 1 or p_limit > 1000 then raise exception 'Batch size must be 1 to 1000' using errcode = '22023'; end if;
  with picked as (
    select c.id, c.rule, c.kind, c.day from public.retention_job_candidates(clock_timestamp()) c
    order by c.finished_at, c.id limit p_limit
  ), gone as (
    delete from public.jobs j using picked where j.id = picked.id returning picked.rule, picked.kind, picked.day
  ), counted as (
    insert into public.retention_summary (table_name, rule, day, kind, deleted)
    select 'jobs', g.rule, g.day, g.kind, count(*) from gone g group by g.rule, g.day, g.kind
    returning deleted
  )
  select coalesce(sum(deleted), 0) into v_deleted from counted;
  return v_deleted;
end $$;

revoke all on function public.retention_job_candidates(timestamptz) from public, anon, authenticated;
revoke all on function public.retention_jobs_dry_run(timestamptz) from public, anon, authenticated;
revoke all on function public.retention_jobs_batch(integer) from public, anon, authenticated;

-- Rule 5: a pack photo's stage always has a cleanup job (sign-upload writes it before signing), so a missing job
-- means the stage is gone, the same as an expired one. Before this, a missing job let the old path through.
create or replace function public.create_food_post(
  p_user_id uuid, p_eaten_at timestamptz, p_name text, p_grams numeric, p_nutrition jsonb, p_photo jsonb default null
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_post uuid;
  v_item uuid;
  v_cleanup_status text;
  v_cleanup_due timestamptz;
  v_unit text := coalesce(p_nutrition->>'portion_unit', 'g');
  v_portion_text text;
begin
  if length(v_name) = 0 or length(v_name) > 160 then raise exception 'Name must contain 1 to 160 characters' using errcode = '22023'; end if;
  if p_grams is null or p_grams <= 0 or p_grams > 100000 then raise exception 'Portion must be between 0 and 100000 grams' using errcode = '22023'; end if;
  if p_nutrition is null or jsonb_typeof(p_nutrition) <> 'object' then raise exception 'Nutrition is required' using errcode = '22023'; end if;
  if v_unit not in ('g', 'ml', 'serving') then raise exception 'Invalid portion unit' using errcode = '22023'; end if;
  if p_eaten_at is null or p_eaten_at > now() + interval '5 minutes' then raise exception 'Invalid time eaten' using errcode = '22023'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then raise exception 'User not found' using errcode = '42501'; end if;
  if p_photo is not null then
    if jsonb_typeof(p_photo) <> 'object'
       or coalesce(p_photo->>'path', '') !~ ('^' || p_user_id::text || '/[0-9a-f-]{36}/0[.]jpg$')
       or coalesce((p_photo->>'width')::int, 0) not between 1 and 4096
       or coalesce((p_photo->>'height')::int, 0) not between 1 and 4096 then
      raise exception 'Invalid pack photo' using errcode = '22023';
    end if;
    if not exists (select 1 from storage.objects where bucket_id = 'media' and name = p_photo->>'path')
       or not exists (select 1 from storage.objects where bucket_id = 'media' and name = regexp_replace(p_photo->>'path', '[.]jpg$', '.feed.jpg')) then
      raise exception 'Pack photo upload is incomplete' using errcode = '22023';
    end if;
  end if;
  if p_photo is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_photo->>'path', 0));
    select m.post_id into v_post from public.post_media m join public.posts p on p.id=m.post_id
      where m.storage_path=p_photo->>'path' and p.user_id=p_user_id limit 1;
    if found then return v_post; end if;
    select status,run_after into v_cleanup_status,v_cleanup_due from public.jobs
      where kind='media_cleanup' and payload->>'owner_id'=p_user_id::text
        and payload->>'deleted_post_id'=split_part(p_photo->>'path','/',2)
      for update;
    if not found or (v_cleanup_status<>'queued' or v_cleanup_due<=clock_timestamp()) then
      raise exception 'Pack photo expired; choose the photo again' using errcode='22023';
    end if;
  end if;
  v_portion_text := case
    when v_unit = 'serving' then trim_scale(p_grams)::text || case when p_grams = 1 then ' serving' else ' servings' end
    else trim_scale(p_grams)::text || ' ' || v_unit
  end;
  v_post:=case when p_photo is null then gen_random_uuid() else split_part(p_photo->>'path','/',2)::uuid end;
  insert into public.posts (id, user_id, caption, eaten_at, status, analysis_initialized_at)
  values (v_post, p_user_id, v_name, p_eaten_at, 'ready', clock_timestamp());
  insert into public.post_items (post_id, name, portion_text, portion_grams, source)
  values (v_post, v_name, v_portion_text, case when v_unit = 'g' then p_grams else null end, 'user') returning id into v_item;
  insert into public.item_nutrition (post_item_id, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g, sodium_mg, micronutrients, source_ref)
  values (v_item, (p_nutrition->>'calories')::numeric, (p_nutrition->>'protein_g')::numeric, (p_nutrition->>'carbs_g')::numeric,
    (p_nutrition->>'fat_g')::numeric, (p_nutrition->>'fibre_g')::numeric, (p_nutrition->>'sugar_g')::numeric,
    (p_nutrition->>'sodium_mg')::numeric, coalesce(p_nutrition->'micronutrients', '[]'::jsonb), p_nutrition->>'source_ref');
  if p_photo is not null then
    insert into public.post_media(post_id, storage_path, position, width, height, kind)
    values (v_post, p_photo->>'path', 0, (p_photo->>'width')::int, (p_photo->>'height')::int, 'photo');
  end if;
  return v_post;
end;
$$;

create or replace function public.create_food_post_without_gtin(
  p_user_id uuid, p_eaten_at timestamptz, p_name text, p_grams numeric, p_nutrition jsonb, p_photo jsonb default null
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_post uuid;
  v_item uuid;
  v_cleanup_status text;
  v_cleanup_due timestamptz;
  v_unit text := coalesce(p_nutrition->>'portion_unit', 'g');
  v_portion_text text;
begin
  if length(v_name) = 0 or length(v_name) > 160 then raise exception 'Name must contain 1 to 160 characters' using errcode = '22023'; end if;
  if p_grams is null or p_grams <= 0 or p_grams > 100000 then raise exception 'Portion must be between 0 and 100000 grams' using errcode = '22023'; end if;
  if p_nutrition is null or jsonb_typeof(p_nutrition) <> 'object' then raise exception 'Nutrition is required' using errcode = '22023'; end if;
  if v_unit not in ('g', 'ml', 'serving') then raise exception 'Invalid portion unit' using errcode = '22023'; end if;
  if p_eaten_at is null or p_eaten_at > now() + interval '5 minutes' then raise exception 'Invalid time eaten' using errcode = '22023'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then raise exception 'User not found' using errcode = '42501'; end if;
  if p_photo is not null then
    if jsonb_typeof(p_photo) <> 'object'
       or coalesce(p_photo->>'path', '') !~ ('^' || p_user_id::text || '/[0-9a-f-]{36}/0[.]jpg$')
       or coalesce((p_photo->>'width')::int, 0) not between 1 and 4096
       or coalesce((p_photo->>'height')::int, 0) not between 1 and 4096 then
      raise exception 'Invalid pack photo' using errcode = '22023';
    end if;
    if not exists (select 1 from storage.objects where bucket_id = 'media' and name = p_photo->>'path')
       or not exists (select 1 from storage.objects where bucket_id = 'media' and name = regexp_replace(p_photo->>'path', '[.]jpg$', '.feed.jpg')) then
      raise exception 'Pack photo upload is incomplete' using errcode = '22023';
    end if;
  end if;
  if p_photo is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_photo->>'path', 0));
    select m.post_id into v_post from public.post_media m join public.posts p on p.id=m.post_id
      where m.storage_path=p_photo->>'path' and p.user_id=p_user_id limit 1;
    if found then return v_post; end if;
    select status,run_after into v_cleanup_status,v_cleanup_due from public.jobs
      where kind='media_cleanup' and payload->>'owner_id'=p_user_id::text
        and payload->>'deleted_post_id'=split_part(p_photo->>'path','/',2)
      for update;
    if not found or (v_cleanup_status<>'queued' or v_cleanup_due<=clock_timestamp()) then
      raise exception 'Pack photo expired; choose the photo again' using errcode='22023';
    end if;
  end if;
  v_portion_text := case
    when v_unit = 'serving' then trim_scale(p_grams)::text || case when p_grams = 1 then ' serving' else ' servings' end
    else trim_scale(p_grams)::text || ' ' || v_unit
  end;
  v_post:=case when p_photo is null then gen_random_uuid() else split_part(p_photo->>'path','/',2)::uuid end;
  insert into public.posts (id, user_id, caption, eaten_at, status, analysis_initialized_at)
  values (v_post, p_user_id, v_name, p_eaten_at, 'ready', clock_timestamp());
  insert into public.post_items (post_id, name, portion_text, portion_grams, source)
  values (v_post, v_name, v_portion_text, case when v_unit = 'g' then p_grams else null end, 'user') returning id into v_item;
  insert into public.item_nutrition (post_item_id, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g, sodium_mg, micronutrients, source_ref,food_category)
  values (v_item, (p_nutrition->>'calories')::numeric, (p_nutrition->>'protein_g')::numeric, (p_nutrition->>'carbs_g')::numeric,
    (p_nutrition->>'fat_g')::numeric, (p_nutrition->>'fibre_g')::numeric, (p_nutrition->>'sugar_g')::numeric,
    (p_nutrition->>'sodium_mg')::numeric, coalesce(p_nutrition->'micronutrients', '[]'::jsonb), p_nutrition->>'source_ref',p_nutrition->>'food_category');
  if p_photo is not null then
    insert into public.post_media(post_id, storage_path, position, width, height, kind)
    values (v_post, p_photo->>'path', 0, (p_photo->>'width')::int, (p_photo->>'height')::int, 'photo');
  end if;
  return v_post;
end;
$$;
