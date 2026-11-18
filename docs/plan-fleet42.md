# Fleet 42 — #1093: a pending photo saved before Fleet 35b is never read as a File (2026-11-18)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. **Nothing here touches production.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 09:11Z and 09:25Z, under RT's rule 5 of Nov 18 (`/home/opc/pm/my-food-ai/decisions/OWNER-RULINGS-2026-11-16.md`: when code is replaced, delete the old path). Issue #1093.
- **Shape:** one code PR, one docs PR, one local check and one stop before the merges. No production section.
- **Base:** main `f5c69848b29c234a2781405608ad6c8542644cad`.
- **Files:** `src/lib/posts/upload-store.ts`, `src/lib/posts/upload-manager.ts`, `src/components/UploadChip.tsx`, `tests/upload-guard.test.mjs` (one test name) and a new `tests/upload-old-row.test.mjs`. None of these is touched by:
  - Fleet 38 (#1092);
  - Fleet 39 (`estimate.ts`, `src/lib/intake/`);
  - Fleet 40 (`PostCard.tsx`, `pending-upload-line.ts`);
  - Fleet 41 (`run17-checks.mjs`, `NeedsInputStrip.tsx`);
  - the CPU packet (`PostReadinessListener.tsx`, `Feed.tsx`, migration 0070).

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**Stops: one**, before the merges (section 6). The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes.

## 1. What is wrong

Fleet 35b (#684) keeps a pending photo in the phone's browser storage (IndexedDB `mfa-uploads`, store `drafts`) as its own bytes, because iOS can lose a kept `File` once the app is closed. Three pieces of the old path are still on main.

- **The store reads an old row's `File` as a `File`.** `upload-store.ts` line 73, `restoreFiles`: `file instanceof Blob ? file : new File([file.bytes], …)`. Its comment says so: "A row written before this keeps its File." That is the path #684 replaced, kept beside the new one.
- **The manager wraps every restored file in a new `File` again** (`upload-manager.ts`, in `initialize`: `new File([file], file.name ?? \`meal-${index}.jpg\`, …)`). That predates #684. Now that the store returns new `File`s from kept bytes, the second copy does nothing.
- **What an old row does today:**
  - **A leftovers photo** (an attachment) reaches the retake prompt only by failing: either the encoder fails, or keeping its bytes throws `NotReadableError`.
  - **A new meal's photo** has no retake prompt at all. Its Try again fails the same way each time.

## 2. The fix (rule 5: the old path is deleted)

- **`upload-store.ts`:**
  - **Only kept bytes are read.** `restoreFiles` (now exported, for its test) turns kept bytes into `File`s.
  - **A row holding anything else** (a `File`, a `Blob`, or a mix) comes back with no photo, `photoLost: true` and `state: 'failed'`.
  - The `instanceof Blob` branch and its comment are gone.
- **`upload-manager.ts`:**
  - **The second wrap in `initialize` is deleted.**
  - **`photoLost`** now holds for any post with no photo and `photoLost` set, not only a leftovers photo. A leftovers photo still also counts when it carries the retake message.
  - **For a lost photo on a new meal, `state()`** reports `photoLost` and the new `PHOTO_NOT_KEPT`, "This photo was not kept. Remove this post and take it again.", and never `text: true`. Without that, an old photo meal with its photo gone would show as a text post.
  - **What it does:** `initialize` does not run a failed row, and `retry` already refuses a lost photo. So nothing is sent, and nothing retries.
  - **The `NotReadableError` handler stays.** It also covers a new photo that the browser can no longer read when its bytes are kept, so it is not legacy. Only its comment changes, from "A legacy File can fail while checkpointing" to "A photo the browser can no longer read fails while its bytes are kept".
- **`UploadChip.tsx`:** a lost photo on a leftovers photo keeps its retake button, which opens the camera for that meal. A lost photo with no meal shows its line as text, with Remove.
- **AGY decides the words** of `PHOTO_NOT_KEPT`. The test reads the constant.

**What a person sees:** a leftovers photo from before Nov 18 shows "This photo was not kept. Take it again." at once, without a failing Try again first. A new meal's photo from before then shows "This photo was not kept. Remove this post and take it again." with Remove.

## 3. Facts the planner checked

- **Code read** on `f5c69848`:
  - **The store:** `upload-store.ts` lines 64 to 80.
  - **The manager:** `upload-manager.ts`: `photoLost`, `state`, `initialize`, `retry`, `run` and the `NotReadableError` handler.
  - **The chip:** `UploadChip.tsx`, its lost-photo branch.
  - **Tests:** `tests/upload-guard.test.mjs` lines 144 to 198.
- **Attached:** `/home/opc/.claude/plans/fleet42-old-row.patch`, sha256 `b485297af7052f03f5f199a2cf16643c036060ccf0f918e9b506dddc4b83d1b6`. It applies to `f5c69848` with `git apply`. If the hash does not match, the PR is void.
- **Verified on the planner's worktree** with the patch:
  - `npx tsc --noEmit` and `npx eslint` on the changed files are clean.
  - **The new tests:** `tests/upload-old-row.test.mjs` passes 4 of 4. All 4 fail on main's source.
  - **The 31 test files** that mention uploads, attachments or the chip: 149 passed, 9 skipped, 9 failed. All 9 also fail without the patch, or need a database or app address the planner's environment lacks ("Invalid URL" 6, "supabaseUrl is required." 1, and `card-cleanup` and `discard-cleanup`, which fail the same way on main).
- **Not run by the planner:** the suites against a stack, and L1.

## 4. The code PR — branch `fix42/old-upload-row` — #1093

Apply with `git apply /home/opc/.claude/plans/fleet42-old-row.patch`. **New `tests/upload-old-row.test.mjs`:**
- **The store:** a row holding a `File`, or a `File` mixed with kept bytes, comes back with no photo, lost and failed. A row of kept bytes comes back as a `File` with the same bytes.
- **A new meal's old row:** it reads as failed, lost, with `PHOTO_NOT_KEPT` and no `text`. Try again sends nothing.
- **A leftovers photo's old row:** it reads as failed and lost, for its meal.
- **Source checks:**
  - the chip has the two lost-photo branches;
  - the store has no `instanceof Blob ? file`;
  - the manager has no `meal-${index}.jpg` wrap.

**`tests/upload-guard.test.mjs`:** one test is renamed. "a legacy attachment whose bytes cannot be checkpointed…" becomes "an attachment whose bytes cannot be read when they are kept also asks for a retake", since it is the live case, not a legacy one. Its body is unchanged.

## 5. How it runs

1. **Worktree** `/tmp/mfa-f42` from `origin/main`, with `npm ci`.
2. **Your own stack.** `TEST_PORT_BASE=62160 TEST_PG_PORT=56449 TEST_STACK_DIR=/tmp/mfa-f42/stack TEST_ENV_FILE=.env.test.fleet42`. Keep the stack path short: Postgres's socket path has a 107-byte limit.
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on the changed files;
   - both suites once, with the built app started (10 minutes each).
4. **Review:**
   - one PPLX review on the final head (AGY if PPLX is unavailable);
   - AGY on `PHOTO_NOT_KEPT`'s words.
5. **L1**, on the local stack only, at 390 by 844, as test user 1.
   1. **Before the app loads,** write two old-format rows into IndexedDB `mfa-uploads` → `drafts` for test user 1, through page script. Copy a real row's fields from a failed upload made first on the same stack, and set `files` to `[new File([bytes], 'x.jpg', {type: 'image/jpeg'})]`:
      - a leftovers photo, for a ready local meal (`attachment: {postId, notEaten: true}`);
      - a new meal with a photo, unposted, `state: 'failed'`.
   2. **Reload.** Read both chip lines, take a screenshot, and count the requests to `/api/` for 30 seconds.
   3. **Met when:**
      - the leftovers row shows "This photo was not kept. Take it again.", and its button opens the camera for that meal;
      - the meal row shows AGY's `PHOTO_NOT_KEPT` with Remove;
      - neither sends a sign or attach request;
      - Remove clears the row, and it stays cleared after a reload.
6. **Docs PR.** Branch `docs/fleet42`, with this plan unchanged as `docs/plan-fleet42.md`.
7. **Stop** (section 6).

## 6. The stop

Stop when:
- the code PR and the docs PR are open;
- the code PR is reviewed or reported "written, not reviewed";
- L1 is reported.

Report to the PM in one message:
- the PR's number, branch, final head (40 characters), checks and results, and review with AGY's words;
- the two suites' counts;
- L1, with its screenshot path and request count;
- anything void under section 3;
- the merge order: **the code PR, then the docs PR**.

Then wait for the PM's merge order, which names each PR and its full head SHA. **There is no production check:** the change runs only in a person's own browser, on their next app open. After the merge, run L1 once on main locally and report it.

## 7. Not in this run, and why

- **Old rows on real phones** are not counted or read: they live only in each person's own browser, and nothing on the server sees them.
- **The estimate's tolerance of a missing `caffeine_mg`** is the PM's separate issue (number to follow). It is not in this fleet.
