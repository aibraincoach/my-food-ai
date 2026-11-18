import test from 'node:test';
import assert from 'node:assert/strict';
process.env.MODEL_API_BASE_URL = 'http://127.0.0.1:1/v1';
process.env.MODEL_API_KEY = 'offline-meta';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://trace.invalid';
process.env.SUPABASE_SECRET_KEY = 'offline-trace';

const { nutritionUnavailable } = await import('../src/lib/nutrition/available.ts');
const { certifiedPriorNutrition } = await import('../src/lib/pipeline/prior-version.ts');
const { FOOD_MATCH_VERSION } = await import('../src/lib/fdc/version.ts');

test('nutritionUnavailable flags any missing macro', () => {
  assert.equal(nutritionUnavailable({ calories: 1, protein_g: 1, carbs_g: 1, fat_g: 1 }), false);
  assert.equal(nutritionUnavailable({ calories: null, protein_g: 1, carbs_g: 1, fat_g: 1 }), true);
  assert.equal(nutritionUnavailable({ calories: 1, protein_g: null, carbs_g: 1, fat_g: 1 }), true);
});

test('certified prior nutrition rejects unavailable macros', () => {
  const ok = { matcher_version: FOOD_MATCH_VERSION, calories: 10, protein_g: 1, carbs_g: 1, fat_g: 1 };
  const bad = { matcher_version: FOOD_MATCH_VERSION, calories: 10, protein_g: null, carbs_g: 1, fat_g: 1 };
  assert.equal(certifiedPriorNutrition([ok]), true);
  assert.equal(certifiedPriorNutrition([bad]), false);
});

const { referenceProteinMismatch } = await import('../src/lib/fdc/protein-reference.ts');
test('squid nigiri never matches tuna-topped sushi reference', () => {
  assert.equal(referenceProteinMismatch('squid nigiri', 'Sushi, topped with tuna'), true);
  assert.equal(referenceProteinMismatch('squid nigiri', 'Mollusks, squid, mixed species, raw'), false);
});
test('non-protein toppings do not reject chicken breast', () => {
  assert.equal(referenceProteinMismatch('chicken breast', 'Chicken breast, topped with cheese'), false);
});
test('a record that names only another animal is rejected however it is worded (#617)', () => {
  for (const description of ['Sushi roll, tuna', 'Tuna, fresh, bluefin, raw', 'Fish, tuna, light, canned in water', 'Fish, tilapia, cooked'])
    assert.equal(referenceProteinMismatch('squid nigiri', description), true, description);
  assert.equal(referenceProteinMismatch('turkey sandwich', 'Chicken, roasted, meat only'), true);
  assert.equal(referenceProteinMismatch('egg fried rice', 'Rice, fried, with chicken'), true);
});
test('a record that names the item\'s own protein, or none, is kept (#617)', () => {
  for (const [name, description] of [
    ['salmon nigiri', 'Fish, salmon, Atlantic, raw'], ['tuna salad', 'Fish, tuna, light, canned in water'],
    ['fried fish', 'Fish, cod, Atlantic, cooked'], ['prawn crackers', 'Crustaceans, shrimp, cooked'],
    ['chicken and shrimp fried rice', 'Rice, fried, with shrimp'], ['ham sandwich', 'Pork, cured, ham, sliced'],
    ['egg noodles with beef', 'Noodles, egg, cooked'], ['pork dumpling', 'Dumpling, meat-filled'],
    ['sushi roll', 'Sushi roll, tuna'], ['beef burger', 'Hamburger, single patty, plain'],
  ]) assert.equal(referenceProteinMismatch(name, description), false, name);
});

const { isAlcoholic } = await import('../src/lib/intake/alcohol.ts');
const food = (name) => ({ name, food_category: null, micronutrients: [] });
test('fruit and shrimp cocktail names are not treated as alcoholic', () => {
  for (const name of ['fruit cocktail', 'shrimp cocktail', 'prawn cocktail', 'cocktail sauce']) {
    assert.equal(isAlcoholic(food(name)), false, name);
  }
  for (const name of ['rum punch', 'mojito']) {
    assert.equal(isAlcoholic(food(name)), true, name);
  }
});

const { keepsCaffeine } = await import('../src/lib/intake/alcohol.ts');
const drink = (name, food_category = null) => ({ name, food_category, micronutrients: [] });
test('caffeine kept only for named sources on drinks', () => {
  for (const name of ['tiki punch', 'red wine', 'lager beer', 'lemonade']) assert.equal(keepsCaffeine(drink(name)), false);
  for (const name of ['rum and coke', 'espresso martini', 'cola', 'iced tea']) assert.equal(keepsCaffeine(drink(name)), true);
});

const { matchFood } = await import('../src/lib/fdc/match.ts');
test('the matcher never offers squid nigiri a tuna record, however it is worded (#617)', async () => {
  const record = (fdcId, description) => ({ fdcId, description, dataType: 'Survey (FNDDS)', foodNutrients: [{ nutrientId: 1008, value: 150 }] });
  const offered = [];
  const result = await matchFood('squid nigiri', '', {
    search: async () => [record(1, 'Sushi roll, tuna'), record(2, 'Tuna, fresh, bluefin, raw'), record(3, 'Mollusks, squid, mixed species, cooked')],
    choose: async (_name, _caption, foods) => { offered.push(...foods.map(food => food.fdcId)); return { id: 3, query: null, query_food: null, reason: 'Squid' }; },
  });
  assert.deepEqual(offered, [3]);
  assert.equal(result.food.fdcId, 3);
});

// #617 (Fleet 53 review): a dish word implies its protein, and "fish" agrees with any fish species, so a topping word
// (bacon on a cheeseburger) never makes the dish's own protein a conflict. Two different named animals still conflict.
test('a record of the protein a dish word implies is kept (#617)', () => {
  for (const [name, description] of [
    ['bacon cheeseburger', 'Beef, ground, 85% lean meat / 15% fat, patty, cooked, broiled'],
    ['imitation crab', 'Fish, surimi'], ['crab stick', 'Fish, surimi'],
    ['salmon roe', 'Fish, caviar, black and red, granular'], ['salmon roe', 'Fish, roe, mixed species, raw'],
    ['ham and cheese omelet', 'Omelet, egg, with cheese'], ['ham and cheese omelet', 'Egg, whole, omelet'],
    ['grilled fish', 'Salmon, baked or broiled'], ['fish fillet', 'Salmon, baked or broiled'], ['fish sticks', 'Fish, pollock, Alaska, breaded, fried'],
    ['bacon and eggs', 'Egg, whole, cooked, scrambled'], ['scrambled eggs with bacon', 'Egg, whole, cooked, scrambled'],
    ['ham', 'Pork, fresh, leg, roasted'], ['pork', 'Ham, sliced, regular'], ['sausage roll', 'Pork, ground, cooked'],
    ['chicken-fried steak', 'Beef, round, steak, cooked'], ['hot dog', 'Frankfurter, beef, heated'], ['egg roll', 'Egg roll, with pork'],
    ['mussels with fries', 'Mollusks, mussel, blue, cooked'], ['calamari', 'Mollusks, squid, mixed species, cooked'],
    ['bacon cheeseburger', 'Hamburger, with beef'], ['shrimp omelet', 'Egg, whole, cooked, omelet'], ['chicken patty', 'Chicken patty, fillet, or tenders, breaded, cooked'],
    ['tofu burger', 'Veggie burgers or soyburgers, unprepared'], ['baked beans', 'Beans, baked, canned, with pork'],
  ]) assert.equal(referenceProteinMismatch(name, description), false, `${name} | ${description}`);
});
test('two different named animals still conflict, however the dish is worded (#617)', () => {
  for (const [name, description] of [
    ['squid nigiri', 'Sushi roll, tuna'], ['pork chop', 'Beef, ribeye steak, cooked'], ['chicken curry', 'Fish, salmon, Atlantic, cooked'],
    ['tuna', 'Fish, salmon, Atlantic, raw'], ['salmon', 'Fish, cod, Atlantic, cooked'], ['grilled fish', 'Mollusks, squid'],
    ['chicken fried rice', 'Fried rice, with pork'], ['beef and broccoli', 'Chicken and broccoli'], ['ham', 'Roast beef, deli style, prepackaged, sliced'],
    ['chicken satay', 'Satay, beef'], ['tuna steak', 'Beef, steak, cooked'],
  ]) assert.equal(referenceProteinMismatch(name, description), true, `${name} | ${description}`);
});
test('a named main protein replaces what the dish word implies; a topping does not (#617)', () => {
  for (const [name, description] of [
    ['chicken burger', 'Hamburger, with beef'], ['fish burger', 'Hamburger, with beef'], ['turkey burger', 'Hamburger, with beef'],
    ['chicken meatballs', 'Meatballs, with beef'], ['chicken burger', 'Hamburger, single patty'], ['turkey meatballs', 'Meatballs, Swedish, beef and pork'],
    ['chicken hot dog', 'Frankfurter, beef, heated'], ['veggie burger', 'Beef, ground, patty, cooked'], ['lentil meatballs', 'Meatballs, beef, cooked'],
  ]) assert.equal(referenceProteinMismatch(name, description), true, `${name} | ${description}`);
  assert.equal(referenceProteinMismatch('bacon cheeseburger', 'Beef, ground, 85% lean meat / 15% fat, patty, cooked, broiled'), false);
});
