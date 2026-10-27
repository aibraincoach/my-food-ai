// node --import tsx --test tests/nutrition-totals.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {sumNutrition,sumMicronutrients,formatNutrition,formatConsumed} from '../src/lib/nutrition/totals.ts';
const zeros={calories:0,protein_g:0,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0};
test('an unknown item makes only affected meal and day nutrients unknown',()=>{
 const known={...zeros,calories:100,protein_g:8};const unknown={...zeros,calories:null,protein_g:2};
 const meal=sumNutrition([known,unknown]);assert.equal(meal.calories,null);assert.equal(meal.protein_g,10);
 assert.equal(sumNutrition([sumNutrition([known]),meal]).calories,null);
 assert.equal(formatConsumed(meal),'Consumed: — kcal');
 for(const value of [null,undefined,'', '   ','not a number',NaN,Infinity,-Infinity]){
  assert.equal(sumNutrition([{...zeros,calories:value}]).calories,null);
  assert.equal(formatNutrition(value),'—');
 }
});
test('genuine zero, empty meals and numeric database strings retain valid totals',()=>{
 assert.deepEqual(sumNutrition([]),zeros);assert.deepEqual(sumNutrition([zeros]),zeros);
 const meal=sumNutrition([{...zeros,calories:'0',protein_g:'1.5'},{...zeros,calories:'100.5',protein_g:2.5}]);
 assert.equal(meal.calories,100.5);assert.equal(meal.protein_g,4);assert.equal(formatNutrition(0),'0');
 assert.equal(formatConsumed(sumNutrition([zeros])),'Consumed: 0 kcal');
 assert.equal(sumNutrition([{...zeros,calories:Number.MAX_VALUE},{...zeros,calories:Number.MAX_VALUE}]).calories,null);
});
test('micronutrient totals preserve order/units and reject partial totals',()=>{
 const iron=value=>({nutrientId:1089,nutrientName:'Iron',unitName:'MG',value});
 const vitamin=value=>({nutrientId:1106,nutrientName:'Vitamin A',unitName:'UG',value});
 assert.deepEqual(sumMicronutrients([{micronutrients:[iron(1),vitamin(20)]},{micronutrients:[iron(2)]}]),[
  {name:'Iron',unit:'MG',value:3},{name:'Vitamin A',unit:'UG',value:null},
 ]);
 assert.equal(sumMicronutrients([{micronutrients:[iron(1)]},{micronutrients:[]}])[0].value,null);
 assert.equal(sumMicronutrients([{micronutrients:[iron(1)]},{micronutrients:[iron(null)]}])[0].value,null);
 assert.equal(sumMicronutrients([{micronutrients:[iron(0)]},{micronutrients:[iron(0)]}])[0].value,0);
 assert.deepEqual(sumMicronutrients([]),[]);
});

test('duplicate micronutrients count once and conflicting measurements stay unknown',()=>{
 const iron=value=>({nutrientId:1089,nutrientName:'Iron',unitName:'MG',value});
 assert.equal(sumMicronutrients([{micronutrients:[iron(1),iron(1)]},{micronutrients:[iron(2)]}])[0].value,3);
 assert.equal(sumMicronutrients([{micronutrients:[iron(1),iron(2)]},{micronutrients:[iron(2)]}])[0].value,null);
 assert.equal(sumMicronutrients([{micronutrients:[iron(null),iron(1)]}])[0].value,null);
});
