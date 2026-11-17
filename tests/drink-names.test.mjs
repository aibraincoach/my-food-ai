// node --import tsx --test tests/drink-names.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { drinksFromItems, isDrinkItem } from '../src/lib/intake/drinks-from-items.ts';
import { isAlcoholic } from '../src/lib/intake/alcohol.ts';

const item = (changes = {}) => ({ id: 'drink', name: 'Cola', food_category: null, portion_text: '330 ml', portion_grams: 330, micronutrients: [], ...changes });
const caffeine = value => ({ nutrientId: 1057, nutrientName: 'Caffeine', unitName: 'MG', basis: 'portion', value });
const alcohol = value => ({ nutrientId: 1018, nutrientName: 'Alcohol, ethyl', unitName: 'G', basis: 'portion', value });

test('a cola whose record has no category counts as a drink, with its stored caffeine', () => {
  for (const name of ['Cola', 'Regular cola', 'Iced cola', 'A can of Coca-Cola', 'Glass of Coke with ice', 'Diet cola (can)', 'Coca-Cola Zero, 330 ml can']) {
    assert.equal(isDrinkItem({ name, food_category: null }), true, name);
    assert.deepEqual(drinksFromItems([item({ name, micronutrients: [caffeine(29.7)] })]),
      [{ post_item_id: 'drink', kind: 'caffeine', amount: 30, ml: 330, label: name.slice(0, 40), caffeineMg: 30, alcoholG: 0 }], name);
  }
});

test('a coffee or tea whose record has no category counts as a drink', () => {
  for (const name of ['black coffee', 'Iced black coffee', 'Vietnamese drip coffee', 'Cup of coffee', 'Sweet lemon iced tea', 'Hot green tea', 'Espresso on ice', 'Bottle of sparkling water']) {
    assert.equal(isDrinkItem({ name, food_category: null }), true, name);
  }
  assert.equal(drinksFromItems([item({ name: 'Iced black coffee', portion_text: '1 cup', portion_grams: 180, micronutrients: [caffeine(72)] })])[0].caffeineMg, 72);
});

test('a cocktail whose record has no category keeps its drink row and stays alcohol without caffeine', () => {
  for (const name of ['Rum cocktail', 'Lime and rum tiki cocktail', 'Peach bicyclette cocktail with Prosecco, peach and bitters', 'Fiore cocktail with chamomile-infused vodka', 'Mojito', 'Frozen margarita', 'Rum punch']) {
    assert.equal(isDrinkItem({ name, food_category: null }), true, name);
    const rows = drinksFromItems([item({ name, portion_text: '1 glass', portion_grams: 220, micronutrients: [caffeine(15.4), alcohol(18.3)] })]);
    assert.deepEqual(rows, [{ post_item_id: 'drink', kind: 'alcohol', amount: 18, ml: 220, label: name.slice(0, 40), caffeineMg: 0, alcoholG: 18.3 }], name);
  }
});

test('a food that only mentions a drink stays a food when its record has no category', () => {
  for (const name of ['coffee cake', 'Coffee cake with icing', 'tea-smoked duck', 'rum raisin ice cream', 'Cola cake', 'Cola chicken wings', 'Chicken braised in cola', 'Green tea ice cream', 'Espresso chocolate brownie cookie',
    'Coffee beans', 'Tea leaf salad', 'Water chestnuts', 'Watermelon', 'Margarita pizza', 'Mojito chicken', 'Cocktail sausages', 'Cocktail sauce', 'Fruit cocktail', 'Shrimp cocktail', 'Prawn cocktail', 'Seafood cocktail', 'Crab cocktail',
    'Steak with red wine sauce', 'Milk', 'Milk chocolate', 'Pepsi Zero cake', 'Evian bottled water biscuit', 'Snickers bar', 'Pain au chocolat']) {
    assert.equal(isDrinkItem({ name, food_category: null }), false, name);
    assert.equal(drinksFromItems([item({ name, micronutrients: [caffeine(10)] })]).length, 0, name);
  }
});

test('a category still decides before any name: a solid food named like a drink stays a food', () => {
  assert.equal(isDrinkItem({ name: 'Iced coffee', food_category: 'cookies and brownies' }), false);
  assert.equal(isDrinkItem({ name: 'Rum cocktail', food_category: 'Snacks' }), false);
  assert.equal(isDrinkItem({ name: 'coffee cake', food_category: 'Coffee' }), true);
});

test('seafood cocktails are not alcoholic by name', () => {
  for (const name of ['Seafood cocktail', 'Crab cocktail', 'Lobster cocktail']) assert.equal(isAlcoholic({ name, food_category: 'Snacks', micronutrients: [] }), false, name);
  for (const name of ['Rum cocktail', 'Tiki cocktail']) assert.equal(isAlcoholic({ name, food_category: 'Snacks', micronutrients: [] }), true, name);
});
