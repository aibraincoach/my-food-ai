// #990: which stored foods are matched to a record of another kind of food (curry sauce to dried persimmons)?
// Read-only. Reads every current food and every saved meal's food with 23-records.sql in a read-only session, and
// checks each matched or closest record with the matcher's own rules (src/lib/fdc/record-kind.ts), so the detector and
// the matcher never disagree. Prints a ranked list (prefixes and food names only) and, with --labels, the precision and
// recall on foods whose verdict is already known.
//
//   node --import tsx scripts/numbers/mismatch.mjs [--rows=<private JSONL file>] [--labels=<file.json>] [--out=<private directory>]
//
// --rows: use the supplied rows with no database access; ranking is identical.
// --labels: a JSON list of {"meal": "<8-character prefix>", "name": "<food name>", "label": "absurd" | "wrong" | "right"}.
//   "absurd" is a record of another kind of food; "wrong" is a record judged wrong for another reason (a close food,
//   a portion); "right" is a record judged right. Precision counts absurd against all labelled foods it flags.
// --out: also writes flagged.jsonl and summary.json there (mode 0600). Needs SUPABASE_DB_URL and psql only without --rows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { checkRecord } from '../../src/lib/fdc/record-kind.ts';

export function rank(rows) {
  const checked = [], skipped = {};
  for (const row of rows) {
    if (!['match', 'closest'].includes(row.how) || !row.description) { skipped[row.how ?? 'none'] = (skipped[row.how ?? 'none'] ?? 0) + 1; continue; }
    const check = checkRecord(row.name ?? '', { description: row.description, category: row.category, kcalPer100g: row.kcal_per_100g });
    checked.push({ ...row, ...check });
  }
  // A food is flagged on one strong signal, or on two weak ones together.
  const flagged = checked.filter(row => row.strong.length > 0 || row.weak.length > 1)
    .sort((a, b) => b.score - a.score || (b.kcal ?? 0) - (a.kcal ?? 0));
  return { checked, flagged, skipped };
}

export function score(flagged, checked, labels) {
  const key = (meal, name) => `${meal}|${String(name).toLowerCase().trim()}`;
  const known = new Map(labels.map(l => [key(l.meal, l.name), l.label]));
  const flaggedKeys = new Set(flagged.map(r => key(r.meal, r.name)));
  const labelled = checked.filter(r => known.has(key(r.meal, r.name)));
  const hit = labelled.filter(r => flaggedKeys.has(key(r.meal, r.name)));
  const absurd = labelled.filter(r => known.get(key(r.meal, r.name)) === 'absurd');
  const truePositive = hit.filter(r => known.get(key(r.meal, r.name)) === 'absurd');
  const unmatched = labels.filter(l => !checked.some(r => key(r.meal, r.name) === key(l.meal, l.name))).map(l => `${l.meal} ${l.name}`);
  return { labelled: labelled.length, flagged_labelled: hit.length, true_positive: truePositive.length, absurd: absurd.length,
    precision: hit.length ? truePositive.length / hit.length : null, recall: absurd.length ? truePositive.length / absurd.length : null,
    missed: absurd.filter(r => !flaggedKeys.has(key(r.meal, r.name))).map(r => `${r.meal} ${r.name}`),
    false_flags: hit.filter(r => known.get(key(r.meal, r.name)) !== 'absurd').map(r => `${r.meal} ${r.name} (${known.get(key(r.meal, r.name))})`), unmatched };
}

function main() {
  const { values } = parseArgs({ options: { labels: { type: 'string' }, out: { type: 'string' }, rows: { type: 'string' } } });
  let rows;
  if(values.rows){rows=readFileSync(values.rows,'utf8').split('\n').filter(Boolean).map(line=>JSON.parse(line));}
  else {
  if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL is required.');
  const sql = fileURLToPath(new URL('./23-records.sql', import.meta.url));
  // Transaction poolers can discard PGOPTIONS. Pin the read and its safety checks to one explicit transaction.
  const guard = `begin read only; set local statement_timeout = '60s';
do $$ begin
  if current_setting('transaction_read_only') <> 'on' then raise exception 'detector requires a read-only transaction'; end if;
  begin
    update public.posts set id = id where false;
    raise exception 'detector write-refusal check failed';
  exception when read_only_sql_transaction then null;
  end;
end $$;`;
  const result = spawnSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', process.env.SUPABASE_DB_URL, '-c', guard, '-f', sql, '-c', 'commit'],
    { encoding: 'utf8', timeout: 120000, maxBuffer: 256 * 1024 * 1024, env: { ...process.env, PGOPTIONS: '-c default_transaction_read_only=on -c statement_timeout=60000' } });
  if (result.status !== 0) throw new Error(`psql failed: ${String(result.stderr).trim().split('\n').slice(-3).join(' ')}`);
  rows = result.stdout.split('\n').filter(Boolean).map(line => JSON.parse(line));
  }
  const { checked, flagged, skipped } = rank(rows);
  const summary = { foods: rows.length, meal_foods: rows.filter(r => r.kind === 'meal').length, saved_foods: rows.filter(r => r.kind === 'saved').length,
    checked: checked.length, not_checked: skipped, flagged: flagged.length, flagged_strong: flagged.filter(r => r.strong.length).length,
    flagged_meals: new Set(flagged.filter(r => r.kind === 'meal').map(r => r.meal)).size, flagged_saved: new Set(flagged.filter(r => r.kind === 'saved').map(r => r.meal)).size,
    flagged_kcal: Math.round(flagged.reduce((sum, r) => sum + (r.kcal ?? 0), 0)) };
  if (values.labels) summary.labels = score(flagged, checked, JSON.parse(readFileSync(values.labels, 'utf8')));
  console.log(['rank', 'kind', 'account', 'meal', 'item', 'name', 'grams', 'kcal', 'how', 'record', 'description', 'why'].join('\t'));
  flagged.forEach((r, i) => console.log([i + 1, r.kind, r.account, r.meal, r.item ?? '-', r.name, r.grams ?? '-', r.kcal ?? '-', r.how, r.record, String(r.description).slice(0, 70), [...r.strong, ...r.weak].join('; ')].join('\t')));
  console.log(JSON.stringify(summary, null, 1));
  if (values.out) {
    mkdirSync(values.out, { recursive: true, mode: 0o700 }); chmodSync(values.out, 0o700);
    for (const [name, text] of [['flagged.jsonl', flagged.map(r => JSON.stringify(r)).join('\n') + '\n'], ['summary.json', JSON.stringify(summary, null, 1)]]) {
      writeFileSync(`${values.out}/${name}`, text, { mode: 0o600 }); chmodSync(`${values.out}/${name}`, 0o600);
    }
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
