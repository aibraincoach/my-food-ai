// node --import tsx --test tests/worker-safety.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { renewLease } from '../src/lib/queue/lease.ts';
import { FdcRateLimited } from '../src/lib/fdc/client.ts';
import { drainOnce, runWorker } from '../src/lib/worker/drain.ts';
import { failureMessage } from '../src/lib/worker/failure-message.ts';

test('renewal checks the dedicated ownership RPC and refuses a lost lease',async()=>{
 let name;await renewLease({rpc:async rpc=>{name=rpc;return {data:true,error:null};}},'holder');assert.equal(name,'renew_worker_lease');
 await assert.rejects(renewLease({rpc:async()=>({data:false,error:null})},'holder'),/no longer held/);
 await assert.rejects(renewLease({rpc:async()=>({data:null,error:{message:'offline'},status:503})},'holder'),/renew lease failed/);
});
test('a USDA retry time reaches the durable queue unchanged instead of fail_job',async()=>{
 const limited=new FdcRateLimited(120);let requeued;
 const db={rpc:async(name,args)=>{
  if(name==='claim_owned_job')return {data:{id:'job',post_id:'post',kind:'fixture'},error:null};
  assert.equal(name,'requeue_rate_limited_job');requeued=args;return {data:null,error:null};
 }};
 assert.deepEqual(await drainOnce(db,{fixture:async()=>{throw limited;}}),{processed:1,failed:false});
 assert.equal(requeued.p_retry_at,new Date(limited.retryAt).toISOString());assert.equal(requeued.p_job_id,'job');
});
test('a lost lease stops the worker before it claims another job',async()=>{
 const calls=[];
 const db={rpc:async name=>{calls.push(name);
  if(name==='claim_owned_job')return {data:{id:'job',kind:'fixture',post_id:null},error:null};
  if(name==='fail_job')return {data:null,error:null};
  if(name==='renew_worker_lease')return {data:false,error:null};
  if(name==='release_worker_lease')return {data:null,error:null};
  throw Error('Unexpected '+name);
 }};
 // An unknown kind fails this isolated fixture job, then renewal must stop the loop.
 await assert.rejects(runWorker(db,'holder'),/no longer held/);
 assert.equal(calls.filter(name=>name==='claim_owned_job').length,1);assert.equal(calls.at(-1),'release_worker_lease');
});
test('public failure messages use fixed copy and never echo raw provider diagnostics',()=>{
 assert.match(failureMessage('fdc: private diagnostic'),/food database was busy/);
 assert.match(failureMessage('meta: private diagnostic'),/analysis service refused/);
 assert.equal(failureMessage('private credential detail'),'This photo could not be analysed.');
});
