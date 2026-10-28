import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { register } from 'tsx/esm/api';
import { admin, checked } from './helpers.mjs';
import { drainOnce } from '../../scripts/worker-local.mjs';
import { testHandlers } from '../fixtures/job-handlers.mjs';

// Exercise the actual production claim RPC in a rolled-back SQL transaction.
// A brief table lock excludes concurrent inserts into the reserved fixture
// range. Existing jobs are neither updated nor claimed, even on an assertion
// failure: all ten eligible fixtures sort before every existing job.
test('claim_job orders eligible rows by priority, age and ID', () => {
  assert.ok(process.env.SUPABASE_DB_URL, 'SUPABASE_DB_URL is required');
  const sql = `
\\set ON_ERROR_STOP on
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
lock table public.jobs in share row exclusive mode;
do $test$
begin
  if exists (select 1 from public.jobs where priority <= -32766 or run_after = '-infinity'::timestamptz) then
    raise exception 'Reserved SQL fixture range is occupied; no existing jobs were changed';
  end if;
end;
$test$;
set local role service_role;
do $test$
declare
  expected uuid[];
  claimed public.jobs;
  delayed uuid;
  row_index integer;
begin
  create temporary table queue_fixture_ids (id uuid primary key) on commit drop;
  for row_index in 0..9 loop
    insert into public.jobs(kind,status,priority,created_at,run_after)
    values ('test_noop','queued',-32768 + (row_index % 3),
      '2000-01-01'::timestamptz + (row_index / 2) * interval '1 second', '-infinity')
    returning id into claimed.id;
    insert into queue_fixture_ids values (claimed.id);
  end loop;
  -- This fixture would win by priority and age, but is not yet eligible.
  insert into public.jobs(kind,status,priority,created_at,run_after)
  values ('test_noop','queued',-32768,'-infinity','2000-01-01') returning id into delayed;
  select array_agg(j.id order by j.priority,j.created_at,j.id) into expected
    from public.jobs j join queue_fixture_ids f on f.id=j.id;
  for row_index in 1..10 loop
    claimed := public.claim_job('-infinity'::timestamptz);
    if claimed.id is distinct from expected[row_index] or claimed.status <> 'running'
      or claimed.attempts <> 1 or claimed.started_at is distinct from '-infinity'::timestamptz then
      raise exception 'Claim order/state mismatch at fixture %',row_index;
    end if;
  end loop;
  if not exists(select 1 from public.jobs where id=delayed and status='queued' and attempts=0) then
    raise exception 'Future fixture was incorrectly claimed';
  end if;
end;
$test$;
select 'claim-job-order: passed';
rollback;
`;
  const result = spawnSync('psql', ['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL], {
    input: sql, encoding: 'utf8', timeout: 45000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /claim-job-order: passed/);
});

test('drainOnce finishes ten isolated fixture jobs without claiming other work', async () => {
  const db = admin(), ids = [];
  // tsImport loads the worker entry; its dynamic job-kind imports also need
  // the loader registered for this test lifetime.
  const unregister = register();
  // Only claim selection is scoped here. The real worker, handler, finish and
  // failure paths still use Supabase. The SQL test above proves claim ordering.
  const scoped = new Proxy(db, { get(target, property) {
    if (property === 'rpc') return async (name, args) => {
      if (name !== 'claim_job' && name !== 'claim_owned_job') {
        assert.ok(!name.startsWith('claim'), 'Unrecognized claim RPC must never reach the global queue');
        if (name === 'fail_job') assert.ok(ids.includes(args.p_job_id), 'failure must belong to this fixture');
        return target.rpc(name, args);
      }
      const {data:rows,error} = await target.from('jobs').select('*').in('id',ids)
        .eq('status','queued').order('priority').order('created_at').order('id').limit(1);
      if (error || !rows?.length) return {data:null,error};
      const row = rows[0];
      return target.from('jobs').update({status:'running',started_at:new Date().toISOString(),finished_at:null,attempts:row.attempts+1})
        .eq('id',row.id).eq('status','queued').select('*').maybeSingle();
    };
    const value = Reflect.get(target, property);
    return typeof value === 'function' ? value.bind(target) : value;
  }});
  try {
    await assert.rejects(() => scoped.rpc('claim_unscoped_job'), /Unrecognized claim RPC/);
    const rows = Array.from({length:10},(_,i)=>({id:randomUUID(),kind:'test_noop',status:'queued',priority:i%3,
      created_at:new Date(Date.now()-(10-i)*1000).toISOString(),run_after:'2099-01-01T00:00:00Z'}));
    ids.push(...rows.map(row=>row.id));
    checked(await db.from('jobs').insert(rows));
    const expected = [...rows].sort((a,b)=>a.priority-b.priority || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
    for (let i=0;i<10;i++) {
      const result = await drainOnce(scoped, testHandlers);
      const diagnostic = result.failed ? checked(await db.from('jobs').select('error').eq('id',expected[i].id).single()).error : undefined;
      assert.deepEqual(result, {processed:1,failed:false}, diagnostic);
      const done = checked(await db.from('jobs').select('id,status,attempts').in('id',ids).eq('status','finished'));
      assert.deepEqual(done.map(row=>row.id).sort(), expected.slice(0,i+1).map(row=>row.id).sort());
      assert.ok(done.every(row=>row.attempts===1));
    }
    assert.deepEqual(await drainOnce(scoped, testHandlers), {processed:0,failed:false}, 'fixture exhaustion cannot drain unrelated jobs');
  } finally {
    try { if (ids.length) checked(await db.from('jobs').delete().in('id',ids)); }
    finally { await unregister(); }
  }
});
