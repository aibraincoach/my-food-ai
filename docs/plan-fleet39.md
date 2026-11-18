# Fleet 39 — #987: an estimated coffee or tea reaches the day's caffeine, and missing caffeine is never water (2026-11-18, reissued 09:40Z under rules 4 and 5)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**Reissue.** This replaces the 07:55Z version (patch `3e1fbc36…`, now void), as the PM ordered at 09:11Z under RT's rules of Nov 18 (`/home/opc/pm/my-food-ai/decisions/OWNER-RULINGS-2026-11-16.md`, rules 4 and 5). What changed: the cola fallback is deleted in both places it lives; the model's new drink field is strictly required; the production read R1 and the app check P2 are gone; P1 is one sequential pass.

**What this plan is.** Item 2 of the PM's packet of 2026-11-18 07:32Z (`qitem-20261118073219-8e5b5c716f2279ba`), with Fleet 35's P2 result (`state/build/fleet35-postmerge/report.md`: three real coffees all matched USDA records, so the estimate path was never reached).
- **Shape:** one code PR and one docs PR, two local checks, one stop before the merges, and one production pass after the PM's merge order (five model calls, sequential, once).
- **Base:** main `f5c69848b29c234a2781405608ad6c8542644cad`.
- **Files:** `src/lib/fdc/estimate.ts`, `src/lib/intake/alcohol.ts`, `src/lib/intake/drinks-from-items.ts`, `src/lib/intake/identify-drinks.ts`, four test files and the fake model's estimate fixture (`tests/fake-meta/fixtures/spark-nutrition_estimate.json`). Fleet 38 (#1092: Home, middleware), Fleets 40 and 41 and the CPU packet (`PostReadinessListener.tsx`, `Feed.tsx`, migration 0070) touch none of them.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix.

**Stops: one**, before the merges (section 7). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void), and an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes.

## 1. What is wrong: found by the planner, not by production

**The estimate already asks for caffeine and stores it.** Since #987's first fix (`src/lib/fdc/estimate.ts`), the estimate asks for `caffeine_mg` and stores it as nutrient 1057 on the food. `tests/estimate-caffeine.test.mjs` proves that for "black coffee". **But the day's caffeine never sees it for most real drink names.**

**Why.** An estimate has no USDA category. The day's drink rows (`drinksFromItems`, `src/lib/intake/drinks-from-items.ts`) then decide by name alone (`plainDrinkName`). The name must be, or end with, one of 23 English plain drinks ("coffee", "tea", "espresso", "americano", the colas, water).

**The planner ran the function on estimated foods** with 80 mg of caffeine stored and no category:

| Name | A drink? | Caffeine that reaches the day |
|---|---|---|
| Black coffee, Thai iced tea, Coffee with condensed milk, Vietnamese egg coffee | yes | 80 mg |
| **Es kopi susu gula aren, Kopi joss, Kopi talua, Teh tarik, Iced latte, Cappuccino, Matcha latte, Yuanyang** | **no: a food** | **none** |

Every Indonesian coffee and tea the owner drinks, and every café coffee, lands in the second row whenever it is estimated.

**A second fault, the one the issue names.** A coffee or tea with **no** caffeine figure is logged as **water**, with its millilitres as the amount (`kind: caffeineMg >= 1 ? 'caffeine' : 'water'`). That treats an unknown caffeine value as a known zero. `tests/drinks-from-items.test.mjs` line 44 encodes it today: a coffee with only a per-100 g caffeine entry becomes 240 ml of water.

**The fix.**
- **The model's own drink kind.** The estimate already reads the drink, so it also says what kind of drink it is: `drink: "coffee" | "tea" | "other drink" | "not a drink"`, a required field in its strict schema. The estimate sets the food's category to `coffee`, `tea` or `beverages` to match. The existing category rules then do the rest: the drink row, the caffeine sources, and the decaf and herbal exceptions. No name list grows.
- **Unknown caffeine is unknown.** A coffee or tea with no portion caffeine figure gets **no** drink row. It is never water. Coffee or tea here means:
  - its name names a caffeine source (`CAFFEINE_SOURCE` in `alcohol.ts`), or its category is coffee or tea;
  - and its name does not say it has none ("herbal", "decaf", "caffeine-free").

  A caffeine-free herbal tea stays water.
- **Rule 5: the cola fallback is deleted.** Today a cola with no caffeine figure is given a typical 32 mg per 330 ml, in two copies: `drinks-from-items.ts` line 56 (the day's drink row) and `identify-drinks.ts` line 27 (the drink photo's reading). Both go. A cola with no figure is unknown, like the coffee above: the photo reading shows its caffeine as unknown, and the meal gives no drink row. The "Coca-Cola, can" tile (32 mg, `intake.ts` line 17) is a stated value for a tapped tile, not a fallback, and stays.
- **Rule 5: no answer without the drink kind.** The estimate's `drink` field is required in the schema and checked on the answer: an answer without one of its four values is rejected as "Nutrition estimate was invalid." (502), the same as any other malformed estimate. There is no path that guesses the kind from the name when the field is missing.
- **What a person sees.** Its caffeine is simply absent from the day's total, with nothing shown as zero. The card's nutrition table already omits a caffeine row when there is none (the existing test "an estimated drink with no caffeine source drops the estimated caffeine").

## 2. Facts the planner checked, and premises

- **Code read** on `f5c69848`:
  - **The estimate:** `src/lib/fdc/estimate.ts`, and `src/lib/fdc/nutrients.ts`, which carries `foodCategory` into the stored row (lines 176 and 204).
  - **The drink rules:** `src/lib/intake/drinks-from-items.ts` (`isDrinkItem`, `plainDrinkName`, `drinksFromItems`), `src/lib/intake/identify-drinks.ts` (the photo reading) and `src/lib/intake/alcohol.ts` (`CAFFEINE_SOURCE`, `NO_CAFFEINE`, `keepsCaffeine`).
  - **The tests:** `tests/estimate-caffeine.test.mjs`, `tests/food-estimate.test.mjs`, `tests/drinks-from-items.test.mjs` and `tests/drink-volume.test.mjs`.
- **Attached:** `/home/opc/.claude/plans/fleet39-estimate-drink.patch`, sha256 `457bf4259f38d5493d6a09590b84ecad68492a8bfcb9115cd1f9bb6e60cd60bc`. It applies to `f5c69848` with `git apply`. If the hash does not match, the PR is void.
- **Verified on the planner's worktree** (`f5c69848` with the patch):
  - `npx tsc --noEmit` is clean; `npx eslint` on the changed files shows one warning, already on main (`tests/food-estimate.test.mjs` line 66, `_label`, a line this patch does not touch).
  - The four changed test files pass 33 of 33.
  - **The 75 test files** that mention estimates, drinks, intake, caffeine or FDC: 298 passed, 18 skipped, 8 failed. All 8 need a database or app address the planner's environment lacks ("SUPABASE_DB_URL is required" 3, "Invalid URL" 5), not this change.
- **Not run by the planner:** the suites against a stack.
- **Not changed here, named for the PM:** the estimate still accepts an answer without `caffeine_mg` and stores no caffeine for it (`estimate.ts`, "an older answer without the field", tested in `estimate-caffeine.test.mjs`). The schema already requires the field, so this is the same kind of tolerance rule 5 removes. It is outside #987's change and stays for its own item; it has no issue number.

## 3. The code PR — branch `fix39/estimated-drinks` — #987

Apply with `git apply /home/opc/.claude/plans/fleet39-estimate-drink.patch`. What it changes:
- **`src/lib/fdc/estimate.ts`:**
  - **The instruction** adds: In drink, say what it is: "coffee", "tea", "other drink" or "not a drink".
  - **The schema** adds `drink` as a required string with those four values.
  - **The result:** `DRINK_CATEGORY` maps `coffee` to `coffee`, `tea` to `tea` and `other drink` to `beverages`, and the estimate's `foodCategory` is set from it. "not a drink" sets none.
  - **The check:** an answer whose `drink` is missing or not one of `DRINK_KINDS` is rejected with "Nutrition estimate was invalid." (502).
- **`src/lib/intake/alcohol.ts`:** a new `expectsCaffeine(item)` returns true when the name matches `CAFFEINE_SOURCE` or the category is `coffee` or `tea`, and the name does not match `NO_CAFFEINE`.
- **`src/lib/intake/drinks-from-items.ts`:** the cola fallback is deleted. An item with no portion caffeine figure and no alcohol, for which `expectsCaffeine` is true (coffee, tea and cola by name, or a coffee or tea category), gives no drink row.
- **`src/lib/intake/identify-drinks.ts`:** the cola fallback is deleted; a drink with no caffeine figure has `caffeineMg: null`.
- **`tests/drinks-from-items.test.mjs`:**
  - line 44's coffee with only per-100 g caffeine now gives no row; the millilitres-from-grams check moves to "Sparkling water";
  - "only cola gets a scaled caffeine fallback" becomes "a cola with no caffeine figure gets no assumed value and no row";
  - the historical Pepsi Zero with no figure is still a drink, and gives no row; with a figure it gives its 330 ml.
- **`tests/drink-volume.test.mjs`:** a new test: a photographed cola whose USDA record has no caffeine reads `caffeineMg: null`, with no caffeine nutrient.
- **`tests/food-estimate.test.mjs`** and **the fake model's estimate fixture:** their answers carry `caffeine_mg: 0` and `drink: "not a drink"`, as the schema requires.
- **`tests/estimate-caffeine.test.mjs`:** the base coffee answer carries `drink: "coffee"` (so its category is now `coffee`), and three new tests.
  - **Unfamiliar names:** Es kopi susu gula aren, Kopi joss, Cappuccino, Teh tarik and Yuanyang, estimated at 30 mg per 100 g. Each gets its category and a 75 mg caffeine row for 250 g.
  - **The edge cases:** an estimated coffee with no caffeine figure gives no row; a herbal tea with 0 gives 200 ml of water; "not a drink" gives no category and no row; "other drink" gives `beverages`.
  - **Rule 5:** a missing, empty, unknown or null `drink` is rejected with a 502.

**AGY reviews** the instruction sentence (wording) and the behaviour change ("a coffee, tea or cola with unknown caffeine is no longer counted, as water or as an assumed 32 mg"). It rules on both in place of the owner.

**No version bump.** `FOOD_MATCH_VERSION` is Fleet 37's file. The change applies to new estimates and to drink rows written from now on. Existing rows are not rewritten by this fleet.

## 4. How it runs

1. **Worktree** `/tmp/mfa-f39` from `origin/main`, with `npm ci`.
2. **Your own stack.** `TEST_PORT_BASE=61860 TEST_PG_PORT=56149 TEST_STACK_DIR=/tmp/mfa-f39/stack TEST_ENV_FILE=.env.test.fleet39`. Keep the stack path short: Postgres's socket path has a 107-byte limit.
3. **Checks:** `npx tsc --noEmit`, `npx eslint` on the changed files, and both suites once with the built app started (10 minutes each).
4. **Review:** one PPLX review on the final head (AGY if PPLX is unavailable), plus AGY's two rulings (section 3).
5. **Local checks** L1, L2 and L3.
6. **Docs PR.** Branch `docs/fleet39`, with this plan unchanged as `docs/plan-fleet39.md`.
7. **Stop** (section 7).

## 5. (Reserved.)

## 6. The local checks

- **L1, a forced estimate end to end.** On the stack, make the local USDA fixture return no foods for the query, so every search finds nothing and the chain reaches the estimate. Make the local fake model answer the estimate with `{"food":true,"basis":"coffee with egg yolk and sugar","calories":60,"protein_g":1.5,"carbs_g":8,"fat_g":2.5,"fibre_g":0,"sugar_g":8,"sodium_mg":10,"caffeine_mg":35,"drink":"coffee"}`.
  - **How:** if `tests/fixtures/local-model.mjs` has no mode for an estimate answer, add the smallest fixture mode for it in this PR's tests directory, and say so.
  - **Post** the text meal "Kopi talua" as test user 1 and wait until ready (at most 120 seconds).
  - **Read:** its food's `item_nutrition.food_category` and nutrient 1057, its `intake_logs` rows (kind, amount, source), and `scripts/numbers/cards.mjs`'s last two columns for it.
  - **Met** when the category is `coffee`, caffeine is stored, a `caffeine` intake row of source `item` exists with that amount, and the day's caffeine includes it.
- **L2, unknown caffeine.** The same, with `"caffeine_mg": null`. Met when no intake row exists for that food (no water row), and the card shows no caffeine for it.
- **L3, a cola with no figure.** With the fake model's `cola-unknown` mode (it exists), read a drink photo through `/api/drinks/identify` and post it. Met when the reading's `caffeineMg` is `null`, the posted food has no caffeine nutrient, and no intake row exists for it. `tests/composer-drinks-route.test.mjs` already reads the first half; run it on the stack.

## 7. The stop

Stop when the code PR and the docs PR are open, the code PR is reviewed or reported "written, not reviewed", and L1 to L3 are reported. Report to the PM in one message:
- the PR's number, branch, final head (40 characters), checks and results, and review with AGY's two rulings;
- the two suites' counts;
- L1 to L3;
- anything void under section 2;
- the merge order: **the code PR, then the docs PR**.

Then wait for the PM's merge order, which names each PR and its full head SHA.

## 8. (Removed under rule 4: no all-account read.)

## 9. After the PM's merge order: production

The owner's standing authorization for model calls applies. Under rule 4 this section is **one sequential pass**: no meal is posted, nothing is read back from the database, and nothing is retried.

1. **Deployment:** wait for READY with the alias matched (at most 10 minutes).
2. **P1, the real model's answer, once.** From the merged worktree, with production's model settings, call `estimateFood(name, '')` once each, one after another, for "Es kopi susu gula aren", "Kopi talua", "Teh tarik", "Cappuccino" and "Herbal tea". Use a five-line `node --import tsx` script, kept outside Git.
   - **Why on production:** the local fake model answers what it is told; only the real model shows whether it fills `drink` correctly.
   - **Report** each answer's `drink`, its category, `caffeine_mg` per 100 g and its basis. An answer rejected as invalid is reported as such, not retried.
   - **Met** when the four caffeinated drinks come back as coffee or tea with caffeine above zero, and the herbal tea as tea with no caffeine.
   - **Writes:** each call writes one trace row (five in all). Mark them in the report. Nothing else is written, so there is no cleanup.

**What section 9 reports.** One row per drink name, met or not met, with its answer.

## 10. Not in this run, and why

- **Existing estimated coffees and teas, and colas logged with the assumed 32 mg:** their stored rows stay as they are. Finding them needs an all-account read (rule 4) and changing them is a nutrition change (the restore rule), so it is its own plan with its own issue number, if the PM wants it.
- **A forced estimate through the production app** (the old P2): L1 proves the path locally, and Fleet 35 showed real captions reach USDA records, so a production post adds load and likely no evidence.
- **Matched USDA coffees that lack caffeine** are covered by the same "unknown, not water" rule. Fleet 35's three matched records (`Coffee, brewed`; `Coffee, brewed, flavored`; `Coffee, Iced Latte, flavored`) all store caffeine.
