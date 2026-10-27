-- New workers opt into execution ownership; legacy claim callers remain usable
-- while this migration is installed before the application deployment.
alter table public.posts add column active_job_id uuid;
create function public.protect_post_job_owner() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if current_user in ('authenticated','anon') and
   ((tg_op='INSERT' and new.active_job_id is not null) or (tg_op='UPDATE' and new.active_job_id is distinct from old.active_job_id)) then
  raise exception 'Job ownership is server managed' using errcode='42501';end if;
 return new;
end $$;
create trigger protect_post_job_owner before insert or update of active_job_id on public.posts for each row execute function public.protect_post_job_owner();

create function public.claim_post_job(p_now timestamptz,p_owned boolean) returns public.jobs
language plpgsql security definer set search_path=public,pg_temp as $$
declare candidate public.jobs; skipped uuid[]:=array[]::uuid[]; post_found uuid;
begin
 loop
  select * into candidate from public.jobs j where j.status='queued' and j.run_after<=p_now and not(j.id=any(skipped))
   order by j.priority,j.created_at,j.id limit 1 for update skip locked;
  if not found then return null;end if;
  if candidate.post_id is not null and candidate.kind in ('analyze','correct','recompute','card_backfill','test_noop','test_throw') then
   select id into post_found from public.posts where id=candidate.post_id for update skip locked;
   if not found then skipped:=array_append(skipped,candidate.id);continue;end if;
   -- Primary work regenerates its card on completion. Retire obsolete backfill
   -- instead of leaving a due, permanently ineligible job waking the worker.
   if candidate.kind='card_backfill' and (not exists(select 1 from public.posts where id=candidate.post_id and status='ready') or exists(select 1 from public.jobs where post_id=candidate.post_id and kind in ('analyze','correct','recompute') and status in ('queued','running'))) then
    update public.jobs set status='finished',finished_at=p_now,error=null,
     payload=payload||jsonb_build_object('skipped_reason','superseded by current meal state') where id=candidate.id;
    continue;end if;
   -- Recheck after locking the post: two lanes may have seen no running job.
   if exists(select 1 from public.jobs where post_id=candidate.post_id and status='running' and kind in ('analyze','correct','recompute','card_backfill','test_noop','test_throw')) then
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
revoke all on function public.claim_post_job(timestamptz,boolean) from public,anon,authenticated,service_role;
create or replace function public.claim_job(p_now timestamptz default now()) returns public.jobs
language sql security definer set search_path=public,pg_temp as $$ select public.claim_post_job(p_now,false) $$;
create function public.claim_owned_job(p_now timestamptz default now()) returns public.jobs
language sql security definer set search_path=public,pg_temp as $$ select public.claim_post_job(p_now,true) $$;
revoke all on function public.claim_owned_job(timestamptz) from public,anon,authenticated;
grant execute on function public.claim_owned_job(timestamptz) to service_role;

create function public.post_work_matches(p_post_id uuid,p_job_id uuid) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce((select case when p_job_id is not null then exists(
  select 1 from public.jobs j where j.id=p_job_id and j.post_id=p.id and j.status='running' and j.kind in ('analyze','correct','recompute','card_backfill','test_noop','test_throw')
  and (p.active_job_id=p_job_id or (p.active_job_id is null and not coalesce((j.payload->>'post_ownership')::boolean,false))))
 else p.active_job_id is null and (p.status='ready' or exists(select 1 from public.jobs j where j.post_id=p.id and j.status='running'
  and j.kind in ('analyze','correct','recompute','card_backfill','test_noop','test_throw') and not coalesce((j.payload->>'post_ownership')::boolean,false))) end
 from public.posts p where p.id=p_post_id),false)
$$;
revoke all on function public.post_work_matches(uuid,uuid) from public,anon,authenticated;
grant execute on function public.post_work_matches(uuid,uuid) to service_role;

create or replace function public.fail_job(p_job_id uuid,p_message text,p_retriable boolean) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_job public.jobs; owns boolean; initial_post_id uuid;
begin
 -- Match discard/edit/publication lock order: post before job. A discard may
 -- delete the job while this waits; that is already a terminal outcome.
 select post_id into initial_post_id from public.jobs where id=p_job_id;
 if not found then return;end if;
 if initial_post_id is not null then perform 1 from public.posts where id=initial_post_id for update;end if;
 select * into v_job from public.jobs where id=p_job_id for update;
 if not found then return;end if;
 if v_job.post_id is distinct from initial_post_id then raise exception 'Job post changed' using errcode='40001';end if;
 if v_job.status<>'running' then raise exception 'fail_job requires a running job';end if;
 owns:=public.post_work_matches(v_job.post_id,case when coalesce((v_job.payload->>'post_ownership')::boolean,false) then v_job.id else null end);
 if not p_retriable or v_job.attempts>=3 then
  update public.jobs set status='error',finished_at=clock_timestamp(),error=p_message where id=p_job_id;
  if owns and v_job.kind<>'card_backfill' then
   update public.posts set status='failed',fail_reason=split_part(p_message,E'\n',1) where id=v_job.post_id;
  end if;
 else
  update public.jobs set status='queued',finished_at=null,error=p_message,
   run_after=clock_timestamp()+interval '30 seconds'*power(2,v_job.attempts-1) where id=p_job_id;
 end if;
end $$;

-- The tick route and verified deployment limit are 300 seconds. A further
-- 60-second grace avoids treating the last request's teardown as abandonment.
-- Recovery runs only after exclusive acquisition of an expired/unheld lease.
create function public.recover_abandoned_jobs(p_now timestamptz) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare candidate public.jobs; current_job public.jobs; owns boolean;
begin
 for candidate in select * from public.jobs where status='running'
  and coalesce(started_at,created_at)<=p_now-interval '360 seconds' order by started_at,id
 loop
  if candidate.post_id is not null then
   perform 1 from public.posts where id=candidate.post_id for update skip locked;
   if not found then continue;end if;
  end if;
  select * into current_job from public.jobs where id=candidate.id for update skip locked;
  if not found or current_job.status<>'running' or current_job.post_id is distinct from candidate.post_id
   or coalesce(current_job.started_at,current_job.created_at)>p_now-interval '360 seconds' then continue;end if;
  owns:=current_job.post_id is null or public.post_work_matches(current_job.post_id,
   case when coalesce((current_job.payload->>'post_ownership')::boolean,false) then current_job.id else null end);
  -- A stale predecessor is terminal; only its current owner may retry. fail_job
  -- preserves the three-attempt ceiling and never fails a newer meal owner.
  perform public.fail_job(current_job.id,'Worker execution expired before completion',owns);
 end loop;
end $$;
revoke all on function public.recover_abandoned_jobs(timestamptz) from public,anon,authenticated,service_role;

create or replace function public.try_acquire_worker_lease(p_holder text,ttl_seconds int default 300)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare lease public.worker_lease; v_now timestamptz:=clock_timestamp();
begin
 insert into public.worker_lease(id)values(1)on conflict(id)do nothing;
 select * into lease from public.worker_lease where id=1 for update;
 if lease.expires_at>v_now then
  if lease.holder is distinct from p_holder then return false;end if;
  update public.worker_lease set expires_at=v_now+make_interval(secs=>ttl_seconds) where id=1;
  return true;
 end if;
 -- While this row is locked no other caller can acquire a live worker lease.
 perform public.recover_abandoned_jobs(v_now);
 update public.worker_lease set holder=p_holder,expires_at=v_now+make_interval(secs=>ttl_seconds)where id=1;
 return true;
end $$;
revoke all on function public.try_acquire_worker_lease(text,int) from public,anon,authenticated;
grant execute on function public.try_acquire_worker_lease(text,int) to service_role;
revoke all on function public.release_worker_lease(text) from public,anon,authenticated;
grant execute on function public.release_worker_lease(text) to service_role;

-- Include orphaned running work even without a successor. A queued meal waits
-- until its running owner can be recovered rather than self-ticking at zero delay.
create function public.next_worker_wake() returns timestamptz
language sql stable security definer set search_path=public,pg_temp as $$
 select case when min(wake_at) is null then null else greatest(min(wake_at),
  (select expires_at from public.worker_lease where id=1)) end from (
  select greatest(j.run_after,coalesce((select max(coalesce(r.started_at,r.created_at)+interval '360 seconds')
   from public.jobs r where r.post_id=j.post_id and r.status='running'
    and r.kind in ('analyze','correct','recompute','card_backfill','test_noop','test_throw')),j.run_after)) as wake_at
   from public.jobs j where j.status='queued'
  union all
  select coalesce(started_at,created_at)+interval '360 seconds' from public.jobs where status='running'
 ) wakes
$$;
revoke all on function public.next_worker_wake() from public,anon,authenticated;
grant execute on function public.next_worker_wake() to service_role;

-- Hold ownership across initial persistence as well as publication. Existing
-- legacy persistence RPCs remain callable for migration-before-merge workers.
create function public.persist_owned_analysis(p_post_id uuid,p_job_id uuid,p_items jsonb,p_summary text,p_needs_input jsonb default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not public.post_work_matches(p_post_id,p_job_id) then raise exception 'Analysis job no longer owns this meal' using errcode='40001';end if;
 if p_needs_input is null then perform public.persist_analysis(p_post_id,p_items,p_summary);
 else perform public.persist_analysis_question(p_post_id,p_items,p_summary,p_needs_input);end if;
end $$;
revoke all on function public.persist_owned_analysis(uuid,uuid,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.persist_owned_analysis(uuid,uuid,jsonb,text,jsonb) to service_role;

-- Apply after 0007 and before 0008. Users can append only their own words.
drop policy if exists post_comments_owner_insert on public.post_comments;
create policy post_comments_owner_insert on public.post_comments for insert to authenticated with check (
  author = 'user' and exists(select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid())
);
revoke update, delete on public.post_comments from authenticated;

create or replace function public.append_post_comment(p_post_id uuid,p_user_id uuid,p_text text)
returns public.post_comments language plpgsql security definer set search_path=public,pg_temp as $$
declare result public.post_comments;
begin
 perform 1 from public.posts where id=p_post_id and user_id=p_user_id for update;
 if not found then raise exception 'Post not found' using errcode='42501'; end if;
 if p_text is null or length(btrim(p_text))=0 or length(p_text)>4000 then raise exception 'Invalid comment' using errcode='22023'; end if;
 insert into public.post_comments(post_id,author,body) values(p_post_id,'user',btrim(p_text)) returning * into result;
 insert into public.jobs(post_id,kind,priority,status)
 select p_post_id,'correct',100,'queued' where not exists (
  select 1 from public.jobs where post_id=p_post_id and kind='correct' and
   (status='queued' or (status='running' and not coalesce((payload->>'correction_applied')::boolean,false)))
 );
 update public.posts set status='queued',fail_reason=null where id=p_post_id;
 return result;
end;
$$;
revoke all on function public.append_post_comment(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.append_post_comment(uuid,uuid,text) to service_role;

-- Preserve the original estimates, revision and reply in one transaction.
-- Expected IDs protect a manual edit made while the model was answering.
create or replace function public.persist_correction(p_post_id uuid,p_job_id uuid,p_expected uuid[],p_through uuid,p_items jsonb,p_reply text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare expected uuid[]; actual uuid[]; row jsonb; new_id uuid; prior uuid;
  v_payload jsonb; v_sequence bigint; v_applied uuid[]; v_pending uuid[];
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post missing' using errcode='42501'; end if;
 if not public.post_work_matches(p_post_id,p_job_id) then raise exception 'Correction job no longer owns this meal' using errcode='40001';end if;
 if exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id and coalesce((payload->>'correction_applied')::boolean,false)) then return false; end if;
 if not exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id and kind='correct' and status='running') then raise exception 'Correction job missing' using errcode='22023'; end if;
 select payload into v_payload from public.jobs where id=p_job_id;
 select coalesce(max((payload->>'correction_sequence')::bigint),0) into v_sequence
   from public.jobs where post_id=p_post_id and kind='correct' and payload->>'correction_applied'='true';
 if v_payload ? 'correction_from_sequence' and (v_payload->>'correction_from_sequence')::bigint is distinct from v_sequence then
   raise exception 'Correction progress changed during the model call' using errcode='40001';
 end if;
 select coalesce(array_agg(distinct value::uuid),array[]::uuid[]) into v_applied
   from public.jobs j cross join lateral jsonb_array_elements_text(coalesce(j.payload->'correction_pending_ids','[]'::jsonb))
   where j.post_id=p_post_id and j.kind='correct' and j.payload->>'correction_applied'='true';
 if v_payload ? 'correction_pending_ids' then
   select array_agg(value::uuid) into v_pending from jsonb_array_elements_text(v_payload->'correction_pending_ids');
 else
   -- Backward-compatible callers (including the question wrapper) retain the
   -- six-argument RPC. New workers always record their exact pending set.
   select array_agg(c.id order by c.created_at,c.id) into v_pending from public.post_comments c
     join public.post_comments last_comment on last_comment.id=p_through
     where c.post_id=p_post_id and c.author='user' and (c.created_at,c.id)<=(last_comment.created_at,last_comment.id)
       and not(c.id=any(v_applied));
 end if;
 if coalesce(cardinality(v_pending),0)=0 or not(p_through=any(v_pending)) or v_pending && v_applied then
   raise exception 'Correction message range is stale' using errcode='40001';
 end if;
 if exists(select 1 from unnest(v_pending) as pending(id) where not exists(select 1 from public.post_comments c where c.id=pending.id and c.post_id=p_post_id and c.author='user')) then
   raise exception 'Correction message does not belong to post' using errcode='22023';
 end if;
 select array_agg(id order by id) into actual from public.current_post_items where post_id=p_post_id;
 select array_agg(id order by id) into expected from unnest(p_expected) id;
 if actual is distinct from expected then raise exception 'Items changed during correction' using errcode='40001'; end if;
 if not exists(select 1 from public.post_comments where id=p_through and post_id=p_post_id and author='user') then raise exception 'Comment missing' using errcode='22023'; end if;
 if jsonb_typeof(p_items)<>'array' or length(btrim(p_reply))=0 then raise exception 'Invalid correction' using errcode='22023'; end if;
 update public.post_items set superseded_at=now() where post_id=p_post_id and superseded_at is null;
 for row in select value from jsonb_array_elements(p_items) loop
  prior := nullif(row->>'supersedes','')::uuid;
  if prior is not null and not (prior=any(coalesce(p_expected,array[]::uuid[]))) then raise exception 'Invalid prior item' using errcode='22023'; end if;
  insert into public.post_items(post_id,name,portion_text,portion_grams,box,mask_path,source,supersedes)
  values(p_post_id,row->>'name',row->>'portion_text',(row->>'portion_grams')::numeric,nullif(row->'box','null'::jsonb),row->>'mask_path','model',prior) returning id into new_id;
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref)
  values(new_id,(row#>>'{nutrition,calories}')::numeric,(row#>>'{nutrition,protein_g}')::numeric,(row#>>'{nutrition,carbs_g}')::numeric,(row#>>'{nutrition,fat_g}')::numeric,
   (row#>>'{nutrition,fibre_g}')::numeric,(row#>>'{nutrition,sugar_g}')::numeric,(row#>>'{nutrition,sodium_mg}')::numeric,coalesce(row#>'{nutrition,micronutrients}','[]'::jsonb),row#>>'{nutrition,source_ref}');
 end loop;
 insert into public.post_comments(post_id,author,body) values(p_post_id,'model',p_reply);
 update public.jobs set payload=payload||jsonb_build_object('correction_applied',true,'correction_sequence',v_sequence+1,
   'correction_through',p_through,'correction_pending_ids',to_jsonb(v_pending)) where id=p_job_id;
 -- A newly committed correction supersedes an earlier recompute failure.
 -- Idempotent replays return above, so an old completion cannot clear a newer failure.
 update public.posts set status='processing',fail_reason=null where id=p_post_id;
 if exists(select 1 from public.post_comments where post_id=p_post_id and author='user' and not(id=any(v_applied||v_pending))) then
  insert into public.jobs(post_id,kind,priority,status) select p_post_id,'correct',100,'queued'
   where not exists(select 1 from public.jobs where post_id=p_post_id and kind='correct' and status='queued');
  update public.posts set status='queued' where id=p_post_id;
 end if;
 return true;
end;
$$;
revoke all on function public.persist_correction(uuid,uuid,uuid[],uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.persist_correction(uuid,uuid,uuid[],uuid,jsonb,text) to service_role;

-- Scheduling belongs with the correction handler, not the earlier item-edit
-- migration. Recover comments that waited through a failed initial analysis.
create function public.resume_initial_comments() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.jobs(post_id,kind,priority,status)
 select new.id,'correct',100,'queued'
 where exists(select 1 from public.post_comments where post_id=new.id and author='user')
   and not exists(select 1 from public.jobs where post_id=new.id and kind='correct' and status in ('queued','running'));
 if exists(select 1 from public.jobs where post_id=new.id and kind='correct' and status in ('queued','running')
   and not coalesce((payload->>'correction_applied')::boolean,false)) then
  update public.posts set status='queued' where id=new.id;
 end if;
 return new;
end $$;
create trigger resume_comments_after_initial_analysis after update of analysis_initialized_at on public.posts
 for each row when(old.analysis_initialized_at is null and new.analysis_initialized_at is not null)
 execute function public.resume_initial_comments();

-- Standalone thread completion must respect follow-up work too. The later
-- stored-card publication guard keeps the same invariant.
create function public.mark_post_ready(p_post_id uuid,p_job_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare current_status text;
begin
 select status into current_status from public.posts where id=p_post_id for update;
 if not found or current_status in ('failed','needs_input') or not public.post_work_matches(p_post_id,p_job_id) then return false;end if;
 if exists(select 1 from public.jobs where post_id=p_post_id and kind='correct' and status in ('queued','running')
   and not coalesce((payload->>'correction_applied')::boolean,false)) then
  update public.posts set status=case when status in ('processing','needs_input') then status else 'queued' end where id=p_post_id;
  return false;end if;
 if exists(select 1 from public.current_post_items i left join public.item_nutrition n on n.post_item_id=i.id
   where i.post_id=p_post_id and n.post_item_id is null) then return false;end if;
 update public.posts set status='ready',fail_reason=null where id=p_post_id;
 return true;
end $$;
create or replace function public.mark_post_ready(p_post_id uuid) returns boolean language sql security definer set search_path=public,pg_temp as $$ select public.mark_post_ready(p_post_id,null) $$;
revoke all on function public.mark_post_ready(uuid,uuid) from public,anon,authenticated;
grant execute on function public.mark_post_ready(uuid,uuid) to service_role;
revoke all on function public.mark_post_ready(uuid) from public,anon,authenticated;
grant execute on function public.mark_post_ready(uuid) to service_role;

-- A fresh retry can find no pending messages. Serialize its completion with
-- append_post_comment so a message arriving after the read always gets work.
create function public.complete_empty_correction(p_post_id uuid,p_job_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare applied uuid[]; sequence bigint;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post missing' using errcode='42501';end if;
 if not public.post_work_matches(p_post_id,p_job_id) then raise exception 'Correction job no longer owns this meal' using errcode='40001';end if;
 if not exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id and kind='correct' and status='running') then
  raise exception 'Correction job missing' using errcode='22023';end if;
 select coalesce(array_agg(distinct value::uuid),array[]::uuid[]) into applied
 from public.jobs j cross join lateral jsonb_array_elements_text(coalesce(j.payload->'correction_pending_ids','[]'::jsonb))
 where j.post_id=p_post_id and j.kind='correct' and j.payload->>'correction_applied'='true';
 if exists(select 1 from public.post_comments where post_id=p_post_id and author='user' and not(id=any(applied))) then return false;end if;
 select coalesce(max((payload->>'correction_sequence')::bigint),0) into sequence from public.jobs
 where post_id=p_post_id and kind='correct' and payload->>'correction_applied'='true';
 update public.jobs set payload=payload||jsonb_build_object('correction_applied',true,'correction_sequence',sequence,'correction_pending_ids','[]'::jsonb)
 where id=p_job_id;
 return true;
end $$;
revoke all on function public.complete_empty_correction(uuid,uuid) from public,anon,authenticated;
grant execute on function public.complete_empty_correction(uuid,uuid) to service_role;
