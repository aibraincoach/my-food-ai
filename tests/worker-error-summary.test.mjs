import test from 'node:test';
import assert from 'node:assert/strict';
import {drainOnce} from '../src/lib/worker/drain.ts';
import {MetaApiError} from '../src/lib/meta/client.ts';
import {failureMessageKey} from '../src/lib/worker/failure-message.ts';
const job={id:'11111111-1111-4111-8111-111111111111',post_id:'22222222-2222-4222-8222-222222222222',kind:'fixture',payload:{},attempts:3};
function fixture(thrown){const calls=[];return {calls,admin:{rpc:async(name,args)=>{calls.push({name,args});return{name,data:name==='claim_owned_job'?job:null,error:null};}},handlers:{fixture:async()=>{throw thrown;}}};}
for(const status of [429,503,999])test('drain preserves only the recorded Meta status '+status,async()=>{
 const f=fixture(new MetaApiError(status,'sam: PRIVATE_BODY /private/path alice@example.com'));
 await drainOnce(f.admin,f.handlers);const failed=f.calls.find(c=>c.name==='fail_job');
 assert.equal(failed.args.p_message,'meta: analysis request failed with '+status+'.');
 assert.equal(failureMessageKey(failed.args.p_message),'failureAnalysisRefused');
 assert.ok(!JSON.stringify(failed).includes('PRIVATE_BODY'));assert.ok(!JSON.stringify(failed).includes('alice@example.com'));
});
for(const status of [undefined,NaN,Infinity,-1,99,503.5,1000])test('invalid Meta status remains an honest prefix-only summary: '+status,async()=>{
 const f=fixture(new MetaApiError(status,'sam: PRIVATE_BODY'));await drainOnce(f.admin,f.handlers);
 assert.equal(f.calls.find(c=>c.name==='fail_job').args.p_message,'meta: analysis request failed.');
});
test('a thrown non-Error value stores only the exact worker category',async()=>{
 const f=fixture({private:'PRIVATE_BODY'});await drainOnce(f.admin,f.handlers);assert.equal(f.calls.find(c=>c.name==='fail_job').args.p_message,'worker error.');
});
