import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveFoodMatch} from '../src/lib/fdc/match.ts';

test('food decisions reserve output capacity for reasoning and still reject incomplete responses',async()=>{
 const oldFetch=globalThis.fetch;
 const names=['MODEL_API_KEY','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SECRET_KEY'];
 const saved=Object.fromEntries(names.map(name=>[name,process.env[name]]));
 process.env.MODEL_API_KEY='fixture-only';process.env.NEXT_PUBLIC_SUPABASE_URL='https://trace.test';process.env.SUPABASE_SECRET_KEY='fixture-only';
 const candidate={fdcId:7,description:'Carrots, raw',dataType:'Foundation',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:41}]};
 const requests=[];let forceIncomplete=false;let abortDuringResponse;
 const reasoningTokens=5000,jsonTokens=54;
 const db={from(){return{select(){return{eq(){return{abortSignal(){return this},async maybeSingle(){return{data:{response:{kind:'fdc-search-v2',query:'raw carrots',payload:{foods:[candidate]}}},error:null}}}}}}}}};
 globalThis.fetch=async(input,init)=>{
  const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  if(url.startsWith('https://trace.test/rest/v1/model_calls'))return new Response(null,{status:201});
  if(new URL(url).pathname.endsWith('/responses')){
   const body=JSON.parse(init.body);requests.push(body);
   if(abortDuringResponse)abortDuringResponse.abort();
   if(forceIncomplete||abortDuringResponse||body.max_output_tokens<reasoningTokens+jsonTokens)return Response.json({status:'incomplete',incomplete_details:{reason:'max_output_tokens'},output:[{type:'reasoning'},{type:'message',content:[{type:'output_text',text:JSON.stringify({id:999,query:null,reason:'parseable but incomplete'})}]}],usage:{input_tokens:332,output_tokens:body.max_output_tokens}});
   return Response.json({status:'completed',output:[{type:'reasoning'},{type:'message',content:[{type:'output_text',text:JSON.stringify({id:7,query:null,reason:'same identity'})}]}],usage:{input_tokens:332,output_tokens:reasoningTokens+jsonTokens}});
  }
  throw Error('Unexpected network destination');
 };
 try{
  assert.equal((await resolveFoodMatch(db,'raw carrots'))?.fdcId,7);
  assert.equal(requests.length,2);assert.deepEqual(requests.map(r=>r.max_output_tokens),[4096,8192]);
  assert.equal(requests[0].text.format.strict,true);
  forceIncomplete=true;
  await assert.rejects(resolveFoodMatch(db,'raw carrots'),error=>error.status===502&&/did not complete/.test(error.message));
  assert.equal(requests.length,4);
  abortDuringResponse=new AbortController();
  await assert.rejects(resolveFoodMatch(db,'raw carrots','',abortDuringResponse.signal),error=>error.status===503&&/budget was exhausted/.test(error.message));
  assert.equal(requests.length,5);
 }finally{globalThis.fetch=oldFetch;for(const name of names){if(saved[name]===undefined)delete process.env[name];else process.env[name]=saved[name];}}
});
