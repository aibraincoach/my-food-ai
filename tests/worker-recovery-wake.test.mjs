import test from 'node:test';
import assert from 'node:assert/strict';
import { queueTick } from '../src/lib/queue/tick.ts';
import { runWorker } from '../src/lib/worker/drain.ts';

test('a lone abandoned running job can acquire a recovery worker', async () => {
  const calls=[];
  const admin={
    from(table){assert.equal(table,'jobs');return {select(){return this;},eq(column,value){assert.equal(column,'status');return Promise.resolve({count:value==='running'?1:0});}};},
    async rpc(name){calls.push(name);assert.equal(name,'try_acquire_worker_lease');return {data:true,error:null};},
  };
  assert.deepEqual(await queueTick(admin,'recovery'),{queued:0,running:1,traffic:'low',started:true});
  assert.deepEqual(calls,['try_acquire_worker_lease']);
});

test('blocked due work waits for eligibility instead of immediately self-ticking', async () => {
  const original=globalThis.setTimeout;const waits=[];let ticks=0;
  globalThis.setTimeout=(callback,delay)=>{waits.push(delay);callback();return 0;};
  try {
    const admin={async rpc(name){
      if(name==='claim_owned_job')return {data:null,error:null};
      if(name==='release_worker_lease')return {error:null};
      if(name==='next_worker_wake')return {data:new Date(Date.now()+360_000).toISOString(),error:null};
      throw new Error(`unexpected RPC ${name}`);
    }};
    await runWorker(admin,'recovery',async()=>{ticks++;});
    assert.deepEqual(waits,[60_000]);assert.equal(ticks,1);
    admin.rpc=async name=>{assert.ok(['claim_owned_job','release_worker_lease','next_worker_wake'].includes(name));return {data:null,error:null};};
    await runWorker(admin,'empty',async()=>{ticks++;});
    assert.equal(ticks,1,'empty queue does not keep waking');
  } finally {globalThis.setTimeout=original;}
});
