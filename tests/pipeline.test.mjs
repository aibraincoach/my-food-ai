// node --import tsx --env-file=.env.local --test tests/pipeline.test.mjs
// Requires migrations0007/0007b deployed on the target project; never applies them.
import assert from 'node:assert/strict';
import test from 'node:test';
import {pipelineHarness} from './fake-meta/harness.mjs';
test('offline model responses drive a real meal, correction and error transitions',async()=>{
 const h=await pipelineHarness();
 try{
  const meal=await h.post(true);assert.equal((await h.drain()).failed,false);
  const {data:ready}=await h.admin.from('posts').select('status').eq('id',meal.id).single();assert.equal(ready.status,'ready');
  const {data:before}=await h.admin.from('post_comments').select('id').eq('post_id',meal.id).eq('author','model');assert.equal(before.length,1);
  const {error:commentError}=await h.user.from('post_comments').insert({post_id:meal.id,author:'user',body:'Use 75 grams of rice.'});assert.equal(commentError,null);
  await h.enqueue(meal.id,'correct');assert.equal((await h.drain()).failed,false);
  const {data:after}=await h.admin.from('post_comments').select('id').eq('post_id',meal.id).eq('author','model');assert.equal(after.length,2);
  const invalid=await h.post(true);await h.control({status:400,times:1});assert.equal((await h.drain()).failed,true);
  const {data:failed}=await h.admin.from('jobs').select('status,attempts').eq('id',invalid.jobId).single();assert.equal(failed.status,'error');assert.equal(failed.attempts,1);
  const retry=await h.post(true);
  // Keep failing longer than any SDK's internal retry allowance. This test
  // verifies queue recovery; the separate client test covers in-attempt retry.
  await h.control({status:429,times:100,retryAfter:0});
  assert.equal((await h.drain()).failed,true);
  let {data:job}=await h.admin.from('jobs').select('status,attempts').eq('id',retry.jobId).single();
  assert.equal(job.status,'queued');assert.equal(job.attempts,1);
  await h.control({status:429,times:0});
  assert.equal((await h.drain()).failed,false);
  ({data:job}=await h.admin.from('jobs').select('status,attempts').eq('id',retry.jobId).single());
  assert.equal(job.status,'finished');assert.equal(job.attempts,2);assert.ok(h.fake.calls.some(c=>c.path==='/v1/responses'));
 }finally{await h.cleanup();}
});
