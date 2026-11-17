import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, HELP, UsageError, compareTotals, findSnapshot, isInside, ledgerRefusal, parseArgs, parseMealsFile, relativeChange, restoreParams, stopReason, summaryTable } from '../scripts/numbers/reanalyse.mjs';

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
    summary_comment_id: 'cccccccc-0000-4000-8000-000000000002', old_summary: 'Consumed: 50 kcal', analysis_initialized_at: '2026-11-01T00:00:00+00:00' });
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
function cliFixture(t, { restore = false, usage = [] } = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'mfa-numbers-cli-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const ledger = path.join(directory, 'ledger'), calls = path.join(directory, 'calls.jsonl');
  const fixture = path.join(directory, 'fixture.json'), preload = path.join(directory, 'fetch.mjs');
  writeFileSync(fixture, JSON.stringify({ id: A, snapshot: snapshot(A), restore, usage }));
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
if (file === '08-snapshot.sql') console.log(JSON.stringify(fixture.snapshot));
else if (file === '09-usage.sql') {
  const columns = ['post','kind','model','step','calls','errors','input_tokens','output_tokens','duration_ms','first_call','last_call'];
  console.log(columns.join('\\x1f'));
  for (const row of fixture.usage) console.log(columns.map(key => row[key] ?? '-').join('\\x1f'));
} else if (file === '11-rematch.sql') console.log('queued');
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
