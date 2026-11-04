import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {productFromOff,lookupOpenFoodFacts} from '../src/lib/fdc/open-food-facts.ts';
import {barcodeNutrition} from '../src/lib/fdc/barcode-product.ts';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/off-7622300761363.json',import.meta.url),'utf8'));
test('OFF Oreo pack maps printed per-100 nutrition and retains its attribution/source',()=>{
 const p=productFromOff(fixture,'7622300761363');
 assert.ok(p);assert.equal(p.brand,'Oreo');assert.ok(p.name);assert.equal(p.per100g.calories,489);assert.equal(p.per100g.carbs_g,70);assert.equal(p.per100g.sodium_mg,400);assert.equal(p.basisUnit,'g');assert.equal(p.attribution,'off');
 assert.equal(barcodeNutrition(p,100).source_ref,'off:7622300761363');
});
test('OFF missing and nutritionally empty products are unusable',()=>{
 assert.equal(productFromOff({status:0},'7622300761363'),null);
 assert.equal(productFromOff({status:1,product:{product_name:'Empty',nutriments:{}}},'7622300761363'),null);
});

test('OFF liquid package quantities use ml and solid quantities use g',()=>{
 for(const quantity of ['500ml','1L','330mL','500 ml','33cl','200g','1 kg']){
  const p=productFromOff({status:1,product:{product_name:'Product',quantity,nutriments:{'energy-kcal_100g':100}}},'7622300761363');
  assert.ok(p);assert.equal(p.basisUnit,['200g','1 kg'].includes(quantity)?'g':'ml',quantity);
 }
});

// Provider failures must remain distinguishable from a real missing product.
test('OFF unavailable responses reject; only missing products return null', async()=>{
 const original=globalThis.fetch;
 process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://127.0.0.1:54321';
 process.env.SUPABASE_SECRET_KEY ||= 'offline-test-trace-sink';
 try {
  for(const status of [500,429,404]){
   let productRequests=0;
   globalThis.fetch=async(input)=>{
    if(String(input).includes('world.openfoodfacts.org')){productRequests++;return new Response(null,{status});}
    return new Response(null,{status:201});
   };
   if(status===404)assert.equal(await lookupOpenFoodFacts('7622300761363'),null);
   else await assert.rejects(()=>lookupOpenFoodFacts('7622300761363'),new RegExp(`lookup failed with ${status}`));
   assert.ok(productRequests>0);
  }
 } finally {globalThis.fetch=original;}
});
