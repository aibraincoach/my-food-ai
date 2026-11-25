import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, HELP, UsageError, carryPlan, compareTotals, findSnapshot, isInside, ledgerRefusal, lostValues, parseArgs, parseMealsFile, relativeChange, restoreParams, restoreReason, stopReason, summaryTable } from '../scripts/numbers/reanalyse.mjs';

const script = fileURLToPath(new URL('../scripts/numbers/reanalyse.mjs', import.meta.url));
const A = '11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa', B = '22222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const item = (id, superseded_at, calories) => ({ id, superseded_at, nutrition: { calories } });
const snapshot = (id, status = 'ready', extra = {}) => ({ post: { id, status, analysis_initialized_at: '2026-11-01T00:00:00+00:00' },
  items: [item('aaaaaaaa-0000-4000-8000-000000000001', '2026-11-02T00:00:00+00:00', 10), item('aaaaaaaa-0000-4000-8000-000000000002', null, 20), item('aaaaaaaa-0000-4000-8000-000000000003', null, 30)],
  comments: [{ id: 'cccccccc-0000-4000-8000-000000000001', author: 'user', body: 'mine' }, { id: 'cccccccc-0000-4000-8000-000000000002', author: 'model', body: 'Consumed: 50 kcal' }, { id: 'cccccccc-0000-4000-8000-000000000003', author: 'model', body: 'later' }], ...extra });

test('run arguments are parsed with their defaults and limits', () => {
  assert.deepEqual(parseArgs(['run', '--mode=rematch', '--meals=1E5F8815, 8e7033dd', '--ledger=/private/l']),
    { command: 'run', mode: 'rematch', meals: ['1e5f8815', '8e7033dd'], ledger: '/private/l', dryRun: false, waitSeconds: 300, maxMeals: 10, maxMinutes: 45 });
  const fromFile = parseArgs(['run', '--mode=reanalyse', '--meals-file=list', '--ledger=/l', '--max-meals=3', '--max-minutes=5', '--wait-seconds=600', '--dry-run'], (file) => { assert.equal(file, 'list'); return '# first\n1e5f8815\n\n 8e7033dd \n'; });
  assert.deepEqual(fromFile, { command: 'run', mode: 'reanalyse', meals: ['1e5f8815', '8e7033dd'], ledger: '/l', dryRun: true, waitSeconds: 600, maxMeals: 3, maxMinutes: 5 });
  assert.deepEqual(parseMealsFile('1e5f8815\n# no\n'), ['1e5f8815']);
  assert.deepEqual(parseArgs(['--help']), { command: 'help' });
});

test('wrong run arguments are refused as usage errors', () => {
  const bad = [
    [], ['again'], ['run', '--mode=rematch', '--meals=1e5f8815'], ['run', '--meals=1e5f8815', '--ledger=/l'], ['run', '--mode=both', '--meals=1e5f8815', '--ledger=/l'],
    ['run', '--mode=rematch', '--ledger=/l'], ['run', '--mode=rematch', '--meals=1e5f8815', '--meals-file=x', '--ledger=/l'],
    ['run', '--mode=rematch', '--meals=1e5f881', '--ledger=/l'], ['run', '--mode=rematch', '--meals=1e5f8815-a836-4c46-a933-d903fe443122', '--ledger=/l'],
    ['run', '--mode=rematch', '--meals=1e5f8815,1e5f8815', '--ledger=/l'], ['run', '--mode=rematch', '--meals=', '--ledger=/l'],
    ['run', '--mode=rematch', '--meals=1e5f8815', '--ledger=/l', '--wait-seconds=601'], ['run', '--mode=rematch', '--meals=1e5f8815', '--ledger=/l', '--max-meals=0'],
    ['run', '--mode=rematch', '--meals=1e5f8815', '--ledger=/l', '--max-minutes=1.5'], ['run', '--mode=rematch', '--meals=1e5f8815', '--ledger=/l', '--force'],
    ['run', '--mode=rematch', '--meals=1e5f8815', '--ledger=/l', '--meal=1e5f8815'], ['restore', '--ledger=/l'], ['restore', '--meal=1e5f8815'],
    ['restore', '--meal=1e5f8815,8e7033dd', '--ledger=/l'], ['restore', '--meal=1e5f8815', '--ledger=/l', '--mode=rematch'], ['restore', '--meal=1e5f8815', '--ledger=/l', '--snapshot=middle'],
  ];
  for (const argv of bad) assert.throws(() => parseArgs(argv, () => '1e5f8815'), UsageError, argv.join(' '));
  assert.throws(() => parseArgs(['run', '--mode=rematch', '--meals-file=x', '--ledger=/l'], () => { throw Error('missing'); }), UsageError);
  assert.deepEqual(parseArgs(['restore', '--meal=1e5f8815', '--ledger=/l']), { command: 'restore', meal: '1e5f8815', ledger: '/l', snapshot: 'last', waitSeconds: 300 });
});

test('a ledger directory inside the repository is refused', () => {
  assert.equal(isInside('/repo', '/repo'), true);
  assert.equal(isInside('/repo', '/repo/uploads/ledger'), true);
  assert.equal(isInside('/repo', '/repo-ledger'), false);
  assert.equal(isInside('/repo', '/home/me/ledger'), false);
  assert.equal(isInside('/repo/sub', '/repo'), false);
  assert.match(ledgerRefusal('/repo/uploads/ledger', ['/elsewhere', '/repo']), /inside the repository/);
  assert.equal(ledgerRefusal('/home/me/ledger', ['/repo', undefined]), null);
});

test('each stop condition fires before the next meal and not after the last', () => {
  const base = { outcomes: [], started: 0, remaining: 5, maxMeals: 10, maxMinutes: 45, elapsedMinutes: 0 };
  assert.equal(stopReason(base), null);
  assert.match(stopReason({ ...base, outcomes: ['changed'], started: 1, maxMeals: 1 }), /--max-meals reached \(1\)/);
  assert.equal(stopReason({ ...base, outcomes: ['changed'], started: 1, maxMeals: 1, remaining: 0 }), null);
  assert.match(stopReason({ ...base, elapsedMinutes: 45 }), /--max-minutes used up \(45\)/);
  assert.equal(stopReason({ ...base, elapsedMinutes: 44.9 }), null);
  assert.match(stopReason({ ...base, outcomes: ['changed', 'failed', 'timeout'], started: 3 }), /two meals in a row/);
  assert.match(stopReason({ ...base, outcomes: ['timeout', 'timeout'], started: 2 }), /two meals in a row/);
  assert.equal(stopReason({ ...base, outcomes: ['failed', 'changed', 'failed'], started: 3 }), null);
  assert.equal(stopReason({ ...base, outcomes: ['failed', 'skipped', 'timeout', 'unchanged'], started: 4 }), null);
  const nine = ['failed', ...Array(8).fill('changed')];
  assert.equal(stopReason({ ...base, outcomes: [...nine, 'changed'], started: 10, maxMeals: 50 }), null, 'one in ten is allowed');
  assert.equal(stopReason({ ...base, outcomes: ['failed', 'changed', 'failed', 'changed'], started: 4, maxMeals: 50 }), null, 'not before ten meals');
  assert.match(stopReason({ ...base, outcomes: [...nine, 'changed', 'failed', 'changed'].slice(1).concat('failed', 'changed'), started: 13, maxMeals: 50 }), /more than one in ten meals failed \(2 of 13\)/);
  assert.match(stopReason({ ...base, outcomes: ['timeout'], started: 1, previousInFlight: true }), /still being worked/);
  assert.equal(stopReason({ ...base, outcomes: ['timeout'], started: 1, previousInFlight: true, remaining: 0 }), null);
});

test('totals decide changed or unchanged and the relative change in calories', () => {
  const t = { status: 'ready', items: 4, calories: 830, protein_g: 41.5, carbs_g: 83, fat_g: 37.35 };
  assert.equal(compareTotals(t, { ...t }), 'unchanged');
  assert.equal(compareTotals(t, { ...t, fat_g: 37.4 }), 'changed');
  assert.equal(compareTotals(t, { ...t, items: 5 }), 'changed');
  assert.equal(compareTotals({ ...t, calories: null }, { ...t, calories: null }), 'unchanged');
  assert.equal(compareTotals({ ...t, calories: null }, t), 'changed');
  assert.equal(relativeChange(1679, 830), -0.5057);
  assert.equal(relativeChange(830, 830), 0);
  assert.equal(relativeChange(0, 10), null);
  assert.equal(relativeChange(null, 10), null);
  assert.equal(relativeChange(10, null), null);
});

test('restore parameters come from the snapshot line of that meal', () => {
  const later = snapshot(A, 'ready', { comments: [] });
  const text = [JSON.stringify(snapshot(A)), JSON.stringify(snapshot(B)), 'not json', '', JSON.stringify(later), JSON.stringify(snapshot(A, 'failed', { items: [] }))].join('\n');
  assert.equal(findSnapshot(text, '11111111').count, 2, 'a snapshot of a meal that was not ready is not used');
  assert.deepEqual(findSnapshot(text, '11111111').snapshot, later);
  assert.deepEqual(findSnapshot(text, '11111111', 'first').snapshot, snapshot(A));
  assert.throws(() => findSnapshot(text, '33333333'), UsageError);
  assert.throws(() => findSnapshot(JSON.stringify(snapshot(A)) + '\n' + JSON.stringify(snapshot('11111111-cccc-4ccc-8ccc-cccccccccccc')), '11111111'), /Two different meals/);
  assert.deepEqual(restoreParams(snapshot(A)), { post: A, old_ids: '{aaaaaaaa-0000-4000-8000-000000000002,aaaaaaaa-0000-4000-8000-000000000003}',
    summary_comment_id: 'cccccccc-0000-4000-8000-000000000002', old_summary: 'Consumed: 50 kcal',old_message:'null',old_summary_pointer:'', analysis_initialized_at: '2026-11-01T00:00:00+00:00' });
  const none = restoreParams(later);
  assert.equal(none.summary_comment_id, '00000000-0000-0000-0000-000000000000');
  assert.equal(none.old_summary, '');
  assert.throws(() => restoreParams(snapshot(A, 'ready', { items: [item('aaaaaaaa-0000-4000-8000-000000000001', '2026-11-02T00:00:00+00:00', 1)] })), UsageError);
  assert.throws(() => restoreParams(snapshot(A, 'ready', { items: [item("x'}; drop", null, 1)] })), UsageError);
});

test('the summary shows prefixes only and adds up', () => {
  const rows = [{ meal: '11111111', mode: 'rematch', outcome: 'changed', before: { items: 4, calories: 1679 }, after: { items: 4, calories: 830 }, calories_change: -0.5057, seconds_waited: 2, model_calls: 28 },
    { meal: '22222222', mode: 'rematch', outcome: 'skipped', before: { items: 0, calories: null }, after: { items: 0, calories: null }, calories_change: null, seconds_waited: 0, model_calls: 0 }];
  const table = summaryTable(rows);
  assert.ok(table.includes('11111111  rematch  changed  4 -> 4  1679.0       830.0       -50.6%  2         28'), table);
  assert.match(table, /Totals: 2 meal\(s\): 1 changed, 1 skipped; kcal 1679\.0 -> 830\.0; 28 model call\(s\); 2 s waited\./);
  assert.doesNotMatch(table, /[0-9a-f]{8}-[0-9a-f]{4}-/);
});

test('the command line answers --help and refuses bad usage without a database', () => {
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env: { PATH: process.env.PATH } });
  const help = run('--help');
  assert.equal(help.status, EXIT.ok);
  assert.equal(help.stdout.trim(), HELP);
  assert.equal(run('run', '--mode=rematch', '--meals=1e5f8815').status, EXIT.usage);
  const inside = run('run', '--mode=rematch', '--meals=1e5f8815', '--dry-run', '--ledger=' + fileURLToPath(new URL('../uploads/ledger', import.meta.url)));
  assert.equal(inside.status, EXIT.usage);
  assert.match(inside.stderr, /inside the repository/);
  const outside = run('run', '--mode=rematch', '--meals=1e5f8815', '--dry-run', '--ledger=/nonexistent-private/ledger');
  assert.equal(outside.status, EXIT.usage);
  assert.match(outside.stderr, /Set SUPABASE_DB_URL/);
});

// Exercise the public CLI without a database or app: only psql and fetch are replaced.
function cliFixture(t, { restore = false, usage = [], after = null, before = null, carried = null } = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'mfa-numbers-cli-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const ledger = path.join(directory, 'ledger'), calls = path.join(directory, 'calls.jsonl');
  const fixture = path.join(directory, 'fixture.json'), preload = path.join(directory, 'fetch.mjs');
  writeFileSync(fixture, JSON.stringify({ id: A, snapshot: before ?? snapshot(A), restore, usage, after, carried }));
  writeFileSync(calls, '');
  const psql = path.join(directory, 'psql');
  writeFileSync(psql, `#!${process.execPath}
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
const fixture = JSON.parse(readFileSync(process.env.NUMBERS_FIXTURE, 'utf8'));
const args = process.argv.slice(2), index = args.indexOf('-f');
const file = index < 0 ? null : path.basename(args[index + 1]);
const sql = file ? '' : readFileSync(0, 'utf8');
const previous = readFileSync(process.env.NUMBERS_CALLS, 'utf8');
appendFileSync(process.env.NUMBERS_CALLS, JSON.stringify({ type: 'psql', file, sql }) + '\\n');
if (file === '08-snapshot.sql') console.log(JSON.stringify(fixture.carried && previous.includes('16-carry.sql') ? fixture.carried : fixture.after && previous.includes('11-rematch.sql') ? fixture.after : fixture.snapshot));
else if (file === '09-usage.sql') {
  const columns = ['post','kind','model','step','calls','errors','input_tokens','output_tokens','duration_ms','first_call','last_call'];
  console.log(columns.join('\\x1f'));
  for (const row of fixture.usage) console.log(columns.map(key => row[key] ?? '-').join('\\x1f'));
} else if (file === '11-rematch.sql') console.log('queued');
else if (file === '16-carry.sql') console.log('carried');
else if (sql.includes('select left(id::text, 8)')) console.log(fixture.id.slice(0, 8) + ' ' + fixture.id);
else if (sql.includes('select json_build_object')) console.log(JSON.stringify({
  status: fixture.restore && !previous.includes('13-restore.sql') ? 'failed' : 'ready',
  items: 2, calories: 50, protein_g: 2, carbs_g: 6, fat_g: 1, deleted: false, job_in_flight: false
}));
else if (sql === 'select now();') console.log('2026-11-01T00:00:00+00:00');
else if (sql.includes('select count(*) from public.jobs')) console.log(fixture.restore ? '0' : '1');
else if (!sql.includes('13-restore.sql')) throw Error('Unexpected fake psql query: ' + sql);
`);
  chmodSync(psql, 0o700);
  writeFileSync(preload, `import { appendFileSync } from 'node:fs';
globalThis.fetch = async url => {
  if (String(url) !== 'http://127.0.0.1:1/api/jobs/tick') throw Error('Unexpected app address');
  appendFileSync(process.env.NUMBERS_CALLS, JSON.stringify({ type: 'tick' }) + '\\n');
  return new Response(null, { status: 204 });
};
`);
  if (restore) {
    // The command's own private writer is exercised by run; restore needs an existing snapshot.
    mkdirSync(ledger, { mode: 0o700 });
    appendFileSync(path.join(ledger, 'snapshots.jsonl'), JSON.stringify(snapshot(A)) + '\n', { mode: 0o600 });
  }
  const result = spawnSync(process.execPath, ['--import', preload, script,
    ...(restore ? ['restore', '--meal=11111111'] : ['run', '--mode=rematch', '--meals=11111111']),
    '--ledger=' + ledger, '--wait-seconds=1'], {
    encoding: 'utf8', timeout: 10000,
    env: { PATH: directory, SUPABASE_DB_URL: 'postgresql://fixture.invalid/synthetic', APP_URL: 'http://127.0.0.1:1',
      NUMBERS_FIXTURE: fixture, NUMBERS_CALLS: calls },
  });
  assert.ifError(result.error);
  return { result, calls: readFileSync(calls, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)),
    ledger: () => readFileSync(path.join(ledger, 'ledger.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line)) };
}

test('restore refuses a zero-job SQL result even if its preliminary update left the meal ready', t => {
  const { result, calls } = cliFixture(t, { restore: true });
  assert.equal(result.status, EXIT.incomplete, result.stdout + result.stderr);
  assert.match(result.stderr, /restore refused.*no job/i);
  assert.doesNotMatch(result.stdout, /\brestored\b/);
  assert.equal(calls.filter(call => call.type === 'tick').length, 0, 'a refused restore must not wake the worker');
  assert.equal(calls.filter(call => call.sql?.includes('select json_build_object')).length, 1, 'do not wait on an unrelated ready state');
});

test('the CLI counts six model calls separately from eleven USDA wrapper, network and cache rows', t => {
  const usage = [
    { kind: 'fdc', model: '-', step: 'food_resolution', calls: 5 },
    { kind: 'fdc', model: '-', step: 'usda network', calls: 4 },
    { kind: 'fdc', model: '-', step: 'usda cache', calls: 2 },
    { kind: 'spark_search', model: 'muse-spark-1.3', step: 'search_query', calls: 6 },
  ];
  const { result, ledger } = cliFixture(t, { usage });
  assert.equal(result.status, EXIT.ok, result.stdout + result.stderr);
  assert.equal(ledger()[0].model_calls, 6);
  assert.match(result.stdout, /6 model call\(s\)/);
});

test('the CLI includes SAM, transcription and every Spark trace kind without requiring one provider model name', t => {
  const kinds = ['sam', 'transcribe', 'spark_identify', 'spark_correct', 'spark_same_meal', 'spark_search', 'spark_label', 'spark_remainder'];
  const usage = kinds.map((kind, index) => ({ kind, model: index % 2 ? '-' : 'another-provider-model', calls: 1 }));
  usage.push({ kind: 'fdc', model: '-', calls: 9 });
  const { result, ledger } = cliFixture(t, { usage });
  assert.equal(result.status, EXIT.ok, result.stdout + result.stderr);
  assert.equal(ledger()[0].model_calls, kinds.length, 'legacy rows with no model name are still model calls');
});

// #989: the PM's rule of 2026-11-17 counts any lost value as worse, zeros and micronutrients included.
test('lost values are the values a food had before and has no longer, matched by name', () => {
  const food = (name, nutrition) => ({ id: name, name, superseded_at: null, nutrition });
  const meal = (...items) => ({ items });
  const label = food('Packaged food', { calories: 140, protein_g: null, fat_g: 3.5, micronutrients: [] });
  assert.deepEqual(lostValues(meal(label), meal(food('Packaged food', { calories: null, protein_g: null, fat_g: null }))), ['food 1: calories', 'food 1: fat_g']);
  assert.deepEqual(lostValues(meal(food('Pepsi Zero', { calories: 0 })), meal(food('Pepsi Zero', { calories: null }))), ['food 1: calories'], 'a zero is a value');
  assert.deepEqual(lostValues(meal(food('salami', { calories: null })), meal(food('salami', { calories: 0 }))), [], 'NULL becoming a number is no loss');
  const micro = (...ids) => ids.map((nutrientId) => ({ nutrientId, value: 1, basis: 'portion' }));
  assert.deepEqual(lostValues(meal(food('a', { micronutrients: micro(1087, 1089) }), food('b', { calories: 1 })),
    meal(food('a', { micronutrients: [...micro(1087), { nutrientId: 1089, value: null }] }), food('b', { calories: 1 }))), ['food 1: nutrient 1089']);
  assert.deepEqual(lostValues(meal(food('rice', { calories: 200 })), meal(food('steamed rice', { calories: 210 }))), [], 'a renamed food keeps its values');
  assert.deepEqual(lostValues(meal(food('rice', { calories: 200, fat_g: 1 })), meal(food('steamed rice', { calories: 210 }))), ['renamed foods: fat_g']);
  assert.deepEqual(lostValues(meal(food('egg', { calories: 70 }), food('egg', { calories: 70 })), meal(food('egg', { calories: 70 }), food('egg', { calories: null }))), ['food 1: calories']);
  assert.deepEqual(lostValues(meal({ ...label, superseded_at: '2026-11-17T00:00:00Z' }), meal()), [], 'only current foods count');
});

test('a meal is put back when it failed, lost a value or moved its calories by more than half', () => {
  assert.equal(restoreReason({ outcome: 'changed', values_lost: [], before: { calories: 100 }, after: { calories: 140 }, calories_change: 0.4 }), null);
  assert.match(restoreReason({ outcome: 'failed', reason: 'the meal is failed' }), /failed/);
  assert.match(restoreReason({ outcome: 'changed', values_lost: ['food 1: nutrient 1089'], before: {}, after: {} }), /1 nutrition value\(s\) lost: food 1: nutrient 1089/);
  assert.match(restoreReason({ outcome: 'changed', values_lost: [], before: { calories: 140 }, after: { calories: null }, calories_change: null }), /unavailable/);
  assert.match(restoreReason({ outcome: 'changed', values_lost: [], before: { calories: 63.7 }, after: { calories: 98 }, calories_change: 0.5383 }), /53\.8%/);
  assert.deepEqual(parseArgs(['run', '--mode=repair', '--meals=38de279e', '--ledger=/l']).mode, 'repair');
});

test('the CLI puts back a re-matched meal that lost a value, and says why', t => {
  const worse = snapshot(A);
  worse.items = worse.items.map((item) => (item.superseded_at === null ? { ...item, nutrition: { calories: null } } : item));
  const { result, calls, ledger } = cliFixture(t, { after: worse });
  assert.equal(result.status, EXIT.ok, result.stdout + result.stderr);
  const line = ledger()[0];
  assert.equal(line.outcome, 'restored');
  assert.equal(line.restored, true);
  assert.match(line.restore_reason, /nutrition value\(s\) lost: food 1: calories/);
  assert.ok(calls.some((call) => call.sql?.includes('13-restore.sql')), 'the restore SQL ran');
  assert.match(result.stdout, /put back: /);
});

// #990: a re-match that finds a fuller record but lacks one micronutrient keeps both, instead of being put back.
const butterMeal = (nutrition, extra = {}) => ({ post: { id: A, status: 'ready' }, saved_meals: [], comments: [], items: [
  { id: 'aaaaaaaa-0000-4000-8000-000000000009', name: 'sliced apple', portion_grams: 60, superseded_at: null, nutrition: { calories: 36.6, micronutrients: [] } },
  { id: 'aaaaaaaa-0000-4000-8000-00000000000b', name: 'unsalted butter packet', portion_grams: 7, superseded_at: null, nutrition }], ...extra });
const foundation = { calories: null, fat_g: 5.705, micronutrients: [{ nutrientId: 1100, value: 0.0001, basis: 'portion' }, { nutrientId: 1087, value: 1.68, basis: 'portion' }] };
const legacy = { calories: 50.19, protein_g: 0.06, fat_g: 5.677, micronutrients: [{ nutrientId: 1087, value: 1.68, basis: 'portion' }, { nutrientId: 1100, value: null, basis: 'portion' }, { nutrientId: 1092, value: 1.68, basis: 'portion' }] };
const fresh = (meal) => ({ ...meal, items: meal.items.map((i) => ({ ...i, id: i.id.replace('aaaaaaaa', 'bbbbbbbb') })) });

test('a lost micronutrient of the same food is carried, and nothing else is', () => {
  const before = butterMeal(foundation), after = fresh(butterMeal(legacy));
  assert.deepEqual(carryPlan(before, after), [{ item: 'bbbbbbbb-0000-4000-8000-00000000000b', entries: [foundation.micronutrients[0]], lost: ['food 2: nutrient 1100'] }]);
  assert.equal(carryPlan(before, fresh(butterMeal({ ...legacy, micronutrients: [...legacy.micronutrients.slice(0, 1), { nutrientId: 1100, value: 0.0002 }] }))), null, 'nothing lost, nothing to carry');
  assert.equal(carryPlan(before, fresh(butterMeal({ ...legacy, fat_g: null }))), null, 'a lost scalar value is never carried');
  const renamed = fresh(butterMeal(legacy)); renamed.items[1].name = 'butter';
  assert.equal(carryPlan(before, renamed), null, 'a renamed food is never carried');
  const heavier = fresh(butterMeal(legacy)); heavier.items[1].portion_grams = 14;
  assert.equal(carryPlan(before, heavier), null, 'a food whose weight changed is never carried');
  const caffeine = butterMeal({ ...foundation, micronutrients: [{ nutrientId: 1057, value: 40, basis: 'portion' }] });
  assert.equal(carryPlan(caffeine, after), null, 'caffeine, water and alcohol feed day totals and are never carried');
  assert.equal(carryPlan({ ...before, saved_meals: [{ id: 's' }] }, after), null, 'a meal with a saved meal is never carried');
});

test('carry refuses legacy bases on the old entry or new row', () => {
  const before = butterMeal(foundation), after = fresh(butterMeal(legacy));
  const oldLegacy = structuredClone(before);
  delete oldLegacy.items[1].nutrition.micronutrients[0].basis;
  assert.equal(carryPlan(oldLegacy, after), null, 'an old entry without portion basis is not carried');
  oldLegacy.items[1].nutrition.micronutrients[0].basis = '100g';
  assert.equal(carryPlan(oldLegacy, after), null, 'an old entry with a different basis is not carried');
  const mixed = structuredClone(after);
  delete mixed.items[1].nutrition.micronutrients[0].basis;
  assert.equal(carryPlan(before, mixed), null, 'every destination entry must have portion basis');
});

test('the CLI carries a lost micronutrient and keeps the re-match', t => {
  const before = butterMeal(foundation), after = fresh(butterMeal(legacy));
  const carried = fresh(butterMeal({ ...legacy, micronutrients: [legacy.micronutrients[0], legacy.micronutrients[2], foundation.micronutrients[0]] }));
  const { result, calls, ledger } = cliFixture(t, { before, after, carried });
  assert.equal(result.status, EXIT.ok, result.stdout + result.stderr);
  const line = ledger()[0];
  assert.equal(line.outcome, 'unchanged', 'the fake totals do not move; the meal is kept');
  assert.deepEqual(line.values_carried, ['food 2: nutrient 1100']);
  assert.deepEqual(line.values_lost, []);
  assert.equal(line.restore_reason, undefined);
  const carry = calls.filter((call) => call.file === '16-carry.sql');
  assert.equal(carry.length, 1);
  assert.ok(!calls.some((call) => call.sql?.includes('13-restore.sql')), 'nothing is put back');
  assert.match(result.stdout, /carried: food 2: nutrient 1100/);
});

test('the CLI puts the meal back when the carry did not take', t => {
  const before = butterMeal(foundation), after = fresh(butterMeal(legacy));
  const { result, calls, ledger } = cliFixture(t, { before, after, carried: after });
  assert.equal(result.status, EXIT.ok, result.stdout + result.stderr);
  const line = ledger()[0];
  assert.equal(line.outcome, 'restored');
  assert.equal(line.values_carried, undefined);
  assert.ok(calls.some((call) => call.file === '16-carry.sql'));
  assert.ok(calls.some((call) => call.sql?.includes('13-restore.sql')), 'the restore SQL ran');
});

// PM 2026-11-17 14:56: the tool must actually put a needs_input meal back, including its question state.
test('restoring needs_input reinstates the snapshot state and exact original current food', { skip: !process.env.TEST_SQL_DATABASE_URL }, async t => {
  const {execFileSync} = await import('node:child_process');
  const {randomUUID} = await import('node:crypto');
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const user = randomUUID(), post = randomUUID(), originalItem = randomUUID();
  const directory = mkdtempSync(path.join(tmpdir(), 'mfa-needs-input-restore-'));
  const ledger = path.join(directory, 'ledger'), stateFile = path.join(directory, 'state.json');
  const sql = input => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], {input, encoding: 'utf8', timeout: 10000});
  t.after(() => {
    try { sql(`delete from public.posts where id='${post}';delete from public.profiles where id='${user}';delete from auth.users where id='${user}';`); }
    finally { rmSync(directory, {recursive: true, force: true}); }
  });
  sql(`insert into auth.users(id)values('${user}');
insert into profiles(id,handle)values('${user}','restore-input-${user.slice(0,8)}');
insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready','2026-11-01T00:00:00Z');
insert into post_items(id,post_id,name,source,portion_grams,portion_text)values('${originalItem}','${post}','Original food','model',50,'50 g');
insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g)values('${originalItem}',50,2,6,1);
insert into post_comments(post_id,author,body)values('${post}','model','Consumed: 50 kcal');`);
  const saved = JSON.parse(execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-v', 'prefixes='+post.slice(0,8), '-f', fileURLToPath(new URL('../scripts/numbers/08-snapshot.sql', import.meta.url))], {encoding: 'utf8', timeout: 10000}).trim());
  mkdirSync(ledger, {mode: 0o700});
  writeFileSync(path.join(ledger, 'snapshots.jsonl'), JSON.stringify(saved)+'\n', {mode: 0o600});
  sql(`update post_items set superseded_at=now() where id='${originalItem}';
with added as(insert into post_items(post_id,name,source,portion_grams,portion_text)values('${post}','Changed food','model',99,'99 g')returning id)
insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g)select id,99,3,9,2 from added;
update post_comments set body='Changed summary' where post_id='${post}' and author='model';
update posts set status='needs_input',needs_input='{"question":"Changed held question","options":["Yes","No"]}',question='{"question":"Changed beside question","options":["Yes","No"]}',fail_reason='fixture',analysis_initialized_at=null where id='${post}';`);
  const preload = path.join(directory, 'tick.mjs');
  writeFileSync(preload, `import {execFileSync} from 'node:child_process';import {writeFileSync} from 'node:fs';
globalThis.fetch=async url=>{
 if(String(url)!=='http://127.0.0.1:1/api/jobs/tick')throw Error('Only the fixture tick is allowed');
 const p=process.env.RESTORE_FIXTURE_POST;
 const run=input=>execFileSync('psql',['-X','-qAt','-v','ON_ERROR_STOP=1','--dbname',process.env.SUPABASE_DB_URL],{input,encoding:'utf8',timeout:10000});
 // Observe the real restore SQL before the simulated worker changes only its own queued job status.
 const state=run("select jsonb_build_object('status',p.status,'needs_input',p.needs_input,'question',p.question,'fail_reason',p.fail_reason,'analysis_initialized_at',p.analysis_initialized_at,'items',(select jsonb_agg(jsonb_build_object('id',i.id,'calories',n.calories)order by i.id)from current_post_items i left join item_nutrition n on n.post_item_id=i.id where i.post_id=p.id),'summary',(select body from post_comments c where c.post_id=p.id and author='model'order by created_at,id limit 1))from posts p where id='"+p+"';");
 writeFileSync(process.env.RESTORE_FIXTURE_STATE,state);
 run("update jobs set status='finished',finished_at=now()where post_id='"+p+"'and status='queued'and payload->>'operator'='restore';");
 return new Response(null,{status:204});
};`);
  const result = spawnSync(process.execPath, ['--import', preload, script, 'restore', '--meal='+post.slice(0,8), '--ledger='+ledger, '--snapshot=first', '--wait-seconds=1'], {encoding: 'utf8', timeout: 10000,
    env: {...process.env, SUPABASE_DB_URL: url, APP_URL: 'http://127.0.0.1:1', RESTORE_FIXTURE_POST: post, RESTORE_FIXTURE_STATE: stateFile} });
  assert.ifError(result.error);
  assert.equal(result.status, EXIT.ok, result.stdout+result.stderr);
  const actual = JSON.parse(readFileSync(stateFile, 'utf8'));
  assert.equal(actual.status, saved.post.status);
  assert.equal(actual.needs_input, saved.post.needs_input);
  assert.equal(actual.question, saved.post.question);
  assert.equal(actual.fail_reason, saved.post.fail_reason);
  assert.equal(actual.analysis_initialized_at, saved.post.analysis_initialized_at);
  assert.deepEqual(actual.items, [{id: originalItem, calories: 50}]);
  assert.equal(actual.summary, 'Consumed: 50 kcal');
});

// PM 2026-11-17 15:07: in-place repair must retain an actual, usable nutrition undo.
async function repairRoundTrip(t, { carbs }) {
  const {execFileSync} = await import('node:child_process');
  const {randomUUID} = await import('node:crypto');
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const user = randomUUID(), post = randomUUID(), item = randomUUID();
  const directory = mkdtempSync(path.join(tmpdir(), 'mfa-repair-undo-'));
  const ledger = path.join(directory, 'ledger'), bin = path.join(directory, 'bin');
  const realPsql = execFileSync('which', ['psql'], {encoding: 'utf8'}).trim();
  const sql = input => execFileSync(realPsql, ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], {input, encoding: 'utf8', timeout: 10000});
  t.after(() => {
    try { sql(`delete from posts where id='${post}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`); }
    finally { rmSync(directory, {recursive: true, force: true}); }
  });
  sql(`insert into auth.users(id)values('${user}');
insert into profiles(id,handle)values('${user}','repair-undo-${user.slice(0,8)}');
insert into posts(id,user_id,status)values('${post}','${user}','ready');
insert into post_items(id,post_id,name,source,portion_grams,portion_text)values('${item}','${post}','Original food','model',50,'50 g');
insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients)
values('${item}',50,2,${carbs},1,null,0,5,'[{"nutrientId":1005,"value":-0.7,"basis":"portion"},{"nutrientId":1087,"value":null},{"nutrientId":1089,"value":0}]');`);
  const nutrition = () => JSON.parse(sql(`select to_jsonb(n) from item_nutrition n where post_item_id='${item}';`));
  const original = nutrition();
  mkdirSync(bin);
  const wrapper = path.join(bin, 'psql');
  writeFileSync(wrapper, `#!${process.execPath}
import assert from 'node:assert/strict';import {readFileSync,statSync,writeFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';
const args=process.argv.slice(2), f=args.indexOf('-f');
if(f>=0&&args[f+1].endsWith('/15-repair.sql')){
 const file=process.env.REPAIR_LEDGER+'/snapshots.jsonl';
 const saved=JSON.parse(readFileSync(file,'utf8').trim().split('\\n').at(-1));
 const old=saved.items.find(i=>i.id===process.env.REPAIR_ITEM).nutrition;
 assert.equal(old.carbs_g,Number(process.env.REPAIR_CARBS));assert.equal(old.micronutrients[0].value,-0.7);
 assert.equal(statSync(file).mode&0o777,0o600);
 writeFileSync(process.env.REPAIR_RECORDED,'before-write');
}
const input=f<0?readFileSync(0):undefined;
const result=spawnSync(process.env.REPAIR_REAL_PSQL,args,{input,stdio:input?['pipe','inherit','inherit']:'inherit'});
process.exit(result.status??1);
`);
  chmodSync(wrapper, 0o700);
  const preload = path.join(directory, 'tick.mjs');
  writeFileSync(preload, `import {execFileSync} from 'node:child_process';
globalThis.fetch=async url=>{
 if(String(url)!=='http://127.0.0.1:1/api/jobs/tick')throw Error('Only the fixture tick is allowed');
 // Stand in only for worker completion; all nutrition writes come from the real operator SQL.
 execFileSync(process.env.REPAIR_REAL_PSQL,['-X','-qAt','-v','ON_ERROR_STOP=1','--dbname',process.env.SUPABASE_DB_URL],{input:"update jobs set status='finished',finished_at=now()where post_id='"+process.env.REPAIR_POST+"'and status='queued';update posts set status='ready'where id='"+process.env.REPAIR_POST+"';",encoding:'utf8',timeout:10000});
 return new Response(null,{status:204});
};`);
  const env = {...process.env, PATH: bin+path.delimiter+process.env.PATH, SUPABASE_DB_URL: url, APP_URL: 'http://127.0.0.1:1', REPAIR_REAL_PSQL: realPsql, REPAIR_LEDGER: ledger, REPAIR_ITEM: item, REPAIR_POST: post, REPAIR_RECORDED: path.join(directory,'recorded'), REPAIR_CARBS: String(carbs)};
  const invoke = args => {
    const result = spawnSync(process.execPath, ['--import', preload, script, ...args, '--ledger='+ledger, '--wait-seconds=1'], {env, encoding:'utf8', timeout:15000});
    assert.ifError(result.error);
    assert.equal(result.status, EXIT.ok, result.stdout+result.stderr);
  };
  invoke(['run','--mode=repair','--meals='+post.slice(0,8),'--max-meals=1','--max-minutes=1']);
  assert.equal(readFileSync(env.REPAIR_RECORDED,'utf8'),'before-write');
  const repaired = nutrition();
  assert.equal(repaired.post_item_id,item);
  assert.equal(repaired.carbs_g,Math.max(carbs,0));
  assert.equal(repaired.micronutrients[0].value,0);
  assert.equal(repaired.fibre_g,null);
  assert.equal(repaired.sugar_g,0);
  invoke(['restore','--meal='+post.slice(0,8),'--snapshot=first']);
  assert.deepEqual(nutrition(),original,'restore must undo the actual in-place repair, including NULLs, zeros and micronutrients');
  assert.equal(sql(`select string_agg(id::text,',')from current_post_items where post_id='${post}';`).trim(),item,'the same item ID remains current');
}

test('repair records original nutrition before writing and restore undoes it on the same item IDs', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => repairRoundTrip(t, { carbs: -0.7 }));

// #1029: a row whose only negative value is a micronutrient is repaired and undone the same way.
test('repair also takes a row whose only negative value is a micronutrient', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => repairRoundTrip(t, { carbs: 2 }));

 test('restore preserves a structured summary and its dedicated pointer without selecting a later question',()=>{
 const data=snapshot(A);const id=data.comments.find(c=>c.author==='model').id;
 const message={code:'mealSummary',values:{kind:'consumed',totals:{calories:50,protein_g:1,carbs_g:2,fat_g:0},approximations:[],unavailable:[]}};
 data.post.summary_comment_id=id;data.comments=data.comments.map(c=>c.id===id?{...c,body:null,message}:c);
 data.comments.push({id:'dddddddd-0000-4000-8000-000000000001',author:'model',body:'Which food?',created_at:'2026-11-02T00:00:00Z'});
 const params=restoreParams(data);assert.equal(params.summary_comment_id,id);assert.equal(params.old_summary_pointer,id);assert.equal(params.old_summary,'');assert.deepEqual(JSON.parse(params.old_message),message);
 assert.throws(()=>restoreParams({...data,post:{...data.post,summary_comment_id:'dddddddd-0000-4000-8000-000000000001'}}),UsageError);
});
