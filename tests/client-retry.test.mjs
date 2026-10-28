// node --import tsx --env-file=.env.local --test tests/client-retry.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {pipelineHarness} from './fake-meta/harness.mjs';
test('a short 429 retries inside one job attempt; long waits leave the attempt',async()=>{
 const h=await pipelineHarness();
 try{
  const meal=await h.post(false);await h.control({status:429,times:1,retryAfter:1});
  const start=Date.now();assert.equal((await h.drain()).failed,false);assert.ok(Date.now()-start>=900);
  const {data:job}=await h.admin.from('jobs').select('status,attempts').eq('id',meal.jobId).single();
  assert.equal(job.status,'finished');assert.equal(job.attempts,1);
  const {metaFetch,createMetaClient}=await import('../src/lib/meta/client.ts');
  for(const call of [()=>metaFetch('/models'),()=>createMetaClient().models.list()]){
   const before=h.fake.calls.length;await h.control({status:429,times:1,retryAfter:11});
   await assert.rejects(call,error=>error.status===429);assert.equal(h.fake.calls.length,before+1);
   await h.control({status:400,times:1});const before400=h.fake.calls.length;
   await assert.rejects(call,error=>error.status===400);assert.equal(h.fake.calls.length,before400+1);
  }
 }finally{await h.cleanup();}
});
