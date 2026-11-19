# Fleet 60 — #990: six of the owner's foods get the USDA record that is that food, chosen by hand, one meal at a time (2026-11-19)

You are the coder. You have the filesystem, GitHub, local-stack and private study-directory access this plan needs. **The only production contact is section 5, after the PM's merge order.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-19 01:33Z. Fleet 58's signal did not ship: #1179 was closed unmerged under its rule 5.4. The six deferred wrong records are now fixed **by explicit record choice, with no matcher change.**

**These are one-off data fixes.** They do not stop the same wrong match in a future meal: the matcher is unchanged. That stays an open matcher question under #990.

**Shape:**
- one code PR (an operator tool only, no app or matcher change) and one docs PR;
- local proof;
- **two stops:** before the merges (section 4), and after the corrections (section 6);
- **base:** main `c9cacffb2dc4bdeb7dc164e2cd5e7b4c32a292b3`;
- **files:**
  - new `scripts/numbers/27-set-record.sql`;
  - `scripts/numbers/reanalyse.mjs` (one new mode);
  - `scripts/numbers/README.md`;
  - new `tests/numbers-set-record.test.mjs`;
  - a new DB test under `tests/db/`;
- **`FOOD_MATCH_VERSION`** is not bumped: no matcher change.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**The only other halts are:**
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer;
- the put-back rule in section 3.

## 1. The six foods, their meals, and the record chosen

**Sources, all already on disk:**
- the current rows, captions and model summary comments from Fleet 57's `production/private/*-readback.json`;
- c7aa94da's foods from Fleet 56's `owner-macros.out`;
- the USDA records from Fleet 56's by-id pass and one public FoodData Central search per food (FNDDS / SR Legacy, public words only, made by the planner).

**The item ids are the current ones after Fleet 57's recheck,** which superseded every row of 2b585085 and 47913b69. They are prefixes here; the operator resolves them from the readbacks.

**The meals:**
- **2b585085,** caption "Mix grill": tandoori chicken tikka, seekh kebab, grilled onions, lemon wedge. The caption names no food that contradicts these.
- **47913b69,** caption "Seekh kebab": seekh kebab, grilled onions, lemon wedge, spiced potato side dish. The same holds.
- **c7aa94da:** grilled ribeye steak sliced, roasted potatoes with cheese, charred lemon half. **Its caption is not on disk.** The operator reads it in the snapshot taken just before the write, and **skips the food if the caption names a different food for it** (Fleet 57's lesson).

| Meal | Food (current item) | Grams | Stored record → kcal | Chosen record (USDA's kcal/100 g) | New kcal | Why this record |
|---|---|---|---|---|---|---|
| 2b585085 | Lemon wedge (d42b5cee) | 10 | 168946 "Potatoes, french fried, wedge cut, frozen" → 16.2 | **2709168 "Lemon, raw"** (29) | 2.9 | the same record the owner's own fe8eff27 stores for "Lemon wedge" |
| 47913b69 | Lemon wedge (5f82d2ca) | 15 | 168946, same → 24.3 | **2709168 "Lemon, raw"** (29) | 4.35 | the same |
| c7aa94da | charred lemon half (de5f1e7b) | 30 | 2709169 "Lemon pie filling" → 106.2 | **2709168 "Lemon, raw"** (29) | 8.7 | charring adds no food; USDA has no cooked-lemon record |
| 2b585085 | Grilled onions (7f95803b) | 40 | 169243 "Mushrooms, portabella, grilled" → 11.6 | **2709950 "Onions, cooked, no added fat"** (47) | 18.8 | the PM's ruling of 01:46Z, on the reviewer's note: neither the captions nor the photos show added oil |
| 47913b69 | Grilled onions (3a922704) | 80 | 169243, same → 23.2 | **2709950 "Onions, cooked, no added fat"** (47) | 37.6 | the same |
| 47913b69 | Spiced potato side dish (c2451f19) | 60 | 172074 "McDONALD'S, Side Salad" → 12 | **2709402 "Potato, roasted, NFS"** (126) | 75.6 | the record the owner already stores for "roasted baby potatoes" (45d7e3df). It makes no fat claim; the alternative is 2709406 "…made with oil" (131) |

**Meal effects:**
- 2b585085: −6.1 kcal (16.2 + 11.6 = 27.8 before, 2.9 + 18.8 = 21.7 after);
- 47913b69: +58.1 kcal (59.5 before, 117.6 after);
- c7aa94da: −97.5 kcal.

**What the replay cannot judge:** the record choices are judgments from the name, the caption and the other foods. **The reviewer confirms each record id** before stop 1.

## 2. The tool: can the existing tooling force one record? No. The smallest tool that can

**What exists:**
- `reanalyse.mjs`'s modes (rematch, reanalyse, recheck, repair, decaf) either look a food up again through search and the model, or edit values in place. **None takes a chosen record id.**
- `21-portion.sql` changes only a weight.
- The app's `/api/posts/food` adds a new food from a chosen id; it does not replace one.

**What the worker already does** (`src/lib/nutrition/portion.ts:43-50`, `resolvePortionNutrition`):
- a food that supersedes an older food of the same name takes that older row's nutrition;
- **when that older row has a numeric `source_ref` and no amounts,** the worker reads the record by that id (`getFoodById`) and scales it to the food's grams.

**That is a forced record through the app's own path. The proposal:**
1. **New `scripts/numbers/27-set-record.sql`.** psql variables: `post`, `item` (the full current food id) and `fdc` (the chosen record id). In one transaction, with the meal's row locked as `21-portion.sql` does:
   - **Guards:** the meal is ready, not deleted and has no queued or running job; the item is a current food of the meal with grams above 0 and **no leftovers weight**; `fdc` is a positive integer different from the item's current `source_ref`.
   - **Copy every current food,** each superseding its original, as `21-portion.sql` does. Every other food keeps its nutrition exactly, through the retained path.
   - **For the chosen food,** insert one **bridge row** first:
     - a copy of the old item, marked superseded at once, that supersedes the old item;
     - its `item_nutrition` has `source_ref = fdc`, every amount null and no micronutrients.

     The chosen food's new copy supersedes the bridge. So the worker's retained path finds a same-name prior row with a record id and no amounts, and reads and scales that record. The old item and its nutrition stay untouched as history.
   - **Queue one `recompute` job,** `{"operator":"set-record"}`.
2. **New `reanalyse.mjs run --mode=set-record --foods-file=<file> --ledger=<dir>`.** Each line is `{meal, item, fdc, description}`. Per meal, one at a time:
   - the 08 snapshot first;
   - `27-set-record.sql` once per listed food, in file order;
   - wait for ready, then the after-snapshot;
   - **the put-back rule (section 3).**

   It also takes `--dry-run`, `--max-meals` and `--max-minutes`, as the other modes do. **No retry and no second attempt.**
3. **The planner's reading of `portion.ts` is the premise.** The coder **proves it on the local stack first** (section 4.4). If the worker does not take the record from the bridge row, this design is void. Report that at stop 1, with the smallest alternative found; do not build a second path.

## 3. The put-back rule for set-record

**A meal is put back at once** (`13-restore.sql` through `reanalyse.mjs restore --snapshot=last`) when:
- it fails, or asks a question;
- **any food other than the listed ones** differs from its snapshot in name, grams, any nutrition value or record;
- a listed food's new `source_ref` is not its chosen `fdc`, or its calories are null;
- the meal's food count changed.

**Not a loss:** the micronutrients the wrong record carried for a listed food. They belonged to another food; they are ledgered as `values_removed` with their old values, as `recheck` already does.

**No food is deleted, renamed or re-weighed, and nothing else in the meal is touched.** The ledger line per meal holds:
- the prefixes;
- the old and new record and kcal per listed food;
- `values_removed`;
- kept or put back, and why.

## 4. Local proof and stop 1

1. **Worktree** `/tmp/mfa-f60` from `origin/main`, with `npm ci`. Branch `fix60/set-record`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=64060 TEST_PG_PORT=58349 TEST_STACK_DIR=/tmp/mfa-f60s TEST_ENV_FILE=.env.test.fleet60`.
3. **Tests:**
   - **`tests/numbers-set-record.test.mjs`** (no database): the foods-file parser refuses a missing or non-integer `fdc`, a duplicate item and an unknown mode; dry run writes nothing; the put-back rule's comparison covers each listed case.
   - **The DB test:**
     - **Every guard refuses:** a leftovers food, the same `fdc` as now, a deleted meal, and a queued job.
     - **A successful run** leaves exactly one new current copy per food. The chosen food's chain is copy → bridge (superseded, `source_ref = fdc`, null amounts) → old item. Every other food's copy supersedes its original.
4. **L1, the worker, on the local stack:**
   - seed a ready meal of three foods with a cached record for the chosen `fdc` (the local stack has no USDA access, so seed `fdc_cache` with a saved public record);
   - run the mode, and let the local worker recompute through the tick.

   **Met when:**
   - the chosen food's new nutrition equals `scaleNutrition(that record, its grams)` exactly;
   - the two other foods are byte-equal to before;
   - the meal is ready with its summary comment updated;
   - `reanalyse.mjs restore` returns the meal to its snapshot exactly.

   Also prove each put-back trigger once with a scripted fault.
5. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on the changed files;
   - the numbers-study and reanalyse test files;
   - both suites once, with the built app started (10 minutes each), compared with main's counts.
6. **Review:** the reviewer seat (including the six record choices in section 1), then one PPLX review (AGY if PPLX is unavailable).
7. **Docs PR:** branch `docs/fleet60`, with this plan unchanged as `docs/plan-fleet60.md`.
8. **Stop 1.** Report to the PM in one message:
   - the PR's number, branch, final head (40 characters), checks and reviews, with the reviewer's ruling on each record id;
   - the suites against main;
   - L1;
   - anything void;
   - **the merge order: the code PR, then the docs PR.**

## 5. Production: the corrections (after the PM's merge order only)

This runs under the owner's standing authorization, from merged main, one operator.
1. **Foods file:** the six lines of section 1 (current item ids, chosen `fdc`). It is private, under `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/fleet60/production/private/` (700, files 600).
2. **Dry run:** `reanalyse.mjs run --mode=set-record --foods-file=<file> --ledger=<dir> --max-meals=3 --dry-run`. Every item must still be current, with the stored record shown in section 1. A food that has changed since is dropped and reported.
3. **The caption check, for c7aa94da:** read its caption from the snapshot. If the caption names something other than a lemon for this food, drop it.
4. **The run:** the same command without `--dry-run`, `--max-minutes=30`. That is 3 meals, one at a time, one attempt each, with the snapshot and the put-back rule. **No retry and no second run.**
5. **Read back** each meal's after-snapshot (already taken by the tool). **No extra read.**

## 6. Stop 2

Report to the PM, food by food:
- the old record and kcal;
- the new record and kcal;
- `values_removed`;
- kept or put back, and why;
- the meal kcal before and after;
- the ledger path.

**Then state plainly:** these are one-off fixes of six stored foods; the same wrong matches can recur in new meals; that stays open under #990. #694 and #990 stay open.

## Record-choice ruling, 2026-11-19 01:46Z

The PM chose 2709950, “Onions, cooked, no added fat” (47 kcal/100 g), replacing the dispatched fat-added choice 2709951 (73). Neither the captions nor a photo establishes added oil. The table and meal effects above include this ruling. The reviewer independently verified all five chosen/alternative public USDA ids; lemon 2709168 and potato 2709402 are unchanged. This is the only change to the dispatched plan (original sha256 c243439efc86f97cbe5a0771f6d351b837f670601a5306e6b24612c94b4fa665).
