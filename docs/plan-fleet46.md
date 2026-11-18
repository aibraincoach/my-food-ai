# Fleet 46 — #1102, #1103, #1104: three old fallback paths deleted, each failing visibly (2026-11-18)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. **Nothing here touches production.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 10:33Z, under RT's rule 5 of Nov 18 (`/home/opc/pm/my-food-ai/decisions/OWNER-RULINGS-2026-11-16.md`: no legacy code, no fallbacks; a failure fails visibly).
- **Shape:** three issues in **one fleet**. Their source files do not overlap, so one fleet is enough.
- **PRs:** three code PRs (one per change, as the coder contract asks) and one docs PR.
- **Checks:** local only.
- **Stops:** one stop before the merges, and no production section.
- **Order:** after Fleets 43 and 44.
- **Base:** main `b4cdaa4f08451851ee7f7f12139beb7ddd61f8cf`. Each patch applies to main alone, and also after Fleets 43 and 44 (checked with `git apply --check`).
- **Shared file:** #1104's test changes `tests/identify-provenance.test.mjs`, which Fleet 44 also changes in another test. The two hunks do not overlap, and both orders apply.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**Stops: one**, before the merges (section 5). The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

## 1. The three old paths, and why each can go

**#1102: the meal read retries without `identify_model` and `identify_host`.**
- **Where:** `src/lib/posts/items.ts:107-118`, `getPostDetail`.
- **What it does:** if the read fails with `PGRST204` or `42703` naming those columns, it reads the meal again without them.
- **Why it can go:** the columns came with migration 0032 and are in every database since.
- **Rule-5 version:** one read with the columns. A failed read throws "Meal could not be loaded.", as any other read error already does.

**#1103: the nutrition reads retry without `not_eaten_calories`, and recompute it from the original food.**
- **Where:** `src/lib/nutrition/totals.ts`, in two readers:
  - `getCurrentItems`, lines 205–234;
  - `getCurrentItemsForPosts`, with `mapCurrentItems`, lines 250–296.
- **What they do:**
  - If the read fails with `42703` naming the column, each reads again without it.
  - The other half of the same old path: when the field is absent, each reader reads the original (superseded) food and works the leftover calories out from its calories.
- **Why it can go:** the column came with migration 0028, and `current_post_items` is `select *` from `post_items`, recreated in 0028. So the field is never absent in a database row. The computation can run only for a missing column.
- **A real database read saved:** `getCurrentItems` read the original foods (`post_items` with nutrition) on **every** call where a food has a leftover and a predecessor, even with the column present, then threw the answer away. That read goes too.
- **Rule-5 version:**
  - one read each;
  - the stored `not_eaten_calories` is used as stored (a stored `null` stays `null`, as now);
  - `mapCurrentItems` loses its `priorCalories` parameter.
- **Type kept:** `CurrentItem.not_eaten_calories` stays optional in the type, because `src/lib/worker/jobs/recompute.ts:136` builds items without it. That is not a database read, and not in scope.

**#1104: the worker falls back to older persistence functions when the new one is missing.**
- **Where:** `src/lib/pipeline/persist.ts:141-158`, `persistAnalysis`.
- **What it does:** if `persist_approximated_analysis` answers `PGRST202` or `42883`, it reads the meal's first model comment. Then it calls `persist_identified_analysis`, and if that is missing too, `persist_owned_label` or `persist_owned_analysis`.
- **Why it can go:** `persist_approximated_analysis` has existed since migration 0051, and was last redefined in 0065.
- **Rule-5 version:** one call. Any error fails the job with "persist: analysis transaction failed: …", and the job retries as every failed job does.
- **The older SQL functions stay.** `persist_approximated_analysis` itself calls `persist_identified_analysis`, `persist_owned_label` and `persist_owned_analysis` (0065). They are its building blocks, not a second route, so this fleet drops none of them.

**Another old path of the same kind, found here and not in this fleet.**
- **Where:** `src/lib/posts/upload-draft.ts:57`.
- **What it does:** it falls back from `reserve_post_upload_with_leftovers` to an older reservation function when the new one is missing. Its test is `tests/upload-reservation.test.mjs:34-43`.
- **Why not here:** it has no issue number. It is named for the PM.

## 2. Facts the planner checked

**Attached** (`/home/opc/.claude/plans/`). Check each hash; a file that does not match voids its PR.

| Patch | sha256 | Files |
|---|---|---|
| `fleet46-1102-meal-read.patch` | `7eb88aa6ffa5ee9f2b47d45f3679bb8364b28cf8067f473b559a0db598c93842` | `src/lib/posts/items.ts`; new `tests/meal-read-one-query.test.mjs` |
| `fleet46-1103-nutrition-read.patch` | `b02e2558db4747a0b9a2faca6e1a41847af166142d002b34bdd5e971f356788c` | `src/lib/nutrition/totals.ts`; `tests/feed-nutrition.test.mjs` |
| `fleet46-1104-persist.patch` | `e1658200c4ecfa650c170a49595b89e44ba198a73abfda3fe59ae744e6b94b69` | `src/lib/pipeline/persist.ts`; `tests/identify-provenance.test.mjs` |

**The tests:**
- **#1102:** a new test. A meal read the database rejects (`42703` on `identify_model`) is **one** `posts` request, with both columns, and the page fails with "Meal could not be loaded."
- **#1103:**
  - The batch test that encoded the fallback ("…legacy scaling and remainder fallback") now reads a stored `not_eaten_calories` and makes **one** request. Its fixture refuses any `post_items` read.
  - A new test: a read rejected with `42703` on `not_eaten_calories` is one request in each reader, and each throws its error.
- **#1104:** the test "missing new persistence RPC alone allows a legacy rollout fallback…" becomes "a missing or failing persistence function fails the job, with no older function called". For both a missing function (`PGRST202`) and an ownership failure (`40001`), it checks:
  - the job rejects;
  - only `persist_approximated_analysis` was called.

**Verified on the planner's worktree** (main with Fleets 43 and 44, then the three patches):
- `npx tsc --noEmit` is clean.
- `npx eslint` on the changed files has no errors. The one warning is `tests/feed-nutrition.test.mjs:62`, `init` unused, already on main.
- Each new or changed test fails on the old code and passes on the new.
- `tests/days-reader-queries.test.mjs` passes unchanged. Its explicit-NULL test already expected the stored `null`.
- **Related tests:** the 127 test files that mention persistence, the pipeline, the worker, analysis, meal detail or totals. The results are in section 3.

**Not run by the planner:** the suites against a stack.

## 3. Related test results

- **With the three patches:** 447 passed, 27 failed, 13 skipped.
- **On the same base without them:** 445 passed, 28 failed, 13 skipped. The extra failure there is the new #1102 test, which fails on the old code as it should.
- **The 27 failures are identical in both runs,** test by test (compared by name). Every one needs a database, an app address or the shared-database permission that the planner's environment lacks:
  - "Invalid URL" 10;
  - "SUPABASE_DB_URL is required" (in its variants) 6;
  - "supabaseUrl is required." 3;
  - the worker-lease guard 2;
  - database assertions 6.
- **So the patches change no outcome** except the tests they rewrite.

## 4. How it runs

1. **Worktree** `/tmp/mfa-f46` from `origin/main`, with `npm ci`. One branch per PR:
   - `fix46/meal-read` (#1102);
   - `fix46/nutrition-read` (#1103);
   - `fix46/persist-one-call` (#1104).

   Each comes from `origin/main`, with its patch applied by `git apply`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=62760 TEST_PG_PORT=57049 TEST_STACK_DIR=/tmp/mfa-f46s TEST_ENV_FILE=.env.test.fleet46`. A stack folder inside the worktree breaks the Next build.
3. **Checks, per PR:**
   - `npx tsc --noEmit`, and `npx eslint` on the changed files;
   - the PR's tests.
4. **The suites:** both once, on a scratch branch of the three PRs together, with the built app started (10 minutes each). Compare the counts with main's.
5. **The local check, L1:** on the stack, run one photo meal through to ready as test user 1. Then open its detail page, and add a leftovers photo to it. Met when all of these hold:
   - the meal reaches ready;
   - the detail page loads;
   - the leftovers calories show as stored.

   This proves the three readers and the writer work on a real database without their old paths.
6. **Review:** one PPLX review per PR on its final head (AGY if PPLX is unavailable).
7. **Docs PR:** branch `docs/fleet46`, with this plan unchanged as `docs/plan-fleet46.md`.

## 5. The stop

Stop when:
- the three code PRs and the docs PR are open;
- each code PR is reviewed or reported "written, not reviewed";
- L1 is reported.

Report to the PM in one message:
- each PR's number, branch, final head (40 characters), checks and review;
- the two suites' counts, against main;
- L1;
- anything void under section 2;
- the merge order: **#1102, #1103, #1104 (any order among the three), then the docs PR**.

Then wait for the PM's merge order. **There is no production check:** each change only removes a second request that a current database never triggers. After the merge, run L1 once on main locally and report it.

## 6. Not in this run, and why

- **`upload-draft.ts:57`'s fallback** to an older reservation function: it has no issue number (section 1).
- **Dropping the older SQL persistence functions:** they are building blocks of the current one.
