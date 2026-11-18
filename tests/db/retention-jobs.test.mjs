import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { parseArgs, run } from '../../scripts/retention/run.mjs';

// #1097: every keep rule and every delete rule, on the local throwaway database only.
const SETUP = `-- meals: a ready one, a failed one, and a meal working under an old job
insert into public.posts(id,user_id,caption,status,eaten_at) values
 ('00000000-0000-0000-0000-0000000000a1',(select id from public.profiles order by id limit 1),'ready meal','ready',now()-interval '90 days'),
 ('00000000-0000-0000-0000-0000000000a2',(select id from public.profiles order by id limit 1),'failed meal','failed',now()-interval '90 days'),
 ('00000000-0000-0000-0000-0000000000a3',(select id from public.profiles order by id limit 1),'working meal','processing',now()-interval '90 days');
insert into public.jobs(id,post_id,kind,status,finished_at,created_at,payload) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a1','analyze','finished',now()-interval '15 days',now()-interval '15 days','{}'),   -- delete: finished 15d
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000a1','analyze','finished',now()-interval '13 days',now()-interval '13 days','{}'),   -- keep: 13d
 ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000000a1','recompute','error',now()-interval '59 days',now()-interval '59 days','{}'),   -- keep: error 59d
 ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-0000000000a1','recompute','error',now()-interval '61 days',now()-interval '61 days','{}'),   -- delete: error 61d
 ('10000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-0000000000a1','correct','finished',now()-interval '90 days',now()-interval '90 days','{"correction_applied":true,"correction_sequence":1}'), -- keep: applied correction
 ('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-0000000000a1','correct','finished',now()-interval '90 days',now()-interval '90 days','{"needs_input_question":true}'), -- keep: question
 ('10000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-0000000000a1','correct','finished',now()-interval '90 days',now()-interval '90 days','{}'),   -- delete: correction never applied
 ('10000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-0000000000a1','remainder','finished',now()-interval '90 days',now()-interval '90 days','{"remainder_photo_id":"x"}'), -- keep: remainder
 ('10000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-0000000000a2','analyze','error',now()-interval '90 days',now()-interval '91 days','{}'),     -- delete: older error of failed meal
 ('10000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000a2','analyze','error',now()-interval '80 days',now()-interval '81 days','{}'),     -- keep: latest error of failed meal
 ('10000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-0000000000a3','analyze','finished',now()-interval '90 days',now()-interval '90 days','{}'),  -- keep: active job
 ('10000000-0000-0000-0000-00000000000c',null,'media_cleanup','finished',now()-interval '90 days',now()-interval '90 days','{}'),  -- keep: referenced by a draft
 ('10000000-0000-0000-0000-00000000000d',null,'media_cleanup','finished',now()-interval '90 days',now()-interval '90 days','{}'),  -- delete: stage cleanup done
 ('10000000-0000-0000-0000-00000000000e','00000000-0000-0000-0000-0000000000a1','analyze','queued',null,now()-interval '90 days','{}'),     -- keep: queued
 ('10000000-0000-0000-0000-00000000000f','00000000-0000-0000-0000-0000000000a1','analyze','running',null,now()-interval '90 days','{}');    -- keep: running
alter table public.posts disable trigger user;
update public.posts set active_job_id='10000000-0000-0000-0000-00000000000b' where id='00000000-0000-0000-0000-0000000000a3';
alter table public.posts enable trigger user;
insert into public.post_upload_drafts(id,user_id,caption,eaten_at,shots,cleanup_job_id) values('20000000-0000-0000-0000-000000000001',(select id from public.profiles order by id limit 1),'',now(),'[]','10000000-0000-0000-0000-00000000000c');
`;
const localDb = () => { assert.equal(process.env.MFA_TEST_DISPOSABLE, '1'); const db = process.env.SUPABASE_DB_URL; assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(db).hostname)); return db; };
const psql = sql => { const result = spawnSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', localDb()], { input: sql, encoding: 'utf8', timeout: 60000 });
  assert.ifError(result.error); assert.equal(result.status, 0, result.stderr); return result.stdout.trim(); };
const CLEANUP = `delete from public.post_upload_drafts where id='20000000-0000-0000-0000-000000000001';
 update public.posts set active_job_id=null where id='00000000-0000-0000-0000-0000000000a3';
 delete from public.jobs where id::text like '10000000-0000-0000-0000-%'; delete from public.posts where id::text like '00000000-0000-0000-0000-0000000000a%';
 delete from public.retention_summary where table_name='jobs' and day < current_date - 13;`;
const KEPT = ['2', '3', '5', '6', '8', 'a', 'b', 'c', 'e', 'f'];

test('the options are bounded and a dry run is the default', () => {
  assert.deepEqual(parseArgs(['--table=jobs']), { table: 'jobs', delete: false, batches: 1, batchSize: 200, pauseMs: 5000 });
  for (const bad of [['--table=posts'], ['--table=jobs', '--batch-size=1001'], ['--table=jobs', '--batches=51'], ['--table=jobs', '--pause-ms=999'], ['--table=jobs', '--force']])
    assert.throws(() => parseArgs(bad), undefined, bad.join(' '));
});

test('jobs retention: the dry run deletes nothing, and the batches delete exactly the five old rows, counted', { timeout: 60000 }, async () => {
  assert.ok(process.env.SUPABASE_DB_URL, 'SUPABASE_DB_URL is required');
  try {
    psql(`begin;\n${SETUP}\ncommit;`);
    const lines = []; await run(parseArgs(['--table=jobs']), line => lines.push(line));
    for (const expected of [/failed_60d\tanalyze\t1$/, /finished_14d\tmedia_cleanup\t1$/, /failed_60d\trecompute\t1$/, /finished_14d\tanalyze\t1$/, /finished_14d\tcorrect\t1$/]) assert.ok(lines.some(line => expected.test(line)), expected);
    assert.equal(psql(`select count(*) from public.jobs where id::text like '10000000-0000-0000-0000-%'`), '15');
    const result = await run(parseArgs(['--table=jobs', '--delete', '--batches=3', '--batch-size=2', '--pause-ms=1000']), () => {});
    assert.equal(result.deleted, 5);
    assert.deepEqual(psql(`select string_agg(right(id::text,1), ',' order by id) from public.jobs where id::text like '10000000-0000-0000-0000-%'`).split(','), KEPT);
    assert.equal(psql(`select coalesce(sum(deleted),0) from public.retention_summary where table_name='jobs' and day < current_date - 13 `), '5');
  } finally { psql(CLEANUP); }
});

test('a batch size outside 1 to 1000 is refused, and a pack photo stage without its cleanup job is expired', () => {
  const bad = spawnSync('psql', ['-X', '-qAt', '--dbname', localDb()], { input: 'select public.retention_jobs_batch(0);', encoding: 'utf8' });
  assert.match(bad.stderr, /Batch size must be 1 to 1000/);
  const pack = spawnSync('psql', ['-X', '-qAt', '--dbname', localDb()], { encoding: 'utf8', input: `begin;
select id as uid from public.profiles order by id limit 1 \\gset
insert into storage.objects(bucket_id,name) values('media',:'uid'||'/30000000-0000-0000-0000-000000000001/0.jpg'),('media',:'uid'||'/30000000-0000-0000-0000-000000000001/0.feed.jpg');
select public.create_food_post(:'uid',now(),'Pack snack',30,'{"calories":100,"protein_g":1,"carbs_g":10,"fat_g":5}',jsonb_build_object('path',:'uid'||'/30000000-0000-0000-0000-000000000001/0.jpg','width',100,'height',100));
rollback;` });
  assert.match(pack.stderr, /Pack photo expired/);
});
