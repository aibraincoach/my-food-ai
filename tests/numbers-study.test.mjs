import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { estimateMeal, compareStudy, requeryWanted, mergeCandidates } from '../scripts/numbers/study.mjs';
const script = fileURLToPath(new URL('../scripts/numbers/study.mjs', import.meta.url));
const run = (args, file = script) => spawnSync(process.execPath, [file, ...args], { encoding: 'utf8', timeout: 5000, env: { ...process.env, FDC_API_KEY: 'synthetic-test-key' } });
const fixture = t => { const dir = mkdtempSync(path.join(tmpdir(), 'f32-study-test-')); t.after(() => rmSync(dir, { recursive: true, force: true })); return dir; };

test('non-finite stored or estimated totals are incomplete and never counted as agreeing or disagreeing', () => {
  for (const bad of [NaN, Infinity, -Infinity]) {
    for (const [estimate, stored] of [[100, bad], [bad, 100]]) {
      const r = compareStudy([{ meal: 'meal-01', complete: true, kcal: estimate }], { 'meal-01': '12345678' }, { '12345678': stored });
      assert.equal(r.rows[0].complete, false); assert.equal(r.rows[0].agrees, null);
      assert.equal(r.complete, 0); assert.equal(r.agree, 0); assert.equal(r.closes, false);
    }
  }
});

test('a meal with no foods is incomplete and has no calorie total', () => {
  assert.deepEqual(estimateMeal({ meal: 'meal-01', foods: [] }, null, {}), { meal: 'meal-01', complete: false, kcal: null, foods: [] });
});

test('a non-finite food value cannot seal a meal as complete', () => {
  const r = estimateMeal({ meal: 'meal-01', foods: [{ key: 'rice', grams: NaN }] }, { foods: [{ key: 'rice', fdcId: 1 }] }, { rice: { ok: true, foods: [{ fdcId: 1, kcal_per_100g: 100 }] } });
  assert.equal(r.complete, false); assert.equal(r.kcal, null);
});

test('candidates rejects invalid max-minutes before looking up any food', t => {
  const dir = fixture(t); writeFileSync(path.join(dir, 'portions.json'), '[]');
  for (const value of ['NaN', 'Infinity', '0', '-1']) {
    const r = run(['candidates', `--blind=${dir}`, `--max-minutes=${value}`]);
    assert.notEqual(r.status, 0); assert.match(r.stderr, /--max-minutes must be a finite number above zero/);
  }
});

test('each command names its missing required paths', () => {
  for (const [step, flag] of [['prepare', 'drafts'], ['candidates', 'blind'], ['total', 'blind'], ['compare', 'estimates']]) {
    const r = run([step]); assert.notEqual(r.status, 0); assert.match(r.stderr, new RegExp(`--${flag} is required`));
  }
});

test('the unused cache flag is rejected rather than silently ignored', () => {
  const r = run(['prepare', '--cache=unused']); assert.notEqual(r.status, 0); assert.match(r.stderr, /Unknown option.*cache/);
});

test('the CLI runs when its path contains spaces and percent characters', t => {
  const dir = fixture(t); const special = path.join(dir, 'space and % character'); mkdirSync(special);
  const file = path.join(special, 'study.mjs'); copyFileSync(script, file);
  const r = run(['--help'], file); assert.equal(r.status, 0); assert.match(r.stdout, /node scripts\/numbers\/study.mjs prepare/);
});

test('an explicitly empty sealed food list stays incomplete during comparison', () => {
  const r = compareStudy([{ meal: 'meal-01', complete: true, kcal: 0, foods: [] }], { 'meal-01': '12345678' }, { '12345678': 0 });
  assert.equal(r.rows[0].complete, false); assert.equal(r.rows[0].agrees, null); assert.equal(r.complete, 0);
});

test('a rounded total that overflows is incomplete', () => {
  const r = estimateMeal({ meal: 'meal-01', foods: Array.from({ length: 20 }, () => ({ key: 'rice', grams: 1 })) }, { foods: [{ key: 'rice', fdcId: 1 }] }, { rice: { ok: true, foods: [{ fdcId: 1, kcal_per_100g: 1e308 }] } });
  assert.equal(r.complete, false); assert.equal(r.kcal, null);
});

// #990, Fleet 34: a reader that finds no fitting record names a better search; a meal with no photo uses its caption.
test('a second search is asked once per food and query, only for an unchosen food of that meal', () => {
  const portions = [{ meal: 'meal-01', foods: [{ key: 'coffee', grams: 120 }, { key: 'oil', grams: 5 }] }, { meal: 'meal-02', foods: [{ key: 'coffee', grams: 200 }] }];
  const choices = { 'meal-01': { foods: [{ key: 'coffee', fdcId: null, query: 'coffee with condensed milk' }, { key: 'oil', fdcId: 7, query: 'ignored' }] },
    'meal-02': { foods: [{ key: 'coffee', fdcId: null, query: 'Coffee with condensed milk ' }, { key: 'not_in_meal', fdcId: null, query: 'x' }] } };
  assert.deepEqual(requeryWanted(portions, choices), [{ key: 'coffee', query: 'coffee with condensed milk', meals: ['meal-01', 'meal-02'] }]);
  assert.deepEqual(requeryWanted(portions, { 'meal-01': { foods: [{ key: 'coffee', fdcId: null, query: '  ' }] } }), []);
});

test('second-search results join a food once each, after its first candidates, and a failed search changes nothing', () => {
  const existing = { ok: true, query: 'coffee', foods: [{ fdcId: 1, kcal_per_100g: 1 }] };
  const merged = mergeCandidates(existing, { ok: true, query: 'coffee with milk', attempts: [200], foods: [{ fdcId: 1, kcal_per_100g: 1 }, { fdcId: 2, kcal_per_100g: 60 }] });
  assert.deepEqual(merged.foods.map(f => f.fdcId), [1, 2]);
  assert.equal(merged.foods[1].requery, 'coffee with milk');
  assert.equal(merged.query, 'coffee');
  assert.deepEqual(merged.requeries, [{ query: 'coffee with milk', attempts: [200], added: 1 }]);
  assert.equal(mergeCandidates(existing, { ok: false, query: 'x', attempts: [500] }), existing);
});

test('prepare studies a meal with no photo from its caption, and still refuses one with neither', t => {
  const dir = fixture(t);
  mkdirSync(path.join(dir, 'sample', 'aaaaaaaa'), { recursive: true });
  writeFileSync(path.join(dir, 'drafts.json'), JSON.stringify([{ meal: 'aaaaaaaa', foods: [{ key: 'rice', grams: 150 }], storedNumbersRead: false }]));
  writeFileSync(path.join(dir, 'captions.json'), JSON.stringify({ aaaaaaaa: 'a plate of rice' }));
  const ok = run(['prepare', `--drafts=${path.join(dir, 'drafts.json')}`, `--sample=${path.join(dir, 'sample')}`, `--blind=${path.join(dir, 'blind')}`, `--map=${path.join(dir, 'map.json')}`, `--captions=${path.join(dir, 'captions.json')}`]);
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(readFileSync(path.join(dir, 'blind', 'meal-01', 'caption.txt'), 'utf8'), 'a plate of rice\n');
  const refused = run(['prepare', `--drafts=${path.join(dir, 'drafts.json')}`, `--sample=${path.join(dir, 'sample')}`, `--blind=${path.join(dir, 'blind2')}`, `--map=${path.join(dir, 'map2.json')}`]);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /has no photo/);
});
