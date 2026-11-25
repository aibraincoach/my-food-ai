import test from 'node:test';
import assert from 'node:assert/strict';
import {scaleNutrition} from '../src/lib/fdc/nutrients.ts';
import {storedEstimateFood} from '../src/lib/fdc/approximation-metadata.ts';
import * as totals from '../src/lib/nutrition/totals.ts';
const read=totals.requireStoredNutrition??totals.normalizeStoredNutrition; // Same behavior probe on the base.
const food={fdcId:0,description:'Model estimate: fixture',dataType:'Estimate',approximation:{kind:'estimate',basis:'fixture'},foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:200},{nutrientId:1003,nutrientName:'Protein',unitName:'G',value:10}]};
const row=n=>({post_item_id:'fixture',source_ref:n.sourceRef,calories:n.calories,protein_g:n.proteinG,carbs_g:n.carbsG,fat_g:n.fatG,micronutrients:n.micronutrients});
test('the writer always stores one provenance tag and top-level retained density',()=>{
 const previous=process.env.NUTRITION_COMPACT_WRITE;
 try{for(const flag of [undefined,'0','1']){
  if(flag===undefined)delete process.env.NUTRITION_COMPACT_WRITE;else process.env.NUTRITION_COMPACT_WRITE=flag;
  for(const grams of [null,0,50]){
   const n=scaleNutrition(food,grams);assert.equal(n.micronutrients.filter(e=>e.approximation).length,1);
   assert.deepEqual(n.micronutrients.map(e=>e.per100),[200,10]);
   assert.ok(n.micronutrients.every(e=>!e.approximation||!Object.hasOwn(e.approximation,'per100')));
   assert.deepEqual(storedEstimateFood(row(n)).foodNutrients.map(e=>e.value),[200,10]);
  }
 }}finally{if(previous===undefined)delete process.env.NUTRITION_COMPACT_WRITE;else process.env.NUTRITION_COMPACT_WRITE=previous;}
});
test('current consumed arrays retain values and portion-only edits scale once',()=>{
 const current=row(scaleNutrition(food,50));assert.deepEqual(read(current),current);
 const scaled=totals.rescaleStoredNutrition(current,50,75);assert.equal(scaled.calories,150);assert.equal(scaled.protein_g,7.5);assert.equal(scaled.micronutrients[0].per100,200);
});
test('old unscaled FDC arrays and malformed containers fail instead of being reconstructed or discarded',()=>{
 const current=row(scaleNutrition(food,50));
 for(const nutrients of [food.foodNutrients,{},null,[{name:'Iron',value:1,unit:'mg'}]])assert.throws(()=>read({...current,micronutrients:nutrients}),/Stored nutrition format/);
});
test('nested estimate density is not a second reader',()=>{
 const current=row(scaleNutrition(food,50));const old={...current,micronutrients:current.micronutrients.map(({per100,approximation:_tag,...e})=>({...e,approximation:{kind:'estimate',basis:'fixture',sourceRef:current.source_ref,per100}}))};
 assert.equal(storedEstimateFood(old),null);assert.throws(()=>totals.rescaleStoredNutrition(old,50,75),/density is unavailable/);
});
test('an estimate without retained density fails visibly rather than choosing a new reference',()=>{
 const current=row(scaleNutrition(food,50));const broken={...current,micronutrients:current.micronutrients.map(({per100:_value,...e})=>e)};
 assert.throws(()=>totals.rescaleStoredNutrition(broken,50,75),/density is unavailable/);
});
