import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveNutritionItems} from '../src/lib/fdc/resolve-items.ts';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};

test('four independent food lookups retain the original item order',async()=>{
 const releases=Array.from({length:8},deferred),started=[];let active=0,maximum=0;
 const run=resolveNutritionItems([0,1,2,3,4,5,6,7],new AbortController().signal,async(item)=>{
  started.push(item);active++;maximum=Math.max(maximum,active);await releases[item].promise;active--;return item;
 });
 assert.deepEqual(started,[0,1,2,3]);
 releases[3].resolve();await flush();assert.deepEqual(started,[0,1,2,3,4]);
 releases[0].resolve();await flush();assert.deepEqual(started,[0,1,2,3,4,5]);
 releases[4].resolve();await flush();assert.deepEqual(started,[0,1,2,3,4,5,6]);
 releases[1].resolve();await flush();assert.deepEqual(started,[0,1,2,3,4,5,6,7]);
 releases.forEach(x=>x.resolve());assert.deepEqual(await run,[0,1,2,3,4,5,6,7]);assert.equal(maximum,4);assert.equal(active,0);
});
test('failure cancels all peers and waits for them before returning without publication',async()=>{
 const failing=deferred(),peers=deferred(),started=[];let settled=0,returned=false,publications=0;const error=Error('food provider failed');const signals=[];
 const run=(async()=>{const rows=await resolveNutritionItems([0,1,2,3,4,5],new AbortController().signal,async(item,_i,signal)=>{started.push(item);signals.push(signal);if(item===0)return failing.promise;await peers.promise;settled++;return item});publications++;return rows})();
 const rejected=assert.rejects(run,e=>{returned=true;assert.equal(settled,3);return e===error});failing.reject(error);await flush();
 assert.equal(returned,false);assert.ok(signals.every(s=>s.aborted));assert.deepEqual(started,[0,1,2,3]);peers.resolve();await rejected;assert.equal(publications,0);
});
test('one shared deadline cancels four in-flight lookups and never starts queued work',async()=>{
 const budget=new AbortController(),started=[],settled=[];const error=new DOMException('meal deadline','TimeoutError');
 const run=resolveNutritionItems([0,1,2,3,4,5],budget.signal,(item,_i,signal)=>{started.push(item);return new Promise((_,reject)=>signal.addEventListener('abort',()=>{settled.push(item);reject(signal.reason)},{once:true}))});
 budget.abort(error);await assert.rejects(run,e=>e===error);assert.deepEqual(started,[0,1,2,3]);assert.deepEqual(settled.sort(),[0,1,2,3]);
});
test('expired budgets do no work and empty meals do no lookup',async()=>{
 const budget=new AbortController();budget.abort(new DOMException('expired','TimeoutError'));let calls=0;await assert.rejects(resolveNutritionItems([1,2],budget.signal,async()=>{calls++}));assert.equal(calls,0);assert.deepEqual(await resolveNutritionItems([],new AbortController().signal,async()=>{calls++}),[]);assert.equal(calls,0);
});
