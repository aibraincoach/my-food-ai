// node --import tsx --test tests/empty-job-claim.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import {claimJob} from "../src/lib/queue/claim.ts";
import {drainOnce,runWorker} from "../src/lib/worker/drain.ts";

test("empty SQL composite stops the worker after a single claim with no failure or renewal",async()=>{
 const calls=[];let ticks=0;
 const db={rpc:async(name)=>{
  calls.push(name);
  if(name==='claim_owned_job')return {data:{id:null,post_id:null,kind:null,payload:null,status:null},error:null};
  if(name==='release_worker_lease')return {data:null,error:null};
  throw Error(`Unexpected RPC ${name}`);
 }};
 assert.deepEqual(await drainOnce(db),{processed:0,failed:false});
 assert.deepEqual(calls,['claim_owned_job']);calls.length=0;
 await runWorker(db,'fixture',async()=>{ticks++;});
 assert.deepEqual(calls,['claim_owned_job','release_worker_lease']);
 assert.equal(ticks,0,'empty claims never self-tick or read the next wake');
});

test("null claims stop and genuine claimed jobs preserve their identity",async()=>{
 assert.equal(await claimJob({rpc:async()=>({data:null,error:null})}),null);
 const job={id:'real-job',kind:'analyze'};
 assert.equal(await claimJob({rpc:async()=>({data:job,error:null})}),job);
});
