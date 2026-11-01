-- A second photo can record the portion that was not eaten. Nutrition history
-- stays immutable; the worker replaces the whole consumed revision atomically.
alter table public.post_media add column not_eaten boolean not null default false;
alter table public.post_media add constraint post_media_not_eaten_photo check (not not_eaten or (kind='photo' and position>0));
create unique index post_media_one_not_eaten on public.post_media(post_id) where not_eaten;
alter table public.post_items add column not_eaten_grams integer check (not_eaten_grams is null or not_eaten_grams>=0);
alter table public.post_items add column count_text text;
alter table public.post_items add column not_eaten_count_text text;
create or replace view public.current_post_items with (security_invoker=true) as select * from public.post_items where superseded_at is null;
grant select on public.current_post_items to authenticated,service_role;
alter table public.model_calls drop constraint model_calls_kind_check;
alter table public.model_calls add constraint model_calls_kind_check check (kind in ('sam','spark_identify','spark_correct','spark_same_meal','spark_search','fdc','transcribe','spark_label','spark_remainder'));
alter table public.post_upload_drafts add column not_eaten_position integer check (not_eaten_position is null or not_eaten_position between 1 and 7);

-- Reserve the flags in the same transaction as the upload capability. The old
-- six-argument function remains available to clients deployed before this run.
create function public.reserve_post_upload_with_options(p_operation_id uuid,p_user_id uuid,p_caption text,p_eaten_at timestamptz,p_shots jsonb,p_location jsonb,p_not_eaten_position integer,p_save_as_meal boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if p_not_eaten_position is not null and (p_not_eaten_position<1 or p_not_eaten_position>=jsonb_array_length(p_shots)) then raise exception 'The first photo cannot be not eaten' using errcode='22023';end if;
 result:=public.reserve_post_upload(p_operation_id,p_user_id,p_caption,p_eaten_at,p_shots,p_location);
 if not coalesce((result->>'published')::boolean,false) then
  update public.post_upload_drafts set not_eaten_position=p_not_eaten_position,save_as_meal=coalesce(p_save_as_meal,false) where id=p_operation_id and user_id=p_user_id and not published;
 end if;
 return result;
end $$;
revoke all on function public.reserve_post_upload_with_options(uuid,uuid,text,timestamptz,jsonb,jsonb,integer,boolean) from public,anon,authenticated;
grant execute on function public.reserve_post_upload_with_options(uuid,uuid,text,timestamptz,jsonb,jsonb,integer,boolean) to service_role;
alter function public.publish_uploaded_post(uuid,uuid) rename to publish_uploaded_post_before_not_eaten;
create function public.publish_uploaded_post(p_operation_id uuid,p_user_id uuid) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.post_upload_drafts; result uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 select * into d from public.post_upload_drafts where id=p_operation_id and user_id=p_user_id for update;
 if not found then raise exception 'Draft not found' using errcode='42501';end if;
 result:=public.publish_uploaded_post_before_not_eaten(p_operation_id,p_user_id);
 if not d.published and d.not_eaten_position is not null then
  update public.post_media set not_eaten=true where post_id=result and position=d.not_eaten_position and kind='photo';
  if not found then raise exception 'Not-eaten photo was not uploaded' using errcode='22023';end if;
 end if;
 update public.post_upload_drafts set not_eaten_position=null where id=result;
 return result;
end $$;
revoke all on function public.publish_uploaded_post(uuid,uuid),public.publish_uploaded_post_before_not_eaten(uuid,uuid) from public,anon,authenticated;
grant execute on function public.publish_uploaded_post(uuid,uuid) to service_role;

create unique index jobs_one_remainder_per_photo on public.jobs(post_id,(payload->>'remainder_photo_id')) where kind='remainder';
create function public.queue_post_remainder(p_post_id uuid,p_job_id uuid) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare photo uuid; inserted uuid;
begin
 perform 1 from public.posts where id=p_post_id and analysis_initialized_at is not null and status='ready' for update;
 if not found or not public.post_work_matches(p_post_id,p_job_id) then return false;end if;
 select id into photo from public.post_media where post_id=p_post_id and kind='photo' and not_eaten;
 if photo is null then return false;end if;
 insert into public.jobs(post_id,kind,priority,status,payload) values(p_post_id,'remainder',100,'queued',jsonb_build_object('remainder_photo_id',photo)) on conflict do nothing returning id into inserted;
 if inserted is null then return false;end if;
 update public.posts set status='processing' where id=p_post_id;
 return true;
end $$;
revoke all on function public.queue_post_remainder(uuid,uuid) from public,anon,authenticated;
grant execute on function public.queue_post_remainder(uuid,uuid) to service_role;

create function public.apply_post_remainder(p_post_id uuid,p_job_id uuid,p_photo_id uuid,p_expected uuid[],p_items jsonb,p_reply text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare actual uuid[]; j public.jobs; v jsonb; old public.post_items; new_id uuid; n jsonb;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not public.post_work_matches(p_post_id,p_job_id) then raise exception 'Not-eaten job no longer owns this meal' using errcode='40001';end if;
 select * into j from public.jobs where id=p_job_id and post_id=p_post_id and kind='remainder' and status='running' for update;
 if not found then raise exception 'Not-eaten job not found' using errcode='42501';end if;
 if coalesce((j.payload->>'remainder_applied')::boolean,false) then return true;end if;
 if not exists(select 1 from public.post_media where id=p_photo_id and post_id=p_post_id and kind='photo' and not_eaten) then raise exception 'Not-eaten photo changed' using errcode='40001';end if;
 select array_agg(id order by id) into actual from public.current_post_items where post_id=p_post_id;
 if actual is distinct from (select array_agg(x order by x) from unnest(p_expected) x) then raise exception 'Meal items changed during the not-eaten estimate' using errcode='40001';end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)<>cardinality(p_expected) or p_reply is null or length(p_reply)>4000 then raise exception 'Invalid not-eaten revision' using errcode='22023';end if;
 if (select count(distinct value->>'old_id') from jsonb_array_elements(p_items))<>cardinality(p_expected) then raise exception 'Duplicate not-eaten item' using errcode='22023';end if;
 for v in select value from jsonb_array_elements(p_items) loop
  select * into old from public.current_post_items where id=(v->>'old_id')::uuid and post_id=p_post_id;
  if not found or not (old.id=any(p_expected)) or (v->>'portion_grams')::numeric<0 or (v->>'not_eaten_grams')::numeric<0 or (v->>'portion_grams')::numeric+(v->>'not_eaten_grams')::numeric is distinct from old.portion_grams then raise exception 'Invalid consumed difference' using errcode='22023';end if;
  update public.post_items set superseded_at=clock_timestamp() where id=old.id;
  insert into public.post_items(post_id,name,portion_text,portion_grams,box,mask_path,confidence,source,supersedes,gtin,not_eaten_grams,count_text,not_eaten_count_text)
   values(p_post_id,old.name,v->>'portion_text',(v->>'portion_grams')::numeric,old.box,old.mask_path,old.confidence,'model',old.id,old.gtin,(v->>'not_eaten_grams')::integer,v->>'count_text',v->>'not_eaten_count_text') returning id into new_id;
  n:=v->'nutrition';
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref)
   values(new_id,(n->>'calories')::numeric,(n->>'protein_g')::numeric,(n->>'carbs_g')::numeric,(n->>'fat_g')::numeric,(n->>'fibre_g')::numeric,(n->>'sugar_g')::numeric,(n->>'sodium_mg')::numeric,coalesce(n->'micronutrients','[]'::jsonb),n->>'source_ref');
 end loop;
 insert into public.post_comments(post_id,author,body) values(p_post_id,'model',p_reply);
 update public.jobs set payload=payload||jsonb_build_object('remainder_applied',true) where id=p_job_id;
 return true;
end $$;
revoke all on function public.apply_post_remainder(uuid,uuid,uuid,uuid[],jsonb,text) from public,anon,authenticated;
grant execute on function public.apply_post_remainder(uuid,uuid,uuid,uuid[],jsonb,text) to service_role;

-- The new job participates in the same per-post ownership and claim lock.
create or replace function public.claim_post_job(p_now timestamptz,p_owned boolean) returns public.jobs
language plpgsql security definer set search_path=public,pg_temp as $$
declare candidate public.jobs; skipped uuid[]:=array[]::uuid[]; post_found uuid;
begin
 loop
  select * into candidate from public.jobs j where j.status='queued' and j.run_after<=p_now and not(j.id=any(skipped))
   order by j.priority,j.created_at,j.id limit 1 for update skip locked;
  if not found then return null;end if;
  if candidate.post_id is not null and candidate.kind in ('analyze','correct','recompute','remainder','card_backfill','test_noop','test_throw') then
   select id into post_found from public.posts where id=candidate.post_id for update skip locked;
   if not found then skipped:=array_append(skipped,candidate.id);continue;end if;
   -- Primary work regenerates its card on completion. Retire obsolete backfill
   -- instead of leaving a due, permanently ineligible job waking the worker.
   if candidate.kind='card_backfill' and (not exists(select 1 from public.posts where id=candidate.post_id and status='ready') or exists(select 1 from public.jobs where post_id=candidate.post_id and kind in ('analyze','correct','recompute','remainder') and status in ('queued','running'))) then
    update public.jobs set status='finished',finished_at=p_now,error=null,
     payload=payload||jsonb_build_object('skipped_reason','superseded by current meal state') where id=candidate.id;
    continue;end if;
   -- Recheck after locking the post: two lanes may have seen no running job.
   if exists(select 1 from public.jobs where post_id=candidate.post_id and status='running' and kind in ('analyze','correct','recompute','remainder','card_backfill','test_noop','test_throw')) then
    skipped:=array_append(skipped,candidate.id);continue;end if;
   update public.posts set active_job_id=case when p_owned then candidate.id else null end,
    status=case when candidate.kind='card_backfill' then status else 'processing' end,
    fail_reason=case when candidate.kind='card_backfill' then fail_reason else null end where id=candidate.post_id;
  end if;
  update public.jobs set status='running',started_at=p_now,finished_at=null,attempts=attempts+1,
   payload=payload||jsonb_build_object('post_ownership',p_owned) where id=candidate.id returning * into candidate;
  return candidate;
 end loop;
end $$;
create or replace function public.post_work_matches(p_post_id uuid,p_job_id uuid) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce((select case when p_job_id is not null then exists(
  select 1 from public.jobs j where j.id=p_job_id and j.post_id=p.id and j.status='running' and j.kind in ('analyze','correct','recompute','remainder','card_backfill','test_noop','test_throw')
  and (p.active_job_id=p_job_id or (p.active_job_id is null and not coalesce((j.payload->>'post_ownership')::boolean,false))))
 else p.active_job_id is null and (p.status='ready' or exists(select 1 from public.jobs j where j.post_id=p.id and j.status='running'
  and j.kind in ('analyze','correct','recompute','remainder','card_backfill','test_noop','test_throw') and not coalesce((j.payload->>'post_ownership')::boolean,false))) end
 from public.posts p where p.id=p_post_id),false)
$$;
