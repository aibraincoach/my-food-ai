#!/usr/bin/env node
// Re-analyse or re-match a list of meals, one at a time, keeping every old row, and restore any of them.
// It runs the SQL files beside it (08, 09, 11, 12, 13, 15, 15-repair-undo, 16, 20, 22 and 24) through psql and wakes the worker with /api/jobs/tick.
// Usage and rules: node scripts/numbers/reanalyse.mjs --help, and scripts/numbers/README.md.
import { spawnSync } from 'node:child_process';
import { appendFileSync, chmodSync, existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';
import { checkRecord } from '../../src/lib/fdc/record-kind.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlFile = (name) => path.join(here, name);
export const MODE_FILES = { rematch: '11-rematch.sql', reanalyse: '12-reanalyse.sql', repair: '15-repair.sql', decaf: '20-decaf.sql', recheck: '24-recheck.sql', 'set-record': '27-set-record.sql' };
// Modes that write nutrition in place: their snapshot records it, and restore puts it back with 15-repair-undo.sql.
export const IN_PLACE_MODES = new Set(['repair', 'decaf']);
export const EXIT = { ok: 0, incomplete: 1, stopped: 3, usage: 4 };
export const WAIT_HARD_MAX_SECONDS = 600;
const POLL_SECONDS = 10, TICK_SECONDS = 60, FIRST_POLL_SECONDS = 2;
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export const HELP = `Re-analyse or re-match meals one at a time, keeping their old rows, and restore any of them.

  node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse|repair|decaf
       (--meals=<prefix,prefix,...> | --meals-file=<path>) --ledger=<directory>
  node scripts/numbers/reanalyse.mjs run --mode=recheck --foods-file=<flagged.jsonl> --ledger=<directory>
       [--max-meals=10] [--max-minutes=45] [--wait-seconds=300] [--dry-run]
  node scripts/numbers/reanalyse.mjs restore --meal=<prefix> --ledger=<directory> [--snapshot=last|first]
       [--wait-seconds=300]

Environment: SUPABASE_DB_URL (psql connection) and APP_URL (the app whose /api/jobs/tick wakes the worker).
psql must be on PATH. Nothing else is read.

run
  --mode=rematch      11-rematch.sql: same foods and portions, nutrition looked up again.
  --mode=reanalyse    12-reanalyse.sql: the photos are read again from the start.
  --mode=repair       15-repair.sql: a negative stored value becomes zero and the meal is summed again.
  --mode=decaf        20-decaf.sql: caffeine stored on an alcoholic drink that names no caffeine source is removed
                      and the meal is summed again (#456). That caffeine is ledgered as values_removed, not as a loss.
  --mode=set-record   27-set-record.sql: chosen numeric records from --foods-file, one food at a time, no search.
                      Recomputes through retained bridges; any unlisted change or wrong chosen record puts it back.
  --mode=recheck      24-recheck.sql: only the foods listed in --foods-file (mismatch.mjs's flagged.jsonl; meal foods
                      with a strong signal) are looked up again; every other food keeps its nutrition exactly (#990).
                      The micronutrients a listed food loses are ledgered as values_removed. The calories may move by
                      more than half only when every listed food's new record passes the matcher's record check (or
                      is an estimate); a listed food whose new record is still another kind of food puts the meal back.
  --meals             comma-separated 8-character meal id prefixes, worked in the order given.
  --meals-file        the same, one prefix per line; blank lines and lines starting with # are ignored.
  --ledger            a private directory OUTSIDE the repository. It receives snapshots.jsonl (the full
                      rows of each meal before it is touched: the only way back) and ledger.jsonl (one
                      line per meal, prefixes only). Made with mode 0700; the files with mode 0600.
  --max-meals         stop after this many meals (default 10).
  --max-minutes       stop when this much wall clock has passed since the command started (default 45).
  --wait-seconds      longest wait for one meal (default 300, never more than ${WAIT_HARD_MAX_SECONDS}).
  --dry-run           resolve the prefixes and print what would be done. Writes nothing, takes no snapshot.

  Every prefix must match exactly one meal that is not deleted, or nothing is started.
  A meal the SQL file's own guards refuse is recorded as skipped and the run goes on.
  The next meal starts only when the previous one is ready (or was skipped, or failed for good).
  The run stops, and says why, when: --max-meals is reached; --max-minutes is used up; two meals in a
  row failed or timed out; more than one in ten meals failed (after at least 10); or a meal is still
  being worked when its wait runs out.
  When a meal has finished, its snapshot is taken again (into <ledger>/after.jsonl) and compared with the one
  before. The meal is put back at once, as restore --snapshot=last would, when it failed or asks a question, lost
  any nutrition value it had (a zero counts as a value, NULL does not; micronutrients included), or its calories
  moved by more than half. The ledger line says why.
  When the only values lost are micronutrients of a food that is still there with the same name and weight, and
  none is water, caffeine or alcohol, 16-carry.sql first adds the old entries to that food's new row and the meal
  is compared again; it is kept when nothing is lost any more. The ledger line lists them (values_carried).

restore
  Puts one meal back as its snapshot in <ledger>/snapshots.jsonl recorded it, with 13-restore.sql.
  A repair snapshot first restores its original nutrition rows on the same item IDs with 15-repair-undo.sql.
  --snapshot=last (default) uses the newest snapshot of that meal: it undoes the latest run.
  --snapshot=first uses the oldest: the meal as it was before the first run with this ledger.
  A meal left "failed" or "needs_input" first regains the snapshot's ready state, question fields and analysis time.

Exit codes: 0 every meal changed, unchanged, skipped or put back (restore: work was queued and the meal is ready);
            1 incomplete: a meal failed, timed out, or the restore SQL refused;
            3 a stop condition fired; 4 usage or guard error (nothing was started).`;

export class UsageError extends Error {}

function positiveInt(text, name, max) {
  if (!/^[1-9][0-9]*$/.test(String(text))) throw new UsageError(`${name} must be a whole number above zero.`);
  const n = Number(text);
  if (max && n > max) throw new UsageError(`${name} cannot be more than ${max}.`);
  return n;
}

export function parsePrefixes(text) {
  const list = String(text).split(/[\s,]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (!list.length) throw new UsageError('No meal prefixes were given.');
  for (const p of list) if (!/^[0-9a-f]{8}$/.test(p)) throw new UsageError(`"${p.slice(0, 20)}" is not an 8-character meal id prefix.`);
  const twice = list.find((p, i) => list.indexOf(p) !== i);
  if (twice) throw new UsageError(`Prefix ${twice} is listed twice.`);
  return list;
}

export function parseMealsFile(text) {
  return parsePrefixes(String(text).split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#')).join(','));
}

// Pure: #990. mismatch.mjs's flagged.jsonl as Map(meal prefix -> [{ item, name }]), in file order. Only meal foods with a
// strong signal are taken: a saved meal is not re-matched here, and a weak signal alone is a report, not a correction.
export function parseFoodsFile(text) {
  const foods = new Map();
  for (const line of String(text).split('\n').map((x) => x.trim()).filter(Boolean)) {
    let row;
    try { row = JSON.parse(line); } catch { throw new UsageError('A --foods-file line is not JSON.'); }
    if (row.kind !== 'meal' || !Array.isArray(row.strong) || !row.strong.length) continue;
    if (!/^[0-9a-f]{8}$/.test(String(row.meal)) || !/^[0-9a-f]{8}$/.test(String(row.item))) throw new UsageError('A --foods-file line has no 8-character meal and item prefix.');
    const list = foods.get(row.meal) ?? [];
    if (!list.some((food) => food.item === row.item)) list.push({ item: row.item, name: String(row.name ?? '') });
    foods.set(row.meal, list);
  }
  if (!foods.size) throw new UsageError('The --foods-file lists no meal food with a strong signal.');
  return foods;
}

// Explicit choices are separate from detector findings; no model or record search chooses these ids.
export function parseSetRecordFoods(text) {
  const foods = new Map(), seen = new Set();
  for (const line of String(text).split('\n').map(s => s.trim()).filter(Boolean)) {
    let row;
    try { row = JSON.parse(line); } catch { throw new UsageError('A set-record line is not JSON.'); }
    if (!/^[0-9a-f]{8}$/.test(row.meal ?? '') || !/^(?:[0-9a-f]{8}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/.test(row.item ?? '')) throw new UsageError('Set-record needs a meal prefix and item id or prefix.');
    if (!Number.isSafeInteger(row.fdc) || row.fdc <= 0) throw new UsageError('Set-record fdc must be a positive safe integer.');
    if (typeof row.description !== 'string' || !row.description.trim()) throw new UsageError('Set-record needs the chosen record description.');
    const key = row.meal + ':' + row.item.slice(0, 8);
    if (seen.has(key)) throw new UsageError('A set-record item is listed twice.');
    seen.add(key);
    const list = foods.get(row.meal) ?? [];
    list.push({ item: row.item, fdc: row.fdc, description: row.description }); foods.set(row.meal, list);
  }
  if (!foods.size) throw new UsageError('No set-record choices were given.');
  return foods;
}
const currentFoods = snapshot => (snapshot.items ?? []).filter(i => i.superseded_at == null);
function descends(item, id, snapshot) {
  const index = new Map((snapshot.items ?? []).map(i => [i.id, i]));
  const seen = new Set();
  while (item && !seen.has(item.id)) {
    if (item.id === id || item.supersedes === id) return true;
    seen.add(item.id); item = index.get(item.supersedes);
  }
  return false;
}
const stable = value => JSON.stringify(value, (_key, v) => v && !Array.isArray(v) && typeof v === 'object' ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
const nutritionValues = n => Object.fromEntries(Object.entries(n ?? {}).filter(([key]) => key !== 'post_item_id'));
// Compare through revision identities, never by name (twins must remain distinguishable).
export function setRecordOutcome(before, after, foods) {
  const old = currentFoods(before), now = currentFoods(after), values_removed = [], changes = [];
  const bad = reason => ({ reason, values_removed, changes });
  if (after.post?.status !== 'ready') return bad(`the meal is ${after.post?.status ?? 'missing'}`);
  if (old.length !== now.length) return bad('the food count changed');
  const choices = new Map();
  for (const food of foods) {
    const matches = old.filter(i => i.id.startsWith(food.item));
    if (matches.length !== 1) return bad('a chosen food does not identify exactly one original');
    choices.set(matches[0].id, food);
  }
  for (const original of old) {
    const matches = now.filter(i => descends(i, original.id, after));
    if (matches.length !== 1) return bad('a food revision is missing or ambiguous');
    const item = matches[0], choice = choices.get(original.id);
    // A data correction cannot rename, reweigh, or alter a leftover/count field.
    for (const key of ['name','portion_grams','portion_text','not_eaten_grams','not_eaten_calories','not_eaten_count_text','count_text']) {
      if (stable(item[key]) !== stable(original[key])) return bad(`a food changed ${key}`);
    }
    if (!choice) {
      if (stable(nutritionValues(item.nutrition)) !== stable(nutritionValues(original.nutrition))) return bad('an unlisted food nutrition value or record changed');
    } else {
      if (item.nutrition?.source_ref !== String(choice.fdc) || item.nutrition?.calories == null) return bad('a chosen food has the wrong record or unknown calories');
      changes.push({ item: original.id.slice(0,8), old_record: original.nutrition?.source_ref ?? null, new_record: item.nutrition.source_ref, old_kcal: original.nutrition?.calories ?? null, new_kcal: item.nutrition.calories });
      for (const entry of original.nutrition?.micronutrients ?? []) values_removed.push({ item: original.id.slice(0,8), record: original.nutrition.source_ref, entry });
    }
  }
  return { reason: null, values_removed, changes };
}

// Pure: #990. After a recheck, the losses that are the listed foods' own micronutrients (the old record was another
// kind of food, so its micronutrients were never this food's) and whether every listed food's new record passes the
// record check. items22 is 22-items.sql's rows for the meal (name, category, how, description).
export const RECHECK_REASON = 'the record was another kind of food (#990)';
export function recheckOutcome(lost, before, listedNames, items22) {
  const current = (before?.items ?? []).filter((item) => item.superseded_at === null);
  const names = new Set(listedNames.map((name) => name.trim().toLowerCase()));
  const key = item => String(item.name ?? '').trim().toLowerCase();
  // Name-only outcome rows cannot distinguish twins: retain their losses so the ordinary restore rule applies.
  const listedIndex = new Set(current.map((item, index) => names.has(key(item)) && current.filter(other => key(other) === key(item)).length === 1 ? index + 1 : null).filter(Boolean));
  const removed = (lost ?? []).filter((value) => { const m = /^food ([0-9]+): nutrient [0-9]+$/.exec(value); return m && listedIndex.has(Number(m[1])); });
  const after = items22.filter((row) => names.has(String(row.name ?? '').trim().toLowerCase()));
  const still = after.filter((row) => row.how !== 'estimate' && (!row.description || checkRecord(row.name, { description: row.description, category: row.category }).strong.length));
  return { removed, kept: (lost ?? []).filter((value) => !removed.includes(value)), passed: after.length >= names.size && !still.length,
    still: still.map((row) => `${row.name}: ${row.description ?? 'no record'}`) };
}

// Pure: turns argv (after "node script") into a checked request. Throws UsageError.
export function parseArgs(argv, readFile = (file) => readFileSync(file, 'utf8')) {
  if (argv.includes('--help') || argv.includes('-h')) return { command: 'help' };
  const [command, ...rest] = argv;
  if (!['run', 'restore'].includes(command)) throw new UsageError('Use "run" or "restore". See --help.');
  let values;
  try {
    ({ values } = parseNodeArgs({ args: rest, allowPositionals: false, strict: true, options: {
      mode: { type: 'string' }, meals: { type: 'string' }, 'meals-file': { type: 'string' }, meal: { type: 'string' },
      ledger: { type: 'string' }, 'max-meals': { type: 'string' }, 'max-minutes': { type: 'string' },
      'wait-seconds': { type: 'string' }, 'dry-run': { type: 'boolean' }, snapshot: { type: 'string' }, 'foods-file': { type: 'string' } } }));
  } catch (error) { throw new UsageError(error.message); }
  if (!values.ledger) throw new UsageError('--ledger=<private directory outside the repository> is required.');
  const waitSeconds = positiveInt(values['wait-seconds'] ?? 300, '--wait-seconds', WAIT_HARD_MAX_SECONDS);
  if (command === 'restore') {
    for (const key of ['mode', 'meals', 'meals-file', 'max-meals', 'max-minutes', 'dry-run', 'foods-file']) if (values[key] !== undefined) throw new UsageError(`--${key} is not a restore option.`);
    if (!values.meal) throw new UsageError('--meal=<8-character prefix> is required.');
    const [meal, more] = parsePrefixes(values.meal);
    if (more) throw new UsageError('restore takes one meal.');
    const snapshot = values.snapshot ?? 'last';
    if (!['last', 'first'].includes(snapshot)) throw new UsageError('--snapshot is last or first.');
    return { command, meal, ledger: values.ledger, snapshot, waitSeconds };
  }
  for (const key of ['meal', 'snapshot']) if (values[key] !== undefined) throw new UsageError(`--${key} is not a run option.`);
  if (!Object.hasOwn(MODE_FILES, values.mode ?? '')) throw new UsageError('--mode=rematch, --mode=reanalyse, --mode=repair, --mode=decaf, --mode=recheck or --mode=set-record is required.');
  if (values.mode === 'recheck' || values.mode === 'set-record') {
    if (values.meals !== undefined || values['meals-file'] !== undefined || values['foods-file'] === undefined) throw new UsageError('--mode=recheck and --mode=set-record take --foods-file, not --meals or --meals-file.');
    let text;
    try { text = readFile(values['foods-file']); } catch { throw new UsageError('The --foods-file could not be read.'); }
    const foods = values.mode === 'set-record' ? parseSetRecordFoods(text) : parseFoodsFile(text);
    return { command, mode: values.mode, meals: [...foods.keys()], foods, ledger: values.ledger, dryRun: values['dry-run'] === true, waitSeconds,
      maxMeals: positiveInt(values['max-meals'] ?? 10, '--max-meals'), maxMinutes: positiveInt(values['max-minutes'] ?? 45, '--max-minutes') };
  }
  if (values['foods-file'] !== undefined) throw new UsageError('--foods-file is only for --mode=recheck or --mode=set-record.');
  if ((values.meals === undefined) === (values['meals-file'] === undefined)) throw new UsageError('Give exactly one of --meals and --meals-file.');
  let meals;
  if (values.meals !== undefined) meals = parsePrefixes(values.meals);
  else {
    let text;
    try { text = readFile(values['meals-file']); } catch { throw new UsageError('The --meals-file could not be read.'); }
    meals = parseMealsFile(text);
  }
  return { command, mode: values.mode, meals, ledger: values.ledger, dryRun: values['dry-run'] === true, waitSeconds,
    maxMeals: positiveInt(values['max-meals'] ?? 10, '--max-meals'), maxMinutes: positiveInt(values['max-minutes'] ?? 45, '--max-minutes') };
}

// Pure: is child the same as, or inside, parent? Both absolute.
export function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
}

// Pure: the reason a ledger directory is refused, or null. roots are the repository directories to stay out of.
export function ledgerRefusal(ledger, roots) {
  for (const root of roots.filter(Boolean)) if (isInside(root, ledger)) return `The ledger directory is inside the repository (${root}). It holds private rows; choose a directory outside it.`;
  return null;
}

// Follows symlinks for the part of the path that already exists.
function realPath(target) {
  let existing = path.resolve(target); const tail = [];
  while (!existsSync(existing) && path.dirname(existing) !== existing) { tail.unshift(path.basename(existing)); existing = path.dirname(existing); }
  return path.join(realpathSync(existing), ...tail);
}

function repositoryRoots() {
  const roots = [realPath(path.resolve(here, '..', '..'))];
  const git = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (!git.error && git.status === 0 && git.stdout.trim()) roots.push(realPath(git.stdout.trim()));
  return roots;
}

// Pure: why the run must not start another meal, or null.
// outcomes: the outcomes so far, in order. started: how many meals have been worked. remaining: how many are left.
export function stopReason({ outcomes, started, remaining, maxMeals, maxMinutes, elapsedMinutes, previousInFlight = false }) {
  if (remaining <= 0) return null;
  if (previousInFlight) return 'the previous meal is still being worked after its wait ran out; meals are worked one at a time';
  const bad = (o) => o === 'failed' || o === 'timeout';
  if (outcomes.length >= 2 && outcomes.slice(-2).every(bad)) return 'two meals in a row failed or timed out';
  const failed = outcomes.filter((o) => o === 'failed').length;
  if (outcomes.length >= 10 && failed * 10 > outcomes.length) return `more than one in ten meals failed (${failed} of ${outcomes.length})`;
  if (started >= maxMeals) return `--max-meals reached (${maxMeals})`;
  if (elapsedMinutes >= maxMinutes) return `--max-minutes used up (${maxMinutes})`;
  return null;
}

const NUMBERS = ['items', 'calories', 'protein_g', 'carbs_g', 'fat_g'];

// Pure: changed or unchanged, from the two totals.
export function compareTotals(before, after) {
  return NUMBERS.every((key) => Number(before?.[key] ?? NaN) === Number(after?.[key] ?? NaN) || (before?.[key] == null && after?.[key] == null)) ? 'unchanged' : 'changed';
}

// Pure: (after - before) / before, rounded to four places; null when there is no "before" to divide by.
export function relativeChange(before, after) {
  if (before == null || after == null || Number(before) === 0) return null;
  return Math.round(((Number(after) - Number(before)) / Number(before)) * 10000) / 10000;
}

const VALUES = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fibre_g', 'sugar_g', 'sodium_mg'];

// Pure: each nutrition value that the current foods of snapshot "before" had and those of "after" do not, as
// "food <n>: <value>" (n counts the foods of "before" from 1; a micronutrient is its USDA nutrient id). A zero is a
// value and NULL is not. Foods pair up by name; the foods whose name is gone are compared as one group.
export function lostValues(before, after) {
  const current = (snapshot) => (snapshot?.items ?? []).filter((item) => item.superseded_at === null);
  const key = (item) => String(item.name ?? '').trim().toLowerCase();
  const counts = (items) => {
    const found = new Map();
    for (const item of items) {
      const nutrition = item.nutrition ?? {};
      const names = VALUES.filter((name) => nutrition[name] != null);
      for (const n of Array.isArray(nutrition.micronutrients) ? nutrition.micronutrients : []) if (n?.nutrientId != null && n.value != null) names.push(`nutrient ${n.nutrientId}`);
      for (const name of new Set(names)) found.set(name, (found.get(name) ?? 0) + 1);
    }
    return found;
  };
  const was = current(before), now = current(after), lost = [];
  const wasNames = new Set(was.map(key)), nowNames = new Set(now.map(key));
  const compare = (label, left, right) => { const a = counts(left), b = counts(right); for (const [name, count] of a) if ((b.get(name) ?? 0) < count) lost.push(`${label}: ${name}`); };
  for (const name of wasNames) if (nowNames.has(name)) compare(`food ${was.findIndex((item) => key(item) === name) + 1}`, was.filter((item) => key(item) === name), now.filter((item) => key(item) === name));
  compare('renamed foods', was.filter((item) => !nowNames.has(key(item))), now.filter((item) => !wasNames.has(key(item))));
  return lost;
}

// Pure: #456. A decaf run removes caffeine (nutrient 1057) on purpose from alcoholic drinks that name no caffeine
// source: a correction under the PM's ruling, ledgered with the snapshot taken before it. Those removals are not losses;
// any other value lost still puts the meal back.
export const DECAF_REASON = 'caffeine stored on an alcoholic drink that names no caffeine source (#456)';
export function deliberateRemovals(lost) {
  const removed = (lost ?? []).filter((value) => /^food [0-9]+: nutrient 1057$/.test(value));
  return { removed, kept: (lost ?? []).filter((value) => !removed.includes(value)) };
}

// Nutrients a carry never adds: they feed the day's alcohol, water and caffeine totals.
export const NOT_CARRIED = new Set([1018, 1051, 1057]);

// Pure: #990. When every value a run lost is a micronutrient of a food still there under the same name and weight,
// the steps that add the old entries to that food's new row with 16-carry.sql, as [{ item, entries, lost }]; null
// when any lost value cannot be carried so (then the meal is put back). A re-match that finds a fuller record keeps
// both: the butter of f08e2e86 gained energy, protein and 98 micronutrients from 173430 but had lost iodine (1100).
// A meal with a saved meal is never carried: the saved copy would not get the entries.
export function carryPlan(before, after) {
  const lost = lostValues(before, after);
  if (!lost.length || (before?.saved_meals ?? []).length) return null;
  const current = (snapshot) => (snapshot?.items ?? []).filter((item) => item.superseded_at === null);
  const key = (item) => String(item.name ?? '').trim().toLowerCase();
  const was = current(before), now = current(after), steps = new Map();
  for (const label of lost) {
    const match = /^food (\d+): nutrient (\d+)$/.exec(label);
    if (!match || NOT_CARRIED.has(Number(match[2]))) return null;
    const old = was[Number(match[1]) - 1], id = Number(match[2]);
    const same = (items) => items.filter((item) => key(item) === key(old));
    const fresh = same(now);
    if (fresh.length !== 1 || same(was).length !== 1 || old.portion_grams == null || Number(old.portion_grams) !== Number(fresh[0].portion_grams) || !fresh[0].nutrition) return null;
    const nutrients = fresh[0].nutrition.micronutrients;
    if (!Array.isArray(nutrients) || !nutrients.every((n) => n?.basis === 'portion')) return null;
    const entry = (Array.isArray(old.nutrition?.micronutrients) ? old.nutrition.micronutrients : []).find((n) => Number(n?.nutrientId) === id && n.value != null);
    if (!entry || entry.basis !== 'portion') return null;
    const step = steps.get(fresh[0].id) ?? { item: fresh[0].id, entries: [], lost: [] };
    step.entries.push(entry); step.lost.push(label); steps.set(fresh[0].id, step);
  }
  return [...steps.values()];
}

// Pure: why a finished meal is put back, or null (the PM's rules of 2026-11-17 for #989).
export function restoreReason(row) {
  if (row.outcome === 'failed') return row.reason ?? 'the meal did not finish';
  if (row.values_lost?.length) return `${row.values_lost.length} nutrition value(s) lost: ${row.values_lost.slice(0, 3).join('; ')}${row.values_lost.length > 3 ? '; ...' : ''}`;
  if (row.before?.calories != null && row.after?.calories == null) return 'the calories became unavailable';
  if (row.recheck_still?.length) return `the new record is still another kind of food: ${row.recheck_still.slice(0, 2).join('; ')}`;
  if (row.calories_change != null && Math.abs(row.calories_change) > 0.5 && !row.recheck_passed) return `the calories moved by ${(row.calories_change * 100).toFixed(1)}%`;
  return null;
}

// Pure: the snapshot of one meal out of the text of snapshots.jsonl (only snapshots of a ready meal count). Throws UsageError when there is none or two meals share the prefix.
export function findSnapshot(text, prefix, which = 'last') {
  const found = [];
  for (const line of String(text).split('\n')) {
    if (!line.trim()) continue;
    let snapshot;
    try { snapshot = JSON.parse(line); } catch { continue; }
    if (typeof snapshot?.post?.id === 'string' && snapshot.post.id.startsWith(prefix) && snapshot.post.status === 'ready') found.push(snapshot);
  }
  if (!found.length) throw new UsageError(`No snapshot of meal ${prefix} is in this ledger.`);
  if (new Set(found.map((s) => s.post.id)).size > 1) throw new UsageError(`Two different meals in this ledger start with ${prefix}.`);
  return { snapshot: which === 'first' ? found[0] : found.at(-1), count: found.length };
}

// Pure: what 13-restore.sql needs, from one snapshot line.
export function restoreParams(snapshot) {
  const oldIds = (snapshot.items ?? []).filter((item) => item.superseded_at === null).map((item) => item.id);
  if (!oldIds.length) throw new UsageError('The snapshot has no current items to put back.');
  for (const id of oldIds) if (!/^[0-9a-f-]{36}$/.test(id)) throw new UsageError('The snapshot holds an item id that is not a uuid.');
  const summary = (snapshot.comments ?? []).find((comment) => comment.author === 'model');
  return { post: snapshot.post.id, old_ids: `{${oldIds.join(',')}}`, summary_comment_id: summary?.id ?? NIL_UUID, old_summary: summary?.body ?? '',
    analysis_initialized_at: snapshot.post.analysis_initialized_at ?? '' };
}

const fmt = (value, digits = 1) => (value == null ? '-' : Number(value).toFixed(digits));

// Pure: the table printed at the end. Prefixes only.
export function summaryTable(rows) {
  const head = ['meal', 'mode', 'outcome', 'items', 'kcal before', 'kcal after', 'change', 'waited s', 'model calls'];
  const body = rows.map((r) => [r.meal, r.mode, r.outcome, `${r.before?.items ?? '-'} -> ${r.after?.items ?? '-'}`, fmt(r.before?.calories), fmt(r.after?.calories),
    r.calories_change == null ? '-' : `${(r.calories_change * 100).toFixed(1)}%`, String(r.seconds_waited ?? 0), String(r.model_calls ?? 0)]);
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((row) => row[i].length)));
  const line = (cells) => cells.map((cell, i) => cell.padEnd(widths[i])).join('  ').trimEnd();
  const counts = {};
  for (const r of rows) counts[r.outcome] = (counts[r.outcome] ?? 0) + 1;
  const sum = (pick) => rows.reduce((total, r) => total + Number(pick(r) ?? 0), 0);
  return [line(head), line(widths.map((w) => '-'.repeat(w))), ...body.map(line), '',
    `Totals: ${rows.length} meal(s): ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ') || 'none'}; ` +
    `kcal ${fmt(sum((r) => r.before?.calories))} -> ${fmt(sum((r) => r.after?.calories))}; ${sum((r) => r.model_calls)} model call(s); ${sum((r) => r.seconds_waited)} s waited.`].join('\n');
}

// ---- database and worker (not pure) ----

function psql({ file, input, vars = {}, extra = [] }) {
  const args = ['-X', '-At', '-v', 'ON_ERROR_STOP=1', '--dbname', process.env.SUPABASE_DB_URL, ...extra];
  for (const [key, value] of Object.entries(vars)) args.push('-v', `${key}=${value}`);
  if (file) args.push('-f', file);
  const result = spawnSync('psql', args, { encoding: 'utf8', input: file ? undefined : input, timeout: 120000, maxBuffer: 256 * 1024 * 1024 });
  if (result.error) throw new Error(`psql could not be run: ${result.error.code ?? result.error.message}`);
  if (result.status !== 0) throw new Error(`psql failed: ${String(result.stderr).trim().split('\n').slice(-3).join(' ')}`);
  return result.stdout;
}

const one = (sql, vars) => psql({ input: sql, vars }).trim();
// 22-items.sql's columns, in its SELECT order, read with a unit-separator field delimiter (a name may hold any text).
export const ITEMS22 = ['meal', 'food', 'name', 'grams', 'kcal', 'kcal_per_100g', 'record', 'category', 'how', 'description'];
export const parseItems22 = (text) => String(text).split('\n').filter(Boolean).map((line) => Object.fromEntries(line.split('\x1f').map((value, i) => [ITEMS22[i], value === '' ? null : value])));

function resolvePrefixes(prefixes) {
  const rows = one(`select left(id::text, 8) || ' ' || id::text from public.posts
    where deleted_at is null and left(id::text, 8) = any(string_to_array(:'prefixes', ',')) order by 1;`, { prefixes: prefixes.join(',') });
  const ids = new Map(prefixes.map((p) => [p, []]));
  for (const row of rows.split('\n').filter(Boolean)) { const [prefix, id] = row.split(' '); ids.get(prefix)?.push(id); }
  const problems = prefixes.filter((p) => ids.get(p).length !== 1).map((p) => `${p} matches ${ids.get(p).length === 0 ? 'no meal that is not deleted' : `${ids.get(p).length} meals`}`);
  if (problems.length) throw new UsageError(`Nothing was started: ${problems.join('; ')}.`);
  return prefixes.map((prefix) => ({ prefix, id: ids.get(prefix)[0] }));
}

// Current items of one meal: count and sums, the meal's status, and whether a job for it is queued or running.
function readTotals(post) {
  const text = one(`select json_build_object('status', p.status, 'items', count(i.id), 'calories', sum(n.calories), 'protein_g', sum(n.protein_g),
      'carbs_g', sum(n.carbs_g), 'fat_g', sum(n.fat_g), 'deleted', p.deleted_at is not null,
      'job_in_flight', exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running')))
    from public.posts p left join public.post_items i on i.post_id = p.id and i.superseded_at is null
    left join public.item_nutrition n on n.post_item_id = i.id
    where p.id = :'post'::uuid group by p.id;`, { post });
  if (!text) throw new Error('The meal is no longer there.');
  return JSON.parse(text);
}
const publicTotals = ({ status, items, calories, protein_g, carbs_g, fat_g }) => ({ status, items, calories, protein_g, carbs_g, fat_g });

const dbNow = () => one('select now();');
const jobsSince = (post, since) => Number(one(`select count(*) from public.jobs where post_id = :'post'::uuid and created_at >= :'since'::timestamptz;`, { post, since }));

// 09-usage.sql includes FDC wrapper/network/cache traces as well as model calls.
function modelCalls(prefix, since) {
  const lines = psql({ file: sqlFile('09-usage.sql'), vars: { prefixes: prefix, since }, extra: ['-P', 'tuples_only=off', '-P', 'footer=off', '-F', '\x1f'] }).split('\n').filter(Boolean);
  if (!lines.length) return 0;
  const columns = lines[0].split('\x1f'), calls = columns.indexOf('calls'), kind = columns.indexOf('kind');
  if (calls < 0 || kind < 0) throw new Error('09-usage.sql no longer has "calls" and "kind" columns.');
  return lines.slice(1).reduce((total, line) => {
    const row = line.split('\x1f');
    // FDC is the non-model CallKind; SAM, transcription and all Spark providers count,
    // including legacy traces whose model name is absent.
    return total + (row[kind] === 'fdc' ? 0 : Number(row[calls] ?? 0));
  }, 0);
}

async function tick() {
  try {
    const response = await fetch(new URL('/api/jobs/tick', process.env.APP_URL), { cache: 'no-store', signal: AbortSignal.timeout(30000) });
    if (!response.ok) console.log(`  (the tick answered ${response.status})`);
  } catch (error) { console.log(`  (the tick could not be reached: ${error.name})`); }
}

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));
const settled = (totals) => ['ready', 'failed', 'needs_input'].includes(totals.status) && !totals.job_in_flight;

// Ticks, then polls every 10 seconds (first look after 2), ticking again every 60, until the meal settles or the wait runs out.
async function waitForMeal(post, waitSeconds) {
  const started = Date.now(); let lastTick = started, totals;
  const waited = () => Math.round((Date.now() - started) / 1000);
  await tick();
  await sleep(Math.min(FIRST_POLL_SECONDS, waitSeconds));
  for (;;) {
    totals = readTotals(post);
    if (settled(totals)) return { totals, seconds: waited(), timedOut: false };
    const left = waitSeconds - (Date.now() - started) / 1000;
    if (left <= 0) return { totals, seconds: waited(), timedOut: true };
    if (Date.now() - lastTick >= TICK_SECONDS * 1000) { lastTick = Date.now(); await tick(); }
    await sleep(Math.min(POLL_SECONDS, left));
  }
}

function requireEnv(names) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) throw new UsageError(`Set ${missing.join(' and ')} in the environment.`);
}

function checkedLedger(ledger) {
  const resolved = realPath(ledger);
  const refusal = ledgerRefusal(resolved, repositoryRoots());
  if (refusal) throw new UsageError(refusal);
  return resolved;
}

function appendPrivate(directory, name, line) {
  mkdirSync(directory, { recursive: true, mode: 0o700 }); chmodSync(directory, 0o700);
  const file = path.join(directory, name);
  appendFileSync(file, line + '\n', { mode: 0o600 }); chmodSync(file, 0o600);
}

async function runSetRecord(request) {
  const ledger = checkedLedger(request.ledger);
  requireEnv(request.dryRun ? ['SUPABASE_DB_URL'] : ['SUPABASE_DB_URL', 'APP_URL']);
  const meals = resolvePrefixes(request.meals), rows = [], outcomes = [], startedAt = Date.now();
  let previousInFlight = false;
  const snapshot = (prefix, id) => {
    const line = psql({ file: sqlFile('08-snapshot.sql'), vars: { prefixes: prefix } }).split('\n').find(s => s && JSON.parse(s).post?.id === id);
    if (!line) throw new Error(`Snapshot returned no meal ${prefix}.`);
    return JSON.parse(line);
  };
  for (let index = 0; index < meals.length; index++) {
    const stop = stopReason({outcomes, started:index, remaining:meals.length-index, maxMeals:request.maxMeals,
      maxMinutes:request.maxMinutes, elapsedMinutes:(Date.now()-startedAt)/60000, previousInFlight});
    if (stop) { console.log(`STOPPED: ${stop}`); console.log(summaryTable(rows)); return EXIT.stopped; }
    const {prefix, id} = meals[index], foods = request.foods.get(prefix);
    const before = snapshot(prefix, id);
    const choices = foods.map(food => {
      const matches = currentFoods(before).filter(i => i.id.startsWith(food.item));
      if (matches.length !== 1) throw new UsageError(`Food ${food.item} does not resolve to one current food in ${prefix}.`);
      return {...food, item:matches[0].id};
    });
    if (request.dryRun) {
      for (const food of choices) {
        const item = currentFoods(before).find(i => i.id === food.item);
        console.log(`${prefix} ${food.item.slice(0,8)}: ${item.nutrition?.source_ref ?? 'unknown'} -> ${food.fdc} (${food.description}); dry run, nothing written`);
      }
      continue;
    }
    const first = readTotals(id);
    const row = {meal:prefix, mode:'set-record', outcome:'skipped', before:publicTotals(first), after:null, seconds_waited:0, model_calls:0};
    if (before.post.status !== 'ready' || before.post.deleted_at || row.before.items !== currentFoods(before).length || first.job_in_flight) {
      row.reason = 'meal not ready, deleted, changed, or has an active job'; rows.push(row); outcomes.push('skipped');
      appendPrivate(ledger, 'ledger.jsonl', JSON.stringify(row)); continue;
    }
    appendPrivate(ledger, 'snapshots.jsonl', JSON.stringify(before));
    const since = dbNow(), processed = [];
    let after = before, changed = false, why = null, writeUnconfirmed = false;
    try {
      for (const food of choices) {
        const left = request.maxMinutes*60-(Date.now()-startedAt)/1000;
        if (left <= 0) { why='the bounded run clock expired'; break; }
        const matches = currentFoods(after).filter(i => descends(i, food.item, after));
        if (matches.length !== 1) { why='a current food identity is missing or ambiguous'; break; }
        writeUnconfirmed = true;
        const output = psql({file:sqlFile('27-set-record.sql'), vars:{post:id, item:matches[0].id, fdc:food.fdc}});
        writeUnconfirmed = false;
        if (!output.includes('|recompute|')) { why="refused by 27-set-record.sql's guards"; break; }
        changed = true;
        const wait = await waitForMeal(id, Math.max(1,Math.min(request.waitSeconds, Math.floor(left))));
        row.seconds_waited += wait.seconds; row.after=publicTotals(wait.totals);
        if (wait.timedOut) {
          previousInFlight=wait.totals.job_in_flight;
          why='the meal did not settle inside its wait cap'; row.outcome='timeout'; break;
        }
        after=snapshot(prefix,id); appendPrivate(ledger,'after.jsonl',JSON.stringify(after));
        processed.push(food);
        const result=setRecordOutcome(before,after,processed);
        row.values_removed=result.values_removed; row.foods=result.changes;
        if (result.reason) { why=result.reason; break; }
      }
    } catch(error) {
      if (writeUnconfirmed) { changed=true; row.write_uncertain=true; }
      why=error.message;
    }
    if (why && changed) {
      row.restore_reason=why;
      try { row.restored=await restore({meal:prefix,ledger:request.ledger,snapshot:'last',waitSeconds:request.waitSeconds})===EXIT.ok; }
      catch(error) { row.restored=false; row.restore_error=error.message; }
      row.outcome=row.restored?'restored':row.outcome==='timeout'?'timeout':'failed';
      if (row.restored) row.after=publicTotals(readTotals(id));
    } else if (why) { row.reason=why; row.after=row.before; }
    else { row.outcome='changed'; row.after=publicTotals(readTotals(id)); }
    row.calories_change=relativeChange(row.before.calories,row.after?.calories);
    row.model_calls=modelCalls(prefix,since);
    appendPrivate(ledger,'ledger.jsonl',JSON.stringify(row)); rows.push(row);
    // A put-back counts toward the two-consecutive-failures stop.
    outcomes.push(row.outcome==='restored'?'failed':row.outcome);
    console.log(`${prefix}: ${row.outcome}${why?` (${why})`:''}`);
    if (why && !row.restored && changed) { console.log(summaryTable(rows)); return EXIT.incomplete; }
  }
  if (!request.dryRun) console.log(summaryTable(rows));
  return EXIT.ok;
}

async function run(request) {
  if (request.mode === 'set-record') return runSetRecord(request);
  const ledger = checkedLedger(request.ledger);
  requireEnv(request.dryRun ? ['SUPABASE_DB_URL'] : ['SUPABASE_DB_URL', 'APP_URL']);
  const meals = resolvePrefixes(request.meals);
  const file = MODE_FILES[request.mode];
  if (request.dryRun) {
    console.log(`Dry run: nothing is written and no snapshot is taken. Mode ${request.mode} (${file}); at most ${request.maxMeals} meal(s), ${request.maxMinutes} minute(s), ${request.waitSeconds} s per meal.`);
    meals.forEach(({ prefix, id }, index) => {
      const t = readTotals(id);
      const note = index >= request.maxMeals ? 'would NOT be started: --max-meals' : t.job_in_flight ? 'would be skipped: a job for this meal is queued or running'
        : t.status !== 'ready' ? `would be skipped: the meal is ${t.status}, not ready` : `would snapshot, then run ${file}`;
      console.log(`${prefix}  ${t.status}  ${t.items} item(s)  ${fmt(t.calories)} kcal  ${note}`);
    });
    console.log(`Ledger directory (not created by a dry run): outside the repository, accepted.`);
    return EXIT.ok;
  }
  const startedAt = Date.now(), rows = [], outcomes = [];
  let stop = null, previousInFlight = false, broken = null;
  try { for (let index = 0; index < meals.length; index++) {
    stop = stopReason({ outcomes, started: index, remaining: meals.length - index, maxMeals: request.maxMeals, maxMinutes: request.maxMinutes,
      elapsedMinutes: (Date.now() - startedAt) / 60000, previousInFlight });
    if (stop) break;
    const { prefix, id } = meals[index];
    const row = { meal: prefix, mode: request.mode, outcome: 'skipped', at: new Date().toISOString(), before: null, after: null, calories_change: null, seconds_waited: 0, model_calls: 0 };
    const first = readTotals(id);
    row.before = publicTotals(first);
    if (first.deleted) row.reason = 'the meal was deleted after the run started';
    else if (first.job_in_flight) row.reason = 'a job for this meal is queued or running';
    else if (first.status !== 'ready') row.reason = `the meal is ${first.status}, not ready`;
    else {
      const snapshot = psql({ file: sqlFile('08-snapshot.sql'), vars: { prefixes: prefix } }).split('\n').find((line) => line && JSON.parse(line).post?.id === id);
      if (!snapshot) throw new Error(`08-snapshot.sql returned no line for meal ${prefix}; nothing was written for it.`);
      appendPrivate(ledger, 'snapshots.jsonl', IN_PLACE_MODES.has(request.mode) ? JSON.stringify({ ...JSON.parse(snapshot), operator_mode: request.mode }) : snapshot);
      const since = dbNow();
      psql({ file: sqlFile(file), vars: request.mode === 'recheck' ? { post: id, items: request.foods.get(prefix).map((food) => food.item).join(',') } : { post: id } });
      if (jobsSince(id, since) === 0) row.reason = "refused by the file's guards";
      else {
        const waitResult = await waitForMeal(id, request.waitSeconds);
        row.seconds_waited = waitResult.seconds;
        row.after = publicTotals(waitResult.totals);
        row.calories_change = relativeChange(row.before.calories, row.after.calories);
        row.model_calls = modelCalls(prefix, since);
        if (waitResult.timedOut) { row.outcome = 'timeout'; row.reason = `still ${waitResult.totals.status} after ${request.waitSeconds} s`; previousInFlight = waitResult.totals.job_in_flight; }
        else if (waitResult.totals.status === 'ready') row.outcome = compareTotals(row.before, row.after);
        else { row.outcome = 'failed'; row.reason = waitResult.totals.status === 'needs_input' ? 'the meal now asks its owner a question (needs_input)' : 'the meal is failed'; }
        if (!waitResult.timedOut) {
          const afterLine = psql({ file: sqlFile('08-snapshot.sql'), vars: { prefixes: prefix } }).split('\n').find((line) => line && JSON.parse(line).post?.id === id);
          if (afterLine) {
            appendPrivate(ledger, 'after.jsonl', afterLine); row.values_lost = lostValues(JSON.parse(snapshot), JSON.parse(afterLine));
            // #990: a recheck never carries: the listed foods' old micronutrients belong to the wrong record.
            const carry = row.outcome === 'failed' || request.mode === 'recheck' ? null : carryPlan(JSON.parse(snapshot), JSON.parse(afterLine));
            if (carry) {
              for (const step of carry) psql({ file: sqlFile('16-carry.sql'), vars: { post: id, item: step.item, entries: JSON.stringify(step.entries) } });
              const carried = psql({ file: sqlFile('08-snapshot.sql'), vars: { prefixes: prefix } }).split('\n').find((line) => line && JSON.parse(line).post?.id === id);
              if (carried) { appendPrivate(ledger, 'after.jsonl', carried); row.values_lost = lostValues(JSON.parse(snapshot), JSON.parse(carried)); }
              else row.values_lost = ['the meal could not be read after its carry'];
              if (!row.values_lost.length) row.values_carried = carry.flatMap((step) => step.lost);
            }
          }
          else row.values_lost = ['the meal could not be read after its run'];
          if (request.mode === 'decaf') {
            const { removed, kept } = deliberateRemovals(row.values_lost);
            row.values_lost = kept;
            if (removed.length) { row.values_removed = removed; row.removal_reason = DECAF_REASON; }
          }
          if (request.mode === 'recheck' && row.outcome !== 'failed') {
            const parsed = parseItems22(psql({ file: sqlFile('22-items.sql'), vars: { prefixes: prefix }, extra: ['-F', '\x1f'] }));
            const outcome = recheckOutcome(row.values_lost, JSON.parse(snapshot), request.foods.get(prefix).map((food) => food.name), parsed);
            row.values_lost = outcome.kept; row.recheck_passed = outcome.passed; if (outcome.still.length) row.recheck_still = outcome.still;
            if (outcome.removed.length) { row.values_removed = outcome.removed; row.removal_reason = RECHECK_REASON; }
          }
          const why = restoreReason(row);
          if (why) {
            row.restore_reason = why;
            let code;
            try { code = await restore({ meal: prefix, ledger: request.ledger, snapshot: 'last', waitSeconds: request.waitSeconds }); }
            catch (error) { code = EXIT.incomplete; row.restore_error = error.message; }
            row.restored = code === EXIT.ok;
            if (row.outcome !== 'failed') { row.outcome = row.restored ? 'restored' : 'failed'; if (!row.restored) row.reason = 'it was worse and could not be put back'; }
            if (row.restored) row.after = publicTotals(readTotals(id));
          }
        }
      }
    }
    if (row.outcome === 'skipped') row.after = row.before;
    appendPrivate(ledger, 'ledger.jsonl', JSON.stringify(row));
    rows.push(row); outcomes.push(row.outcome);
    console.log(`${prefix}  ${row.outcome}${row.reason ? ` (${row.reason})` : ''}${row.values_carried ? ` [carried: ${row.values_carried.join('; ')}]` : ''}${row.values_removed ? ` [removed: ${row.values_removed.join('; ')}]` : ''}${row.restore_reason ? ` [put back: ${row.restore_reason}${row.restored ? '' : '; the restore did not finish'}]` : ''}  kcal ${fmt(row.before?.calories)} -> ${fmt(row.after?.calories)}  waited ${row.seconds_waited} s`);
  } } catch (error) { broken = error; }
  console.log('\n' + summaryTable(rows));
  if (broken) { console.error(`\nSTOPPED at meal ${meals[rows.length].prefix}: ${broken.message} Its ledger line was not written; read its state before going on.`); return EXIT.incomplete; }
  if (stop) { console.log(`\nSTOPPED before meal ${meals[rows.length].prefix}: ${stop}. ${meals.length - rows.length} meal(s) not started: ${meals.slice(rows.length).map((m) => m.prefix).join(', ')}.`); return EXIT.stopped; }
  return outcomes.some((o) => o === 'failed' || o === 'timeout') ? EXIT.incomplete : EXIT.ok;
}

async function restore(request) {
  const ledger = checkedLedger(request.ledger);
  requireEnv(['SUPABASE_DB_URL', 'APP_URL']);
  let text;
  try { text = readFileSync(path.join(ledger, 'snapshots.jsonl'), 'utf8'); } catch { throw new UsageError('There is no snapshots.jsonl in that ledger directory.'); }
  const { snapshot, count } = findSnapshot(text, request.meal, request.snapshot);
  const params = restoreParams(snapshot);
  const repairNutrition = IN_PLACE_MODES.has(snapshot.operator_mode) ? (snapshot.items ?? [])
    .filter((item) => item.superseded_at === null && item.nutrition != null)
    .map((item) => {
      if (item.nutrition.post_item_id !== item.id) throw new UsageError('The repair snapshot nutrition does not match its item ID.');
      return item.nutrition;
    }) : null;
  const before = readTotals(params.post);
  if (before.deleted) throw new UsageError(`Meal ${request.meal} is deleted; it is not restored.`);
  if (before.job_in_flight) throw new UsageError(`A job for meal ${request.meal} is queued or running; try again when it has finished.`);
  if (!['ready', 'failed', 'needs_input'].includes(before.status)) throw new UsageError(`Meal ${request.meal} is ${before.status}; only a ready, failed or needs_input meal is restored.`);
  console.log(`Restoring meal ${request.meal} from its ${request.snapshot} snapshot (${count} in the ledger): ${params.old_ids.split(',').length} item(s) come back.`);
  const since = dbNow();
  // One psql session: a failed or needs_input meal first regains its snapshot state, then 13-restore.sql runs as it is.
  psql({ vars: { post: params.post, old_ids: params.old_ids, summary_comment_id: params.summary_comment_id, old_summary: params.old_summary, initialized: params.analysis_initialized_at,
    snapshot_needs_input: JSON.stringify(snapshot.post.needs_input ?? null), snapshot_question: JSON.stringify(snapshot.post.question ?? null), snapshot_fail_reason: snapshot.post.fail_reason ?? '',
    nutrition_rows: JSON.stringify(repairNutrition ?? []) },
    input: `update public.posts p set status = 'ready', fail_reason = nullif(:'snapshot_fail_reason', ''),
  needs_input = nullif(:'snapshot_needs_input'::jsonb, 'null'::jsonb), question = nullif(:'snapshot_question'::jsonb, 'null'::jsonb),
  analysis_initialized_at = nullif(:'initialized', '')::timestamptz
  where p.id = :'post'::uuid and p.status in ('failed', 'needs_input') and p.deleted_at is null
    and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'));
${repairNutrition === null ? '' : `\\i '${sqlFile('15-repair-undo.sql').replaceAll("'", "\\'")}'`}
\\i '${sqlFile('13-restore.sql').replaceAll("'", "\\'")}'
` });
  if (jobsSince(params.post, since) === 0) {
    console.error('Restore refused: 13-restore.sql queued no job. The preliminary status update may already have run; inspect the meal before retrying.');
    return EXIT.incomplete;
  }
  const waitResult = await waitForMeal(params.post, request.waitSeconds);
  const row = { meal: request.meal, mode: 'restore', outcome: waitResult.timedOut ? 'timeout' : waitResult.totals.status === 'ready' ? 'restored' : 'failed',
    before: publicTotals(before), after: publicTotals(waitResult.totals), seconds_waited: waitResult.seconds, model_calls: modelCalls(request.meal, since) };
  row.calories_change = relativeChange(row.before.calories, row.after.calories);
  console.log(summaryTable([row]));
  const was = snapshot.items.filter((item) => item.superseded_at === null).reduce((total, item) => total + Number(item.nutrition?.calories ?? 0), 0);
  console.log(`Snapshot: ${params.old_ids.split(',').length} item(s), ${fmt(was)} kcal. Now: ${row.after.items} item(s), ${fmt(row.after.calories)} kcal, status ${row.after.status}.`);
  return row.outcome === 'restored' ? EXIT.ok : EXIT.incomplete;
}

export async function main(argv) {
  let request;
  try {
    request = parseArgs(argv);
    if (request.command === 'help') { console.log(HELP); return EXIT.ok; }
    return await (request.command === 'run' ? run(request) : restore(request));
  } catch (error) {
    if (error instanceof UsageError) { console.error(error.message); return EXIT.usage; }
    console.error(error.message); return EXIT.incomplete;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main(process.argv.slice(2));
