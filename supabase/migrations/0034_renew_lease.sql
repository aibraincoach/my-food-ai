-- Renew only a live lease already owned by this worker; never acquire/recover
-- unrelated work as a side effect of renewal.
create function public.renew_worker_lease(p_holder text, ttl_seconds int default 300)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare changed int;
begin
 if p_holder is null or length(p_holder)=0 or ttl_seconds is null or ttl_seconds<1 or ttl_seconds>3600 then
  raise exception 'Invalid worker lease renewal';
 end if;
 update public.worker_lease set expires_at=clock_timestamp()+make_interval(secs=>ttl_seconds)
  where id=1 and holder=p_holder and expires_at>clock_timestamp();
 get diagnostics changed=row_count;
 return changed=1;
end $$;
revoke all on function public.renew_worker_lease(text,int) from public,anon,authenticated;
grant execute on function public.renew_worker_lease(text,int) to service_role;

-- A provider-directed retry is not a failed job attempt. Preserve the same
-- post/job ownership check and post-before-job lock order used by fail_job.
create function public.requeue_rate_limited_job(p_job_id uuid,p_retry_at timestamptz,p_message text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare current_job public.jobs; initial_post_id uuid; owns boolean;
begin
 if p_retry_at is null then raise exception 'A retry time is required';end if;
 select post_id into initial_post_id from public.jobs where id=p_job_id;
 if not found then return;end if;
 if initial_post_id is not null then perform 1 from public.posts where id=initial_post_id for update;end if;
 select * into current_job from public.jobs where id=p_job_id for update;
 if not found then return;end if;
 if current_job.post_id is distinct from initial_post_id then raise exception 'Job post changed' using errcode='40001';end if;
 if current_job.status<>'running' then raise exception 'Requeue requires a running job';end if;
 owns:=public.post_work_matches(current_job.post_id,case when coalesce((current_job.payload->>'post_ownership')::boolean,false) then current_job.id else null end);
 if current_job.post_id is not null and not owns then
  update public.jobs set status='finished',finished_at=clock_timestamp(),error='Superseded rate-limited job' where id=p_job_id;
  return;
 end if;
 if owns and current_job.kind<>'card_backfill' then
  -- Fixed public state, never provider diagnostics. claim_post_job clears it
  -- when the deferred attempt actually becomes eligible and starts again.
  update public.posts set fail_reason='fdc: rate limited' where id=current_job.post_id;
 end if;
 update public.jobs set status='queued',started_at=null,finished_at=null,error=p_message,
  attempts=greatest(attempts-1,0),run_after=greatest(p_retry_at,clock_timestamp()+interval '1 second') where id=p_job_id;
end $$;
revoke all on function public.requeue_rate_limited_job(uuid,timestamptz,text) from public,anon,authenticated;
grant execute on function public.requeue_rate_limited_job(uuid,timestamptz,text) to service_role;
