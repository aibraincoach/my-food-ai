import test from 'node:test';
import assert from 'node:assert/strict';
import { nameKinds, recordContradicts } from '../src/lib/fdc/record-kind.ts';

test('strawberry jelly drizzle can use the Jam or jelly USDA record', () => {
  const name = 'strawberry jelly drizzle';
  assert.equal(recordContradicts(name, { description: 'Jam or jelly, NFS', foodCategory: 'jams, syrups, toppings' }), false);
  for (const word of ['jelly', 'jam', 'preserves']) assert(nameKinds(word).has('sweet'), word);
});

test('named shakes, mocktails and croissants retain their matching record kinds', () => {
  for (const [name, description, foodCategory] of [
    ['peach shake', 'Milk shake, home recipe, flavors other than chocolate', 'milk shakes and other dairy drinks'],
    ['Orange coconut mocktail', 'Fruit juice drink, noncitrus, carbonated', 'fruit drinks'],
    ['butter croissant', 'Croissants, butter', 'baked products'],
    ['croissant', 'Croissant', 'doughnuts, sweet rolls, pastries'],
  ]) assert.equal(recordContradicts(name, { description, foodCategory }), false, name);
});
