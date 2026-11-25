import {nutrientsTranslator} from '../src/i18n/nutrients.ts';
import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{nutritionTableRows,formatTableNutrient}from'../src/lib/nutrition/table.ts';import{nutritionTranslator}from'../src/i18n/nutrition.ts';
const data=JSON.parse(fs.readFileSync(new URL('./fixtures/nutrition-table-goldens.json',import.meta.url)));
for(const locale of['en','ja'])test('fixed '+locale+' nutrient-table labels and unchanged values/order',()=>{
 for(const row of data.cases){const actual=nutritionTableRows(row.items,nutritionTranslator(locale),nutrientsTranslator(locale),locale);assert.deepEqual(JSON.parse(JSON.stringify(actual)),locale==='en'?row.output:row.ja);
  if(locale==='ja')for(const cell of actual){if(['Unmapped USDA fixture','Iron'].includes(cell.name))continue;assert.doesNotMatch(cell.name.replace(/DFE|IU|B\d+|[ACDEK]/g,''),/[A-Za-z]/);}
  assert.doesNotMatch(JSON.stringify(actual),/nutrition\.anItem/);
 }
});
test('the only old table-label change is the approved1186 correction',()=>{
 for(const row of data.cases)assert.deepEqual(row.output,row.before.map(v=>v.name==='Folate (DFE)'?{...v,name:'Folic acid'}:v));
});
test('known ids translate; an unmapped USDA name stays data even when the text matches',()=>{
 const items=[{name:'Fixture food',calories:0,protein_g:0,carbs_g:0,fat_g:0,micronutrients:[{nutrientId:1089,nutrientName:'Iron',unitName:'MG',value:1},{nutrientId:999002,nutrientName:'Iron',unitName:'MG',value:2}]}];
 const rows=nutritionTableRows(items,nutritionTranslator('ja'),nutrientsTranslator('ja'),'ja').filter(v=>v.micro);assert.deepEqual(rows.map(v=>[v.name,v.value]),[['鉄',1],['Iron',2]]);
});
test('folic-acid and folate-equivalent labels keep their own stored values',()=>{
 const item={name:'Fixture food',micronutrients:[{nutrientId:1177,nutrientName:'Folate, total',unitName:'UG',value:111},{nutrientId:1186,nutrientName:'Folic acid',unitName:'UG',value:222},{nutrientId:1190,nutrientName:'Folate, DFE',unitName:'UG',value:333}]};
 for(const [locale,names]of[['en',['Folate','Folic acid','Folate (DFE)']],['ja',['葉酸','合成葉酸','葉酸（DFE）']]]){const rows=nutritionTableRows([item],nutritionTranslator(locale),nutrientsTranslator(locale),locale).filter(v=>v.micro);assert.deepEqual(rows.map(v=>[v.name,v.value]),names.map((name,i)=>[name,[111,222,333][i]]));}
});
test('an internal nameless-item marker is displayed in the chosen language',()=>{
 const items=[{micronutrients:[{nutrientId:1089,nutrientName:'Iron',unitName:'MG',value:1}]},{micronutrients:[]}];
 assert.deepEqual(nutritionTableRows(items,nutritionTranslator('ja'),nutrientsTranslator('ja'),'ja').find(v=>v.micro).unavailable,['食品']);assert.deepEqual(nutritionTableRows(items,nutritionTranslator('en'),nutrientsTranslator('en'),'en').find(v=>v.micro).unavailable,['an item']);
});
test('table precision requires locale and retains fixed English output',()=>{
 for(const locale of['en','ja'])for(const [n,expected]of[[0,'0'],[0.001,'<0.01'],[0.126,'0.13'],[1234.567,'1,234.57']])assert.equal(formatTableNutrient(n,locale),expected);
 assert.throws(()=>formatTableNutrient(1,undefined),/locale is required/);
});
