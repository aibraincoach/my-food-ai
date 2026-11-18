# Fleet 55 — #694 (with #285): how many of the owner's meals show wrong numbers, and why, measured: one narrow read, a local ranking, and at most 30 meals checked against their photos (2026-11-18)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. **Nothing here touches production before the PM's merge order.** After it come one read-only SELECT and at most 30 meals' photos, fetched one at a time. **Nothing in production is written.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 18:02Z (`qitem-20261118180243-10117ae89e72522c`), item 7, and the PM's ruling of 18:09Z:
- **#285 folds into #694.** The PM closes #285 with that pointer.
- **Part 1:** one narrow read-only SELECT of the owner's foods, then a local ranking.
- **Part 2:** the photo check, **authorized under the owner's standing authorization to revisit his numbers**:
  - a sample of at most 30 meals, including the half-eaten meals of #285;
  - photos fetched sequentially, one at a time, through the existing signed storage route, in one pass;
  - no database scan beyond the narrow SELECT;
  - nothing written except corrections the restore rule allows.
- **The rules:** RT's rules 4 and 5 of Nov 18 (`/home/opc/pm/my-food-ai/decisions/OWNER-RULINGS-2026-11-16.md`).

**What it finishes.** Steps S7 and S8 of Fleet 25's study, skipped on Nov 16 (`docs/findings/nutrition-numbers-study-2026-11-16.md` §6–7), with Fleet 25's rubric (`docs/plan-fleet25.md`, "The rubric for S7").
- **#990** (in flight) depends on this result. This fleet plans no #990 repair.

**Shape:**
- **Before the merges:** one code PR (the tooling, with tests) and one docs PR, local checks, one stop.
- **After the PM's merge order:** the study on production, read-only, with a finding committed to the docs PR's successor. **A second stop** comes before any correction: corrections run only on the PM's order, from the list this study writes.

**Base:** main `3f41e22da49fcfc8df1f614d54632b6217fc9c84`.

**Order:**
- after Fleets 51 (#1089) and 53 (#617) are merged, so the local ranking uses their record rules. If either is not merged when you reach section 5, run with main as it is, and name the rules' commit in the finding.
- Files: `scripts/numbers/` and new tests only. No other fleet touches them.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**Stops: two.** One before the merges (section 4); one after the study, before any correction (section 5, step 8). The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

## 1. The tooling (one code PR, branch `fix55/numbers-photo-study`, #694)

The planner gives exact specifications; you write the code. Every output file is private: mode 0600, in a mode-0700 directory outside the repository, named `<private>` below.

1. **`scripts/numbers/26-owner-study.sql`:** read-only, one SELECT, `-v uid=<account>`. It returns one JSON line per current food of the account's ready, undeleted meals, with these fields:
   - `meal` and `item` (8-character prefixes), `name`, `grams`, `kcal`, `kcal_per_100g`;
   - `record`, `category`, and `how`, computed exactly as in `23-records.sql:39-41`;
   - `description`: the closest-record basis as in 23. Otherwise the record's cached detail, read **by primary key only**: `select … from public.fdc_cache c where c.query = 'fdc-detail:' || f.source_ref`. There is no scan of the search cache, which is why this is not file 23.
   - `not_eaten_g`, `not_eaten_kcal`;
   - `photos`: the meal's photos in order, as `[{path, not_eaten}]`, from `post_media` with `kind = 'photo'`.

   It reads no caption and no comment. **Fact to confirm on the stack:** that the cached detail's key is `fdc-detail:<id>` (`23-records.sql:28` uses `like 'fdc-detail:%'`). If it is not, use the real key, still by primary key only.
2. **`scripts/numbers/mismatch.mjs`:** add `--rows=<file>`. It reads the JSON lines from a file instead of running file 23 against a database. Without `--rows` its behaviour is unchanged. A row with no description stays in `skipped`, as now. Do not fetch descriptions from USDA (the record check needs only the stored description).
3. **New `scripts/numbers/sample.mjs`:** pure, local, deterministic. From the 26 file and `mismatch.mjs --out` output it chooses **at most 30 meals**. There is no small-population exception (ruled 20:08Z, the builder's rows `qitem-20261118195539-58f1a9060c81cc78` and `qitem-20261118200526-bb11f3b0a1705492`). The groups are filled in this order:
   - **(a) leftovers meals** (#285): every meal with a leftovers photo or a stored `not_eaten_g`, at most **22**, the first 22 by `md5(prefix)`. The rest go into `sample.json` under `omitted_leftovers`, by prefix.
   - **(c) controls:** at most **8** meals that are neither leftovers nor flagged by `mismatch.mjs`, the first 8 by `md5(prefix)`. If fewer than 8 such meals exist, all of them are taken, and `sample.json` records `controls_available` with that number. Controls come before (b) so they are never crowded out: they measure how many unflagged meals are wrong, which is the study's headline.
   - **(b) flagged meals,** not leftovers, in `mismatch.mjs`'s rank order, up to `30 − |a| − |c|`.
   - Every meal not chosen is simply not in the sample. `sample.json` holds the population counts (leftovers, flagged, unflagged), so the finding can state them.

   The finding's §1 states the group sizes, any omitted leftovers and any shortfall of controls, so nothing is left out silently. The Nov 16 study found 11 leftovers meals in 151, so the caps are not expected to bind.

   `sample.json` lists each meal's prefix, group, foods and photo paths. A meal with no photo is listed with `photos: []`, and its verdicts are "cannot tell".
4. **New `scripts/numbers/photos.mjs`:** fetches the sample's photos **one at a time**.
   - For each path, in order: one service-role `createSignedUrl(path, 60)` on bucket `media` (the route `src/lib/media/media-url.ts` uses), then one GET, saved as `<private>/photos/<prefix>/photo-<n>.<ext>`, using `photoExtension` from `study.mjs`.
   - **No retry and no parallel request.** A failed sign or GET is written to `<private>/photos/ledger.json` with its HTTP status, and the meal's verdicts become "cannot tell".
   - It refuses a sample of more than 30 meals, and any path not under `<account>/<meal>/` for a sampled meal.
   - It prints counts only, never a path.
5. **New `scripts/numbers/read-photos.mjs`:** for each sampled meal in order, **one** reading call to AGY (the team's Gemini reader through its existing delivery, `skills/agy-review/`), or, if AGY is unavailable, one call to the app's own identify model through `src/lib/meta`. **Name the reader in the finding.**
   - **The call carries:** the meal's photos, its foods (name, grams, kcal, record description), its leftovers fields, and Fleet 25's rubric verbatim (four questions, plus the fifth for a leftovers meal).
   - **The answer:** JSON, `{"food": v, "record": v, "weight": v, "value": v, "not_eaten": v|null, "notes": "…"}`, where each v is `right`, `wrong` or `cannot tell`. For each `wrong`, the food it concerns and, for a weight, the grams the photo shows.
   - One call per meal, sequential, at most 30 calls. A malformed answer is recorded as "cannot tell" for that meal, with no second call.
6. **New `scripts/numbers/causes.mjs`:** pure, local. From the verdicts it writes S8: for each cause (food identified, record matched, weight estimated, stored value, the not-eaten step), the meals it explains in groups a, b and c. Its headline is **the share of control meals (group c) with any `wrong`**: the best estimate of how many unflagged meals are wrong too.
7. **The correction list** (`causes.mjs --corrections`): for each `wrong` verdict with a clear fix, one line naming the meal and food, and the existing script that would correct it:
   - `24-recheck.sql` for a record;
   - `21-portion.sql` for a weight;
   - `13-restore.sql` for a meal put back.

   It writes the list only. Nothing runs it.

**Tests** (new `tests/numbers-photo-study.test.mjs`):
- `sample.mjs`'s choice on fixtures:
  - 151 meals, 11 leftovers and 60 flagged: 11 + 8 + 11 = 30;
  - 23 leftovers among 151: 22 (`md5` order) + 8 + 0, with 1 listed in `omitted_leftovers`;
  - 40 leftovers among 151: 22 + 8 + 0, with 18 omitted and listed;
  - 20 unflagged meals and nothing else: 8 controls, and the other 12 are not sampled;
  - 26 leftovers and nothing else: 22, with 4 omitted, and `controls_available: 0`;
  - 5 leftovers, 2 unflagged and 3 flagged: 5 + 2 + 3, with `controls_available: 2`;
  - a meal without photos.
- `photos.mjs`:
  - it refuses 31 meals and a foreign path;
  - with a fake client: exactly one sign and one GET per path, in order, none in parallel (a counter of requests in flight never exceeds 1), and a failure recorded with no retry;
- `read-photos.mjs` with a fake reader: one call per meal, and a malformed answer becomes "cannot tell" with no second call;
- `causes.mjs` on fixed verdicts;
- `mismatch.mjs --rows` gives the same ranking as its database path on the same rows.

## 2. Facts the planner checked

- The Nov 16 study ran S1–S6 and S9; S7 and S8 were skipped (finding §6–7). It found 151 ready meals and 347 current foods; 72 meals hit a screening rule; 46 leftovers rows on 11 meals.
- **`23-records.sql` is too wide for rule 4.** It reads every account and every saved meal, and scans every search-cache row (`:22-31`). So Part 1 uses the new narrow file.
- `fdc_cache.query` is the table's primary key (`0002_fdc_cache.sql:5`).
- `mismatch.mjs` checks each record with `checkRecord` from `src/lib/fdc/record-kind.ts` (`:17,23`), the matcher's own rules.
- `study.mjs` already has `photoExtension` (`:33`).

**Not done by the planner:** no file of section 1 is written, so there is no patch and no hash for them. You write them in the code PR. The planner ran nothing against any database.

## 3. How the tooling is checked (local)

1. **Worktree** `/tmp/mfa-f55` from `origin/main`, with `npm ci`. Branch `fix55/numbers-photo-study`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=63660 TEST_PG_PORT=57949 TEST_STACK_DIR=/tmp/mfa-f55s TEST_ENV_FILE=.env.test.fleet55`.
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on the new and changed files;
   - the new tests;
   - both suites once, compared with main.
4. **L1, the whole pipeline on the stack, as test user 1:**
   - **Seed:** three photo meals, one with a leftovers photo.
   - **Run** in this order: `26-owner-study.sql` (in a read-only session, `PGOPTIONS='-c default_transaction_read_only=on'`), `mismatch.mjs --rows`, `sample.mjs`, `photos.mjs` (against the stack's storage gateway), `read-photos.mjs` (with the model fixture, or one real reader call per meal under the standing authorization), and `causes.mjs`.
   - **Met when:**
     - each step's output exists, with mode 0600;
     - the request ledger shows one sign and one GET per photo, sequential;
     - the read-only session refused nothing (the file only reads);
     - the confirmed `fdc-detail` key gives descriptions.
   - Remove the seed after.
5. **Review:** one PPLX review on the final head (AGY if PPLX is unavailable).
6. **Docs PR:** branch `docs/fleet55`, with this plan unchanged as `docs/plan-fleet55.md`.

## 4. The first stop

Stop when the code PR and the docs PR are open, the code PR is reviewed or reported "written, not reviewed", and L1 is reported. Report to the PM in one message:
- the PR's number, branch, final head (40 characters), checks and review;
- the suites' counts against main;
- L1, with the ledger counts;
- the confirmed `fdc-detail` key;
- anything void;
- the merge order: **the code PR, then the docs PR**.

Then wait for the PM's merge order, which names each PR and its full head SHA.

## 5. After the PM's merge order: the study on production, once

Rule 4: each step once, no repeat, sequential.

1. **The account without printing it:** `ACCOUNT=$(PGOPTIONS='-c default_transaction_read_only=on' psql "$SUPABASE_DB_URL" -X -Atc "select user_id from public.posts where left(id::text,8)='4dfe4411'")`. Never echo it. (This is the same single-row lookup as Fleet 25; it is the only other read.)
2. **Part 1, the one SELECT:** `PGOPTIONS='-c default_transaction_read_only=on' psql "$SUPABASE_DB_URL" -X -At -v ON_ERROR_STOP=1 -v uid="$ACCOUNT" -c "set statement_timeout='30s'" -f scripts/numbers/26-owner-study.sql -o <private>/owner-study.jsonl`. Record its line count and its time.
3. **Local:** `mismatch.mjs --rows=<private>/owner-study.jsonl --out=<private>/mismatch`, then `sample.mjs`. Record the sample's counts per group, and the leftovers meals found against the Nov 16 count of 11.
4. **Part 2, the photos:** `photos.mjs`, one at a time. Record the signs, GETs and failures. This is the only storage traffic; at most 30 meals, about 2 photos each.
5. **The readings:** `read-photos.mjs`, one call per meal, at most 30. Record the reader, the calls and their token cost.
6. **S8 and the correction list:** `causes.mjs` and `causes.mjs --corrections`.
7. **The finding:** `docs/findings/nutrition-numbers-study-part2-<date>.md`, on branch `docs/fleet55-finding` (a docs PR), in this shape:
   - **§1 The sample:** groups and counts.
   - **§2 The verdicts:** one row per meal, with prefixes, verdicts and short notes, and no photo.
   - **§3 The causes, ranked:** S8.
   - **§4 #285:** for each leftovers meal, the not-eaten verdict, with the stored share against the photo's share.
   - **§5 How many meals are wrong:** the control share, with its count (n of 8 or fewer), and what it means for the 151 meals. Five sentences at most, stated as an estimate from a small sample.
   - **§6 The correction list:** meal, food, cause and script.
   - **§7 What was not judged,** and why.

   It holds no caption, no account id and no photo.
8. **Delete** `<private>/photos/` after the finding is written. Keep the JSON outputs private for the PM.
9. **Stop (the second stop).** Report to the PM in one message:
   - the reads made (1 lookup, 1 SELECT), the photo requests, and the reader calls and cost;
   - the finding's PR number and head;
   - the control share;
   - the correction list's length;
   - that the photos are deleted.

   **Corrections** run only on the PM's order, one meal at a time, through `reanalyse.mjs` with its snapshot (`08-snapshot.sql`) first, under the restore rule. That order is a later dispatch, not this fleet.
