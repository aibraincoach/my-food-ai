import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {productFromOff} from '../src/lib/fdc/open-food-facts.ts';
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
