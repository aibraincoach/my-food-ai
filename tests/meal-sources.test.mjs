import test from 'node:test';
import assert from 'node:assert/strict';
import {mealSources} from '../src/lib/nutrition/meal-sources.ts';
import {mergeProduct,productFromFood,barcodeNutrition} from '../src/lib/fdc/barcode-product.ts';
const item=(source_ref,name=source_ref)=>({name,source_ref,micronutrients:[]});
test('only recorded suppliers appear, once in fixed order; copies preserve the list',()=>{
 const estimate={...item('estimate:recipe','Soup'),micronutrients:[{approximation:{kind:'estimate',basis:'recipe',sourceRef:'estimate:recipe'}}]};
 const items=[item('off:123','A'),item('7','B'),item('8','C'),estimate,item('unavailable:no-match:x','D')];
 const expected=[{kind:'usda',foods:['B','C']},{kind:'off',foods:['A']},{kind:'estimate',foods:['Soup']}];
 assert.deepEqual(mealSources(items),expected);assert.deepEqual(mealSources(structuredClone(items)),expected);
 assert.deepEqual(mealSources([item('7','A'),item('7','A')]),[{kind:'usda',foods:['A']}]);
});
test('new corrections, old mixed corrections, water and old unrecorded rows remain distinct',()=>{
 for(const [ref,kinds] of [['barcode-own:123',['saved']],['barcode:123',['unrecorded']],['label:reading',['label']],['mext:01088',['mext']],['user:drink-tile',['amount']],['user:drink-correction:reading',['entered']],['user:photo-drink:reading',['entered','partial']],[null,['unrecorded']]]){
  assert.deepEqual(mealSources([item(ref,'Food')]).map(s=>s.kind),kinds);
 }
 assert.throws(()=>mealSources([item('guess:usda','USDA food')]));
 assert.throws(()=>mealSources([item('estimate:recipe','Soup')]));
 assert.deepEqual(mealSources([item('0','USDA blend')]),[{kind:'usda',foods:['USDA blend']}]);
});
test('name-only barcode corrections retain the actual USDA or OFF supplier; saved nutrients use the new ref',()=>{
 const per_100={calories:70,protein_g:null,carbs_g:null,fat_g:null,fibre_g:null,sugar_g:null,sodium_mg:null};
 const food=productFromFood({fdcId:7,description:'Reference food',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:90}]},'123');
 for(const [base,ref,kind] of [[food,'7','usda'],[{...food,attribution:'off'},'off:123','off']]){
  for(const own of [{name:'My name'},{name:'My name',per_100:Object.fromEntries(Object.keys(per_100).map(k=>[k,null]))}]){
   const merged=mergeProduct('123',base,own,null);assert.equal(merged.nutritionSource,'base');
   const n=barcodeNutrition(merged,100);assert.equal(n.source_ref,ref);assert.equal(n.calories,90);
   assert.equal(mealSources([{name:merged.name,...n}])[0].kind,kind);
  }
  const merged=mergeProduct('123',base,{name:'Mine',per_100},null),n=barcodeNutrition(merged,100);
  assert.equal(merged.nutritionSource,'own');assert.equal(n.source_ref,'barcode-own:123');assert.equal(n.calories,70);assert.deepEqual(n.micronutrients,[]);
  assert.equal(mealSources([{name:merged.name,...n}])[0].kind,'saved');
 }
});
