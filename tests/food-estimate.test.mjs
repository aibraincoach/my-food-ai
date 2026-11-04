import test from 'node:test';
import assert from 'node:assert/strict';
process.env.MODEL_API_BASE_URL='http://127.0.0.1:1/v1';process.env.MODEL_API_KEY='offline-meta';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-trace';
const {estimateFood}=await import('../src/lib/fdc/estimate.ts');
const {scaleNutrition}=await import('../src/lib/fdc/nutrients.ts');
const {foodApproximation,approximationLabels}=await import('../src/lib/fdc/approximation-metadata.ts');
const {plainConsumed}=await import('../src/lib/pipeline/wording.ts');
const valid={food:true,basis:'fried cassava cracker',calories:500,protein_g:2,carbs_g:65,fat_g:25,fibre_g:3,sugar_g:1,sodium_mg:600};
async function withPayload(payload,fn){const original=globalThis.fetch;globalThis.fetch=async(input,init)=>{const url=new URL(input);if(url.origin==='https://trace.invalid')return new Response(null,{status:201});assert.equal(url.port,'1');return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(payload)}]}],usage:{input_tokens:1,output_tokens:1}});};try{return await fn();}finally{globalThis.fetch=original;}}
test('non-food refuses a model estimate',async()=>withPayload({...valid,food:false,calories:null},async()=>{assert.equal(await estimateFood('ceramic plate','not food'),null);}));
test('model estimate scales, names its non-USDA source and discloses provenance',async()=>withPayload(valid,async()=>{const food=await estimateFood('kerupuk','fried cassava cracker');const n=scaleNutrition(food,50);assert.equal(n.calories,250);assert.equal(n.proteinG,1);assert.equal(n.sodiumMg,300);assert.match(n.sourceRef,/^estimate:/);const row={name:'kerupuk',source_ref:n.sourceRef,micronutrients:n.micronutrients};assert.deepEqual(foodApproximation(row),{kind:'estimate',basis:valid.basis});assert.match(plainConsumed({calories:n.calories,protein_g:n.proteinG,carbs_g:n.carbsG,fat_g:n.fatG},approximationLabels([row])),/Nutrition for kerupuk is a model estimate, fried cassava cracker\./);}));
test('out-of-range or malformed model nutrition is a provider error',async()=>{for(const bad of [{calories:5000},{protein_g:'2'},{sodium_mg:-1},{fat_g:undefined}])await withPayload({...valid,...bad},async()=>{await assert.rejects(()=>estimateFood('kerupuk',''),error=>error.status===502);});});
const {resolvePortionNutrition,storedNutrition}=await import('../src/lib/nutrition/portion.ts');
const {rescaleStoredNutrition}=await import('../src/lib/nutrition/totals.ts');
function storedDb(row,grams){return{from(table){const q={select(){return q},eq(){return q},abortSignal(){return q},async maybeSingle(){return{data:table==='post_items'?{id:'prior',name:'kerupuk',portion_grams:grams,supersedes:null}:row,error:null,status:200}}};return q;}};}
test('estimated nutrition recovers from unknown to known portions without a USDA request or another model call',async()=>withPayload(valid,async()=>{
 const food=await estimateFood('kerupuk','');
 for(const initialGrams of [null,0,100]){
  let row=storedNutrition(scaleNutrition(food,initialGrams),'prior');
  if(initialGrams===100)row=rescaleStoredNutrition(row,100,null);
  assert.equal(row.calories,null);
  const restored=await resolvePortionNutrition(storedDb(row,null),'post','prior','kerupuk',50);
  assert.equal(restored.calories,250);assert.equal(restored.protein_g,1);assert.equal(restored.sodium_mg,300);
  assert.equal(restored.source_ref,'estimate:'+valid.basis);
  const labels=approximationLabels([{name:'kerupuk',...restored}]);assert.match(plainConsumed(restored,labels),/is a model estimate/);
  // The direct replay rescaling path must recover the same reference too.
  assert.equal(rescaleStoredNutrition(row,null,50).calories,250);
 }
}));
