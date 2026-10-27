-- Backoff, classified failure, and server-only test-handler payloads.
alter table public.jobs add column run_after timestamptz not null default now();
alter table public.jobs add column payload jsonb not null default '{}';
alter table public.posts add column fail_reason text;
create index jobs_queued_run_after on public.jobs (run_after)
  where status = 'queued';

create or replace function public.claim_job(p_now timestamptz default now())
returns public.jobs language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_job public.jobs;
begin
  select * into v_job from public.jobs
  where status = 'queued' and run_after <= p_now
  order by priority asc, created_at asc, id asc
  limit 1 for update skip locked;
  if not found then return null; end if;
  update public.jobs set status = 'running', started_at = p_now,
    finished_at = null, attempts = attempts + 1 where id = v_job.id
  returning * into v_job;
  return v_job;
end $$;

-- Locking the row makes the job/post transition atomic. A stale failure
-- cannot overwrite a job which is no longer running.
create function public.fail_job(p_job_id uuid, p_message text, p_retriable boolean)
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_job public.jobs;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found or v_job.status <> 'running' then
    raise exception 'fail_job requires a running job';
  end if;
  if not p_retriable or v_job.attempts >= 3 then
    update public.jobs set status = 'error', finished_at = clock_timestamp(), error = p_message
      where id = p_job_id;
    update public.posts set status = 'failed', fail_reason = split_part(p_message, E'\n', 1)
      where id = v_job.post_id;
  else
    update public.jobs set status = 'queued', finished_at = null, error = p_message,
      run_after = clock_timestamp() + interval '30 seconds' * power(2, v_job.attempts - 1)
      where id = p_job_id;
  end if;
end $$;

-- RLS on jobs is not sufficient protection for SECURITY DEFINER functions.
revoke all on function public.claim_job(timestamptz) from public, anon, authenticated;
grant execute on function public.claim_job(timestamptz) to service_role;
revoke all on function public.fail_job(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.fail_job(uuid, text, boolean) to service_role;
