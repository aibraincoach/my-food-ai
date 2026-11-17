import test from 'node:test';
import assert from 'node:assert/strict';
import { readLabelFromPhotos } from '../src/lib/meta/label.ts';

// #990: meal 1c18b87e's label read gave 140 kcal with no protein or carbohydrate from the first of its three photos.
const reading = (per, serving = { amount: 220, unit: 'ml' }) => ({ is_label: true, serving, product_name: null, box: null,
  per_serving: { kcal: null, protein_g: null, carbs_g: null, fat_g: null, fibre_g: null, sugar_g: null, sodium_mg: null, ...per } });
const reader = (...readings) => { const seen = []; return { seen, read: async (photo) => { seen.push(photo[0]); const next = readings.shift(); if (next instanceof Error) throw next; return next; } }; };
const photos = [1, 2, 3, 4].map((n) => new Uint8Array([n]));

test('a label missing values is completed from the next photo of the same serving, and nothing read is replaced', async () => {
  const { seen, read } = reader(reading({ kcal: 140, fat_g: 3.5, sugar_g: 11, sodium_mg: 115 }), reading({ kcal: 150, protein_g: 0, carbs_g: 33, fat_g: 3.5, sugar_g: 11, sodium_mg: 115, fibre_g: 1 }));
  const result = await readLabelFromPhotos(photos, read);
  assert.deepEqual(seen, [1, 2], 'the third photo is not read once every value is there');
  assert.equal(result.per_serving.kcal, 140, 'the first reading keeps its own values');
  assert.equal(result.per_serving.protein_g, 0, 'a zero is a value');
  assert.equal(result.per_serving.carbs_g, 33);
  assert.equal(result.per_serving.fibre_g, 1);
});

test('only up to two more photos are read, and a different serving, a non-label or a failed read adds nothing', async () => {
  const { seen, read } = reader(reading({ kcal: 140 }), reading({ protein_g: 2 }, { amount: 100, unit: 'ml' }), new Error('refused'));
  const result = await readLabelFromPhotos(photos, read);
  assert.deepEqual(seen, [1, 2, 3], 'the fourth photo is never read');
  assert.equal(result.per_serving.protein_g, null, 'a reading per 100 ml does not fill a 220 ml label');
  const notLabel = reader(reading({ kcal: 140 }), { is_label: false, serving: null, per_serving: null, product_name: null, box: null }, reading({ protein_g: 1 }));
  assert.equal((await readLabelFromPhotos(photos, notLabel.read)).per_serving.protein_g, 1);
});

test('a complete first label, a first photo that is no label, or a single photo makes exactly one read', async () => {
  const complete = reader(reading({ kcal: 140, protein_g: 1, carbs_g: 30, fat_g: 3.5, fibre_g: 0, sugar_g: 11, sodium_mg: 115 }));
  await readLabelFromPhotos(photos, complete.read);
  assert.deepEqual(complete.seen, [1]);
  const none = reader({ is_label: false, serving: null, per_serving: null, product_name: null, box: null });
  assert.equal((await readLabelFromPhotos(photos, none.read)).is_label, false);
  assert.deepEqual(none.seen, [1]);
  const single = reader(reading({ kcal: 140 }));
  await readLabelFromPhotos(photos.slice(0, 1), single.read);
  assert.deepEqual(single.seen, [1]);
});
