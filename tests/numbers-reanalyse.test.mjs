import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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
