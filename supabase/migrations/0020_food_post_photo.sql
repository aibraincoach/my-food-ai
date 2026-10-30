-- Atomic ready food post with an optional already-uploaded pack photo.
-- Five-argument callers keep working through the default null argument.
-- Drop the old overload so PostgREST never has ambiguous five-argument RPCs.
drop function if exists public.create_food_post(uuid, timestamptz, text, numeric, jsonb);
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
begin
  if length(v_name) = 0 or length(v_name) > 160 then raise exception 'Name must contain 1 to 160 characters' using errcode = '22023'; end if;
  if p_grams is null or p_grams <= 0 or p_grams > 100000 then raise exception 'Portion must be between 0 and 100000 grams' using errcode = '22023'; end if;
  if p_nutrition is null or jsonb_typeof(p_nutrition) <> 'object' then raise exception 'Nutrition is required' using errcode = '22023'; end if;
  if v_unit not in ('g', 'ml') then raise exception 'Invalid portion unit' using errcode = '22023'; end if;
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
    -- A lost response may retry the same completed upload. Claim that path once.
    perform pg_advisory_xact_lock(hashtextextended(p_photo->>'path', 0));
    select m.post_id into v_post from public.post_media m join public.posts p on p.id=m.post_id
      where m.storage_path=p_photo->>'path' and p.user_id=p_user_id limit 1;
    if found then return v_post; end if;
    -- Serialize claiming a stage against its delayed cleanup job. Once cleanup is
    -- eligible/running, an old upload cannot be attached to a newly created post.
    select status,run_after into v_cleanup_status,v_cleanup_due from public.jobs
      where kind='media_cleanup' and payload->>'owner_id'=p_user_id::text
        and payload->>'deleted_post_id'=split_part(p_photo->>'path','/',2)
      for update;
    if found and (v_cleanup_status<>'queued' or v_cleanup_due<=clock_timestamp()) then
      raise exception 'Pack photo expired; choose the photo again' using errcode='22023';
    end if;
  end if;
  -- Keep every photo under its actual post id, as required by correction authorization.
  v_post:=case when p_photo is null then gen_random_uuid() else split_part(p_photo->>'path','/',2)::uuid end;
  insert into public.posts (id, user_id, caption, eaten_at, status, analysis_initialized_at)
  values (v_post, p_user_id, v_name, p_eaten_at, 'ready', clock_timestamp());
  insert into public.post_items (post_id, name, portion_text, portion_grams, source)
  values (v_post, v_name, trim_scale(p_grams)::text || ' ' || v_unit, case when v_unit = 'g' then p_grams else null end, 'user') returning id into v_item;
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
revoke all on function public.create_food_post(uuid, timestamptz, text, numeric, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_food_post(uuid, timestamptz, text, numeric, jsonb, jsonb) to service_role;

-- Scale known volumes without inventing mass.
create or replace function public.set_post_servings(p_post_id uuid, p_user_id uuid, p_servings numeric)
returns numeric language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_old numeric;
  v_initialized timestamptz;
  v_ratio numeric;
  v_item public.post_items;
begin
  if p_servings is null or p_servings < 0.25 or p_servings > 50 then
    raise exception 'Servings must be between 0.25 and 50' using errcode = '22023';
  end if;
  p_servings := round(p_servings, 2);
  select servings, analysis_initialized_at into v_old, v_initialized from public.posts
    where id = p_post_id and user_id = p_user_id for update;
  if not found then raise exception 'Post not found' using errcode = '42501'; end if;
  if v_initialized is null then raise exception 'Initial meal analysis must complete before editing' using errcode = '55000'; end if;
  if p_servings = v_old then return v_old; end if;
  v_ratio := p_servings / v_old;
  for v_item in select * from public.post_items where post_id = p_post_id and superseded_at is null for update loop
    update public.post_items set superseded_at = now() where id = v_item.id;
    insert into public.post_items (post_id, name, portion_text, portion_grams, box, mask_path, confidence, source, supersedes)
    values (p_post_id, v_item.name,
      case when v_item.portion_grams is null and v_item.portion_text ~ '^[0-9]+([.][0-9]+)? ml$' then trim_scale(round(split_part(v_item.portion_text,' ',1)::numeric * v_ratio, 2))::text || ' ml' when v_item.portion_grams is null then v_item.portion_text else trim_scale(round(v_item.portion_grams * v_ratio, 2))::text || ' g' end,
      case when v_item.portion_grams is null then null else round(v_item.portion_grams * v_ratio, 2) end,
      v_item.box, v_item.mask_path, v_item.confidence, 'user', v_item.id);
  end loop;
  update public.posts set servings = p_servings, status = 'queued', fail_reason = null where id = p_post_id;
  insert into public.jobs(post_id, kind, priority, status)
  select p_post_id, 'recompute', 100, 'queued'
  where not exists (select 1 from public.jobs where post_id = p_post_id and kind = 'recompute' and status = 'queued');
  insert into public.post_comments(post_id, author, body)
  values (p_post_id, 'model', 'Servings changed from ' || trim(trailing '.' from trim(trailing '0' from v_old::text))
    || ' to ' || trim(trailing '.' from trim(trailing '0' from p_servings::text)) || '. Every item and the totals were scaled to match.');
  return p_servings;
end;
$$;
revoke all on function public.set_post_servings(uuid, uuid, numeric) from public, anon, authenticated;
grant execute on function public.set_post_servings(uuid, uuid, numeric) to service_role;
