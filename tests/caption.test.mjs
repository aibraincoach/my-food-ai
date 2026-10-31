import test from 'node:test';
import assert from 'node:assert/strict';
import {saveCaption,validCaption} from '../src/lib/posts/caption.ts';

test('caption validation preserves text, permits clearing and rejects invalid data',()=>{
 for(const value of ['', 'two eggs', 'Tonkatsu with curry.'])assert.equal(validCaption(value),true);
 for(const value of [null,{},3,'a'.repeat(2001),'bad\u0000caption'])assert.equal(validCaption(value),false);
});
function db(result){const calls=[];const chain={update(v){calls.push(['update',v]);return chain},eq(k,v){calls.push(['eq',k,v]);return chain},select(v){calls.push(['select',v]);return chain},async maybeSingle(){return result}};return {calls,from(table){calls.push(['from',table]);return chain}};}
test('caption save updates only caption and explicitly scopes ownership',async()=>{
 const client=db({data:{id:'post'},error:null});assert.deepEqual(await saveCaption(client,'owner','post','two eggs'),{status:200,caption:'two eggs'});
 assert.deepEqual(client.calls,[['from','posts'],['update',{caption:'two eggs'}],['eq','id','post'],['eq','user_id','owner'],['select','id']]);
});
test('missing or inaccessible post is not saved, and failures remain failures',async()=>{
 assert.equal((await saveCaption(db({data:null,error:null}),'owner','other','x')).status,404);
 assert.equal((await saveCaption(db({data:null,error:{message:'down'}}),'owner','post','x')).status,500);
 const client=db({});assert.equal((await saveCaption(client,'owner','post',null)).status,400);assert.deepEqual(client.calls,[]);
});
