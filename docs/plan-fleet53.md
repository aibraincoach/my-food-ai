# Fleet 53 — #617: a USDA record that names only another animal is never used for a food, however the record is worded (2026-11-18)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. **Nothing here touches production.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 18:02Z (`qitem-20261118180243-10117ae89e72522c`), item 5, and the PM's ruling of 18:09Z on #617:
- **Plan only the gap** in the protein-reference check, local only.
- **Keep the squid-nigiri fallback** (55 % rice, 45 % squid) as it is, a declared estimate route, not a quiet retry.

**Shape:**
- one code PR and one docs PR;
- local checks only, one stop before the merges, and no production section;
- **base:** main `3f41e22da49fcfc8df1f614d54632b6217fc9c84`;
- **files:** `src/lib/fdc/protein-reference.ts` and `tests/nutrition-availability.test.mjs`. Fleets 49 to 52 touch neither. Fleet 51 also changes the matcher's inputs (`record-kind.ts`); the two apply together, in either order.

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

## 2. The change (patch `fleet53-617-protein.patch`)

**The rule:** a record is a mismatch when it names at least one protein and **none** of the proteins it names is one the food names. Both sides use the same protein word list.

**Unchanged:**
- a food that names no protein is not judged;
- a record that names no protein ("Dumpling, meat-filled") is not judged.

**Synonyms:** "prawn" counts as "shrimp".

**One rule replaces the old one.** The "topped with" and "with X" branches go: every case they caught is a record naming another animal, which the new rule catches. `itemProteinTerm`, used by `approximate.ts`, is unchanged.

**Kept, as the PM ruled:** the 55/45 rice-and-squid composition (`approximate.ts:52-63`).

**Tests** (`tests/nutrition-availability.test.mjs`, 3 new; the 2 existing #617 tests are unchanged and pass):
- **Rejected:**
  - squid nigiri against "Sushi roll, tuna", "Tuna, fresh, bluefin, raw", "Fish, tuna, light, canned in water" and "Fish, tilapia, cooked";
  - turkey sandwich against a chicken record;
  - egg fried rice against "Rice, fried, with chicken".
- **Kept:**
  - salmon nigiri against "Fish, salmon";
  - tuna salad against canned tuna;
  - fried fish against cod;
  - prawn crackers against shrimp;
  - chicken and shrimp fried rice against "Rice, fried, with shrimp";
  - ham sandwich against "Pork, cured, ham";
  - egg noodles with beef against "Noodles, egg";
  - pork dumpling against "Dumpling, meat-filled";
  - sushi roll (no protein named) against "Sushi roll, tuna";
  - beef burger against "Hamburger…" ("ham" does not match inside "hamburger").
- **The matcher, end to end:** for "squid nigiri", with a search that returns the tuna roll, the bluefin tuna and a squid record, the model is offered only the squid record.

Two of the new tests fail on main; the third (kept cases) passes on both.

**A known limit, rare and written down:** a food named for a cooking style after another animal, like "chicken-fried steak" (beef), would reject a beef record. The matcher then goes on to its closest, composition and estimate steps; it does not leave the food without nutrition.

**Matcher version:** `FOOD_MATCH_VERSION` is not bumped. Fleets 18 and 37 changed the same rules without a bump, and a bump would stop "Eat this again" reusing prior certified nutrition. If the reviewer disagrees, report it; do not change it.

## 3. Facts the planner checked

**Attached** (`/home/opc/.claude/plans/`). Check the hash; a file that does not match voids the PR.

| Patch | sha256 | Files |
|---|---|---|
| `fleet53-617-protein.patch` | `be9d05cbc7a2671746d7a429e68d34b5e12aff67c3d1dd0af7f2e2cc4ff21df2` | `src/lib/fdc/protein-reference.ts`, `tests/nutrition-availability.test.mjs` |

**Verified on the planner's worktree** (main `3f41e22d` with the patch):
- `npx tsc --noEmit` is clean, and `npx eslint` on both files is clean.
- `tests/nutrition-availability.test.mjs`: 9 of 9 with the patch. On main, 7 pass and the 2 new rejection tests fail.
- **The 11 test files** that mention the protein check, the closest record, the composition or the matcher: 52 passed, 0 failed with the patch (on main, 50 of 50, without the new tests).

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
