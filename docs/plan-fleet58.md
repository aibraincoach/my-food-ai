# Fleet 58 — #990: a plain fruit or vegetable is never stored as a different plant food, checked by what the USDA record says it is, not by flavour words (2026-11-18)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. **The only production contact is section 7, after the PM's merge order.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 23:43Z, after the reviewer's gate failed on #1172 (row `qitem-20261118234334-73d5818c`, BLOCKERS 3). It covers the cases Fleet 57 deferred:
- Lemon wedge against "Potatoes, french fried, wedge cut" (owner meals 2b585085 and 47913b69);
- charred lemon half against "Lemon pie filling" (c7aa94da);
- Grilled onions against "Mushrooms, portabella, grilled" (47913b69 and 2b585085);
- Spiced potato side dish against "McDONALD'S, Side Salad" (47913b69).

**Amended 00:41Z.** The shrimp rice noodle roll (0d10c312) is out of scope. Fleet 59 reverts the bare-meat rule, and the roll's "Crepe, with meat" estimate is not a protein error the rules can establish. The seekh kebab and the 0 kcal sambal were Fleet 57's. If Fleet 57 shipped without one of those rules, its foods are listed at stop 1 and not covered here.

**Base:** main after **Fleet 59's** code PR merges (Fleet 59 runs before 58). Record its 40-character SHA.

**Shape:**
- one code PR and one docs PR;
- local checks and the gate;
- two stops: before the merges (section 6), and after the rechecks (section 8);
- **files:**
  - new `src/lib/fdc/plant-families.ts`;
  - `src/lib/fdc/record-kind.ts` (one new strong signal only);
  - new `tests/plant-families.test.mjs`;
  - new `tests/fixtures/record-gate/`, holding the probe corpus as files;
- **no patch;** write it to this spec;
- **`FOOD_MATCH_VERSION` is not bumped,** as in Fleets 53 and 57.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix. **There is no amendment round:** if the gate in section 5 fails, the signal is not shipped (section 5.4).

## 1. Why Fleet 57's rules failed, and what this design changes

**Fleet 57 changed the kind words.** It added lemon and lime as fruit, and an override on the name's head word. A kind word works both ways:
- a new word **excuses** a record: lemon became a fruit word, so "lemon and herb chicken" no longer rejected "Lemons, raw", and nine more names did the same;
- it also **condemns** one: jam, apple sauce and curry powder lost their correct records.

Every patch to a word list opened another pair.

**This design does not touch any existing word or signal.**
- It adds **one new rejection signal**. A food is rejected if the old rules reject it **or** the new signal fires.
- **So it cannot keep any record that main rejects.** A new wrong keep is impossible by construction, and the gate checks that.
- **The only risk is a correct record newly dropped.** The signal is built to judge little:
  - it judges only a plain fruit or vegetable name;
  - it judges only against the record's **first** description words, which is how USDA names what a record is;
  - it agrees through families (pak choy is a cabbage to USDA, honeydew is a melon);
  - it fires only on a positive disagreement between two known families. An unknown word on either side means no judgment.

## 2. The mechanism

### 2.1 The family table (`plant-families.ts`)

**The table** is a closed list of plant families. Each family has:
- **name words:** the words a food's name may use, singular and plural;
- **head words:** the words USDA uses as the first words of its records for that food;
- **stand-ins:** optional head words of other families that are the usual USDA proxy for a food USDA does not have.

**The families at least** (the builder completes the head words from the real records in section 5.2):

| Family | Name words | USDA head words | Stand-ins |
|---|---|---|---|
| lemon | lemon | Lemons, Lemon (peel, juice) | — |
| lime | lime | Limes, Lime (juice) | — |
| calamansi | calamansi, kalamansi | — | Limes, Lemons |
| orange | orange, mandarin, tangerine | Oranges, Tangerines, Mandarin | — |
| apple | apple | Apples, Apple | — |
| pear | pear | Pears | — |
| banana | banana | Bananas | — |
| mango | mango | Mangos | — |
| melon | melon, honeydew, cantaloupe, muskmelon | Melons | — |
| watermelon | watermelon | Watermelon | — |
| grape | grape | Grapes | — |
| strawberry, blueberry, raspberry | each its own | Strawberries, Blueberries, Raspberries | — |
| pineapple | pineapple | Pineapple | — |
| papaya | papaya | Papayas | — |
| avocado | avocado | Avocados | — |
| tomato | tomato | Tomatoes, Tomato | — |
| cucumber | cucumber | Cucumber | — |
| potato | potato, fries, wedges (only with potato or fries) | Potatoes, Potato | — |
| sweet potato | sweet potato | Sweet potato | — |
| onion | onion, shallot | Onions, Onion | — |
| scallion | scallion, spring onion, green onion | Onions (spring or scallions) | Onions |
| garlic | garlic | Garlic | — |
| mushroom | mushroom, shiitake, portabella, enoki, oyster mushroom | Mushrooms | — |
| cabbage | cabbage, pak choy, bok choy, pak-choi, napa, chinese cabbage | Cabbage | — |
| lettuce | lettuce, romaine, iceberg | Lettuce | — |
| spinach | spinach | Spinach | — |
| kangkung | kangkung, water spinach, morning glory | — | Spinach, Swamp cabbage |
| kale | kale | Kale | — |
| broccoli | broccoli | Broccoli | — |
| cauliflower | cauliflower | Cauliflower | — |
| carrot | carrot | Carrots | — |
| corn | corn | Corn | — |
| peas | peas | Peas | — |
| eggplant | eggplant, aubergine | Eggplant | — |
| squash | zucchini, squash, courgette | Squash | — |
| pumpkin | pumpkin | Pumpkin | — |
| pepper | bell pepper, chili, chilli, capsicum | Peppers | — |
| celery, asparagus, okra | each its own | Celery, Asparagus, Okra | — |
| salad | salad | Salad | Lettuce, Cabbage, Spinach, Kale, Cucumber, Tomatoes, Carrots |

**The table's rules:**
- **No kind words or meat, grain, sweet or drink words are in the table.** Beans, ginger, herbs and spices are left out, because their USDA heads are legume or spice records.
- **A word not in the table is not a plant word for this signal.**
- **The longest match wins:** "sweet potato" is sweet potato, not potato; "spring onion" is scallion.

### 2.2 The signal (`plantFamilyConflict` in `record-kind.ts`, added to `checkRecord`'s strong signals)

It fires only when **all** of these hold:
1. **The name is a plain plant food.** It names **exactly one** family, and **no word of any existing kind list** other than fruit and vegetable: no meat, seafood, grain, dish, drink, sweet, condiment, fat, dairy, egg or legume word.
   - So lemon chicken, lemon tea, apple sauce, strawberry jam, potato salad (two families) and curry are never judged by it.
2. **The record's head names exactly one family.** The head is the record description's first comma segment. If that segment names no family and no word of any kind list (a brand, such as "McDONALD'S", or "Fast foods") and another segment follows, the next segment is the head.
   - "Vegetables, mixed, …" has a kind word and no family, so it is not judged.
3. **They disagree:** the record head's family is neither the name's family nor one of its stand-ins.
4. **Or the record head adds another food.** The head names the name's family **and** a word of a non-plant kind list that the name does not name. For example, "Lemon pie filling" names pie (sweet) and "Corn bread" names bread (grain).

**It acts wherever `recordContradicts` already acts.** That is the matcher's candidate filter, its choice, and `closestGenericFood`, and `reanalyse.mjs`'s record check, through the same function.

**The deferred cases:**
- **Lemon wedge** against "Potatoes, french fried, wedge cut": lemon against potato, so it fires. "wedge" alone is not a potato word.
- **charred lemon half** against "Lemon pie filling": condition 4, pie, so it fires.
- **Grilled onions** against "Mushrooms, portabella, grilled": onion against mushroom, so it fires.
- **Spiced potato side dish** against "McDONALD'S, Side Salad": the brand is skipped, the head is "Side Salad", and potato against salad fires. Salad is not a stand-in for potato.

**The reviewer's #1172 blockers:**
- **These keep:** pak choy and bok choy against "Cabbage, chinese (pak-choi)" (one family); kangkung against Spinach or Swamp cabbage (stand-ins); calamansi against Limes or Lemons (stand-ins).
- **These are never judged, so they are unchanged from main:** jam, apple sauce, curry powder and every "lemon and …" name, because each names a word of another kind.

## 3. Tests (`tests/plant-families.test.mjs`)

- **The four deferred owner pairs reject.**
- **They keep:**
  - "Lemon, raw" for a lemon wedge;
  - "Lemon peel, raw" for a lemon twist;
  - "Onions, cooked" for grilled onions;
  - "Potato, roasted, NFS" and "Potatoes, french fried" for potatoes and fries;
  - pak choy and bok choy against chinese cabbage;
  - kangkung, calamansi and honeydew against their records;
  - mixed green salad against lettuce;
  - "Squash, summer, zucchini" for zucchini;
  - "Onions, spring or scallions" for scallions;
  - "Sweet potato, cooked" for sweet potato.
- **They reject:**
  - lemon against Limes;
  - tomato against Cucumber;
  - broccoli against Cabbage;
  - sweet potato against Potatoes;
  - corn against "Cornbread";
  - apple against "Apple pie".
- **Never judged** (the signal returns false): every name in the reviewer's B2 lists, jam, apple sauce, curry powder, lemon tea, potato salad, "Vegetables, mixed" records, and an unknown plant word.
- **Construction test:** across the whole gate corpus, any pair that main rejects is still rejected by the branch. **No new keep is possible, and the test proves it on the data.**

## 4. The gate corpus (`tests/fixtures/record-gate/`, committed, no private data)

One file per source, each row `{name, description, category, source, expected}`. `expected` is `keep`, `reject` or `judge`:
1. Fleet 37 and Fleet 51's 238 reviewer pairs, and Fleet 53's 397: the 635 rows in `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/fleet57/reviewer-pairs.json`;
2. **the reviewer's Fleet 57 probes** (about 500 pairs, row `qitem-20261118234334-73d5818c`). The planner asked the reviewer to save it as `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/review/fleet57-probes.json`. Include it whole. It was saved at 23:47Z with 575 unique pairs. **Every description in it was typed from memory, not fetched,** so these rows test behaviour, not USDA's real wording. Keep the reviewer's `description_typed_from_memory` flag on each row. Wherever section 5.2's real USDA search shows a different head for the same food, add the real record as its own row; never replace the typed one;
3. Fleet 57's named, adversarial and permanent test pairs (the builder's `named-replay.json` and the test files);
4. **Fleet 53's probe pairs** (`state/build/fleet53/rework/`, and the planner's `/home/opc/.claude/plans/fleet53-pairs-replay.txt`).

**The owner's 394 stored pairs stay private and are not committed.** They are replayed from the private files, as in Fleet 57.

## 5. The gate (local only), and the one way it fails

1. **Replay every corpus row and every owner pair on main and on the branch,** through the matcher's combined rejection: `matchFood` singleton eligibility and `closestGenericFood`, as Fleet 57's corrected replay does.
2. **Real USDA heads.** Each family's name words must keep the real USDA records of that food. Use the 241 USDA records on disk first (`state/build/fleet56/production/private/usda/`). **Allowed by the PM at 23:47Z:** one public FoodData Central search per family name word, sequential, one attempt, at most about 90 searches, public words only, nothing about the owner. For every returned record whose description is that plain food, the signal must not fire. The searches stay within USDA's rate limits, are cached locally under `state/build/fleet58/usda-search/` (700, files 600), and take at most 20 minutes.
3. **Report every pair whose result changed,** each with a one-line judgment.
   - **Met when** every change is main-keep to branch-reject, and every such change is a record of another food or another dish.
   - **A branch-keep of a main-reject is a defect by construction.** Report the bug; never ship it.
4. **If any correct record is newly dropped, the signal is not shipped in this fleet.** Close the code PR unmerged and report the dropped pairs at stop 1, with the PM's choice of which family or stand-in would fix each one. There is no amendment round inside this fleet; a fix is a new fleet. A reviewer-judged fall-through (a plausibly right record) counts as a drop unless the PM rules it acceptable at stop 1.

## 6. Local checks and stop 1

1. **Worktree** `/tmp/mfa-f58` from the recorded main, with `npm ci`. Branch `fix58/plant-families`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=63860 TEST_PG_PORT=58149 TEST_STACK_DIR=/tmp/mfa-f58s TEST_ENV_FILE=.env.test.fleet58`.
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on the changed files;
   - the new tests;
   - every test file that mentions the record kind, the protein check, the matcher or the numbers study;
   - both suites once, with the built app started (10 minutes each), compared with main's counts.
4. **Review:**
   - **the reviewer seat**, with the gate corpus and its own fresh probes, given the code and not this plan's conclusions;
   - **one PPLX review** (AGY if PPLX is unavailable).
5. **Docs PR:** branch `docs/fleet58`, with this plan unchanged as `docs/plan-fleet58.md`.
6. **Stop 1.** Report to the PM in one message:
   - the PR's number, branch, final head (40 characters), checks and reviews;
   - the suites against main;
   - the gate: every changed pair with its judgment, the construction test's result, and whether the USDA search ran;
   - the recheck list for section 7;
   - anything void;
   - **the merge order: the code PR, then the docs PR**, or "not shipped" under 5.4.

## 7. Production: targeted rechecks (after the PM's merge order only)

This runs under the owner's standing authorization, exactly as Fleet 57's section 6:
- `reanalyse.mjs run --mode=recheck`, dry run first;
- a foods file of only the owner foods the merged signal refuses;
- one meal at a time, with its snapshot and the built-in put-back rules;
- no retry and no second run.

**Expected:**

| Meal | Foods |
|---|---|
| 2b585085 | Lemon wedge, Grilled onions |
| 47913b69 | Lemon wedge, Spiced potato side dish, Grilled onions |
| c7aa94da | charred lemon half |

That is **3 meals and 6 foods.** It is changed only by the gate's owner replay.

**Item ids (amended 00:41Z).** Fleet 57's recheck SQL superseded **every** food row of the meals it touched, including the unchanged deferred plant foods, which kept their nutrition exactly. So on 2b585085 and 47913b69 the lemon wedge, grilled onions and spiced potato have **new** current item ids.
- Build the foods file from the current rows and `supersedes` chains in Fleet 57's `production/private/*-readback.json` snapshots, never from Fleet 56's item ids.
- **No new production lookup** is needed for the mapping.
- The owner replay in section 5 also uses those current rows for these meals.
- The dry run then confirms each prefix resolves to exactly one current food. A meal Fleet 57 already rechecked is read from its current state by the dry run. A food whose record has since changed is dropped and reported.

## 8. Stop 2

Report to the PM, food by food:
- the old record and kcal;
- the new record and kcal;
- whether the new record passes the merged rules;
- kept or put back, and why;
- the ledger path;
- the finding PR (counts and prefixes only).

**Nothing else changes.** #694 and #990 stay open.
