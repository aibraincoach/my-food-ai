import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveNutritionItems} from '../src/lib/fdc/resolve-items.ts';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};

test('six meal items resolve in two lanes and keep the input order',async()=>{
 const releases=Array.from({length:6},deferred);const started=[];let active=0,maximum=0;const seenSignals=[];
 const resolving=resolveNutritionItems([0,1,2,3,4,5],new AbortController().signal,async(item,index,signal)=>{
  started.push(item);active++;maximum=Math.max(maximum,active);seenSignals.push(signal);
  await releases[item].promise;active--;return {item,index};
 });
 assert.deepEqual(started,[0,1]);
 releases[1].resolve();await flush();assert.deepEqual(started,[0,1,2]);
 releases[2].resolve();await flush();assert.deepEqual(started,[0,1,2,3]);
 releases[0].resolve();await flush();assert.deepEqual(started,[0,1,2,3,4]);
 releases[4].resolve();await flush();assert.deepEqual(started,[0,1,2,3,4,5]);
 releases[5].resolve();releases[3].resolve();
 assert.deepEqual(await resolving,[0,1,2,3,4,5].map(item=>({item,index:item})));
 assert.equal(maximum,2);assert.equal(active,0);assert.ok(seenSignals.every(signal=>signal===seenSignals[0]));
});

test('failure stops queued work and waits for an in-flight peer before returning',async()=>{
 const failing=deferred(),peer=deferred();const firstError=Error('food provider failed');const started=[];let settled=false,peerSettled=false,peerSignal;let publications=0;
 const run=(async()=>{
  const resolved=await resolveNutritionItems([0,1,2,3],new AbortController().signal,async(item,_index,signal)=>{
   started.push(item);
   if(item===0)return failing.promise;
   peerSignal=signal;await peer.promise;peerSettled=true;return item;
  });
  publications++;return resolved;
 })();
 const rejected=assert.rejects(run,error=>{settled=true;assert.equal(peerSettled,true);return error===firstError;});
 failing.reject(firstError);await flush();
 assert.equal(settled,false);assert.equal(peerSignal.aborted,true);assert.deepEqual(started,[0,1]);
 peer.resolve();await rejected;
 assert.equal(publications,0);assert.deepEqual(started,[0,1]);
});

test('one shared deadline cancels both lanes and never starts queued items',async()=>{
 const budget=new AbortController();const started=[],settled=[];const failure=new DOMException('meal deadline','TimeoutError');
 const run=resolveNutritionItems([0,1,2,3],budget.signal,(item,_index,signal)=>{
  started.push(item);
  return new Promise((_,reject)=>signal.addEventListener('abort',()=>{settled.push(item);reject(signal.reason);},{once:true}));
 });
 budget.abort(failure);await assert.rejects(run,error=>error===failure);
 assert.deepEqual(started,[0,1]);assert.deepEqual(settled.sort(),[0,1]);
});

test('already expired budgets do no work; no-item meals produce no lookup',async()=>{
 const budget=new AbortController();budget.abort(new DOMException('expired','TimeoutError'));let calls=0;
 await assert.rejects(resolveNutritionItems([1,2],budget.signal,async()=>{calls++;}));
 assert.equal(calls,0);
 assert.deepEqual(await resolveNutritionItems([],new AbortController().signal,async()=>{calls++;}),[]);
 assert.equal(calls,0);
});
