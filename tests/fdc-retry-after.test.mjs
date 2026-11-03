// node --import tsx --test tests/fdc-retry-after.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { fdcFetch, fdcRetryAfter, FdcRateLimited } from '../src/lib/fdc/client.ts';
import { traceContext } from '../src/lib/trace/context.ts';

async function server(handler, run) {
 const app=createServer(handler);app.listen(0,'127.0.0.1');await once(app,'listening');
 try {await run(`http://127.0.0.1:${app.address().port}`);}finally{app.closeAllConnections();await new Promise(resolve=>app.close(resolve));}
}
test('Retry-After accepts seconds and HTTP dates, rejects malformed values',()=>{
 const now=Date.parse('2026-11-03T00:00:00Z');
 assert.equal(fdcRetryAfter('2',now),2);assert.equal(fdcRetryAfter('Tue, 03 Nov 2026 00:00:05 GMT',now),5);
 assert.equal(fdcRetryAfter('Mon, 02 Nov 2026 23:59:00 GMT',now),0);assert.equal(fdcRetryAfter('bad',now),null);assert.equal(fdcRetryAfter(null,now),null);
});
test('a real local 429 Retry-After:2 waits before the successful retry',async()=>{
 const times=[];
 await server((_request,response)=>{times.push(Date.now());response.writeHead(times.length===1?429:200,times.length===1?{'Retry-After':'2'}:{});response.end('done');},async url=>{
  const response=await fdcFetch(url);assert.equal(response.status,200);assert.equal(times.length,2);assert.ok(times[1]-times[0]>=1950);
 });
});
test('long waits and repeat 429s carry a durable retry time instead of a short ladder',async()=>{
 let calls=0;
 await server((_request,response)=>{calls++;response.writeHead(429,{'Retry-After':'120'});response.end();},async url=>{
  const before=Date.now();await assert.rejects(fdcFetch(url),error=>error instanceof FdcRateLimited&&error.retryAt>=before+120000);assert.equal(calls,1);
 });
 calls=0;
 await server((_request,response)=>{calls++;response.writeHead(429,{'Retry-After':calls===1?'0':'90'});response.end();},async url=>{
  await assert.rejects(fdcFetch(url),error=>error instanceof FdcRateLimited&&error.retryAt>Date.now()+89000);assert.equal(calls,2);
 });
});
test('a provider wait that exceeds the worker budget is deferred, not waited out',async()=>{
 let calls=0;
 await server((_request,response)=>{calls++;response.writeHead(429,{'Retry-After':'10'});response.end();},async url=>{
  await assert.rejects(traceContext.run({postId:null,deadlineAt:Date.now()+5000},()=>fdcFetch(url)),FdcRateLimited);assert.equal(calls,1);
 });
});

test('missing or malformed Retry-After uses a durable default without consuming a failed attempt',async()=>{
 for(const header of [null,'not-a-date']) {
  let calls=0;
  await server((_request,response)=>{calls++;response.writeHead(429,header?{'Retry-After':header}:{});response.end();},async url=>{
   const before=Date.now();await assert.rejects(fdcFetch(url),error=>error instanceof FdcRateLimited&&error.retryAt>=before+60000);assert.equal(calls,1);
  });
 }
});
