// SUPABASE_DB_URL=<isolated migrated database> node --test tests/db/lease-renew.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('live renewal extends the lease past its original expiry and rejects wrong/expired owners',()=>{
 assert.ok(process.env.SUPABASE_DB_URL,'SUPABASE_DB_URL is required');
 const sql=`
 begin;
 set local lock_timeout='5s';set local statement_timeout='20s';
 lock table public.worker_lease in exclusive mode;
 insert into public.worker_lease(id,holder,expires_at) values(1,'run7-renew-fixture',clock_timestamp()+interval '2 seconds')
 on conflict(id) do update set holder=excluded.holder,expires_at=excluded.expires_at;
 do $test$ begin
  if public.renew_worker_lease('other-holder',10) then raise exception 'Other holder renewed';end if;
  if not public.renew_worker_lease('run7-renew-fixture',10) then raise exception 'Renewal failed';end if;
 end $test$;
 select pg_sleep(3);
 do $test$ begin
  if public.try_acquire_worker_lease('other-holder',2) then raise exception 'Renewed lease was stolen';end if;
  update public.worker_lease set expires_at=clock_timestamp()-interval '1 second' where id=1;
  if public.renew_worker_lease('run7-renew-fixture',10) then raise exception 'Expired lease was resurrected';end if;
  if has_function_privilege('authenticated','public.renew_worker_lease(text,integer)','execute') or
     has_function_privilege('anon','public.renew_worker_lease(text,integer)','execute') then raise exception 'Client can renew';end if;
  if not has_function_privilege('service_role','public.renew_worker_lease(text,integer)','execute') then raise exception 'Service cannot renew';end if;
 end $test$;
 select 'lease-renew: passed';rollback;`;
 const run=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL,'-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',timeout:25000});
 assert.ifError(run.error);assert.equal(run.status,0,run.stderr);assert.match(run.stdout,/lease-renew: passed/);
});

test('rate-limit requeue preserves Retry-After and does not consume a failed attempt',()=>{
 const sql=`begin;
 do $test$ declare job_id uuid; retry_time timestamptz:=clock_timestamp()+interval '120 seconds';stored public.jobs;
 begin
  insert into public.jobs(kind,status,attempts) values('test_noop','running',3) returning id into job_id;
  perform public.requeue_rate_limited_job(job_id,retry_time,'fdc: rate limited');
  select * into stored from public.jobs where id=job_id;
  if stored.status<>'queued' or stored.attempts<>2 or stored.run_after<retry_time then raise exception 'Retry time or attempt changed';end if;
  if has_function_privilege('authenticated','public.requeue_rate_limited_job(uuid,timestamptz,text)','execute') or
     has_function_privilege('anon','public.requeue_rate_limited_job(uuid,timestamptz,text)','execute') then raise exception 'Client can requeue';end if;
 end $test$;select 'rate-limit-requeue: passed';rollback;`;
 const run=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL,'-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',timeout:10000});
 assert.ifError(run.error);assert.equal(run.status,0,run.stderr);assert.match(run.stdout,/rate-limit-requeue: passed/);
});

test('a superseded job cannot requeue itself over newer post work',()=>{
 const sql=`begin;
 do $test$ declare owner_id uuid:=gen_random_uuid();post_id uuid;old_job uuid;new_job uuid;stored public.jobs;retry_time timestamptz:=clock_timestamp()+interval '120 seconds';
 begin
  insert into auth.users(id) values(owner_id);
  insert into public.profiles(id,handle) values(owner_id,'lease-fixture-'||owner_id::text);
  insert into public.posts(user_id,status) values(owner_id,'processing') returning id into post_id;
  insert into public.jobs(post_id,kind,status,attempts,payload) values(post_id,'analyze','running',1,'{"post_ownership":true}') returning id into old_job;
  insert into public.jobs(post_id,kind,status,attempts,payload) values(post_id,'analyze','running',1,'{"post_ownership":true}') returning id into new_job;
  update public.jobs set priority=-32768 where id=new_job;
  update public.posts set active_job_id=new_job where id=post_id;
  perform public.requeue_rate_limited_job(old_job,retry_time,'fdc: rate limited');
  select * into stored from public.jobs where id=old_job;
  if stored.status<>'finished' then raise exception 'Stale job was requeued';end if;
  if (select fail_reason from public.posts where id=post_id) is not null then raise exception 'Stale job changed public waiting state';end if;
  if (select active_job_id from public.posts where id=post_id) is distinct from new_job then raise exception 'New work ownership changed';end if;
  perform public.requeue_rate_limited_job(new_job,retry_time,'fdc: rate limited');
  select * into stored from public.jobs where id=new_job;
  if stored.status<>'queued' or stored.run_after<retry_time or stored.attempts<>0 then raise exception 'Owned job did not preserve retry';end if;
  if (select fail_reason from public.posts where id=post_id) is distinct from 'fdc: rate limited' then raise exception 'Safe waiting marker missing';end if;
  perform public.claim_owned_job(retry_time+interval '1 second');
  if (select fail_reason from public.posts where id=post_id) is not null then raise exception 'Claim did not clear waiting marker';end if;
  update public.jobs set status='finished' where id=new_job;
  update public.posts set status='ready',active_job_id=null where id=post_id;
  insert into public.jobs(post_id,kind,status,attempts,payload) values(post_id,'card_backfill','running',1,'{"post_ownership":false}') returning id into new_job;
  perform public.requeue_rate_limited_job(new_job,retry_time,'fdc: private diagnostic');
  if (select fail_reason from public.posts where id=post_id) is not null then raise exception 'Card backfill changed public waiting state';end if;
 end $test$;select 'rate-limit-ownership: passed';rollback;`;
 const run=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL,'-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',timeout:10000});
 assert.ifError(run.error);assert.equal(run.status,0,run.stderr);assert.match(run.stdout,/rate-limit-ownership: passed/);
});
