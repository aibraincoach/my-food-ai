# Fleet 52 — #1134: the servings control is a 44 px tap target, and its name says the count it edits (2026-11-18)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. **Nothing here touches production.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 18:02Z (`qitem-20261118180243-10117ae89e72522c`), item 4, issue #1134.
- **Shape:** one code PR and one docs PR, local checks only, one stop before the merges, and no production section.
- **Base:** main `3f41e22da49fcfc8df1f614d54632b6217fc9c84`.
- **Files:** `src/components/PostDetailHeader.tsx` and `tests/servings-words.test.mjs`. Fleets 49, 50 and 51 touch neither.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**Stops: one**, before the merges (section 4). The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

## 1. What is wrong

The closed servings control in the meal header (`src/components/PostDetailHeader.tsx:47`) has two faults:
- **It is too small to tap.** It is styled only `text-handle` (14 px at line height 1.4, `src/lib/theme/tokens.css:42-45`), so it is about 20 px tall. The app's tap size is 44 px (`--spacing-tap`, `tokens.css:141`, Tailwind `min-h-tap`).
- **Its screen-reader name hides the count.** `aria-label="Edit servings"` replaces the visible "1 serving ✎".

## 2. The change (patch `fleet52-1134-servings-tap.patch`)

1. **Tap size:** the closed button gains `min-h-tap` (44 px) and `-my-3`. The negative margin of 12 px top and bottom gives back 24 px, so the button takes about 20 px in the layout, as now. The header row (`min-h-[52px]`) and everything in it keep their height and place: **no visible change, so no designer ruling.**
   - The 12 px above it is the header's own padding. The 12 px below it lies over the plain date line, which takes no taps.
2. **Name:** `` aria-label={`Edit servings, ${servingsText(saved)}`} ``, for example "Edit servings, 1 serving". These are the issue's words; **AGY confirms them in review.** The count comes from the same `servingsText` the visible label uses, with no second copy.
3. **The open editor is unchanged.** Its −, + and Done controls are already `min-h-tap`. Its serving chips (`h-8`, 32 px) are not named by #1134, and are not in this fleet.

**Test** (`tests/servings-words.test.mjs`, the header test rewritten): the button's name is `Edit servings, ${servingsText(saved)}`, its class has `min-h-tap` and `-my-3`, the visible words and pencil are unchanged, and the old fixed `aria-label="Edit servings"` is gone. The rewritten test fails on main and passes with the patch.

## 3. Facts the planner checked

**Attached** (`/home/opc/.claude/plans/`). Check the hash; a file that does not match voids the PR.

| Patch | sha256 | Files |
|---|---|---|
| `fleet52-1134-servings-tap.patch` | `67830e20ee03ff7dbb6cab7e2f47a4cc3f088251a44b699598c9ca2edd03f494` | `src/components/PostDetailHeader.tsx`, `tests/servings-words.test.mjs` |

**Verified on the planner's worktree** (main `3f41e22d` with the patch):
- `npx tsc --noEmit` is clean, and `npx eslint` on both files is clean.
- `tests/servings-words.test.mjs`: 3 of 3 with the patch. On main, 2 pass and the rewritten one fails.
- **The 12 test files** that mention the header or servings: 48 passed, 2 failed, 5 skipped. The same 2 fail on main, and each needs a database ("actual food HTTP publishing…" and "set_post_servings scales items…").

**Not run by the planner:** the suites against a stack, and the browser measurement below.

## 4. How it runs, and the stop

1. **Worktree** `/tmp/mfa-f52` from `origin/main`, with `npm ci`. Branch `fix52/servings-tap` from `origin/main`, with the patch applied by `git apply`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=63360 TEST_PG_PORT=57649 TEST_STACK_DIR=/tmp/mfa-f52s TEST_ENV_FILE=.env.test.fleet52`.
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on both files;
   - the tests above;
   - both suites once, with the built app started (10 minutes each), compared with main's counts.
4. **L1, on the stack as test user 1, at 390 × 844,** on a ready photo meal's page, with main and with the patch. **Met when all of these hold:**
   - the closed control's `getBoundingClientRect()` height is at least 44;
   - the header row's height and the control's visible position are the same as on main, within 1 px;
   - its accessible name (the browser's accessibility tree, or `aria-label`) is "Edit servings, 1 serving";
   - after choosing 2 in the editor and closing it, the name is "Edit servings, 2 servings";
   - a tap 10 px above the visible text opens the editor.

   One screenshot with main and one with the patch.
5. **Review:** one PPLX review on the final head (AGY if PPLX is unavailable). AGY confirms the name's words in any case.
6. **Docs PR:** branch `docs/fleet52`, with this plan unchanged as `docs/plan-fleet52.md`.
7. **Stop** when the code PR and the docs PR are open, the code PR is reviewed or reported "written, not reviewed", and L1 is reported. Report to the PM in one message:
   - the PR's number, branch, final head (40 characters), checks and review, with AGY's ruling on the name;
   - the suites' counts against main;
   - L1 with its measurements and screenshots;
   - anything void;
   - the merge order: **the code PR, then the docs PR**.

**There is no production check:** it changes one button's tap area and name. After the merge, run L1 once on main locally and report it.
