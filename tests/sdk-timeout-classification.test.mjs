import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
// tsx loads this project's TS as CommonJS. Use the same installed SDK export
// condition as the app, not a second ESM class with a different identity.
const {APIConnectionError,APIConnectionTimeoutError}=createRequire(import.meta.url)('openai/core/error');
import {isRetriable} from '../src/lib/worker/errors.ts';
test('actual SDK timeout is retryable despite its generic name and absent cause',()=>{
 const timeout=new APIConnectionTimeoutError();
 assert.equal(timeout.name,'Error');assert.equal(timeout.cause,undefined);assert.equal(timeout.status,undefined);
 assert.equal(isRetriable(timeout),true);
 assert.equal(isRetriable(new Error('wrapped',{cause:timeout})),true);
});
test('SDK terminal TLS/configuration causes remain terminal and HTTP client errors win',()=>{
 for(const code of ['CERT_HAS_EXPIRED','ERR_INVALID_URL']){
  const cause=Object.assign(new Error('terminal configuration'),{code});
  assert.equal(isRetriable(new APIConnectionError({cause})),false);
 }
 const timeout=new APIConnectionTimeoutError();
 for(const status of [400,408,409])assert.equal(isRetriable(Object.assign(new Error('client error',{cause:timeout}),{status})),false);
});

test('the configured SDK client emits a timeout that the worker can retry',async()=>{
 const {createMetaClient}=await import('../src/lib/meta/client.ts');
 const original=globalThis.fetch,key=process.env.MODEL_API_KEY;process.env.MODEL_API_KEY='fixture';let calls=0;
 try{
  globalThis.fetch=async()=>{calls++;throw new DOMException('request timed out','AbortError');};
  await assert.rejects(()=>createMetaClient().models.list(),error=>error instanceof APIConnectionTimeoutError&&isRetriable(error));
  assert.equal(calls,2);
  calls=0;const tls=Object.assign(new Error('certificate invalid'),{code:'CERT_HAS_EXPIRED'});
  globalThis.fetch=async()=>{calls++;throw new TypeError('fetch failed',{cause:tls});};
  await assert.rejects(()=>createMetaClient().models.list(),error=>!isRetriable(error)&&error.cause?.cause===tls);
  assert.equal(calls,2); // SDK maxRetries=1 is retained; worker must not requeue TLS.
 }finally{globalThis.fetch=original;if(key===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=key;}
});
