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
