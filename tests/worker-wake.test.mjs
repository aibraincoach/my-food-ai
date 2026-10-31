import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';

const pg='/usr/pgsql-17/bin/';
test('durable scheduler is dormant, due-only, repeatable and service-restricted', {skip:!existsSync(pg+'initdb')},()=>{
 const dir=mkdtempSync(join(tmpdir(),'mfa-worker-wake-'));
 let started=false;
 const run=(name,args,options={})=>execFileSync(pg+name,args,{encoding:'utf8',stdio:['pipe','pipe','pipe'],...options});
 try{
  run('initdb',['-D',join(dir,'data'),'--auth=trust','--no-locale']);
  run('pg_ctl',['-D',join(dir,'data'),'-l',join(dir,'server.log'),'-o',`-k ${dir} -h '' -p 56244`,'-w','start']);started=true;
  const migration=readFileSync(new URL('../supabase/migrations/0024_worker_wake.sql',import.meta.url),'utf8').replace(/^create extension.*;$/gm,'');
  // Only the transport and extension scheduler are fixtures. The deployed
  // configuration, authorization, due-work gate and installation SQL run intact.
  const fixture=`create role anon;create role authenticated;create role service_role;
   create schema net;create schema cron;create schema extensions;
   create table cron.job(jobid bigserial primary key,jobname text,schedule text,command text);
   create function cron.unschedule(bigint) returns boolean language sql as 'delete from cron.job where jobid=$1 returning true';
   create function cron.schedule(text,text,text) returns bigint language sql as 'insert into cron.job(jobname,schedule,command) values($1,$2,$3) returning jobid';
   create table public.mock_wake(due timestamptz);insert into public.mock_wake values(null);
   create function public.next_worker_wake() returns timestamptz language sql as 'select due from public.mock_wake';
   create table public.sent_requests(id bigserial, url text);
   create function net.http_get(url text,timeout_milliseconds integer) returns bigint language sql as 'insert into public.sent_requests(url) values($1) returning id';`;
  const sql=fixture+migration+`
   do $t$ begin
    if (select count(*) from cron.job where jobname='my-food-ai-worker-wake')<>1 then raise exception 'Schedule missing';end if;
    if public.wake_due_worker() is not null then raise exception 'Unconfigured scheduler sent traffic';end if;
    begin perform public.configure_worker_wake('http://invalid.test');raise exception 'Insecure URL accepted';exception when invalid_parameter_value then null;end;
    begin perform public.configure_worker_wake('https://invalid.test/path');raise exception 'Path accepted';exception when invalid_parameter_value then null;end;
   end $t$;
   select public.configure_worker_wake('https://deployment.test/');
   select public.configure_worker_wake('https://deployment.test');
   update public.mock_wake set due=now()+interval '3 hours';
   do $t$ begin if public.wake_due_worker() is not null then raise exception 'Future cleanup woke worker';end if;end $t$;
   update public.mock_wake set due=now()-interval '1 second';
   select public.wake_due_worker();select public.wake_due_worker();
   do $t$ begin
    if (select count(*) from public.sent_requests)<>2 then raise exception 'Lost handoff cannot be reawakened';end if;
    if exists(select 1 from public.sent_requests where url<>'https://deployment.test/api/jobs/tick') then raise exception 'Wrong target';end if;
    if (select count(*) from public.worker_wake_config)<>1 then raise exception 'Duplicate configuration';end if;
   end $t$;
   set role authenticated;
   do $t$ begin
    begin perform public.configure_worker_wake('https://attacker.test');raise exception 'Configuration exposed';exception when insufficient_privilege then null;end;
    begin perform public.wake_due_worker();raise exception 'Wake exposed';exception when insufficient_privilege then null;end;
   end $t$;reset role;
   delete from public.worker_wake_config;
   do $t$ begin if public.wake_due_worker() is not null then raise exception 'Disabled scheduler sent traffic';end if;end $t$;
   select 'worker wake assertions passed';`;
  const output=run('psql',['-h',dir,'-p','56244','-d','postgres','-v','ON_ERROR_STOP=1'],{input:sql});
  assert.match(output,/worker wake assertions passed/);
 }finally{
  if(started)run('pg_ctl',['-D',join(dir,'data'),'-m','immediate','-w','stop']);
  rmSync(dir,{recursive:true,force:true});
 }
});
