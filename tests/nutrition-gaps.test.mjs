import {cardTranslators} from './fixtures/card-translators.mjs';
import {nutritionTranslator} from '../src/i18n/nutrition.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import * as nutrition from '../src/lib/nutrition/totals.ts';
import {plainConsumed} from '../src/lib/pipeline/wording.ts';
import {cardDataFromRow} from '../src/lib/pipeline/card-data.ts';
const complete={calories:218,protein_g:6,carbs_g:30,fat_g:11,fibre_g:0,sugar_g:0,sodium_mg:0};
const items=[{...complete,name:'waffle',portion_grams:75,sodium_mg:null},{...complete,name:'syrup',portion_grams:10,calories:33,protein_g:0,carbs_g:3,fat_g:null}];
test('known calories name only the missing shown nutrient, not unavailable food',()=>{
 const totals=nutrition.sumNutrition(items),text=plainConsumed(totals);
 assert.match(text,/Consumed: 251 kcal/);assert.match(text,/Missing fat for syrup\./);assert.doesNotMatch(text,/unavailable: syrup|Calories unavailable|waffle/);
 assert.equal(nutrition.gapSentence(nutrition.nutritionGaps(totals),nutritionTranslator('en'),'en'),'Missing fat for syrup.');
 assert.equal(cardDataFromRow({items},'en',cardTranslators('en')).gap,'Missing fat for syrup.');
 assert.equal(nutrition.formatConsumed(totals,nutritionTranslator('en'),'en'),'Consumed: 251 kcal · Missing fat for syrup');
 assert.doesNotMatch([nutrition.formatConsumed(totals,nutritionTranslator('en'),'en'),'Approximation follows'].join('. '),/\.\./);
});
test('shown keys only, natural pairs and serial commas, zero and no gaps',()=>{
 const totals=nutrition.sumNutrition([{...complete,name:'X',sodium_mg:null,fibre_g:null,sugar_g:null}]);
 assert.equal(nutrition.gapSentence(nutrition.nutritionGaps(totals),nutritionTranslator('en'),'en'),'');
 assert.equal(nutrition.gapSentence(nutrition.nutritionGaps(totals,['sodium_mg','fibre_g']),nutritionTranslator('en'),'en'),'Missing sodium and fibre for X.');
 assert.equal(nutrition.gapSentence(nutrition.nutritionGaps(totals,['sodium_mg','fibre_g','sugar_g']),nutritionTranslator('en'),'en'),'Missing sodium, fibre, and sugar for X.');
 assert.equal(nutrition.gapSentence(nutrition.nutritionGaps(nutrition.sumNutrition([{...complete,calories:0,fat_g:0}])),nutritionTranslator('en'),'en'),'');
});
test('a missing calorie value keeps its stored no-match reason, without inventing one',()=>{
 const totals=nutrition.sumNutrition([{...complete,name:'mystery',calories:null}]);
 assert.equal(nutrition.gapSentence(nutrition.nutritionGaps(totals),nutritionTranslator('en'),'en'),'Calories unavailable for mystery.');
 const text=plainConsumed(totals,[],[{name:'mystery',sourceRef:'unavailable:no_match:no suitable record'}]);
 assert.match(text,/Calories unavailable for mystery\./);assert.match(text,/No USDA record matched “mystery”\./);
 assert.equal((text.match(/No USDA record/g)||[]).length,1);
 assert.match(plainConsumed({...complete,calories:null},[],[{name:'mystery',sourceRef:'unavailable:no_match:no suitable record'}]),/No USDA record matched “mystery”/);
});
test('every disclosure uses the shared sentence and the old list builder is deleted',()=>{
 // A message key may share the old helper's name. Forbid the old binding/call
 // and list expression, while retaining the guard against rebuilt English.
 const oldListBuilder=/\b(?:const|let|var)\s+unavailableFoods\b|\bunavailableFoods\s*(?:=|\()|Object\.values\s*\(\s*day\?\.totals\.missing/;
 assert.doesNotMatch("tp('unavailableFoods',{foods:row.unavailable.join(', ')})",oldListBuilder);
 for(const oldSource of [
  'const unavailableFoods: string[] = names;',
  'function unavailableFoods(items) { return items; }',
  'unavailableFoods(items)',
  'Object.values(day?.totals.missing).flat()',
 ])assert.match(oldSource,oldListBuilder);
 const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${p}/${e.name}`):/\.tsx?$/.test(e.name)?[`${p}/${e.name}`]:[]);
 for(const path of walk('src')){const source=readFileSync(path,'utf8');assert.doesNotMatch(source,oldListBuilder);
 if(path!=='src/lib/nutrition/totals.ts')assert.doesNotMatch(source,/Nutrition unavailable:|Calories unavailable for|Showing known values\.|Missing \$\{nutrient/);}
});

test('a food with neither calories nor macros uses its durable reason or names the whole gap',()=>{
 const totals=nutrition.sumNutrition([{...complete,name:'X',calories:null,protein_g:null,carbs_g:null,fat_g:null}]);
 assert.equal(nutrition.gapSentence(nutrition.nutritionGaps(totals),nutritionTranslator('en'),'en'),'Nutrition unavailable for X.');
 assert.equal(nutrition.gapSentence(nutrition.nutritionGaps(totals),nutritionTranslator('en'),'en',[{name:'X',sourceRef:'unavailable:no_match:no match'}]),'No USDA record matched “X”.');
});
