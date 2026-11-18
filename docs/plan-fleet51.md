# Fleet 51 — #1089: a USDA record with no category is named by the last word of its first words, so a dressing no longer stands for a salad (2026-11-18)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. **Nothing here touches production.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 18:02Z (`qitem-20261118180243-10117ae89e72522c`), item 3, issue #1089.
- **Shape:** one code PR and one docs PR, local checks only, one stop before the merges, and no production section.
- **Base:** main `3f41e22da49fcfc8df1f614d54632b6217fc9c84`.
- **Files:** `src/lib/fdc/record-kind.ts` and `tests/record-kind.test.mjs`. Fleets 49 and 50 touch neither.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**Stops: one**, before the merges (section 4). The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

## 1. What is wrong

**How a record with no category is classified.** `recordKind` (`src/lib/fdc/record-kind.ts:60-62`) falls back to the record's first comma segment. Fleet 37 (#1087) made that fallback conservative: it returns a kind only when **every** kind named in the segment is a single kind (fruit, sweet, drink, condiment or fat).

**The cost.** That kept correct breads, soups and whole dishes, but these four mismatches went unflagged:

| Food | Record | First segment's kinds |
|---|---|---|
| mixed green salad | Salad dressing, green goddess | vegetable and condiment |
| Creamy dipping sauce | Almond butter, creamy | legume and fat |
| salmon nigiri | Fish oil, salmon | seafood and fat |
| thick toast | Milk shakes, thick chocolate | dairy and drink |

The planner ran each pair on main: `recordKind` is null and `recordContradicts` is false.

## 2. The change (patch `fleet51-1089-last-word.patch`)

**In `recordKind`, after the existing rule:** when the first segment mixes kinds, it is named by its **last word**, the noun:
- "Salad dressing" → dressing → condiment;
- "Almond butter" → fat;
- "Fish oil" → fat;
- "Milk shakes" → drink.

**The cut keeps whole dishes safe.** The segment is first cut at its first `with`, `and`, `in` or `&`. So "Beef and noodles with soy-based sauce" ends at "Beef", and "Pasta with tomato-based sauce" ends at "Pasta". Neither ends at "sauce".

**Only a single kind counts.** The last word counts only if it names exactly one kind, and that kind is fruit, sweet, drink, condiment or fat. Otherwise the record stays unknown, as now. So:
- "Ice cream, vanilla" ends at "cream", which is dairy, so it stays unknown;
- "Peanut butter" is a fat, and a peanut butter toast still keeps it, because its name has the word "butter".

**Tests** (`tests/record-kind.test.mjs`, 5 new):
- the four cases, each with no category: `recordKind` gives the kind and `recordContradicts` is true;
- one test that keeps peanut butter toast, strawberry milkshake, vanilla ice cream, chocolate milk, chicken satay with peanut sauce and fish and chips, and keeps "Beef and noodles…" and "Pasta with tomato-based sauce…" without a kind.

The four fail on main and pass with the patch. Every existing test in the file is unchanged and passes. The bread, soup and whole-dish cases are kept.

**A side effect, which is right.** "caesar salad" against "Salad dressing, caesar" (no category) is now flagged. That is a wrong record, a dressing standing for a whole salad: the Run 5 evaluation named the same Caesar reference failure. No test pins it; report it.

## 3. Facts the planner checked

**Attached** (`/home/opc/.claude/plans/`). Check the hash; a file that does not match voids the PR.

| Patch | sha256 | Files |
|---|---|---|
| `fleet51-1089-last-word.patch` | `5ce00f62816faa5a9bf2158a59d471d7c722c5541edf3a7b7baff6a3935ba9a9` | `src/lib/fdc/record-kind.ts`, `tests/record-kind.test.mjs` |

**Verified on the planner's worktree** (main `3f41e22d` with the patch):
- `npx tsc --noEmit` is clean, and `npx eslint` on both files is clean.
- `tests/record-kind.test.mjs`: 18 of 18 with the patch. On main, 14 pass and the 4 new cases fail.
- **The 16 test files** that mention the record kind, the matcher or the mismatch detector:
  - with the patch: 78 passed, 3 failed, 2 skipped;
  - on main: 73 passed, 3 failed, 2 skipped.
  - **The same 3 fail in both runs,** and each needs a database: "candidate SQL distinguishes absent signals…", "profile avatar HTTP keeps session scope…" and "search uses consumed known meals…".

**The 58-pair check.** The Fleet 37 reviewer's 58 food and record pairs were run in the reviewer seat's scratch copy and are not in the repository (reviewer row `qitem-20261118081832-fadf4acd`). The done line needs them, so section 4's review goes to the reviewer seat, which re-runs them.

**Not run by the planner:** the suites against a stack.

## 4. How it runs, and the stop

1. **Worktree** `/tmp/mfa-f51` from `origin/main`, with `npm ci`. Branch `fix51/record-last-word` from `origin/main`, with the patch applied by `git apply`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=63260 TEST_PG_PORT=57549 TEST_STACK_DIR=/tmp/mfa-f51s TEST_ENV_FILE=.env.test.fleet51`.
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on both files;
   - the tests above;
   - both suites once, with the built app started (10 minutes each), compared with main's counts.
4. **L1, the detector locally.** On the stack, seed test user 1 with four foods whose stored records are the four section-1 records, with no category, and one food that matches (peanut butter toast, "Peanut butter, smooth style"). Run `scripts/numbers/mismatch.mjs` against the stack.
   - **Met when** the four are flagged with a strong `kind:` signal and the matching food is not.
   - Remove the seed after.
5. **Review:** send a queue row to `review-reviewer@myfoodai` asking it to re-run its 58 Fleet 37 pairs against main and against the PR's final head, and report any pair whose result changed. **Met when** no pair that was kept is now dropped. Also run one PPLX review on the final head (AGY if PPLX is unavailable).
6. **Docs PR:** branch `docs/fleet51`, with this plan unchanged as `docs/plan-fleet51.md`.
7. **Stop** when the code PR and the docs PR are open, both reviews are reported (or "written, not reviewed"), and L1 is reported. Report to the PM in one message:
   - the PR's number, branch, final head (40 characters), checks and reviews, including the 58-pair result;
   - the suites' counts against main;
   - L1;
   - anything void;
   - the merge order: **the code PR, then the docs PR**.

**There is no production section.** The rule changes which records the matcher drops on new analyses, and which stored meals the detector flags. Rechecking stored meals is #990's work, and #694 is in flight: list what the detector would now flag, if the PM orders it there, not here.
