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
function storedDb(row,grams,portionText=null){return{from(table){const q={select(){return q},eq(){return q},abortSignal(){return q},async maybeSingle(){return{data:table==='post_items'?{id:'prior',name:'kerupuk',portion_grams:grams,portion_text:portionText,supersedes:null}:row,error:null,status:200}}};return q;}};}
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

test('volume-only estimate edits never turn milliliters into a gram reference',async()=>withPayload(valid,async()=>{
 const food=await estimateFood('kerupuk','');
 const unknown=storedNutrition(scaleNutrition(food,null),'prior');
 for(const text of ['100 ml','200 ml']){
  const result=await resolvePortionNutrition(storedDb(unknown,null,'100 ml'),'post','prior','kerupuk',null,text);
  assert.equal(result.calories,null);assert.equal(result.protein_g,null);assert.match(result.source_ref,/^estimate:/);
  assert.equal(foodApproximation(result).kind,'estimate');
 }
 // A real consumed amount can still scale by its volume ratio, without any
 // inference that the 200 ml correction weighs 200 grams.
 const known=storedNutrition(scaleNutrition(food,50),'prior');
 const doubled=await resolvePortionNutrition(storedDb(known,null,'100 ml'),'post','prior','kerupuk',null,'200 ml');
 assert.equal(doubled.calories,500);assert.equal(doubled.protein_g,2);
 const same=await resolvePortionNutrition(storedDb(known,null,'100 ml'),'post','prior','kerupuk',null,'100 ml');
 assert.equal(same.calories,250);
}));
const {replayCorrection}=await import('../src/lib/worker/jobs/correct.ts');
test('actual correction replay shares volume dispatch and preserves known consumed estimates after removal rebuild',async()=>withPayload(valid,async()=>{
 const food=await estimateFood('kerupuk',''),nutrition=storedNutrition(scaleNutrition(food,50),'prior');
 const item={id:'prior',name:'kerupuk',source:'model',portion_grams:null,portion_text:'100 ml',box:null,mask_path:null,...nutrition};
 const admin={from(table){assert.ok(['post_media','posts'].includes(table),'Replay does not re-query a USDA reference');const q={select(){return q},eq(){return q},order(){return q},abortSignal(){return q},async single(){return{data:{caption:'kerupuk'},error:null,status:200}},then(resolve){return Promise.resolve({data:table==='post_media'?[]:{caption:'kerupuk'},error:null,status:200}).then(resolve)}};return q;}};
 const original=globalThis.fetch;let correctedText;
 globalThis.fetch=async(input,init)=>{const body=JSON.parse(init?.body||'{}');if(body.text?.format?.name==='correct')return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({items:[{name:'kerupuk',portion_text:correctedText,portion_grams:null,region_index:0,keep:null}],reply:'Updated the meal.',needs_input:null})}]}]});return original(input,init);};
 try{for(const [text,calories,protein,sodium] of [['100 ml',250,1,300],['200 ml',500,2,600]]){correctedText=text;const result=await replayCorrection(admin,'post',[item],[],[],false,true);assert.equal(result.rows.length,1);const n=result.rows[0].nutrition;assert.equal(n.calories,calories);assert.equal(n.protein_g,protein);assert.equal(n.sodium_mg,sodium);assert.equal(n.source_ref,nutrition.source_ref);assert.match(plainConsumed(n,result.approximations),/is a model estimate/);}}
 finally{globalThis.fetch=original;}
}));
