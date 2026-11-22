import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
process.env.MODEL_API_BASE_URL='http://127.0.0.1:1/v1';process.env.MODEL_API_KEY='offline-script';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-trace';
const {resolveFoodMatchDetailed}=await import('../src/lib/fdc/match.ts');
const {FDC_SEARCH_CACHE_KIND}=await import('../src/lib/fdc/client.ts');
const {scaleNutrition}=await import('../src/lib/fdc/nutrients.ts');
const {approximationLabels}=await import('../src/lib/fdc/approximation-metadata.ts');
const {plainConsumed}=await import('../src/lib/pipeline/wording.ts');
const fixture=JSON.parse(readFileSync(new URL('./fixtures/fdc/fried-cempedak.json',import.meta.url),'utf8'));
fixture.results=Object.fromEntries(Object.entries(fixture.queries).map(([query,ids])=>[query,ids.map(id=>fixture.foods.find(food=>food.fdcId===id))]));
const target=168190;
// Worst-case scripted chooser, not a claim about the model used in production.
async function run(mode){
 const original=globalThis.fetch,offered=[],trace=[];
 const db={from(table){assert.equal(table,'fdc_cache');let key;return{select(){return this;},eq(_column,value){key=value;return this;},abortSignal(){return this;},async maybeSingle(){const query=key.slice(FDC_SEARCH_CACHE_KIND.length+1);assert.ok(query in fixture.results,query);return{data:{response:{kind:FDC_SEARCH_CACHE_KIND,query,payload:{foods:fixture.results[query]}}},error:null};}};}};
 globalThis.fetch=async(input,init)=>{
  const url=new URL(input),body=JSON.parse(init?.body||'{}');
  if(url.origin==='https://trace.invalid'){trace.push(body);return new Response(null,{status:201});}
  assert.equal(url.origin,'http://127.0.0.1:1','no live provider request');
  const schema=body.text.format.name,request=JSON.parse(body.input[0].content[0].text);
  if(request.candidates)offered.push({schema,ids:request.candidates.map(food=>food.id)});
  const allowed=request.candidates?.some(food=>food.id===target);
  let answer;
  if(schema==='search_query')answer=allowed&&mode==='exact'?{id:target,query:null,query_food:null,reason:'Script chooses syrup whenever offered'}:{id:null,query:request.current_query==='fried cempedak'?'jackfruit':null,query_food:request.current_query==='fried cempedak'?'jackfruit':null,reason:'Script has no compatible exact record'};
  else if(schema==='closest_food')answer={id:allowed?target:null,reason:'Script chooses syrup whenever offered'};
  else{assert.equal(schema,'nutrition_estimate');answer={food:true,drink:'not a drink',basis:'scripted fried fruit and batter',calories:250,protein_g:3,carbs_g:37,fat_g:10,fibre_g:2,sugar_g:12,sodium_mg:50,caffeine_mg:0};}
  return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(answer)}]}]});
 };
 try{
  const resolved=await resolveFoodMatchDetailed(db,'fried cempedak','Synthetic fried cempedak, 165 g',undefined,{approximate:true});
  const scaled=scaleNutrition(resolved.food,165,resolved.unavailable);
  const nutrition={name:'fried cempedak',source_ref:scaled.sourceRef,micronutrients:scaled.micronutrients};
  const summary=plainConsumed({calories:scaled.calories,protein_g:scaled.proteinG,carbs_g:scaled.carbsG,fat_g:scaled.fatG},approximationLabels([nutrition]));
  return{resolved,summary,offered,trace};
 }finally{globalThis.fetch=original;}
}
for(const mode of ['exact','closest'])test(`syrup-packed jackfruit never reaches the ${mode} chooser for fried cempedak; existing declared estimate note remains`,async()=>{
  const {resolved,summary,offered}=await run(mode);
  if(process.env.PACKED_REPRO_OUT)writeFileSync(process.env.PACKED_REPRO_OUT+'/'+mode+'.json',JSON.stringify({resolved,summary,offered},null,2));
  assert.ok(offered.length>0);
  assert.equal(offered.some(call=>call.ids.includes(target)),false,'syrup record must be refused before either choice');
  assert.equal(resolved.food.approximation.kind,'estimate');
  assert.match(summary,/Nutrition for fried cempedak is a model estimate, scripted fried fruit and batter\./);
});
