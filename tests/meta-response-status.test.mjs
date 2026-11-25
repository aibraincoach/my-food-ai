import test from 'node:test';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
import assert from 'node:assert/strict';
import {drainOnce} from '../src/lib/worker/drain.ts';
import {MetaApiError,fetchWithRetry} from '../src/lib/meta/client.ts';
import {adminErrorCode} from '../src/lib/admin/error-code.ts';
async function stored(error){let message;await drainOnce({rpc:async(name,args)=>{if(name==='claim_owned_job')return{data:{id:'fixture',kind:'fixture'},error:null};message=args.p_message;return{data:null,error:null};}},{fixture:async()=>{throw error;}});return message;}
for(const [group,status,message]of [
 ['refusal',500,'meta: model refused the request.'],['invalid output',502,'meta: invalid output.'],['budget',503,'meta: budget exhausted.'],['retry limit',503,'meta: retry limit reached.'],['correction concurrency',503,'A correction arrived while completing this attempt.'],['correction snapshot',503,'Correction snapshot could not be saved.']
])test('synthetic '+group+' has no upstream response status',async()=>{const error=new MetaApiError(status,message);assert.equal(error.responseStatus,undefined);const text=await stored(error);assert.equal(text,'meta: analysis request failed.');assert.equal(adminErrorCode(text),'meta');});
test('a real response 503 is retained through fetchWithRetry and the drain',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('PRIVATE_BODY',{status:503,headers:{'retry-after':'11'}}));
 let error;try{await fetchWithRetry('http://127.0.0.1/private-path',{},1000,'fixture',0);}catch(e){error=e;}
 assert.ok(error instanceof MetaApiError);assert.equal(error.responseStatus,503);assert.equal(await stored(error),'meta: analysis request failed with 503.');assert.equal(adminErrorCode(await stored(error)),'meta 503');
});
test('a real response status survives a failed diagnostic body read',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(new ReadableStream({start(controller){controller.error(Error('PRIVATE_BODY'));}}),{status:400}));
 let error;try{await fetchWithRetry('http://127.0.0.1/private-path',{},1000,'fixture',0);}catch(e){error=e;}
 assert.equal(error.responseStatus,400);assert.equal(await stored(error),'meta: analysis request failed with 400.');
});
test('SAM retains SDK response status and does not promote a synthetic or default status',async t=>{
 const {APIError}=require('openai');const {Responses}=require('openai/resources/responses/responses');
 const {segmentFoodRegions}=await import('../src/lib/meta/sam.ts');
 const previous=process.env.MODEL_API_KEY;process.env.MODEL_API_KEY='local-fixture-key';t.after(()=>{if(previous===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=previous;});
 t.mock.method(globalThis,'fetch',async()=>{throw Error('No network permitted by fixture');});
 const sdk=new APIError(503,{},'PRIVATE_BODY',new Headers());
 for(const [thrown,expected]of [[sdk,503],[Error('PRIVATE_TRANSPORT'),undefined],[Object.assign(Error('PRIVATE_INTERNAL'),{status:503}),undefined]]){
  const mock=t.mock.method(Responses.prototype,'create',async()=>{throw thrown;});
  let error;try{await segmentFoodRegions(new Uint8Array([0]),'image/jpeg',1,1);}catch(e){error=e;}
  assert.ok(error instanceof MetaApiError);assert.equal(error.responseStatus,expected);assert.equal(await stored(error),expected?'meta: analysis request failed with 503.':'meta: analysis request failed.');mock.mock.restore();
 }
});
