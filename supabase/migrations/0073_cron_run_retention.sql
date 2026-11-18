-- #1121: administrator-only cron run retention. Installation neither schedules nor deletes.
-- Extend the existing audit ledger; counts remain after rollback because deletions cannot be undone.
alter table public.retention_summary drop constraint retention_summary_table_name_check;
alter table public.retention_summary add constraint retention_summary_table_name_check
  check (table_name in ('jobs', 'model_calls', 'cron.job_run_details'));

-- plpgsql defers resolution of pg_cron's table until execution (the local stack uses a stand-in).
create function public.retention_cron_runs_dry_run(p_now timestamptz default now())
returns table (rule text, kind text, day date, would_delete bigint)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  return query select 'older_7d'::text, coalesce(j.status, 'unknown'),
    (j.end_time at time zone 'UTC')::date, count(*)
    from cron.job_run_details j where j.end_time < p_now - interval '7 days'
    group by 2, 3 order by 3, 2;
end $$;

create function public.retention_cron_runs_batch(p_limit integer)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare v_deleted integer;
begin
  if p_limit is null or p_limit < 1 or p_limit > 5000 then
    raise exception 'Batch size must be 1 to 5000' using errcode = '22023';
  end if;
  with picked as (
    select j.runid from cron.job_run_details j
    where j.end_time < now() - interval '7 days'
    order by j.end_time, j.runid limit p_limit for update skip locked
  ), gone as (
    delete from cron.job_run_details j using picked p where j.runid = p.runid
    returning j.status, j.end_time
  ), counted as (
    insert into public.retention_summary (table_name, rule, day, kind, deleted)
    select 'cron.job_run_details', 'older_7d', (g.end_time at time zone 'UTC')::date,
      coalesce(g.status, 'unknown'), count(*) from gone g group by 3, 4
    returning deleted
  ) select coalesce(sum(deleted), 0) into v_deleted from counted;
  return v_deleted;
end $$;
revoke all on function public.retention_cron_runs_dry_run(timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.retention_cron_runs_batch(integer) from public, anon, authenticated, service_role;

alter function public.retention_cron_runs_dry_run(timestamptz) owner to postgres;
alter function public.retention_cron_runs_batch(integer) owner to postgres;
