import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeLabelReading, parseLabelReading } from '../src/lib/meta/label.ts';

test('mergeLabelReading keeps the first box and serving while filling macros from retry', () => {
  const first = parseLabelReading({
    is_label: true,
    serving: { amount: 55, unit: 'g' },
    per_serving: { kcal: 230, protein_g: null, carbs_g: 37, fat_g: 8, fibre_g: null, sugar_g: null, sodium_mg: null },
    product_name: 'Crackers',
    box: { x: 0.1, y: 0.2, w: 0.3, h: 0.4 },
  });
  const retry = parseLabelReading({
    is_label: true,
    serving: null,
    per_serving: { kcal: 230, protein_g: 3, carbs_g: 37, fat_g: 8, fibre_g: 4, sugar_g: null, sodium_mg: null },
    product_name: null,
    box: { x: 0, y: 0, w: 1, h: 1 },
  });
  const merged = mergeLabelReading(first, retry);
  assert.equal(merged.product_name, 'Crackers');
  assert.deepEqual(merged.serving, { amount: 55, unit: 'g' });
  assert.deepEqual(merged.box, first.box);
  assert.equal(merged.per_serving?.protein_g, 3);
});
