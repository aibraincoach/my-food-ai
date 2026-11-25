// node --import tsx --test tests/nutrition-scaling.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { scaleNutrition } from '../src/lib/fdc/nutrients.ts';
import { requireStoredNutrition, rescaleStoredNutrition } from '../src/lib/nutrition/totals.ts';
const food = { fdcId: 1, description: 'Fixture', dataType: 'Branded', servingSize: 30, servingSizeUnit: 'g', foodNutrients: [
  { nutrientId: 1008, nutrientName: 'Energy', unitName: 'KCAL', value: 200 },
  { nutrientId: 1003, nutrientName: 'Protein', unitName: 'G', value: 10 },
  { nutrientId: 1089, nutrientName: 'Iron', unitName: 'MG', value: 6 },
] };
test('FDC search values scale from 100 grams, preserving order and units', () => {
  const n = scaleNutrition(food, 50);
  assert.equal(n.calories, 100); assert.equal(n.proteinG, 5);
  assert.deepEqual(n.micronutrients.map(({nutrientId, unitName, value, basis}) => [nutrientId, unitName, value, basis]), [
    [1008, 'KCAL', 100, 'portion'], [1003, 'G', 5, 'portion'], [1089, 'MG', 3, 'portion'],
  ]);
});
test('unknown portions and volume basis never masquerade as consumed amounts', () => {
  for (const n of [scaleNutrition(food, null), scaleNutrition(food, 0), scaleNutrition({...food, servingSizeUnit:'ml'}, 50)]) {
    assert.equal(n.calories, null); assert.ok(n.micronutrients.every(n => n.value === null));
  }
});
test('stored portion arrays are read unchanged and old unscaled arrays fail visibly', () => {
  const row = {post_item_id:'fixture', source_ref:'1', calories:100, protein_g:5, micronutrients:scaleNutrition(food,50).micronutrients};
  assert.deepEqual(requireStoredNutrition(row),row);
  assert.throws(()=>requireStoredNutrition({...row,micronutrients:food.foodNutrients}),/Stored nutrition format/);
});

test('portion changes retain exact selected identity and normalized density', () => {
  const row = {post_item_id:'fixture', source_ref:'987654', calories:100, protein_g:5, micronutrients:scaleNutrition(food,50).micronutrients};
  const revised = rescaleStoredNutrition(row, 50, 75);
  assert.equal(revised.source_ref,'987654'); assert.equal(revised.calories,150);
  assert.equal(revised.protein_g,7.5); assert.equal(revised.micronutrients[2].value,4.5);
  const again = rescaleStoredNutrition(revised,75,25);
  assert.equal(again.calories,50); assert.equal(again.source_ref,'987654');
  assert.equal(rescaleStoredNutrition(row,null,50).calories,null);
});

test('sugar falls back to Sugars, Total 1063 and preserves 2000 precedence', () => {
  const sugar = (nutrientId, value) => ({nutrientId, nutrientName:'Sugars, Total', unitName:'G', value});
  assert.equal(scaleNutrition({...food, foodNutrients:[sugar(1063,8.55)]},50).sugarG,4.275);
  assert.equal(scaleNutrition({...food, foodNutrients:[sugar(1063,8),sugar(2000,5)]},50).sugarG,2.5);
});

test('a USDA carbohydrate-by-difference value below zero is stored as zero, never negative', () => {
  const meat = { fdcId: 2, description: 'Fixture meat', dataType: 'Foundation', foodNutrients: [
    { nutrientId: 1008, nutrientName: 'Energy', unitName: 'KCAL', value: 150 },
    { nutrientId: 1005, nutrientName: 'Carbohydrate, by difference', unitName: 'G', value: -0.6 },
  ] };
  const n = scaleNutrition(meat, 200);
  assert.equal(n.carbsG, 0); assert.equal(n.calories, 300);
  assert.equal(scaleNutrition({...meat, foodNutrients: meat.foodNutrients.slice(0, 1)}, 200).carbsG, null);
});
