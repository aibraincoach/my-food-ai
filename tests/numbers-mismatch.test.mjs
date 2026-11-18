import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRecord, recordContradicts } from '../src/lib/fdc/record-kind.ts';
import { rank, score } from '../scripts/numbers/mismatch.mjs';
import { parseFoodsFile, recheckOutcome, restoreReason, UsageError } from '../scripts/numbers/reanalyse.mjs';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('the detector refuses a write even when a pooler ignores PGOPTIONS', { skip: process.env.MFA_TEST_DISPOSABLE !== '1' }, () => {
  assert.equal(new URL(process.env.SUPABASE_DB_URL).hostname, '127.0.0.1');
  const root = mkdtempSync(path.join(tmpdir(), 'mismatch-readonly-'));
  const source = fileURLToPath(new URL('..', import.meta.url));
  try {
    mkdirSync(path.join(root, 'scripts/numbers'), { recursive: true });
    mkdirSync(path.join(root, 'src/lib/fdc'), { recursive: true });
    mkdirSync(path.join(root, 'bin'));
    cpSync(path.join(source, 'scripts/numbers/mismatch.mjs'), path.join(root, 'scripts/numbers/mismatch.mjs'));
    cpSync(path.join(source, 'src/lib/fdc/record-kind.ts'), path.join(root, 'src/lib/fdc/record-kind.ts'));
    const realPsql = spawnSync('which', ['psql'], { encoding: 'utf8' }).stdout.trim();
    // Model a transaction pooler that discards connection-startup settings.
    writeFileSync(path.join(root, 'bin/psql'), `#!/bin/sh\nunset PGOPTIONS\nexec '${realPsql.replaceAll("'", "'\\''")}' -q "$@"\n`, { mode: 0o700 });
    const run = () => spawnSync(process.execPath, [path.join(root, 'scripts/numbers/mismatch.mjs')], {
      env: { ...process.env, PATH: `${path.join(root, 'bin')}:${process.env.PATH}` }, encoding: 'utf8', timeout: 15000,
    });
    writeFileSync(path.join(root, 'scripts/numbers/23-records.sql'), 'update public.posts set id=id where false;\n');
    const refused = run();
    assert.notEqual(refused.status, 0, 'an injected zero-row write must be refused');
    assert.match(refused.stderr, /cannot execute UPDATE in a read-only transaction/);
    writeFileSync(path.join(root, 'scripts/numbers/23-records.sql'), "select json_build_object('kind','meal','meal','aaaaaaaa','name','Papaya','how','match','description','Papayas, raw','category','fruits and fruit juices');\n");
    const read = run();
    assert.equal(read.status, 0, read.stderr);
    assert.match(read.stdout, /"checked": 1/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// #990: the known matches. BAD must be flagged by a strong signal; ok must not be; "ok?" (a close food judged wrong for
// its recipe or portion, not another kind of food) is not this check's job and is not flagged.
export const cases = [
 ['BAD','Japanese curry sauce','Persimmons, japanese, dried','fruits and fruit juices',274],
 ['BAD','Mixed green salad','Salad dressing, green goddess','salad dressings and vegetable oils',427],
 ['BAD','Lamb curry with rice','Lamb, ground, raw','lamb, veal, and game products',282],
 ['BAD','Grilled chicken','Chicken, broilers or fryers, breast, meat only, raw','poultry products',120],
 ['BAD','Papaya','Cookie, tea, Japanese','cookies and brownies',378],
 ['ok?','Pork soup dumpling','Bao bun','breads, rolls, tortillas',273],
 ['ok?','Lemon radler beer','Hard lemonade','liquor and cocktails',68],
 ['ok','Papaya','Papayas, raw','fruits and fruit juices',43],
 ['ok','Coconut rice','Rice, white, cooked, with coconut milk','rice',267],
 ['ok','Roasted peanuts','Peanuts, all types, oil-roasted, with salt','legumes and legume products',599],
 ['ok','Japanese curry sauce','Sauce, curry','dips, gravies, other sauces',110],
 ['ok','Mixed green salad','Lettuce salad with assorted vegetables','vegetable mixed dishes',20],
 ['ok','Iced sweet tea','Tea, iced, brewed, sweetened','tea',32],
 ['ok','Espresso','Coffee, brewed','coffee',1],
 ['ok','Kopi susu','Coffee, with milk','coffee',40],
 ['ok','Grilled chicken','Chicken, broilers or fryers, breast, meat only, cooked, grilled','poultry products',165],
 ['ok','Tonkatsu','Pork cutlet, breaded, fried','pork',270],
 ['ok','Ranch salad dressing','Salad dressing, ranch','salad dressings and vegetable oils',430],
 ['ok','Fruit salad','Fruit salad, fresh','other fruits and fruit salads',50],
 ['ok','Watermelon','Watermelon, raw','melons',30],
 ['ok','Mai Tai cocktail','Mai Tai','liquor and cocktails',120],
 ['ok','Salmon sashimi','Fish, salmon, Atlantic, raw','finfish and shellfish products',208],
 ['ok','Fried egg','Egg, whole, fried','eggs',196],
 ['ok','Butter chicken','Chicken curry','chicken, whole pieces',150],
 ['ok','Chicken satay with peanut sauce','Chicken satay with peanut sauce','chicken mixed dishes',200],
 ['ok','Pork crackling','Pork skins, plain','snacks',544],
 ['ok','Avocado juice','Avocado smoothie','smoothies and grain drinks',90],
 ['ok','Dried mango','Mango, dried, sweetened','fruits and fruit juices',319],
 ['ok','Es kopi susu gula aren','Coffee, latte, sweetened','coffee',60],
 ['ok','Honey glazed chicken','Chicken, glazed, honey','poultry',200],
 ['ok','Chocolate cake','Cake, chocolate','cakes and pies',370],
 ['ok','Ice cream','Ice cream, vanilla','ice cream and frozen dairy desserts',207],
 ['ok','Sambal','Sauce, hot chile, sriracha','dips, gravies, other sauces',93],
 ['ok','Nasi goreng','Fried rice, meatless','rice mixed dishes',170],
 ['ok','Beef rendang','Beef curry','beef mixed dishes',180],
 ['ok','Steamed rice','Rice, white, cooked','rice',130],
];

test('the record check flags each known absurd match and none of the right ones', () => {
  for (const [label, name, description, category, kcal] of cases) {
    const flagged = checkRecord(name, { description, category, kcalPer100g: kcal }).strong.length > 0;
    assert.equal(flagged, label === 'BAD', `${label} ${name} -> ${description}`);
    assert.equal(recordContradicts(name, { description, foodCategory: category }), label === 'BAD', `matcher: ${name} -> ${description}`);
  }
});

test('the detector ranks strong flags first, skips estimates and own figures, and scores labels', () => {
  const rows = [
    { kind: 'meal', meal: 'd4971e89', item: 'aaaaaaaa', name: 'Japanese curry sauce', kcal: 822, kcal_per_100g: 274, how: 'match', category: 'fruits and fruit juices', description: 'Persimmons, japanese, dried' },
    { kind: 'meal', meal: '20512311', item: 'bbbbbbbb', name: 'Papaya', kcal: 90, kcal_per_100g: 43, how: 'match', category: 'fruits and fruit juices', description: 'Papayas, raw' },
    { kind: 'meal', meal: '11111111', item: 'cccccccc', name: 'Rendang', kcal: 300, how: 'estimate', description: null },
    { kind: 'saved', meal: '22222222', item: null, name: 'Mixed green salad', kcal: 213, kcal_per_100g: 427, how: 'match', category: 'salad dressings and vegetable oils', description: 'Salad dressing, green goddess' },
  ];
  const { checked, flagged, skipped } = rank(rows);
  assert.equal(checked.length, 3); assert.deepEqual(skipped, { estimate: 1 });
  assert.deepEqual(flagged.map(r => r.meal), ['22222222', 'd4971e89']);
  const s = score(flagged, checked, [{ meal: 'd4971e89', name: 'Japanese curry sauce', label: 'absurd' }, { meal: '20512311', name: 'papaya', label: 'right' }]);
  assert.equal(s.precision, 1); assert.equal(s.recall, 1); assert.deepEqual(s.false_flags, []);
});

test('a recheck reads only strong meal flags, and keeps a meal whose new record passes', () => {
  const file = [
    JSON.stringify({ kind: 'meal', meal: 'd4971e89', item: 'aaaaaaaa', name: 'Japanese curry sauce', strong: ['kind'] }),
    JSON.stringify({ kind: 'meal', meal: '33333333', item: 'dddddddd', name: 'Chicken and rice', strong: [], weak: ['part', 'density'] }),
    JSON.stringify({ kind: 'saved', meal: '22222222', item: null, name: 'Mixed green salad', strong: ['kind'] }),
  ].join('\n');
  assert.deepEqual([...parseFoodsFile(file)], [['d4971e89', [{ item: 'aaaaaaaa', name: 'Japanese curry sauce' }]]]);
  assert.throws(() => parseFoodsFile(JSON.stringify({ kind: 'saved', meal: '22222222', strong: ['kind'] })), UsageError);
  const before = { items: [{ name: 'Tonkatsu', superseded_at: null }, { name: 'Japanese curry sauce', superseded_at: null }] };
  const fixed = recheckOutcome(['food 2: nutrient 1092', 'food 1: nutrient 1092'], before, ['Japanese curry sauce'],
    [{ name: 'Tonkatsu', how: 'match', category: 'pork', description: 'Pork cutlet, breaded, fried' }, { name: 'Japanese curry sauce', how: 'match', category: 'dips, gravies, other sauces', description: 'Sauce, curry' }]);
  assert.deepEqual(fixed, { removed: ['food 2: nutrient 1092'], kept: ['food 1: nutrient 1092'], passed: true, still: [] });
  assert.equal(restoreReason({ outcome: 'changed', values_lost: [], calories_change: -0.6, recheck_passed: true }), null);
  assert.match(restoreReason({ outcome: 'changed', values_lost: [], calories_change: -0.6 }), /moved by -60.0%/);
  const again = recheckOutcome([], before, ['Japanese curry sauce'], [{ name: 'Japanese curry sauce', how: 'match', category: 'fruits and fruit juices', description: 'Persimmons, japanese, dried' }]);
  assert.equal(again.passed, false);
  assert.match(restoreReason({ outcome: 'changed', values_lost: [], calories_change: 0.1, recheck_still: again.still }), /still another kind/);
  assert.equal(recheckOutcome([], before, ['Japanese curry sauce'], [{ name: 'Japanese curry sauce', how: 'estimate', description: null }]).passed, true);
});
