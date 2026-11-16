# Numbers: study and re-analysis

Read-only queries that look for stored nutrition numbers that cannot be right, and operator statements that re-analyse one meal and put it back. Each file says what it needs. Written for Fleet 25 (docs/plan-fleet25.md), where every file was run on a database made from this repository's migrations.

Read-only files (02 to 09) are run with a read-only session:
PGOPTIONS='-c default_transaction_read_only=on' psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -v uid=<account id> -f scripts/numbers/<file>

Files 10 to 13 write. They keep every old row, marked superseded. Take the snapshot (08) first: it is the only way back.

Files 03 and 04 hold the same rules. Each must be one SELECT so that it runs in a read-only session. Change a rule in both.
