# Fleet 40 — #1075: the pending-upload card stops saying the photo is kept on this phone (2026-11-18)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** Item 3 of the PM's packet of 2026-11-18 07:32Z (`qitem-20261118073219-8e5b5c716f2279ba`) and issue #1075.
- **Shape:** one code PR and one docs PR, one local check, one stop before the merges, and one production check after the PM's merge order.
- **Base:** main `50ad030db702befa6ea0abcd02b1964cd44f999a` (Fleet 42 merged). **Amended 2026-11-18 17:10Z** for Fleet 42's lost photo (section 3a); this supersedes the patch `9f39565c…`.
- **Files:** `src/components/PostCard.tsx`, a new `src/lib/posts/pending-upload-line.ts` and a new test. Fleets 37, 38, 39 and 41 touch none of them.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**Stops: one**, before the merges (section 7). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void), and an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes.

## 1. What is wrong

`src/components/PostCard.tsx` line 98 writes the line under a meal that has not reached the server. For a failed photo it says **"Not posted yet. The photo is kept on this phone."**

The photo is kept, as its own bytes since #684's Fleet 35b, but only in the app's own browser storage. The owner cannot see it anywhere, which is why the chip's sentence lost that claim in PR #1074 ("The photo couldn't be uploaded. Try again, or remove it."). The card kept it.

**What the card offers for a failed photo:**
- **Try again:** `src/components/UploadingPost.tsx`'s failure overlay, "Upload failed", with the reason.
- **Delete:** the post menu (`···`).

**The fix:**
- **A shared line.** The card's line moves into one small reader, `pendingUploadLine`, which the card calls; the card keeps no copy of the words.
- **The photo sentence** becomes **"Not posted yet. Try again, or delete it."**, the card's own two controls in the chip's form. **AGY decides the final words.**
- **A photo that was not kept (Fleet 42, #1093):** the card shows Fleet 42's existing `PHOTO_NOT_KEPT` and offers no Try again (section 3a).
- **The other two "kept on this phone" lines stay:** "Your caption is kept on this phone." and "Your selection is kept on this phone." A caption and a food selection are text, which the app keeps reliably. Issue #1075 does not name them. AGY may rule that they change too; if it does, change them in the same reader and its test.

## 2. Facts the planner checked

- **Code read** on `4b8988e8`:
  - **The card:** `src/components/PostCard.tsx` (lines 92 to 100) and `src/components/UploadingPost.tsx` (the failure overlay's Try again, and the post menu's Delete).
  - **The chip:** `src/lib/posts/upload-manager.ts` line 17 (AGY's chip wording).
  - **Search:** a repository search for "on this phone" in `src` and `tests`.
- **Attached:** `/home/opc/.claude/plans/fleet40-photo-line.patch`, sha256 `58910faac8d97966216d00e867538a490945a7051d0a521c026c82bb08d81718`. It applies to `50ad030d` with `git apply`. If the hash does not match, the PR is void.
- **Verified on the planner's worktree:**
  - `npx tsc --noEmit` and `npx eslint` on the changed files are clean.
  - The new test passes 3 of 3. Its lost-photo test fails without the `photoLost` line (2 pass, 1 fail).
  - The 18 test files that mention the card, the chip, the upload manager or `photoLost`: 119 passed, 2 failed. The same 2 fail on main, and each needs a database ("feedback revision belongs to owned model comment…" and "two-shot reservation refuses publication…").
- **Not run by the planner:** the suites against a stack.

## 3. The code PR — branch `fix40/photo-not-posted` — #1075

Apply with `git apply /home/opc/.claude/plans/fleet40-photo-line.patch`. What it changes:
- **New `src/lib/posts/pending-upload-line.ts`:** `pendingUploadLine(upload)` returns the same lines as before, except a failed photo returns `PHOTO_NOT_POSTED`, "Not posted yet. Try again, or delete it."
- **`src/components/PostCard.tsx`:** the inline expression becomes `{pendingUploadLine(upload)}`.
- **New `tests/pending-upload-line.test.mjs`:**
  - **Every line:** each upload state's line, including that the photo line names no phone and no keeping.
  - **The card:** it uses the shared line and no longer holds the old sentence.

### 3a. The lost photo (amendment)

- **The reader checks `photoLost` first** and returns `PHOTO_NOT_KEPT`, imported from `upload-manager.ts`: "This photo was not kept. Remove this post and take a new photo." It ignores the optional `message`, so an absent message cannot change the line. There is no new constant, no copy of the words, and no new notice, retake or retry. Leftovers rows never render as cards (Home's feed cards exclude attachments), so the reader needs no retake line.
- **`PostCard.tsx`, the Try again under a failed meal with no preview:** its condition gains `&&!upload.photoLost`. A lost photo-drink row (it has a `kind`) would otherwise show a Try again that `retry` ignores. The menu's Delete stays.
- **Test** (third test in `tests/pending-upload-line.test.mjs`): a lost new-meal photo and a lost drink photo both return `PHOTO_NOT_KEPT`, which names no retry, and the card's Try again condition excludes `photoLost`.
- **AGY's ruling (17:03Z, via the builder):** the normal-photo words `PHOTO_NOT_POSTED` are accepted, and both text lines stay.

If AGY chooses other words, change `PHOTO_NOT_POSTED` only. The test reads the constant, and asserts it does not mention a phone or keeping.

## 4. How it runs

1. **Worktree** `/tmp/mfa-f40` from `origin/main`, with `npm ci`.
2. **Your own stack.** `TEST_PORT_BASE=61960 TEST_PG_PORT=56249 TEST_STACK_DIR=/tmp/mfa-f40/stack TEST_ENV_FILE=.env.test.fleet40` (a short path: Postgres's socket path has a 107-byte limit).
3. **Checks:** `npx tsc --noEmit`, `npx eslint` on the changed files, and both suites once with the built app started (10 minutes each).
4. **Review:** one PPLX review on the final head (AGY if PPLX is unavailable), and AGY for the sentence in any case.
5. **Local check** L1.
6. **Docs PR.** Branch `docs/fleet40`, with this plan unchanged as `docs/plan-fleet40.md`.
7. **Stop** (section 7).

## 6. The local check

**L1.** At 390 by 844, as test user 1, start a photo meal from the camera with `Fetch` failing both storage PUTs, and let it fail (the manager's three attempts, about 8 seconds). Then:
- read the card's line under the photo;
- screenshot the card;
- read that the failure overlay's Try again and the menu's Delete are there.

Then Delete it, and check it is gone after a reload. Met when the line is AGY's sentence and nothing on the card says the photo is kept on this phone.

**L1b, the lost photo.** Before the app loads, write one old-format new-meal row into IndexedDB `mfa-uploads` → `drafts` for test user 1, as in Fleet 42's L1: `posted: true`, no `postId`, `state: 'failed'`, `files: [new File([bytes], 'x.jpg', {type: 'image/jpeg'})]`. Open Home at 390 by 844. Met when:
- the card's line is `PHOTO_NOT_KEPT`, and the card shows no Try again;
- its menu's Delete removes it, and it stays gone after a reload;
- no sign or attach request is sent (count `/api/` requests for 30 seconds).

One screenshot.

## 7. The stop

Stop when the code PR and the docs PR are open, the code PR is reviewed or reported "written, not reviewed", and L1 is reported. Report to the PM in one message:
- the PR's number, branch, final head (40 characters), checks and results, and review with AGY's sentence (and its ruling on the two text lines);
- the two suites' counts;
- L1 and L1b with their screenshot paths;
- the merge order: **the code PR, then the docs PR**.

Then wait for the PM's merge order, which names each PR and its full head SHA.

## 9. After the PM's merge order: production

1. **Deployment:** wait for READY with the alias matched (at most 10 minutes).
2. **P1:** L1's steps as test account 2, in Fleet 35's production browser core, with `Fetch` failing the Supabase storage PUTs for that account's own paths. Record the line and a screenshot. Then delete the pending meal, and read back that no post, draft or stored file remains for it. Met as L1.
3. **Report:** P1 met or not, the screenshot path, and the cleanup.
