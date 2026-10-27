// node --import tsx --test tests/client-retry-headers.test.mjs
// Isolated HTTP-header behavior; no database, live model call or API key.
import assert from 'node:assert/strict';
import test from 'node:test';
import {tsImport} from 'tsx/esm/api';
const {metaFetch}=await tsImport('../src/lib/meta/client.ts',import.meta.url);
test('blank retry headers use fallback delay and cannot mask a longer wait',async()=>{
 const originalFetch=globalThis.fetch,originalKey=process.env.MODEL_API_KEY;
 process.env.MODEL_API_KEY='fixture-not-a-secret';
 try{
  for(const headers of [{'retry-after':''},{'retry-after':'   '},{'retry-after-ms':'','retry-after':' ' }]){
   let calls=0;
   globalThis.fetch=async()=>++calls===1?new Response('{}',{status:429,headers}):new Response('{}');
   const start=performance.now();await metaFetch('/models');assert.equal(calls,2);assert.ok(performance.now()-start>=450,'blank header should use the default backoff');
  }
  let calls=0;
  globalThis.fetch=async()=>{calls++;return new Response('{}',{status:429,headers:{'retry-after-ms':'','retry-after':'11'}});};
  await assert.rejects(()=>metaFetch('/models'),error=>error.status===429);assert.equal(calls,1,'blank millisecond header must not override eleven-second wait');
  const controller=new AbortController();calls=0;
  globalThis.fetch=async()=>{calls++;controller.abort(new Error('cancelled'));return new Response('{}',{status:429,headers:{'retry-after':'1'}});};
  await assert.rejects(()=>metaFetch('/models',{signal:controller.signal}),/cancelled/);assert.equal(calls,1,'already aborted backoff must stop without a timer TDZ');
 }finally{globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=originalKey;}
});
