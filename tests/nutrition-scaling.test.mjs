// node --import tsx --test tests/nutrition-scaling.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { scaleNutrition } from '../src/lib/fdc/nutrients.ts';
import { normalizeStoredNutrition, rescaleStoredNutrition } from '../src/lib/nutrition/totals.ts';
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
test('legacy read normalization corrects macros and does not double-scale versioned arrays', () => {
  const row = {post_item_id:'fixture', source_ref:'1', calories:333, protein_g:16, micronutrients:food.foodNutrients};
  const normalized = normalizeStoredNutrition(row, 50);
  assert.equal(normalized.calories, 100); assert.equal(normalized.protein_g, 5);
  assert.equal(normalized.micronutrients[2].value, 3);
  assert.deepEqual(normalizeStoredNutrition(normalized, 50), normalized);
  assert.equal(normalizeStoredNutrition(row, null).calories, null);
});

test('portion changes retain exact selected identity and normalized density', () => {
  const row = {post_item_id:'fixture', source_ref:'987654', calories:333, protein_g:16, micronutrients:food.foodNutrients};
  const revised = rescaleStoredNutrition(row, 50, 75);
  assert.equal(revised.source_ref,'987654'); assert.equal(revised.calories,150);
  assert.equal(revised.protein_g,7.5); assert.equal(revised.micronutrients[2].value,4.5);
  const again = rescaleStoredNutrition(revised,75,25);
  assert.equal(again.calories,50); assert.equal(again.source_ref,'987654');
  assert.equal(rescaleStoredNutrition(row,null,50).calories,null);
});
