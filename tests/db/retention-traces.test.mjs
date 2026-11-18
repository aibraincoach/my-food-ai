import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { parseArgs, run } from '../../scripts/retention/run.mjs';

// #1098: trace rows older than 45 days go, except the USDA decisions behind a meal's current foods and the failed
// open-model identify a Meta-identified meal's card reads. Local throwaway database only.
const OWNER = '(select id from public.profiles order by id limit 1)';
const SETUP = `
insert into public.posts(id,user_id,caption,status,eaten_at,identify_model,identify_host) values
 ('00000000-0000-0000-0000-0000000000b1',${OWNER},'trace meal','ready',now()-interval '90 days','muse-spark-1.3','meta'),
 ('00000000-0000-0000-0000-0000000000b2',${OWNER},'old meal','ready',now()-interval '90 days',null,null);
insert into public.post_items(id,post_id,name) values
 ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000b1','Rice'),
 ('40000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000b2','Rice');
update public.post_items set superseded_at=now() where id='40000000-0000-0000-0000-000000000002';
insert into public.item_nutrition(post_item_id,source_ref,micronutrients) values
 ('40000000-0000-0000-0000-000000000001','12345','[]'),('40000000-0000-0000-0000-000000000002','12345','[]');
insert into public.model_calls(id,post_id,kind,started_at,duration_ms,fdc_id,error,host) values
 ('50000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000b1','fdc',now()-interval '50 days',1,12345,null,'meta'),          -- keep: current food's decision
 ('50000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000b1','fdc',now()-interval '50 days',1,999,null,'meta'),            -- delete: another record
 ('50000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000000b1','fdc',now()-interval '50 days',1,12345,'timeout','meta'),     -- delete: failed call
 ('50000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-0000000000b1','fdc',now()-interval '44 days',1,999,null,'meta'),            -- keep: 44 days
 ('50000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-0000000000b1','spark_identify',now()-interval '50 days',1,null,'503','baseten'), -- keep: card reads it
 ('50000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-0000000000b1','spark_identify',now()-interval '50 days',1,null,null,'meta'),  -- delete
 ('50000000-0000-0000-0000-000000000007',null,'sam',now()-interval '50 days',1,null,null,'meta'),                                              -- delete: no meal
 ('50000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-0000000000b2','fdc',now()-interval '50 days',1,12345,null,'meta'),           -- delete: food superseded
 ('50000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-0000000000b1','spark_identify',now()-interval '50 days',1,null,'legacy failure',null); -- delete: unknown host is not a baseten keeper
`;
const localDb = () => { assert.equal(process.env.MFA_TEST_DISPOSABLE, '1'); const db = process.env.SUPABASE_DB_URL; assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(db).hostname)); return db; };
const psql = sql => { const result = spawnSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', localDb()], { input: sql, encoding: 'utf8', timeout: 60000 });
  assert.ifError(result.error); assert.equal(result.status, 0, result.stderr); return result.stdout.trim(); };
const CLEANUP = `delete from public.model_calls where id::text like '50000000-0000-0000-0000-%';
 delete from public.posts where id::text like '00000000-0000-0000-0000-0000000000b%';
 delete from public.retention_summary where table_name='model_calls' and day < current_date - 44;`;

test('the trace table is a retention table', () => assert.equal(parseArgs(['--table=model_calls']).table, 'model_calls'));

test('trace retention keeps current decisions and the card\'s failed identify, and deletes the rest in counted batches', { timeout: 60000 }, async () => {
  assert.ok(process.env.SUPABASE_DB_URL, 'SUPABASE_DB_URL is required');
  try {
    psql(`begin;\n${SETUP}\ncommit;`);
    const lines = []; await run(parseArgs(['--table=model_calls']), line => lines.push(line));
    assert.ok(lines.some(line => /older_45d\tfdc\t[0-9]+$/.test(line)));
    assert.equal(psql(`select count(*) from public.model_calls where id::text like '50000000-0000-0000-0000-%'`), '9');
    const result = await run(parseArgs(['--table=model_calls', '--delete', '--batches=5', '--batch-size=2', '--pause-ms=1000']), () => {});
    assert.equal(result.deleted, 6);
    assert.equal(psql(`select string_agg(right(id::text,1), ',' order by id) from public.model_calls where id::text like '50000000-0000-0000-0000-%'`), '1,4,5');
    assert.equal(psql(`select coalesce(sum(deleted),0) from public.retention_summary where table_name='model_calls' and day < current_date - 44`), '6');
  } finally { psql(CLEANUP); }
});
