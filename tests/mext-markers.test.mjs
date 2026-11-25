import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {sumNutrition,sumMicronutrients,requireStoredNutrition} from '../src/lib/nutrition/totals.ts';
import {mealSummaryMessage,parseCommentMessage,formatCommentMessage} from '../src/lib/posts/comment-message.ts';
import {nutritionTranslator} from '../src/i18n/nutrition.ts';
import {cardTranslator} from '../src/i18n/card.ts';
import {cardDataFromRow} from '../src/lib/pipeline/card-data.ts';
import {ResultsCard} from '../src/components/ResultsCard.tsx';
const zeros={calories:0,protein_g:0,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0};
const nutrient=(marker,value=null)=>({nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',basis:'portion',value,...(marker?{marker}:{})});
const trace={...zeros,calories:null,name:'Trace food',portion_grams:100,source_ref:'mext:01088',micronutrients:[nutrient('trace')]};
test('trace-only macros are known with null source values; measured zero clears traceOnly, including nested day totals',()=>{
 const t=sumNutrition([trace]);assert.equal(t.calories,0);assert.equal(t.missing,undefined);assert.deepEqual(t.trace,{calories:['Trace food']});assert.deepEqual(t.traceOnly,['calories']);assert.equal(trace.calories,null);
 const nested=sumNutrition([t,sumNutrition([{...trace,name:'Other trace'}])]);assert.deepEqual(nested.trace.calories,['Trace food','Other trace']);assert.deepEqual(nested.traceOnly,['calories']);
 const mixed=sumNutrition([nested,zeros]);assert.equal(mixed.calories,0);assert.equal(mixed.traceOnly,undefined);assert.deepEqual(mixed.trace,nested.trace);
 const unknown=sumNutrition([trace,{...trace,name:'Unmeasured',micronutrients:[nutrient('not_measured')]}]);assert.equal(unknown.calories,0);assert.deepEqual(unknown.missing,{calories:['Unmeasured']});
});
test('micronutrient trace, unavailable and measured zero remain distinct',()=>{
 const item=(name,marker,value)=>({name,micronutrients:[nutrient(marker,value)]});
 assert.deepEqual(sumMicronutrients([item('A','trace')])[0],{name:'Energy',unit:'KCAL',value:0,trace:['A'],traceOnly:true});
 const mixed=sumMicronutrients([item('A','trace'),item('B',null,0)])[0];assert.equal(mixed.value,0);assert.equal(mixed.traceOnly,undefined);assert.deepEqual(mixed.trace,['A']);
 assert.deepEqual(sumMicronutrients([item('A','not_measured')])[0].unavailable,['A']);
});
test('stored markers require a null value and an explicitly supported marker',()=>{
 const row={...zeros,post_item_id:'fixture',source_ref:'mext:01088',micronutrients:[nutrient('trace')]};
 assert.equal(requireStoredNutrition(row),row);
 for(const entry of [nutrient('trace',0),nutrient('other'),nutrient('not_measured',1)])assert.throws(()=>requireStoredNutrition({...row,micronutrients:[entry]}),/invalid/);
});
test('structured summaries preserve markers as values and render trace versus mixed zero in both languages',()=>{
 for(const locale of ['en','ja']){
  const t=nutritionTranslator(locale),only=mealSummaryMessage(sumNutrition([trace])),mixed=mealSummaryMessage(sumNutrition([trace,zeros]));
  assert.deepEqual(only.values.totals.traceOnly,['calories']);
  assert.ok(formatCommentMessage(only,t,locale).includes(locale==='ja'?'微量':'trace'));
  assert.ok(formatCommentMessage(mixed,t,locale).includes(t('includesTraceAmounts')));
  const bad=structuredClone(only);bad.values.totals.traceOnly=['invented'];assert.throws(()=>parseCommentMessage(bad),/invalid/);
  const badNames=structuredClone(only);badNames.values.totals.trace={calories:[1]};assert.throws(()=>parseCommentMessage(badNames),/invalid/);
 }
});
test('live card trace and the exact Japanese credit survive rich-text tag boundaries',()=>{
 for(const locale of ['en','ja']){
  const props={t:cardTranslator(locale),tn:nutritionTranslator(locale),locale};
  const data=cardDataFromRow({items:[trace]},locale,props);
  const html=renderToStaticMarkup(React.createElement(ResultsCard,{...props,data}));
  const visible=html.replace(/<[^>]*>/g,'');
  assert.ok(visible.includes(locale==='ja'?'微量':'trace'));
  if(locale==='ja')assert.ok(visible.includes('日本食品標準成分表（八訂）増補2023年から引用（又は出典）'));
  assert.ok(visible.includes('My Food AI'));
  assert.equal(cardDataFromRow({items:[{...trace,source_ref:'12345',micronutrients:[],calories:100}]},locale,props).mext,undefined);
 }
});
