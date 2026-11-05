import test from 'node:test';
import assert from 'node:assert/strict';
import {isAlcoholic} from '../src/lib/intake/alcohol.ts';

const item = name => ({name, food_category: 'Snacks', micronutrients: []});

test('alcohol name matcher from fix18 #670', () => {
  for (const name of ['fruit cocktail', 'shrimp cocktail', 'prawn cocktail', 'cocktail sauce', 'fruit punch', 'nonalcoholic punch', 'punch']) {
    assert.equal(isAlcoholic(item(name)), false, name);
  }
  for (const name of ['rum punch', 'mojito', 'margarita', 'tiki cocktail', 'whiskey cocktail']) {
    assert.equal(isAlcoholic(item(name)), true, name);
  }
});
