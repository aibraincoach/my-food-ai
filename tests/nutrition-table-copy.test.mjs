import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderNutritionTable} from './fixtures/render-nutrition-table.mjs';

const items=[{id:'a',name:'ご飯',calories:null,protein_g:0,carbs_g:0,fat_g:0,micronutrients:[]},{id:'b',name:'豆',calories:null,protein_g:0,carbs_g:0,fat_g:0,micronutrients:[]},{id:'c',name:'豆腐',calories:10,protein_g:0,carbs_g:0,fat_g:0,micronutrients:[{nutrientId:1089,nutrientName:'Iron',unitName:'MG',value:1}]}];
test('USDA-only English table bytes change only in the supplier line',()=>{
 const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/meal-sources-usda-main.json',import.meta.url)));
 const messages=JSON.parse(fs.readFileSync(new URL('../messages/en.json',import.meta.url)));
 const html=renderNutritionTable('en',messages,fixture.items);
 assert.match(html,/Nutrition values from: USDA FoodData Central/);
 const restored=html.replace(/<div class="pt-sheet-top text-label text-muted" data-meal-sources="[^"]*">.*?<\/div>/,'<p class="pt-sheet-top text-label text-muted">'+messages.card.sourceNote+'</p>');
 assert.equal(restored,fixture.html);
});
for(const locale of ['en','ja'])test('rendered '+locale+' table gap and unavailable-food punctuation',()=>{
 const all=JSON.parse(fs.readFileSync(new URL('../messages/'+locale+'.json',import.meta.url)));
 const html=renderNutritionTable(locale,all,items);
 const gap=html.match(/<p class="text-meta text-muted">(.*?)<\/p>/)?.[1];
 assert.ok(gap);
 console.log(JSON.stringify({locale,gap,unavailable:html.match(/(?:・不明：| · unavailable: )[^<]+/)?.[0]}));
 if(locale==='ja'){
  assert.ok(gap.startsWith(all.nutrition.knownValues));
  assert.ok(html.includes('・不明：ご飯、豆'));
  assert.doesNotMatch(gap,/ |, /);
 }else{
  assert.ok(gap.startsWith(all.nutrition.knownValues+' '));
  assert.ok(html.includes(' · unavailable: ご飯, 豆'));
 }
});

for(const locale of ['en','ja'])test('only unmapped USDA name data has a wording marker in '+locale,()=>{
 const all=JSON.parse(fs.readFileSync(new URL('../messages/'+locale+'.json',import.meta.url)));
 const fixtureItems=[{...items[2],micronutrients:[{nutrientId:1089,nutrientName:'Iron',unitName:'MG',value:1},{nutrientId:999002,nutrientName:'Iron',unitName:'MG',value:2}]}];
 const html=renderNutritionTable(locale,all,fixtureItems);
 assert.deepEqual([...html.matchAll(/data-i18n-server-wording="([^"]+)"[^>]*>(.*?)<\/span>/g)].map(match=>[match[1],match[2]]),[['nutrient-name','Iron']]);
 assert.ok(html.includes('<span>'+(locale==='ja'?'鉄':'Iron')+'</span>'));
});
