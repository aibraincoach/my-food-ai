import test from 'node:test';
import assert from 'node:assert/strict';
import {caloriesPerServing,servingGrams} from '../src/lib/fdc/serving.ts';
import {scaleNutrition} from '../src/lib/fdc/nutrients.ts';
const food=(foodNutrients,extra={})=>({fdcId:1,description:'Fixture',dataType:'Foundation',foodNutrients,...extra});
const energy=(nutrientId,value,unitName='KCAL')=>({nutrientId,value,unitName,nutrientName:'Energy'});
for(const id of [2048,2047,1008]){
 test(`picker uses energy ${id} and agrees with logged gram portions`,()=>{
  for(const extra of [{},{dataType:'Branded',servingSize:25,servingSizeUnit:'g'}]){
   const record=food([energy(id,100)],extra),grams=servingGrams(record);
   assert.equal(caloriesPerServing(record),grams);
   assert.equal(caloriesPerServing(record),Math.round(scaleNutrition(record,grams).calories));
  }
 });
}
test('picker shares energy priority and kJ conversion with analysis',()=>{
 for(const record of [food([energy(1008,418.4,'KJ')]),food([energy(2048,418.4,' kj ')]),food([energy(2048,300),energy(1008,100),energy(2047,200)]),food([energy(2048,300),energy(2047,200)])]){
  const expected=Math.round(scaleNutrition(record,100).calories);
  assert.equal(caloriesPerServing(record),expected);
 }
});
test('picker preserves zero and missing energy and does not invent a gram basis',()=>{
 assert.equal(caloriesPerServing(food([energy(2048,0)])),0);
 assert.equal(caloriesPerServing(food([])),null);
 const liquid=food([energy(1008,100)],{dataType:'Branded',servingSize:250,servingSizeUnit:'ml'});
 assert.equal(scaleNutrition(liquid,100).calories,null);
 assert.equal(caloriesPerServing(liquid),null);
});
