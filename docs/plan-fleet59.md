# Fleet 59 — #990: a bare "meat" in a food's name no longer rules out fish; Fleet 57's rule 4 is reverted (2026-11-19)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. **Nothing here touches production.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-19 00:26Z. Fleet 57's recheck of meal 816869a5 showed rule 4 was wrong:
- The meal's caption says "Nasi daun jeruk tuna rica", so "stir-fried meat with red chilies" against "Fish, tuna, cooked" was a **correct** match.
- Rule 4 refused it. The recheck's estimate retired 58 micronutrients, and the builder restored the meal under the available-value rule.
- **The planner's wrong-animal reading of the generic name was false.** The rule built on it is removed (rule 5: the old behaviour comes back, with no fallback).

**Shape:**
- one code PR and one docs PR;
- local checks and the gate;
- one stop before the merges;
- no production section;
- **base:** main `b01f3fe64f7dfd1cb775e2e4b5882fae7a7266f9` (Fleet 57 merged);
- **files:**
  - `src/lib/fdc/protein-reference.ts`;
  - `tests/nutrition-availability.test.mjs`;
  - `tests/owner-record-gaps.test.mjs`;
- **`FOOD_MATCH_VERSION`** is not bumped, as in Fleets 53 and 57.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**Stops: one**, before the merges. The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

## 1. The change (patch `fleet59-revert-meat.patch`)

**`protein-reference.ts`:**
- delete the bare-`meat` line in `proteins()`, the `LAND` set, and the two `land` clauses in `agree`;
- `agree` is again main's pre-Fleet-57 rule: the same protein, both plant, or bare fish with a fish species.
- One comment says why: the model's short name can say "meat" for tuna rica, so "meat" judges nothing.

**Tests:**
- **`nutrition-availability.test.mjs`:** the Fleet 57 test "bare meat means a land animal" becomes "bare meat names no animal". Under it:
  - "stir-fried meat with red chilies" keeps "Fish, tuna, cooked", beef, chicken, pork, lamb and "Crepe, with meat";
  - "shrimp rice noodle roll" keeps "Crepe, with meat";
  - "tuna meat" keeps tuna;
  - "chicken meat" still rejects tuna, because chicken is a named protein.
- **`owner-record-gaps.test.mjs`:** the owner pairs 816869a5 (stir-fried meat / tuna) and 0d10c312 (shrimp roll / meat crepe) move from the refuse list to the keep list.

**Fleet 57's other retained rules are unchanged:** contextual spice categories, and "mixtures" is not a condiment.

## 2. Facts the planner checked

**Attached** (`/home/opc/.claude/plans/`). Check the hash; a file that does not match voids the PR.

| File | sha256 |
|---|---|
| `fleet59-revert-meat.patch` | `71007fcfe1acef584babf067481e8fb60ae9d0aaf46ce26d83f7679997874b9b` |
| `fleet59-gate.mts` (the planner's three-tree gate) | `8fb4ac83958be4b5e9f3aafab80aa7aa1dc61258d1fd2393e65801a80b9439b4` |

**Verified on the planner's worktree** (main `b01f3fe6` with the patch):
- `npx tsc --noEmit` is clean, and `npx eslint` on the three files is clean;
- `nutrition-availability`, `owner-record-gaps` and `record-kind`: 60 of 60 pass;
- with only the new tests on main, 3 fail: the rewritten bare-meat test and the two owner keep pairs.

**The gate** (`npx tsx fleet59-gate.mts <pre-57 tree> <main tree> <patched tree>`, local files only, the matcher's combined protein-or-record-kind rejection):

**Corpus:**
- 357 unique reviewer table pairs;
- the reviewer's 575 Fleet 57 probes;
- 345 unique owner pairs from Fleet 57's private replay.

**Main → patch: 5 changes, all rejected → kept, all a bare "meat" against a fish, shellfish or "meat" record:**
- owner 816869a5, stir-fried meat / "Fish, tuna, cooked": the caption shows this is correct;
- owner 0d10c312, shrimp rice noodle roll / "Crepe, with meat": back to base. See section 4;
- the reviewer's probes "meat" / "Salmon, cooked", "meat" / "Shrimp, cooked" and "stir-fried meat" / "Fish, tuna, cooked": back to base. The planner judges them acceptable for the same reason: a bare "meat" is not evidence of the animal.

**Pre-Fleet-57 → patch:** only Fleet 57's retained rules differ:
- the contextual spice rejections (seekh kebab against the masala mix, chicken curry and rendang against curry powder, pepper steak and others against black pepper);
- the mixtures keeps (mala udon, tofu stir fry).

**So no change outside the reverted rule.**

**Not run by the planner:** the suites against a stack, and the closest route's real eligibility (the gate uses the combined rejection only).

## 3. How it runs, and the stop

1. **Worktree** `/tmp/mfa-f59` from `origin/main`, with `npm ci`. Branch `fix59/bare-meat-revert`, with the patch applied by `git apply`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=63960 TEST_PG_PORT=58249 TEST_STACK_DIR=/tmp/mfa-f59s TEST_ENV_FILE=.env.test.fleet59`.
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on the three files;
   - the tests above;
   - every test file that mentions the protein check, the record kind, the matcher or the numbers study;
   - both suites once, with the built app started (10 minutes each), compared with main's counts.
4. **The full gate:** Fleet 57's own replay tool, with the real `matchFood` singleton and `closestGenericFood` eligibility, on main against the branch. Include both reviewer tables, the reviewer's 575 probes, Fleet 57's named, adversarial and permanent pairs, and the 394 owner pairs.
   - **Met when** every changed pair is a bare-"meat" pair that changes from rejected to kept.
5. **Review:** the reviewer seat on the final head, given the code and the gate's files and not this plan's conclusions; then one PPLX review (AGY if PPLX is unavailable).
6. **Docs PR:** branch `docs/fleet59`, with this plan unchanged as `docs/plan-fleet59.md`.
7. **Stop.** Report to the PM in one message:
   - the PR's number, branch, final head (40 characters), checks and review;
   - the suites against main;
   - the gate's changed pairs;
   - anything void;
   - **the merge order: the code PR, then the docs PR.**

**There is no production section.** Meal 816869a5 is already restored. Fleet 57's remaining recheck list loses 0d10c312's shrimp roll (section 4).

## 4. The other Fleet 57 wrong records, and what the rules assume about names and captions

**What the rules read.**
- The protein check and the record-kind check read **only the food's short name**, as the photo model wrote it, and the record's description. **They never read the caption.**
- `excludedComponents` reads the name and the caption, and nothing else does.
- The short name can be looser than the caption: "meat" for tuna rica. So:
  - **A rule may reject only on a word that names a specific food or animal** (lamb, almond butter, dressing). A generic word ("meat", "filling", "sauce" alone) is no evidence. Rule 4 broke that, and nothing in the gate could catch it, because no table holds the caption's ground truth.
  - **When the caption names a different food than the short name, the name is the error, not the record.** No rule fixes a wrong name. A recheck keeps the name and looks the record up again from it, so it can make that meal worse, as on 816869a5. **The builder's caption check before each recheck is the right guard,** and it should skip the food, not recheck it.

**Each listed pair:**

| Meal | Food / stored record | Which rule rejects it | Could the caption make the stored record correct? |
|---|---|---|---|
| 0d10c312 | shrimp rice noodle roll / "Crepe, with meat" | **only rule 4**, so it is kept after this revert | Possibly. "Crepe, with meat" is a generic closest estimate; a cheung fun with shrimp is not a crepe, but the record's "meat" is as generic as the name's was. **Drop it from the recheck list;** it is not a protein error the rules can establish. |
| 38de279e | lamb curry with rice / "Beef curry with rice" | Fleet 53's protein rule, on main before Fleet 57 | Only if the caption says beef. Then the short name "lamb" is the error, and a recheck would keep "lamb". If the caption says lamb or nothing, the record is wrong. |
| 2f892793 | roti kacang merah, red bean bun / "Roll, white, hamburger bun" | Fleet 53's protein rule, on main before Fleet 57: the dish word "hamburger" implies beef against the name's beans | **The rule's reason is false:** a hamburger bun holds no beef. The record is a plain bun without the bean paste, so it is a weak estimate, but it is not a wrong animal. **A planner error in Fleet 53's implied proteins:** an implying dish word that only names a bread ("hamburger bun", "hot dog bun or roll") should imply nothing. **Proposed as a separate small fix, not in this fleet.** A recheck is still reasonable on the estimate's own weakness, if the caption names a red-bean bun. |
| 18de398f | Creamy dipping sauce / "Almond butter, creamy" | the kind rule, on main before Fleet 57 (the record is a fat; the name has no fat word) | Only if the caption says the dip is almond butter. "Creamy" in both names is a texture word, not a food. |
| 46f49283 | mixed green salad with dressing / "Salad dressing, green goddess" | the kind rule, on main before Fleet 57 | No for the whole item: the record is the dressing alone, without the greens. Yes only if the photo item was the dressing itself, which the caption may say. |
| ccf70daa | mixed green salad / "Salad dressing, green goddess" | the same | No: the name names no dressing. If the caption says the item is the dressing, the name is the error. |

**So:** rule 4 is the only rejection built on a generic word, and this fleet removes it. The others reject on a specific word in the name. They are right whenever the name is right, which only the caption can check. The red bean bun's rejection rests on a false implied protein: a Fleet 53 defect, proposed as its own small fix.
