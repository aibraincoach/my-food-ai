// node --import tsx --test tests/item-food-selection.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { editPostItem, parseItemEdit } from '../src/lib/posts/items.ts';

test('selected FDC identity wins over first/ranked food and client nutrient forgery', async () => {
  const foods = [
    { fdcId: 11, description: 'Rice', dataType: 'Foundation', foodNutrients: [{ nutrientId: 1008, nutrientName: 'Energy', unitName: 'KCAL', value: 900 }] },
    { fdcId: 22, description: 'Rice', dataType: 'Branded', foodNutrients: [{ nutrientId: 1008, nutrientName: 'Energy', unitName: 'KCAL', value: 100 }] },
  ];
  let calls = 0;
  const notes = [];
  const admin = {
    from: table => {
      if (table === 'post_comments') return { insert: async row => { notes.push(row); return { error: null }; } };
      assert.equal(table, 'fdc_cache');
      return { select: () => ({ eq: (_column, query) => {
        assert.ok(['fdc-search-v2:rice'].includes(query));
        return { maybeSingle: async () => ({ data: { response: {kind:'fdc-search-v2',query:'rice',payload:{foods}} }, error: null }) };
      } }) };
    },
    rpc: async (name, args) => {
      calls++;
      assert.equal(name, 'edit_post_item_with_nutrition');
      assert.equal(args.p_nutrition.source_ref, '22');
      assert.equal(args.p_nutrition.calories, 50);
      return { data: 'new-item', error: null };
    },
  };
  const payload = { action: 'add', name: 'Rice', portion_grams: 50, fdc_selection: { id: 22, query: 'rice' }, nutrition: { calories: 9999 } };
  assert.equal((await editPostItem(admin, 'post', 'owner', parseItemEdit(payload))).itemId, 'new-item');
  assert.equal((await editPostItem(admin, 'post', 'owner', parseItemEdit({ ...payload, fdc_selection: { id: 999, query: 'rice' } }))).error.code, '22023');
  assert.equal((await editPostItem(admin, 'post', 'owner', parseItemEdit({ ...payload, name: 'Forged description' }))).error.code, '22023');
  assert.equal(calls, 1, 'unverified selections must not write');
  assert.deepEqual(notes, [{ post_id: 'post', author: 'model', body: 'Added Rice, 50 g.' }], 'only the committed edit is noted in the thread');
});

test('a portion edit with no name still notes the item by its current name', async () => {
  const notes = [];
  const admin = {
    from: table => table === 'post_comments' ? { insert: async row => { notes.push(row.body); return { error: null }; } }
      : { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { name: 'Rice' }, error: null }) }) }) }) },
    rpc: async () => ({ data: null, error: null }),
  };
  const id = '0f0659f8-d3b4-4bc0-8c4d-8c4d8c4d8c4d';
  await editPostItem(admin, 'post', 'owner', { action: 'portion', item_id: id, portion_grams: 150 });
  assert.deepEqual(notes, ['Rice set to 150 g.']);
});
