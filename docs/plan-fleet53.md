# Fleet 53 — #617: a USDA record that names only another animal is never used for a food, however the record is worded (2026-11-18, amended 19:15Z and 19:25Z)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. **Nothing here touches production.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 18:02Z (`qitem-20261118180243-10117ae89e72522c`), item 5, and the PM's ruling of 18:09Z on #617:
- **Plan only the gap** in the protein-reference check, local only.
- **Keep the squid-nigiri fallback** (55 % rice, 45 % squid) as it is, a declared estimate route, not a quiet retry.

**Shape:**
- one code PR and one docs PR;
- local checks only, one stop before the merges, and no production section;
- **base:** main `8e506d3f1cf1fcb182c04c91de7714db803789ac` (Fleets 51 and 52 merged);
- **amended 19:15Z** after the reviewer's blocker on #1157 (`793a951d`, row `qitem-20261118190137-2d41e9d5`, 238 pairs). Amended again at 19:25Z after the builder's probe (`state/build/fleet53/rework/new-keeps-probe.jsonl`) and the PM's ruling of 19:13Z: a named main protein replaces the dish word's implied one. This supersedes patches `be9d05cb…` and `39341a90…`: reset the branch to `origin/main` and apply the new patch;
- **files:** `src/lib/fdc/protein-reference.ts` and `tests/nutrition-availability.test.mjs`. Fleets 49 to 52 touch neither; Fleet 51's `record-kind.ts` change is already on this base, and the replay's combined rejection includes it.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**Stops: one**, before the merges (section 4). The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

## 1. What is wrong

**What the check does now.** `referenceProteinMismatch` (`src/lib/fdc/protein-reference.ts:11-28`) rejects a record only when it says "topped with X" or "with X" for a protein X that the food does not name. Fleet 18 (`6b8889ff`, #633) fixed the named case, "squid nigiri" against "Sushi, topped with tuna", with a test.

**What still passes.** Other wordings for the same animal. The planner ran these on main for "squid nigiri", and each returned false (no mismatch):
- "Sushi roll, tuna";
- "Tuna, fresh, bluefin, raw";
- "Fish, tuna, light, canned in water".

`record-kind.ts` gives no protection here, because squid and tuna are both seafood.

**What it affects.** The check runs at four points:
- on every candidate before the model chooses (`src/lib/fdc/match.ts:74`);
- on the model's choice (`:80`);
- on the closest generic record (`:99`);
- in the rice-and-protein composition (`src/lib/fdc/approximate.ts:39,55`).

## 2. The change (patch `fleet53-617-protein.patch`, amended twice)

**The rule.** Each side, the food's name and the record's description, gets the set of proteins it is made of.

1. **Named proteins**, singular or plural, and each named protein is either a **main** protein or a **topping**:
   - **main:**
     - the fish species: salmon, tuna, cod, tilapia, pollock, mackerel, sardine, anchovy, trout, snapper, catfish, halibut, haddock, herring, swordfish, eel, bass, grouper, milkfish and mahi;
     - fish, squid (also calamari), octopus, cuttlefish, shrimp (also prawn), crab, lobster, mussel, clam, oyster and scallop;
     - chicken, turkey, duck, beef, pork, lamb and veal;
     - tofu and tempeh;
     - **plant**: veggie, vegetarian, vegan, plant-based, bean(s), lentil(s), chickpea(s), soy, Impossible and Beyond.
   - **toppings and extras:** bacon (also pork), ham (also pork), sausage (also pork) and egg.
2. **Implied by a dish word, only when the side names no main protein** (the PM's ruling of 19:13Z):
   - burger, cheeseburger, hamburger, patty → beef;
   - hot dog, frankfurter, wiener → beef and pork;
   - pepperoni, salami, meatball → beef and pork;
   - surimi, kani → fish;
   - roe, caviar, ikura, tobiko → fish.

   So a chicken, turkey, fish or veggie burger is not beef, and chicken meatballs are not beef. A bacon cheeseburger names only a topping, so it is still beef, with its bacon.
3. **An egg dish is always egg:** omelet/omelette, scramble(d) and frittata add egg whatever they hold. So a shrimp omelet keeps an omelet record.
4. **Words that are not the animal they name:**
   - "chicken-fried" before "steak" is a style: chicken-fried steak is beef steak, while "chicken fried rice" keeps its chicken;
   - "imitation crab" and "crab stick" are surimi, not crab.
5. **A side that names a fish species is that species, not any fish:** "Fish, salmon" is salmon.

**A mismatch** is when both sides name or imply a protein, and no protein of the food agrees with one of the record. Two proteins agree when:
- they are the same;
- one is the bare word "fish" and the other a fish species;
- both are plant proteins (plant, tofu, tempeh).

**Unchanged:**
- a food or a record that names no protein is not judged;
- `itemProteinTerm`;
- the 55/45 rice-and-squid composition, as the PM ruled;
- `FOOD_MATCH_VERSION`: not bumped, as the PM ordered.

**Tests** (`tests/nutrition-availability.test.mjs`, 6 new; the 2 existing #617 tests are unchanged):
- the first version's 3 tests;
- **25 pairs that must keep:**
  - bacon cheeseburger against a beef patty and against "Hamburger, with beef";
  - imitation crab and crab stick against surimi;
  - salmon roe against roe and caviar;
  - ham and cheese omelet and shrimp omelet against omelet records;
  - grilled fish and fish fillet against salmon, and fish sticks against pollock;
  - bacon and eggs, and scrambled eggs with bacon;
  - ham and pork, each against the other;
  - sausage roll against pork;
  - chicken-fried steak against beef;
  - hot dog against a beef frankfurter;
  - egg roll against "Egg roll, with pork";
  - mussels and calamari against their records;
  - chicken patty against its own record;
  - tofu burger against a veggie-burger record;
  - baked beans against "Beans, baked, canned, with pork";
- **11 pairs that must reject,** as before;
- **new:** a main protein replaces the implied one:
  - the builder's four reject: chicken, fish and turkey burger against "Hamburger, with beef", and chicken meatballs against "Meatballs, with beef";
  - also rejected: chicken burger against a bare "Hamburger, single patty", turkey meatballs against Swedish beef-and-pork meatballs, chicken hot dog against a beef frankfurter, veggie burger against a beef patty, and lentil meatballs against beef meatballs;
  - the bacon cheeseburger beef patty still keeps.

With the patch, all 12 tests in the file pass; with main's rule, 7 pass and 5 fail.

**The replay** (`/home/opc/.claude/plans/fleet53-pairs-replay.txt`, sha256 `23cc4189ef4da98564a749eeaaee43424ef1bec7d7c5d929d5fd4d1fc6295283`): base main `8e506d3f` against the amended rule.
- **The reviewer's 238 pairs,** as the matcher's combined rejection (protein or record kind): **13 changed.**
  - **12 are correct new rejections:**
    - squid nigiri against the three tuna records;
    - pork chop against beef;
    - chicken curry against salmon;
    - beef and broccoli against chicken and broccoli;
    - chicken parmesan against veal parmigiana;
    - ham against roast beef;
    - beef curry against chicken curry;
    - chicken satay against beef satay;
    - imitation crab against a real crab record;
    - chicken burger against a bare hamburger.
  - **1 new keep:** egg roll against "Egg roll, with pork", a base false rejection.
  - **None of the reviewer's 24 first-version fall-throughs remains.**
- **The planner's probes and the builder's four:**
  - the builder's four reject on base and amended alike;
  - every other change is a correct rejection (fried calamari against cod, tuna against salmon, chicken katsu against pork, veggie and tofu burgers against beef, and the rest in the file);
  - **one other new keep:** bacon cheeseburger against "Hamburger, with beef". Base rejected it through the old "with X" branch, which is the blocker's own shape.

**Every false keep new against base: none.** The only rejected-to-kept changes are the egg roll and bacon cheeseburger fixes.

**Every remaining fall-through** (a plausibly correct record newly rejected): one. "egg drop soup" against "Soup, chicken broth, ready-to-serve": the broth is a part of the soup, and the matcher still has "Soup, egg drop, Chinese restaurant". Imitation crab and crab stick against a real crab record are now rejected; the planner counts those as correct, since imitation crab is surimi.

**Bare-beef false keeps that remain, the same on base:** "mushroom burger" and "falafel" against a beef record. Neither names a protein word: "mushroom" is left out on purpose, because a mushroom Swiss burger is beef. The plant words now catch veggie, plant-based, bean and Impossible burgers, lentil meatballs and vegan hot dogs.

## 3. Facts the planner checked

**Attached** (`/home/opc/.claude/plans/`). Check the hash; a file that does not match voids the PR.

| Patch | sha256 | Files |
|---|---|---|
| `fleet53-617-protein.patch` | `7b4ddb1f5e92524b84fd58685f7887e842401c87cca3640cf2b191da900a62bc` | `src/lib/fdc/protein-reference.ts`, `tests/nutrition-availability.test.mjs` |

**Verified on the planner's worktree** (main `8e506d3f` with the amended patch):
- `npx tsc --noEmit` is clean, and `npx eslint` on both files is clean.
- `tests/nutrition-availability.test.mjs`: 12 of 12 with the patch; 7 pass and 5 fail with main's rule.
- **The 13 test files** that mention the protein check, the record kind, the closest record, the composition or the matcher: 78 passed, 0 failed, 1 skipped with the patch (72 / 0 / 1 on main, without the new tests).

**Not run by the planner:** the suites against a stack, and any USDA or model call.

## 4. How it runs, and the stop

1. **Worktree** `/tmp/mfa-f53` from `origin/main`, with `npm ci`. Branch `fix53/protein-reference` from `origin/main`, with the patch applied by `git apply`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=63460 TEST_PG_PORT=57749 TEST_STACK_DIR=/tmp/mfa-f53s TEST_ENV_FILE=.env.test.fleet53`.
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on both files;
   - the tests above;
   - both suites once, with the built app started (10 minutes each), compared with main's counts.
4. **L1, the stored-records reading, local only.** Find whether the repository holds any recorded USDA search results: the FDC search cache rows in a local seed, `eval/` fixtures or `docs/findings/`. If it does, run the old rule and the new one over every (food, chosen record) pair you find, and report each pair whose result changed. **Met when** every changed pair is a record naming another animal. If there is no such local data, report "no local pairs", and that is met. Do not read production for this.
5. **Review:** one PPLX review on the final head (AGY if PPLX is unavailable).
6. **Docs PR:** branch `docs/fleet53`, with this plan unchanged as `docs/plan-fleet53.md`.
7. **Stop** when the code PR and the docs PR are open, the code PR is reviewed or reported "written, not reviewed", and L1 is reported. Report to the PM in one message:
   - the PR's number, branch, final head (40 characters), checks and review;
   - the suites' counts against main;
   - L1's changed pairs;
   - anything void;
   - the merge order: **the code PR, then the docs PR**.

**There is no production section.** The rule applies to new analyses. Rechecking stored meals belongs to #990 and #694, at the PM's order.
