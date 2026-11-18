# Fleet 56 — #694 with #285: the photo reader compares like with like, "cannot tell" is a full answer, and the owner's numbers get local consistency checks (2026-11-18)

You are the coder. You have the filesystem, GitHub, local-stack and private study-directory access this plan needs. **The only production contact is section 5, after the PM's merge order.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 21:33Z, after Fleet 55's second stop (builder row `qitem-20261118213246-e171d73a`, finding PR #1167):
- **(a)** fix the reader's inputs for leftovers meals, and make "cannot tell" an explicit outcome that never becomes a flag;
- **(b)** re-read only the 12 leftovers meals and the 2 flagged controls, as one bounded study;
- **(c)** state what a photo can and cannot establish;
- **(d)** a local-only consistency analysis of the owner rows already on disk.

**Shape:**
- one code PR and one docs PR;
- **two stops:** before the merges (section 4), and after the re-read, before any correction (section 6);
- **base:** main `bdd5b7eaef8664bcb746572e1a6c62aaff780daf` (Fleet 55 merged);
- **files:**
  - `scripts/numbers/read-photos.mjs`;
  - `scripts/numbers/sample.mjs`;
  - new `scripts/numbers/consistency.mjs`;
  - `tests/numbers-photo-study.test.mjs`;
  - new `tests/numbers-consistency.test.mjs`.
- **There is no patch;** write the code to this spec.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**The only other halts are:**
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer;
- a threshold in section 5.

## 1. What a photo can and cannot establish

This is the scope the owner is promised. The finding states it in these words.

**A photo can establish:**
- which foods are on the plate, and whether a large one is missing from the record;
- whether a food is cooked or raw, and roughly how it was prepared, when that shows;
- **a rough share left:** comparing the meal photo with the leftovers photo of the same plate, about how much of each food is still there;
- the kind of a visible drink (beer, cola, coffee);
- a brand, only from a legible label on the food's own pack or can.

**A photo cannot establish:**
- **grams.** At best, with a plate, hand, cutlery or a pack of known size in the picture, it can show that a weight is off by more than half or double. Without such a reference it shows nothing about weight;
- **calories, or any nutrient;**
- hidden ingredients, oil, butter, sugar or the recipe;
- what was poured into a glass. A logo on a glass, cup or plate names the glassware, not the drink;
- whether a USDA record is the right one, beyond its name matching the food.

**So the study is not a weight audit and cannot become one.** It checks identity, preparation, the share left, and calories per 100 g against the usual value for the food. A number the photo cannot check is reported as "cannot tell", never as right.

## 2. What is wrong in the reader (Fleet 55 finding)

**The leftovers inputs are ambiguous.**
- Stored `grams` and `kcal` on a leftovers food are the **eaten** amounts. `src/lib/pipeline/leftovers.ts:16` stores `portion_grams = served − not_eaten_grams`.
- The reader's context (`contextFor`, `read-photos.mjs`) passes them as `grams` and `kcal`, next to `not_eaten_g`, with no served total.
- So the model takes eaten grams for served grams. On bc01cbd2: 70 g eaten, 80 g left, stored share left 80 / 150 = 0.533, and the reader's own photo estimate is about 0.5. But the reader divides 80 by 70 and flags a share above 1.

**Other faults:**
- **The model does the share arithmetic and gives the verdict itself.** The rubric asks it to judge "differs from the stored share by more than 0.25" without being given that share.
- **Weight is judged with no size reference.** Five of the twelve leftovers meals were flagged on weight; nothing in the rubric requires a reference.
- **A brand was flagged from a glass logo** (bb031868).
- **The value question depends on the weight question** ("when the food and the grams are right"), so it inherits the weight's guess.

**What already holds:** `correctionFor` (`correction-evidence.mjs`) gives a recommendation only when the cause's verdict is `wrong`, so a "cannot tell" never becomes a correction. Keep that, and add a test for it (section 3).

## 3. The change (code PR, branch `fix56/reader-like-for-like`)

### 3.1 Reader inputs (`contextFor` in `read-photos.mjs`)

**Every food** gets:
- `eaten_g` and `eaten_kcal`, the stored `grams` and `kcal`;
- `served_g` and `served_kcal`;
- `kcal_per_100g`.

**For a food without leftovers**, served equals eaten.

**For a food with `not_eaten_g`**, it also gets:
- `not_eaten_g` and `not_eaten_kcal`;
- `served_g = eaten_g + not_eaten_g`;
- `served_kcal = eaten_kcal + not_eaten_kcal` (null if either is null);
- `stored_share_left = not_eaten_g / served_g`, rounded to 3 places.

**The bare `grams` and `kcal` keys are removed** from the reader's context (rule 5, no second name for the same number). Evidence rows are unchanged; they cite the stored fields for corrections.

### 3.2 The rubric

`RUBRIC` becomes the text below, verbatim. The test reads it from `docs/plan-fleet56.md` from the quoted line that starts "For each meal, answer" up to, not including, the blank quoted line before "End of rubric.", with each line's leading `> ` removed The Fleet 25 rubric is removed from the code and from the test.

> For each meal, answer each question `right`, `wrong` or `cannot tell`. `cannot tell` is a full answer, not a failure: give it whenever the photos do not show what the question asks.
> 1. **The foods.** Wrong when a stored food is in no photo, or a food that fills more than a quarter of the plate is not stored. A brand or variety counts only when a label on the food's own pack or can is legible. A logo on a glass, cup or plate does not say what is in it, so the brand is cannot tell.
> 2. **The record.** Wrong when the record's description is a different food than the name, or a raw food for a cooked one, or a dry weight for a prepared one. Cannot tell when no description is supplied.
> 3. **The served weight.** Judge `served_g`, the amount on the plate in the first photo, never `eaten_g`. First name the size reference in the photo in `weight_reference`: a plate or bowl, a hand, cutlery, or a pack with its size printed. With no reference, the answer is cannot tell. With one, wrong only when `served_g` is less than half or more than double what the photo shows.
> 4. **The calories per 100 g.** Wrong when `kcal_per_100g` is outside half to double the usual value for that food as it is shown (cooked or raw, with or without sauce). This does not depend on the weight.
> 5. **For a leftovers meal, the share left.** For each food with `not_eaten_g`, estimate from the photos the share of the served food still on the plate in the leftovers photo, as a number from 0 to 1. Give null when the two photos cannot be compared: a different angle, the food hidden, or no leftovers photo. Do not judge it right or wrong; the study compares your number with `stored_share_left`.
>
> End of rubric.

### 3.3 Schema and parsing

**The model returns:**
- `food`, `record`, `weight` and `value`, each right, wrong or cannot tell, as now;
- **new** `weight_reference`, one of `plate or bowl`, `hand`, `cutlery`, `pack size` or `none`;
- **new** `shares`, an array of `{item_id, photo_share_left}`. `photo_share_left` is `anyOf` number in 0–1 or null; no null enum member, which Gemini rejects;
- `notes` and `findings`, as now.
- **The model no longer returns `not_eaten`.**

**The code then computes:**
- **`not_eaten`** for a leftovers meal, per food with `not_eaten_g`:
  - `wrong` when |photo − stored| > 0.25;
  - `cannot tell` when its share is null or missing;
  - `right` otherwise.

  The meal is wrong if any of its foods is wrong, else cannot tell if any is cannot tell, else right. An ordinary meal gets null. Each food's comparison is stored in `verdict.share_checks`: `{item_id, stored, photo, outcome}`.
- **Weight:** when `weight_reference` is `none` and `weight` is not cannot tell, the code sets `weight` to `cannot tell` and records `weight_reset: "no size reference"`. That is the stated rule, and the model's original answer stays in `raw_answer`.

**A malformed answer stays as now:** every verdict is cannot tell, with `reader_error`, and there is no second call.

**Corrections** (`correctionFor`, unchanged rule, new guards):
- a `set_weight` finding needs `weight_reference` other than `none`;
- a `set_weight` finding on a food with `not_eaten_g` is withheld with reason "served weight on a leftovers food". The stored field is the eaten weight; this study does not define that correction.

### 3.4 Reporting "cannot tell" as an outcome (`causes.mjs`)

**Add `outcomes`:** for each question and each group (a, b, c), the count of right, wrong and cannot tell.

**Keep the existing control headline.** Its `wrong` counts only `wrong`. A "cannot tell" is never counted as a flag, a cause or a correction.

### 3.5 The re-read sample (`sample.mjs`)

**New `subsetSample(sample, prefixes)`, with CLI `--from-sample=<sample.json> --meals=<file of prefixes> --out=<dir>`:**
- keeps the named meals' entries exactly as they are in the parent sample;
- refuses an unknown or duplicated prefix, and more than 30 meals;
- records the parent sample's sha256.
- **It reads no database.**

### 3.6 Consistency analysis (new `consistency.mjs`, part d)

**CLI `--rows=<owner-study.out> --out=<private dir>`**, reading the on-disk rows only. **It opens no database or network connection.** It writes a private `consistency.json`, which lists each question with its meal and item prefixes, the food and the numbers, plus a counts-only summary.

**Every check is a question for the owner, never a correction:**
1. **Impossible density:** `kcal_per_100g` above 902 (pure fat is about 900) or below 0.
2. **Zero calories on a food with grams,** unless the name is a zero-calorie drink: water, sparkling water, black coffee, plain tea, or diet/zero soda. The word list lives in the script and is tested.
3. **Missing numbers:** grams null, kcal null, or a leftovers food with `not_eaten_g` but no `not_eaten_kcal`.
4. **One record, two densities:** the same `record` with `kcal_per_100g` more than 0.5 apart on matched foods.
5. **One food, very different densities:** the same normalised name (lower case, letters and spaces) in two or more meals, with `kcal_per_100g` more than 2× apart.
6. **One food, several records:** the same normalised name stored with more than one record. This is reported as information, since different records can be correct.
7. **Possible duplicate:** the same normalised name twice among one meal's current foods.
8. **Leftovers density:** `not_eaten_kcal / not_eaten_g` differing from `kcal / grams` by more than 1 kcal per 100 g.
9. **Portion outside range:**
   - grams under 3 or over 1000;
   - or a portion more than 3× above, or below ⅓ of, the same name's median across the owner's other meals (names seen in at least 3 meals).

**What the planner counted on disk** (Fleet 55's private `owner-study.out`, 400 foods, 178 meals; counts only):

| Check | Count |
|---|---|
| 1 | 0 |
| 2 (zero calories with grams, before the drink exemption) | 8 |
| 3 | 6 null grams, 1 null kcal, 1 leftovers food without not-eaten kcal |
| 4 | 0 of 62 records used more than once |
| 5 | 2 |
| 6 | 15 |
| 7 | 2 |
| 8 | 0 of 47 leftovers foods |
| 9 (fixed bounds) | 0 |

**What the on-disk rows cannot check, stated plainly in the finding:**
- **Calories against protein, carbohydrate and fat:** SELECT 26 exported no macros.
- **A stored density against the record's own value:** SELECT 26 exported no record nutrient values, and only 31 of 400 descriptions.
- **The same food on different days:** SELECT 26 exported no dates, so check 5 compares meals, not days.

Each of these needs data not on disk (section 7). This fleet does not get it.

### 3.7 Tests

**`tests/numbers-photo-study.test.mjs`:**
- **The rubric** equals the text in `docs/plan-fleet56.md`, replacing the Fleet 25 assertion.
- **`contextFor` of a leftovers food:** 70 g eaten and 80 g left gives `served_g` 150 and `stored_share_left` 0.533, and has no bare `grams` key. An ordinary food has served equal to eaten.
- **The bc01cbd2 shape:**
  - a photo share of 0.5 against a stored 0.533 is right;
  - 0.9 is wrong;
  - null is cannot tell;
  - mixed foods follow the meal rule.
- **`weight_reference: none`** with `weight: wrong` becomes cannot tell, with `weight_reset` set, and its `set_weight` finding is withheld.
- **A `set_weight`** finding on a leftovers food is withheld.
- **A finding on a cause whose verdict is cannot tell** is withheld. That locks the existing rule.
- **`outcomes`:**
  - counts cannot tell separately;
  - the control headline counts only wrong.
- **`subsetSample`:**
  - keeps the entries byte for byte;
  - refuses an unknown prefix, a duplicate, and 31 meals.
- The existing tests are updated where the schema changed. No other test is removed.

**New `tests/numbers-consistency.test.mjs`:**
- one fixture row per check, each producing its question;
- clean rows produce none;
- the drink exemption;
- the script, run with `SUPABASE_DB_URL` unset and a `psql` that exits 99 on the path, succeeds, which shows it reads no database.

## 4. Local checks, part (d) on disk, and the first stop

1. **Worktree** `/tmp/mfa-f56` from `origin/main`, with `npm ci`. Branch `fix56/reader-like-for-like`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=63660 TEST_PG_PORT=57949 TEST_STACK_DIR=/tmp/mfa-f56s TEST_ENV_FILE=.env.test.fleet56`.
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on the changed files;
   - the two test files;
   - `tests/numbers-study.test.mjs`, and `tests/db/numbers-photo-study.test.mjs` on the stack;
   - both suites once, with the built app started (10 minutes each), compared with main's counts.
4. **L1, the reader offline:** run `readMeals` with a scripted reader over Fleet 55's private `sample.json`, filtered to the 14 meals, with the answers each meal's Fleet 55 raw answer implies. Report:
   - each leftovers food's `served_g` and `stored_share_left`;
   - for bc01cbd2, the computed `not_eaten`.

   **No model call.**
5. **L2, part (d), local only:** run `consistency.mjs` on `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/fleet55/production/private/owner-study.out`. Write the result to a new private directory `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/fleet56/consistency/` (700, files 600). **No production read.** Report counts per check, and the private file path.
6. **Review:** one PPLX review on the final head (AGY if PPLX is unavailable). **AGY rules on the rubric's words in any case.**
7. **Docs PR:** branch `docs/fleet56`, with this plan unchanged as `docs/plan-fleet56.md`. It merges first, because the code test reads the rubric from it.
8. **Stop 1.** Report to the PM in one message:
   - the PR's number, branch, final head (40 characters), checks, review, and AGY's ruling on the rubric;
   - the suites' counts against main;
   - L1 and L2;
   - anything void;
   - **the merge order: the docs PR, then the code PR.**

## 5. Production: the one bounded re-read (after the PM's merge order only)

**From merged main, with the Fleet 55 rules unchanged:**
- one operator;
- one guarded step at a time;
- private directories 700, files 600;
- nothing written to production.

1. **Sample, from disk.** `sample.mjs --from-sample=<Fleet 55 private sample.json> --meals=<14 prefixes>`, run into `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/fleet56/production/private/`. The 14 meals are the 12 group-a meals and the controls 47913b69 and bb031868: 52 foods, 47 with leftovers, 26 photos.
   - **No SELECT.** The foods are as stored at Fleet 55's read (21:22Z). An edit by the owner since then is not seen; the finding says so.
2. **Photos:** `photos.mjs`, with the account from Fleet 55's private `account.out`.
   - one signed URL and one GET per photo, sequential, no retry: **26 and 26**;
   - a failed photo is recorded and its meal is read as cannot tell.
3. **Reader:** `read-photos.mjs --reader=app --reader-reason="AGY 0 of 2 local calls succeeded in Fleet 55; the app's own model reads photos reliably"`.
   - **14 calls, one per meal,** sequential, 60 s timeout, retries 0;
   - stop at 3 consecutive failures;
   - stop at 60 minutes.
4. **`causes.mjs`,** then **`causes.mjs --corrections`:** the correction list is **written, never run.**
5. **The comparison:** for each of the 14 meals, its Fleet 55 verdict next to its Fleet 56 verdict, per question. **A flag survives** when the Fleet 56 verdict is still `wrong`. For a leftovers food, also list its stored share, its photo share and the outcome.
6. **Delete the photos** after the finding is written, and read back that none remain.
7. **Finding:**
   - add a section to `docs/findings/nutrition-numbers-study-part2-2026-11-18.md` on #1167's branch, or a new file `docs/findings/nutrition-numbers-study-part3-2026-11-18.md` on a new docs branch if #1167 has merged;
   - it holds counts and prefixes only: no full ids, captions, URLs or images;
   - it opens with section 1's can-and-cannot list, and includes L2's counts and section 3.6's "cannot check" list.

## 6. Stop 2

Report to the PM in one message:
- the photo and reader counts, durations and tokens;
- **the outcomes** per question and group, with right, wrong and cannot tell kept separate;
- **every surviving flag,** with its food and reason;
- the share comparisons for the 12 leftovers meals;
- the correction list's count, **written and never run**;
- L2's consistency counts;
- the finding PR and head.

**Nothing is corrected, re-analysed or closed.** #694 and #990 stay open.

## 7. Rulings for the PM (not in this fleet)

The PM rules on each before any later fleet uses it.
- **Record densities.** USDA FoodData Central's public API can return each record's energy per 100 g by record id: 241 distinct matched ids, sequential, cached. That sends USDA no owner data, only public record numbers, but it is an outside service. With it, every stored density can be checked against its record.
- **Macros and dates.** Checking calories against protein, carbohydrate and fat, and comparing the same food across days, needs those columns. That is a new owner SELECT: a production read, which the PM left out of this part.
