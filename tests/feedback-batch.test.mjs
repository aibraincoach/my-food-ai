import test from 'node:test';import assert from 'node:assert/strict';
import {feedbackBatchModule} from './fixtures/feedback-batch-module.mjs';
const turn=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
 const timers=[],calls=[],pending=[];
 const db={from(table){assert.equal(table,'post_feedback');return{select(columns){assert.equal(columns,'post_id,verdict,model_comment_id,item_fingerprint');return{in(column,ids){assert.equal(column,'post_id');calls.push([...ids]);return new Promise((resolve,reject)=>pending.push({resolve,reject}));}};}};}};
 const reader=feedbackBatchModule(db,fn=>timers.push(fn));
 return {...reader,calls,pending,async dispatch(){assert.equal(timers.length,1);timers.shift()();await turn();}};
}
test('simultaneous feedback waiters share one owner-session query, dedupe ids and receive their own row or null',async()=>{
 const f=fixture(),first=f.requestFeedback('one'),again=f.requestFeedback('one'),absent=f.requestFeedback('two');
 assert.equal(f.calls.length,0);await f.dispatch();assert.deepEqual(f.calls,[['one','two']]);
 const row={post_id:'one',verdict:'up',model_comment_id:'m',item_fingerprint:'f'};
 f.pending[0].resolve({data:[row],error:null});assert.deepEqual(await first,row);assert.deepEqual(await again,row);assert.equal(await absent,null);
});
test('120 ids use three queries with at most50 ids and settle every waiter',async()=>{
 const f=fixture(),waiting=Array.from({length:120},(_,i)=>f.requestFeedback(String(i)));
 await f.dispatch();assert.deepEqual(f.calls.map(ids=>ids.length),[50,50,20]);
 for(const call of f.pending)call.resolve({data:[],error:null});assert.equal((await Promise.all(waiting)).length,120);
});
test('a later tick re-reads even while the earlier batch is in flight; there is no result cache',async()=>{
 const f=fixture(),first=f.requestFeedback('one');await f.dispatch();
 const second=f.requestFeedback('one');await f.dispatch();assert.equal(f.calls.length,2);
 f.pending[0].resolve({data:[],error:null});f.pending[1].resolve({data:[],error:null});await Promise.all([first,second]);
 const third=f.requestFeedback('one');await f.dispatch();assert.equal(f.calls.length,3);f.pending[2].resolve({data:[],error:null});await third;
});
test('query errors and transport rejections reject all waiters without retry; next batch is independent',async()=>{
 for(const transport of [false,true]){
  const f=fixture(),waiters=[f.requestFeedback('one'),f.requestFeedback('one'),f.requestFeedback('two')],settled=Promise.allSettled(waiters);
  await f.dispatch();const error=Error('read failed');if(transport)f.pending[0].reject(error);else f.pending[0].resolve({data:null,error});
  assert.ok((await settled).every(result=>result.status==='rejected'&&result.reason===error));assert.equal(f.calls.length,1);
  const next=f.requestFeedback('one');await f.dispatch();f.pending[1].resolve({data:[],error:null});assert.equal(await next,null);assert.equal(f.calls.length,2);
 }
});
