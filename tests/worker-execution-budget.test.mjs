import test from 'node:test';
import assert from 'node:assert/strict';
import {traceContext} from '../src/lib/trace/context.ts';
import {nutritionBudgetMs,workerDeadlineSignal,workerHandoffDelay} from '../src/lib/worker/budget.ts';
import {metaFetch,createMetaClient} from '../src/lib/meta/client.ts';
import {runWorker} from '../src/lib/worker/drain.ts';

test('nutrition uses remaining invocation time and reserves persistence plus the global tail',()=>{
 assert.equal(nutritionBudgetMs(undefined,0),180000);
 assert.equal(nutritionBudgetMs(270000,55000),180000);
 // A job admitted at59s then spending55s on preparation has141s, not180s.
 assert.equal(nutritionBudgetMs(270000,59000+55000),141000);
 assert.equal(nutritionBudgetMs(270000,255000),0);
 assert.equal(nutritionBudgetMs(270000,300000),0);
 assert.equal(59000+55000+141000+15000+30000,300000);
});

test('raw Meta requests stop at the invocation deadline without a transport retry',{timeout:3000},async()=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.MODEL_API_KEY;process.env.MODEL_API_KEY='fixture-only';let calls=0;
 globalThis.fetch=async(_input,init)=>{calls++;return new Promise((_resolve,reject)=>{const fail=()=>reject(init.signal.reason);if(init.signal.aborted)fail();else init.signal.addEventListener('abort',fail,{once:true});});};
 try{
  await traceContext.run({postId:null,deadlineAt:Date.now()+20},()=>assert.rejects(metaFetch('/responses',{method:'POST',body:'{}'}),error=>error.name==='TimeoutError'));
  assert.equal(calls,1);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=oldKey;}
});

test('expired invocation cannot start an SDK request or extend an existing caller signal',{timeout:3000},async()=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.MODEL_API_KEY;process.env.MODEL_API_KEY='fixture-only';let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('Unexpected network call');};
 try{
  await traceContext.run({postId:null,deadlineAt:Date.now()-1},async()=>{
   assert.equal(workerDeadlineSignal().aborted,true);
   await assert.rejects(createMetaClient().responses.create({model:'sam-3.1',input:'food'}));
  });
  const cancelled=new AbortController();cancelled.abort();
  traceContext.run({postId:null,deadlineAt:Date.now()+1000},()=>assert.equal(workerDeadlineSignal(cancelled.signal).aborted,true));
  assert.equal(calls,0);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=oldKey;}
});

test('late worker handoff skips both the timer and request so the durable wake can take over',async()=>{
 assert.equal(workerHandoffDelay(100000,0,0),60000);
 assert.equal(workerHandoffDelay(300000,0,250000),null);
 const oldNow=Date.now,oldTimeout=globalThis.setTimeout;let now=0,ticks=0;const waits=[];
 Date.now=()=>now;globalThis.setTimeout=(fn,delay)=>{waits.push(delay);fn();return 0;};
 const admin={async rpc(name){
  if(name==='claim_owned_job')return{data:null,error:null};
  if(name==='release_worker_lease'){now=269000;return{error:null};}
  if(name==='next_worker_wake')return{data:new Date(now+60000).toISOString(),error:null};
  throw Error('Unexpected RPC');
 }};
 try{await runWorker(admin,'fixture',async()=>{ticks++;});assert.equal(ticks,0);assert.deepEqual(waits,[]);}
 finally{Date.now=oldNow;globalThis.setTimeout=oldTimeout;}
});
