# Fleet 44 — #1098: model and USDA trace rows are deleted after 45 days, in small batches; the trace writer's old retry is deleted (2026-11-18, amended 10:00Z)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**Amended** on the PM's order of 09:48Z: the trace writer's retry without `model` and `host` is deleted (rule 5), with its test. The 09:47Z patch `56111c01…` is **void**.

**What this plan is.** The PM's packet of 2026-11-18 09:39Z (`qitem-20261118093928-eafca6edeba4d530`), issues #1098 and the builder's new issue for the trace writer's retry (the PM sends its number; put it beside #1098 in the PR title), under RT's rules 4 and 5 of Nov 18.
- **Order:** after Fleet 43 (#1097) merges, because it uses Fleet 43's runner and summary table.
- **Policy:** the PM's. This plan is its implementation.
- **Shape:** one code PR and one docs PR, local checks only before the stop, one stop before the merges.
- **After the PM's merge order:** the migration, one dry run on production, and a stop. **No row is deleted on production by this fleet.**
- **Base:** main after Fleet 43's merge. The patch applies on top of Fleet 43's patch (checked).
- **Files:**
  - `supabase/migrations/0072_trace_retention.sql` and `supabase/rollbacks/0072_trace_retention.down.sql`;
  - `scripts/retention/run.mjs` (one table added);
  - `tests/db/retention-traces.test.mjs`;
  - `src/lib/trace/record.ts` and `tests/identify-provenance.test.mjs` (the old retry).

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix.

**Stops: one**, before the merges (section 6). The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes.

## 1. The policy, and the readers that decide the exceptions

**The PM's rule:** a trace row (`public.model_calls`) is deleted **45 days** after its call started. The exception is a row the current analysis of a meal still references.

**Every reader of `model_calls` on `f5c69848`:**

| Reader | What it needs from old rows | Rule |
|---|---|---|
| **Repeating a meal** (`src/lib/pipeline/prior.ts:39`, `prior-nutrition.ts`) | It copies an earlier meal's numbers only if, for each current food, the latest USDA decision row (`kind 'fdc'`, no error, `fdc_id` equal to the food's `item_nutrition.source_ref`) is there | **Kept:** a `fdc` row with no error whose `fdc_id` is the record a current (not superseded) food of that meal stores. This is the PM's "current analysis" exception. It also keeps the decisions behind the stored numbers that the numbers revisit relies on |
| **A meal's card** (`src/lib/posts/items.ts:133`) | For a meal identified by Meta, whether the open model's identify failed first (`host 'baseten'`, `kind 'spark_identify'`, with an error). This shows on the card | **Kept:** that row, for a meal whose `identify_host` is `meta`. **This purpose was not in the PM's packet; it is proposed here.** It is a handful of rows |
| **The admin meal page** (`src/app/admin/posts/[id]/page.tsx:28`) | Every trace of one meal, for debugging | **Not kept.** A meal older than 45 days shows only its kept rows. The PM should know this |
| **Admin stats** (`src/lib/admin/stats.ts:17-20`) | All-time counts | **Not kept.** The all-time numbers will drop |
| **Numbers scripts** (`scripts/numbers/09-usage.sql`, `reanalyse.mjs`) | Calls since a given time, during a run | Recent rows only |
| `scripts/eval.mjs` | Its own fresh evaluation meals | Recent rows only |

**A rule-5 change, in this fleet.** `src/lib/trace/record.ts` lines 70–73 retry a failed trace insert **without** the `model` and `host` columns. That is an old path kept for a database before migration 0032, and every database now has those columns, so it is deleted.

## 2. The implementation

**Migration `0072_trace_retention.sql`:**
- **`model_calls_started`:** an index on `model_calls (started_at)`, so candidates are found without scanning the table. The existing index is `(post_id, started_at)`.
- **`retention_trace_candidates(p_now)`:** rows older than 45 days, minus the two kept cases in section 1.
- **`retention_traces_dry_run(p_now default now)`:** counts per rule, kind and day. It deletes nothing.
- **`retention_traces_batch(p_limit)`:**
  - deletes at most `p_limit` rows, oldest first, in one statement;
  - writes their counts per rule (`older_45d`), day and kind to Fleet 43's `retention_summary`;
  - refuses a size outside 1 to 1000.
- **Permissions:** all three functions are `security definer`, revoked from `public`, `anon` and `authenticated`.

**Rollback `0072_trace_retention.down.sql`:** drops the three functions and the index. **Deleted trace rows cannot be restored by any rollback.** What was deleted is recorded only as counts per day and kind in `retention_summary`.

**The index is built once, on the full table, when 0072 is applied.** A plain `create index` takes a short write lock on `model_calls`. While it builds, new trace writes wait; `record.ts` gives each write a 3-second limit and never holds back a meal. 0072 is applied only inside the low-traffic window the PM names in the merge order.

**`scripts/retention/run.mjs`:** `--table=model_calls` is added beside `jobs`, with the same bounds, dry-run default, pause and stop.

**`src/lib/trace/record.ts` (rule 5):**
- **The writer makes one insert**, with every column. Its row variable is renamed from `legacy` to `row`.
- **The second insert without `model` and `host` is deleted.**
- **A failed write is logged with its code:** `Model trace could not be stored: <code>.` It is never retried in another shape.
- **What stays:** the model call's own result is still returned, and the 3-second write limit stays, so a trace store failure never holds back a meal.

**`tests/identify-provenance.test.mjs`:** the test "pre-0032 trace rejection retries only legacy identity fields…" becomes "a rejected trace write is not retried without model and host, and is logged visibly". It checks:
- the insert is rejected with `PGRST204` for `model`;
- exactly one write is made, carrying `model` and `host`;
- the call's result is still returned;
- the log line names the code.

It fails on main's `record.ts` (two writes). The next test, "unrelated trace schema errors do not silently downgrade payloads", is unchanged and still passes.

**`tests/db/retention-traces.test.mjs`** (local throwaway database):
- **The fixture:** 8 trace rows, two meals, one current food and one superseded food.
- **The dry run** deletes nothing.
- **Batches of 2 delete exactly five rows:**
  - a decision for another record;
  - a failed USDA call;
  - a successful Meta identify;
  - a row with no meal;
  - a decision whose food was superseded.
- **Three rows are kept:**
  - the current food's decision;
  - a 44-day-old row;
  - the card's failed open-model identify.
- **`retention_summary`** counts the deletions.

## 3. Facts the planner checked

- **Attached:** `/home/opc/.claude/plans/fleet44-trace-retention.patch`, sha256 `0c8af252f5c9b6eeb8f5bdd0bbf4a98bd3d00350e4cf932c179a5d9c68424d10`. It applies after Fleet 43's patch (`53042ae3…`), on `f5c69848`. If the hash does not match, the PR is void. **The 09:47Z patch `56111c01…` is void.**
- **Verified on the planner's local stack** (09:47Z, before the amendment; the SQL and the database test are unchanged since):
  - 0072 applies, and its rollback (with 0071's) applies and re-applies;
  - `tests/db/retention-traces.test.mjs` and `tests/db/retention-jobs.test.mjs` pass 5 of 5 together.
- **Verified after the amendment:**
  - `npx tsc --noEmit` is clean, and `npx eslint` on `record.ts` and the changed test is clean;
  - **the 25 test files** that mention traces pass: 108 passed, 3 skipped, 0 failed;
  - the new test fails on main's `record.ts`.
- **Not run by the planner:** the two suites, and anything on production.

## 4. The code PR — branch `fix44/trace-retention` — #1098

1. **Worktree** `/tmp/mfa-f44` from `origin/main` (after Fleet 43's merge), with `npm ci`. Apply with `git apply /home/opc/.claude/plans/fleet44-trace-retention.patch`.
2. **Your own stack.** `TEST_PORT_BASE=62460 TEST_PG_PORT=56749 TEST_STACK_DIR=/tmp/mfa-f44/s TEST_ENV_FILE=.env.test.fleet44`.
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on the changed files;
   - both suites once, with the built app started (10 minutes each);
   - the two retention tests together;
   - `tests/identify-provenance.test.mjs`.
4. **The query plan, locally:** run `explain` (not `analyze`) on `select * from retention_traces_dry_run()`, and report its join types. A nested loop that scans `post_items` or `item_nutrition` once per trace row is a fault: fix it with an index in this PR, and say which.
5. **Review:** one PPLX review on the final head (AGY if PPLX is unavailable).
6. **Docs PR:** branch `docs/fleet44`, with this plan unchanged as `docs/plan-fleet44.md`.

## 6. The stop

Stop when:
- the code PR and the docs PR are open;
- the code PR is reviewed or reported "written, not reviewed";
- item 4's plan is reported.

Report to the PM in one message:
- the PR's number, branch, final head (40 characters), checks and results, and review;
- the suites' counts and the query plan;
- the merge order: **the code PR, then the docs PR**.

Then wait for the PM's merge order, which names each PR and its full head SHA, and the low-traffic window for 0072.

## 7. After the PM's merge order: production, once

Rule 4 applies: one sequential pass, and no load test.
1. **Deployment:** wait for READY with the alias matched (at most 10 minutes).
2. **The migration:** apply 0072 once, **only inside the low-traffic window the PM names in the merge order**, because its index build makes trace writes wait. Report its start, its end and how long it took. Read back once that the functions and the index exist.
3. **The plan, once:** `explain` (not `analyze`) of `select * from retention_traces_dry_run()`. If it scans a table once per row, stop and report it.
4. **The dry run, once:** `node scripts/retention/run.mjs --table=model_calls`. Report its whole output. **Delete nothing.**
5. **Stop and report.** The PM orders the first real run separately: `--delete --batches=1`, then one batch per order.

## 8. Not in this run, and why

- **A schedule:** the PM orders each run by hand for now.
