import test from 'node:test';
import assert from 'node:assert/strict';
import {APIConnectionError,APIConnectionTimeoutError} from 'openai/core/error';
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
