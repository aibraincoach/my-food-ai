-- A second photo can record the portion that was not eaten. Nutrition history
-- stays immutable; the worker replaces the whole consumed revision atomically.
alter table public.post_media add column not_eaten boolean not null default false;
alter table public.post_media add constraint post_media_not_eaten_photo check (not not_eaten or (kind='photo' and position>0));
create unique index post_media_one_not_eaten on public.post_media(post_id) where not_eaten;
-- Client owners can read the photo marker, but setting it must also queue the
-- matching estimate through the publication/attachment transaction.
create function public.protect_not_eaten_media() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if current_user in ('authenticated','anon') and ((tg_op='INSERT' and new.not_eaten) or (tg_op='UPDATE' and new.not_eaten is distinct from old.not_eaten)) then raise exception 'Not-eaten photos are server managed' using errcode='42501';end if;
 return new;
end $$;
create trigger protect_not_eaten_media before insert or update of not_eaten on public.post_media for each row execute function public.protect_not_eaten_media();

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

-- Reserve a destination before copying a staged photo. Attachment publication is
-- atomic and retries reuse the reservation, media row and single queued job.
create table public.post_photo_attachments(
 id uuid primary key default gen_random_uuid(),post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,stage_path text not null unique,
 target_path text not null unique,position integer not null,not_eaten boolean not null,
 cleanup_job_id uuid references public.jobs(id),media_id uuid references public.post_media(id) on delete set null,
 created_at timestamptz not null default now(),unique(post_id,position)
);
alter table public.post_photo_attachments enable row level security;
revoke all on public.post_photo_attachments from public,anon,authenticated;
grant select,insert,update,delete on public.post_photo_attachments to service_role;
create function public.prepare_post_photo_attachment(p_post_id uuid,p_user_id uuid,p_stage_path text,p_not_eaten boolean)
returns public.post_photo_attachments language plpgsql security definer set search_path=public,pg_temp as $$
declare row public.post_photo_attachments; current_status text; pos integer; cleanup uuid; stage_cleanup public.jobs;
begin
 select status into current_status from public.posts where id=p_post_id and user_id=p_user_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 select * into row from public.post_photo_attachments where stage_path=p_stage_path for update;
 if found then
  if row.post_id<>p_post_id or row.user_id<>p_user_id or row.not_eaten<>p_not_eaten then raise exception 'Photo already claimed' using errcode='22023';end if;
  return row;
 end if;
 if current_status<>'ready' then raise exception 'Wait for this meal to be ready' using errcode='55000';end if;
 if p_not_eaten is null then raise exception 'Photo type required' using errcode='22023';end if;
 if p_stage_path !~ ('^'||p_user_id::text||'/[0-9a-f-]{36}/0[.]jpg$') then raise exception 'Invalid staged photo' using errcode='22023';end if;
 select * into stage_cleanup from public.jobs where kind='media_cleanup' and payload->>'owner_id'=p_user_id::text and payload->>'deleted_post_id'=split_part(p_stage_path,'/',2) for update;
 if not found or stage_cleanup.status<>'queued' or stage_cleanup.run_after<=clock_timestamp() then raise exception 'Photo stage expired' using errcode='22023';end if;
 if not exists(select 1 from storage.objects where bucket_id='media' and name=p_stage_path) or not exists(select 1 from storage.objects where bucket_id='media' and name=replace(p_stage_path,'.jpg','.feed.jpg')) then raise exception 'Photo upload incomplete' using errcode='22023';end if;
 if p_not_eaten and (not exists(select 1 from public.post_media where post_id=p_post_id and kind='photo') or exists(select 1 from public.post_media where post_id=p_post_id and not_eaten)) then raise exception 'The first photo is the meal; only one later photo can be not eaten' using errcode='22023';end if;
 if (select count(*) from public.post_media where post_id=p_post_id and kind='photo')>=8 then raise exception 'A meal has at most eight photos' using errcode='22023';end if;
 select coalesce(max(position),-1)+1 into pos from (select position from public.post_media where post_id=p_post_id and kind='photo' union all select position from public.post_photo_attachments where post_id=p_post_id) positions;
 insert into public.post_photo_attachments(post_id,user_id,stage_path,target_path,position,not_eaten)
 values(p_post_id,p_user_id,p_stage_path,p_user_id::text||'/'||p_post_id::text||'/'||pos::text||'.jpg',pos,p_not_eaten) returning * into row;
 insert into public.jobs(post_id,kind,priority,status,run_after,payload) values(null,'media_cleanup',200,'queued',now()+interval '3 hours',jsonb_build_object('owner_id',p_user_id,'deleted_post_id',p_post_id,'paths',jsonb_build_array(row.target_path,replace(row.target_path,'.jpg','.feed.jpg')),'exact',true,'attachment_id',row.id)) returning id into cleanup;
 update public.post_photo_attachments set cleanup_job_id=cleanup where id=row.id returning * into row;
 return row;
end $$;
revoke all on function public.prepare_post_photo_attachment(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.prepare_post_photo_attachment(uuid,uuid,text,boolean) to service_role;

create function public.complete_post_photo_attachment(p_id uuid,p_user_id uuid,p_width integer,p_height integer)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare row public.post_photo_attachments; current_status text; photo uuid; cleanup public.jobs;
begin
 select * into row from public.post_photo_attachments where id=p_id and user_id=p_user_id;
 if not found then raise exception 'Photo not found' using errcode='42501';end if;
 select status into current_status from public.posts where id=row.post_id and user_id=p_user_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 select * into row from public.post_photo_attachments where id=p_id for update;
 if row.media_id is not null then return row.media_id;end if;
 if current_status<>'ready' then raise exception 'Wait for this meal to be ready' using errcode='55000';end if;
 select * into cleanup from public.jobs where id=row.cleanup_job_id for update;
 if not found or cleanup.status<>'queued' or cleanup.run_after<=clock_timestamp() then raise exception 'Photo stage expired' using errcode='22023';end if;
 if p_width is null or p_height is null or p_width not between 1 and 4096 or p_height not between 1 and 4096 then raise exception 'Invalid photo dimensions' using errcode='22023';end if;
 if not exists(select 1 from storage.objects where bucket_id='media' and name=row.target_path) or not exists(select 1 from storage.objects where bucket_id='media' and name=replace(row.target_path,'.jpg','.feed.jpg')) then raise exception 'Photo upload incomplete' using errcode='22023';end if;
 if row.not_eaten and (not exists(select 1 from public.post_media where post_id=row.post_id and kind='photo') or exists(select 1 from public.post_media where post_id=row.post_id and not_eaten)) then raise exception 'Only one later photo can be not eaten' using errcode='22023';end if;
 if (select count(*) from public.post_media where post_id=row.post_id and kind='photo')>=8 then raise exception 'A meal has at most eight photos' using errcode='22023';end if;
 update public.post_media set position=greatest(position,row.position)+1 where post_id=row.post_id and kind='card';
 insert into public.post_media(post_id,storage_path,position,width,height,kind,not_eaten) values(row.post_id,row.target_path,row.position,p_width,p_height,'photo',row.not_eaten) returning id into photo;
 update public.post_photo_attachments set media_id=photo where id=p_id;
 update public.posts set status='processing',fail_reason=null where id=row.post_id;
 insert into public.jobs(post_id,kind,priority,status,payload) values(row.post_id,case when row.not_eaten then 'remainder' else 'correct' end,100,'queued',case when row.not_eaten then jsonb_build_object('remainder_photo_id',photo) else jsonb_build_object('photo_added',true,'added_media_id',photo) end);
 return photo;
end $$;
revoke all on function public.complete_post_photo_attachment(uuid,uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.complete_post_photo_attachment(uuid,uuid,integer,integer) to service_role;

-- Photo corrections have no user comment cursor. Preserve the same compare-and-
-- swap, exact message-set and job-ownership checks without inventing user text.
create function public.persist_photo_correction(p_post_id uuid,p_job_id uuid,p_expected uuid[],p_items jsonb,p_reply text,p_question jsonb default null)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare job public.jobs; actual uuid[]; expected uuid[]; row jsonb; prior uuid; fresh uuid; applied uuid[]; pending uuid[]; seq bigint;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found or not public.post_work_matches(p_post_id,p_job_id) then raise exception 'Photo job no longer owns meal' using errcode='40001';end if;
 select * into job from public.jobs where id=p_job_id and post_id=p_post_id and kind='correct' and status='running' for update;
 if not found or not coalesce((job.payload->>'photo_added')::boolean,false) then raise exception 'Photo correction missing' using errcode='22023';end if;
 if coalesce((job.payload->>'correction_applied')::boolean,false) then return false;end if;
 select coalesce(max((payload->>'correction_sequence')::bigint),0) into seq from public.jobs where post_id=p_post_id and kind='correct' and payload->>'correction_applied'='true';
 if (job.payload->>'correction_from_sequence')::bigint is distinct from seq then raise exception 'Correction progress changed' using errcode='40001';end if;
 select coalesce(array_agg(distinct value::uuid),array[]::uuid[]) into applied from public.jobs j cross join lateral jsonb_array_elements_text(coalesce(j.payload->'correction_pending_ids','[]')) where j.post_id=p_post_id and j.kind='correct' and j.payload->>'correction_applied'='true';
 select coalesce(array_agg(value::uuid),array[]::uuid[]) into pending from jsonb_array_elements_text(coalesce(job.payload->'correction_pending_ids','[]'));
 if pending && applied or exists(select 1 from unnest(pending) pending_id where not exists(select 1 from public.post_comments where id=pending_id and post_id=p_post_id and author='user')) then raise exception 'Correction messages changed' using errcode='40001';end if;
 select array_agg(id order by id) into actual from public.current_post_items where post_id=p_post_id;
 select array_agg(id order by id) into expected from unnest(p_expected) id;
 if actual is distinct from expected then raise exception 'Items changed during photo correction' using errcode='40001';end if;
 if jsonb_typeof(p_items)<>'array' or char_length(btrim(p_reply))=0 then raise exception 'Invalid correction' using errcode='22023';end if;
 update public.post_items set superseded_at=now() where post_id=p_post_id and superseded_at is null;
 for row in select value from jsonb_array_elements(p_items) loop
  prior:=nullif(row->>'supersedes','')::uuid;
  if prior is not null and not(prior=any(coalesce(p_expected,array[]::uuid[]))) then raise exception 'Invalid source item' using errcode='22023';end if;
  insert into public.post_items(post_id,name,portion_text,portion_grams,box,mask_path,source,supersedes) values(p_post_id,row->>'name',row->>'portion_text',(row->>'portion_grams')::numeric,nullif(row->'box','null'::jsonb),row->>'mask_path','model',prior) returning id into fresh;
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref) values(fresh,(row#>>'{nutrition,calories}')::numeric,(row#>>'{nutrition,protein_g}')::numeric,(row#>>'{nutrition,carbs_g}')::numeric,(row#>>'{nutrition,fat_g}')::numeric,(row#>>'{nutrition,fibre_g}')::numeric,(row#>>'{nutrition,sugar_g}')::numeric,(row#>>'{nutrition,sodium_mg}')::numeric,coalesce(row#>'{nutrition,micronutrients}','[]'),row#>>'{nutrition,source_ref}');
 end loop;
 insert into public.post_comments(post_id,author,body) values(p_post_id,'model',coalesce(p_question->>'question',p_reply));
 update public.jobs set payload=payload||jsonb_build_object('correction_applied',true,'correction_sequence',seq+1,'correction_pending_ids',to_jsonb(pending)) where id=p_job_id;
 update public.posts set status=case when p_question is null then 'processing' else 'needs_input' end,needs_input=p_question,fail_reason=null where id=p_post_id;
 if exists(select 1 from public.post_comments where post_id=p_post_id and author='user' and not(id=any(applied||pending))) then
  insert into public.jobs(post_id,kind,priority,status) select p_post_id,'correct',100,'queued' where not exists(select 1 from public.jobs where post_id=p_post_id and kind='correct' and status='queued');
  update public.posts set status='queued',needs_input=null where id=p_post_id;
 end if;
 return true;
end $$;
revoke all on function public.persist_photo_correction(uuid,uuid,uuid[],jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.persist_photo_correction(uuid,uuid,uuid[],jsonb,text,jsonb) to service_role;
