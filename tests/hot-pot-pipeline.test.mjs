import {correctionSchema} from '../src/lib/prompts/spark/correct-schema.ts';
import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import vm from'node:vm';import ts from'typescript';
import * as policy from'../src/lib/nutrition/hot-pot.ts';
import * as totals from'../src/lib/nutrition/totals.ts';
import * as nutrients from'../src/lib/fdc/nutrients.ts';
import * as leftovers from'../src/lib/pipeline/leftovers.ts';
import {resolveNutritionItems}from'../src/lib/fdc/resolve-items.ts';
import {nutritionUnavailable}from'../src/lib/nutrition/available.ts';
import {readNeedsInput}from'../src/lib/pipeline/needs-input.ts';
import {safeSummary}from'../src/lib/pipeline/wording.ts';
import {approximationLabels}from'../src/lib/fdc/approximation-metadata.ts';
import {matchFood}from'../src/lib/fdc/match.ts';
const food={fdcId:777,description:'Pork, loin, raw',dataType:'Foundation',foodNutrients:[{nutrientId:1008,value:100},{nutrientId:1003,value:10},{nutrientId:1004,value:2},{nutrientId:1005,value:0},{nutrientId:1079,value:0},{nutrientId:2000,value:0},{nutrientId:1093,value:5}].map(n=>({...n,nutrientName:'Fixture '+n.nutrientId,unitName:n.nutrientId===1008?'KCAL':'G'}))};
function harness(file,{caption='Hot pot',original=[],correction}={}){
 const traces=[],matches=[],writes=[];
 const dependencies={
  '@/lib/prompts/spark/correct-schema':{correctionSchema},
  '@/lib/nutrition/hot-pot':policy,'@/lib/nutrition/totals':{...totals,getCurrentItems:async()=>original},
  '@/lib/fdc/nutrients':nutrients,'@/lib/fdc/resolve-items':{resolveNutritionItems},
  '@/lib/fdc/match':{resolveFoodMatchDetailed:async(_db,name,_caption,_signal,options)=>{matches.push({name,options});return{food,unavailable:null};},traceNutritionReuse:async()=>{},nutritionResolutionBudget:()=>AbortSignal.timeout(5000)},
  '@/lib/trace/record':{recordCall:async(_kind,request,fn)=>{const value=await fn();traces.push({request,value});return value;}},
  '@/lib/fdc/approximation-metadata':{approximationLabels},'@/lib/pipeline/leftovers':leftovers,
  '@/lib/nutrition/available':{nutritionUnavailable},'@/lib/pipeline/needs-input':{readNeedsInput},
  '@/lib/nutrition/portion':{resolvePortionNutrition:async()=>{throw Error('Shared zero must not be retained when explicitly counted');}},
  '@/lib/meta/client':{createResponse:async()=>({status:'completed',outputText:JSON.stringify(correction)}),MetaApiError:class extends Error{}},
  './results-card':{renderResultsCard:async()=>false},'@/lib/intake/drinks-from-items':{syncItemDrinks:async()=>{}},
  './wording':{safeSummary},'@/lib/pipeline/wording':{safeSummary},
 };
 const exports={};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(code,{exports,console,AbortSignal,Number,JSON,Map,Set,require:id=>{
  if(dependencies[id])return dependencies[id];
  if(id==='@/lib/worker/errors')return{ioError:message=>new Error(message)};
  if(id==='./pending-items')return{writePendingNames:async()=>{},writePendingKcal:async()=>{}};
  if(id==='@/lib/pipeline/history-budget')return{boundedHistory:rows=>rows};
  return{};
 }});
 const db={from:table=>{const query={select(){return this;},eq(){return this;},abortSignal(){return this;},order(){return this;},single:async()=>({data:{caption},error:null}),then(resolve){return Promise.resolve({data:table==='post_media'?[]:null,error:null}).then(resolve);}};return query;},
 rpc:async(name,args)=>{writes.push({name,args});return{data:false,error:null};}};
 return{exports,db,traces,matches,writes};
}
test('actual persist pipeline publishes zero shared rows,30g thin pork and one consistent total without sauce lookups',async()=>{
 const original={...policy.sharedNutrition('broth'),id:'old-broth',name:'Broth',source_ref:'777',calories:25};
 const h=harness('src/lib/pipeline/persist.ts',{original:[original]});
 const captionOnly=[{name:'Pork for shabu',portionText:'2 thin slices',portionGrams:70,confidence:1},...['Broth','Shabu sauce','Dipping sauce'].map(name=>({name,portionText:'100 g',portionGrams:100,confidence:1}))];
 await h.exports.persistAnalysis(h.db,{postId:'fixture',regions:[],captionOnly,summary:'model numbers ignored'});
 const persisted=h.writes.find(row=>row.name==='persist_approximated_analysis').args;
 assert.equal(persisted.p_items.length,4);assert.equal(persisted.p_items[0].portion_grams,30);
 assert.equal(persisted.p_items[0].nutrition.calories,30);assert.match(persisted.p_summary,/Consumed: 30 kcal/);
 for(const row of persisted.p_items.slice(1)){assert.equal(row.portion_text,'100 g');assert.equal(row.nutrition.calories,0);assert.ok(policy.sharedPotMarker(row.nutrition.source_ref));}
 assert.equal(policy.sharedPotMarker(persisted.p_items[1].nutrition.source_ref).original.source_ref,'777');
 assert.deepEqual(h.matches.map(v=>v.name),['Pork for shabu']);
 assert.equal(h.traces.find(v=>v.request.name==='Pork for shabu').value.modelGrams,70);
});
for(const body of ['I drank some of the broth','I drank all of the broth','I had the broth'])test('actual caption '+body+' resolves the model portion without a shared marker',async()=>{
 const h=harness('src/lib/pipeline/persist.ts',{caption:'Hot pot. '+body});
 await h.exports.persistAnalysis(h.db,{postId:'fixture',regions:[],captionOnly:[{name:'Broth',portionText:'30 g consumed',portionGrams:30,confidence:1}],summary:'ignored'});
 const row=h.writes.find(v=>v.name==='persist_approximated_analysis').args.p_items[0];
 assert.equal(h.matches.length,1);assert.equal(row.portion_grams,30);assert.equal(row.nutrition.calories,30);assert.equal(policy.sharedPotMarker(row.nutrition.source_ref),null);
});
for(const [name,body]of[['Shabu sauce','count the sauce'],['Broth','I drank the broth'],['Broth','I drank some of the broth'],['Broth','I drank all of the broth'],['Shabu sauce','I had some of the sauce']])test('actual correction '+body+' re-resolves and clears marker despite model keep flag',async()=>{
 const n=policy.sharedNutrition(name==='Broth'?'broth':'sauce',{source_ref:'777',calories:30});
 const old={...n,id:'kept',name,portion_text:'30 g',portion_grams:30,box:null,mask_path:null,source:'model'};
 const correction={items:[{name,portion_text:'30 g',portion_grams:30,region_index:0,keep:'kept'}],reply:'counted',needs_input:null};
 const h=harness('src/lib/worker/jobs/correct.ts',{correction});
 const result=await h.exports.replayCorrection(h.db,'fixture',[old],[{author:'user',body}]);
 assert.equal(h.matches.length,1);assert.equal(result.rows[0].nutrition.source_ref,'777');
 assert.equal(result.rows[0].nutrition.calories,30);assert.equal(policy.sharedPotMarker(result.rows[0].nutrition.source_ref),null);
 assert.equal(old.calories,0,'prior snapshot remains unchanged');
});
test('the actual single matcher filters belly before choosing lean and retains its rejection reason',async()=>{
 const belly={...food,fdcId:999,description:'Pork, belly, raw'};
 let candidates;
 const result=await matchFood('Pork for shabu','',{search:async()=>[belly,food],choose:async(_n,_c,foods)=>{candidates=foods;return{id:777,query:null,reason:'lean reference'};}});
 assert.deepEqual(candidates.map(f=>f.fdcId),[777]);assert.equal(result.food.fdcId,777);assert.match(result.reason,/hot-pot:/);
});
