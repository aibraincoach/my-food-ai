import test from 'node:test';
import assert from 'node:assert/strict';
import {transcribe} from '../src/lib/meta/transcribe.ts';
test('shared transcription retry preserves audio and session without a nested retry loop',async()=>{
 const original=globalThis.fetch,oldKey=process.env.MODEL_API_KEY;process.env.MODEL_API_KEY='fixture';
 const audio=new Blob([new Uint8Array([1,2,3])],{type:'audio/wav'}),calls=[];
 try{
  globalThis.fetch=async(url,init)=>{const parsed=new URL(url instanceof Request?url.url:String(url));if(parsed.pathname.endsWith('/rest/v1/model_calls'))return new Response(null,{status:201});assert.equal(parsed.pathname,'/v1/asr/transcribe');calls.push({url,init});return calls.length===1?new Response('',{status:429,headers:{'retry-after':'0'}}):Response.json({transcript:'Use half the rice.'});};
  assert.equal(await transcribe(audio,'same-session'),'Use half the rice.');assert.equal(calls.length,2);
  assert.equal(calls[0].url,calls[1].url);assert.match(String(calls[0].url),/sessionId=same-session/);
  assert.equal(calls[0].init.body,calls[1].init.body);
  assert.deepEqual(new Uint8Array(await calls[1].init.body.get('audio').arrayBuffer()),new Uint8Array([1,2,3]));
  calls.length=0;globalThis.fetch=async(url,init)=>{const parsed=new URL(url instanceof Request?url.url:String(url));if(parsed.pathname.endsWith('/rest/v1/model_calls'))return new Response(null,{status:201});assert.equal(parsed.pathname,'/v1/asr/transcribe');calls.push({url,init});return new Response('',{status:404});};
  await assert.rejects(()=>transcribe(audio,'same-session'),error=>error.status===404);assert.equal(calls.length,1);
 }finally{globalThis.fetch=original;if(oldKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=oldKey;}
});
