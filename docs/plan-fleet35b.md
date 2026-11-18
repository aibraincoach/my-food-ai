# Fleet 35b — #684: the leftovers photo that will not attach, the sentence on its chip, a retry that cannot work, and the chip over the page (2026-11-18)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's urgent packet of 2026-11-18 03:43Z for #684 (`qitem-20261118034318-7c52e079e1274d6b`), the owner's evidence of Nov 17 1:24 PM WIB and Nov 18 9:49 AM WIB, and the builder's read-only reads R1–R4 (`state/build/issue684-reads/report.md`, `R3-report.md`, `R4-report.md`). It has three code PRs and one docs PR, six local checks, one stop before the merges, and one production section after the PM's merge order. Planned from main `6d6dd27728d7e5cfc752a7259400a342b12a0682` (Fleet 36 merged). **Fleet 35 is dispatched with this plan; nothing here touches its files** (`src/lib/posts/feed-photo-url.ts`, `src/app/p/[file]/route.ts`, `src/components/Feed.tsx`, `src/app/api/posts/[id]/media/route.ts`). The two fleets can merge in any order.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix.

**Stops: one**, before the merges (section 7). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void; the rest continues), and an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes, and section 9's waits add up to at most 30 minutes.

## 1. The cause: three separate faults, one chip

| # | Fault | Evidence | What this plan does |
|---|---|---|---|
| A | **Nov 17 (03:50–03:57Z and 06:23Z): the old drink refusal.** Until migration 0067 reached production (with #1028, merged 2026-11-17 15:41Z), `prepare_post_photo_attachment` refused **any** meal with an intake row, including the rows a meal's own foods write (source `item`, a coke or a coffee). That is the cause Fleet 28 found. It was live for every Nov 17 attempt | R1: stage `2ac51cb5` (06:23:41Z) and the four 03:50–03:57Z stages finished with no attachment. R2: both iPhone PUTs for `2ac51cb5` answered 200, so the photo reached storage and the attach request was refused. R3: the meal (`f1439c72`) was ready at 06:17Z and the hourly counter was 7/100, so neither "still being analysed" nor the limit applies. R4: the meal has a caffeine row of source `item` | Nothing new; 0067 already fixed it. The sentence the owner saw then was never captured (fault D) |
| B | **Nov 18: every Try again failed on the phone, before the server was asked.** The Nov 17 entry stayed in the phone's upload list. By Nov 18 its stage had expired (its cleanup job had run, R1), so the attach answered `attachment_stage_expired`. The manager then starts again from the kept photo (`upload-manager.ts` line 276–280). That photo is a `File` object kept in IndexedDB (`mfa-uploads`, store `drafts`). Re-encoding it is the only step before the sign request (`pack-photo-upload.ts`, `prepare`). R1 has **no** Nov 18 stage job, and sign-upload writes one before it signs, so no retry reached the signing step. **Most likely:** on iOS the kept `File` can no longer be read after the app is closed, so re-encoding throws "The photo could not be uploaded…" each time. **Not excluded:** the phone had no session cookie, so sign-upload answered 401 before it wrote its job (no Supabase auth call would then be logged, so R2 cannot see it) | R1, R2; the chip's sentence is exactly `ATTACHMENT_UPLOAD_FAILED`, which only a `prepare()` failure sets. Locally in Chromium the kept photo stays readable: a forced failure, a reload, then Try again attached in 2.9 s, and a 10 MB 4032 × 3024 photo attached. So size is not the cause, and the retry logic works when the photo can be read | PR 2 keeps the photo as its own bytes, so a retry after a restart can read it. A kept photo that cannot be read becomes "take it again" at once. Each failure records its step and status (fault D). Section 8's read R5 decides between "unreadable photo" and "no session" if Vercel's log still has Nov 18 |
| C | **A regression live since Fleet 28: a second leftovers photo is refused.** 0067 rebuilt `prepare_post_photo_attachment` from 0027's body. With it came back 0027's line "The first photo is the meal; only one later photo can be not eaten", which 0028 (`multiple_leftovers`) had removed. R4 confirms that sentence is in the live function. The route does not map it, so the chip says "The photo could not be attached." | The planner diffed 0028's and 0067's function bodies (`supabase/migrations/0028_multiple_leftovers.sql` lines 112–137 against 0067). They differ only in the intended `source='sheet'` change and this one restored line | PR 1: migration 0068 is 0067's function without that line, which is 0028's leftovers rule with 0067's drink rule |
| D | **No failure is ever recorded.** The phone shows a sentence and keeps no record. The attach route's answer and the failing step are lost, which is why Nov 17's sentence was never captured | — | PR 1: table `upload_failures` (0069). PR 2: the phone writes one row per failure: the step, the status, a short error, the photo's size and type, and the browser. No photo data is stored |

**Why Try again "does nothing".** `retry()` (`upload-manager.ts` line 318) shows "Adding leftovers photo…" and then runs three attempts, with pauses of 2 s and 6 s. Under fault B each attempt fails at once at re-encoding, so after about 8 seconds the chip shows the same sentence again. To the owner nothing happened. PR 2 turns a photo that cannot be read into the existing retake prompt ("This photo was not kept. Take it again.", which opens the camera for that meal) on the first failure.

**The sentence.** "It is saved on this phone" is only half true. The photo is kept inside the app's own storage (IndexedDB), not in the phone's Photos, so the owner cannot see it anywhere. Under fault B it may no longer be readable at all. PR 2 proposes "The photo could not be uploaded. Try again, or remove it and add the photo again." **AGY decides the final words** in PR 2's review. Whatever it rules must say nothing about the phone keeping the photo.

**The chip over the page.** The chip is a fixed toast (`UploadChip.tsx` line 31) whose bottom edge sits 96 px above the safe area, 14 px above the tab bar's top edge (`BottomBar.tsx`: `bottom: 24px`, `height: 58px`). The page's bottom padding (`(tabs)/layout.tsx`, 100 px) reserves room for the tab bar only. A failed chip with its sentence is about 100 px tall, so it covers the meal under it, and nothing can scroll that meal out from under it. #912 (Fleet 21) changed only the Remove button, so this is still real. PR 3 makes the page reserve the chip's measured height while it shows. Whether a failed attachment should instead sit on its own meal card is a design question this plan does not take.

## 2. Facts the planner checked

- **Code read end to end** on `6d6dd277`: `UploadChip.tsx`, `upload-manager.ts` (`postAttachment`, `submitAttachment`, `retry`, `process`, `initialize`), `upload-store.ts`, `pack-photo-upload.ts`, `/api/media/sign-upload` (only a 401 for a missing session comes before the cleanup job; there is no rate limit), `/api/posts/[id]/media`, and migrations 0027, 0028 and 0067.
- **The attach refusals, in order.**
  - **The route:** 401 "Sign in required.", the hourly `correct` cap, 404 "Post not found.", and 400 "Choose a valid uploaded photo.".
  - **The function:** "Post not found", "Drink amounts were recorded when posted", "Photo already claimed", "Wait for this meal to be ready", "Invalid staged photo", "Photo stage expired", "Photo upload incomplete", the restored not-eaten line (fault C), and "A meal has at most eight photos".
  - **Anything else:** 503 "The photo could not be attached.".
  - Neither content type nor size is checked on the server; the phone re-encodes to JPEG at most 4096 px.
- **The planner's prototype** of the three PRs: `npx tsc --noEmit` and `npx eslint` on the changed files are clean. The eight application test files that cover these files ran: 69 passed, 1 skipped. One failed only because it needs the database stack ("supabaseUrl is required"). The database test and the suites were **not** run by the planner.
- **Attached files**, all in `/home/opc/.claude/plans/`:
  - `fleet35b-client.patch`, sha256 `46c44ae10a828a2e0657ab64f0f76b52ce20334a87c51727320dab5acf827a84`. It applies to `6d6dd277` with `git apply --check`.
  - `fleet35b-0068_leftovers_again.sql`, sha256 `a0df07d9cf93b9c290b3808764a46887debb68499361df2c247ccba956a99457`.
  - `fleet35b-0069_upload_failures.sql`, sha256 `8db1476aa448b8f91a38db09bf41f4ae58d9cd01a59e40f7c7bc8fed2898deef`.
  - `fleet35b-leftovers-again.test.mjs`, sha256 `2f2472417fbafe2a9c70da4b95435f99680e08cc32048d87dff6a164cf610182`.

  Check each hash before use. A file that does not match is void, and so is its PR.

## 3. Not in this run, and why

- **The owner's iPhone.** Only his phone proves fault B. Section 9's P3 says what his next attempt should show and how it is read.
- **HEIC, rotation and Live Photo.** The phone hands the app a JPEG for a library pick, and the app re-encodes it anyway. Locally that path cannot be made to fail. The `mime` and `bytes` fields in each failure row will show what the phone actually sent. Test on the phone itself: one HEIC library photo, one Live Photo and one camera shot, each added as leftovers to a ready meal.
- **A failed attachment shown on its own meal card instead of the toast.** That is a design question and has no page yet.
- **Every other backlog item.** They belong to Fleet 35, Fleet 37 (#990) or later.

## 4. How it runs

1. **Worktrees.** One fresh worktree per PR from `origin/main` under `/tmp/mfa-f35b`, with `npm ci` in each.
2. **Your own stack.** `TEST_PORT_BASE=61460 TEST_PG_PORT=55749 TEST_STACK_DIR=/tmp/mfa-f35b/stack TEST_ENV_FILE=.env.test.fleet35b` (a different range from Fleet 35's).
3. **Per PR:** `npx tsc --noEmit` and `npx eslint` on the changed files.
4. **Suites.** Both suites once, on a scratch branch of the three PRs with the built app started (10 minutes each).
5. **Reviews.** One PPLX review per code PR on its final head; AGY when PPLX is unavailable, and AGY in any case for PR 2's sentence.
6. **Local checks.** L1 to L6 (section 6), each once and at most 10 minutes, in fresh native Chromium with CDP at 390 by 844, DPR 3.
7. **Docs PR.** Branch `docs/fleet35b`, with this plan unchanged as `docs/plan-fleet35b.md`.
8. **Stop** (section 7).

## 5. The code PRs

### PR 1 — branch `fix35b/leftovers-again` — #684 faults C and D (database)

- **Migrations:** copy `fleet35b-0068_leftovers_again.sql` to `supabase/migrations/0068_leftovers_again.sql` and `fleet35b-0069_upload_failures.sql` to `supabase/migrations/0069_upload_failures.sql`. 0068 is exactly 0067's `create or replace function public.prepare_post_photo_attachment` without the not-eaten line, and keeps 0067's grants. 0069 creates `public.upload_failures`. Under Row Level Security, an authenticated person may insert only rows with their own `user_id`, and has no select, update or delete through the API.
- **Rollbacks:** `supabase/rollbacks/0068_leftovers_again.down.sql` is 0067's function body verbatim (the current production definition). `supabase/rollbacks/0069_upload_failures.down.sql` is `drop table public.upload_failures;`.
- **Test:** copy `fleet35b-leftovers-again.test.mjs` to `tests/db/leftovers-again.test.mjs`. It checks three things:
  - A meal that already has a leftovers photo reserves a second one at position 2.
  - A person's own failure row is accepted.
  - A row for another person is refused, and a person cannot read rows back.
- **Check it fails on main:** run the test once with 0068's line restored (or against 0067 alone) and record that the second leftovers photo is refused. If it is not refused, fault C is void.

### PR 2 — branch `fix35b/kept-photo` — #684 faults B and D (phone), and the sentence

Apply only the three library files from the patch:

`git apply --include='src/lib/*' /home/opc/.claude/plans/fleet35b-client.patch`

- **`src/lib/posts/upload-store.ts`:** `put` reads each file's bytes before the transaction opens and stores `{name, type, lastModified, bytes}`. `all` turns those rows back into `File`s. A row written before this change still holds a `File` and is read as one.
- **`src/lib/media/pack-photo-upload.ts`:** each thrown error carries `stage`: `encode`, `sign` with the HTTP status, or `put-original`/`put-feed` with the status, `timeout` or `network`.
- **`src/lib/posts/upload-manager.ts`:**
  - **The sentence:** `ATTACHMENT_UPLOAD_FAILED` becomes the proposed one (AGY decides).
  - **The failure log:** `reportUploadFailure` inserts one `upload_failures` row per prepare or attach failure. It never throws and never changes what the person sees.
  - **An unreadable kept photo:** an `encode` failure clears the kept file, sets `photoLost`, and shows the retake prompt at once.
  - **An attach refusal** also records its HTTP status and its `code` (or the sentence).

Test file `tests/barcode-consistency.test.mjs` line 24 matches `/could not be uploaded/` and still passes with the new sentence. If AGY's words drop "could not be uploaded", update that line in the same PR.

### PR 3 — branch `fix35b/chip-space` — #684 the chip over the page

Apply only the layout files from the patch:

`git apply --include='src/components/*' --include='src/app/*' /home/opc/.claude/plans/fleet35b-client.patch`

- **`UploadChip.tsx`:** while the chip floats (not in the sidebar), a `ResizeObserver` sets `--mfa-chip-space` on `<html>` to its height plus 14 px, and removes it when the chip goes.
- **`(tabs)/layout.tsx`:** the bottom padding becomes `calc(100px + var(--mfa-chip-space,0px) + env(safe-area-inset-bottom))`.

No test: the contract asks for none for layout. L5 is its evidence.

## 6. The local checks

- **L1, fault C.** PR 1's test file, run on the stack: met when it passes, and the main-only run (section 5, PR 1) refused the second leftovers photo.
- **L2, fault B (a kept photo that cannot be read).** Set up the stuck entry:
  1. On a ready local meal, add a leftovers photo with `Fetch` failing both storage PUTs, so the entry ends failed.
  2. In page script, replace that entry's stored file in IndexedDB (`mfa-uploads` → `drafts`) with three bytes that are not an image: `{name:'x.jpg', type:'image/jpeg', lastModified:0, bytes:new Uint8Array([1,2,3]).buffer}`.
  3. Reload, and tap "Not saved · Try again".

  Met when the chip shows the retake prompt within 2 seconds and the camera opens on tapping it. Report the time.
- **L3, the kept bytes survive a restart.**
  1. Add a leftovers photo with `Fetch` failing both storage PUTs, and let it fail.
  2. Read the IndexedDB row: `files[0]` must be a plain object with `bytes` (an `ArrayBuffer` of the photo's size), not a `Blob`.
  3. Close the tab, open a new one on Home, drop the `Fetch` failure, and tap Try again.

  Met when the photo attaches, shows as that meal's leftovers, and its `post_photo_attachments` row exists.
- **L4, the failure log.** Read `upload_failures` with the service key after L2 and L3. Met when there is a row with stage `encode` (L2), rows with stage `put-original` or `put-feed` and status `network` (L3), every row's `user_id` is the local person, and no column holds photo data. Report the row count; L2 may write up to three, one per attempt. Also force the attach request to answer 422 once through `Fetch` and check its row: stage `attach`, status `422`.
- **L5, the chip's space.** On Home at 390 by 844, make a failed leftovers chip (L3's step 1), then scroll to the bottom. Read `getComputedStyle(document.documentElement).getPropertyValue('--mfa-chip-space')`, the last card's bottom edge and the chip's top edge. Met when the variable is set and the last card's bottom edge is at or above the chip's top edge. Tap Remove, and check the variable is gone.
- **L6, size.** Generate a 6 MB 4032 × 3024 JPEG: `sharp` gaussian noise, quality 95, increasing sigma until the file is between 5.5 and 6.5 MB. Add it as leftovers to a ready local meal. Met when it attaches within 30 seconds. Report its bytes and the time.

## 7. The stop

Stop when the three code PRs and the docs PR are open, each code PR is reviewed or reported "written, not reviewed", and L1 to L6 are reported. Report to the PM in one message:
- each PR's number, branch, final head (40 characters), checks and results, and review, with AGY's sentence for PR 2;
- the two suites' counts;
- L1 to L6 with their numbers;
- R5 (section 8);
- anything void under section 2;
- the merge order this plan expects: **PR 1 (apply 0068 and 0069 immediately before its merge), PR 2, PR 3, then the docs PR**.

Then wait for the PM's merge order, which names each PR and its full head SHA.

## 8. The read the builder can do on production now (read-only, before the stop)

**R5: the failing requests' answers, if any log still holds them.** Use the Vercel REST API with the project token, not the CLI. Read the runtime and request logs of the production deployment for:
- `POST /api/media/sign-upload`;
- `POST /api/posts/<id>/media`;

in three windows: **2026-11-17 03:45–04:00Z**, **2026-11-17 06:20–06:30Z** and **2026-11-18 02:30–03:10Z**. Give each request's time, path (ids cut to 8 characters), status, and the error text if it is logged. Also read Supabase's logs (the Management API endpoint R2 used) for `POST /auth/v1/token` with a non-200 status in the Nov 18 window.

How R5 decides:
- **A Nov 18 sign-upload 401:** fault B's cause is "no session", not "an unreadable photo". PR 2's failure log still applies, and the owner needs to sign in again.
- **No Nov 18 sign-upload at all:** this agrees with an unreadable photo.
- **Nov 17 attach answers carrying "Photos cannot be added to meals with drinks":** fault A is confirmed.
- **Logs past their retention:** report "not retained". The 0069 log then captures the next failure.

## 9. After the PM's merge order: production

As Fleet 35's section 9:
- **Browser:** fresh native Chromium with CDP at 390 by 844, DPR 3, signed in as test account 2.
- **Writes:** app-origin writes and Supabase media uploads for test account 2 only.
- **The ledger:** record every post id before the next action.
- **Cleanup at the end:** delete each post and its `post_upload_drafts`, `post_photo_attachments`, `intake_logs`, `post_media` rows, operation receipts and stored files. Read each back as absent, and report the count. Delete test account 2's `upload_failures` rows too.

**Migrations.**
1. Save the current `prepare_post_photo_attachment` definition privately.
2. Apply 0068 and 0069 in one transaction from PR 1's exact head, immediately before its merge.
3. Read them back: the live function no longer contains "only one later photo can be not eaten" but still contains "Drink amounts were recorded when posted", and `upload_failures` exists with its insert policy.

**Checks.**
- **P1, fault C.** Post a photo meal as test account 2 and wait until it is ready (at most 240 seconds). Add one leftovers photo, then a second. Met when both attach and the meal shows two leftovers photos.
- **P2, the failure log on production.** On P1's meal, add a photo with the storage PUT failed through `Fetch`, once. Read `upload_failures` for test account 2: met when one row shows stage `put-original` or `put-feed`, with no photo data.
- **P3, the owner's phone (read-only, after his next attempt; nothing is asked of him).** When the owner next adds a leftovers photo or taps Try again, read his `upload_failures` rows since the merge, with the service key and the user id cut to 8 characters. Report each row's time, stage, status, detail, bytes and mime. **His stuck Nov 17 entry**, if still on his phone, should show either the retake prompt (stage `encode`: fault B confirmed) or attach (stage expired, then re-uploaded from a readable photo). Report which. Wait at most 10 minutes inside this run; if he has not tried by then, report "not yet observed" and leave it for the PM.

**What section 9 reports.** One row per check, met, not met or not checked, with its numbers. Also the migration read-back, the cleanup count, and each created row read back as absent.
