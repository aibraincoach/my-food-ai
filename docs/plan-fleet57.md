# Fleet 57 — #990: the owner's wrongly matched foods are found one by one, the matcher learns to refuse them, and only those foods are looked up again (2026-11-18)

You are the coder. You have the filesystem, GitHub, local-stack and private study-directory access this plan needs. **The only production contact is section 6, after the PM's merge order.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 22:45Z, after Fleet 56's second stop (builder row `qitem-20261118224443-7130ce6c`, finding PR #1170):
- trace the named foods one by one from the private rows on disk;
- say what a recheck under the current matcher rules would do;
- propose rechecks of only the foods that would change;
- list separately the flags that need the owner's memory.

#990 is "the meals that pass every rule". These are such meals.

**Shape:**
- one code PR and one docs PR;
- **two stops:** before the merges (section 5), and after the rechecks (section 7);
- **base:** main `b97fbfe3801f2411b3fec002e27fc82a0ba77b14` (Fleet 56 and #1170 merged);
- **files:**
  - `src/lib/fdc/record-kind.ts`;
  - `src/lib/fdc/protein-reference.ts`;
  - `tests/nutrition-availability.test.mjs`;
  - a new `tests/owner-record-gaps.test.mjs`.
- **There is no patch;** write it to this spec.
- **`FOOD_MATCH_VERSION` is not bumped,** as in Fleet 53, unless the PM rules otherwise.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**The only other halts are:**
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer;
- a stop rule of `reanalyse.mjs`.

## 1. The trace (planner, local only, from files already on disk)

**Sources:**
- Fleet 56's private `owner-macros.out`: the fresh SELECT, with macros, dates and the cached record payload;
- `usda/<id>.json` and `usda-ledger.json`: USDA's own record, fetched by id;
- Fleet 55's `owner-study.out`, for the route: `match` is the model's choice among the eligible candidates, and `closest` is the approximation route. **Correction 23:20Z (the builder):** `closestGenericFood` (`approximate.ts:39`) applies the same energy, exclusion, record-kind and protein filters as the matcher, not the protein check alone. The replay uses that real eligibility.

**No new read.**

**The stored density equals the record's own value in every row below.** So none of these is a unit mix-up: each number is the stated record's own number, and the record is the wrong food.

**Why a record was chosen cannot be read from disk.** Neither owner SELECT exported the matcher's search queries, candidates or the model's reason (`model_traces`). Only the route is known. The likely cause of the lemon case, a search for "lemon wedge" returning a potato *wedge* record, is an inference, not a reading.

**Replay.** "Current rules" means `matchFood` on main, with a search that returns only the stored record and a chooser that picks it. That runs every filter the matcher has: the gram basis, nutrition, energy fit, excluded components, the protein reference and the record kind. "Kept" means the current matcher would accept the record again.

| Meal | Food | Route | Stored record (USDA's own kcal/100 g) | Current rules | Verdict |
|---|---|---|---|---|---|
| 2b585085, 47913b69 | Lemon wedge (10 g, 15 g) | match | Potatoes, french fried, wedge cut, frozen (162) | kept | **wrong food.** "Lemon, raw" (29) is stored for the same name on fe8eff27 |
| c7aa94da | charred lemon half (30 g) | match | Lemon pie filling (354) | kept | **wrong food** |
| 47913b69 | Spiced potato side dish (60 g) | match | McDONALD'S, Side Salad (20) | kept | **wrong food** |
| 47913b69 | Grilled onions (80 g) | match | Mushrooms, portabella, grilled (29) | kept | **wrong food** (the reader did not flag it) |
| 47913b69 | Seekh kebab (160 g, 686 kcal) | match | SEEKH KEBAB MASALA SPIC MIX (429), a dry spice mix | kept | **wrong food:** the largest calorie error found |
| 816869a5 | stir-fried meat with red chilies (40 g) | closest | Fish, tuna, cooked (176) | kept | **wrong animal** |
| 3501b261, 494a2c3a | sambal (20 g each) | match | SAMBAL OELEK, branded (0) | **rejected** | a 0 kcal record. The current rules already refuse it |
| 45d7e3df | roasted cherry tomatoes (60 g) | match | ROASTED CHERRY TOMATOES, branded (200; 6 g fat per 60 g) | kept | **same food.** An oil-roasted product; no action |
| 564ec764 | nasi goreng with sunny-side-up egg | closest | Rice pilaf (137) | kept | a rough approximation; no rule says it is another food; not rechecked |
| bf54e289 | cheese-filled pork katsu | closest | Pork, NFS (192) | kept | approximation; its siblings use "Pork, steak, coated" (275); not rechecked |
| c47aeaf6 | corn on the cob | match | Corn, sweet, yellow, on cob, boiled (94) | kept | **same food.** The 108 macro figure ignores USDA's own energy factors; no action |
| e31fd9af | Sambal (30 g) | match | CHNG KEE'S, SAMBAL OELEK (263) | kept | same food, branded; an oily sambal; no action |
| 189673aa | Mala udon with beef | match | Beef and noodles with soy-based sauce (173) | **rejected** | **a false rejection by the current rules** (section 2.5). Not a stored error |

**So a recheck under the current rules is predicted to change only the two 0 kcal sambal rows.** The current rules would accept the other wrong records again, so a recheck now would depend on the model choosing differently by chance. Section 2 closes those gaps first. Section 6 then rechecks only the foods the fixed rules refuse.

## 2. The change (code PR, branch `fix57/owner-record-gaps`)

**Five rule changes, each tied to rows in section 1.** The record-kind rules stay one shared reader: the matcher and `reanalyse.mjs` both use `checkRecord`.

1. **Lemon and lime are fruit.** Add `lemons?|limes?|calamansi|kalamansi` to the fruit words. "charred lemon half" against "Lemon pie filling" (a sweet category) then gets the existing strong kind signal.
   - **Amended 23:20Z, the kind rule's excuse.** The rule only rejects a fruit, sweet, drink, condiment or fat record when the name has no word of that kind. That excuse no longer holds when the name's **head word** (Fleet 51's head: the name cut at its first with/and/in/&, then its last word) is of a different main kind: meat, seafood, grain, dish, dairy, egg or legume. So lemon chicken still rejects "Lemons, raw" (head chicken), as on base, and so do mango sticky rice against mangos, honey garlic chicken against honey, garlic butter shrimp against butter, and strawberry yogurt against strawberries. These still keep: Lemon wedge (head "wedge" has no kind), lime sorbet, lemon cheesecake, satay peanut sambal sauce against peanut sauce (head sauce), lemon beer against a hard lemonade (head beer), fruit salad against mixed fruit (vegetable is not a main kind here), and sparkling water with lemon. Each is a test.
   - **Amended 23:28Z:** the head-kind override applies only when the record's own description names no word of that head kind. So "Indonesian sweet bread with chocolate filling" (head bread, grain) keeps "Croissant, chocolate", whose croissant is a grain word, as on base. Lemon chicken, banana bread, avocado toast, peanut butter toast, butter chicken and orange chicken still reject records that name only the fruit, butter or spread. Their records name no meat or grain word. The owner's pastry pair is a test.
   - **Amended 23:30Z:** every singular-only grain word also matches its plural: `croissants?|bagels?|breads?|toasts?|sandwich(es)?|burgers?|tortillas?|pizzas?|cereals?|congees?|porridges?`. So butter croissant keeps "Croissants, butter" (owner meal 4f7bfd82). That is a test.
   - **Amended 23:33Z (one bundled fix):**
     - **(a) Drink, sweet, condiment and fat heads count too.** The override uses every kind except vegetable: meat, seafood, grain, dish, dairy, egg, legume, drink, sweet, condiment and fat. The condition is still that the head kind differs from the record's kind and the record names no word of the head kind. Vegetable stays out, because a fruit salad must keep a mixed-fruit record.
       - So lemon beer and sparkling water with lemon reject "Lemons, raw", as on base. Apple juice and mango smoothie reject a raw-fruit record, and honey lemon tea rejects "Honey".
       - These still keep: lemon beer against a hard lemonade (same kind); orange juice against "Orange juice, raw" (the record names juice); lime sorbet; the sauces; Lemon wedge (its head has no kind).
     - **(b) The family words.** `curds?|marmalades?|compotes?` join the sweet words, and `cordials?` joins the drink words. So lemon curd keeps "Lemon curd", lime cordial keeps "Lime cordial", and so does a marmalade.

     Every pair named here is a test.
2. **One named plant food against another.** This is a new strong signal `food`, in `checkRecord`.
   - **The words:** a closed list of specific vegetable and fruit words, singular or plural. It is the specific words of the fruit and vegetable lists, plus `lemon, lime, salad`.
   - **Generic words** name no specific food and never count: `vegetables, veggies, greens, fruit, berries, mixed`.
   - **Both sides are read:** the food's name, and every comma segment of the record's description, not only its head (amended 23:08Z; this replaces the 22:55Z brand-head rule, which is removed). So "Melons, honeydew, raw" names honeydew and keeps honeydew, and "McDONALD'S, Side Salad" names only salad.
   - **The signal fires** when both sides name at least one specific word and no word agrees. Two words agree when they are the same word (singular and plural alike; `potato` matches `potatoes` and `fries`), or when one is `salad` and the other is a salad word: `lettuce, romaine, cabbage, spinach, kale, arugula, cucumber, tomato, carrot` (amended 22:55Z). So mixed green salad keeps "Lettuce, raw", and the spiced potato side dish still rejects "Side Salad".
   - **It is judged only when the food's name has no meat, seafood, grain or dish word,** so a dish is never judged by its garnish.
   - So:
     - Lemon wedge against potatoes;
     - Grilled onions against mushrooms;
     - Spiced potato side dish against a side salad;

     each become a strong signal.
3. **Kebab is meat, and a spice mix is a condiment.**
   - Add `kebabs?|kabobs?|kebab|seekh|shawarma|gyros?` to the meat words.
   - **Amended 23:08Z:** add the dessert family to the sweet words: `cheesecakes?|cupcakes?|sorbets?|sherbets?|mousse|custards?|flan|parfaits?|popsicles?|granita`. So lemon cheesecake and lime sorbet name a sweet, and the lemon/lime fruit words no longer turn them against dessert records.
   - Add the category words `spices|herbs|seasoning` to the condiment category.
   - There is no description-word rule for `mix` (amended 22:55Z). It would make "Cake, chocolate, prepared from mix" and a trail mix condiments. The spice mix record's category "Herbs & Spices" is enough.

   Seekh kebab against the masala spice mix then gets the existing strong kind signal.
4. **Bare "meat" is a land animal.** In `protein-reference.ts`, the word `meat` is a main protein `land` when the side names no other main protein. `land` agrees with chicken, turkey, duck, beef, pork, lamb, veal, goat and mutton, and with nothing in the fish or shellfish lists. So stir-fried meat against "Fish, tuna, cooked" is a mismatch on the closest route as well, which already applies the protein check (`match.ts:99`). Fleet 53's rule is otherwise unchanged.
5. **The false rejection.** A category that names `mixtures` is never a condiment, as soups already are not. "Stir-fry and soy-based sauce mixtures" is a dish, so "Mala udon with beef" keeps "Beef and noodles with soy-based sauce".

**Tests:**
- **New `tests/owner-record-gaps.test.mjs`,** one case per row of section 1:
  - **reject:** the two lemon wedges, charred lemon, spiced potato, grilled onions, seekh kebab, and stir-fried meat (through `referenceProteinMismatch`);
  - **keep:** mala udon, roasted cherry tomatoes, corn on the cob, "Lemon, raw" for a lemon wedge, the CHNG KEE'S sambal, and the 21 kcal chili sauce for sambal.
- **Keep pairs for the new food signal:**
  - "stir-fried greens with chili" against "Asian stir fry vegetables" (generic);
  - "mixed green salad" against "Lettuce, raw";
  - "Lemon twist garnish" against "Lemon peel, raw";
  - **added 22:55Z, amended 23:08Z:** "Cake, chocolate, prepared from mix" is not a condiment; a nut trail mix keeps "Trail mix"; "Spiced potato side dish" against "McDONALD'S, Side Salad" rejects; lemon cheesecake keeps "Cheesecake"; lime sorbet keeps "Frozen desserts, sorbet"; honeydew keeps "Melons, honeydew, raw"; cantaloupe keeps "Melons, cantaloupe, raw"; key lime pie keeps a pie record;
  - "sliced tomato" against "Tomatoes, raw";
  - "Grilled onions" against "Onions, cooked";
  - "French fries" against "Potatoes, french fried";
  - "roasted baby potatoes" against "Potato, roasted, NFS".
- **`tests/nutrition-availability.test.mjs`:** add bare meat against tuna (reject), and bare meat against beef and against chicken (keep).

## 2a. The last amendment, and the fallback (PM ruling 23:27Z)

**The 23:33Z amendment is the last one.** Run it through the full gate:
- both reviewer tables;
- the owner pairs;
- the mixed-vegetable, adversarial and permanent tests.

**If the gate still shows any correct record newly dropped, or any wrong record newly kept, do not amend again.** Instead:
- **Drop from this fleet:**
  - rule 2 (one named plant food against another);
  - the head-word override and its family words (the 23:20Z to 23:33Z amendments to rule 1).
- **Keep only the rules that pass the gate cleanly on their own:**
  - rule 3 (kebab is meat; spice categories are condiments);
  - rule 4 (bare meat is a land animal);
  - rule 5 (a mixtures category is not a condiment);
  - rule 1's lemon/lime fruit words, only if they pass alone; otherwise drop them too.
- **Rerun the gate on what is left.** The recheck list becomes only the foods those rules refuse.
- **The deferred rules** (lemon, onion and the flavour cases) go to a later, separate fleet with their own full replay.

A smaller safe fix that rechecks fewer foods is preferred to a broader fix that might drop a correct record in every future analysis. **At stop 1, report which rules shipped and which were deferred.**

## 3. The replay gate (local only)

1. **The reviewer's 238 pairs from Fleet 53** (row `qitem-20261118190137-2d41e9d5`): run base main against the branch, as the matcher's combined rejection.
2. **The owner's stored pairs on disk:** every row of Fleet 56's `owner-macros.out` with a record description (from `usda/<id>.json` or the cached payload). Run base against branch with section 1's `matchFood` replay; the closest rows go through `closestGenericFood`'s real filters (amended 23:20Z).
3. **Report every pair whose result changed, each with its food, record and a one-line judgment.**
   - **Met when** every new rejection is a record of another food, and the only new keep is mala udon.
   - A new rejection that is plausibly the right record is listed as a fall-through, and the PM rules on it at stop 1.

**The replay sends no network or database request.** It writes a private `replay.json` under `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/fleet57/` (700, files 600). The public finding carries counts and prefixes only.

## 4. Local checks

1. **Worktree** `/tmp/mfa-f57` from `origin/main`, with `npm ci`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=63760 TEST_PG_PORT=58049 TEST_STACK_DIR=/tmp/mfa-f57s TEST_ENV_FILE=.env.test.fleet57`.
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on the changed files;
   - the test files above;
   - every test file that mentions the record kind, the protein check, the matcher or the numbers study;
   - both suites once, with the built app started (10 minutes each), compared with main's counts.
4. **Review:** one PPLX review on the final head (AGY if PPLX is unavailable).
5. **Docs PR:** branch `docs/fleet57`, with this plan unchanged as `docs/plan-fleet57.md`.

## 5. Stop 1

Report to the PM in one message:
- the PR's number, branch, final head (40 characters), checks and review;
- the suites' counts against main;
- the replay, with every changed pair and its judgment;
- the recheck list section 6 will use (below, corrected by the replay);
- anything void;
- **the merge order: the code PR, then the docs PR.**

## 6. Production: targeted rechecks (after the PM's merge order only)

This runs under the owner's standing authorization for rechecks with a snapshot and the restore rule, from merged main.

1. **The foods file.** These are the owner's stored foods that the merged rules refuse, from the replay, nothing else. Expected:

   | Meal | Foods |
   |---|---|
   | 2b585085 | Lemon wedge |
   | 47913b69 | Lemon wedge, Spiced potato side dish, Grilled onions, Seekh kebab |
   | c7aa94da | charred lemon half |
   | 816869a5 | stir-fried meat with red chilies |
   | 3501b261 | sambal |
   | 494a2c3a | sambal |

   That is **6 meals and 9 foods.** A food the replay adds or drops at stop 1 changes this list; nothing else does. It is written in `mismatch.mjs`'s flagged.jsonl shape, into a private ledger directory `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/fleet57/production/private/`.
2. **Dry run first:** `node scripts/numbers/reanalyse.mjs run --mode=recheck --foods-file=<file> --ledger=<dir> --max-meals=6 --dry-run`. Every prefix must resolve to exactly one meal, which also shows the foods are still current. A food the owner has since edited is dropped and reported.
3. **The run:** the same command without `--dry-run`, with `--max-minutes=45`. It is `reanalyse.mjs`'s own path:
   - one meal at a time;
   - the snapshot before each meal;
   - only the listed foods are looked up again, and every other food keeps its numbers exactly;
   - **a meal is put back at once** when it fails or asks a question, loses a value, moves more than half in calories while a listed food's new record still fails the record check, or still has a listed food whose new record is another kind of food;
   - its stop rules.

   **No other mode, no retry and no second run.**
4. **After each meal,** read its ledger line and its `after.jsonl` snapshot, which `reanalyse.mjs` already takes. **No extra production read.**
5. **Report per food:**
   - the old record and kcal;
   - the new record and kcal;
   - whether the new record passes the merged rules;
   - kept or put back, and why.

## 7. Stop 2

Report to the PM in one message:
- the rechecks, food by food;
- the meals kept and put back;
- the ledger path;
- the finding PR (counts and prefixes only, as before).

**Nothing else is changed.** #694 and #990 stay open.

## 8. Questions only the owner can answer (the PM puts these in plain words)

These flags are not record errors. A photo cannot settle them and no rule can; only the owner's memory can. Nothing changes until the owner answers.

1. **189673aa** (2 Nov, mala udon tray): the chopped scallions and pickled vegetables. The app says about 60 % was left. The photo looks like all of it was left.
2. **bf54e289** (10 Nov, pork katsu set):
   - The cheese-filled katsu: the app says about 57 % was left; the photo looks like about 30 %.
   - The original katsu: the app says about 42 % was left; the photo looks like about 90 %.
   - Were a bowl of rice, a sauce and a drink also part of this meal? They are in the photo, but not in the app.
3. **564ec764** (4 Nov, nasi goreng): the app says less than half of the tomato, cucumber and lettuce was left. The photo looks like most or all of each was left (tomato about 90 %, cucumber all, lettuce about 80 %).
4. **Optional, low stakes:** 45d7e3df (3 Nov): were the roasted cherry tomatoes roasted in oil? The app's record is an oil-roasted product, at 200 kcal per 100 g.

**Not put to the owner, and why:**
- the lemon, potato, onion, kebab, meat and 0 kcal sambal foods are record errors, handled in section 6;
- corn and the drinks' macro gaps are explained by USDA's energy factors and by alcohol;
- nasi goreng and the cheese katsu records are approximations, with no rule against them.
