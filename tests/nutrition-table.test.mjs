import test from 'node:test';
import assert from 'node:assert/strict';
import {nutritionTableRows,formatTableNutrient} from '../src/lib/nutrition/table.ts';
const item={id:'food',name:'Meal',portion_grams:100,calories:463,protein_g:32,carbs_g:36,fat_g:22,fibre_g:5,sugar_g:5,sodium_mg:210,micronutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:463},{nutrientId:1003,nutrientName:'Protein',unitName:'G',value:32},{nutrientId:1004,nutrientName:'Total lipid (fat)',unitName:'G',value:22},{nutrientId:1089,nutrientName:'Iron, Fe',unitName:'MG',value:2.1},{nutrientId:1106,nutrientName:'Vitamin A, RAE',unitName:'UG',value:560}]};
test('expanded nutrients show core macros once and normalize micronutrient labels and units',()=>{
 const rows=nutritionTableRows([item]);assert.equal(rows.filter(row=>row.name==='Protein').length,1);assert.equal(rows.some(row=>row.name==='Energy'||row.name==='Total lipid (fat)'),false);
 assert.deepEqual(rows.find(row=>row.name==='Iron'),{name:'Iron',unit:'mg',value:2.1,micro:true});
 assert.equal(rows.find(row=>row.name==='Vitamin A').unit,'µg');assert.equal(formatTableNutrient(2.1),'2.1');assert.equal(formatTableNutrient(.004),'<0.01');
});
test('missing micronutrients retain their unavailable-food attribution rather than becoming zero',()=>{
 const rows=nutritionTableRows([item,{...item,id:'unknown',name:'Unknown food',micronutrients:[]}]);const iron=rows.find(row=>row.name==='Iron');assert.equal(iron.value,2.1);assert.deepEqual(iron.unavailable,['Unknown food']);
});
