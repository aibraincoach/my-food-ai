import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRecord, recordContradicts } from '../src/lib/fdc/record-kind.ts';
import { referenceProteinMismatch } from '../src/lib/fdc/protein-reference.ts';
import { matchFood } from '../src/lib/fdc/match.ts';

const refuses = (name, description, foodCategory) => recordContradicts(name, { description, foodCategory }) || referenceProteinMismatch(name, description);

for (const [name, description, category] of [
  ['bok choy', 'Cabbage, chinese (pak-choi), raw', 'Vegetables and Vegetable Products'],
  ['pak choy', 'Cabbage, chinese (pak-choi), cooked, boiled', 'Vegetables and Vegetable Products'],
  ['stir-fried bok choy', 'Cabbage, chinese (pak-choi), cooked, boiled', 'Vegetables and Vegetable Products'],
  ['strawberry jam', 'Jams and preserves', 'Sweets'],
  ['peach jam', 'Jams and preserves', undefined],
  ['fruit jam', 'Jams and preserves', 'Sweets'],
  ['apple sauce', 'Applesauce, canned, unsweetened', 'Fruits and Fruit Juices'],
  ['curry powder', 'Spices, curry powder', 'Spices and Herbs'],
  ['curry', 'Spices, curry powder', 'Spices and Herbs'],
  ['garam masala', 'Spices, garam masala', 'Spices and Herbs'],
  ['chilli powder', 'Spices, chili powder', 'Spices and Herbs'],
  ['chicken seasoning', 'Chicken seasoning', 'Herbs & Spices'],
  ['Mala udon with beef', 'Beef and noodles with soy-based sauce', 'Stir-fry and soy-based sauce mixtures'],
  ['tofu stir fry', 'Stir-fry and soy-based sauce mixtures', 'Sauce mixtures'],
  ['chocolate cake', 'Cake, chocolate, prepared from mix', 'Baked Products'],
  ['nut trail mix', 'Snacks, trail mix', 'Snacks'],
  ['Lemon wedge', 'Lemon, raw', 'Fruits and Fruit Juices'],
]) test(`compatible record keeps: ${name} / ${description}`, () => assert.equal(refuses(name, description, category), false));

for (const [name, description, category] of [
  ['Seekh kebab', 'SEEKH KEBAB MASALA SPIC MIX', 'Herbs & Spices'],
  ['chicken', 'Spices, seasoning mix', 'Spices and Herbs'],
  ['steak', 'Seasoning mix', 'Seasonings'],
  ['chicken curry', 'Spices, curry powder', 'Spices and Herbs'],
  ['shrimp rice noodle roll', 'Crepe, with meat', 'Mixed Dishes'],
  ['stir-fried meat with red chilies', 'Fish, tuna, cooked', 'Finfish and Shellfish Products'],
  ['lemon and herb chicken', 'Lemons, raw', 'Fruits and Fruit Juices'],
  ['lime and rum tiki cocktail', 'Limes, raw', 'Fruits and Fruit Juices'],
  ['lemon and ginger tea', 'Lemons, raw', 'Fruits and Fruit Juices'],
  ['lemon with soda water', 'Lemons, raw', 'Fruits and Fruit Juices'],
]) test(`wrong record refuses: ${name} / ${description}`, () => assert.equal(refuses(name, description, category), true));

test('spice-category judgment is contextual: the record alone has no condiment kind', () => {
  assert.equal(checkRecord('curry powder', { description: 'Spices, curry powder', category: 'Spices and Herbs' }).strong.length, 0);
});

test('singleton matcher keeps mixtures, refuses the meat spice and retains the existing zero-energy refusal', async () => {
  for (const [name, description, foodCategory, kcal, keep] of [
    ['Seekh kebab', 'SEEKH KEBAB MASALA SPIC MIX', 'Herbs & Spices', 429, false],
    ['sambal', 'SAMBAL OELEK', 'Sauces', 0, false],
    ['Mala udon with beef', 'Beef and noodles with soy-based sauce', 'Stir-fry and soy-based sauce mixtures', 173, true],
  ]) {
    const food = { fdcId: 123, description, foodCategory, dataType: 'SR Legacy', foodNutrients: [{ nutrientId: 1008, nutrientName: 'Energy', unitName: 'KCAL', value: kcal }] };
    const result = await matchFood(name, '', { search: async () => [food], choose: async (_name, _caption, candidates) => ({ id: candidates[0]?.fdcId ?? null, query: null, reason: 'local singleton replay' }) });
    assert.equal(Boolean(result.food), keep, name);
  }
});
