import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceWriterInventory} from './fixtures/source-writer-inventory.mjs';
import {renderNutritionTable} from './fixtures/render-nutrition-table.mjs';
import {scaleNutrition} from '../src/lib/fdc/nutrients.ts';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/source-writers.json',import.meta.url)));
test('every src source_ref/sourceRef assignment and SQL source-ref site matches the reviewed writer inventory',()=>{
 assert.deepEqual(sourceWriterInventory(),fixture.inventory,'A source writer changed: update its provenance classification, real-render corpus and reviewed inventory together.');
});
for(const locale of ['en','ja'])for(const row of fixture.forms)test(locale+' actual NutritionTable accepts recorded form '+row.form,()=>{
 const messages=JSON.parse(fs.readFileSync(new URL('../messages/'+locale+'.json',import.meta.url)));
 const item={id:'source',name:'Food',calories:10,protein_g:1,carbs_g:1,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0,micronutrients:[],source_ref:row.ref};
 const html=renderNutritionTable(locale,messages,[item]);
 assert.ok(html.includes('<table'));
 if(row.key)assert.ok(html.includes(messages.card[row.key].replace('{food}','Food').replace('{foods}','Food')),row.form);
 else assert.equal(html.includes('Nutrition values from:'),false);
});
for(const locale of ['en','ja'])test(locale+' actual table refuses an unproduced source form',()=>{
 const messages=JSON.parse(fs.readFileSync(new URL('../messages/'+locale+'.json',import.meta.url)));
 assert.throws(()=>renderNutritionTable(locale,messages,[{id:'bad',name:'USDA by name is no proof',source_ref:'invented:unknown',micronutrients:[]}]),/Unknown nutrition source/);
});
test('no-food scaling cannot silently construct a new null source reference',()=>{
 assert.throws(()=>scaleNutrition(null,100),/unavailable nutrition reason/);
 assert.equal(scaleNutrition(null,100,{code:'no_match',detail:'No matching reference.'}).sourceRef,'unavailable:no_match:No matching reference.');
});
