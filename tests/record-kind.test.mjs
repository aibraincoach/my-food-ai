import test from 'node:test';
import assert from 'node:assert/strict';
import { nameKinds, recordContradicts } from '../src/lib/fdc/record-kind.ts';

test('strawberry jelly drizzle can use the Jam or jelly USDA record', () => {
  const name = 'strawberry jelly drizzle';
  assert.equal(recordContradicts(name, { description: 'Jam or jelly, NFS', foodCategory: 'jams, syrups, toppings' }), false);
  for (const word of ['jelly', 'jam', 'preserves']) assert(nameKinds(word).has('sweet'), word);
});
