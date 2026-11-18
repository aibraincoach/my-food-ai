# Fleet 37 — #990's systematic causes: a detector for records of another kind of food, a matcher that refuses them, and a bounded correction (2026-11-18)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's packet of 2026-11-18 03:41Z (`qitem-20261118034123-5ceeb52e2438a6c8`), the PM's #990 ruling in it, and Fleet 34's report (`state/build/fleet34-postmerge/report.md`).
- **Shape:** two code PRs and one docs PR, three local checks, one read-only production read before the stop, one stop before the merges, and one production section after the PM's merge order.
- **Base:** main `6d6dd27728d7e5cfc752a7259400a342b12a0682`.
- **Other fleets:** Fleets 35 and 35b touch none of these files.
- **Issue numbers:** `#A` and `#B` below are the numbers the PM gives these two titles. Replace both before dispatch:
  - **#A** "A stored food is matched to a record of another kind of food".
  - **#B** "The matcher has no check that its chosen record is the same kind of food".

**The PM's ruling, which this plan follows.** #990 no longer chases agreement with the blind estimate. It closes when (a) every disagreeing, incomplete or restored meal is resolved or listed with its reason (done in Fleet 34's report), and (b) the systematic causes the study exposed are filed and fixed or planned. This plan is (b).

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix.

**Stops: one**, before the merges (section 7). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void; the rest continues), and an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes. Section 9's recheck uses the existing tool's caps (`--max-meals=10`, `--max-minutes=45`).

## 1. The systematic cause, and what each part of this plan does

**What the study exposed.** Fleet 34 found three records that are **another kind of food** than the food they stand for:
- **Curry sauce:** d4971e89's Japanese curry sauce (300 g, 822 kcal) stored as "Persimmons, japanese, dried" (169942).
- **Salad:** ccf70daa's mixed green salad stored as green-goddess dressing (50 g, 213.5 kcal).
- **Lamb curry:** 38de279e's lamb curry with rice stored as raw ground lamb.

The other disagreements are close foods judged wrong for their recipe or portion: the bao bun for a soup dumpling, hard lemonade for a radler, the filled chicken, and papaya's weight. They are model judgment, not a systematic fault, and the ruling stops chasing them.

**Why the matcher can choose such a record** (`src/lib/fdc/match.ts`, `approximate.ts`). Every safeguard before the model's choice is a filter on the candidate list. The filters drop records without a gram basis or nutrition, implausible zero energy, an excluded component and a conflicting protein (`referenceProteinMismatch`). **None asks whether the record is the same kind of food.** The model is told to reject a different category (`MATCH_INSTRUCTIONS`), but nothing checks its answer.

The closest-food step is told to "Return id null only when every candidate is a different kind of food" (`CLOSEST_INSTRUCTIONS`). That is a push to pick something. For "japanese curry" USDA's search returned only "Cookie, tea, Japanese" and "Persimmons, japanese, dried" (Fleet 34's ledger, `candidate-E-1/candidates.json`): every result shared only the word "japanese".

**The fix belongs before the choice**, as one more deterministic filter next to `referenceProteinMismatch`. A record that is plainly another kind of food then never reaches the model. When nothing compatible is left, the existing chain takes over: closest record, then rice-and-protein, then the model's estimate. That gives the estimate the PM wants for #987, not an absurd record.

| Part | Item | What it does |
|---|---|---|
| **PR 1** `fix37/record-kind` | #B | **The rule:** `src/lib/fdc/record-kind.ts`, the one reader of "is this record the same kind of food".<br>**Strong signals:**<br>• *kind:* the record is a fruit, sweet, drink, condiment or fat, and the name has no word of that kind but has words of another kind.<br>• *kind:* the name is only a fruit or a drink, and the record is another kind.<br>• *raw:* the record is raw and the name is a cooked food or dish.<br>**Weak signals:**<br>• *part:* the name joins foods of different kinds, and the record names only one.<br>• *density:* the calories per 100 g are far outside a fruit's, vegetable's or drink's range.<br>**The matcher:** `matchFood` and `closestGenericFood` drop any candidate with a strong signal. `FOOD_MATCH_VERSION` becomes `fdc-reference-v9` |
| **PR 2** `fix37/mismatch-detector` (stacked on PR 1) | #A | **The detector:**<br>• `scripts/numbers/23-records.sql` (read-only) reads every current food on every account and every saved meal's food.<br>• `scripts/numbers/mismatch.mjs` checks each matched or closest record with PR 1's own rules, and prints a ranked list, counts, and precision and recall on labelled foods.<br>**The correction:**<br>• `reanalyse.mjs run --mode=recheck --foods-file=<flagged.jsonl>` runs `24-recheck.sql`, which looks up again **only** the flagged foods. Every other food keeps its nutrition exactly: its new row supersedes the old one under the same name, so the recompute retains it.<br>• `25-resave.sql` refreshes a kept meal's saved meal.<br>**Tests:** `tests/numbers-mismatch.test.mjs` |
| **R1** (before the stop) | #A | The detector, read-only, on production: the count, the ranked list, and precision on the known cases |
| **Section 9** (after the merge order) | #A | The bounded recheck of the flagged meal foods, the saved-meal refresh, and the detector again |

**The carry and restore rule for a recheck.** The existing rule stays: a meal is put back at once when it fails or asks a question, loses any value, or its calories become unavailable. A recheck changes it in three ways, and only for the flagged foods:
- **Micronutrients:** a flagged food's lost micronutrients belonged to the wrong record. They are ledgered as `values_removed` with the reason "the record was another kind of food (#990)", like decaf's caffeine. Its calories, protein, carbs, fat, fibre, sugar and sodium still restore the meal if lost.
- **The calorie rule:** the "calories moved by more than half" rule (#989) is waived only when every flagged food's new record passes the check or is an estimate. Without this waiver every real correction would be undone: the curry sauce's 822 kcal is the error.
- **The new record:** a flagged food whose new record is still another kind of food puts the meal back.

No carry runs, because the old micronutrients are the wrong ones. Every other food is retained exactly by construction.

## 2. Facts the planner checked, and premises

- **Code read** on `6d6dd277`:
  - **The matcher:** `src/lib/fdc/match.ts` (`matchFood`, `resolveFoodMatchDetailed`), `approximate.ts` and `nutrients.ts` (`energyFits`).
  - **Its helpers:** `protein-reference.ts` and `food-category.ts` (categories are lower-cased).
  - **Reuse:** `src/lib/nutrition/portion.ts` (`resolvePortionNutrition`), where a food whose row supersedes one with the same name keeps its nutrition, rescaled.
  - **The numbers tools:** `scripts/numbers/` 03, 08, 11, 19, 22, `reanalyse.mjs` and the README.
- **Attached**, in `/home/opc/.claude/plans/`. Check each hash; a file that does not match is void, and so is its PR.
  - `fleet37-matcher.patch` (PR 1), sha256 `dd2e0c7a041b94349eb809904331cd45cacc46cbcbc524adfa03c6c41b29b9bf`.
  - `fleet37-detector.patch` (PR 2), sha256 `c565cdeb9bd86e98f52b278d6cd8ab13f5c11c4f52277bf14442c983d3039c6c`.

  Both apply to `6d6dd277` in that order with `git apply`.
- **Verified on the planner's worktree** with both patches:
  - **Checks:** `npx tsc --noEmit` and `npx eslint` on the changed files are clean.
  - **The new test file** passes: 36 known matches, the detector's ranking and scoring, and the recheck's file reading, removal, waiver and restore.
  - **Existing tests:** the 12 test files that cover the matcher passed 48 of 48. The numbers tests passed 28, with 6 skipped because they need the database.
  - **Not run by the planner:** SQL files 23 to 25 have not been run on any database, and the suites have not been run.
- **The 36 known matches** in the test: five absurd (the curry sauce, the salad dressing, the raw lamb, raw chicken for grilled chicken, and a cookie for papaya), two close-but-wrong (bao bun, hard lemonade) and 29 right. The check flags exactly the five absurd ones. That is a fixture, not production precision; R1 measures that.
- **Running .ts from plain node:** `mismatch.mjs` and `reanalyse.mjs` import `src/lib/fdc/record-kind.ts`, which has no imports. Node 22.23 runs it directly (with a module-type warning); `node --import tsx` works too.
- **The version bump:** matches stored under v8 stay as they are. Like every earlier bump, it changes only what a copy reports as its matcher version.

## 3. Item 3 of the packet: what is left for the five meals

| Meal | What it is | What is left |
|---|---|---|
| The salami meal | The study needs the bag's weight, which only the owner knows | **Nothing for a fleet.** The PM asks the owner one plain question: "How many grams does the salami bag say?" If he answers, a later plan sets the weight with `21-portion.sql`. Until then it stays listed with that reason |
| The two 3 g meals | The stored weight is the owner's own figure | **Nothing.** The owner's figure stands; they stay listed with that reason. R1 still checks their records |
| Beef 4f818b6d (estimate incomplete) | USDA's search gave the blind reader no whole-cut cooked beef record (only ground, cured, dried, sausage or other species) | **Nothing for #990's closing rule.** The stored value stands. If R1 flags its stored record, section 9 rechecks it; otherwise it stays listed with that reason |
| Coffee 1c4f16bf (estimate incomplete) | No coffee-with-condensed-milk record was found, only black coffee or condensed milk alone | As for the beef |

## 4. How it runs

1. **Worktrees** under `/tmp/mfa-f37`, from `origin/main`, with `npm ci`.
   - **PR 1:** `git apply /home/opc/.claude/plans/fleet37-matcher.patch`.
   - **PR 2:** branched from PR 1's branch, then `git apply /home/opc/.claude/plans/fleet37-detector.patch`. Open it against PR 1's branch and retarget it to main after PR 1 merges.
2. **Your own stack.** `TEST_PORT_BASE=61560 TEST_PG_PORT=55849 TEST_STACK_DIR=/tmp/mfa-f37/stack TEST_ENV_FILE=.env.test.fleet37`.
3. **Per PR:** `npx tsc --noEmit` and `npx eslint` on the changed files.
4. **Suites.** Both suites once, on PR 2's branch with the built app started (10 minutes each).
5. **Reviews.** One PPLX review per code PR on its final head, and AGY when PPLX is unavailable. AGY in any case for PR 1's word lists: it rules on any word it would add or remove, and the test's 36 cases must still pass.
6. **Local checks** L1 to L3 (section 6), each at most 10 minutes.
7. **R1** (section 8), read-only on production.
8. **Docs PR.** Branch `docs/fleet37`, with this plan unchanged as `docs/plan-fleet37.md`.
9. **Stop** (section 7).

## 5. The code PRs

### PR 1 — branch `fix37/record-kind` — #B

`fleet37-matcher.patch` adds `src/lib/fdc/record-kind.ts` and makes three one-line changes:
- **`match.ts`:** imports `recordContradicts` and adds `&&!recordContradicts(name,food)` to the eligibility filter in `matchFood`.
- **`approximate.ts`:** adds `&& !recordContradicts(name, f)` to `closestGenericFood`'s filter.
- **`version.ts`:** `fdc-reference-v8` becomes `fdc-reference-v9`.

`composeRiceWithProtein` is unchanged. The PR's test is PR 2's `tests/numbers-mismatch.test.mjs`: its first test is the check itself. Move that first test into PR 1 as `tests/record-kind.test.mjs` if the review asks for it.

### PR 2 — branch `fix37/mismatch-detector` — #A

`fleet37-detector.patch` changes these files:
- **New:** `scripts/numbers/23-records.sql`, `24-recheck.sql`, `25-resave.sql`, `mismatch.mjs` and `tests/numbers-mismatch.test.mjs`.
- **`reanalyse.mjs`:**
  - **The mode:** `--mode=recheck` with `--foods-file`, where `parseFoodsFile` takes only meal foods with a strong signal.
  - **The recheck:** it never carries; `recheckOutcome` computes the removals, the waiver and what is still wrong.
  - **The restore rule:** `restoreReason` gains the "still another kind of food" reason and the waiver.
- **`scripts/numbers/README.md`:** two paragraphs.

## 6. The local checks

- **L1, the detector's SQL.** On the stack, make three ready meals with the service key, and say so:
  - **The absurd match:** "Japanese curry sauce" on record 169942, category `fruits and fruit juices`, 300 g.
  - **A right match:** "Papaya" on a papaya record.
  - **A saved meal:** one with "Mixed green salad" on a green-goddess record.

  Put those records' descriptions in `fdc_cache` as a detail entry. Run `node scripts/numbers/mismatch.mjs --out=<private dir>`. Met when the curry sauce and the saved salad are flagged with a strong signal and the papaya is not.
- **L2, the recheck end to end.** Run `reanalyse.mjs run --mode=recheck --foods-file=<L1's flagged.jsonl> --ledger=<private dir>` once against the local app, with the local fake model and FDC fixture.
  - **Met** when the curry sauce gets a record that passes the check, or an estimate. Its micronutrients are ledgered as `values_removed`, the other foods' nutrition rows are byte-identical to before, and the meal is kept even if its calories move by more than half.
  - **The restore path:** run it once more with the fixture returning only the persimmons record. That proves the "still another kind" restore puts the meal back. If the fixture cannot be steered, report the restore path as "not exercised locally".
- **L3, the saved-meal refresh.** After L2's kept meal, give it a saved meal (`save_meal_from_post` as its owner), run `25-resave.sql` with `-v post=<id>`, and read the saved row. Met when its items equal the meal's current foods. Then put the old items back from the snapshot's `saved_meals` entry and read them back.

## 7. The stop

Stop when both code PRs and the docs PR are open, each code PR is reviewed or reported "written, not reviewed", L1 to L3 are reported, and R1 is reported. Report to the PM in one message:
- each PR's number, branch, final head (40 characters), checks and results, and review;
- the two suites' counts;
- L1 to L3;
- R1's summary: foods checked, how many flagged (strong and weak), meals and saved meals affected, the top 20 ranked rows, precision and recall on the labels, and the blind precision;
- anything void under section 2;
- the merge order: **PR 1, then PR 2 (retargeted to main), then the docs PR**.

Then wait for the PM's merge order, which names each PR and its full head SHA.

## 8. R1: the detector on production, read-only, before the stop

1. **Run** `SUPABASE_DB_URL=<production> node scripts/numbers/mismatch.mjs --labels=<private labels.json> --out=<private dir>` from PR 2's worktree. It sets `default_transaction_read_only` itself; check its `psql` session refuses a write once, with `select txid_current()` under the same options.
2. **The labels.** Build `labels.json` privately from these reports only:
   - **Absurd:** d4971e89 "Japanese curry sauce", ccf70daa "Mixed green salad", 38de279e's lamb curry food.
   - **Wrong (a close food judged wrong):** 2a45c157's chicken, 43753d2f's dumpling, 231dfd5e's radler.
   - **Right:** every food of the nine D meals that agreed and the two E meals that agreed in Fleet 34. Also every food whose record a Fleet 28–33 post-merge report kept or confirmed after review.
   - **Absurd or wrong, by the section 1 rule** (another kind of food is absurd): every food whose record those reports replaced.

   Use the food names exactly as `22-items.sql` prints them, and report any label that matched no food.
3. **Blind precision.** Give one fresh AGY reader up to 40 flagged foods: all of them if fewer, otherwise the top 20 and 20 chosen at random from the rest (say the seed). Each comes as its name, the record's description and category only, with no meal, no account and no number. The question: "Is this USDA record the same kind of food as the named food? Answer yes, no or unclear, with one short reason." Wait at most 10 minutes.
   - **Precision** = no ÷ (yes + no), reported separately for the top 20 and the random 20.
4. **Report** the summary JSON, the top 20 rows, and the counts by signal.

R1 changes nothing. It runs on main's matcher; PR 1 does not affect what is already stored.

## 9. After the PM's merge order: production

The owner's standing authorization for model calls and re-analysis on production applies.

1. **Wait** for the production deployment of the merge commit to be READY with the alias matched (at most 10 minutes). Read back that the served build's `FOOD_MATCH_VERSION` is `fdc-reference-v9` through a fresh trace row, or say it was read from the deployed source.
2. **Recheck.** Run `reanalyse.mjs run --mode=recheck --foods-file=<R1's flagged.jsonl> --ledger=<private dir> --max-meals=10 --max-minutes=45`.
   - **Order:** strong flags only, in R1's rank order; the tool skips weak-only and saved rows by itself.
   - **The ledger line per meal:** before and after calories, `values_removed`, `recheck_passed`, and any restore reason.
   - **More than 10 meals flagged:** run only the first 10, and report the rest as listed for the next plan.
3. **Saved meals.** For each meal rechecked and kept that has a saved meal, run `25-resave.sql` once with `-v post=<id>`, and read the saved row back.
   - **A flagged saved food whose meal is gone:** no change; list it with that reason.
   - **A flagged saved food whose meal was not rechecked or was put back:** no change; list it.
4. **The detector again.** Run `mismatch.mjs` on production once more. Report the flagged count before and after, and which flags remain and why: weak only, not in the first 10, put back, or a saved meal without its meal.
5. **New matches.** Read-only: since the deployment, count the FDC trace rows whose chosen record has a strong signal under `checkRecord`. Expected: zero.

**What section 9 reports.** One row per rechecked meal (kept, put back with its reason, or skipped) with its calories before and after. Also the saved meals refreshed, the detector's before and after counts, and the new-match count.

## 10. Not in this run, and why

- **Close-but-wrong records and portions:** the bao bun, the hard lemonade, the filled chicken, papaya's weight and the iced tea's weight. Under the PM's ruling these are model judgment, not a systematic cause. They stay listed in Fleet 34's report.
- **The espresso on brewed coffee** (1 kcal per 100 g, 0.3 kcal against 2.7). It is the same kind of food and the check rightly does not flag it. Its caffeine is correct.
- **USDA's search for culinary names** ("japanese curry" returning cookies and persimmons). PR 1 stops such a record being chosen. Better searches are a separate improvement, with no issue number.
- **#222, #987, #1075 and #1082** (the PM's 07:21Z message): planned after this fleet, as the PM asked.
