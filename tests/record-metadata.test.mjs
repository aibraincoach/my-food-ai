import test from'node:test';import assert from'node:assert/strict';
import{scaleNutrition}from'../src/lib/fdc/nutrients.ts';
import{recordMetadata,storedRecordMetadata}from'../src/lib/fdc/record-metadata.ts';
import{productFromFood,mergeProduct,barcodeNutrition}from'../src/lib/fdc/barcode-product.ts';
import{rescaleStoredNutrition}from'../src/lib/nutrition/totals.ts';
import{retainedNutrition}from'../src/lib/pipeline/leftovers.ts';
import{scalePhotoDrink}from'../src/lib/intake/photo-drinks.ts';
const food={fdcId:7,description:'Rice, cooked',dataType:'SR Legacy',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:100}]};
const empty={recordDescription:null,recordDataType:null};
for(const [kind,extra]of[['exact',{}],['closest',{approximation:{kind:'closest',basis:'Wrong text to copy'}}],['blend',{fdcId:0,description:'Blend of rice and beans',dataType:'Derived'}]])test(kind+' uses the SAME food description, never approximation basis',()=>{
 const f={...food,...extra};for(const amount of[50,null]){const n=scaleNutrition(f,amount);assert.equal(n.sourceRef,String(f.fdcId));assert.equal(n.recordDescription,f.description);assert.equal(n.recordDataType,f.dataType);}
});
test('estimate and unavailable always send both nulls',()=>{
 const estimate=scaleNutrition({...food,approximation:{kind:'estimate',basis:'Photo guess'}},100);
 assert.deepEqual({recordDescription:estimate.recordDescription,recordDataType:estimate.recordDataType},empty);
 const missing=scaleNutrition(null,100,{code:'no_match',detail:'No reference'});
 assert.deepEqual({recordDescription:missing.recordDescription,recordDataType:missing.recordDataType},empty);
});
for(const[description,dataType]of[[' ','SR Legacy'],['', 'Foundation'],['Rice',undefined],['Rice',''],['Rice',' '],['x'.repeat(501),'Foundation'],['Rice','x'.repeat(81)]])test('invalid pair is both null: '+JSON.stringify([description,dataType]),()=>{
 const n=scaleNutrition({...food,description,dataType},100);assert.deepEqual({recordDescription:n.recordDescription,recordDataType:n.recordDataType},empty);
});
test('exact bounds accepted and non-FDC refs cannot carry a pair',()=>{
 assert.deepEqual(recordMetadata('0','x'.repeat(500),'x'.repeat(80)),{recordDescription:'x'.repeat(500),recordDataType:'x'.repeat(80)});
 for(const ref of['estimate:x','label','off:x','barcode-own:x','user:drink-tile','unavailable:x',null,'-1'])assert.deepEqual(recordMetadata(ref,food.description,food.dataType),empty);
});
test('copies and repeated portion changes preserve the pair and leave old rows null',()=>{
 const row={post_item_id:'one',source_ref:'7',record_description:food.description,record_data_type:food.dataType,calories:100,micronutrients:[],id:'one'};
 assert.deepEqual(storedRecordMetadata(row),{record_description:food.description,record_data_type:food.dataType});
 const copy=retainedNutrition(row);assert.equal(copy.record_description,food.description);
 const scaled=rescaleStoredNutrition({...row,...copy},100,50);assert.equal(scaled.record_description,food.description);assert.equal(scaled.record_data_type,food.dataType);assert.equal(scaled.calories,50);
 assert.deepEqual(storedRecordMetadata({source_ref:'7'}),{record_description:null,record_data_type:null});
 const photo=scalePhotoDrink({name:'Coffee',ml:100,grams:100,kcal:100,caffeineMg:5,source:'estimated from the photo',nutrition:row},200);
 assert.equal(photo.nutrition.record_description,food.description);
});
test('barcode display-name corrections never replace the supplier record description',()=>{
 const base=productFromFood(food,'12345678'),renamed=mergeProduct('12345678',base,{name:'My display name'},null);
 const n=barcodeNutrition(renamed,50);assert.equal(n.source_ref,'7');assert.equal(n.record_description,food.description);assert.equal(n.record_data_type,food.dataType);
 const own=mergeProduct('12345678',base,{name:'My values',per_100:{calories:50,protein_g:0,carbs_g:5,fat_g:0}},null);
 assert.equal(barcodeNutrition(own,100).record_description,null);assert.equal(barcodeNutrition(own,100).record_data_type,null);
 assert.equal(barcodeNutrition({...base,attribution:'off'},100).record_description,null);
});
test('label and person-corrected drink writers explicitly clear both record fields',async()=>{
 const{labelNutrition,parseLabelReading}=await import('../src/lib/meta/label.ts');
 const{correctedPhotoDrink}=await import('../src/lib/intake/drink-correction.ts');
 const macros={calories:100,protein_g:0,carbs_g:20,fat_g:0,fibre_g:0,sugar_g:10,sodium_mg:0};
 const label=labelNutrition(parseLabelReading({is_label:true,serving:{amount:100,unit:'g'},per_serving:{kcal:100,protein_g:0,carbs_g:20,fat_g:0,fibre_g:0,sugar_g:10,sodium_mg:0},product_name:null,box:null}),1);
 assert.equal(label.record_description,null);assert.equal(label.record_data_type,null);
 const previous={name:'Original drink',ml:100,grams:100,kcal:100,caffeineMg:null,source:'read from the can',nutrition:{...macros,micronutrients:[],source_ref:'7',food_category:null,record_description:food.description,record_data_type:food.dataType}};
 const corrected=correctedPhotoDrink(previous,{name:'My new drink',pack_amount:100,pack_unit:'ml',per_100:macros,caffeine_mg:null},'reading');
 assert.equal(corrected.nutrition.record_description,null);assert.equal(corrected.nutrition.record_data_type,null);
});
