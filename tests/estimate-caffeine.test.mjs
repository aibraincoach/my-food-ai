import {nutrientsTranslator} from '../src/i18n/nutrients.ts';
import {nutritionTranslator} from '../src/i18n/nutrition.ts';
// node --import tsx --test tests/estimate-caffeine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
process.env.MODEL_API_BASE_URL='http://127.0.0.1:1/v1';process.env.MODEL_API_KEY='offline-meta';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-trace';
const {estimateFood}=await import('../src/lib/fdc/estimate.ts');
const {scaleNutrition}=await import('../src/lib/fdc/nutrients.ts');
const {foodApproximation,approximationLabels,storedEstimateFood}=await import('../src/lib/fdc/approximation-metadata.ts');
const {drinksFromItems}=await import('../src/lib/intake/drinks-from-items.ts');
const {nutritionTableRows}=await import('../src/lib/nutrition/table.ts');
const {plainConsumed}=await import('../src/lib/pipeline/wording.ts');
const coffee={food:true,basis:'brewed black coffee',calories:1,protein_g:0.1,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:2,caffeine_mg:40,drink:'coffee'};
let request;
async function withPayload(payload,fn){const original=globalThis.fetch;globalThis.fetch=async(input,init)=>{const url=new URL(input);if(url.origin==='https://trace.invalid')return new Response(null,{status:201});assert.equal(url.port,'1');request=JSON.parse(init.body);return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(payload)}]}],usage:{input_tokens:1,output_tokens:1}});};try{return await fn();}finally{globalThis.fetch=original;}}
const stored=(name,n,grams)=>({id:'item',name,portion_text:null,portion_grams:grams,food_category:n.foodCategory,source_ref:n.sourceRef,micronutrients:n.micronutrients});

test('the estimate asks the model for caffeine',async()=>withPayload(coffee,async()=>{
 await estimateFood('black coffee','');
 assert.match(request.instructions,/caffeine in milligrams/);
 assert.deepEqual(request.text.format.schema.properties.caffeine_mg,{type:['number','null']});
 assert.ok(request.text.format.schema.required.includes('caffeine_mg'));
}));

test('an estimated coffee stores caffeine as nutrient 1057 for the portion and keeps the estimate label',async()=>withPayload(coffee,async()=>{
 const food=await estimateFood('black coffee','');const n=scaleNutrition(food,180);
 const caffeine=n.micronutrients.find(entry=>entry.nutrientId===1057);
 assert.deepEqual({nutrientName:caffeine.nutrientName,unitName:caffeine.unitName,value:caffeine.value,basis:caffeine.basis,per100:caffeine.per100},{nutrientName:'Caffeine',unitName:'MG',value:72,basis:'portion',per100:40});
 assert.equal(n.calories,1.8);assert.match(n.sourceRef,/^estimate:/);assert.equal(n.foodCategory,'coffee');
 const row=stored('black coffee',n,180);
 assert.deepEqual(foodApproximation(row),{kind:'estimate',basis:coffee.basis});
 assert.match(plainConsumed({calories:n.calories,protein_g:n.proteinG,carbs_g:n.carbsG,fat_g:n.fatG},approximationLabels([row])),/Nutrition for black coffee is a model estimate, brewed black coffee\./);
 // The drink row and the nutrition table read it exactly as they read a matched record's caffeine.
 assert.deepEqual(drinksFromItems([row]),[{post_item_id:'item',kind:'caffeine',amount:72,ml:180,label:'black coffee',caffeineMg:72,alcoholG:0}]);
 assert.equal(nutritionTableRows([{...row,calories:n.calories,protein_g:n.proteinG,carbs_g:n.carbsG,fat_g:n.fatG,fibre_g:n.fibreG,sugar_g:n.sugarG,sodium_mg:n.sodiumMg}],nutritionTranslator('en'),nutrientsTranslator('en'),'en').find(line=>line.name==='Caffeine').value,72);
 // The per-100 g reference survives a later portion change.
 assert.equal(storedEstimateFood(row).foodNutrients.find(entry=>entry.nutrientId===1057).value,40);
}));

test('an estimated drink with no caffeine source drops the estimated caffeine',async()=>withPayload({...coffee,basis:'orange juice',calories:45,carbs_g:10,sugar_g:8,caffeine_mg:12,drink:'other drink'},async()=>{
 for(const name of ['orange juice','herbal tea','decaf coffee']){
  const n=scaleNutrition(await estimateFood(name,''),200);
  assert.equal(n.micronutrients.find(entry=>entry.nutrientId===1057).value,24);
  // Only "herbal tea" and "decaf coffee" are drinks by name without a category; orange juice needs a category.
  const [drink]=drinksFromItems([{...stored(name,n,200),food_category:name==='orange juice'?'citrus juice':null}]);
  assert.equal(drink.caffeineMg,0,name);assert.equal(drink.kind,'water',name);
  assert.equal(nutritionTableRows([{...stored(name,n,200),food_category:name==='orange juice'?'citrus juice':null,calories:1,protein_g:0,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0}],nutritionTranslator('en'),nutrientsTranslator('en'),'en').some(line=>line.name==='Caffeine'),false,name);
 }
}));

test('no caffeine, an answer without the field, and an out-of-range figure keep valid nutrition with caffeine unknown',async()=>{
 for(const caffeine_mg of [null,undefined,-1,401,5000,'40',Number.NaN]){
  await withPayload({...coffee,caffeine_mg},async()=>{
   const food=await estimateFood('black coffee','');
   assert.equal(food.foodNutrients.some(entry=>entry.nutrientId===1057),false,String(caffeine_mg));
   assert.deepEqual(food.foodNutrients.map(entry=>entry.nutrientId),[1008,1003,1005,1004,1079,2000,1093]);
   assert.equal(scaleNutrition(food,180).calories,1.8);
  });
 }
 await withPayload({...coffee,caffeine_mg:400},async()=>{assert.equal((await estimateFood('espresso','')).foodNutrients.find(entry=>entry.nutrientId===1057).value,400);});
});

// #987: a drink the drink rules do not know by name reaches the day's caffeine through the model's own drink kind.
test('an estimated drink with an unfamiliar name counts as coffee or tea and its caffeine reaches the day',async()=>{
 for(const [name,drink,category] of [['Es kopi susu gula aren','coffee','coffee'],['Kopi joss','coffee','coffee'],['Cappuccino','coffee','coffee'],['Teh tarik','tea','tea'],['Yuanyang','coffee','coffee']]){
  await withPayload({...coffee,drink,caffeine_mg:30},async()=>{
   const food=await estimateFood(name,'');assert.equal(food.foodCategory,category,name);
   assert.ok(request.text.format.schema.required.includes('drink'));assert.match(request.instructions,/"coffee", "tea", "other drink" or "not a drink"/);
   const n=scaleNutrition(food,250);
   assert.deepEqual(drinksFromItems([stored(name,n,250)]).map(d=>[d.kind,d.amount]),[['caffeine',75]],name);
  });
 }
});
test('an estimated coffee without a caffeine figure is unknown, not water; a caffeine-free tea is water; a food is no drink',async()=>{
 await withPayload({...coffee,drink:'coffee',caffeine_mg:null},async()=>{const n=scaleNutrition(await estimateFood('Kopi talua',''),200);assert.deepEqual(drinksFromItems([stored('Kopi talua',n,200)]),[]);});
 await withPayload({...coffee,drink:'tea',caffeine_mg:0},async()=>{const n=scaleNutrition(await estimateFood('Herbal tea',''),200);assert.deepEqual(drinksFromItems([stored('Herbal tea',n,200)]).map(d=>[d.kind,d.amount]),[['water',200]]);});
 await withPayload({...coffee,drink:'not a drink',calories:300,caffeine_mg:5},async()=>{const food=await estimateFood('Tiramisu','');assert.equal(food.foodCategory,undefined);assert.deepEqual(drinksFromItems([stored('Tiramisu',scaleNutrition(food,100),100)]),[]);});
 await withPayload({...coffee,drink:'other drink',calories:45,caffeine_mg:0},async()=>{assert.equal((await estimateFood('Es jeruk','')).foodCategory,'beverages');});
});
test('rule 5: an estimate without a valid drink kind is invalid, with no name-based guess',async()=>{
 for(const drink of [undefined,'','juice',null]){
  await withPayload({...coffee,drink},async()=>{await assert.rejects(()=>estimateFood('Kopi talua',''),error=>error.status===502&&/invalid/.test(error.message),String(drink));});
 }
});


test('a model-stated zero caffeine is measured data for tea, coffee and other drinks',async()=>{
 for(const [name,drink] of [['Barley tea','tea'],['Lemon ginger tea','tea'],['Decaf coffee','coffee'],['Orange juice','other drink']]){
  await withPayload({...coffee,drink,caffeine_mg:0},async()=>{
   const food=await estimateFood(name,''),n=scaleNutrition(food,200),caffeine=n.micronutrients.find(entry=>entry.nutrientId===1057);
   assert.equal(caffeine?.value,0,name);assert.equal(caffeine?.basis,'portion',name);
   assert.deepEqual(drinksFromItems([stored(name,n,200)]).map(d=>[d.kind,d.amount]),[['water',200]],name);
  });
 }
});
