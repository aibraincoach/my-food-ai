import test from 'node:test';
import assert from 'node:assert/strict';
import {startFakeMeta} from './fake-meta/server.mjs';
test('forced failures remain until explicitly cleared for queue-recovery tests',async()=>{
 const fake=await startFakeMeta();
 try{
  const control=async times=>{const r=await fetch(`${fake.origin}/__control`,{method:'POST',body:JSON.stringify({status:429,times,retryAfter:0})});assert.equal(r.status,204);};
  await control(100);for(let i=0;i<3;i++)assert.equal((await fetch(`${fake.baseURL}/models`)).status,429);
  await control(0);assert.equal((await fetch(`${fake.baseURL}/models`)).status,200);
 }finally{await fake.close();}
});
