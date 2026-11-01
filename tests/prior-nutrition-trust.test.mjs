import test from 'node:test';import assert from 'node:assert/strict';
import {priorNutritionTrusted} from '../src/lib/pipeline/prior-nutrition.ts';
import {FOOD_MATCH_VERSION} from '../src/lib/fdc/version.ts';
const nutrition={calories:130,protein_g:2,carbs_g:28,fat_g:0,source_ref:'7'};
const item={name:'Rice',item_nutrition:[nutrition]};
const trace=(request={},response={},extra={})=>({request_text:JSON.stringify({event:'food_resolution',name:'Rice',matcherVersion:FOOD_MATCH_VERSION,...request}),response_text:JSON.stringify({source:'selected',...response}),fdc_id:7,error:null,started_at:'2026-10-31T00:00:00Z',...extra});
test('only complete current-version nutrition with selected matching provenance is reusable',()=>{
 assert.equal(priorNutritionTrusted([item],[trace()]),true);
 assert.equal(priorNutritionTrusted([{...item,item_nutrition:JSON.stringify(nutrition)}],[trace()]),false);
 for(const key of ['calories','protein_g','carbs_g','fat_g'])for(const invalid of [null,undefined,NaN,Infinity,-1])assert.equal(priorNutritionTrusted([{...item,item_nutrition:[{...nutrition,[key]:invalid}]}],[trace()]),false);
 assert.equal(priorNutritionTrusted([item],[trace({matcherVersion:'legacy'})]),false);
 assert.equal(priorNutritionTrusted([item],[trace({matcherVersion:'fdc-reference-v2'})]),false,'pre-component-coverage decisions cannot authorize reuse');
 assert.equal(priorNutritionTrusted([item],[trace({name:'Other food'})]),false);
 assert.equal(priorNutritionTrusted([item],[trace({}, {},{fdc_id:8})]),false);
 assert.equal(priorNutritionTrusted([item],[trace({event:undefined,source:'cache'})]),false);
 assert.equal(priorNutritionTrusted([item],[trace({}, {source:'unavailable'})]),false);
 assert.equal(priorNutritionTrusted([item],[]),false);assert.equal(priorNutritionTrusted([],[]),false);
 assert.equal(priorNutritionTrusted([{...item,item_nutrition:[{...nutrition,calories:0,protein_g:0,carbs_g:0,fat_g:0}]}],[trace()]),true);
});
test('validated copied provenance chains retain the exact food source and latest decisions win',()=>{
 const copied=trace({event:'nutrition_reuse',source:'copied',sourceItem:'source-item'},{source:'copied',source_ref:'7'});
 assert.equal(priorNutritionTrusted([item],[copied]),true);
 assert.equal(priorNutritionTrusted([item],[trace({event:'nutrition_reuse',source:'copied',sourceItem:null},{source:'copied',source_ref:'7'})]),false);
 assert.equal(priorNutritionTrusted([item],[trace({event:'nutrition_reuse',source:'retained'},{source:'retained',source_ref:'7'})]),false);
 assert.equal(priorNutritionTrusted([item],[trace({event:'nutrition_reuse',source:'copied'},{source:'copied',source_ref:'8'})]),false);
 const newer=trace({matcherVersion:'legacy'},{},{started_at:'2026-10-31T01:00:00Z'});
 assert.equal(priorNutritionTrusted([item],[trace(),newer]),false);
 assert.equal(priorNutritionTrusted([item,{name:'Egg',item_nutrition:[nutrition]}],[trace()]),false);
});
