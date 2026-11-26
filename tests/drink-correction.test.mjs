import test from 'node:test';
import assert from 'node:assert/strict';
import {correctedPhotoDrink,drinkCorrectionChanged} from '../src/lib/intake/drink-correction.ts';
import {photoDrinkProduct,scalePhotoDrink} from '../src/lib/intake/photo-drinks.ts';
const previous={name:'Cola',ml:200,caffeineMg:20,kcal:80,source:'read from the can',grams:210,nutrition:{calories:80,protein_g:0,carbs_g:20,fat_g:0,fibre_g:0,sugar_g:18,sodium_mg:10,food_category:'Soft drinks',source_ref:'123',micronutrients:[{nutrientId:1092,nutrientName:'Potassium',unitName:'MG',value:25,basis:'portion'},{nutrientId:1162,nutrientName:'Vitamin C',unitName:'MG',value:5,basis:'portion'},{nutrientId:1057,nutrientName:'Caffeine',unitName:'MG',value:20,basis:'portion'}]}};
const prefill=()=>({name:previous.name,pack_amount:200,pack_unit:'ml',per_100:photoDrinkProduct(previous).per100g,caffeine_mg:null});
test('unchanged prefill is refused on the server; caffeine-only input counts as an explicit change',()=>{
 assert.equal(drinkCorrectionChanged(previous,prefill()),false);
 assert.throws(()=>correctedPhotoDrink(previous,prefill(),'reading'),/unchanged/);
 assert.equal(drinkCorrectionChanged(previous,{...prefill(),caffeine_mg:0}),true);
});
test('renaming and correcting a drink keeps only confirmed macros and entered volume',()=>{
 const correction={...prefill(),name:'Orange juice',pack_amount:300,per_100:{...prefill().per_100,protein_g:null}};
 const drink=correctedPhotoDrink(previous,correction,'reading');
 assert.equal(drink.name,'Orange juice');assert.equal(drink.ml,300);assert.equal(drink.grams,null);
 assert.equal(drink.kcal,120);assert.equal(drink.nutrition.protein_g,null);assert.equal(drink.caffeineMg,null);
 assert.equal(drink.nutrition.food_category,null);assert.equal(drink.nutrition.source_ref,'user:drink-correction:reading');
 assert.deepEqual(drink.nutrition.micronutrients,[{nutrientId:1051,nutrientName:'Water',unitName:'G',value:300,basis:'portion'}]);
});
test('only entered caffeine is retained, is exact for this drink, and scales with a selected portion',()=>{
 const drink=correctedPhotoDrink(previous,{...prefill(),caffeine_mg:75},'reading');
 assert.equal(drink.caffeineMg,75);assert.equal(drink.nutrition.micronutrients.find(n=>n.nutrientId===1057).value,75);
 const half=scalePhotoDrink(drink,100);assert.equal(half.caffeineMg,37.5);assert.equal(half.nutrition.micronutrients.find(n=>n.nutrientId===1057).value,37.5);
 for(const caffeine_mg of [-1,1001,0.5,NaN,Infinity,'75'])assert.throws(()=>correctedPhotoDrink(previous,{...prefill(),caffeine_mg},'reading'));
 for(const value of [null,0,1000]){const input={...prefill(),name:'New name',caffeine_mg:value};assert.equal(correctedPhotoDrink(previous,input,'reading').caffeineMg,value);}
});
