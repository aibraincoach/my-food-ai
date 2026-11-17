# Numbers: study and re-analysis

Read-only queries that look for stored nutrition numbers that cannot be right, and operator statements that re-analyse one meal and put it back. Each file says what it needs. Written for Fleet 25 (docs/plan-fleet25.md), where every file was run on a database made from this repository's migrations.

Read-only files (02 to 09) are run with a read-only session:
PGOPTIONS='-c default_transaction_read_only=on' psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -v uid=<account id> -f scripts/numbers/<file>

Files 10 to 13 write. They keep every old row, marked superseded. Take the snapshot (08) first: it is the only way back.

Files 03 and 04 hold the same rules. Each must be one SELECT so that it runs in a read-only session. Change a rule in both.

## Re-analysing a list of meals: reanalyse.mjs

`node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse --meals=<prefix,...> --ledger=<private directory outside the repository>` works the meals one at a time with 11-rematch.sql or 12-reanalyse.sql. Before it touches a meal it appends that meal's snapshot (08) to `<ledger>/snapshots.jsonl`, and afterwards one line per meal (prefix, before and after totals, seconds waited, model calls) to `<ledger>/ledger.jsonl`. It stops on its own at `--max-meals` (default 10), at `--max-minutes` (default 45), after two failed or timed-out meals in a row, or when more than one meal in ten has failed. `--dry-run` writes nothing. `restore --meal=<prefix> --ledger=<directory>` puts one meal back from its snapshot with 13-restore.sql. `--help` gives every option. It needs `SUPABASE_DB_URL`, `APP_URL` and psql.

14-rule-failures.sql is read-only, like 02 to 09: one row per ready meal that fails rule a1, a2, b, d, e, f or g1 of 03, and whether 12-reanalyse.sql would accept it. It repeats those rules, so a rule change is made in 03, 04 and 14.
