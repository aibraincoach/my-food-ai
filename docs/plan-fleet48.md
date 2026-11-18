# Fleet 48 — #1124: the servings control says what it is and leaves failed meals; #1125: the upload reservation's old fallback deleted (2026-11-18)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. **Nothing here touches production.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 13:17Z.
- **#1124:** AGY's words (run `gemini-3.8-flash-high`, evidence in `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/servings-design/`). No design change.
- **#1125:** RT's rule 5 of Nov 18 (`/home/opc/pm/my-food-ai/decisions/OWNER-RULINGS-2026-11-16.md`: no legacy code and no fallbacks; a failure fails visibly).
- **Shape:** two code PRs (one per issue) and one docs PR, local checks only, one stop before the merges, and no production section.
- **Base:** main `5cbd8670e0001f0c367889d57412317231f130e6`. Both patches apply to it alone and together (checked with `git apply --check`).
- **Order:** any time. Neither touches a file of Fleets 46 or 47 at the same lines. Fleet 47's PR 3 changes `PostDetail.tsx` line 22, the `Thread` props; this fleet changes line 20. If a rebase conflicts there, keep both changes.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**Stops: one**, before the merges (section 4). The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

## 1. #1124 — the servings control

**What the owner saw.** "Tinhead N1 ✎" in the meal page header:
- "Tinhead" is the account's handle (`PostDetailHeader.tsx:68`).
- "1 ✎" is the meal's servings count with its edit pencil (`PostDetailHeader.tsx:47`), with no word beside it.
- Tapping it opens the servings editor, which scales the whole meal's foods and nutrition.
- It also showed on a failed meal.

**The change** (patch `fleet48-1124-servings-words.patch`):
1. **The words.** `src/lib/posts/servings.ts` gets `servingsText(value)`, `` `${servingsLabel(value)} ${roundServings(value) > 1 ? "servings" : "serving"}` ``. The closed control in `PostDetailHeader.tsx:47` shows `{servingsText(saved)} ✎`. Its accessible name stays "Edit servings", the look is unchanged, and the open editor's number box keeps the bare number.
2. **Failed meals.** `PostDetail.tsx:20`: `showServings` also requires `detail.post.status !== 'failed'`, with a one-line comment giving AGY's reason.

**The plural rule for fractions (the planner's choice; AGY ruled only on 1 and the plural):**
- **More than one is "servings":** "2 servings", "1½ servings", "1¼ servings".
- **One, or a part of one, is "serving":** "1 serving", "½ serving", "¼ serving", "0.1 serving". That is how a recipe or nutrition label reads.
- **If AGY rules otherwise for parts below one,** change only the comparison in `servingsText` and its test rows.

**Test** (new `tests/servings-words.test.mjs`, 3 tests):
- the words for 1, 2, 1½, ½, ¼, 0.1, 50 and 1¼;
- the header's button shows `servingsText(saved)` before the pencil, keeps "Edit servings", and no longer shows the bare label;
- a failed meal's `showServings` is false.

They fail on main (`servingsText` does not exist) and pass with the patch.

## 2. #1125 — the upload reservation's fallback

**What it does.** In `src/lib/posts/upload-draft.ts:54-60`, `reserveUpload`: if `reserve_post_upload_with_leftovers` answers `PGRST202`, it calls the older `reserve_post_upload_with_options` for a draft with at most one leftovers photo.

**Why it can go.** `reserve_post_upload_with_leftovers` has existed since migration 0028.

**The rule-5 version** (patch `fleet48-1125-reservation.patch`):
- **One call.** Any error, including a missing function, reaches the existing check and throws 409: "The post draft could not be reserved. Your photos were kept; try again."
- **The SQL function `reserve_post_upload_with_options` stays.** `reserve_post_upload_with_leftovers` calls it (0028 line 36), so it is a building block, not a second route. `tests/render-zone.test.mjs` calls it directly, and that is unchanged.

**Tests, `tests/upload-reservation.test.mjs`:**
- The test "existing single-leftovers rollout fallback preserves the verified owner and guard" (which encoded the fallback) becomes "a missing reservation function fails visibly and no older function is called (#1125)". For no, one and two leftovers photos, it checks:
  - a 409 with the visible message;
  - exactly one RPC, `reserve_post_upload_with_leftovers`;
  - no upload signed.
- The test "missing multi-leftovers support cannot fall back to an unmarked reservation" is deleted. The new test covers its case.
- The file passes 10 of 10. The new test fails on main, which calls the older function.

## 3. Facts the planner checked

**Attached** (`/home/opc/.claude/plans/`). Check each hash; a file that does not match voids its PR.

| Patch | sha256 | Files |
|---|---|---|
| `fleet48-1124-servings-words.patch` | `ef72467475422dd5721ab7cd927f908b335ab506c8f0fa018c79ffc4ad5af78c` | `src/lib/posts/servings.ts`, `src/components/PostDetailHeader.tsx`, `src/components/PostDetail.tsx`; new `tests/servings-words.test.mjs` |
| `fleet48-1125-reservation.patch` | `71edc66d393c1732b04d496582738aa8d6f39656e3a3910e0757c0b4ecb890b6` | `src/lib/posts/upload-draft.ts`, `tests/upload-reservation.test.mjs` |

**Verified on the planner's worktree** (main with both patches):
- `npx tsc --noEmit` is clean, and `npx eslint` on the changed files is clean.
- **Related tests:** the 17 test files that mention servings, the upload draft, the reservation or the meal page.
  - With the patches: 98 passed, 3 failed, 5 skipped.
  - On main: 96 passed, 3 failed, 5 skipped. Main lacks the new file's tests.
  - **The 3 failures are the same tests in both runs,** and each needs a database:
    - "actual food HTTP publishing…";
    - "set_post_servings scales items…";
    - "two-shot reservation refuses publication…".

**Not run by the planner:** the suites against a stack.

## 4. How it runs, and the stop

1. **Worktree** `/tmp/mfa-f48` from `origin/main`, with `npm ci`. Branches `fix48/servings-words` (#1124) and `fix48/reservation-one-call` (#1125), each from `origin/main` with its patch applied by `git apply`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=62960 TEST_PG_PORT=57249 TEST_STACK_DIR=/tmp/mfa-f48s TEST_ENV_FILE=.env.test.fleet48`.
3. **Checks, per PR:** `npx tsc --noEmit`, `npx eslint` on the changed files, and the PR's tests. Then both suites once, on a scratch branch of the two together, with the built app started (10 minutes each). Compare the counts with main's.
4. **L1, on the stack as test user 1, at 390 × 844.** **Met when all of these hold:**
   - a ready photo meal's page shows "1 serving ✎";
   - choosing 2 in its editor shows "2 servings ✎", and ½ shows "½ serving ✎";
   - a failed meal's page shows no servings control;
   - one photo meal posts normally, which is the reservation's one call on a real database.

   Take one screenshot per state and report its path.
5. **Review:** one PPLX review per code PR on its final head (AGY if PPLX is unavailable). The #1124 review includes AGY's confirmation of the fraction rule in section 1.
6. **Docs PR:** branch `docs/fleet48`, with this plan unchanged as `docs/plan-fleet48.md`.
7. **Stop** when both code PRs and the docs PR are open, each code PR is reviewed or reported "written, not reviewed", and L1 is reported. Report to the PM in one message:
   - each PR's number, branch, final head (40 characters), checks and review;
   - the suites' counts against main;
   - L1 with its screenshots;
   - anything void;
   - the merge order: **#1124, #1125 (either order), then the docs PR**.

   **There is no production check:** #1124 changes a word and hides a control, and #1125 removes a call a current database never makes. After the merge, run L1 once on main locally and report it.
