import test from 'node:test';import assert from 'node:assert/strict';
import {searchFoods} from '../src/lib/fdc/client.ts';import {traceNutritionReuse} from '../src/lib/fdc/match.ts';
test('network lookup, cache reuse and copied nutrition each write labelled provenance without extra lookup',async()=>{
 const previousFetch=globalThis.fetch,previousUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,previousKey=process.env.SUPABASE_SECRET_KEY,previousFdc=process.env.FDC_API_KEY;
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://trace.test';process.env.SUPABASE_SECRET_KEY='fixture-only';process.env.FDC_API_KEY='fixture-only';
 const records=[],cache=new Map();let network=0;
 const foods=[{fdcId:7,description:'Carrots, raw',dataType:'Foundation',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:41}]}];
 globalThis.fetch=async(input,init)=>{
  const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  if(url.startsWith('https://trace.test/rest/v1/model_calls')){records.push(JSON.parse(init.body));return new Response(null,{status:201});}
  if(url.startsWith('https://api.nal.usda.gov/')){network++;return Response.json({foods});}
  throw Error('Unexpected network destination');
 };
 const db={from(){return{select(){return{eq(_key,value){return{async maybeSingle(){return{data:cache.has(value)?{response:cache.get(value)}:null,error:null}}}}}},async upsert(row){cache.set(row.query,row.response);return{error:null}}}}};
 try{
  assert.equal((await searchFoods(db,'raw carrots'))[0].fdcId,7);
  assert.equal((await searchFoods(db,'raw carrots'))[0].fdcId,7);
  await traceNutritionReuse('raw carrots',{source_ref:'7'},'copied','fixture-item');
  assert.equal(network,1);assert.equal(records.length,3);
  assert.deepEqual(records.map(r=>JSON.parse(r.request_text).source),['network','cache','copied']);
  assert.equal(records[2].fdc_id,7);assert.equal(JSON.parse(records[2].request_text).sourceItem,'fixture-item');
 }finally{globalThis.fetch=previousFetch;if(previousUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=previousUrl;if(previousKey===undefined)delete process.env.SUPABASE_SECRET_KEY;else process.env.SUPABASE_SECRET_KEY=previousKey;if(previousFdc===undefined)delete process.env.FDC_API_KEY;else process.env.FDC_API_KEY=previousFdc;}
});
