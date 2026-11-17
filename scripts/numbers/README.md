# Numbers: study and re-analysis

Read-only queries that look for stored nutrition numbers that cannot be right, and operator statements that re-analyse one meal and put it back. Each file says what it needs. Written for Fleet 25 (docs/plan-fleet25.md), where every file was run on a database made from this repository's migrations.

Read-only files (02 to 09) are run with a read-only session:
PGOPTIONS='-c default_transaction_read_only=on' psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -v uid=<account id> -f scripts/numbers/<file>

Files 10 to 13, 15 and 16 write. They keep every old row, marked superseded (15 changes a negative value to zero in place, 16 adds micronutrient entries to a new row). Take the snapshot (08) first: it is the only way back.

Files 03 and 04 hold the same rules. Each must be one SELECT so that it runs in a read-only session. Change a rule in both.

## Re-analysing a list of meals: reanalyse.mjs

`node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse|repair --meals=<prefix,...> --ledger=<private directory outside the repository>` works the meals one at a time with 11-rematch.sql, 12-reanalyse.sql or 15-repair.sql. Before it touches a meal it appends that meal's snapshot (08) to `<ledger>/snapshots.jsonl`, and afterwards one line per meal (prefix, before and after totals, seconds waited, model calls) to `<ledger>/ledger.jsonl`. It stops on its own at `--max-meals` (default 10), at `--max-minutes` (default 45), after two failed or timed-out meals in a row, or when more than one meal in ten has failed. When a meal has finished, it is read again (`<ledger>/after.jsonl`) and put back from its snapshot at once if it failed or asks a question, lost any nutrition value it had (a zero is a value, NULL is not; micronutrients count), or its calories moved by more than half (#989). When the only values lost are micronutrients of a food that is still there with the same name and weight (not water, caffeine or alcohol, and not on a meal with a saved meal), 16-carry.sql first adds the old entries to the food's new row, and the meal is kept when it then loses nothing; the ledger line lists them as `values_carried` (#990). `--dry-run` writes nothing. `restore --meal=<prefix> --ledger=<directory>` puts one meal back from its snapshot with 13-restore.sql. A `failed` or `needs_input` meal first regains the snapshot's ready state, question fields and analysis time. Repair must run through the CLI: before 15-repair.sql writes, the private snapshot records every original nutrition row and marks the snapshot as a repair. Restoring that snapshot runs 15-repair-undo.sql first, writing the original nutrition values (including NULLs, zeros and micronutrients) back onto the same item IDs; 13-restore.sql then restores the items and summary and queues the recompute. Run neither repair SQL file without its CLI snapshot and guards. `--help` gives every option. It needs `SUPABASE_DB_URL`, `APP_URL` and psql.

14-rule-failures.sql is read-only, like 02 to 09: one row per ready meal that fails rule a1, a2, b, d, e, f or g1 of 03, and whether 12-reanalyse.sql would accept it. It repeats those rules, so a rule change is made in 03, 04 and 14.

17-census.sql is read-only too and takes no variable: one row per account with a ready meal (its first 8 characters), with its ready meals, copies, saved meals and saved meals whose meal is gone (#990).
