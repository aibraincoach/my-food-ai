// Isolated local PostgreSQL: real concurrent sessions, no production changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
const bin=process.env.TEST_PG_BIN??'/usr/pgsql-17/bin';
const migration=name=>readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8');
test('claims serialize one meal, parallelize different meals and retain completion ownership',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'mfa-ownership-'));const data=join(dir,'data');let started=false;
 const run=(command,args,options={})=>{const r=spawnSync(command,args,{encoding:'utf8',...options});assert.ifError(r.error);assert.equal(r.status,0,r.stderr||r.stdout);return r.stdout;};
 const env={...process.env,PGHOST:dir,PGPORT:'5432',PGDATABASE:'postgres'};
 const sql=text=>run(join(bin,'psql'),['-X','-qAt','-v','ON_ERROR_STOP=1'],{env,input:text});
 try{
  run(join(bin,'initdb'),['-D',data,'-A','trust','--no-locale']);
  run(join(bin,'pg_ctl'),['-D',data,'-l',join(dir,'postgres.log'),'-o',`-k ${dir} -h '' -p 5432`,'-w','start']);started=true;
  sql(`create publication supabase_realtime;create role anon;create role authenticated;create role service_role bypassrls;
   create schema auth;create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
   create schema storage;create table storage.buckets(id text primary key,name text,public boolean);create table storage.objects(bucket_id text,name text);
   create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
  for(const name of ['0001_init.sql','0002_fdc_cache.sql','0003_pin_search_path.sql','0004_persist_analysis.sql','0005_jobs_retry.sql','0007_post_items_supersede.sql','0007b_comment_corrections.sql','0008_post_media_kind.sql'])sql(migration(name));
  sql(`grant usage on schema public,auth to authenticated;grant all on all tables in schema public to authenticated;`);
  const owner=sql('insert into auth.users values(gen_random_uuid())returning id;').trim();
  sql(`insert into profiles(id,handle)values('${owner}','ownership');`);
  const post=()=>sql(`insert into posts(user_id,status,analysis_initialized_at)values('${owner}','failed',now())returning id;`).trim();
  const a=post(),b=post();
  const job=(post,kind='recompute',priority=100)=>sql(`insert into jobs(post_id,kind,priority)values('${post}','${kind}',${priority})returning id;`).trim();
  const a1=job(a),a2=job(a),b1=job(b);
  // Lane one keeps its transaction open after claiming A. Lane two must skip
  // that locked post and claim B, not A's second job.
  const lane=spawn(join(bin,'psql'),['-X','-qAt','-v','ON_ERROR_STOP=1'],{env,stdio:['pipe','pipe','pipe']});
  let output='',errors='';lane.stdout.on('data',chunk=>{output+=chunk;});lane.stderr.on('data',chunk=>{errors+=chunk;});
  lane.stdin.write("begin;select (claim_owned_job()).id;select pg_sleep(1.5);commit;\n");lane.stdin.end();
  const deadline=Date.now()+5000;while(!output.includes(a1)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,10));
  assert.ok(output.includes(a1),errors||'first lane did not claim A');
  assert.equal(sql('select (claim_owned_job()).id;').trim(),b1);
  await new Promise((resolve,reject)=>lane.on('close',code=>code===0?resolve():reject(new Error(errors))));
  assert.equal(sql('select (claim_owned_job()).id;').trim(),'','A2 must remain queued while A1 runs');
  sql(`select fail_job('${a1}','old outage',false);`);
  assert.equal(sql(`select status from posts where id='${a}';`).trim(),'failed');
  assert.equal(sql('select (claim_owned_job()).id;').trim(),a2);
  assert.equal(sql(`select status||':'||coalesce(fail_reason,'') from posts where id='${a}';`).trim(),'processing:');
  assert.equal(sql(`select mark_post_ready('${a}','${a1}');`).trim(),'f');
  assert.equal(sql(`select mark_post_ready('${a}','${a2}');`).trim(),'t');
  sql(`update jobs set status='finished' where id='${a2}';`);
  assert.equal(sql(`select active_job_id from posts where id='${a}';`).trim(),a2);
  // Simulate a late callback from A after B is complete. Even if its job row
  // remains running, it no longer owns the meal and cannot alter post state.
  sql(`update jobs set status='running' where id='${a1}';select fail_job('${a1}','stale callback',false);`);
  assert.equal(sql(`select status from posts where id='${a}';`).trim(),'ready');
  assert.equal(sql(`select mark_post_ready('${a}','${a1}');`).trim(),'f');
  const publish=(post,jobId)=>sql(`select publish_results_card('${post}',results_card_snapshot('${post}')->>'fingerprint','${owner}/${post}/cards/fixture/card.png',1080,${jobId?`'${jobId}'`:'null'})->>'published';`).trim();
  assert.equal(publish(a,undefined),'false','retained finished owner requires a new maintenance claim');
  assert.equal(publish(a,a1),'false','old primary cannot publish after newer completion');
  const maintenance=job(a,'card_backfill');
  assert.equal(sql('select (claim_owned_job()).id;').trim(),maintenance);
  assert.equal(sql(`select post_work_matches('${a}','${maintenance}');`).trim(),'t');
  assert.equal(publish(a,maintenance),'true','actual claimed maintenance replaces finished owner and publishes');
  sql(`select fail_job('${maintenance}','card unavailable',false);`);
  assert.equal(sql(`select status from posts where id='${a}';`).trim(),'ready');
  const pending=job(a);const obsolete=job(a,'card_backfill',1);
  assert.equal(sql('select (claim_owned_job()).id;').trim(),pending,'queued primary blocks higher-priority maintenance');
  assert.equal(sql(`select status||':'||attempts from jobs where id='${obsolete}';`).trim(),'finished:0','obsolete maintenance must leave the due queue');
  const failedMeal=post(),failedCard=job(failedMeal,'card_backfill');
  assert.equal(sql('select (claim_owned_job()).id;').trim(),'');
  assert.equal(sql(`select status from jobs where id='${failedCard}';`).trim(),'finished');
  assert.equal(sql(`select status from posts where id='${failedMeal}';`).trim(),'failed');
  // Concurrent discard follows post -> cascade job order. Failure handling
  // must wait without holding the child job lock, then accept its deletion.
  const doomed=post(),doomedJob=job(doomed);
  assert.equal(sql('select (claim_owned_job()).id;').trim(),doomedJob);
  const discard=spawn(join(bin,'psql'),['-X','-qAt','-v','ON_ERROR_STOP=1'],{env,stdio:['pipe','pipe','pipe']});
  let discardOut='',discardErrors='';discard.stdout.on('data',chunk=>{discardOut+=chunk;});discard.stderr.on('data',chunk=>{discardErrors+=chunk;});
  const discarded=new Promise((resolve,reject)=>discard.on('close',code=>code===0?resolve():reject(new Error(discardErrors))));
  discard.stdin.end(`begin;set local statement_timeout='5s';select id from posts where id='${doomed}' for update;select pg_sleep(0.5);delete from posts where id='${doomed}';commit;`);
  const lockDeadline=Date.now()+5000;while(!discardOut.includes(doomed)&&Date.now()<lockDeadline)await new Promise(r=>setTimeout(r,10));
  assert.ok(discardOut.includes(doomed),'discard did not lock post');
  const failing=spawn(join(bin,'psql'),['-X','-qAt','-v','ON_ERROR_STOP=1'],{env,stdio:['pipe','pipe','pipe']});
  let failErrors='';failing.stderr.on('data',chunk=>{failErrors+=chunk;});
  const failed=new Promise((resolve,reject)=>failing.on('close',code=>code===0?resolve():reject(new Error(failErrors))));
  failing.stdin.end(`set statement_timeout='5s';select fail_job('${doomedJob}','interrupted analysis',false);`);
  await Promise.all([discarded,failed]);
  assert.equal(sql(`select count(*) from jobs where id='${doomedJob}';`).trim(),'0');
  // Detached cleanup jobs deliberately have no post to lock.
  const detached=sql("insert into jobs(kind,status,attempts)values('media_cleanup','running',1)returning id;").trim();
  sql(`select fail_job('${detached}','cleanup retry',true);`);
  assert.equal(sql(`select status from jobs where id='${detached}';`).trim(),'queued');
  sql(`delete from jobs where id='${detached}';`);
  // Old claim/one-argument publication remains valid during migration rollout.
  const legacyPost=post(),legacy=job(legacyPost);
  assert.equal(sql('select (claim_job()).id;').trim(),legacy);
  assert.equal(sql(`select active_job_id is null from posts where id='${legacyPost}';`).trim(),'t');
  assert.equal(sql(`select mark_post_ready('${legacyPost}');`).trim(),'t');
  sql(`update jobs set status='finished' where id='${legacy}';update posts set status='processing' where id='${legacyPost}';`);
  assert.equal(sql(`select mark_post_ready('${legacyPost}');`).trim(),'f','ownerless non-ready maintenance is refused');
  run(process.execPath,['--test',new URL('./supersede.test.mjs',import.meta.url).pathname],{env:{...env,SUPABASE_DB_URL:`postgresql:///postgres?host=${encodeURIComponent(dir)}`}});
  sql(`set role authenticated;select set_config('request.jwt.claims','{"sub":"${owner}"}',false);
   do $$begin begin update posts set active_job_id='${a1}' where id='${a}';raise exception 'owner forged';exception when insufficient_privilege then null;end;end$$;`);
  // Only an expired/unheld lease may recover timed-out executions. Fresh
  // work blocks its successor until the verified 300s limit plus 60s grace.
  sql('delete from jobs;');
  const orphanPost=post(),orphan=job(orphanPost);
  assert.equal(sql('select (claim_owned_job()).id;').trim(),orphan);
  assert.equal(sql("select next_worker_wake()>clock_timestamp()+interval '350 seconds';").trim(),'t','lone running work schedules recovery');
  const successor=job(orphanPost);
  assert.equal(sql("select next_worker_wake()>clock_timestamp()+interval '350 seconds';").trim(),'t','fresh running owner delays its queued successor');
  sql(`update jobs set started_at=clock_timestamp()-interval '361 seconds' where id='${orphan}';
   insert into worker_lease(id,holder,expires_at)values(1,'live-worker',clock_timestamp()+interval '60 seconds')
    on conflict(id)do update set holder=excluded.holder,expires_at=excluded.expires_at;`);
  assert.equal(sql("select try_acquire_worker_lease('other-worker');").trim(),'f');
  assert.equal(sql(`select status from jobs where id='${orphan}';`).trim(),'running','live lease prevents recovery even of old jobs');
  assert.equal(sql("select try_acquire_worker_lease('live-worker');").trim(),'t','holder may renew its own live lease');
  assert.equal(sql(`select status from jobs where id='${orphan}';`).trim(),'running');
  sql("update worker_lease set expires_at=clock_timestamp()-interval '1 second';");
  assert.equal(sql("select try_acquire_worker_lease('recovery-worker');").trim(),'t');
  assert.equal(sql(`select status||':'||attempts from jobs where id='${orphan}';`).trim(),'queued:1');
  assert.equal(sql(`select run_after>clock_timestamp() from jobs where id='${orphan}';`).trim(),'t');
  assert.equal(sql(`select mark_post_ready('${orphanPost}','${orphan}');`).trim(),'f','recovered execution can no longer publish');
  assert.equal(sql('select (claim_owned_job()).id;').trim(),successor,'a successor is no longer stranded');
  // Retire an abandoned stale predecessor without changing the newer owner.
  sql(`update jobs set status='running',started_at=clock_timestamp()-interval '361 seconds' where id='${orphan}';
   update worker_lease set expires_at=clock_timestamp()-interval '1 second';`);
  assert.equal(sql("select try_acquire_worker_lease('recovery-worker-2');").trim(),'t');
  assert.equal(sql(`select status from jobs where id='${orphan}';`).trim(),'error');
  assert.equal(sql(`select active_job_id from posts where id='${orphanPost}';`).trim(),successor);
  assert.equal(sql(`select status from posts where id='${orphanPost}';`).trim(),'processing');
  sql(`update jobs set attempts=3,started_at=clock_timestamp()-interval '361 seconds' where id='${successor}';
   update worker_lease set expires_at=clock_timestamp()-interval '1 second';`);
  assert.equal(sql("select try_acquire_worker_lease('recovery-worker-3');").trim(),'t');
  assert.equal(sql(`select status||':'||attempts from jobs where id='${successor}';`).trim(),'error:3');
  assert.equal(sql(`select status from posts where id='${orphanPost}';`).trim(),'failed','attempt ceiling still terminal');
  assert.equal(sql('select next_worker_wake() is null;').trim(),'t','no due work remains after terminal recovery');
 }finally{
  if(started)run(join(bin,'pg_ctl'),['-D',data,'-m','immediate','-w','stop']);rmSync(dir,{recursive:true,force:true});
 }
});
