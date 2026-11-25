# MEXT trace identity — UNAPPLIED and held

0086 is file-first preparation for #1221. Merging applies nothing; this packet
has no src or messages change. Production apply requires RT's written database
yes and the PM's exact order. The app is separate and waits for 0085 and 0086
apply/read-back, the separately ordered night import, and its exact-head order.
No production read, write, import, model call or browser judge is part of this PR.

## Contract

model_calls gains nullable reference_ref. The nine existing kinds and fdc_id
are unchanged. Only kind mext may use reference_ref. A selected/reused MEXT row has no error
and requires exactly mext: plus five digits, including leading zeros. A failed
MEXT read has a non-null error and a null reference_ref because no food was
selected. Both require a null fdc_id. A missing selected identity, an identity
on a failed read, or a cross-source reference is refused by a CHECK.

No-selection outcomes mext_none, mext_incompatible and mext_unclassified are
typed fixed-key metadata on the existing final food-resolution trace (fdc on
USDA fallback), with candidate numbers and no invented identity or free text.
The app packet tests that metadata; this migration packet tests its SQL shape.

The existing retention function keeps the original USDA predicate byte-for-byte.
One additional exception retains an error-free MEXT row only while its exact
reference_ref occurs in item_nutrition.source_ref for a current, not-superseded
item belonging to that same post. Failed, unrelated and superseded MEXT traces
expire after 45 days. The current dry-run and counted batch functions continue
to call this function. There is no body/JSON parsing, new retention runner,
index or second source-identity field for USDA.

## Local verification

Run `node --test tests/mext-trace-db.test.mjs`. This starts and removes its own
loopback PostgreSQL 17 C.UTF-8 cluster without loading environment files. The
model_calls table and retention routines come from their real migration SQL;
related tables are minimal relational fixtures. It proves all old kinds insert,
the identity constraint, differential equality of 162 old-kind retention cases,
actual counted purge of MEXT traces, rollback refusal, a real held-table lock,
and a slow-ALTER statement timeout. This isolated test is not a full application
stack or a production-size timing measurement.

## Apply and read-back (held)

By the separate exact order only, apply the reviewed file from main once through
the bounded operator wrapper. Its transaction uses lock_timeout 1s and
statement_timeout 5s; a failure fully rolls back and is reported as a hold.
Never retry automatically; another attempt needs a fresh PM order.

The once-ordered read-back uses one bounded read-only transaction and returns
schema/booleans only, with no trace body, user data, credentials or IDs:

```sql
begin isolation level repeatable read read only;
set local lock_timeout = '1s';
set local statement_timeout = '5s';
select exists(select 1 from information_schema.columns
  where table_schema='public' and table_name='model_calls'
    and column_name='reference_ref' and data_type='text') as reference_column;
select conname, convalidated, pg_get_constraintdef(oid)
from pg_constraint where conrelid='public.model_calls'::regclass
  and conname in ('model_calls_kind_check','model_calls_reference_ref_check')
order by conname;
select pg_get_functiondef('public.retention_trace_candidates(timestamptz)'::regprocedure);
rollback;
```

Compare the definitions to the reviewed source; a mismatch holds the app switch.
Read-back itself never invokes the purge or inserts a trace. Existing client RLS
and grants are unchanged; CREATE OR REPLACE retains the function's privileges.

## Rollback

Before any MEXT trace exists, the reviewed rollback restores the original
retention definition and nine-kind constraint, then removes the unused column.
It has the same 1s/5s transaction bounds and refuses if any typed MEXT trace
exists. Once the app emits such traces, retain this schema and revert only the
app; do not erase provenance to make a down migration pass. The reference-table
rollback separately refuses current or saved MEXT facts. No rollout order here
authorizes either rollback against production.
