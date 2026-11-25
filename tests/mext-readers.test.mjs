import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {importRows} from '../scripts/lib/mext-import.mjs';
import {readMextFood,searchMextFoods} from '../src/lib/mext/client.ts';
import {priorNutritionTrusted} from '../src/lib/pipeline/prior-nutrition.ts';
import {FOOD_MATCH_VERSION} from '../src/lib/fdc/version.ts';
import {photoDrinkProduct} from '../src/lib/intake/photo-drinks.ts';
const rows=importRows(JSON.parse(readFileSync(new URL('./fixtures/mext-source-sample.json',import.meta.url),'utf8')),{});
const rice=rows.find(row=>row.food_number==='01088');
const query=result=>({eq(){return this;},abortSignal(){return this;},maybeSingle:async()=>result});
test('a stored MEXT ref reads its exact opaque key and a missing record fails visibly',async()=>{
 let key;
 const admin={from:table=>{assert.equal(table,'jp_foods');return {select:()=>({eq:(column,value)=>{assert.equal(column,'food_number');key=value;return query({data:rice,error:null});}})};}};
 assert.equal((await readMextFood(admin,'mext:01088')).foodNumber,'01088');assert.equal(key,'01088');
 const missing={from:()=>({select:()=>query({data:null,error:null})})};
 await assert.rejects(readMextFood(missing,'mext:01088'),/reference is missing/);
 await assert.rejects(readMextFood(missing,'1088'),/reference is invalid/);
});
test('a failed MEXT read throws its I/O error and writes a MEXT error trace with no invented identity',async()=>{
 const oldFetch=globalThis.fetch,oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.SUPABASE_SECRET_KEY;
 const calls=[];process.env.NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:9999';process.env.SUPABASE_SECRET_KEY='local-test-key';
 globalThis.fetch=async(input,init)=>{assert.match(String(input),/^http:\/\/127\.0\.0\.1:9999\/rest\/v1\/model_calls/);calls.push(JSON.parse(init.body));return new Response(null,{status:201});};
 try{
  const error={code:'08006',message:'local fixture failure'};
  await assert.rejects(searchMextFoods({rpc:()=>({then:resolve=>resolve({data:null,error,status:503})})},'精白米','cooked rice'),value=>value.status===503&&value.cause===error);
  assert.equal(calls.length,1);const trace=calls[0];assert.equal(trace.kind,'mext');assert.equal(trace.reference_ref,null);assert.equal(trace.fdc_id,null);assert.ok(trace.error);assert.equal(trace.host,'postgres');
 }finally{globalThis.fetch=oldFetch;if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.SUPABASE_SECRET_KEY;else process.env.SUPABASE_SECRET_KEY=oldKey;}
});
test('prior MEXT trust compares exact strings, including leading zeroes, and preserves trace marker proof',()=>{
 const nutrition={calories:null,protein_g:2,carbs_g:30,fat_g:0,source_ref:'mext:01088',micronutrients:[{nutrientId:1008,value:null,basis:'portion',marker:'trace'}]};
 const item={name:'Rice',item_nutrition:[nutrition]};
 const trace={request_text:JSON.stringify({event:'food_resolution',name:'Rice',matcherVersion:FOOD_MATCH_VERSION}),response_text:JSON.stringify({source:'selected'}),fdc_id:null,reference_ref:'mext:01088',error:null,started_at:'2026-11-25T00:00:00Z'};
 assert.equal(priorNutritionTrusted([item],[trace]),true);
 for(const ref of ['mext:1088','1088','01088',null])assert.equal(priorNutritionTrusted([item],[{...trace,reference_ref:ref}]),false);
 assert.equal(priorNutritionTrusted([item],[{...trace,error:'failed'}]),false);
 assert.equal(priorNutritionTrusted([{...item,item_nutrition:[{...nutrition,micronutrients:[]}]}],[trace]),false);
});
test('MEXT facts cannot be coerced into a numeric USDA product id',()=>{
 assert.throws(()=>photoDrinkProduct({nutrition:{source_ref:'mext:01088'}}),/cannot become product/);
});
