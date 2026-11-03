// node --import tsx --env-file=.env.local --test tests/drinks-from-items.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { drinksFromItems, isDrinkItem } from '../src/lib/intake/drinks-from-items.ts';
import { foodCategory, parseFoodDetail } from '../src/lib/fdc/client.ts';
import { getPostHydrationData, itemWaterMl } from '../src/lib/intake/hydration.ts';
import { cardDataFromRow } from '../src/lib/pipeline/card-data.ts';
import { logMeal } from '../src/lib/posts/saved.ts';
import { summaryLine } from '../src/lib/posts/summary-line.ts';

const item = (changes = {}) => ({ id: 'cola', name: 'Cola', food_category: 'soft drinks', portion_text: '355 ml', portion_grams: 355,
  micronutrients: [{ nutrientId: 1057, value: 34, unitName: 'MG', basis: 'portion' }], ...changes });
test('cola and water keep their volume, reference caffeine and separate identities', () => {
  assert.deepEqual(drinksFromItems([item()]), [{ post_item_id: 'cola', kind: 'caffeine', amount: 34, ml: 355, label: 'Cola', caffeineMg: 34 }]);
  assert.deepEqual(drinksFromItems([item({ id: 'water', name: 'Water', food_category: 'water', portion_text: '250 ml', portion_grams: 250, micronutrients: [] })]),
    [{ post_item_id: 'water', kind: 'water', amount: 250, ml: 250, label: 'Water', caffeineMg: 0 }]);
  const five = drinksFromItems(Array.from({ length: 5 }, (_, i) => item({ id: `bottle-${i}` })));
  assert.equal(five.length, 5);
  assert.equal(new Set(five.map(row => row.post_item_id)).size, 5);
});
test('millilitres and words in a food name cannot classify food as a drink', () => {
  for (const [name, food_category] of [['butternut squash soup', 'soups, sauces, and gravies'], ['soup', 'Soups, cream-based'], ['milk chocolate', 'sweets'], ['milk chocolate', 'Candy containing chocolate'], ['coffee cake', 'baked products'], ['coffee cake', 'Doughnuts, sweet rolls, pastries']]) {
    assert.equal(drinksFromItems([item({ name, food_category, portion_text: '400 ml', portion_grams: 400 })]).length, 0, name);
  }
  assert.equal(drinksFromItems([item({ name: '  black coffee  ', food_category: null })]).length, 1);
  assert.equal(drinksFromItems([item({ name: 'coffee cake', food_category: null })]).length, 0);
  assert.equal(drinksFromItems([item({ name: 'milk chocolate', food_category: null })]).length, 0);
});
test('actual WWEIA categories include waters, juices, milk, diet drinks and alcohol', () => {
  // USDA 2021–2023 Food Category List, plus spelling retained by older refs.
  for (const category of ['Tap water', 'Bottled water', 'Flavored or carbonated water', 'Enhanced water', 'Enhanced or fortified water',
    'Diet soft drinks', 'Diet sport and energy drinks', 'Other diet drinks', 'Soft drinks', 'Fruit drinks', 'Sport and energy drinks', 'Smoothies and grain drinks',
    'Citrus juice', 'Apple juice', 'Other fruit juice', 'Vegetable juice', 'Coffee', 'Tea', 'Beer', 'Wine', 'Liquor and cocktails',
    'Milk, whole', 'Milk, reduced fat', 'Milk, lowfat', 'Milk, nonfat', 'Flavored milk, whole', 'Plant-based milk', 'Milk shakes and other dairy drinks']) {
    assert.equal(drinksFromItems([item({ name: 'Reference beverage', food_category: category })]).length, 1, category);
  }
  assert.equal(isDrinkItem({ name: 'product', food_category: 'Carbonated Soda' }), true);
  assert.equal(isDrinkItem({ name: 'product', food_category: 'Sweetwater candies' }), false);
});
test('drink limits, missing caffeine, grams fallback and fully uneaten drinks', () => {
  const large = drinksFromItems([item({ portion_text: '6000 ml', micronutrients: [{ nutrientId: 1057, value: 1300, basis: 'portion' }] })])[0];
  assert.equal(large.ml, 5000); assert.equal(large.amount, 1000);
  const grams = drinksFromItems([item({ name: 'Coffee', portion_text: 'one cup', portion_grams: 240, micronutrients: [{ nutrientId: 1057, value: 95, basis: '100g' }] })])[0];
  assert.equal(grams.ml, 240); assert.equal(grams.caffeineMg, 0);
  assert.equal(drinksFromItems([item({ portion_text: '0 ml', portion_grams: 0 })]).length, 0);
  assert.equal(drinksFromItems([item({ portion_text: null, portion_grams: null })]).length, 0);
});
test('reference category parsing retains FDC search, SR/Foundation, Survey and Branded shapes', () => {
  assert.equal(foodCategory({ foodCategory: 'Bottled water' }), 'bottled water');
  assert.equal(foodCategory({ foodCategory: { description: 'Beverages' }, wweiaFoodCategory: { wweiaFoodCategoryDescription: 'Coffee' } }), 'beverages');
  assert.equal(foodCategory({ wweiaFoodCategory: { wweiaFoodCategoryDescription: 'Diet soft drinks' } }), 'diet soft drinks');
  assert.equal(foodCategory({ brandedFoodCategory: 'Carbonated Soda' }), 'carbonated soda');
  assert.equal(parseFoodDetail({ fdcId: 1, description: 'Cola', dataType: 'Survey (FNDDS)', foodNutrients: [], wweiaFoodCategory: { wweiaFoodCategoryDescription: 'Soft drinks' } }, 1).foodCategory, 'soft drinks');
});

const eaten_at = '2026-11-02T12:00:00Z';
const nutrient = { nutrientId: 1051, unitName: 'G', value: 100, basis: 'portion' };
const mockDb = (mixed) => {
  const tables = {
    intake_logs: [{ kind: 'caffeine', amount: 34, ml: 355, label: 'Cola', source: 'item', post_item_id: 'cola', post_id: 'post', logged_at: eaten_at }],
    posts: [{ id: 'post', eaten_at }],
    current_post_items: [item({ post_id: 'post' }), ...(mixed ? [{ id: 'soup', post_id: 'post', portion_grams: 200, portion_text: '200 g' }] : [])],
    item_nutrition: [{ post_item_id: 'cola', micronutrients: [nutrient] }, { post_item_id: 'soup', micronutrients: [nutrient] }],
  };
  return { from(table) {
    let start = 0, end = 999, ids, column;
    const chain = new Proxy({}, { get(_, key) {
      if (key === 'then') return resolve => resolve({ data: tables[table].filter(row => !ids || ids.includes(row[column])).slice(start, end + 1).map(row => table==='current_post_items'?{...row,item_nutrition:tables.item_nutrition.find(n=>n.post_item_id===row.id)}:row), error: null });
      if (key === 'in') return (key, value) => { column = key; ids = value; return chain; };
      if (key === 'range') return (a, b) => { start = a; end = b; return chain; };
      return () => chain;
    } }); return chain;
  } };
};
test('mixed meals retain food water while beverages count exactly once', async () => {
  const hydrated = (await getPostHydrationData(mockDb(true), 'owner', [{ id: 'post', eaten_at }], 'UTC')).post;
  assert.equal(hydrated.kind, 'meal'); assert.equal(hydrated.drink, null);
  assert.equal(hydrated.foodWaterMl, 80); assert.deepEqual(hydrated.dayHydration, { drinksMl: 355, foodMl: 80, totalMl: 435, caffeineMg: 34 });
  assert.deepEqual(hydrated.itemDrinks, [{ post_item_id: 'cola', label: 'Cola', ml: 355, caffeineMg: 34 }]);
  assert.equal(itemWaterMl({ portion_grams: 100, micronutrients: [nutrient] }, true), 0);
});
test('all-drink photo aggregates the card, while mixed meal copy retains consumed totals', async () => {
  const hydrated = (await getPostHydrationData(mockDb(false), 'owner', [{ id: 'post', eaten_at }], 'UTC')).post;
  assert.equal(hydrated.kind, 'drink'); assert.equal(hydrated.drink.source, 'item'); assert.equal(hydrated.drink.ml, 355);
  const mixed = { items: [{ name: 'Meal', portion_grams: 100, calories: 200, protein_g: 10, carbs_g: 20, fat_g: 8 }],
    itemDrinks: hydrated.itemDrinks, kind: 'meal' };
  assert.equal(cardDataFromRow(mixed).mealDrinkLine, 'Drank in this meal: 355 ml Cola · 34 mg caffeine');
  assert.match(summaryLine(mixed), /Consumed: 200 kcal · 355 ml drank · 34 mg caffeine · 10 g protein/);
});
test('0029 preserves categories in every SQL writer and restricts linked intake writes', () => {
  const sql = readFileSync(new URL('../supabase/migrations/0029_drinks_from_items.sql', import.meta.url), 'utf8');
  for (const fragment of ['food_category text', "source in ('sheet','item')", 'intake_one_sheet_drink_per_post', 'intake_one_drink_per_item', "source='sheet'", 'sync_item_drinks', "post_id is null and source='sheet' and post_item_id is null", 'revoke all on function public.sync_item_drinks', 'intake_source_shape', "source='sheet' and post_item_id is null", "source='item' and post_item_id is not null"]) assert.ok(sql.includes(fragment), fragment);
  for (const name of ['persist_analysis_initial', 'persist_correction', 'persist_photo_correction', 'apply_post_remainder', 'copy_owned_saved_meal', 'copy_owned_post', 'create_food_post_without_gtin', 'correct_barcode_item', 'edit_post_item_with_nutrition']) {
    const block = sql.slice(sql.indexOf(`function public.${name}(`));
    assert.match(block.slice(0, block.indexOf('$$;', block.indexOf('as $$') + 5) + 3) || block, /food_category/);
  }
});

test('a committed Log again copy survives a failed follow-up hydration read', async () => {
  let copies = 0;
  const db = { rpc: async name => { assert.equal(name, 'log_post_again'); copies++; return { data: 'copied-post', error: null }; } };
  const admin = { from() { throw new Error('network lost after copy commit'); } };
  const result = await logMeal(db, admin, 'source', new Date(Date.now() - 3600000).toISOString(), false);
  assert.deepEqual(result, { postId: 'copied-post' }); assert.equal(copies, 1);
  const sql = readFileSync(new URL('../supabase/migrations/0029_drinks_from_items.sql', import.meta.url), 'utf8');
  for (const name of ['copy_owned_saved_meal', 'copy_owned_post']) {
    const block = sql.slice(sql.indexOf(`function public.${name}(`));
    assert.match(block.slice(0, block.indexOf('end $$;')), /insert into public\.jobs[\s\S]*?drink_sync/);
  }
});

test('ambiguous SR dairy category permits anchored milk beverages and excludes solid names', () => {
  for (const name of ['Milk', 'Whole milk', 'Skim milk', '2% milk', 'Milk (2%)', 'Chocolate milk', 'Strawberry milk', 'Buttermilk', 'Eggnog', 'Vanilla milkshake',
    'Milk, buttermilk, fluid, whole', 'Milk, chocolate, fluid, commercial, whole, with added vitamin A and vitamin D']) {
    assert.equal(drinksFromItems([item({ name, food_category: 'Dairy and Egg Products' })]).length, 1, name);
  }
  for (const name of ['Cheese', 'Cheese, mozzarella, whole milk', 'Cheese, ricotta, whole milk', 'Milk chocolate', 'Milk, chocolate bar', 'Chocolate milk powder',
    'Coffee cake', 'Eggnog ice cream', 'Cream of mushroom soup', 'Milk, dry, whole', 'Condensed milk', 'Milk and cookies',
    'Yogurt', 'Yogurt, plain, whole milk', 'Ice cream', 'Ice cream, vanilla', 'Cream', 'Cream, whipping', 'Butter', 'Butter, salted', 'Milk and cream', 'Milk, with cream']) {
    assert.equal(drinksFromItems([item({ name, food_category: 'Dairy and Egg Products', portion_text: '400 ml' })]).length, 0, name);
  }
  // The exception cannot override a specific solid category or the no-category rule.
  assert.equal(drinksFromItems([item({ name: 'Chocolate milk', food_category: 'sweets' })]).length, 0);
  assert.equal(drinksFromItems([item({ name: 'Milk', food_category: null })]).length, 0);
});

test('a glass of milk adds drink volume while its calories stay on the drink card', () => {
  const milk = item({ name: 'Whole milk', food_category: 'Dairy and Egg Products', portion_text: '250 ml', portion_grams: 250, micronutrients: [], calories: 150, protein_g: 8, carbs_g: 12, fat_g: 8 });
  const snapshot = structuredClone(milk);
  const [record] = drinksFromItems([milk]);
  assert.equal(record.ml, 250); assert.equal(record.kind, 'water');
  const card = cardDataFromRow({ items: [milk], kind: 'drink', drink: { source: 'item', ml: record.ml, label: record.label, caffeineMg: 0, drinksMl: 250, foodMl: 0, totalMl: 250 } });
  assert.equal(card.kind, 'drink'); assert.equal(card.amountMl, 250); assert.equal(card.kcal, 150);
  assert.equal(card.drinkLine, 'Whole milk · 150 kcal'); assert.deepEqual(card.macros, { protein: 8, carbs: 12, fat: 8 });
  assert.deepEqual(milk, snapshot);
});


test('only cola gets a scaled caffeine fallback; portion values including zero win', () => {
  for (const name of ['Cola', 'Coca-Cola', 'Coca Cola', 'Coke', 'Pepsi']) {
    assert.equal(drinksFromItems([item({ name, portion_text: '330 ml', micronutrients: [] })])[0].caffeineMg, 32);
    assert.equal(drinksFromItems([item({ name, portion_text: '165 ml', micronutrients: [] })])[0].caffeineMg, 16);
  }
  assert.equal(drinksFromItems([item({ name: 'Cola', food_category: null, portion_text: '330 ml', micronutrients: [] })])[0].caffeineMg, 32);
  assert.equal(drinksFromItems([item({ name: 'Cola cake', food_category: null })]).length, 0);
  assert.equal(drinksFromItems([item({ name: 'Water', micronutrients: [] })])[0].caffeineMg, 0);
  assert.equal(drinksFromItems([item({ portion_text: '330 ml' })])[0].caffeineMg, 34);
  assert.equal(drinksFromItems([item({ micronutrients: [{ nutrientId: 1057, value: 0, basis: 'portion' }] })])[0].caffeineMg, 0);
});

test('alcohol keeps caffeine only when its name contains a caffeine source',()=>{
 const make=(name,category,value)=>({id:'drink',name,food_category:category,portion_text:'220 ml',portion_grams:220,micronutrients:[{nutrientId:1057,nutrientName:'Caffeine',unitName:'MG',basis:'portion',value}]});
 const [tiki]=drinksFromItems([make('Lime and rum tiki cocktail','Liquor and cocktails',15)]);
 assert.equal(tiki.caffeineMg,0);assert.notEqual(tiki.kind,'caffeine');
 assert.equal(drinksFromItems([make('Rum and coke','Liquor and cocktails',20)])[0].caffeineMg,20);
 assert.equal(drinksFromItems([make('Coffee','Coffee',95)])[0].caffeineMg,95);
});
