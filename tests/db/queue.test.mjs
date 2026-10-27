import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { admin, checked } from './helpers.mjs';
import { drainOnce } from '../../scripts/worker-local.mjs';

test('ten queued jobs drain in priority then age order', async () => {
  const db = admin(), holder = randomUUID(), ids = [];
  assert.equal(checked(await db.rpc('try_acquire_worker_lease', { p_holder: holder, ttl_seconds: 300 })), true, 'queue is busy; run this check on an idle test project');
  try {
    const waiting = checked(await db.from('jobs').select('id').in('status',['queued','running']));
    assert.equal(waiting.length,0,'queue must be idle before this test');
    const rows = Array.from({length:10},(_,i)=>({id:randomUUID(),kind:'test_noop',status:'queued',priority:i%3,created_at:new Date(Date.now()-(10-i)*1000).toISOString()}));
    ids.push(...rows.map(r=>r.id));
    checked(await db.from('jobs').insert(rows));
    const expected = [...rows].sort((a,b)=>a.priority-b.priority || a.created_at.localeCompare(b.created_at));
    for (let i=0;i<10;i++) {
      const current = checked(await db.from('jobs').select('id').in('status',['queued','running']));
      assert.ok(current.every(r=>ids.includes(r.id)), 'another job arrived; stop the isolated queue check');
      assert.deepEqual(await drainOnce(db), {processed:1,failed:false});
      const done = checked(await db.from('jobs').select('id,status').in('id',ids).eq('status','finished'));
      assert.deepEqual(done.map(r=>r.id).sort(), expected.slice(0,i+1).map(r=>r.id).sort());
    }
  } finally {
    if(ids.length) checked(await db.from('jobs').delete().in('id',ids));
    checked(await db.rpc('release_worker_lease',{p_holder:holder}));
  }
});
