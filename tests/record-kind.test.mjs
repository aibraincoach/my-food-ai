import test from 'node:test';
import assert from 'node:assert/strict';
import { nameKinds, recordContradicts, recordKind } from '../src/lib/fdc/record-kind.ts';

test('strawberry jelly drizzle can use the Jam or jelly USDA record', () => {
  const name = 'strawberry jelly drizzle';
  assert.equal(recordContradicts(name, { description: 'Jam or jelly, NFS', foodCategory: 'jams, syrups, toppings' }), false);
  for (const word of ['jelly', 'jam', 'preserves']) assert(nameKinds(word).has('sweet'), word);
});

for (const [name, description, foodCategory] of [
  ['bread', 'Bread, white, commercially prepared', 'Baked Products'],
  ['toast', 'Bread, white, commercially prepared, toasted', 'Baked Products'],
  ['dinner roll bun', 'Rolls, dinner, plain, commercially prepared (includes brown-and-serve)', 'Baked Products'],
  ['chicken noodle soup', 'Soup, chicken noodle, canned', 'Soups, Sauces, and Gravies'],
  ['cabbage slaw', 'CABBAGE & CARROTS COLE SLAW, CABBAGE & CARROTS', 'Pre-packaged fruit & vegetables'],
  ['coleslaw', 'Cole slaw', 'Pre-packaged fruit and vegetables'],
  ['Mala udon with beef', 'Beef and noodles with soy-based sauce', null],
  ['pasta with pork and cheese', 'Pasta with tomato-based sauce, cheese and meat', null],
  ['pork sate with mushrooms', 'Ham or pork with mushroom sauce', 'meat mixed dishes'],
  ['ikan dabu dabu fried fish', 'Fried fish with sauce, Puerto Rican style', 'seafood mixed dishes'],
]) test(`compatible ${name} is not strongly contradicted by its record`, () => {
  assert.equal(recordKind(description, foodCategory), null);
  assert.equal(recordContradicts(name, { description, foodCategory }), false);
});

test('with alone does not imply raw produce has been cooked', () => {
  assert.equal(recordContradicts('apple with peanut butter', {
    description: 'Apples, raw, with skin', foodCategory: 'fruits and fruit juices',
  }), false);
});

test('named shakes, mocktails and croissants retain their matching record kinds', () => {
  for (const [name, description, foodCategory] of [
    ['peach shake', 'Milk shake, home recipe, flavors other than chocolate', 'milk shakes and other dairy drinks'],
    ['Orange coconut mocktail', 'Fruit juice drink, noncitrus, carbonated', 'fruit drinks'],
    ['butter croissant', 'Croissants, butter', 'baked products'],
    ['croissant', 'Croissant', 'doughnuts, sweet rolls, pastries'],
  ]) assert.equal(recordContradicts(name, { description, foodCategory }), false, name);
});

// #1089: with no category, a description head that mixes kinds is named by its last word.
for (const [name, description, kind] of [
  ['mixed green salad', 'Salad dressing, green goddess', 'condiment'],
  ['Creamy dipping sauce', 'Almond butter, creamy', 'fat'],
  ['salmon nigiri', 'Fish oil, salmon', 'fat'],
  ['thick toast', 'Milk shakes, thick chocolate', 'drink'],
]) test(`${name} is flagged against "${description}" with no category (#1089)`, () => {
  assert.equal(recordKind(description, null), kind);
  assert.equal(recordContradicts(name, { description }), true);
});

test('a head named by its last word still keeps matching foods and whole dishes (#1089)', () => {
  for (const [name, description] of [
    ['peanut butter toast', 'Toast, whole wheat, with peanut butter'],
    ['strawberry milkshake', 'Milk shakes, thick strawberry'],
    ['vanilla ice cream', 'Ice cream, vanilla'],
    ['chocolate milk', 'Milk, chocolate, reduced fat'],
    ['chicken satay with peanut sauce', 'Chicken satay with peanut sauce'],
    ['fish and chips', 'Fish and chips'],
  ]) assert.equal(recordContradicts(name, { description }), false, name);
  assert.equal(recordContradicts('peanut butter toast', { description: 'Peanut butter, smooth style' }), true);
  assert.equal(recordKind('Beef and noodles with soy-based sauce', null), null);
  assert.equal(recordKind('Pasta with tomato-based sauce, cheese and meat', null), null);
});
