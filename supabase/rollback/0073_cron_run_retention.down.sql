-- Stops future cleanup; deleted run details cannot be restored. Preserve their audit counts.
do $$ declare v_job bigint; begin
  if to_regclass('cron.job') is not null then
    for v_job in select jobid from cron.job where jobname = 'retention-cron-runs' loop
      perform cron.unschedule(v_job);
    end loop;
  end if;
end $$;
drop function if exists public.retention_cron_runs_batch(integer);
drop function if exists public.retention_cron_runs_dry_run(timestamptz);
-- Keep the ledger's cron table-name allowance for historical counts.
