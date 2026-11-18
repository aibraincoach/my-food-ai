# Fleet 49 — #1082: the beer check reloads Home once the question exists, instead of waiting out a timer the app no longer has (2026-11-18)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. **Nothing here touches production.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 18:02Z (`qitem-20261118180243-10117ae89e72522c`), item 1, and the PM's ruling of 18:09Z on #1082.
- **Done line, as the PM re-scoped it:** the check passes on main when it reloads or takes focus after the admin read shows the question. Realtime delivery is already shown on production: Fleet 47's meal reached ready with no reload.
- **Shape:** one code PR (an instrument change and its test) and one docs PR, local checks only, one stop before the merges, and no production section.
- **Base:** main `3f41e22da49fcfc8df1f614d54632b6217fc9c84`.
- **Files:** `scripts/run17-checks.mjs` and a new `tests/beer-check-reload.test.mjs`. No app source changes.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**Stops: one**, before the merges (section 4). The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

## 1. Why the check fails

**The strip has no timer.** Fleet 47 (#1135, `9e4837da`) deleted `NeedsInputStrip`'s 60-second discovery interval. The strip now reads questions only:
- on mount;
- on sign-in or an account change;
- on `focus` or `visibilitychange`;
- on the window `post-readiness` event (`src/components/NeedsInputStrip.tsx:59-65`).

`post-readiness` comes only from the tab's Realtime channel (`src/components/PostReadinessListener.tsx:119-124`).

**The local stack has no Realtime.** A browser driven over BiDi also gets no focus events. So on the stack the strip can never show a new question without a reload. That applies to the first meal's row (a 70-second wait) as well as the second (30 seconds).

**Before Fleet 47** (on `dced5d9c`, when #1082 was filed), a 60-second idle cadence against a 30-second window is the likely cause of the second row's failure. Either way, the fault is in the instrument, not the app.

**Second fault, already corrected in the Fleet 35 recheck copy** (`state/build/fleet35-recheck/operator/run17-checks-recheck.mjs`): the second row is matched by question text the strip does not show. The copy matches it by the post's own photo. Under rule 5 there is one instrument: that correction moves into the repository script, and the copy is not used again.

## 2. The change (patch `fleet49-1082-beer-reload.patch`)

**In `scripts/run17-checks.mjs`:**
1. **First meal.** Once the admin read shows the post ready with its question, the check reloads Home (`navigate('/')`). It then waits **15 seconds** for the row, in place of 70. The stale comment ("an idle Home looks for new questions once a minute") is replaced.
2. **Second meal.**
   - The row is matched by the post's own photo: the strip row's `img` source contains the post id or one of its photo ids, read from `post_media`. This replaces the question-text match.
   - Home is reloaded once the admin read shows the question, then the check waits **15 seconds** in place of 30.
3. **On a failure,** the check takes a screenshot to `--screenshot=<path>` if one is given, as the recheck copy did.

**No app source changes,** and no new event dispatched into the page. A reload is what a person does, and the PM ruled that it meets the done line.

**New `tests/beer-check-reload.test.mjs`** (a source check, 2 tests):
- each strip-row wait comes straight after `navigate('/')` and is bounded at 15 seconds, and no 70-second wait remains;
- the second row is matched by photo ids, and not by question text.

Both fail on main and pass with the patch (checked).

## 3. Facts the planner checked

**Attached** (`/home/opc/.claude/plans/`). Check the hash; a file that does not match voids the PR.

| Patch | sha256 | Files |
|---|---|---|
| `fleet49-1082-beer-reload.patch` | `68312e77219e3d1e3f2131b360adfb31d91740ebdf0f4efb05f1f8255edb90c6` | `scripts/run17-checks.mjs`; new `tests/beer-check-reload.test.mjs` |

**Verified on the planner's worktree** (main `3f41e22d` with the patch):
- `node --check scripts/run17-checks.mjs` passes.
- The new test passes 2 of 2, and fails 2 of 2 on main.

**Not run by the planner:** `eslint`, the suites, and the check itself on a stack.

## 4. How it runs, and the stop

1. **Worktree** `/tmp/mfa-f49` from `origin/main`, with `npm ci`. Branch `fix49/beer-check-reload` from `origin/main`, with the patch applied by `git apply`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=63060 TEST_PG_PORT=57349 TEST_STACK_DIR=/tmp/mfa-f49s TEST_ENV_FILE=.env.test.fleet49`, with the local beer-question model fixture enabled as in Fleet 35's L3.
3. **Checks:**
   - `npx eslint` on the two files;
   - the new test;
   - both suites once, with the built app started (10 minutes each), compared with main's counts.
4. **L1, the done line.** Run the beer check once on main **without** the patch, then once **with** it, on the same stack and in a fresh native Firefox over BiDi. The command is `--mode=beer --screenshot=<path>`, with test account 2.
   - **Met when** the run with the patch exits 0, and its receipt shows:
     - the first row answered;
     - exactly one DELETE to `/api/posts/<second id>/question` with status 204;
     - the second post still `ready` with no question.
   - **The run without the patch** is expected to fail at "Strip row missing" or the second row's wait. Report where it failed.
   - **Cleanup:** both runs' meals and storage are removed (the script's ledger), and the model fixture is reset.
5. **Review:** one PPLX review on the final head (AGY if PPLX is unavailable).
6. **Docs PR:** branch `docs/fleet49`, with this plan unchanged as `docs/plan-fleet49.md`.
7. **Stop** when the code PR and the docs PR are open, the code PR is reviewed or reported "written, not reviewed", and L1 is reported. Report to the PM in one message:
   - the PR's number, branch, final head (40 characters), checks and review;
   - the suites' counts against main;
   - L1, both runs, with the receipt and screenshot paths;
   - anything void;
   - the merge order: **the code PR, then the docs PR**.

**There is no production check:** the change is to a local instrument, and Realtime delivery on production was shown in Fleet 47. After the merge, run L1's patched run once on main locally and report it. That run is #1082's done line.
