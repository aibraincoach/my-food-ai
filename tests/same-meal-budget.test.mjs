import test from 'node:test';import assert from 'node:assert/strict';
import {confirmSameMeal} from '../src/lib/meta/same-meal.ts';
const context={prior:'A past meal',currentCaption:'A meal',pastCaption:'A meal'};
test('same-meal confirmation budgets reasoning, rejects incomplete booleans and validates the final type',async()=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.MODEL_API_KEY;process.env.MODEL_API_KEY='fixture-only';
 const requests=[];let mode='reasoning';const reasoningTokens=2500,jsonTokens=8;
 globalThis.fetch=async(input,init)=>{
  const path=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url).pathname;
  if(path.endsWith('/rest/v1/model_calls'))return new Response(null,{status:201});
  assert.equal(path,'/v1/responses');const body=JSON.parse(init.body);requests.push(body);
  const incomplete=mode==='incomplete'||body.max_output_tokens<reasoningTokens+jsonTokens;
  const text=mode==='string'?JSON.stringify({same_meal:'true'}):mode==='extra'?JSON.stringify({same_meal:true,extra:true}):mode==='false'?JSON.stringify({same_meal:false}):mode==='invalid'?'{':JSON.stringify({same_meal:true});
  return Response.json({status:incomplete?'incomplete':'completed',output:[{type:'message',content:[mode==='refusal'?{type:'refusal',refusal:'declined'}:{type:'output_text',text}]}]});
 };
 try{
  assert.equal(await confirmSameMeal([],context),true);assert.deepEqual(requests.map(r=>r.max_output_tokens),[2048,8192]);
  for(const next of ['incomplete','string','extra','false','invalid','refusal']){mode=next;assert.equal(await confirmSameMeal([],context),false,next);}
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=oldKey;}
});
