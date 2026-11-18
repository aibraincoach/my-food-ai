#!/usr/bin/env node
// Retention runner (#1097 jobs, #1098 model_calls, #1121 cron_runs). Owner rule 4: never one big delete.
// Dry run by default: prints what each rule would delete, per rule, kind and day, and deletes nothing.
// --delete runs at most --batches batches of at most --batch-size rows, one after another, with --pause-ms between
// them, and stops at the first batch that deletes nothing or fails. Deleted rows cannot be restored; each batch is
// counted in public.retention_summary. Usage:
//   SUPABASE_DB_URL=... node scripts/retention/run.mjs --table=jobs|model_calls|cron_runs [--delete --batches=1 --batch-size=200 --pause-ms=5000]
import { spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

export const TABLES = {
  cron_runs: { dryRun: 'retention_cron_runs_dry_run', batch: 'retention_cron_runs_batch' },
  jobs: { dryRun: 'retention_jobs_dry_run', batch: 'retention_jobs_batch' },
  model_calls: { dryRun: 'retention_traces_dry_run', batch: 'retention_traces_batch' },
};
export const LIMITS = { batches: [1, 50], batchSize: [1, 1000], pauseMs: [1000, 600000] };

export function parseArgs(argv) {
  const raw = Object.fromEntries(argv.map(arg => { const match = /^--([a-z-]+)(?:=(.*))?$/.exec(arg); if (!match) throw new Error(`Unknown argument: ${arg}`); return [match[1], match[2] ?? true]; }));
  const known = new Set(['table', 'delete', 'batches', 'batch-size', 'pause-ms']);
  for (const key of Object.keys(raw)) if (!known.has(key)) throw new Error(`Unknown option: --${key}`);
  if (!Object.hasOwn(TABLES, raw.table)) throw new Error(`--table must be one of: ${Object.keys(TABLES).join(', ')}`);
  if (raw.delete !== undefined && raw.delete !== true) throw new Error('--delete is a switch and takes no value');
  const int = (name, value, [min, max]) => { const n = Number(value); if (typeof value === 'boolean' || !Number.isInteger(n) || n < min || n > max) throw new Error(`--${name} must be an integer from ${min} to ${max}`); return n; };
  return { table: raw.table, delete: raw.delete === true,
    batches: int('batches', raw.batches ?? 1, LIMITS.batches),
    batchSize: int('batch-size', raw['batch-size'] ?? 200, raw.table === 'cron_runs' ? [1, 5000] : LIMITS.batchSize),
    pauseMs: int('pause-ms', raw['pause-ms'] ?? 5000, LIMITS.pauseMs) };
}

function psql(sql, readOnly = false) {
  const db = process.env.SUPABASE_DB_URL;
  if (!db) throw new Error('SUPABASE_DB_URL is required');
  // One bounded transaction per call, with pooler-safe LOCAL settings.
  const result = spawnSync('psql', ['-X', '-qAt', '-F', '\t', '-v', 'ON_ERROR_STOP=1', '--dbname', db],
    { input: `begin${readOnly ? ' read only' : ''};\nset local lock_timeout = '5s';\nset local statement_timeout = '30s';\n${sql}\ncommit;\n`, encoding: 'utf8', timeout: 60000 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error([result.stdout.trim(), result.stderr.trim()].filter(Boolean).join('\n') || `psql exited ${result.status}`);
  return result.stdout.trim();
}

export async function run(options, log = console.log) {
  const fns = TABLES[options.table];
  if (!options.delete) {
    const privilege = options.table === 'cron_runs' ? `select has_table_privilege('cron.job_run_details', 'DELETE') as cron_can_delete \\gset
\\echo cron_delete_privilege :cron_can_delete
\\if :cron_can_delete
` : '';
    const refuse = options.table === 'cron_runs' ? `
\\else
\\echo Cron run DELETE privilege is required; stopping without cleanup.
\\quit 1
\\endif` : '';
    let rows = psql(`${privilege}select rule, kind, day, would_delete from public.${fns.dryRun}();${refuse}`, true);
    if (options.table === 'cron_runs') {
      const [permission, ...data] = rows.split('\n');
      if (permission !== 'cron_delete_privilege t') throw new Error('Cron run DELETE privilege was not confirmed.');
      log(permission);
      rows = data.join('\n');
    }
    const lines = rows ? rows.split('\n').map(line => line.split('\t')) : [];
    log(`dry run, ${options.table}: ${lines.reduce((sum, row) => sum + Number(row[3]), 0)} row(s) would be deleted; nothing was deleted`);
    for (const [rule, kind, day, count] of lines) log(`${day}\t${rule}\t${kind}\t${count}`);
    return { deleted: 0, batches: 0 };
  }
  let deleted = 0, batches = 0;
  for (let index = 0; index < options.batches; index++) {
    if (index > 0) await sleep(options.pauseMs);
    const count = Number(psql(`select public.${fns.batch}(${options.batchSize});`));
    batches++; deleted += count;
    log(`${new Date().toISOString()} batch ${index + 1}: ${count} ${options.table} row(s) deleted`);
    if (count === 0) break;
  }
  log(`done: ${deleted} row(s) in ${batches} batch(es); see public.retention_summary`);
  return { deleted, batches };
}

const entry = process.argv[1];
if (entry && existsSync(entry) && realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    if (entry !== realpathSync(entry)) throw new Error('Run retention by its real file path; symlink invocation is refused.');
    await run(parseArgs(process.argv.slice(2)));
  }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
