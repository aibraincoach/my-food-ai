import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{spawnSync}from'node:child_process';
test('cron run retention counts without deleting, then removes bounded oldest batches and preserves recent or running rows',()=>{
 assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');assert.equal(new URL(process.env.SUPABASE_DB_URL).hostname,'127.0.0.1');
 const migration=readFileSync(new URL('../../supabase/migrations/0073_cron_run_retention.sql',import.meta.url),'utf8');
 const sql=`begin;set local lock_timeout='5s';set local statement_timeout='30s';
drop function if exists public.retention_cron_runs_batch(integer);drop function if exists public.retention_cron_runs_dry_run(timestamptz);
${migration}
insert into cron.job_run_details(jobid,runid,status,end_time)values(1,900000001,'succeeded',now()-interval '6 days'),(1,900000002,'failed',now()-interval '8 days'),(1,900000003,'succeeded',now()-interval '30 days'),(1,900000004,'running',null);
do $test$declare n integer;begin
 select coalesce(sum(would_delete),0) into n from public.retention_cron_runs_dry_run(now());if n<>2 then raise exception 'dry run expected 2, got %',n;end if;
 if (select count(*) from cron.job_run_details where runid between 900000001 and 900000004)<>4 then raise exception 'dry run deleted';end if;
 if public.retention_cron_runs_batch(1)<>1 then raise exception 'first batch';end if;
 if exists(select 1 from cron.job_run_details where runid=900000003) then raise exception 'oldest not first';end if;
 if public.retention_cron_runs_batch(1)<>1 or public.retention_cron_runs_batch(1)<>0 then raise exception 'bounded second batch';end if;
 if (select count(*) from cron.job_run_details where runid in(900000001,900000004))<>2 then raise exception 'recent/running row lost';end if;
 if (select sum(deleted) from public.retention_summary where table_name='cron.job_run_details')<>2 then raise exception 'audit missing';end if;
 if exists(select 1 from public.retention_summary where table_name='cron.job_run_details' and rule<>'older_7d') then raise exception 'wrong rule';end if;
 begin perform public.retention_cron_runs_batch(0);raise exception 'zero accepted';exception when invalid_parameter_value then null;end;
 begin perform public.retention_cron_runs_batch(5001);raise exception 'oversize accepted';exception when invalid_parameter_value then null;end;
 if has_function_privilege('anon','public.retention_cron_runs_batch(integer)','execute') or has_function_privilege('authenticated','public.retention_cron_runs_dry_run(timestamptz)','execute') or has_function_privilege('service_role','public.retention_cron_runs_batch(integer)','execute') then raise exception 'app role can run retention';end if;
end $test$;
rollback;`;
 const r=spawnSync('psql',['-X','-qAt','-v','ON_ERROR_STOP=1','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:40000});assert.ifError(r.error);assert.equal(r.status,0,r.stderr);
});
test('migration and rollback apply without a cron run table and preserve the audit ledger',()=>{
 assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');assert.equal(new URL(process.env.SUPABASE_DB_URL).hostname,'127.0.0.1');
 const migration=readFileSync(new URL('../../supabase/migrations/0073_cron_run_retention.sql',import.meta.url),'utf8');
 const undo=readFileSync(new URL('../../supabase/rollback/0073_cron_run_retention.down.sql',import.meta.url),'utf8');
 const sql=`begin;set local statement_timeout='30s';alter table cron.job_run_details rename to parked_run_details;
drop function if exists public.retention_cron_runs_batch(integer);drop function if exists public.retention_cron_runs_dry_run(timestamptz);
${migration}
insert into public.retention_summary(table_name,rule,day,kind,deleted)values('cron.job_run_details','older_7d',current_date,'failed',2);
${undo}
do $$begin
 if to_regprocedure('public.retention_cron_runs_batch(integer)') is not null or to_regprocedure('public.retention_cron_runs_dry_run(timestamptz)') is not null then raise exception 'rollback left functions';end if;
 if (select sum(deleted) from public.retention_summary where table_name='cron.job_run_details')<>2 then raise exception 'rollback lost audit';end if;
end $$;rollback;`;
 const r=spawnSync('psql',['-X','-qAt','-v','ON_ERROR_STOP=1','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:40000});assert.ifError(r.error);assert.equal(r.status,0,r.stderr);
});
