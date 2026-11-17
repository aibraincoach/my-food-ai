import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as tick from '../src/lib/queue/tick.ts';

// Stand-in database: one due queued job, nothing running, and a lease another holder has.
function blockedAdmin(expiresAt){
  const calls=[];
  return {calls,
    from(table){
      if(table==='worker_lease')return {select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{expires_at:expiresAt},error:null})};
      assert.equal(table,'jobs');
      return {select(){return this;},lte(){return this;},eq(column,value){return Promise.resolve({count:value==='queued'?1:0,error:null});}};
    },
    async rpc(name){calls.push(name);assert.equal(name,'try_acquire_worker_lease');return {data:false,error:null};},
  };
}

test('a tick that finds due work behind another holder\'s lease looks again once that lease can have expired', async () => {
  const original=globalThis.setTimeout;const waits=[];let ticks=0;
  globalThis.setTimeout=(callback,delay)=>{waits.push(delay);callback();return 0;};
  try {
    const admin=blockedAdmin(new Date(Date.now()+40_000).toISOString());
    const status=await tick.queueTick(admin,'second-tick',60);
    assert.equal(status.queued,1);assert.equal(status.started,false,'the lease is held by someone else');
    assert.equal(typeof tick.retickWhenBlocked,'function','a blocked tick must have a way to look again');
    assert.equal(await tick.retickWhenBlocked(admin,status,async()=>{ticks++;},60),true);
    assert.equal(ticks,1,'the blocked tick ticks again');
    assert.equal(waits.length,1);
    assert.ok(waits[0]>39_000&&waits[0]<=41_000,`waits for the lease expiry plus one second, got ${waits[0]}`);
    // A lease far in the future (a fixture run) never makes the wait longer than one lease lifetime.
    waits.length=0;
    await tick.retickWhenBlocked(blockedAdmin(new Date(Date.now()+600_000).toISOString()),status,async()=>{ticks++;},60);
    assert.deepEqual(waits,[61_000]);assert.equal(ticks,2);
    // Nothing to look again for: this tick started the worker, or no due work waits.
    waits.length=0;
    assert.equal(await tick.retickWhenBlocked(admin,{queued:1,started:true},async()=>{ticks++;},60),false);
    assert.equal(await tick.retickWhenBlocked(admin,{queued:0,started:false},async()=>{ticks++;},60),false);
    assert.deepEqual(waits,[]);assert.equal(ticks,2);
  } finally {globalThis.setTimeout=original;}
});

test('only one second look is pending per server instance', async () => {
  const original=globalThis.setTimeout;const pending=[];let ticks=0;
  globalThis.setTimeout=(callback)=>{pending.push(callback);return 0;};
  try {
    const admin=blockedAdmin(new Date(Date.now()+40_000).toISOString());
    const first=tick.retickWhenBlocked(admin,{queued:1,started:false},async()=>{ticks++;},60);
    assert.equal(await tick.retickWhenBlocked(admin,{queued:1,started:false},async()=>{ticks++;},60),false,'a second blocked tick does not stack another wait');
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(pending.length,1);pending[0]();
    assert.equal(await first,true);assert.equal(ticks,1);
  } finally {globalThis.setTimeout=original;}
});

test('the tick route hands a blocked tick to the second look', () => {
  const route=readFileSync(new URL('../src/app/api/jobs/tick/route.ts',import.meta.url),'utf8');
  assert.match(route,/retickWhenBlocked\(admin, status,/);
});
