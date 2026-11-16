# Fleet 21 plan

Planner: Fable 5.2 (second planner; the first was removed on Nov 15); fourth pass by Opus 5.5 the same day. Nov 15 2026 (WIB). All code read on `origin/main` = `96ecdcf7` on Nov 15.
On Nov 15 the planner applied every edit in Part 1 to a scratch copy of main outside the repository, ran `npx tsc --noEmit` on it (no errors), and ran the whole test suite on unmodified main and on the edited copy against a disposable stack. The results are in the Facts table. In a second pass the same day the planner wrote and ran the repair of every test that fails on main, the bookmark fix and the small-photo fix, on the same scratch copies. In a third pass the same day (after the reviewer's second reading) the planner re-ran the two checks that carried an earlier date, added the section "Local fixtures", stated the bookmark event's shape as a fact, added an access test to PR 8 and put a default on every line that named the owner. The third pass was made by reading only: nothing was run except read-only commands, and each thing not run is labelled. In a fourth pass the same day (after the reviewer's third reading and the owner's ruling on #324) the planner moved the seed and the fixtures ahead of the page looks, added fixtures for a second photo meal, a meal with a question and a meal to delete, named the browser and how it is driven, checked every control name the fixtures use, restated the test counts as measured, gave PR 8's test a fixed rule, read the production address, and planned #324. A fifth pass the same day (after the reviewer's fifth reading) folded #324 into PR 8 with one shared day-total function, gave a failed read of today a fallback with its own test, added tests for #572, #702 and #706 (and wrote one for #686 that the contract's test rule keeps out), and fixed the production migration step, PR 8's done line, the second-slide premise and the browser driver's home. Neither pass wrote to the repository. What was run is named where it appears.

**Stops: one.** One dispatch, one prompt. The run builds, reviews, tests and looks at every page without
stopping. It then stops once, before the merges: the coder posts each PR number with its full head SHA, and
waits for the PM's merge order naming them. A head SHA does not exist until the code is built, so this stop
cannot be removed while the owner's rule (one PR, one full head SHA, the PM's order) stands. After the order
the run goes to its end without another stop.

**Halts.** The only legal halts are: a review tool is unavailable when the review is reached; a fact this
plan states turns out false; an operation would contact a customer or breach an explicit prohibition.
A halt stops only its own item. Every independent item continues.

**Size.** The engineering backlog (Doc edit of Nov 15, 12:54 WIB, attached by the owner) is 77 numbered items
and one with no number yet. This dispatch works **50** of them: 26 by a build with exact text and 24 by a check
with exact steps (20 on the local build, 4 read-only on production after the merges). The other **27** each have a stated reason in Part 2. Part 2 is not dispatched.
The Doc holds ten more items outside the engineering backlog. Of the six under "Backlog for Designer", this dispatch checks one (#592, check K18); the other five (#453, #455, #457, #555, #631) each wait for the designer to choose a place, a look or an audit, so there is no text to build. The four under "Interdit (Not part of Hackathon)" (#114, #115, #217, #218) are set outside the hackathon by the owner and are not worked.

Each item number appears in one part only. Part 1: 50 engineering items and #592. Part 2: 27 (A 8, B 2, C 13, D 4).

## Rulings taken before writing (owner, Nov 14–15)

1. Merge control stays a written rule. No GitHub setting, account, check or script.
2. Secret photo addresses on Vercel's CDN are to be built (PR 8).
3. Words: "Drank in this meal" → "Drinks with this meal". "Log again" → "Eat this again". "Additional food" → "Also eaten". The clarification heading → "A quick question about your meal". Kept: "leftovers (not eaten)", "Consumed", "Saved meals".
4. The thumbs under a meal are black at rest, as designed (PR 12).
5. The bookmark is never drawn faded (PR 6).
6. The hourly post limit keeps counting new meals only (#716). No build. The PM records the ruling.
7. The photo-saving setting (#594) stays open until someone tries it on a real phone.
8. Home reads today's meals once on the server and shares the result between the day circles and the desktop Today column: no late fill, no second read (#324, in PR 8). The owner's own words, in answer to the planner's question on Nov 15: "have you ever heard of 'do not repeat yourself' (DRY)? … We go through the whole codebase and do not repeat ourselves. If that has to be a backlog item, code it." With that answer he passed on the reviewer's wording of the ruling: "Read once on the server and share it between the circles and the Today column. No late fill, no second read. If that can't be done cleanly, keep the double read." It can be done cleanly (PR 8, part #324: one shared function, and a failed read costs one extra read on that open only), so the double read goes.

---

# Part 1 — the dispatch (50 engineering items, and #592 from the designer's list)

Builds (26): #222, #294, #324, #372, #375, #456, #494, #520, #552, #553, #568, #572, #579, #625, #628, #657, #683, #684, #685, #688, #690, #693, #698, #702, #706, #711.
Checks (24): #322, #323, #351, #377, #454, #512, #554, #569, #571, #573, #574, #598, #599, #615, #658, #700, #701, #703, #704, #705, #707, #708, #709, #710.
Also checked: #592 (designer's list).

## How it runs

1. **Cleanup first.** Run `git worktree list`. On Nov 15 it lists only the main checkout (fact below). If it lists any other, remove it with `git worktree remove --force <path>`, then `git worktree prune`.
2. **Build.** Each PR below in its own fresh worktree branched from `origin/main`. Nothing is stacked. No PR depends on another; no two touch the same file. There are 14 code PRs and one docs PR.
3. After each push: open the PR, then remove that worktree and delete its local branch.
4. **Reviews** run in a sub-agent beside the build, never before it. One external reviewer per PR: **PPLX** (`skills/pplx-review/SKILL.md`), one pass per head, run to zero blockers; PPLX then confirms the fixes only. If PPLX is out of quota, use AGY for that PR; if AGY is also out, Codex. Do not wait. The docs PR is reviewed the same way, by PPLX, as the owner ordered for this plan on Nov 15; the standing rule that docs-only PRs go unreviewed does not apply to it.
5. **At the very end, in this order.**
   a. In the main checkout, once: `TEST_STACK_DIR=/tmp/mfa-f21 TEST_ENV_FILE=.env.test.fleet21 npm run test:stack`. The directory is short on purpose: PostgreSQL puts its socket in it and fails to start when the path is longer than about 90 characters (fact below). The env file is new because `.env.test.local` already exists and the script refuses to overwrite it. The stack's keys expire 24 hours after this command, so steps 5 and 6 finish within 24 hours of it.
   b. **Build and test each PR.** For each PR branch, in a temporary worktree: `npm ci`; `npm run lint`; `npx tsc --noEmit`; then with `TEST_ENV_FILE=/home/opc/Projects/my-food-ai/.env.test.fleet21` set: `npm run test:app -- build`, `npm run test:app -- start` in the background, `MFA_TEST_DISPOSABLE=1 npm test`; then stop the app. Keep the worktree and its build for step 5e; a PR with no page look (PRs 7, 11 and 13) has its worktree removed now. **PR 8 only, before its build:** apply its migration to the disposable database, because the stack was made from main and does not have it: `psql "$(grep ^SUPABASE_DB_URL= /home/opc/Projects/my-food-ai/.env.test.fleet21 | cut -d= -f2-)" -v ON_ERROR_STOP=1 -f supabase/migrations/0063_photo_secret.sql`. The column is additive and has a default; the PRs tested after PR 8, and the fixtures made later, get it without harm.
   c. **Main's build, the seed and the fixtures.** In the main checkout: `TEST_ENV_FILE=.env.test.fleet21 npm run test:app -- build`, then `TEST_ENV_FILE=.env.test.fleet21 npm run test:app -- start` in the background. Run the seed command in "Checks on the local build". Start the browser (section "The browser"), sign in, and make fixtures F1 to F6 as "Local fixtures" says, in that order. Stop the app. The seed and the fixtures come after every `npm test` run and before every page look, so no test meets the seeded rows and every look has them.
   d. **What counts as a pass.** `npm run lint` on unmodified main already reports 3 errors and 14 warnings (fact below). A PR passes lint when it reports no error that main does not. `npm test` on unmodified main already fails 28 of 692 tests (fact below). PRs 6, 13 and 14 between them repair all 28. A PR passes the tests when every test that fails on its branch is in the list "Tests that fail on main" below and is not one that PR repairs. On PR 6's branch its eight must pass, on PR 13's its one, on PR 14's its nineteen, and `npm run test:db` must pass there too (check K17).
   e. **The page looks.** For each PR with a look (step 6), in its worktree from step 5b: `TEST_ENV_FILE=/home/opc/Projects/my-food-ai/.env.test.fleet21 npm run test:app -- start` in the background, do the look in the browser, stop the app, remove the worktree.
   f. Then the checks in the section "Checks on the local build", once, in the main checkout, on main's build from step 5c.
   g. Then the one stop. Then the merges.
6. **The page look** (before merge, once per PR 1 to 6, 8 to 10, 12 and 14; PRs 7, 11 and 13 change no page): in step 5e, open that PR's own build (`http://127.0.0.1:60260`) in the browser of the section "The browser", at 390 × 844 and at 1280 × 900, signed in as local test user 2, on the pages the PR names, with the seeded meals and the fixtures of step 5c. Write the differences from the stated reference as one comment on the PR. Store no image. Do not use Playwright.
7. **The one stop, then merges.** Post one comment on each PR: its number, its full head SHA, its review result and its page-look result. Wait for the PM's merge order. Then merge in ascending PR number, each only at the head SHA the order names. **Immediately before merging PR 8, and only after the merge order names PR 8,** apply its migration to production. In the main checkout (it holds `.env.local`), with `<SHA>` the full head SHA the merge order names for PR 8: `git fetch origin fix21/photo-address && git show <SHA>:supabase/migrations/0063_photo_secret.sql > /tmp/mfa-f21/0063_photo_secret.sql && set -a && . ./.env.local && set +a && psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f /tmp/mfa-f21/0063_photo_secret.sql`, so the file applied is exactly the one at the ordered head, then read it back: `psql "$SUPABASE_DB_URL" -Atc "select count(*), count(photo_secret), count(distinct photo_secret) from public.post_media"` (the three numbers must be equal). Write the three numbers on PR 8. If the migration fails, PR 8 is not merged and is reported; the other PRs still merge. This is how Fleet 17 applied migration 0056 (`docs/plan-run17.md` line 86). Delete each remote branch after its merge. The docs PR is not merged unless the owner says so. After the last merge is deployed, check each PR's "Done when" line on production at 390 wide, signed in as production test account 2 (`TEST_USER2_EMAIL` and `TEST_USER2_PASSWORD` in `.env.local`), and write the result in the final report. For PR 4 the coder checks only that the mic shows in each field: the repository holds no speech clip (fact below), so the half of the done line that plays a clip into the microphone is left to GrokBot and reported as not checked. Last, run the four reads in the section "Reads on production" and write each result in the final report.
8. **End state:** only the main checkout remains; no dev server, test stack or browser left running (the browser is stopped as the section "The browser" says; `TEST_STACK_DIR=/tmp/mfa-f21 TEST_ENV_FILE=.env.test.fleet21 npm run test:stack -- down`); `scripts/cleanup.sh` run.
9. **Final report:** the 50 item numbers and #592, each done or not done, and for each check what was seen; every issue created (none is expected).
10. A defect found during the run is reported to the owner for the backlog. It is not fixed in this run.
11. New tests: three, plus three that guard fixes already on main. One in PR 8, because that PR opens photos to anyone holding an address and that is an access rule. One in PR 4, because that PR changes an access rule on the transcribe route. One in PR 13, because item #625's done line names that test and it guards a data rule (a posted meal is never lost). PR 6 repairs two existing test files and adds none. PR 14 repairs eleven existing test files (two of them under `tests/db`) and adds none. PR 8's new test also reads the migration's column (every photo row gets a 32-character secret); PR 8 changes the size in one existing test to match its new limit. PR 13 also adds two test files for items already fixed on main (#572, #706), and PR 6 one case for #702, because each item's done line asks for a test and each guards a data rule. #686's done line also asks for a test, but a polling race is outside the contract's test rule, so it gets none (Part 2 A). PR 8 edits `tests/home-day-totals.test.mjs` for #324 and adds one case to it.

## Facts (planner checked; the coder does not re-check)

| Fact | Check |
|---|---|
| Every hint mount calls the `getHintState` server action. | `src/components/FirstRunHint.tsx` line 31 |
| `/profile/about` shows a "Your meals ›" link and no meals. `getProfileGrid(db, userId)` returns `GridPost[]`; `ProfileGrid` takes `posts`. | `src/app/(tabs)/profile/about/page.tsx`; `src/lib/posts/grid.ts` line 52; `src/components/ProfileGrid.tsx` |
| "Additional food" is nowhere under `src/`. | `grep -rn "Additional food" src` → nothing |
| The mic is mounted only in `CommentComposer.tsx`. `/api/transcribe` answers 400 without a post id. | grep; `src/app/api/transcribe/route.ts` line 21 |
| The leftovers sheet has no caption field. | `src/components/CaptureSheet.tsx` lines 561–563 |
| Removing an upload deletes its draft and its stored intent together. | `src/lib/posts/upload-store.ts` line 68 |
| Each "Find" text below occurs once in its file. | `grep -c`, Nov 15 |
| `profiles.hints_seen` is a `text[]` column, and a signed-in user may select only their own profile row, so the browser client can read it. | `supabase/migrations/0013_profiles_hints.sql` line 2; policy `profiles_owner_select` in `0001_init.sql` line 14 |
| The upload state the chip and the overlay receive has an optional `attachment` field (`{postId, notEaten}`), set only for a photo added to an existing meal. | `src/lib/posts/upload-manager.ts` line 23; `UploadChip.tsx` already reads `upload.attachment` |
| Every transcribe request passes the per-user limit before anything else, under the route name `transcribe`; its refusal reads "You have made a lot of requests this hour." | `src/app/api/transcribe/route.ts` line 12; `src/lib/limits/user-cap.ts` lines 4, 17 |
| When no USDA record matches, the matcher tries the closest generic record, then a rice-with-protein composition, then a model estimate; it returns unavailable with a reason only when the model gives no estimate or does not treat the item as food. | `src/lib/fdc/match.ts` lines 92–109 (`resolveFoodMatchDetailed`) |
| The meal's summary names a closest record ("Nutrition for <food> is taken from the closest USDA record, <record>.") and marks an estimate ("Nutrition for <food> is a model estimate, <basis>."). | `src/lib/pipeline/wording.ts` line 8 (`plainConsumed`) |
| `uploadManager.remove(id)` drops the entry from memory and calls the store's `remove(id)`. | `src/lib/posts/upload-manager.ts` lines 320–322 |
| The transcribe route answers 401 with no signed-in user; 400 "A post is required." for a malformed post id; 404 "Post not found." for a post the caller does not own; 400 "Send a WAV recording up to two minutes." for audio under 46 bytes, checked after the post check. | `src/app/api/transcribe/route.ts` lines 11, 21, 23, 24 |
| `createClient()` in `src/lib/supabase/client.ts` returns the browser Supabase client. `UploadChip.tsx` already calls `createClient()` then `db.auth.getSession()` and reads `session.user` the same way PR 1 does. | `src/lib/supabase/client.ts` lines 4–11; `src/components/UploadChip.tsx` line 26 |
| `dismissHint` stays exported from `src/lib/profile/hints.ts`; PR 1 does not edit that file. | `git show origin/main:src/lib/profile/hints.ts`, line 21, Nov 15 |
| `FirstRunHint` is mounted in `Thread.tsx` line 85, `CaptureSheet.tsx` lines 504 and 536, and `ThumbsFeedback.tsx` line 35 (once per feed card). | `grep -rn "<FirstRunHint" src` |
| The about page already holds the server client as `db` and the signed-in user as `user`. The Profile page calls `getProfileGrid(supabase, user.id)` with the same kind of client and passes the result to `<ProfileGrid posts={posts} />`; `ProfileGrid` is a named export. | about page line 16; `src/app/(tabs)/profile/page.tsx` lines 14, 17, 29, 50; `src/components/ProfileGrid.tsx` line 5 |
| None of the new words contains a banned word. | banned list in `scripts/wording-inventory.mjs` line 18 |
| `tests/wording-inventory.test.mjs` builds its own sample text and does not read the tracked-terms list for "Log again". `docs/wording/inventory.md` is a tracked file written by `node scripts/wording-inventory.mjs`. | test lines 8–27; `git ls-files docs/wording`; script lines 3–5, 207 |
| `traceContext` accepts `postId: string | null`. `isUuid` is a type guard taking any value. | `src/lib/trace/context.ts` line 3; `src/lib/posts/items.ts` line 18 |
| At each mic mount point the names used are in scope: `p.caption`, `p.setCaption`, `busy` (LightComposer lines 63, 123); `caption`, `setCaption`, `posting` (CaptureSheet line 601); `caption`, `setCaption`, `busy` (IntakeSheet line 135); `query`, `setQuery` (SearchBox line 19). | each line read Nov 15 |
| main has no branch protection, no rulesets and no workflows; merge-commit, squash and rebase are allowed; auto-merge is off; the account every agent acts as is the repository's only collaborator, has admin rights, and made the last 12 merges. | Run again Nov 15, 12:40 UTC: `gh api repos/…/branches/main/protection` → 404 "Branch not protected"; `…/rulesets` → `[]`; `gh api repos/…` → the three merge kinds `true`, `allow_auto_merge` `false`; `…/collaborators` → 1, admin, the same login as `gh api user`; `gh pr list --state merged --limit 12` → one merger, the same login; `git ls-tree -d origin/main` shows no `.github` |
| `import { queueTick } from "@/lib/queue/tick";` occurs once in the tick route; `queueTick(admin, holder, ttlSeconds = 300)` passes its third argument to `tryAcquireLease`. `renewLease(admin, holder, ttlSeconds = 300)` passes its third argument to `renew_worker_lease`. | `src/app/api/jobs/tick/route.ts` line 5; `src/lib/queue/tick.ts` lines 28–35; `src/lib/queue/lease.ts` |
| `git worktree list` shows only the main checkout. `scripts/cleanup.sh`, `docs/coder-contract.md` and `docs/planner-contract.md` exist. `.env.test.local` exists in the main checkout. | `git worktree list`; `ls`, Nov 15 |
| The env file `test:stack` writes holds the two local test users under the keys `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `TEST_USER2_EMAIL`, `TEST_USER2_PASSWORD`; `scripts/lib/session.mjs` signs in with them. The private `.env.local` holds the same four keys for the two production test accounts. | key names only, `cut -d= -f1` on both files; `scripts/lib/session.mjs` lines 4–8 |
| The Days screens' own words are "Selected day", "Choose a day", "Try again", "Go to" and "Close month list". | `grep` of `DaysView.tsx` lines 194–200 and `GoToMonthSheet.tsx` line 9 |
| The repository's only audio fixture is a tone, not speech. | `find . -name "*.wav"` → `scripts/fixtures/tone.wav` |
| `npm test` refuses to run unless its endpoints are loopback and `MFA_TEST_DISPOSABLE=1`; it reads `TEST_ENV_FILE`. `test:stack` refuses an existing env file or data directory and reads `TEST_STACK_DIR` and `TEST_ENV_FILE`. The local app's default port is 60260. `lint` is `eslint`. | `scripts/test.mjs` lines 5–14; `scripts/test-stack.mjs` lines 7–17; `scripts/test-app.mjs` line 4; `docs/testing.md` lines 9–15; `package.json` |
| The transcribe test's harness calls exist. | `scripts/lib/session.mjs`; `tests/copy-operations-route.test.mjs` lines 1–12 |
| Every "Find" text in Part 1 occurs exactly once in its file on `origin/main`. | a script counted all of them, Nov 15; PR 8's #324 Find texts counted again in the fifth pass with `git show origin/main:<file>` and Python's `str.count` |
| With every edit of Part 1 as it stood after the second pass applied to a copy of main, `npx tsc --noEmit` reports nothing. See the line "Run in the fifth pass" at the end of PR 8. | run Nov 15 (second pass) on a scratch copy outside the repository; fourth pass in memory |
| `npm run lint` on unmodified main reports 3 errors and 14 warnings. The errors are `prefer-const` on `slowTimer` and two `react-hooks/set-state-in-effect`, one of them at `OutlineOverlay.tsx` line 68. The copy edited as of the second pass reports the same 3 and no others. | `npx eslint` on both copies, Nov 15 |
| `npm test` on unmodified main: 692 tests, 28 fail, 6 skipped, about 6 minutes. The planner's copy was not a git checkout, so there `tests/estimate-rollout-compatibility.test.mjs` also failed (it runs `git show`); run with the repository's git data it passes 3 of 3. The 28 are the list below. No test passes on main and fails on the edited copy. | both runs Nov 15, against a disposable stack; the git-data run Nov 15 |
| With PR 6, PR 13 and PR 14 applied, every one of the 28 passes. With every edit of Part 1 as it stood after the second pass applied to a fresh copy of main, `npm test` gave: 696 tests, 690 pass, 0 fail, 6 skipped. That run did not contain the tests added later: PR 8's photo test and its #324 cases, PR 6's #702 case, and PR 13's three new files. Each later addition that was run is named where it appears, with how; PR 8's photo test was not run. The suite's total with them was not measured. | each file run alone on a copy of main with only the repairs and on the full copy; the whole suite on the full copy, Nov 15 (second pass) |
| `npm run test:db` needs the app running (five of its tests call it). With unmodified main's files and the app stopped: 49 tests, 6 fail (five could not reach the app; `today-summary` failed in its own clean-up). With every edit in Part 1 and the app running: 49 pass, 0 fail. The planner did not run it on unmodified main with the app running; by reading, `user-cap` fails there too, because the route and limit files it tests are not changed by this plan. | run Nov 15 on the disposable stack |
| The new test in PR 4 passes. The new test in PR 13 passes. With PR 6's edits as written here, `tests/save-meal-readiness.test.mjs` passes 6 of 6. | the full run above; `node --env-file=<env> --import ./tests/fixtures/local-providers.mjs --import tsx --test tests/<file>`, Nov 15 |
| `npm run test:stack` returns once its services are up, reads migrations from the checkout it is run in, and fails to start PostgreSQL when `TEST_STACK_DIR` is a long path (a 94-character path failed; a 26-character one worked). Its local test user 2 is `local-test-2@example.com`. | run Nov 15; `scripts/test-stack.mjs` lines 8, 37; the auth container's log |
| `needsPolling` is a function declared inside the same effect as the edited lines of `RealtimePost.tsx` and is true while the card's meal is unfinished or still waits for its card image or item values. | `src/components/RealtimePost.tsx` line 44; the edit is at lines 102–104 |
| `createAdminClient()` returns the service-role Supabase client. | `src/lib/supabase/admin.ts` line 5 |
| `reserveFeedPhoto()` returns a release function, or `null` when four resizes are already running. `resizeSharpPhoto(source: Buffer, box: number)` returns a WebP `Buffer` and throws when the resize takes over 3 seconds or the result is over 600,000 bytes. | `src/lib/posts/feed-photo.ts` lines 10–15, 64–70 |
| `post_media` has `id`, `post_id`, `storage_path` and `kind` (default `photo`; the other kind is `card`). `posts` has `deleted_at`. The storage bucket is `media`. `createSignedUrl` on it is how the signed-in photo route already falls back. | `0001_init.sql` lines 40–47; `0008_post_media_kind.sql` line 1; `0036_soft_delete_posts.sql` line 3; the signed-in route, lines 37–41 |
| The sign-in guard does not run on `/p/…`: its matcher lists `/`, `/search`, `/days`, `/profile`, `/posts` and `/admin` only. So the new route's answer carries no cookie. The service worker handles only `/api/media/feed/…` and `.feed.jpg` photo addresses and leaves `/p/…` to the network. | `src/middleware.ts` lines 62–64; `public/sw.js` lines 198–203 |
| Every place that turns a photo address into a `srcset` goes through `feedPhotoSrcSet`: Home's first photo, `Carousel.tsx`, `PostOpenFrame.tsx` line 37 and `OutlineOverlay.tsx` line 80. The last two get no `sizes` in PR 8, so there the browser assumes the photo is as wide as the screen and may pick a larger copy than needed; the photo is never less sharp. | `grep -rn "feedPhotoSrcSet(" src` |
| The latest migration on main is `0062`. `.env.local` holds `SUPABASE_DB_URL`. | `ls supabase/migrations`; key names only |
| The thumb icon is drawn as an outline at rest and filled when chosen or pressed, so black at rest still differs from chosen. No test names `text-off` or `ThumbsFeedback`. | `src/components/ThumbsFeedback.tsx` line 36; `grep -rn "text-off" tests` → nothing |
| `tests/upload-guard.test.mjs` already has a store with `put`, `putIntent`, `allIntents` and a `harness()` that returns `{manager, store, rows}`. Its first test fails on main (in the list below); the others pass. It fails because pressing Post while the first upload pass is still running queues one more pass, so a dead connection is tried six times, not three, before the meal shows as failed (`upload-manager.ts`, `post()` sets `rerun`; added by PR #644 on Nov 5). | file lines 14–15; the full run above; `git log -S'entry.rerun = true'` |
| `tests/label-reading.test.mjs` and the test "online and explicit retry skip photo-lost attachments without network work" pass on main. `tests/drain-lease.test.mjs` passes on main. | the full run above |
| The small feed copy (`v1.webp`) fails for every photo taken since the sharper camera: its resize refuses a source over 2,000,000 pixels, and the stored feed copy is now up to 1920 × 1440 (2,764,800 pixels). The route then answers with the 1920 px JPEG. This is the "1920 × 1440 JPEG" GrokBot saw on Nov 15. With the limit at 4,000,000 the same source resizes to 512 × 384 in under 0.1 s. | `src/lib/posts/feed-photo.ts` lines 52, 56; `src/lib/media/reencode.ts` line 14; a 1920 × 1440 JPEG passed to `resizeFeedPhoto` on Nov 15: "Input image exceeds pixel limit" before, 512 × 384 after |
| `tests/feed-photo.test.mjs` asserts that a 1500 × 1500 source is refused. With PR 8's edit it asserts 2100 × 2100, and `tests/feed-photo.test.mjs` and `tests/sharp-feed-photo.test.mjs` pass 12 of 12. | run Nov 15 on both copies |
| Why each of the other failing tests fails on main: `card-polling`, `feed-unavailable-retry`, `needs-input-batch`, `feed-removal` and `desktop-review` give the component a fake `setInterval`, and since Nov 4 (commit `228b7335`) the components poll with `setTimeout` and back off; `desktop-review` also feeds the old answer shape; `feed-cache-lifecycle` and `feed-removal` do not stub `@/lib/posts/upload-target` and `@/lib/posts/home-today`; `servings-sql` treats 0.1 servings as out of range, and migration `0061_servings_floor.sql` made 0.1 the floor; `local-time` expects "PM", and this machine's locale (en-CA) prints "p.m." (with `LANG=en_US.UTF-8` it passes); `sharp-image-identity` does not pass `sharp`, and also meets a real defect (next row). | each file run alone and read, Nov 15 |
| A real defect behind `sharp-image-identity`: in the meal detail with outlines on, when the first photo changes while the screen stays open, the old photo's sharp copy stays on screen until the new one has loaded, and for good if it never loads. `DetailImage` keeps one loaded address and does not record which photo it belongs to. | `src/components/OutlineOverlay.tsx` lines 59–63; the test's fourth case fails on it with `sharp:true` and passes with PR 14's edit |
| A bookmark tapped on a meal that is not ready and not failed shows filled at once and waits up to 120 seconds for the meal to finish; if it does not, the bookmark empties and nothing is said. A meal whose status is `needs_input` never finishes on its own. The message for a failed meal is a bar fixed 100 px above the bottom of the screen, drawn by `SavedMealListeners.tsx`, so it can lie over a card's text. | `src/components/PostActions.tsx` lines 23–33; `src/components/SavedMealListeners.tsx` lines 26, 31 |
| `save-meal-blocked` is sent only by `PostActions.tsx` and heard only by `SavedMealListeners.tsx`. | `grep -rn "save-meal-blocked" src` |
| Every `save-meal-blocked` event carries `{postId, message}`. On main it is sent from two places, both for a failed meal, and both pass `detail:{postId,message:'This meal did not finish analysis and cannot be saved.'}`. PR 6 adds two more senders with the same shape. So the new listener under the buttons, which shows a message only when `detail.postId` is its own meal, receives the failed-meal message. | `git show origin/main:src/components/PostActions.tsx` lines 24 and 32, Nov 15; PR 6's edits below |
| The meal detail keeps the sharp photo's address in `sessionStorage` under `mfa-original-<photo id>`, as JSON `{"url":…,"expiresAt":<milliseconds>}`. It is written only when the detail shows the sharp photo and the photo's address carries a signed expiry; an entry with no `url`, or an `expiresAt` that is not a number or is past, is removed when read. | `src/components/OutlineOverlay.tsx` lines 33–54 and 57, Nov 15 |
| The build id is `local-<milliseconds>` on a local build, made new by every build, and the page carries it as the `data-build` attribute of `<html>`. | `next.config.ts` line 8; `src/app/layout.tsx` line 24, Nov 15 |
| A finished meal with no drink has the menu row "Add photo", on its Home card and on its detail. The slide arrows are buttons labelled "Previous slide" and "Next slide"; they are drawn only at desktop width. | `src/components/PostCard.tsx` line 86; `PostDetailHeader.tsx` line 69; `Carousel.tsx` line 91 (`hidden … desktop:flex`); `OutlineOverlay.tsx` line 241, Nov 15 |
| The capture sheet opens when the page receives the event `open-entry` with `{entry:'camera'}`, and for an added photo with `{entry:'camera',forPost:<meal id>,notEaten:<true or false>}`. An open capture sheet takes photos from the event `capture-files` with `{files:[File]}`. Fleet 15's script attached its photos this way. | `src/components/NavigationControls.tsx` lines 23 and 29; `src/components/CaptureSheet.tsx` line 461; `scripts/run15-b-production.mjs` lines 63–66 and 77, Nov 15 |
| The repository's meal photos for tests are `scripts/fixtures/plate2.jpg` (a roast dinner, 1280 × 1280, 471,557 bytes) and `scripts/fixtures/plate3.jpg` (70,066 bytes). `plate1.jpg` is an empty plate. The command in "Local fixtures" prints a script that parses. | `ls -l`; `sharp` metadata; `scripts/fixtures/ATTRIBUTION.md`; the command's output parsed with `new Function`, Nov 15 |
| On the local stack the model's answers are scripted, the photo store is a local file store, and posting a meal calls the worker (`/api/posts` calls `/api/jobs/tick` after it answers). | `tests/fixtures/local-model.mjs`; `tests/fixtures/local-gateway.mjs`; `src/app/api/posts/route.ts` lines 13–14; `docs/testing.md`, Nov 15 |
| A failed meal's card shows a sentence chosen by the start of `fail_reason` ("meta:" gives "The analysis service refused this request. Try again.") and a "Try again" button. An unfinished meal's card is drawn with the label "Processing". | `src/lib/worker/failure-message.ts`; `src/components/PostCard.tsx` lines 51–55 and 63–68, Nov 15 |
| The guards on `public.posts` refuse a change only when it is made as the roles `authenticated` or `anon`, and one more refuses a status change only on a meal that holds a drink recorded from the drink sheet. `psql` on the disposable database runs as `postgres`. | `guard_analysis_marker` (`0007`), `protect_pending_items` (`0033`), `protect_identify_identity` (`0032`), `protect_agent_attribution` (`0031`), `guard_render_time_zone` (`0027`), `keep_drink_record_consistent` (`0029`), read Nov 15; `scripts/test-stack.mjs` line 18 |
| Retake on a lost photo already removes the old upload: the chip's button opens the camera and then calls `uploadManager.remove`. Uploads are kept in the browser's IndexedDB database `mfa-uploads`, in the stores `drafts` and `intents`. | `src/components/UploadChip.tsx` line 30; `src/lib/posts/upload-store.ts` lines 46–50 |
| The three read-only queries in "Reads on production" run without error. | each run on the disposable database, Nov 15 |
| The local sign-in service is the container `mfa-test-auth-60260`; its log has one line per request with a `"path"` field. The tick route marks a cold start with the header `x-tick-cold: 1`. The disposable database has `public.today_summary(text)`. | `podman ps`; `podman logs`; `src/app/api/jobs/tick/route.ts` line 16; `pg_proc`, Nov 15 |
| `/api/jobs/drain` is a GET. It answers 400 without `holder` and 409 when the holder does not hold the live lease. | `src/app/api/jobs/drain/route.ts` lines 8–20 |
| The capture sheet's caption field is an input with `aria-label="Caption"` (its placeholder reads "What did you eat?"). Its post button reads "Post" and is disabled while posting, while a photo is still being prepared, and while there is neither a caption nor a photo. | `src/components/CaptureSheet.tsx` lines 601 and 611; `src/components/ui/Field.tsx` (an `<input>`), Nov 15 |
| The sign-in page has an input labelled "Email", an input labelled "Password" and a button "Sign in". | `src/app/(auth)/sign-in/page.tsx` lines 29–32, Nov 15 |
| A meal's detail opens with its outlines on: `OutlineOverlay` starts with `outlines` true (line 134), draws each food's box and name on the first photo when the food has a box (lines 230–237), and shows the label "Outlines · tap one to edit" on that photo (line 239). Nothing is switched on by hand. | `src/components/OutlineOverlay.tsx`, Nov 15 |
| A meal waiting for an answer has `status='needs_input'` and a `needs_input` value `{question, short, options}`, where `short` is "Clarification needed" or "No food found" and `options` holds up to three strings. The Home question strip lists the owner's meals with that status and shows "A question about this meal" for "Clarification needed". A question that fails the wording rule is shown as "What did you eat?". | `src/lib/pipeline/needs-input.ts` lines 1–10; `src/components/NeedsInputStrip.tsx` lines 45–50 and 94; `supabase/migrations/0011_posts_needs_input.sql` (`persist_analysis_question`), Nov 15 |
| Home's server sends the first 6 meals; the feed loads more as the page is scrolled. | `src/app/(tabs)/page.tsx` line 95 (`getFeed(…, 6, …)`), Nov 15 |
| `APP_URL` in the private `.env.local` is `https://my-food-ai-ten.vercel.app`, the production address the earlier fleets' scripts use. | `grep ^APP_URL= .env.local`, host only, Nov 15; `scripts/run15-b-production.mjs` line 10 |
| Fleet 15 drove a Firefox over WebDriver BiDi and attached `plate2.jpg` and `plate3.jpg` with one `script.evaluate` call each, carrying the whole photo as base64 (about 629,000 and 94,000 characters); both meals posted ("Overlapping photos closed on the first press in 474ms and 365ms"). The script's engine note reads "Firefox native BiDi … no CPU throttle available". | `scripts/run15-b-production.mjs` lines 4, 24, 51–66; `docs/run15-report.md` line 116, Nov 15 |
| Firefox 140.16.0esr is installed at `/usr/bin/firefox`. A headless Chromium on this machine timed out on `Page.navigate` in Fleet 19. | `firefox --version`, Nov 15; `docs/run19-final-report.md` line 28 |
| On a Home open the server reads today's meals three times: `getDayTotals` for the six day circles including today (`page.tsx` line 58), then inside `homeToday` the database function `today_summary` and then `getDays` for today alone (`home-today.ts` lines 24 and 27), one after the other. `today_summary` adds the stored values of today's ready meals; `getDays` and `getDayTotals` pass each item through `normalizeStoredNutrition` first. `getDayTotals` counts a ready meal only when its `needs_input` is empty; `getDays` and `today_summary` count every ready meal. `homeToday` is called by Home and by `/api/today`, which the desktop column calls only when it has no server copy or after a meal changes. | `src/app/(tabs)/page.tsx` lines 51–67 and 128–137; `src/lib/posts/home-today.ts`; `src/lib/posts/days.ts` lines 38–109 and 150–189; `supabase/migrations/0062_today_summary_nulls.sql`; `src/app/api/today/route.ts`; `src/components/DesktopToday.tsx` line 16, Nov 15 |
| `dayPostReceipt(id, eatenAt, items)` builds the per-meal receipt the circles use from items that carry `name` and `calories`. A `DayPost` from `getDays` holds `items` of type `CurrentItem` and `totals` of type `MealTotals`. `tests/home-day-totals.test.mjs` and `tests/home-photo-preload.test.mjs` load `page.tsx` with every import stubbed and fail on any import they do not stub; both stub `@/lib/posts/home-today`. `tests/feed-cache-lifecycle.test.mjs` loads it too (PR 14 adds that stub). No other test stubs or calls `homeToday`. | `src/lib/posts/days.ts` lines 6 and 139–146; the two test files, lines 13–34, 46–64 and 52; `grep -rn "home-today" tests`, Nov 15 |
| `getDayTotals` returns its days in ascending date order whatever order it is given: it sorts the dates (`const wanted = [...new Set(dates)].sort()`) and returns one entry per sorted date. So on main Home's six circle totals arrive oldest first and today last, and PR 8's #324 part (`[...earlier, current.total]`) keeps that order. Neither reader depends on the order anyway: `DayRings` finds each day's total with `find(entry=>entry.day===day)`, and `Feed` puts the totals in a `Map` keyed by `day`. | `src/lib/posts/days.ts` lines 150–153 and 188; `src/components/DayRings.tsx` line 58; `src/components/Feed.tsx` lines 94 and 96, Nov 15 |
| Home's server page is three independent parts, each inside its own `Suspense` and each catching its own failure: `HomeDays` (the circles) catches any failure of its reads and draws the circles without totals (`try`/`catch`, lines 77–87; `Suspense`, line 144); `HomeFeed` reads the totals with `homeDayTotals().catch(()=>[])` and catches the rest, leaving the browser to load the feed (line 125; `Suspense`, line 151); `HomeToday` catches a failed read and hands the column no server copy, so it loads in the browser (lines 132–135; its `Suspense`, line 141). | `src/app/(tabs)/page.tsx`, Nov 15 |
| Node 22.23.2 is installed and has a built-in `WebSocket` (`typeof WebSocket` is `function`). | `node --version`; `node -e "console.log(typeof WebSocket)"`, Nov 15 |

**Tests that fail on main (28; not caused by this plan; all repaired by PRs 6, 13 and 14):**
`tests/profile-avatar.test.mjs` (2) and `tests/save-meal-readiness.test.mjs` (6): PR 6. `tests/upload-guard.test.mjs` (the first test): PR 13. The rest, 19 tests in nine files: PR 14.
`tests/card-polling.test.mjs` (3 tests, "clearTimeout is not defined"); `tests/desktop-review.test.mjs` ("Today uses the active zone…", "setTimeout is not defined"); `tests/feed-cache-lifecycle.test.mjs` (8 tests, "Unexpected page dependency @/lib/posts/home-today" and "Unexpected feed dependency @/lib/posts/upload-target"); `tests/feed-removal.test.mjs` (1); `tests/feed-unavailable-retry.test.mjs` (1, "clearTimeout is not defined"); `tests/local-time.test.mjs` (2); `tests/needs-input-batch.test.mjs` (1, "document.addEventListener is not a function"); `tests/servings-sql.test.mjs` (1); `tests/sharp-image-identity.test.mjs` (1); `tests/upload-guard.test.mjs` (the first test).


**Premises (unchecked; the coder verifies before relying on them):**
- The size of the transcribe limit's window and count. The planner read only its refusal text.
- A photo meal posted in a browser on the local build finishes as `ready` within a minute. The planner ran the test suite against the local stack, not a browser post. Fixture F1 says what to do if it does not.
- The two `update` commands in "Local fixtures" (F2, F3) and the seed command in "Checks on the local build" succeed. The planner read every guard on the table (fact above) and ran none of the three.
- A meal set to `processing` by F3 stays unfinished while it is looked at. The planner found no code that finishes a meal with no job, and did not watch one.
- The new test in PR 8 passes. The planner wrote it in the third pass and could not run it.
- A meal posted on the local build gets its numbers card: a `post_media` row of kind `card`, which is what makes the card a slide (`src/lib/posts/feed.ts` line 69; `Carousel.tsx` line 83). The planner did not check that the local stack renders it. F1's step records it; PR 3's second-slide look and check K18 depend on it.
- PR 8 builds with `next build`. The planner type-checked and linted PR 8's #324 part and ran its tests in memory ("Run in the fifth pass", PR 8), not the build or the whole suite.
- `firefox --headless --no-remote --profile /tmp/mfa-f21/firefox --remote-debugging-port=9311 about:blank` starts a headless Firefox that answers WebDriver BiDi at `ws://127.0.0.1:9311/session`. Fleet 16 saw the PPLX Firefox run with `--remote-debugging-port` (`docs/plan-run16.md` line 57); the planner did not start one.
- This Firefox carries out `network.addIntercept`, `network.failRequest` and `network.continueRequest`, used below to make the browser offline and to block one address. The planner did not try them. If they are refused, the steps that need them are reported as not done.
- Firefox offers no network slowing over BiDi. The planner found none and did not look further. The steps that name the slow-4G profile are run without slowing, and the result says "not slowed".
- That the failed-upload overlay in `UploadingPost.tsx` is the "Not posted yet" card in the owner's screenshots. If the overlay does not appear for a failed added photo, the chip's Remove button still meets the done line.
- That the per-user limit works on the disposable stack for the five requests the new test sends. `tests/db/user-cap.test.mjs` exists; it was not read.
- That the seeding command in "Checks on the local build" inserts its rows. The planner ran it once with a psql variable, which failed on syntax, and did not run the corrected form given here. Its columns are the ones PR 4's passing test inserts.
- That anything in the suite tests PR 9. The repaired `card-polling` tests pass with and without PR 9's change, so they do not test it; its page look and its request count are the only check.
- That a "No food found" meal on Profile has the status `needs_input`. GrokBot's reading (filled bookmark, no request, second tap does nothing) fits a meal that is neither ready nor failed; the planner did not read that row on production.
- That renaming `today_summary` in the disposable database makes Home's server read fail the way a production failure would (check K13). Not tried in a browser.

## PR 1 — branch `fix21/feed-hint` — #688
**Service:** the browser Supabase client (`src/lib/supabase/client.ts`) owns the read. **Boundary:** `FirstRunHint.tsx` calls it.
**Blast radius:** every feed card, the capture sheet and the thread mount this file. If it fails, hints stop showing; the feed still works. It stops the Home re-render on every card mount.
**Page look:** Home at 390 wide, with the seeded meals of step 5c. Scroll down until more than the first 6 meals have loaded (that is page two), and on to the 20th meal. Reference: production Home. Expected difference: none visible.

File `src/components/FirstRunHint.tsx`.

Find:
```
import { dismissHint, getHintState } from "@/lib/profile/hints";
```
Replace:
```
import { dismissHint } from "@/lib/profile/hints";
import { createClient } from "@/lib/supabase/client";
```
Find:
```
const claimed = new Set<string>();
```
Replace:
```
const claimed = new Set<string>();
// One profile read per page load, shared by every card. A server action here
// re-rendered Home and remounted the feed.
let hintState: Promise<{ userId: string; seen: string[] } | null> | null = null;
function loadHintState() {
  hintState ??= (async () => {
    const db = createClient();
    const { data: { session } } = await db.auth.getSession();
    const userId = session?.user.id;
    if (!userId) return null;
    const { data, error } = await db.from("profiles").select("hints_seen").eq("id", userId).single();
    if (error || !data) return null;
    return { userId, seen: [...(data.hints_seen as string[])] };
  })().catch(() => null).then(state => { if (!state) hintState = null; return state; });
  return hintState;
}
```
Find:
```
      setVisible(false);
      // Keep the session claim while retrying a transient action failure.
```
Replace:
```
      setVisible(false);
      void hintState?.then(state => { if (state && !state.seen.includes(hint)) state.seen.push(hint); });
      // Keep the session claim while retrying a transient action failure.
```
Find:
```
    void getHintState(hint).then((state) => {
      if (!live || !state || state.seen) return;
```
Replace:
```
    void loadHintState().then((state) => {
      if (!live || !state || state.seen.includes(hint)) return;
```
Done when: on production at 390 wide, scrolling into page two sends no POST to `/`, the scroll position never jumps, and swiping the photos of a meal with a leftovers photo moves only that meal's photos.

## PR 2 — branch `fix21/about-meals` — #568
**Service:** `getProfileGrid` in `src/lib/posts/grid.ts`. **Boundary:** the about page.
**Blast radius:** `/profile/about` only. Adds one read of the viewer's own posts under row-level security. If it fails, that page errors.
**Page look:** `/profile/about`. Reference: the Profile page's grid. 

File `src/app/(tabs)/profile/about/page.tsx`.

Find:
```
import {verifiedUserId} from '@/lib/auth/verified-user';
```
Replace:
```
import {verifiedUserId} from '@/lib/auth/verified-user';
import {ProfileGrid} from '@/components/ProfileGrid';
import {getProfileGrid} from '@/lib/posts/grid';
```
Find:
```
if(!user)redirect('/sign-in');
```
Replace:
```
if(!user)redirect('/sign-in');
 const posts=await getProfileGrid(db,user.id);
```
Find:
```
  <div className="mt-6 flex flex-col gap-2"><Link href="/profile" className="flex min-h-tap items-center text-body font-semibold">Your meals ›</Link>
```
Replace:
```
  <h2 className="mt-6 text-sheet-title">Your meals</h2>
  {posts.length?<ProfileGrid posts={posts}/>:<p className="mt-2 text-detail text-muted">No meals yet.</p>}
  <div className="mt-6 flex flex-col gap-2">
```
Done when: the page lists the signed-in judge's own meals and not only a link.

## PR 3 — branch `fix21/words` — #294, #657
**Service:** none; text only. **Boundary:** the components and the card text builder below.
**Blast radius:** labels on the post buttons, the post menu, the sheet, the Home strip and new nutrition cards. Stored card images keep the old words. `scripts/run17-checks.mjs` finds the Home question by its text; PR 11 changes that script to match both the old and the new words, so the two PRs do not touch the same file.
**Page look:** Home (post buttons and post menu of meal F1, the question strip of meal F5), the detail of F1 (its menu), the sheet the "Eat this again" button opens, F1's second slide. Reference: production, with only these words changed.

| File | Find | Replace |
|---|---|---|
| `src/components/PostCard.tsx` | `label:'Log again'` | `label:'Eat this again'` |
| `src/components/PostDetailHeader.tsx` | `label:'Log again'` | `label:'Eat this again'` |
| `src/components/LogAgainSheet.tsx` | `label="Log again"` | `label="Eat this again"` |
| `src/components/LogAgainSheet.tsx` | `>Log again<` | `>Eat this again<` |
| `src/components/LogAgainSheet.tsx` | `aria-label="Close Log again"` | `aria-label="Close Eat this again"` |
| `src/components/NeedsInputStrip.tsx` | `"A question about this meal"` | `"A quick question about your meal"` |
| `src/lib/pipeline/card-data.ts` | `` `Drank in this meal: `` | `` `Drinks with this meal: `` |
| `tests/drinks-from-items.test.mjs` | `'Drank in this meal: 355 ml Cola` | `'Drinks with this meal: 355 ml Cola` |
| `scripts/wording-inventory.mjs` | `  "Drank in this meal",` | `  "Drinks with this meal",` |
| `scripts/wording-inventory.mjs` | `  "Log again",` | `  "Eat this again",` |
| `scripts/wording-inventory.mjs` | `  "A question about this meal",` | `  "A quick question about your meal",` |
| `scripts/run14-control-table.mjs` | `text:'Log again'` | `text:'Eat this again'` |
| `README.md` | `A food with no matching reference is shown as unavailable, never guessed.` | `When no exact reference exists, the closest generic USDA record is used and named. When none is close, Muse Spark estimates typical nutrition and the meal says it is an estimate. A food is shown as unavailable, with the reason, only when the model gives no estimate or does not treat it as food.` |

After the edits, run `node scripts/wording-inventory.mjs` in the worktree and commit the regenerated `docs/wording/inventory.md` in this PR.

The post button's own label (`aria-label="Log again"` in `PostActions.tsx`) is changed in PR 6, and the meal detail's copy of the question heading (in `OutlineOverlay.tsx`) is changed in PR 14, because those PRs also edit those files and no two PRs touch the same file.
Leave unchanged: the event name `log-again`, the file and component name `LogAgainSheet`, `tests/wording-inventory.test.mjs` (its own sample text), and `tests/saved-meals.test.mjs` (an error message inside SQL).
"Additional food" is not in the app; "Also eaten" changes nothing.
Done when (this PR's part): the new words show wherever the old ones did, and the README sentence agrees with `src/lib/fdc/match.ts`.
**Not met by this PR, and reported as such:** the item's done line also needs the owner's ruling on every term and AGY's second opinion. The Days names (fact above) were not put to the owner and are not changed. The item stays open for them.

## PR 4 — branch `fix21/voice-fields` — #693
**Service:** `/api/transcribe` and `src/lib/meta/transcribe.ts` own the transcription. **Boundary:** the new `VoiceButton` calls `VoiceRecorder`, which calls the route.
**Blast radius:** the route now accepts a recording with no post. The caller must still be signed in and still passes the per-user limit (fact above); when a post id is sent, ownership is still checked. Each clip is a paid model call. If the route change fails, the comment-box mic breaks too.
**Page look:** new-post caption (phone camera sheet and the composer), the drink sheet, Search, a meal's comment box. Reference: the mic in the comment box on production.

New file `src/components/VoiceButton.tsx`:
```
'use client';
import {useEffect,useRef} from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
// The mic for a typing field that has no post yet: spoken words are added to the field's text.
export default function VoiceButton({value,onChange,max,disabled=false}:{value:string;onChange:(next:string)=>void;max:number;disabled?:boolean}){
 const latest=useRef(value);
 useEffect(()=>{latest.current=value;},[value]);
 return <span className="flex shrink-0 flex-wrap items-center justify-end"><VoiceRecorder label="Speak" disabled={disabled} onActiveChange={()=>{}} onTranscript={text=>onChange(`${latest.current}${latest.current.trim()?' ':''}${text}`.slice(0,max))}/></span>;
}
```

| File | Find | Replace |
|---|---|---|
| `src/components/VoiceRecorder.tsx` | `({postId,disabled,onTranscript,onActiveChange}:{postId:string;disabled:boolean;` | `({postId,disabled,onTranscript,onActiveChange,label='Record a correction'}:{postId?:string;label?:string;disabled:boolean;` |
| `src/components/VoiceRecorder.tsx` | `form.append('postId',postId);` | `if(postId)form.append('postId',postId);` |
| `src/components/VoiceRecorder.tsx` | `'Stop recording':'Record a correction'}` | `'Stop recording':label}` |
| `src/app/api/transcribe/route.ts` | `traceContext.run({postId},` | `traceContext.run({postId:typeof postId==='string'?postId:null},` |
| `src/components/LightComposer.tsx` | `import {toLocalInput} from '@/lib/posts/eaten-at';` | the same line, then a new line `import VoiceButton from '@/components/VoiceButton';` |
| `src/components/LightComposer.tsx` | `className="mt-2 w-full resize-none text-[14px] outline-none"/>` | the same text, then `<VoiceButton value={p.caption} onChange={p.setCaption} max={2000} disabled={busy}/>` |
| `src/components/LightComposer.tsx` | `outline-none placeholder:text-muted"/></div>` | `outline-none placeholder:text-muted"/><VoiceButton value={p.caption} onChange={p.setCaption} max={2000} disabled={busy}/></div>` |
| `src/components/CaptureSheet.tsx` | `import { tokens } from "@/lib/theme/tokens";` | the same line, then a new line `import VoiceButton from "@/components/VoiceButton";` |
| `src/components/CaptureSheet.tsx` | `placeholder="What did you eat?" />` | the same text, then `<VoiceButton value={caption} onChange={setCaption} max={2000} disabled={posting} />` |
| `src/components/IntakeSheet.tsx` | `import type { DrinkRow } from "@/lib/intake/hydration";` | the same line, then a new line `import VoiceButton from "@/components/VoiceButton";` |
| `src/components/IntakeSheet.tsx` | `disabled={busy} onChange={event => setCaption(event.target.value)} />` | the same text, then `<VoiceButton value={caption} onChange={setCaption} max={1000} disabled={busy} />` |
| `src/components/SearchBox.tsx` | `import PostCard from "@/components/PostCard";` | the same line, then a new line `import VoiceButton from "@/components/VoiceButton";` |
| `src/components/SearchBox.tsx` | `value={query} onChange={event=>setQuery(event.target.value)}/>` | the same text, then `<VoiceButton value={query} onChange={setQuery} max={200}/>` |

File `src/app/api/transcribe/route.ts`. Find:
```
 if(!isUuid(postId))return NextResponse.json({error:'A post is required.'},{status:400});
 const {data:post}=await client.from('posts').select('id').eq('id',postId).eq('user_id',user.id).maybeSingle();
 if(!post)return NextResponse.json({error:'Post not found.'},{status:404});
```
Replace:
```
 // A caption, drink or search field has no post yet. A comment still names its own post.
 if(postId!==null){
  if(!isUuid(postId))return NextResponse.json({error:'A post is required.'},{status:400});
  const {data:post}=await client.from('posts').select('id').eq('id',postId).eq('user_id',user.id).maybeSingle();
  if(!post)return NextResponse.json({error:'Post not found.'},{status:404});
 }
```
New file `tests/transcribe-access.test.mjs` (the access-rule test; it makes no model call, every case ends before transcription):
```
// Local built application + disposable DB only. No model call: every case stops before transcription.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {signInAsTestUser,signInTestClient} from '../scripts/lib/session.mjs';
const checked=result=>{assert.ifError(result.error);return result.data;};
test('transcribe needs sign-in, checks ownership when a post is named, and accepts no post',async()=>{
 const origin=process.env.APP_URL;for(const endpoint of [origin,process.env.NEXT_PUBLIC_SUPABASE_URL])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(endpoint).hostname));
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}}),{user}=await signInTestClient(2),cookie=await signInAsTestUser(2),other=await signInAsTestUser(1);
 const post=randomUUID();
 const send=async(fields,auth)=>{const form=new FormData();form.append('audio',new Blob([new Uint8Array(10)],{type:'audio/wav'}),'clip.wav');form.append('draftId',randomUUID());for(const [key,value] of Object.entries(fields))form.append(key,value);const response=await fetch(origin+'/api/transcribe',{method:'POST',headers:auth?{Cookie:auth}:{},body:form,signal:AbortSignal.timeout(30000)});return{status:response.status,body:await response.json()};};
 try{
  checked(await admin.from('posts').insert({id:post,user_id:user.id,caption:'Transcribe access fixture',eaten_at:new Date().toISOString(),status:'ready',analysis_initialized_at:new Date().toISOString()}));
  assert.equal((await send({},null)).status,401,'no sign-in is refused');
  assert.equal((await send({postId:'bad'},cookie)).status,400,'a malformed post id is refused');
  const foreign=await send({postId:post},other);assert.equal(foreign.status,404,'another account cannot name this post');assert.equal(foreign.body.error,'Post not found.');
  const own=await send({postId:post},cookie);assert.equal(own.status,400);assert.equal(own.body.error,'Send a WAV recording up to two minutes.','the owner passes the post check');
  const none=await send({},cookie);assert.equal(none.status,400);assert.equal(none.body.error,'Send a WAV recording up to two minutes.','no post passes the post check');
 }finally{checked(await admin.from('posts').delete().eq('id',post));}
});
```
The harness (`signInAsTestUser`, `signInTestClient`, the loopback guard, the posts insert) is copied from `tests/copy-operations-route.test.mjs` (planner read it Nov 15). The test must pass in step 5.

The search field's cut-off of 200 characters is the planner's choice; `src/app/api/search/route.ts` shows no length limit of its own.

The PM's ruling names five fields. Four exist and get the mic here; the comment box has it already. The fifth, a leftovers caption, does not exist in the app (fact above), so nothing is added for it; the report says so.
Done when: on production at phone size, the new-post caption, the drink description, Search and the comment box each show the mic, and a short clip played into the microphone puts its words in the field.

## PR 5 — branch `fix21/remove-failed-upload` — #684
**Service:** `uploadManager.remove` in `src/lib/posts/upload-manager.ts`. **Boundary:** the chip and the failed-upload overlay.
**Blast radius:** a user can now discard a failed added photo; the photo kept on the phone is deleted with it and cannot be recovered. Only uploads that add a photo to an existing meal get the button; failed new posts, drinks and copies are untouched.
**Page look:** Home with a failed leftovers upload: with the browser offline, add a leftovers photo to meal F1 as "Local fixtures" says, with `notEaten:true`. Reference: production, plus the word "Remove". Then set the browser online and tap "Remove", so the failed upload does not sit over Home in the later looks.

File `src/components/UploadChip.tsx`.

Find:
```
(upload.photoLost?<button className="text-detail text-accent" onClick={()=>{void (async()=>{
```
Replace:
```
(upload.photoLost?<><button className="text-detail text-accent" onClick={()=>{void (async()=>{
```
Find:
```
{upload.message??'This photo was not kept. Take it again.'}</button>:<button className="text-detail text-accent" onClick={()=>uploadManager.retry(failed.operationId)}>{failed.kind==='copy'?'Not confirmed · Try again':'Not saved · Try again'}</button>)
```
Replace:
```
{upload.message??'This photo was not kept. Take it again.'}</button><button className="ml-3 text-detail text-muted" onClick={()=>{void uploadManager.remove(upload.operationId).catch(()=>{});}}>Remove</button></>:<><button className="text-detail text-accent" onClick={()=>uploadManager.retry(failed.operationId)}>{failed.kind==='copy'?'Not confirmed · Try again':'Not saved · Try again'}</button>{failed.attachment?<button className="ml-3 text-detail text-muted" onClick={()=>{void uploadManager.remove(failed.operationId).catch(()=>{});}}>Remove</button>:null}</>)
```
File `src/components/UploadingPost.tsx`. Find:
```
onClick={()=>uploadManager.retry(upload.operationId)}>Try again</button></div>}
```
Replace:
```
onClick={()=>uploadManager.retry(upload.operationId)}>Try again</button>{upload.attachment&&<button className="min-h-tap px-4 text-body text-muted" onClick={()=>{void uploadManager.remove(upload.operationId).catch(()=>{});}}>Remove</button>}</div>}
```
Done when (this PR's part): a failed leftovers upload can be removed by the user and stays gone after the app is reopened.
**Not met by this PR, and reported as such:** the error behind the owner's failure written down; the chip not covering the nutrition numbers.

## PR 6 — branch `fix21/test-setup` — #711 (part), #683, #702, #552 (part), and one word of #294
**Service:** the test files and `scripts/test.mjs`; `PostActions.tsx` owns the bookmark's look. **Boundary:** `npm test`; every post's button row.
**Blast radius:** the bookmark under every meal is drawn at full strength at all times (owner ruling 5). Its refusals change (#683): the message now sits under the meal's own button row, not in a bar over the page; a meal waiting for an answer is refused with a reason; a wait that runs out says so. If this fails, a bookmark tap on an unfinished meal shows no message; saving a finished meal is untouched. The post button's screen-reader label becomes "Eat this again". With no file named, `npm test` behaves as today.
**Page look:** Home with one finished meal (F1), one failed (F2) and one still being analysed (F3), made as "Local fixtures" says. Tap the bookmark on each; on F3 wait the 120 seconds. Then open the detail of F5 (the meal with a question) at `/posts/<its id>` and tap its bookmark. Reference: production; the differences are that the unfinished meal's bookmark is not faded; that tapping the bookmark on a failed meal shows its message under that meal's buttons with the failure text and Try again still visible; that F3's bookmark empties after 120 seconds with "This meal is still being analysed. Save it when it finishes."; and that F5's reads "Answer the question about this meal first. Then it can be saved."
**Why they fail on main (planner ran both files alone on Nov 15):** `save-meal-readiness` stubs `PostHandle` without `usePostAuthor`, runs the components with no `setTimeout`, and still asserts the old rule that an unfinished meal's bookmark is disabled; the product now holds the save until the meal is ready and refuses a failed meal. `profile-avatar` stubs `getSession`, but the avatar route calls `getClaims`, so the route throws and answers 503. With the edits below the planner's scratch copy of `save-meal-readiness` passed 6 of 6, and failed 3 of 6 when the line `if(postStatus==='failed'){` in `PostActions.tsx` was changed to `if(false){`; the first two `profile-avatar` tests passed, and the third needs the disposable stack's sign-in, which was not running.

File `src/components/PostActions.tsx`. Two edits in the table, then the #683 edits below it:

| File | Find | Replace |
|---|---|---|
| `src/components/PostActions.tsx` | `aria-label="Log again"` | `aria-label="Eat this again"` |
| `src/components/PostActions.tsx` | `${visibleSaved\|\|ready?'text-text':'text-off'}` | `text-text` |

**#683, the bookmark (GrokBot, Nov 15).** What changes: (1) a refusal is shown as one line under that meal's button row, so it cannot cover the failure text or Try again; the page-wide bar no longer shows it. (2) A meal waiting for the owner's answer is refused at once with "Answer the question about this meal first. Then it can be saved." (3) A bookmark that waited 120 seconds for an unfinished meal empties and says "This meal is still being analysed. Save it when it finishes." A failed meal is still refused with "This meal did not finish analysis and cannot be saved.", sends no request and is not marked saved.

File `src/components/PostActions.tsx`.

Find:
```
  const waitCleanupRef=useRef<(() => void)|null>(null);
```
Replace:
```
  const waitCleanupRef=useRef<(() => void)|null>(null);
  const [notice,setNotice]=useState('');
```
Find:
```
const next=finishBookmark({id:d.savedMealId??null,pending:false},d.savedMealId??null,Boolean(d.failed));bookmarkRef.current=next;setBookmark(next);};
```
Replace:
```
const next=finishBookmark({id:d.savedMealId??null,pending:false},d.savedMealId??null,Boolean(d.failed));bookmarkRef.current=next;setBookmark(next);if(!d.failed)setNotice('');};const refused=(event:Event)=>{const d=(event as CustomEvent<{postId?:string;message?:string}>).detail;if(d?.postId===postId)setNotice(d.message||'This meal cannot be saved.');};
```
Find:
```
window.addEventListener('save-meal-result',receive);window.addEventListener('save-meal',starting);return()=>{window.removeEventListener('save-meal-result',receive);window.removeEventListener('save-meal',starting);};},[postId]);
```
Replace:
```
window.addEventListener('save-meal-result',receive);window.addEventListener('save-meal',starting);window.addEventListener('save-meal-blocked',refused);return()=>{window.removeEventListener('save-meal-result',receive);window.removeEventListener('save-meal',starting);window.removeEventListener('save-meal-blocked',refused);};},[postId]);
```
Find:
```
   if(!ready){
```
Replace:
```
   if(postStatus==='needs_input'){window.dispatchEvent(new CustomEvent('save-meal-blocked',{detail:{postId,message:'Answer the question about this meal first. Then it can be saved.'}}));return;}
   if(!ready){
```
Find:
```
const restored=finishBookmark({id:previous.id,pending:false},previous.id,false);bookmarkRef.current=restored;setBookmark(restored);};
```
Replace:
```
const restored=finishBookmark({id:previous.id,pending:false},previous.id,false);bookmarkRef.current=restored;setBookmark(restored);window.dispatchEvent(new CustomEvent('save-meal-blocked',{detail:{postId,message:'This meal is still being analysed. Save it when it finishes.'}}));};
```
Find:
```
  return <div ref={ref} className={`relative flex items-center gap-[18px] px-inset pt-[10px] ${detail?"pb-[6px]":"pb-1"}`}>
```
Replace:
```
  return <><div ref={ref} className={`relative flex items-center gap-[18px] px-inset pt-[10px] ${detail?"pb-[6px]":"pb-1"}`}>
```
Find:
```
  </div>;
}
```
Replace:
```
  </div>{notice&&!ready?<p role="alert" className="px-inset pb-1 text-detail text-muted">{notice}</p>:null}</>;
}
```
File `src/components/SavedMealListeners.tsx`.
Find:
```
 const home=()=>{setOpen(false);setTarget(null);setRename(null);};
 const blocked=(e:Event)=>{const d=(e as CustomEvent<{message?:string}>).detail;setError(d?.message||'This meal cannot be saved.');};
```
Replace:
```
 const home=()=>{setOpen(false);setTarget(null);setRename(null);};
```
Find:
```
window.addEventListener('log-again',again);window.addEventListener('save-meal-blocked',blocked);
```
Replace:
```
window.addEventListener('log-again',again);
```
Find:
```
window.removeEventListener('log-again',again);window.removeEventListener('save-meal-blocked',blocked);
```
Replace:
```
window.removeEventListener('log-again',again);
```

File `scripts/test.mjs`. Find:
```
const files=readdirSync(directory).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>directory+'/'+name);
```
Replace:
```
const named=process.argv.slice(2).filter(arg=>arg.endsWith('.test.mjs'));
const files=named.length?named:readdirSync(directory).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>directory+'/'+name);
```
File `tests/profile-avatar.test.mjs`. Find:
```
      async getSession() {
        return {data: {session: user ? {access_token: 'offline-token', user} : null}};
      },
```
Replace:
```
      async getSession() {
        return {data: {session: user ? {access_token: 'offline-token', user} : null}};
      },
      async getClaims() {
        return {data: user ? {claims: {sub: user.id}} : null};
      },
```
File `tests/save-meal-readiness.test.mjs`. Seven edits:

1. Find `const events=new EventTarget(),savedEvents=[];events.addEventListener('save-meal',e=>savedEvents.push(e.detail));`
   Replace `const events=new EventTarget(),savedEvents=[],blocked=[];events.addEventListener('save-meal',e=>savedEvents.push(e.detail));events.addEventListener('save-meal-blocked',e=>blocked.push(e.detail));`
2. Find `vm.runInNewContext(code,{exports,Date,`
   Replace `vm.runInNewContext(code,{exports,setTimeout:()=>0,clearTimeout:()=>{},Date,`
3. Find `return{usePostHandle:()=> 'test',AgentAttribution:()=>null};`
   Replace `return{usePostHandle:()=> 'test',usePostAuthor:()=>({handle:'test',userId:'owner',avatarMediaId:null}),AgentAttribution:()=>null};`
4. Find ` return{surface,buttons,savedEvents};`
   Replace ` return{surface,buttons,savedEvents,events,blocked};`
5. Find `: processing saves are faded and inert, then ready saves dispatch`
   Replace `: an unfinished meal's save waits for ready, a failed meal's save is refused, a ready meal saves`
6. Find:
```
   for(const button of controls){assert.equal(Boolean(button.props.disabled),status!=='ready');if(status!=='ready')assert.match(button.props.className,/text-faint/);button.props.onClick();}
   assert.equal(h.savedEvents.length,status==='ready'?controls.length:0);
```
   Replace:
```
   const bookmarks=controls.filter(button=>button.props['aria-label']==='Save meal'),rows=controls.filter(button=>button.props['aria-label']!=='Save meal');
   for(const button of rows){assert.equal(Boolean(button.props.disabled),status!=='ready');if(status!=='ready')assert.match(button.props.className,/text-faint/);button.props.onClick();}
   for(const button of bookmarks){assert.equal(Boolean(button.props.disabled),false);assert.match(button.props.className,/text-text/);button.props.onClick();}
   assert.equal(h.savedEvents.length,status==='ready'?controls.length:0);
   assert.equal(h.blocked.length,status==='failed'||status==='needs_input'?bookmarks.length:0,'a failed meal and a meal with an open question are refused');
   if(status==='queued'||status==='processing'){h.events.dispatchEvent(new CustomEvent('post-ready',{detail:{id:'post'}}));assert.equal(h.savedEvents.length,bookmarks.length,'the waiting save is sent once the meal is ready');}
```
7. Find:
```
test('standalone actions with no known status cannot save an unfinished meal',async()=>{
 const h=mount(undefined),tree=await h.surface('PostActions');const button=h.buttons(tree).find(b=>b.props['aria-label']==='Save meal');assert.equal(button.props.disabled,true);button.props.onClick();assert.equal(h.savedEvents.length,0);
```
   Replace:
```
test('standalone actions with no known status hold the save until the meal is ready',async()=>{
 const h=mount(undefined),tree=await h.surface('PostActions');const button=h.buttons(tree).find(b=>b.props['aria-label']==='Save meal');assert.equal(Boolean(button.props.disabled),false);button.props.onClick();assert.equal(h.savedEvents.length,0);
 h.events.dispatchEvent(new CustomEvent('post-ready',{detail:{id:'post'}}));assert.equal(h.savedEvents.length,1);
```
In step 5, for this PR also do the fail check the item asks for: change `if(postStatus==='failed'){` to `if(false){` in `src/components/PostActions.tsx`, run `MFA_TEST_DISPOSABLE=1 npm test -- tests/save-meal-readiness.test.mjs`, see it fail, restore the line, run again, see it pass. Write both results in a comment on the PR.
**#702 (a saved failed meal is unsaved).** Main's `save` already checks the unsave first, then the failed meal, then the wait (`PostActions.tsx` lines 22–24); the item's missing piece is the test. After PR 6's edits to `tests/save-meal-readiness.test.mjs` above, in the same file:

Find (a line PR 6's edits create; it occurs once after them):
```
test('standalone actions with no known status hold the save until the meal is ready',async()=>{
```
Replace:
```
test('a saved meal whose analysis failed is unsaved, not refused or marked failed',async()=>{
 const h=mount('failed',true),results=[];h.events.addEventListener('save-meal-result',e=>results.push(e.detail));
 const tree=await h.surface('PostCard');const button=h.buttons(tree).find(b=>b.props['aria-label']==='Unsave meal');
 assert.ok(button,'the bookmark shows the meal as saved');assert.equal(button.props['aria-pressed'],true);
 button.props.onClick();
 assert.deepEqual(h.savedEvents.map(d=>[d.postId,d.savedMealId,d.previousSaved]),[['post','saved-id',true]],'the unsave request carries the saved meal id');
 assert.equal(h.blocked.length,0,'a saved failed meal is not refused');
 assert.equal(results.some(d=>d.failed),false,'a saved failed meal is not marked failed');
});
test('standalone actions with no known status hold the save until the meal is ready',async()=>{
```
**Run (Nov 15, fifth pass, in memory on a copy of main, nothing written):** with PR 6's edits and this case, the file passes 7 of 7; with the line `if(postStatus==='failed'){…}` moved above `if(visibleSaved){…}` in `save`, only this case fails (6 of 7). The case uses the `PostCard` surface, the only one in the harness that passes a saved meal id. PR 6's existing cases already prove a failed unsaved meal is refused (they count the refusal events).
Done when: both files pass on a clean checkout of this branch, the fail check above fails and then passes, and both runs are written on the PR.
Done when (#683, on production at phone size, checked in step 7 as far as the coder can): tapping the bookmark on a failed meal shows the message under that meal's buttons, with the failure text and Try again uncovered, and sends no request. The coder makes no failed meal on production; if test account 2 has none, this is reported as not checked and left to GrokBot.
**Not met by this PR, and reported as such:** the rest of #711 is PR 13 and PR 14. Of #683: a bookmark tapped on an upload card is lost when the card is replaced by the finished meal's card (GrokBot saw the card's id change); the failed meal's page reading "Nutrition could not be updated." before any tap; a blocked cover photo offering no retry. These three are not built here.

## PR 7 — branch `fix21/lease-heartbeat` — #685
**Service:** `src/lib/queue/lease.ts` owns the lease; `runWorker` in `src/lib/worker/drain.ts` and the tick route are the boundaries.
**Why it stalls (facts, read Nov 15):** the lease lasts 300 s (`lease.ts` defaults; `tick.ts` line 35). It is renewed only after a job finishes (`drain.ts` line 66). `runWorker` releases it in a `finally` (line 72), which never runs when a deploy kills the function. Until the lease expires, `try_acquire_worker_lease` answers false to every other holder (`supabase/migrations/0007b_comment_corrections.sql` lines 113–128), so no worker starts.
**The change:** the lease lasts 60 s and the running worker renews it every 20 s. A killed worker's lease then frees the queue within 60 s. No migration in this PR: `renew_worker_lease` already takes a length from 1 to 3600 s (`0034_renew_lease.sql`).
**Blast radius:** every analysed meal goes through this worker. If the heartbeat fails for 60 s while a job still runs, a second worker can start beside the first; jobs are still claimed one at a time by the existing skip-locked claim. A job orphaned by the kill itself is still failed only after 360 s by `recover_abandoned_jobs`; that is unchanged and reported.
**Page look:** none; no page changes.

File `src/lib/queue/lease.ts`. Find:
```
// A lease older than its TTL is reclaimable inside try_acquire_worker_lease.
```
Replace:
```
// A killed function never releases its lease, so the lease is short and the
// running worker keeps it alive with a heartbeat.
export const LEASE_TTL_SECONDS = 60;
export const LEASE_HEARTBEAT_MS = 20_000;
// A lease older than its TTL is reclaimable inside try_acquire_worker_lease.
```
File `src/lib/worker/drain.ts`.

Find:
```
import { releaseLease, renewLease } from "@/lib/queue/lease";
```
Replace:
```
import { LEASE_HEARTBEAT_MS, LEASE_TTL_SECONDS, releaseLease, renewLease } from "@/lib/queue/lease";
```
Find:
```
  const startedAt = Date.now();
  try {
    const concurrency = workerConcurrency(process.env.WORKER_CONCURRENCY);
```
Replace:
```
  const startedAt = Date.now();
  const heartbeat = setInterval(() => { void renewLease(admin, holder, LEASE_TTL_SECONDS).catch(() => {}); }, LEASE_HEARTBEAT_MS);
  try {
    const concurrency = workerConcurrency(process.env.WORKER_CONCURRENCY);
```
Find:
```
        await renewLease(admin, holder);
```
Replace:
```
        await renewLease(admin, holder, LEASE_TTL_SECONDS);
```
Find:
```
  } finally {
    await releaseLease(admin, holder).catch(() => {});
```
Replace:
```
  } finally {
    clearInterval(heartbeat);
    await releaseLease(admin, holder).catch(() => {});
```
File `src/app/api/jobs/tick/route.ts`.

Find:
```
import { queueTick } from "@/lib/queue/tick";
```
Replace:
```
import { queueTick } from "@/lib/queue/tick";
import { LEASE_TTL_SECONDS } from "@/lib/queue/lease";
```
Find:
```
const status = await queueTick(admin, holder);
```
Replace:
```
const status = await queueTick(admin, holder, LEASE_TTL_SECONDS);
```
In step 5, for this PR also measure the done line on the disposable stack: post a meal, kill the app process (`kill -9`) while its job is running, start the app again, post a second meal, and write on the PR the seconds from the kill until the second meal's job starts.
Premise (unchecked): the existing worker tests (`tests/worker-execution-budget.test.mjs`, `tests/worker-recovery-wake.test.mjs`, `tests/worker-safety.test.mjs`, `tests/empty-job-claim.test.mjs`) call `runWorker` with stub clients; the planner did not run them against this change. Step 5's `npm test` decides.
Done when: after the worker is killed mid-job on the disposable stack, the next queued job starts within 60 seconds plus one worker wake, and the measured time is written on the PR.

## PR 8 — branch `fix21/photo-address` — #222, #324, #372, #375, #494, #579 (part)
**Service:** a new route `src/app/p/[file]/route.ts` owns photo delivery; `src/lib/posts/feed-photo-url.ts` owns the address. **Boundaries:** the feed, detail and day readers that build photo addresses. The Home question strip's 40 px thumbnail keeps its signed-in address, because PR 3 edits that file and no two PRs touch the same file.
**Why photos are slow (facts, read Nov 15):** every feed photo is resized by a server function on request and sent `private, max-age=31536000, immutable` (`src/app/api/media/feed/[owner]/[post]/[media]/[variant]/route.ts` lines 30, 55; `src/lib/posts/feed-photo-response.ts` lines 29, 55), so no CDN may keep it and every device's first view pays a function start, a Storage download and a resize. The `srcset` uses `1x, 2x, 3x` (`feed-photo-url.ts` line 15) and no `<img>` sets `sizes`. Desktop Home's "Posted today" list shows 44 px thumbnails from signed 1920 px `.feed.jpg` copies (`src/lib/posts/days.ts` line 66; `DesktopToday.tsx` line 25), which are the large files seen on a desktop meal detail.
**The change (owner ruled yes, Nov 15):** each photo gets a permanent address `/p/{photo id}_{secret}_{width}.webp` in widths 640, 1080 and 1600. The secret is 32 random hex characters stored on the photo's row. The route needs no sign-in; it answers `public` and cacheable, so Vercel's CDN keeps the file and the resize runs once per width per day, not once per device. The browser picks the width from `srcset` with widths. Old addresses keep working. Photo quality is unchanged: the source is still the stored original.
**Blast radius:** who can see a photo changes. Anyone who is given a photo's address can open that photo without signing in, for as long as the photo and its meal exist; a copy already held by the CDN can be served for up to one day after deletion, and a copy in a viewer's browser for up to a year. Every screen that shows a meal photo is touched. If the route fails, photos fall back to nothing on screen for new addresses; the old route is not removed, and reverting this PR restores it everywhere. The migration adds one column and rewrites `post_media` once.
**Migration order:** `0063_photo_secret.sql` is applied to production by the coder in step 7, immediately before this PR merges and only after the merge order names it; the command and the read-back are in step 7. The new code reads the column, and code on main before the merge never reads it. It is the only migration in this plan. Adding the column rewrites `post_media` once under a lock; the table holds a few hundred rows.
**When the resize is busy or fails:** the route answers with a redirect to a 60-second signed link to the stored original and `no-store`, as the signed-in route does today, because a browser does not fall back when one `srcset` copy fails.
**Page look:** Home at 390 wide and 1280 wide (first photo, a second photo after scrolling), a meal detail on both, Days with a selected day, desktop "Posted today". The meals are F1 (`plate3.jpg`) and F4 (`plate2.jpg`) from "Local fixtures"; the migration was applied in step 5b, before they were made. Reference: production; photos must look at least as sharp.

New file `supabase/migrations/0063_photo_secret.sql`:
```
-- A photo's public address carries this secret, so the address cannot be guessed.
alter table public.post_media add column photo_secret text not null default replace(gen_random_uuid()::text, '-', '');
notify pgrst, 'reload schema';
```
New file `src/app/p/[file]/route.ts`:
```
import {createAdminClient} from '@/lib/supabase/admin';
import {reserveFeedPhoto, resizeSharpPhoto} from '@/lib/posts/feed-photo';

// A photo's permanent public address: /p/{photo id}_{secret}_{width}.webp.
// The secret on the photo's row is the only check, so the answer can be kept by the CDN.
const FILE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_([0-9a-f]{32})_(640|1080|1600)\.webp$/;
const closed = {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'};
const fail = (status: number) => new Response(null, {status, headers: closed});

export async function GET(request: Request, context: {params: Promise<{file: string}>}) {
  try {
    const {file} = await context.params;
    const match = FILE.exec(file.toLowerCase());
    if (!match || new URL(request.url).search) return fail(404);
    const [, media, secret, width] = match;
    const admin = createAdminClient();
    const {data: photo, error} = await admin.from('post_media').select('post_id,storage_path,kind,photo_secret').eq('id', media).maybeSingle();
    if (error) return fail(503);
    if (!photo || photo.kind !== 'photo' || photo.photo_secret !== secret) return fail(404);
    const {data: post, error: postError} = await admin.from('posts').select('deleted_at').eq('id', photo.post_id).maybeSingle();
    if (postError) return fail(503);
    if (!post || post.deleted_at) return fail(404);
    // A browser does not fall back from a failed srcset candidate, so a busy or failed
    // resize answers with a short signed link to the stored original, as the signed-in route does.
    const original = async () => {
      const {data: signed, error: signError} = await admin.storage.from('media').createSignedUrl(photo.storage_path, 60);
      if (signError || !signed?.signedUrl) return fail(503);
      return new Response(null, {status: 302, headers: {...closed, Location: signed.signedUrl}});
    };
    const release = reserveFeedPhoto();
    if (!release) return original();
    try {
      const {data: blob, error: downloadError} = await admin.storage.from('media').download(photo.storage_path);
      if (downloadError || !blob) return fail(404);
      let output: Buffer;
      try { output = await resizeSharpPhoto(Buffer.from(await blob.arrayBuffer()), Number(width)); }
      catch { return original(); }
      return new Response(new Uint8Array(output), {headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, s-maxage=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
      }});
    } finally { release(); }
  } catch { return fail(503); }
}
```
**The access test (new).** New file `tests/photo-address.test.mjs`. It asks for the photo with no sign-in, as a stranger would:
```
// Local built application + disposable DB only. A photo's address needs no sign-in; its secret is the only check.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {signInTestClient} from '../scripts/lib/session.mjs';
const checked=result=>{assert.ifError(result.error);return result.data;};
test('a photo address opens only with its secret, and never for a deleted meal',async()=>{
 const origin=process.env.APP_URL;for(const endpoint of [origin,process.env.NEXT_PUBLIC_SUPABASE_URL])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(endpoint).hostname));
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}}),{user}=await signInTestClient(2);
 const post=randomUUID(),path=`${user.id}/${post}/0.jpg`;
 const get=async file=>{const response=await fetch(origin+'/p/'+file,{redirect:'manual',signal:AbortSignal.timeout(30000)});await response.arrayBuffer();return response;};
 const refused=async(file,why)=>{const response=await get(file);assert.equal(response.status,404,why);assert.equal(response.headers.get('cache-control'),'no-store',why);};
 try{
  checked(await admin.from('posts').insert({id:post,user_id:user.id,caption:'Photo address fixture',eaten_at:new Date().toISOString(),status:'ready',analysis_initialized_at:new Date().toISOString()}));
  checked(await admin.storage.from('media').upload(path,await readFile(new URL('../scripts/fixtures/plate2.jpg',import.meta.url)),{contentType:'image/jpeg',upsert:true}));
  const photo=checked(await admin.from('post_media').insert({post_id:post,storage_path:path,position:0,width:390,height:390,kind:'photo'}).select('id,photo_secret').single());
  assert.match(photo.photo_secret,/^[0-9a-f]{32}$/,'the migration gives every photo a secret');
  const good=`${photo.id}_${photo.photo_secret}_640.webp`;
  const open=await get(good);assert.equal(open.status,200,'the right secret opens the photo without sign-in');assert.equal(open.headers.get('content-type'),'image/webp');assert.match(open.headers.get('cache-control'),/^public, /);
  await refused(`${photo.id}_${'0'.repeat(32)}_640.webp`,'a wrong secret is refused');
  await refused(`${photo.id}_${photo.photo_secret}_700.webp`,'a width that is not offered is refused');
  await refused(good+'?x=1','an address with a query is refused');
  await refused(`${randomUUID()}_${photo.photo_secret}_640.webp`,'the secret opens no other photo');
  checked(await admin.from('posts').update({deleted_at:new Date().toISOString()}).eq('id',post));
  await refused(good,'a deleted meal\'s photo is refused');
 }finally{await admin.storage.from('media').remove([path]);checked(await admin.from('posts').delete().eq('id',post));}
});
```
The harness lines are those of PR 4's test. The planner wrote this test in the third pass and did not run it (premise above). Each `refused` case and the secret's shape state the route's rule; the 200 case also proves that the local photo store answers the route. The test must pass in step 5. If any case fails, PR 8 is not merged: the coder writes the failing case and its message on PR 8 and in the final report, and changes neither the test nor the route. The other PRs go on.

**The small copy at the old address (#579, part).** The Home question strip and browsers holding old addresses still ask for `v1.webp`. It fails for every photo taken with the sharper camera and answers with the 1920 px JPEG (fact above). Two numbers change so it resizes again, and one test's size follows.

File `src/lib/posts/feed-photo.ts`.

Find:
```
  const output = await sharp(source, {limitInputPixels: 2_000_000, failOn: 'error'})
    .timeout({seconds: 1}).rotate().resize({width: 512,
```
Replace:
```
  const output = await sharp(source, {limitInputPixels: 4_000_000, failOn: 'error'})
    .timeout({seconds: 1}).rotate().resize({width: 512,
```
Find:
```
  const smaller = await sharp(source, {limitInputPixels: 2_000_000, failOn: 'error'})
```
Replace:
```
  const smaller = await sharp(source, {limitInputPixels: 4_000_000, failOn: 'error'})
```
File `tests/feed-photo.test.mjs`.

Find:
```
const oversized=await sharp({create:{width:1500,height:1500,channels:3,background:'#fff'}}).jpeg().toBuffer();
```
Replace:
```
const oversized=await sharp({create:{width:2100,height:2100,channels:3,background:'#fff'}}).jpeg().toBuffer();
```

File `src/lib/posts/feed-photo-url.ts`.

Find:
```
export function smallFeedPhotoUrl(owner: string, post: string, media: string): string | null {
  return [owner, post, media].every(value => UUID.test(value))
```
Replace:
```
export function publicPhotoUrl(media: string, secret: string, width: 640 | 1080 | 1600): string {
  return `/p/${media}_${secret}_${width}.webp`;
}
// With the photo's secret the address is the permanent public one; without it, the signed-in route.
export function smallFeedPhotoUrl(owner: string, post: string, media: string, secret?: string | null): string | null {
  if (secret && /^[0-9a-f]{32}$/.test(secret) && UUID.test(media)) return publicPhotoUrl(media, secret, 1080);
  return [owner, post, media].every(value => UUID.test(value))
```
Find:
```
  if (!url || !/\/v[12]\.webp$/.test(url)) return undefined;
```
Replace:
```
  const open = url?.match(/^(\/p\/[0-9a-f-]{36}_[0-9a-f]{32})_1080\.webp$/);
  if (open) return `${open[1]}_640.webp 640w, ${open[1]}_1080.webp 1080w, ${open[1]}_1600.webp 1600w`;
  if (!url || !/\/v[12]\.webp$/.test(url)) return undefined;
```

| File | Find | Replace |
|---|---|---|
| `src/lib/posts/feed.ts` | `.select("id,storage_path,kind,not_eaten,width,height").eq("post_id",row.id).order("position");` | `.select("id,storage_path,kind,not_eaten,width,height,photo_secret").eq("post_id",row.id).order("position");` |
| `src/lib/posts/feed.ts` | `smallFeedPhotoUrl(row.user_id,row.id,entry.id)` | `smallFeedPhotoUrl(row.user_id,row.id,entry.id,(entry as {photo_secret?:string\|null}).photo_secret)` |
| `src/lib/posts/feed.ts` | `select('id,post_id,storage_path,kind,not_eaten,position,width,height')` | `select('id,post_id,storage_path,kind,not_eaten,position,width,height,photo_secret')` |
| `src/lib/posts/feed.ts` | `smallFeedPhotoUrl(owner,entry.post_id,entry.id)` | `smallFeedPhotoUrl(owner,entry.post_id,entry.id,(entry as {photo_secret?:string\|null}).photo_secret)` |
| `src/lib/posts/feed.ts` | `post_media(id,storage_path,kind,position)` | `post_media(id,storage_path,kind,position,photo_secret)` |
| `src/lib/posts/feed.ts` | `smallFeedPhotoUrl(data.user_id,data.id,photo.id)` | `smallFeedPhotoUrl(data.user_id,data.id,photo.id,(photo as {photo_secret?:string\|null}).photo_secret)` |
| `src/lib/posts/items.ts` | `supabase.from("post_media").select("id,storage_path,kind,not_eaten,width,height").eq("post_id", postId).order("position"),` | `supabase.from("post_media").select("id,storage_path,kind,not_eaten,width,height,photo_secret").eq("post_id", postId).order("position"),` |
| `src/lib/posts/items.ts` | `smallFeedPhotoUrl(post.user_id,postId,entry.id)` | `smallFeedPhotoUrl(post.user_id,postId,entry.id,(entry as {photo_secret?:string\|null}).photo_secret)` |
| `src/lib/posts/days.ts` | `post_media(storage_path,position),current_post_items(${CURRENT_ITEM_COLUMNS},created_at` | `post_media(id,storage_path,position,photo_secret),current_post_items(${CURRENT_ITEM_COLUMNS},created_at` |
| `src/lib/posts/days.ts` | `import { groupIntakeByDay, emptyIntake, type IntakeRow, type IntakeTotals } from "@/lib/intake/intake";` | the same line, then a new line `import { publicPhotoUrl } from "@/lib/posts/feed-photo-url";` |
| `src/components/Carousel.tsx` | `crossOrigin="anonymous" width={1080} height={1080} fetchPriority={priority?"high":undefined}` | `crossOrigin="anonymous" sizes="(min-width: 1024px) 520px, 100vw" width={1080} height={1080} fetchPriority={priority?"high":undefined}` |
| `src/app/(tabs)/page.tsx` | `srcSet={feedPhotoSrcSet(first.photoUrl)} width={1080} height={1080}` | `srcSet={feedPhotoSrcSet(first.photoUrl)} sizes="(min-width: 1024px) 520px, 100vw" width={1080} height={1080}` |
| `src/app/(tabs)/page.tsx` | `imageSrcSet:feedPhotoSrcSet(url)})` | `imageSrcSet:feedPhotoSrcSet(url),imageSizes:'(min-width: 1024px) 520px, 100vw'})` |
| `src/app/(tabs)/page.tsx` | `imageSrcSet:feedPhotoSrcSet(first.photoUrl)});` | `imageSrcSet:feedPhotoSrcSet(first.photoUrl),imageSizes:'(min-width: 1024px) 520px, 100vw'});` |

(In the table, `\|` stands for the plain character `|`.)

File `src/lib/posts/days.ts`. Find:
```
      const path = row.post_media?.[0]?.storage_path;
      if (path) photos.push(
```
Replace:
```
      const shot = row.post_media?.[0] as {id?: string; storage_path?: string; photo_secret?: string | null} | undefined;
      const path = shot?.storage_path;
      // A day's thumbnail is the small public copy; only a card image still needs a signed link.
      if (shot?.id && shot.photo_secret && path && !path.endsWith("/card.png")) post.photoUrl = publicPhotoUrl(shot.id, shot.photo_secret, 640);
      else if (path) photos.push(
```
The 520 px in `sizes` is the planner's choice for the desktop card's width; the page look says whether desktop photos are sharp, and a soft photo there is reported, not fixed.
Premises (unchecked; the coder verifies):
- Vercel's CDN keeps a function's response that carries `s-maxage`. Verify after deploy: request one `/p/…` address twice with `curl -sD-` and read `x-vercel-cache` (expected `MISS` then `HIT`). If the second is not `HIT`, write that in the report; the feed still works.
- The seven test files that name these helpers (`tests/home-photo-preload.test.mjs`, `tests/sharp-feed-photo.test.mjs`, `tests/feed-cache-lifecycle.test.mjs`, `tests/home-day-totals.test.mjs`, `tests/sharp-image-identity.test.mjs`, `tests/feed-photo.test.mjs`, `tests/needs-input-batch.test.mjs`) still pass: their rows carry no secret, and without a secret the address is unchanged. Step 5's `npm test` decides.
- The local Storage fixture answers the service-role `download` and `createSignedUrl` calls the new route makes. The planner read only its signing and listing handlers (`tests/fixtures/local-gateway.mjs` lines 14–18). The new test's 200 case and the page look decide: if the test fails, or photos do not show on the local build, report it and do not merge PR 8.
In step 5e, for this PR also measure on the local build and, after the merge, on production (cold, 390 wide, not slowed, as the section "The browser" says, three runs): the time to the first feed photo, its address, its bytes, its `Cache-Control`, and its pixel width read from the downloaded file with `node -e "require('sharp')(process.argv[1]).metadata().then(m=>console.log(m.width))" <file>`. Write the numbers on the PR.
**#324 — Home reads today once (owner ruling 8).** This part is in PR 8 because it edits `src/lib/posts/days.ts` and `src/app/(tabs)/page.tsx`, which PR 8's photo edits also edit, and no two PRs edit one file. It does not depend on the migration; it is merged, or not, with the rest of PR 8.
**Service:** `dayTotalFromMeals` in `src/lib/posts/days.ts` owns the day-circle total rule, for every day; `readToday` in `src/lib/posts/home-today.ts` owns today's meals and both of their summaries. **Boundaries:** Home's server page, which hands the view to the desktop Today column and the total to today's day circle; `/api/today`, which keeps calling `homeToday` unchanged.
**What changes:** a Home open reads today's meals once, with the `getDays` read the Today column already makes. The column takes its kcal, protein, carbs and fat from that read, so the database function `today_summary` is no longer called. Today's circle takes its total from the same read through `dayTotalFromMeals`, the function `getDayTotals` now also uses, so the rule exists once; `getDayTotals` reads only the five days before today. The six totals keep main's order, oldest first and today last (fact above). Nothing fills in late.
**When today's read fails:** today's circle reads its own total with `getDayTotals`, as on main, and the Today column gets no server copy and loads in the browser, as on main (the added test). The five earlier circles are not affected. Home still opens: each of its three parts catches its own failure inside its own `Suspense` (fact above), and the added test shows the circles and the feed both still get all six totals when the shared read fails. So the only cost of a failure is one extra read, on that open only.
**Blast radius:** Home's day circles and the desktop Today column on every open, phone and desktop, and every caller of `getDayTotals` (Home, the feed in the browser, `feed.ts`). `getDayTotals` gives the same totals as before: the same kcal, known count, missing names in the same order, and receipts (the two existing tests above must pass). The column now shows the same numbers as Days, which pass each item through the portion step; before, `today_summary` added the stored values (fact above; the planner did not check whether the two ever differ). Today's circle now counts a ready meal that still carries a stored question, as Days and the column already did; the five earlier circles keep the old rule (fact above). `today_summary` stays in the database, unused by the app; its test (`tests/db/today-summary.test.mjs`, repaired by PR 14) stays and still passes against it. Removing it needs a migration and is not in this run. Check K13 tests the column's failure message on main's code, where `today_summary` is still called; on PR 8's code the same message is reached when `readToday` fails, which the added test covers.
**What was run:** see the line "Run in the fifth pass" at the end of PR 8.
**Page look (added to PR 8's):** Home at 390 wide and at 1280 wide with F1 and F4 posted today. Expected: the circles in the same order as production; today's circle and the desktop Today column show the same kcal; at 1280 the column is filled when the page appears, and in the first 10 seconds the browser's network log shows no request to `/api/today`.

File `src/lib/posts/days.ts` (these Find texts are next to none of the photo edits above):

Find:
```
// Read all current nutrition for the touched days together, never one query per card.
```
Replace:
```
// One day circle's total from that day's ready meals, in eaten order. getDayTotals uses it
// for every day it reads, and readToday (home-today.ts) for today, so the rule lives once.
export function dayTotalFromMeals(day: string, meals: {id: string; eatenAt: string; items: {name: string; calories: import('@/lib/nutrition/totals').Numeric}[]}[]): FeedDayTotal {
  let kcal = 0, known = 0;
  const missing: string[] = [];
  for (const meal of meals) for (const item of meal.items) {
    const value = nutritionNumber(item.calories);
    if (value === null) missing.push(item.name); else { kcal += value; known++; }
  }
  const unique = [...new Set(missing)];
  return { day, kcal: known === 0 && unique.length ? null : kcal, ready: meals.length > 0, missing: unique, known, posts: meals.map(meal => dayPostReceipt(meal.id, meal.eatenAt, meal.items)) };
}

// Read all current nutrition for the touched days together, never one query per card.
```
Find:
```
  const groups = new Map(wanted.map(day => [day, { day, kcal: 0 as number | null, ready: false, missing:[] as string[], known:0, posts:[] as DayPostReceipt[] }]));
```
Replace:
```
  const groups = new Map(wanted.map(day => [day, { day, meals: [] as {id: string; eatenAt: string; items: {name: string; calories: number | null}[]}[] }]));
```
Find:
```
      group.ready = true;
      const contributions: {name:string;calories:number|null}[]=[];
      for (const item of row.current_post_items ?? []) {
        const nutrients = Array.isArray(item.item_nutrition) ? item.item_nutrition : [item.item_nutrition];
        const nutrition = nutrients[0];
        const value = nutrition ? normalizeStoredNutrition(nutrition as NutritionRow, item.portion_grams).calories : null;
        contributions.push({name:item.name,calories:nutritionNumber(value)});
        if(value==null)group.missing.push(item.name); else {group.kcal=(group.kcal??0)+Number(value);group.known++;}
      }
      group.posts.push(dayPostReceipt(row.id,row.eaten_at,contributions));
```
Replace:
```
      const contributions: {name:string;calories:number|null}[]=[];
      for (const item of row.current_post_items ?? []) {
        const nutrients = Array.isArray(item.item_nutrition) ? item.item_nutrition : [item.item_nutrition];
        const nutrition = nutrients[0];
        const value = nutrition ? normalizeStoredNutrition(nutrition as NutritionRow, item.portion_grams).calories : null;
        contributions.push({name:item.name,calories:nutritionNumber(value)});
      }
      group.meals.push({id: row.id, eatenAt: row.eaten_at, items: contributions});
```
Find:
```
  return [...groups.values()].map(group=>({...group,missing:[...new Set(group.missing)],kcal:group.known===0&&group.missing.length?null:group.kcal}));
```
Replace:
```
  return [...groups.values()].map(group => dayTotalFromMeals(group.day, group.meals));
```

Replace the whole of `src/lib/posts/home-today.ts` with:
```
import type { SupabaseClient } from "@supabase/supabase-js";
import { dateInZone, dayTotalFromMeals, getDays, type FeedDayTotal } from "@/lib/posts/days";
import { sumNutrition } from "@/lib/nutrition/totals";
import type { TodayView } from "@/lib/posts/today-view";

// One read of today's meals. The desktop Today column shows `view`; today's day
// circle on Home shows `total`. Home never reads today's nutrition twice.
export interface TodayRead { view: TodayView; total: FeedDayTotal }

export async function readToday(supabase: SupabaseClient, userId: string, zone: string): Promise<TodayRead> {
  const today = dateInZone(new Date(), zone);
  const [day] = await getDays(supabase, userId, zone, today, today);
  const meals = day?.posts ?? [];
  const posts = meals.map((post) => ({
    id: post.id,
    caption: post.caption,
    eatenAt: post.eatenAt,
    photoUrl: post.photoUrl,
    items: post.items.map((item) => ({ name: item.name })),
    totals: post.totals,
  }));
  return {
    view: { date: today, posts, totals: day?.totals ?? sumNutrition([]) },
    // The same function getDayTotals uses for every other day circle.
    total: dayTotalFromMeals(today, meals),
  };
}

export async function homeToday(supabase: SupabaseClient, userId: string, zone: string): Promise<TodayView> {
  return (await readToday(supabase, userId, zone)).view;
}
```

File `src/app/(tabs)/page.tsx`.

Find:
```
import { homeToday } from "@/lib/posts/home-today";
```
Replace:
```
import { readToday } from "@/lib/posts/home-today";
```
Find (main's lines 49–68, from the comment above `homeDayTotals` to the blank line before `async function HomeDays`):
```
// Both streams await the same request-scoped totals promise. Failed optional
// totals remain unavailable and are not cached across visitors or navigations.
const homeDayTotals = cache(async () => {
  const { zone } = await homeZone();
  const today = dateInZone(new Date(), zone);
  const {db, user} = await homeReader();
  if (!user) return [];
  const started = Date.now();
  try {
    return await homeDeadline(getDayTotals(db, user.id, zone, Array.from({length: 6}, (_, index) => shiftDay(today, -index))));
  } finally { console.info(`feed read day-totals ${Date.now() - started}`); }
});

const homeTodayRead = cache(async () => {
  const { db, user } = await homeReader();
  if (!user) return null;
  const { zone } = await homeZone();
  return homeToday(db, user.id, zone);
});

```
Replace:
```
// Today's meals are read once per request (readToday) and shared: the desktop
// Today column shows the view and today's day circle shows the total.
const homeTodayRead = cache(async () => {
  const { db, user } = await homeReader();
  if (!user) return null;
  const { zone } = await homeZone();
  return readToday(db, user.id, zone);
});

// Both streams await the same request-scoped totals promise. Today's total comes
// from homeTodayRead; only the five days before today are read here. Failed
// optional totals remain unavailable and are not cached across visitors or navigations.
const homeDayTotals = cache(async () => {
  const { zone } = await homeZone();
  const today = dateInZone(new Date(), zone);
  const {db, user} = await homeReader();
  if (!user) return [];
  const started = Date.now();
  try {
    const [earlier, current] = await homeDeadline(Promise.all([
      getDayTotals(db, user.id, zone, Array.from({length: 5}, (_, index) => shiftDay(today, -index - 1))),
      homeTodayRead().catch(() => null),
    ]));
    if (current) return [...earlier, current.total];
    // Today's shared read failed: today's circle reads its own total, as it did before the shared read.
    return [...earlier, ...await homeDeadline(getDayTotals(db, user.id, zone, [today]))];
  } finally { console.info(`feed read day-totals ${Date.now() - started}`); }
});

```
Find:
```
  if (today) initial = today;
```
Replace:
```
  if (today) initial = today.view;
```
File `tests/home-day-totals.test.mjs`. The first test now also renders the Today column and proves one read of today across all three streams.

Find:
```
  let totalCalls=0,authCalls=0;
```
Replace:
```
  let totalCalls=0,authCalls=0,todayCalls=0;
  const todayTotal={day:'2026-11-04',kcal:120,ready:true,missing:[],known:1,posts:[]};
```
Find:
```
+'\nexport {HomeDays,HomeFeed};';
```
Replace:
```
+'\nexport {HomeDays,HomeFeed,HomeToday};';
```
Find:
```
    if(name==='@/lib/posts/home-today')return{homeToday:async()=>({date:'2026-11-03',posts:[],totals:{}})};
    if(name==='@/lib/auth/verified-user')return{verifiedUserId:async()=>owner};
```
Replace:
```
    if(name==='@/lib/posts/home-today')return{readToday:async()=>{todayCalls++;return{view:{date:'2026-11-04',posts:[],totals:{}},total:todayTotal};}};
    if(name==='@/lib/auth/verified-user')return{verifiedUserId:async()=>owner};
```
Find:
```
  const [rings,feed]=await Promise.all([exports.HomeDays(),exports.HomeFeed()]);
```
Replace:
```
  const [rings,feed,todayColumn]=await Promise.all([exports.HomeDays(),exports.HomeFeed(),exports.HomeToday()]);
```
Find:
```
  assert.deepEqual(rings.props.totals,days);
  assert.deepEqual(Array.from(feed.props.children.props.initialPage.days),days);
```
Replace:
```
  assert.equal(todayCalls,1,'today is read once and shared by the circles, the feed and the Today column');
  assert.deepEqual(Array.from(rings.props.totals),[...days,todayTotal]);
  assert.deepEqual(Array.from(feed.props.children.props.initialPage.days),[...days,todayTotal]);
  assert.equal(todayColumn.props.initial.date,'2026-11-04');
```
Find:
```
    if(name==='@/lib/posts/home-today')return{homeToday:async()=>{todayCalls++;return {date:'2026-11-03',posts:[],totals:{}};}};
```
Replace:
```
    if(name==='@/lib/posts/home-today')return{readToday:async()=>{todayCalls++;return {view:{date:'2026-11-03',posts:[],totals:{}},total:{day:'2026-11-03',kcal:0,ready:false,missing:[],known:0,posts:[]}};}};
```
Find:
```
test('feed refresh skips known days without removing meal or hydration reads; missing dates still load',async()=>{
```
Replace:
```
test('when the shared read of today fails, the circles and the feed still get every total and the Today column keeps its browser fallback',async()=>{
  const reads=[];
  const source=readFileSync(new URL('../src/app/(tabs)/page.tsx',import.meta.url),'utf8')+'\nexport {HomeDays,HomeFeed,HomeToday};';
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};
  vm.runInNewContext(code,{exports,Date,Promise,Array,Boolean,AbortSignal,setTimeout,clearTimeout,console,require(name){
    if(name==='react')return {cache(fn){let promise;return()=>promise??=fn();},Suspense:()=>null};
    if(name==='react/jsx-runtime')return{jsx:(component,props)=>({component,props}),jsxs:(component,props)=>({component,props})};
    if(name==='@/lib/posts/feed-photo-url')return{feedPhotoSrcSet:()=>undefined};
    if(name==='react-dom')return{preload(){}};
    if(name==='next/server')return{connection:async()=>{}};
    if(name==='next/headers')return{cookies:async()=>({get:()=>({value:'UTC'})}),headers:async()=>({get:()=>null})};
    if(name==='@/lib/posts/home-today')return{readToday:async()=>{throw Error('today unavailable');}};
    if(name==='@/lib/auth/verified-user')return{verifiedUserId:async()=>owner};
    if(name==='@/lib/supabase/server')return{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:owner}}})}})};
    if(name==='@/lib/posts/days')return{validZone:()=> 'UTC',dateInZone:()=> '2026-11-03',shiftDay:(_,n)=>'day'+n,getEarliestPostDate:async()=>null,getLoggedDates:async()=>[],getDayTotals:async(_db,_owner,_zone,dates)=>{reads.push([...dates]);return dates.map(day=>({day,kcal:1,ready:true}));}};
    if(name==='@/lib/posts/feed')return{getFeed:async()=>({posts:[],days:[],nextCursor:null})};
    if(name==='next/link'||name.startsWith('@/components/'))return{default:name};
    throw Error(name);
  }});
  const [rings,feed,todayColumn]=await Promise.all([exports.HomeDays(),exports.HomeFeed(),exports.HomeToday()]);
  assert.deepEqual(reads,[['day-1','day-2','day-3','day-4','day-5'],['2026-11-03']],'the five earlier days, then today alone after the shared read failed');
  assert.deepEqual(Array.from(rings.props.totals,day=>day.day),['day-1','day-2','day-3','day-4','day-5','2026-11-03']);
  assert.deepEqual(Array.from(feed.props.children.props.initialPage.days,day=>day.day),['day-1','day-2','day-3','day-4','day-5','2026-11-03'],'the feed is seeded with the same six totals');
  assert.equal(todayColumn.props.initial,undefined,'the column gets no server copy and loads in the browser, as on main');
  assert.equal(todayColumn.props.placeholder,true);
});

test('feed refresh skips known days without removing meal or hydration reads; missing dates still load',async()=>{
```
File `tests/home-photo-preload.test.mjs`.

Find:
```
  if(name==='@/lib/posts/home-today')return{homeToday:async()=>({date:'2026-11-03',posts:[],totals:{}})};
```
Replace:
```
  if(name==='@/lib/posts/home-today')return{readToday:async()=>({view:{date:'2026-11-03',posts:[],totals:{}},total:{day:'2026-11-03',kcal:0,ready:false,missing:[],known:0,posts:[]}})};
```
`tests/feed-cache-lifecycle.test.mjs` also loads `page.tsx`; PR 14 gives its stub both `homeToday` and `readToday`, so it passes with or without PR 8. On PR 8's own branch that file fails as it does on main (it is in the list of tests that fail on main, repaired by PR 14).
The edited first test and the added third test are the data-rule tests for #324 (one read of today, shared; and, when that read fails, the circles, the feed and the column each still get their data). `tests/day-total-changes.test.mjs` and `tests/days-range.test.mjs` call the real `getDayTotals` and must still pass.
Done when (#324): `tests/home-day-totals.test.mjs` passes on PR 8's branch; and on production at 1280 wide, Home opens with the Today column filled, the same kcal in today's circle and in the column, and no request to `/api/today` in the first 10 seconds.

Done when: on production the first feed photo's address is a `/p/` address answered with a public cache header; its file is at least 780 pixels wide for a 390-wide card; it shows within two seconds on a cold open, measured not slowed (section "The browser"); a desktop meal detail downloads no `.feed.jpg`; and the bytes, header and times are written down. If the two-second line is missed, the measured time is reported and the item stays open. The time on mobile data is not measured by this run: it is left to GrokBot on a real phone and reported as not checked, as PR 4's spoken clip is.

**Run in the fifth pass (Nov 15, nothing written to the repository).** Every edit of PR 8 above, including the #324 part, applied in memory to main's files by a script that reads this section: all 38 Find texts occur once. With those files laid over main: the whole project type-checks with TypeScript's compiler and the repository's `tsconfig.json` (0 diagnostics); `npx eslint --stdin` on each of the nine edited source files reports no error, as on main; and with the edited files served from memory, `node --import tsx --test` passes `tests/home-day-totals.test.mjs` 5 of 5, `tests/home-photo-preload.test.mjs` 3 of 3, `tests/days-range.test.mjs` 3 of 3, `tests/day-total-changes.test.mjs` 5 of 5 (these two call the real `getDayTotals`, now built on `dayTotalFromMeals`), `tests/feed-photo.test.mjs` 8 of 8 and `tests/sharp-feed-photo.test.mjs` 4 of 4. The edited `home-day-totals` tests fail against main's unchanged page (the first two of them), so they detect the second read. Not run: `tests/photo-address.test.mjs` (it needs the local stack and the migration), `next build`, the whole suite, the page look.

## PR 9 — branch `fix21/feed-reread` — #520
**Service:** `getPostCard` in `src/lib/posts/feed.ts` owns the card read. **Boundary:** `RealtimePost.tsx`.
**Why it reads twice (facts, read Nov 15):** the server sends the first page and `Feed.tsx` line 308 uses it without a page fetch. But every card's `RealtimePost` calls `refresh()` once when it mounts (line 102), and those calls are merged into one `/api/feed?ids=…` request (`feed.ts` lines 343–357). So every Home open re-reads all visible cards. The later request seen at about nine seconds is the same refresh on focus or a poll for an unfinished meal.
**The change:** a card that is already finished does not re-read itself on mount. An unfinished card still does, and every card still refreshes on a database change, on focus and on its own events.
**Blast radius:** a finished meal that changed in the moment between the server drawing the page and the card subscribing shows its older state until the next focus, event or database change. Every feed card is touched.
**Page look:** Home at 390 wide with a finished meal (F1) and one still being analysed (F3), from "Local fixtures". Then run F3's second command, which finishes that meal, and watch its card. Reference: production; the unfinished meal must still fill in, within about 30 seconds of the command.

File `src/components/RealtimePost.tsx`. Find:
```
    void refresh();
    pollBackoffMs = POLL_START_MS;
    schedulePoll();
```
Replace:
```
    // A finished card drawn from the server's page is already current; re-reading every card on mount doubled the first feed read.
    if (needsPolling()) void refresh();
    pollBackoffMs = POLL_START_MS;
    schedulePoll();
```
In step 5, count requests to `/api/feed` in the browser's network log for one cold Home open of 15 seconds, on main and on this branch, and write both counts on the PR.
Done when: one Home open with only finished meals makes no `/api/feed?ids=` request, and the counts before and after are written down. A first-ever visit, before the browser has stored its time zone, still reads the first page once with `/api/feed?tz=…&limit=6` (`Feed.tsx`, the `load` function); that request is not removed by this PR and is reported if seen.

## PR 10 — branch `fix21/caffeine-table` — #456
**Service:** `keepsCaffeine` in `src/lib/intake/alcohol.ts` owns the rule "a drink keeps caffeine only when its name or category names a caffeine source". **Boundary:** `nutritionTableRows` in `src/lib/nutrition/table.ts`.
**Why it still shows (facts, read Nov 15):** the card and the day total already apply `keepsCaffeine` to alcoholic drinks (`src/lib/intake/hydration.ts` lines 66, 147). The "Show all" table does not: `table.ts` lines 23–25 filter only the macro nutrients, so the matched record's caffeine (nutrient 1057) is listed. GrokBot's Nov 3 day total of 95 mg is 15 mg less than the 110 mg first reported, which is consistent with the cocktail already being left out of the total; the planner did not read the stored rows.
**Blast radius:** the "Show all" table on every meal. A drink whose name and category name no caffeine source no longer lists caffeine; foods and named caffeine drinks are unchanged.
**Page look:** a meal's "Show all" table for a cocktail and for a coffee. Reference: production; only the cocktail's Caffeine row goes.

File `src/lib/nutrition/table.ts`.

Find:
```
import {sumMicronutrients, sumNutrition, type CurrentItem, type NutritionLike} from './totals';
```
Replace:
```
import {sumMicronutrients, sumNutrition, type CurrentItem, type NutritionLike} from './totals';
import {keepsCaffeine} from '@/lib/intake/alcohol';
```
Find:
```
    return !macroIds.has(row.nutrientId??-1)&&!macroNames.has(name);
```
Replace:
```
    if(row.nutrientId===1057&&!keepsCaffeine({name:item.name,food_category:(item as {food_category?:string|null}).food_category,micronutrients:item.micronutrients}))return false;
    return !macroIds.has(row.nutrientId??-1)&&!macroNames.has(name);
```
Done when: on production the tiki cocktail (post 8535b793) and a glass of wine show no caffeine on the card or in "Show all", and the Nov 3 day total leaves the cocktail's caffeine out. The day-total half is read, not changed, by this PR; if it still includes the cocktail, that is reported.

## PR 11 — branch `fix21/check-script` — #628
**Service:** `scripts/run17-checks.mjs`. **Boundary:** the two commands it runs (post-close and beer).
**What is already done in the script (facts, read Nov 15):** the dismiss step clicks only the row holding this post's own question and proves the request reached this post (lines 143–150); the fake push subscription is deleted at the end of every beer run and the run fails if it remains (line 170).
**What is still wrong:** the tap step returns `Math.round(...)`, which is `-0` for a control whose centre lies just left of or above the screen edge; WebDriver BiDi sends `-0` as the text "-0" and the pointer move is refused (line 77). The answer step clicks the Home question's row without waiting for it and throws "Strip row missing" when it is not there yet (line 130).
**Blast radius:** a test script only. It writes test posts to test account 2 on whatever app it is pointed at and deletes them at the end.
**Page look:** none; no page changes.

File `scripts/run17-checks.mjs`.

Find:
```
return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};
```
Replace:
```
return{x:Math.round(r.x+r.width/2)||0,y:Math.round(r.y+r.height/2)||0};
```
Find:
```
    await evaluate(`(()=>{const row=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('A question about this meal'));if(!row)throw Error('Strip row missing');row.click();return true;})()`);
```
Replace:
```
    await until(`[...document.querySelectorAll('button')].some(b=>(b.textContent||'').includes('question about'))`,30000);
    await evaluate(`(()=>{const row=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('question about'));if(!row)throw Error('Strip row missing');row.click();return true;})()`);
```
("question about" is in both the old words, "A question about this meal", and the new ones, "A quick question about your meal".)
In step 5, run the script's post-close command and its beer command against the local build and write each exit code and first error on the PR.
Premise (unchecked): the earlier failures with `Page.navigate` and `Page.enable` timeouts came from the host's headless browser, not the app. If they recur, the exit codes and errors are reported and the item stays open; they are not worked on.
Done when: both commands exit 0 with their receipts committed on the docs branch, or the remaining failure is reported with its error.

## PR 12 — branch `fix21/thumbs-black` — #552 (part), #553 (part)
**Service:** `thumbClass` in `src/components/ThumbsFeedback.tsx` owns the thumbs' colour. **Boundary:** every post's button row and the meal detail.
**Blast radius:** the two thumbs under every meal are black outlines at rest (owner ruling 4). A chosen or pressed thumb is still filled. A thumb that cannot be used yet is still faint.
**Page look:** Home and a meal detail. Reference: production; the only difference is the thumbs' colour at rest.

File `src/components/ThumbsFeedback.tsx`. Find:
```
  return 'text-off';
```
Replace:
```
  return 'text-text';
```
Done when (this PR's part): on production at phone size the thumbs are black at rest, filled when chosen, and faint before the analysis exists.
**Not met by this PR, and reported as such:** the saving and failed looks of #552 and the slowed-processor timing of #553 are GrokBot's to capture.

## PR 13 — branch `fix21/post-intent-test` — #625, #572, #706
**Service:** `post()` in `src/lib/posts/upload-manager.ts` (not changed). **Boundary:** `tests/upload-guard.test.mjs`.
**Blast radius:** a test only.
**Page look:** none; no page changes.
**Why a test and no code:** `post()` already waits for the small publish record (`putIntent`) and not for the draft save that carries the photo (`upload-manager.ts`, `post()`). Two existing tests each prove half of the done line. This one test proves it whole: the draft save is delayed 800 ms, Post is acknowledged in under 1 second, and a manager rebuilt from the saved data alone publishes the meal.

File `tests/upload-guard.test.mjs`. Find:
```
test('posting reports a rejected durable flag without stopping the upload',async()=>{
```
Replace:
```
test('a draft save delayed beyond 700 ms still acknowledges Post within 1 second and publishes after a rebuild from saved data',async()=>{
 let publishes=0;const draft={setProgress(){},restore(){},snapshot:async()=>({id:'posted',images:[],completed:[]}),stage:async()=>new Promise(()=>{}),submit:async()=>{publishes++;return{postId:'posted'}}};
 const {manager,store,rows}=harness(()=>draft);await manager.initialize('owner');const id=manager.stage([file],fields);await until(()=>rows.size===1);
 const put=store.put;store.put=async row=>{await new Promise(resolve=>setTimeout(resolve,800));return put(row);};
 const started=Date.now();assert.equal(await manager.post(id),true);assert.ok(Date.now()-started<1000,'Post is acknowledged within 1 second');
 assert.equal(rows.get(id).posted,false,'the saved draft is still marked not posted');assert.equal((await store.allIntents()).length,1);
 store.put=put;
 const restored=new UploadManager(store,()=>({...draft,stage:async()=>{}}),async()=>{});await restored.initialize('owner');assert.equal(restored.list()[0].posted,true);
 await until(()=>publishes===1);assert.equal(restored.list()[0].postId,'posted');
});
test('posting reports a rejected durable flag without stopping the upload',async()=>{
```
The file's first test fails on main (fact above: six tries, not three). Its count is corrected here, because this PR already edits the file:

File `tests/upload-guard.test.mjs`.

Find:
```
await until(()=>manager.list()[0]?.state==='failed');assert.equal(attempts,3);assert.equal(published,0);shouldFail=false;
```
Replace:
```
await until(()=>manager.list()[0]?.state==='failed');assert.equal(attempts,6,'posting during the first pass queues one more pass of three tries');assert.equal(published,0);shouldFail=false;
```

Done when: the new test and the first test pass in step 5; the planner's copy had no failure in this file.

**Two more tests (#572, #706).** Main already does what each of these items asks; each item's done line also asks for a test, and none exists. Both guard data rules (which food record a meal's nutrition comes from; which part of a label photo is read), so the contract's test rule allows them. Each is a new file, so no other PR touches it, and none changes product code. The planner ran each in memory on a copy of main on Nov 15 (fifth pass, nothing written): each passes, and each fails when its fix is removed in memory (the control named under it).

New file `tests/closest-food-bare-name.test.mjs` (#572: when the model's first decision names no base food, the closest-record step searches the item's own bare name; `src/lib/fdc/match.ts`, `matchFood` returns `baseFood:baseQuery??query`, and `resolveFoodMatchDetailed` passes it to `closestGenericFood`):
```
// node --import tsx --test tests/closest-food-bare-name.test.mjs
// #572: when the first decision names no base food, the closest step searches the item's own bare name.
import test from 'node:test';
import assert from 'node:assert/strict';
process.env.MODEL_API_BASE_URL='http://127.0.0.1:1/v1';process.env.MODEL_API_KEY='offline-meta';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-trace';
const {resolveFoodMatchDetailed,foodSearchQuery}=await import('../src/lib/fdc/match.ts');
const {FDC_SEARCH_CACHE_KIND}=await import('../src/lib/fdc/client.ts');

const kcal=value=>[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value}];
const branded={fdcId:11,description:'Snack chips, pasta flavour',dataType:'Branded',foodNutrients:kcal(500)};
const generic={fdcId:22,description:'Pasta, cooked, enriched',dataType:'SR Legacy',foodNutrients:kcal(158)};

test('a first decision with no base food sends the bare item name to the closest-record search',async()=>{
 const name='Fried pasta-snack!',bare=foodSearchQuery(name);
 assert.equal(bare,'Fried pasta snack');
 const original=globalThis.fetch,cacheKeys=[],records=[],schemas=[];
 // Cached search fixture answers any query; every looked-up key is recorded. A cache miss would hit USDA and fail.
 const db={from(table){assert.equal(table,'fdc_cache');let key;return{select(){return this},eq(_c,value){key=value;cacheKeys.push(value);return this},abortSignal(){return this},
  async maybeSingle(){return{data:{response:{kind:FDC_SEARCH_CACHE_KIND,query:key.slice(FDC_SEARCH_CACHE_KIND.length+1),payload:{foods:[branded,generic]}}},error:null}}}}};
 globalThis.fetch=async(input,init)=>{
  const url=new URL(input),body=JSON.parse(init?.body||'{}');
  if(url.origin==='https://trace.invalid'){records.push(body);return new Response(null,{status:201});}
  assert.equal(url.port,'1','no USDA or live model calls');
  const schema=body.text.format.name;schemas.push(schema);
  const value=schema==='search_query'?{id:null,query:null,query_food:null,reason:'No compatible record; no base food named'}
   :schema==='closest_food'?{id:22,reason:'Boiled rather than fried'}:null;
  assert.ok(value,`unexpected ${schema} call: the closest step did not supply a record`);
  return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]});
 };
 let result;
 try{result=await resolveFoodMatchDetailed(db,name,'',undefined,{approximate:true});}
 finally{globalThis.fetch=original;}
 assert.deepEqual(schemas,['search_query','closest_food']);
 const approx=records.map(r=>JSON.parse(r.request_text)).find(r=>r.event==='food_approximation');
 assert.ok(approx,'closest-record step ran');
 assert.equal(approx.query,bare,'closest step searched the item\'s own bare name');
 const key=`${FDC_SEARCH_CACHE_KIND}:${bare.toLowerCase()}`;
 assert.deepEqual(cacheKeys,[key,key],'first search and closest search both use the bare name');
 assert.equal(result.unavailable,null);
 assert.equal(result.food.fdcId,22);
 assert.deepEqual(result.food.approximation,{kind:'closest',basis:'Pasta, cooked, enriched'});
});
```
Control: with both `baseFood:baseQuery??query` in `match.ts` changed to `baseFood:baseQuery`, the test fails (0 of 1). It needs no stack and makes no network call; the model and the food cache are stubbed.

New file `tests/label-orientation.test.mjs` (#706: a label photo stored with orientation 6 is read upright and cropped at the label; `src/lib/meta/label.ts` line 28 rotates first, `readNutritionLabel` lines 62–75 reads and crops the rotated image):
```
// node --import tsx --test tests/label-orientation.test.mjs
// A phone label photo stored landscape with EXIF orientation 6 is cropped in its upright frame.
// No database, live model call or API key: fetch is stubbed and only /responses is answered.
import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';

async function rotatedLabelPhoto() {
  // Stored 200x100; orientation 6 shows it upright as 100x200. The stored left 50 columns are red,
  // which become the top 50 rows once rotated. Everything else is blue.
  const red = await sharp({ create: { width: 50, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } } }).png().toBuffer();
  return sharp({ create: { width: 200, height: 100, channels: 3, background: { r: 0, g: 0, b: 255 } } })
    .composite([{ input: red, left: 0, top: 0 }]).jpeg({ quality: 95 }).withMetadata({ orientation: 6 }).toBuffer();
}

test('a rotation-6 label photo is read upright and cropped at the label', async () => {
  const photo = await rotatedLabelPhoto();
  const stored = await sharp(photo).metadata();
  assert.deepEqual([stored.width, stored.height, stored.orientation], [200, 100, 6]);

  const keys = ['MODEL_API_KEY', 'MODEL_API_BASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SECRET_KEY'];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  process.env.MODEL_API_KEY = 'fixture-not-a-secret';
  process.env.MODEL_API_BASE_URL = 'http://label-fixture.invalid/v1';
  delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.SUPABASE_SECRET_KEY; // trace write fails closed, no DB
  const sent = [], other = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    if (!url.endsWith('/responses')) { other.push(url); throw new Error('unexpected request'); }
    sent.push(JSON.parse(init.body));
    // The first reading misses protein and points at the top band of the upright photo, forcing the crop retry.
    const reading = {
      is_label: true, serving: { amount: 40, unit: 'g' }, product_name: 'Fixture',
      per_serving: { kcal: 200, protein_g: sent.length === 1 ? null : 7, carbs_g: 30, fat_g: 5, fibre_g: null, sugar_g: null, sodium_mg: null },
      box: { x: 0.2, y: 0.05, w: 0.6, h: 0.1 },
    };
    return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(reading) }] }] });
  };
  try {
    const { readNutritionLabel } = await import('../src/lib/meta/label.ts');
    const reading = await readNutritionLabel(new Uint8Array(photo));
    assert.equal(sent.length, 2, 'the crop retry ran');
    assert.deepEqual(other, [], 'no request left the model stub');
    assert.equal(reading.per_serving.protein_g, 7);

    const images = await Promise.all(sent.map(async body => {
      const buffer = Buffer.from(body.input[0].content[0].image_url.split(',')[1], 'base64');
      const meta = await sharp(buffer).metadata();
      const [r, , b] = (await sharp(buffer).stats()).channels.map(channel => channel.mean);
      return { width: meta.width, height: meta.height, r, b };
    }));
    assert.deepEqual([images[0].width, images[0].height], [100, 200], 'first read sees the upright portrait');
    const crop = images[1];
    assert.ok(crop.width > crop.height, `crop ${crop.width}x${crop.height} is the wide label band`);
    assert.ok(crop.width >= 70 && crop.width <= 75 && crop.height >= 22 && crop.height <= 27, `crop ${crop.width}x${crop.height}`);
    assert.ok(crop.r > 240 && crop.b < 20, `crop is the red label block, got r=${crop.r} b=${crop.b}`);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of keys) if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
  }
});
```
Control: with `sharp(image).rotate()` in `label.ts` changed to `sharp(image)`, the test fails (0 of 1). It prints "Model trace could not be stored." twice, because it removes the database settings so no trace is written; that is expected.

Done when (#572, #706): each of the two files passes in step 5.


## PR 14 — branch `fix21/test-repairs` — #711 (the rest)
**Service:** eleven test files; `DetailImage` in `src/components/OutlineOverlay.tsx` owns which photo the meal detail shows. **Boundary:** `npm test`; the meal detail with outlines on.
**Blast radius:** nineteen tests that fail on main pass. One product change: in the meal detail with outlines on, a photo that changes while the screen is open shows the new photo at once (fact above). If that edit is wrong, the meal detail shows the smaller copy of a photo where it showed the sharp one; nothing is lost. The question heading on the meal detail changes its words (moved here from PR 3).
**Page look:** at 390 wide, the detail of meal F1 from "Local fixtures", which opens with its outlines on (fact above), and the detail of meal F5, which has a question. Reference: production; no difference expected but the heading's words on F5.
**What each repair does.** `card-polling`, `feed-unavailable-retry`, `needs-input-batch`, `feed-removal`: the fake clock is a `setTimeout`, as the components now use. `card-polling` also asserts the Nov 4 rule (first poll after two seconds, then backing off), where it asserted a poll every two seconds. `desktop-review`: a fake `setTimeout`, and the answer in today's shape. `feed-cache-lifecycle`, `feed-removal`: the two missing stubs. `servings-sql`: 0.05 is the out-of-range value, since 0.1 is now allowed. `local-time`: accepts "PM" and "p.m.". `sharp-image-identity`: passes `sharp`, and the component is fixed.

File `src/components/OutlineOverlay.tsx`. One row, then five edits:

| File | Find | Replace |
|---|---|---|
| `src/components/OutlineOverlay.tsx` | `"A question about this meal"` | `"A quick question about your meal"` |

File `src/components/OutlineOverlay.tsx`.

Find:
```
  const [originalUrl, setOriginalUrl] = useState<string | null>(() => (sharp && cacheKey && typeof sessionStorage !== "undefined" ? readOriginalCache(cacheKey) : null));
```
Replace:
```
  const [loaded, setLoaded] = useState<{ of: string; url: string } | null>(() => {
    const cached = sharp && cacheKey && typeof sessionStorage !== "undefined" ? readOriginalCache(cacheKey) : null;
    return cached ? { of: photo.url, url: cached } : null;
  });
  const originalUrl = loaded && loaded.of === photo.url ? loaded.url : null;
```
Find:
```
    if (cached) { setOriginalUrl(cached); return; }
```
Replace:
```
    if (cached) { setLoaded({ of: photo.url, url: cached }); return; }
```
Find:
```
      setOriginalUrl(photo.url);
      if (cacheKey) writeOriginalCache
```
Replace:
```
      setLoaded({ of: photo.url, url: photo.url });
      if (cacheKey) writeOriginalCache
```
Find:
```
      setOriginalUrl(null);
      setReloadOriginal(n => n + 1);
```
Replace:
```
      setLoaded(null);
      setReloadOriginal(n => n + 1);
```
Find:
```
    setOriginalUrl(null);
    setFailedSharp(imageIdentity(src));
```
Replace:
```
    setLoaded(null);
    setFailedSharp(imageIdentity(src));
```

File `tests/card-polling.test.mjs`.

Find:
```
  const effects = [], intervals = [], refs = [];
  const doc = { visibilityState: hidden ? 'hidden' : 'visible', addEventListener() {}, removeEventListener() {} };
```
Replace:
```
  const effects = [], timers = new Map(), refs = [];let timerId = 0;
  const doc = { visibilityState: hidden ? 'hidden' : 'visible', hidden, addEventListener() {}, removeEventListener() {} };
```
Find:
```
    setInterval:cb=>{intervals.push(cb);return cb;},clearInterval(){},
```
Replace:
```
    AbortSignal,setTimeout:(cb,ms=0)=>{timers.set(++timerId,{at:now+ms,cb});return timerId;},clearTimeout:id=>{timers.delete(id);},
```
Find:
```
async tick(ms){now+=ms;for(const cb of intervals)cb();await new Promise(resolve=>setImmediate(resolve));}
```
Replace:
```
async tick(ms){now+=ms;for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.cb();}await new Promise(resolve=>setImmediate(resolve));}
```
Find:
```
test('hidden pages make no reads; active analysis retains two-second fallback',async()=>{
```
Replace:
```
test('hidden pages make no reads; active analysis polls from two seconds and backs off',async()=>{
```
Find:
```
for(let i=0;i<5;i++)await active.tick(2000);assert.ok(active.reads()>=5);active.cleanup();
```
Replace:
```
await active.tick(2000);assert.equal(active.reads(),2,'first poll two seconds after the opening read');for(let i=0;i<60;i++)await active.tick(2000);assert.ok(active.reads()>=6&&active.reads()<=12,`expected backed-off polling, received ${active.reads()}`);active.cleanup();
```
File `tests/desktop-review.test.mjs`.

Find:
```
{exports:exported,Intl,Date,AbortController,fetch:
```
Replace:
```
{exports:exported,Intl,Date,AbortController,setTimeout:()=>1,clearTimeout(){},fetch:
```
Find:
```
json:async()=>({day:{date:'newest'}})
```
Replace:
```
json:async()=>({date:'newest'})
```
Find:
```
json:async()=>({day:{date:'stale'}})
```
Replace:
```
json:async()=>({date:'stale'})
```
File `tests/feed-cache-lifecycle.test.mjs`.

Find:
```
  if(name==='@/lib/posts/today-view')return{todayFromPage};
```
Replace:
```
  if(name==='@/lib/posts/today-view')return{todayFromPage};
  if(name==='@/lib/posts/home-today')return{homeToday:async()=>null,readToday:async()=>null};
```
Find:
```
   if(name==='@/lib/posts/upload-manager')return{uploadManager:{list:()=>[]}};
   if(name==='@/lib/theme/tokens')
```
Replace:
```
   if(name==='@/lib/posts/upload-manager')return{uploadManager:{list:()=>[]}};
   if(name==='@/lib/posts/upload-target')return{uploadTargetsPost};
   if(name==='@/lib/theme/tokens')
```
Find:
```
import {readFeedCache,writeFeedCache,clearFeedCache} from '../src/lib/posts/feed-cache.ts';
```
Replace:
```
import {readFeedCache,writeFeedCache,clearFeedCache} from '../src/lib/posts/feed-cache.ts';
import {uploadTargetsPost} from '../src/lib/posts/upload-target.ts';
```
File `tests/feed-removal.test.mjs`.

Find:
```
  if(name==='@/lib/posts/upload-manager')return{uploadManager:{list:()=>[]}};
```
Replace:
```
  if(name==='@/lib/posts/upload-manager')return{uploadManager:{list:()=>[]}};
  if(name==='@/lib/posts/upload-target')return{uploadTargetsPost:()=>false};
```
Find:
```
setInterval:fn=>{discoverTick=fn;return 1;},clearInterval(){},setTimeout:fn=>{retryTimers.push(fn);return retryTimers.length;},clearTimeout(){},
```
Replace:
```
setTimeout:(fn,ms)=>{if(ms===1000){retryTimers.push(fn);return retryTimers.length;}discoverTick=fn;return 0;},clearTimeout(){},
```
File `tests/feed-unavailable-retry.test.mjs`.

Find:
```
setInterval(fn){interval=fn;return 1;},clearInterval(){},
```
Replace:
```
setTimeout(fn){interval=fn;return 1;},clearTimeout(){},
```
File `tests/local-time.test.mjs`.

Find:
```
/5:20\s*PM/
```
Replace:
```
/5:20\s*(PM|p\.m\.)/
```
Find:
```
/2:20\s*AM/
```
Replace:
```
/2:20\s*(AM|a\.m\.)/
```
Find:
```
'2026-11-01T07:30:00Z','America/Edmonton'),/1:30\s*AM/
```
Replace:
```
'2026-11-01T07:30:00Z','America/Edmonton'),/1:30\s*(AM|a\.m\.)/
```
Find:
```
'2026-11-01T08:30:00Z','America/Edmonton'),/1:30\s*AM/
```
Replace:
```
'2026-11-01T08:30:00Z','America/Edmonton'),/1:30\s*(AM|a\.m\.)/
```
Find:
```
/2:30\s*AM/
```
Replace:
```
/2:30\s*(AM|a\.m\.)/
```
File `tests/needs-input-batch.test.mjs`.

Find:
```
document:{hidden:false},process:
```
Replace:
```
document:{hidden:false,visibilityState:'visible',addEventListener(){},removeEventListener(){}},window:{addEventListener(){},removeEventListener(){}},process:
```
Find:
```
  setInterval(fn){tick=fn;return 1;},clearInterval(){},fetch:
```
Replace:
```
  setTimeout(fn){tick=fn;return 1;},clearTimeout(){},fetch:
```
File `tests/servings-sql.test.mjs`.

Find:
```
current_setting('sv.owner')::uuid, 0.1); raise exception 'range allowed';
```
Replace:
```
current_setting('sv.owner')::uuid, 0.05); raise exception 'range allowed';
```
File `tests/sharp-image-identity.test.mjs`.

Find:
```
 const props=url=>({photo:{url:url.replace('/v2.webp','/original.jpg'),previewUrl:url},alt:'Meal'});
 view.render(props(first));view.images[0].onload();
```
Replace:
```
 const props=url=>({photo:{url:url.replace('/v2.webp','/original.jpg'),previewUrl:url},alt:'Meal',sharp:true});
 view.render(props(first));view.images[0].onload();
```

File `tests/db/today-summary.test.mjs` (#710's test; it is run by `npm run test:db`, not by `npm test`). Its checks pass, and it then fails in its own clean-up: it runs the rollback file and then repeats the rollback's two statements, and the second `revoke` finds no function.
Find:
```
${rollback}
revoke execute on function public.today_summary(text) from authenticated;
drop function if exists public.today_summary(text);
rollback;`;
```
Replace:
```
${rollback}
rollback;`;
```

File `tests/db/user-cap.test.mjs` (also run by `npm run test:db`). It expects an invalid `POST /api/posts` to be refused with 429 once the hourly limit is reached. Since Nov 4 that route counts meals, not requests (`src/app/api/posts/route.ts` lines 37–44), which the owner's ruling 6 keeps, so an invalid body is answered 400 first. The row is removed; the same limit is still tested through `/api/posts/food`.
Find:
```
    ['POST', '/api/posts', 'post', 40, 400],
    ['POST', '/api/posts/food', 'post', 40, 400],
```
Replace:
```
    // /api/posts counts meals, not requests (#471, kept by the owner's ruling on #716): an invalid body is answered 400 before the limit is read, so it has no row here.
    ['POST', '/api/posts/food', 'post', 40, 400],
```

Done when: on a clean checkout of this branch `npm test` fails only PR 6's eight and PR 13's one, `npm run test:db` passes with the app running and `npx tsc --noEmit` reports nothing. `npm run lint` reports the same three errors as main; the one in `OutlineOverlay.tsx` moves from line 68 to line 72.

## The browser — for the fixtures, the page looks and the checks
The browser is a headless Firefox driven over WebDriver BiDi, as Fleets 14 and 15 drove theirs (fact above; the calls are those of `scripts/run15-b-production.mjs`). It is not the PPLX Firefox on display :10 and never uses that profile. Playwright is not used.
- **The driver.** The coder sends these commands from a Node 22 script of its own kept under `/tmp/mfa-f21/` (Node's built-in `WebSocket`; nothing installed). The script is not committed and is deleted in step 8. (Node 22.23.2, fact above.) It copies no code from `scripts/run15-b-production.mjs` or any other file in the repository; each command it sends is named in this section, and the repository gains no second browser helper.
- **Start** it once, in step 5c: `mkdir -p /tmp/mfa-f21/firefox && firefox --headless --no-remote --profile /tmp/mfa-f21/firefox --remote-debugging-port=9311 about:blank &` (premise above). Connect to `ws://127.0.0.1:9311/session`, send `session.new` with `{capabilities:{alwaysMatch:{}}}`, then `browsingContext.create` with `{type:'tab'}`. The same tab is used to the end.
- **Width.** "390 wide" is `browsingContext.setViewport` with `{width:390,height:844}` and `devicePixelRatio:3`; "1280 wide" is `{width:1280,height:900}` and `devicePixelRatio:1`.
- **Open a page** with `browsingContext.navigate` and `wait:'complete'`, then wait one second.
- **Evaluate** means `script.evaluate` with `awaitPromise:true` on the tab.
- **Tap** means `input.performActions` with a touch pointer: move to the element's centre, down, up, as `tap()` in `scripts/run15-b-production.mjs` does. **Type** means setting the field's value with the input's own value setter and sending an `input` event, as `fill()` in the same file does.
- **Sign in** once: open `http://127.0.0.1:60260/sign-in`, type the value of `TEST_USER2_EMAIL` from `.env.test.fleet21` into the field labelled "Email" and `TEST_USER2_PASSWORD` into "Password", and tap "Sign in" (fact above). The tab stays signed in for the looks and the checks, because every PR's build uses the same sign-in service.
- **Offline, and blocking one address.** Send `network.addIntercept` with `{phases:['beforeRequestSent']}` (offline) or with `urlPatterns` naming the address (blocking), subscribe to `network.beforeRequestSent`, and answer each held request with `network.failRequest` (or `network.continueRequest` for a held request that is not to be blocked). Back online: `network.removeIntercept` (premise above).
- **Network log:** subscribe to `network.responseCompleted` and `network.fetchError` and keep each request's address, status and time.
- **Slowing.** Firefox has no processor slowing (fact above) and no network slowing was found (premise above). A step that names the slow-4G profile or a slowed processor is run without slowing, and its result says "not slowed".
- **Stop** it in step 8: end the session, stop the Firefox process, remove `/tmp/mfa-f21/firefox` and the driver script.

## Local fixtures — the meals the page looks and the checks use
Everything here is on the local build at `http://localhost:60260`, signed in as local test user 2, and writes only to the disposable database and its local photo store. In the commands, `$DB` stands for `"$(grep ^SUPABASE_DB_URL= /home/opc/Projects/my-food-ai/.env.test.fleet21 | cut -d= -f2-)"`. "Evaluate", "tap" and "type" are as the section "The browser" says.

**The image.** `scripts/fixtures/plate3.jpg` (1280 × 853). Where a second, different photo is called for: `scripts/fixtures/plate2.jpg` (1280 × 1280).

**How a photo is attached.** The capture sheet's file fields are hidden and open the system's file picker, which a driven browser cannot use. So the photo is handed to the open sheet by the page's own event, as Fleet 15's script did (fact above):
1. In the checkout, print the script for the image once: `node -e 'const n=process.argv[1],b=require("fs").readFileSync("scripts/fixtures/"+n).toString("base64");console.log("(()=>{const raw=atob(\""+b+"\");const file=new File([Uint8Array.from(raw,c=>c.charCodeAt(0))],\""+n+"\",{type:\"image/jpeg\"});window.dispatchEvent(new CustomEvent(\"capture-files\",{detail:{files:[file]}}));return true;})()")' plate3.jpg` (the last word is the image's file name). The output is one expression of 93,641 characters for `plate3.jpg` and 628,961 for `plate2.jpg` (measured Nov 15). Fleet 15 sent both sizes through the same call (fact above). Keep it in a shell variable or a file under `/tmp/mfa-f21`; do not put it in the repository.
2. Open the sheet. For a new meal, on Home, evaluate `window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera'}}))`. For a photo added to a meal, evaluate `window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',forPost:'<the meal id>',notEaten:false}}))`; for a leftovers photo use `notEaten:true`. The meal id is the last part of the address its "Details ›" link opens.
3. Evaluate the printed expression. The photo appears in the sheet.
4. For a new meal: type the caption the fixture names into the field whose `aria-label` is "Caption" (its placeholder reads "What did you eat?"), wait until the button "Post" is enabled, and tap it. For an added photo, wait until the sheet closes by itself or its "Post" button is enabled, and tap it if it is.

| Fixture | What it is | How it is made |
|---|---|---|
| F1 | A finished photo meal | Steps 1 to 4 with caption `Fixture ready`. Wait until its Home card shows its numbers. Then read, every 5 seconds for up to 120 seconds (a card image can arrive after the numbers; the card's poll stops after 120 seconds, `CARD_POLL_BUDGET_MS` in `src/components/RealtimePost.tsx` line 13), `psql $DB -Atc "select count(*) from public.post_media m join public.posts p on p.id=m.post_id where p.caption='Fixture ready' and m.kind='card'"` and write down the first number above 0, or 0 at 120 seconds: 0 means the local stack made no numbers card, and PR 3's second-slide look and check K18 are then reported as not done. If it has not finished after 60 seconds, read `psql $DB -Atc "select status, fail_reason from public.posts where caption='Fixture ready'"`, write the answer in the report, and report every look and check that names F1 as not done; the rest of the run continues. |
| F2 | A failed photo meal | Steps 1 to 4 with caption `Fixture failed`. When it has finished: `psql $DB -v ON_ERROR_STOP=1 -c "update public.posts set status='failed', fail_reason='meta: fixture' where caption='Fixture failed'"`. Reload Home. Its card reads "The analysis service refused this request. Try again." with a "Try again" button. Do not press "Try again": there is no failed job behind this meal, so the retry is refused. |
| F3 | A meal still being analysed | Steps 1 to 4 with caption `Fixture unfinished`. When it has finished: `psql $DB -v ON_ERROR_STOP=1 -c "update public.posts set status='processing' where caption='Fixture unfinished'"`. Reload Home. Its card shows the grey placeholder lines and "Processing". To finish it again (PR 9's look): the same command with `status='ready'`. |
| F4 | A second finished photo meal | As F1, with `plate2.jpg` and caption `Fixture ready 2`. |
| F5 | A meal with a question | As F1, with caption `Fixture question`. When it has finished: `psql $DB -v ON_ERROR_STOP=1 -c "update public.posts set status='needs_input', needs_input='{\"question\":\"Was the sauce made with cream?\",\"short\":\"Clarification needed\",\"options\":[\"Yes\",\"No\"]}'::jsonb where caption='Fixture question'"`. Reload Home. Its card leaves the feed and the question strip shows "A question about this meal" (fact above). Its detail is at `/posts/<its id>`: read the id with `psql $DB -Atc "select id from public.posts where caption='Fixture question'"`. |
| F6 | A meal to delete (check K5) | As F1, with caption `Fixture delete`. |

All six are made once, in step 5c, on main's build, in the order F1 to F6; each PR's page look then runs on that PR's own build against the same database, so every look has them. If a fixture's command fails, or F3 does not stay unfinished, write what was seen and report the looks and checks that name it as not done; the rest of the run continues.

## Checks on the local build — #323, #351, #454, #512, #554, #569, #571, #598, #599, #615, #658, #700, #701, #703, #704, #705, #707, #708, #709, #710, and #592
These twenty-one items describe code that is already on main. Each gets one check, run once in step 5f, in the main checkout, on main's build from step 5c: `TEST_ENV_FILE=.env.test.fleet21 npm run test:app -- start` in the background, after every page look. The browser is signed in as local test user 2. Nothing here touches production or a customer. Each result goes in the final report as what was seen, in one or two sentences, with the numbers. A check that cannot be carried out is reported as not checked, with the reason; it stops nothing else.
**Blast radius:** rows in the disposable database only.

**The seed**, run once in step 5c, after every `npm test` and before the fixtures (75 finished meals, one a day, going back 75 days, so the account spans three months; these have no photo, and the meals with a photo come from "Local fixtures"):
`psql "$(grep ^SUPABASE_DB_URL= .env.test.fleet21 | cut -d= -f2-)" -v ON_ERROR_STOP=1 -c "insert into public.posts(user_id,caption,eaten_at,status,analysis_initialized_at) select u.id,'Seeded day '||n,now()-make_interval(days=>n),'ready',now() from auth.users u, generate_series(1,75) n where u.email='local-test-2@example.com'"`

| Check | Item | Steps | Record |
|---|---|---|---|
| K1 | #700 | Run `curl -s -o /dev/null -w '%{http_code}' 'http://127.0.0.1:60260/api/jobs/drain?holder=fleet21-check'` and the same without `?holder=…`. | The two status codes. Expected 409 and 400. `tests/drain-lease.test.mjs` passing in step 5 covers the lease half. |
| K2 | #701 | At 1280 wide, open Home and leave it 15 seconds. | The number of requests to `/api/today`. Expected 0 or 1. |
| K3 | #703 | At 390 wide, on Home, set the browser offline (section "The browser"). Tap a meal. Wait for the failure message. Tap its retry. Wait 20 seconds. Set the browser online and tap the Days tab. | Whether the failure message showed a second time, and whether the Days tab opened (an overlay left on screen would block it). |
| K4 | #704 | At 390 wide, open a meal that has a photo. In the page, list the `sessionStorage` keys that start with `mfa-original-`. Replace the value of that key with `{"url":"http://127.0.0.1:60260/missing.jpg","expiresAt":<the time now in milliseconds plus 3600000>}`. Reload. | Whether the photo shows, and what the key holds afterwards. If no such key exists on the local build, say so (it is written only when the detail shows the sharp photo; fact above). The meal is F1 from "Local fixtures". |
| K5 | #709 | Block requests whose address contains `/media` under `/api/posts/` (section "The browser": `urlPatterns` `[{type:'string',pattern:'http://127.0.0.1:60260/api/posts/*'}]`, failing the held requests whose address contains `/media` and continuing the others). On meal F6, add a photo as "Local fixtures" says (`notEaten:false`, image `plate2.jpg`). Wait for the failed chip. Delete the meal from its menu. Reload. | Whether the chip went when the meal was deleted, and whether it is still gone after the reload. |
| K6 | #454, #512 | At 390 × 844, open Days. Before touching it, read `window.scrollY`, `document.documentElement.scrollHeight` and the bounding box of today's cell. Then scroll up slowly through the two older months. | The three numbers; whether today's cell lies wholly inside the screen above the tab bar; the month name shown at the top as each month boundary crosses the top; any jump in `scrollY` while an older month loads. |
| K7 | #569 | At 390 wide, on Home, count the day circles. Scroll the row of circles to its far end and wait 5 seconds. Count again. | Both counts, and whether the last circle is whole. The account's first meal is 75 days old, so the row is expected to grow by 30 at least once. |
| K8 | #351 | At 390 wide, open the drink sheet. Scroll it to its end. Then press one tile with a touch pointer for 700 ms without moving. | The number of tiles and their order; whether the hold opened the sizes. |
| K9 | #554, #658 | At 390 wide, with the processor not slowed (section "The browser"), install a `MutationObserver` on `document.body` that records `performance.now()` at its first call. Tap a feed photo once with a touch pointer. Then, on another meal, tap twice within 200 ms. | Milliseconds from the single tap to the first change on screen, and to the meal detail being shown; for the double tap, whether the meal opened (it must not). |
| K10 | #615 | None of its own: PR 11's beer command in step 5 forces a caption that disagrees with the photo. | That command's exit code and first error, as PR 11 already records. |
| K11 | #705, #707 | None of its own: `tests/label-reading.test.mjs` and the test "online and explicit retry skip photo-lost attachments without network work" run in step 5. | Pass or fail of each, from the run on main's build. |
| K12 | #708 | Make one more finished photo meal as F1 is made, with caption `Fixture lost photo`, and do K5's first three steps on it (blocking, adding `plate2.jpg`, waiting for the failed chip), so a failed added-photo chip shows. In the page, open the IndexedDB database `mfa-uploads` and delete every row of the store `drafts`, leaving `intents`. Reload. The chip now reads "This photo was not kept. Take it again." Tap it. Then list the rows of `intents`. Reload. | Whether the camera opened; the number of rows in `intents` after the tap (expected 0); whether the chip is gone after the reload. If the chip does not read as a lost photo after the first reload, say so. |
| K13 | #599 | Run `psql "$(grep ^SUPABASE_DB_URL= .env.test.fleet21 \| cut -d= -f2-)" -c "alter function public.today_summary(text) rename to today_summary_off; notify pgrst, 'reload schema';"`. At 1280 wide, open Home. Wait 5 seconds. Then run the same command with the two names swapped, and press "Try again" in the Today column. | What the Today column shows at first paint, at 5 seconds, and after "Try again" (expected: a placeholder, then "Today's totals couldn't load. Try again", then the numbers). Run the swapped command even if the check fails. |
| K14 | #598 | With the app from this section running, open Home at 1280 wide and wait 10 seconds. Read `navigator.serviceWorker.controller.scriptURL` and the names from `caches.keys()`. Stop the app. Run the build command again (every build gets a new build id) and start the app. In the same browser profile, do one normal reload, wait 10 seconds, and do one more. | Before stopping the app, and after each reload: the build id, read with `document.documentElement.dataset.build` (fact above); whether `navigator.serviceWorker.getRegistration()` shows a `waiting` worker, and whether any response in the network log came from the service worker's shell cache. The item is met if the first or second normal reload shows a build id different from the one read before the app was stopped. |
| K15 | #571 | At 390 wide, not slowed (section "The browser"), post one photo meal as "Local fixtures" says, with `plate2.jpg` and caption `Fixture overlap 1`. While its card still shows as uploading, post a second with `plate3.jpg` and caption `Fixture overlap 2`. Wait until both cards are finished or failed. | Every request that did not answer 2xx or 3xx, with its address (ids shortened to 8 characters), status and time; whether "The meal could not be saved." appeared; which of the two meals, if either, needed Post pressed again. |
| K16 | #323 | Note the time. At 390 wide, already signed in, open Home once and wait 10 seconds. Run `podman logs --since <that time> mfa-test-auth-60260 2>&1 \| grep -o '"path":"[^"]*"' \| sort \| uniq -c`. Repeat for Days and for Profile. | For each page: the count of each path. The item's line is one sign-in call per page open. |
| K17 | #710 | Not in this section's run: in PR 14's worktree during step 5b, after `npm test` and before the app is stopped (PR 14 repairs this test's clean-up, and five of these tests call the app): `MFA_TEST_DISPOSABLE=1 npm run test:db`. | The pass and fail counts, and the result of `tests/db/today-summary.test.mjs` by name. That test covers the item's three cases (an empty day, a day with protein missing on every item, a day with known values). |
| K18 | #592 | At 1100, 1280 and 1440 wide, open meal F1 from Home (it opens over the page). Go to its second slide, the numbers card. Read the bounding box of the button labelled "Previous slide" and of every text node in the card. Then at 390 wide open the same meal. | At each width: the smallest gap in pixels between the arrow and any text (the item's line: no arrow covers any text or number). At 390: whether a numbers slide with arrows exists (the item says it does not). |

After the checks, stop the app.

(In this table, `\|` stands for the plain character `|`.)

## Reads on production — #322, #377, #573, #574
Four reads, run once in step 7 after the last merge is deployed. Each is read-only. None writes a row, signs up, or sends anything to anyone. Use `set -a; . ./.env.local; set +a` first. Ids in the report are shortened to 8 characters; no email address is written anywhere.
**Blast radius:** none; reads only.

| Read | Item | Command | Record |
|---|---|---|---|
| R1 | #573 | `psql "$SUPABASE_DB_URL" -Atc "select count(*) filter (where labels > 1), count(*) filter (where labels = 1), (select compact from public.nutrition_provenance_format limit 1) from (select (select count(*) from jsonb_array_elements(n.micronutrients) e where e ? 'approximation') as labels from public.item_nutrition n where jsonb_typeof(n.micronutrients) = 'array') s"` | The three values: rows whose label repeats, rows with one label, and whether the once-per-food format is on. The item is met when the first is 0 and the third is `t`. |
| R2 | #377 | `psql "$SUPABASE_DB_URL" -Atc "select i.name, i.portion_text, i.portion_grams, n.food_category, n.calories, (select e->>'value' from jsonb_array_elements(n.micronutrients) e where e->>'nutrientId' = '1057' limit 1), (select count(*) from public.intake_logs l where l.post_item_id = i.id) from public.post_items i left join public.item_nutrition n on n.post_item_id = i.id where i.post_id::text like '4dfe4411%' and i.superseded_at is null"` | For the Oct 29 black coffee the backlog names: each item's name, portion, category, kcal, stored caffeine and number of drink records. This says whether the 112 kcal and the missing caffeine come from the name, the category or the matched record. |
| R3 | #574 | Signed in to production as test account 1 and then as test account 2 (`.env.local`), at 390 wide, open Days, go to October 2026, and read the `aria-label` of the Oct 31 cell and the count in that day's summary line. | Both texts for each account. The item is met when the two counts agree on both accounts, or the account has no Oct 31 posts (say so). |
| R4 | #322 | Within one minute of the last deployment becoming ready, and before opening the app: `curl -s -o /dev/null -D - -w 'total %{time_total}\n' "$APP_URL/api/jobs/tick"` three times, ten seconds apart. | For each call: `x-tick-cold` and the total time. This times one cold start after the change; the "before" time and the phone post in the item's done line are not covered. |

`$APP_URL` is set by `.env.local` to `https://my-food-ai-ten.vercel.app`, the production address (fact above).

## Docs PR — branch `docs/fleet21` — #698 (reviewed by PPLX; not merged unless the owner says so)
**Blast radius:** words in two contracts. Nothing is enforced.
Append to the end of `docs/coder-contract.md` and of `docs/planner-contract.md`:
```
## Merge control (written rule, owner ruling Nov 14 2026)

Routes to main as observed on Nov 15 2026: the web merge button, `gh pr merge`, a direct push,
and the API. main has no branch protection and no rulesets. Auto-merge is off. There is no merge
queue and no workflow. Every agent acts as the owner's admin account, so GitHub refuses nothing.

The rule: a pull request merges only when the PM orders that one PR at its full head SHA, after
the planner's evaluation and a zero-blocker review of that exact head. A coder never merges on a
plan, a standing order, or its own judgement. The owner ruled that this stays a written rule.
```
Also commit this plan unchanged as `docs/plan-fleet21.md`.

**#690** (same docs PR, plus one deletion on production that the item orders):
1. Sign in to production as test account 2 (`TEST_USER2_EMAIL`, `TEST_USER2_PASSWORD` in `.env.local`). In Search, find the meal captioned "Fleet 17 post-close 2". Open its menu and delete it.
2. The draft the item names lives in the browser that made the post; it cannot be reached from another machine. Say so in the report.
3. File `docs/run17-report.md`. Find `The driver's pass flag never failed the command (#628).` and add after it, in the same paragraph: ` A post captioned "Fleet 17 post-close 2" was created at 16:21 UTC, between the retry and v4 batches; it has no receipt and is in no evidence file, so a fourth batch may have run that this report does not count.`
**Blast radius:** one test meal on test account 2 is deleted; one sentence is added to a report.
Done when: the meal no longer shows on test account 2, and the report carries the sentence.

---

# Part 2 — not dispatched (27 items): each one's reason and what it needs

The statements about code in section A were re-read on main by the second planner on Nov 15, each at the file beside it. Sections B and C are the first planner's reads except where marked; treat those as unchecked.
None of these items is called done.

## A. The code on main already does what the item asks (8). Each needs a check that this run cannot make.
The ones GrokBot failed or could not run on Nov 5 are marked **GrokBot re-checks**; those checks are on production and are GrokBot's, not the coder's. The planner cannot tell
whether GrokBot ran before the last Nov 5 merges or saw rows stored before a fix.

| Item | What the code does | Where | Needs |
|---|---|---|---|
| #686 | the dropped wake is queued and run after the read in flight (commit `52783621`) | `src/components/Thread.tsx` lines 27, 44 | Nothing more is built. Its done line also asks for a test, and the planner contract allows new tests only for money, sign-in and access, mail routing, migrations and data rules; a polling race on a meal's page is none of those, so the contract wins. The planner wrote such a test and ran it in memory (it passed on main and failed with the fix removed); it is not in this plan. The PM ruled on Nov 15 that the contract wins and is removing the test from #686's done line in the Doc; the item closes on the fix alone. |
| #570 **GrokBot re-checks** | the leftovers sheet waits only for a small save, then closes | `CaptureSheet.tsx` lines 296–305; `postAttachment` | timing on production |
| #575 **GrokBot re-checks** | an unavailable food carries a reason and a plain sentence; rows stored before that have none | `src/lib/fdc/unavailable.ts`; `src/lib/pipeline/wording.ts` line 8 | a new unavailable meal on production; old rows need re-analysis to gain a reason |
| #523 **GrokBot re-checks** | closest record, then rice with protein, then a model estimate | `src/lib/fdc/match.ts` lines 92–109 | the owner's macaroni post re-analysed |
| #449 **GrokBot re-checks** | each pending food's name is drawn with a shimmer until its kcal arrives | `PostCard.tsx` lines 63–65; `pending-items.ts` | the model-call log for one upload |
| #452 **GrokBot re-checks** | the label prompt names Indonesian labels and terms; a label in Photo mode is read by the analysis | `src/lib/prompts/spark/label.ts`; `src/lib/pipeline/analyze.ts` line 263 | the Goldfish photo and the English label posted on production |
| #557 | provider errors are kept unless the saved label has a name, a serving unit and at least one of the four main values; a label of all zeros still counts as complete | `barcode-resolver.ts` lines 19–21; `barcode-product.ts` lines 93–101 | PM to close. Re-read Nov 15: a saved label counts as complete only with a name, a serving unit and usable nutrition (`barcode-product.ts` line 100); a label of all zeros is a real label (water). `tests/barcode-resolver-outage.test.mjs` passes on main |
| #715 | both review captures are tracked on the docs branch of PR #682; they are not on main | `git ls-files docs/reviews` on the docs branch; `git ls-tree origin/main docs/reviews` | PM to close when #682 merges, or to rule on them |

## B. Cannot be planned to exact text today (2): the reason and what is needed

| Item | Reason | What is needed |
|---|---|---|
| #691 | `push-row-delete.json` exists nowhere on disk, so it cannot be committed. The other seven evidence files are tracked. | Either the check that made it is run again, or the PM changes the closing comments. |
| #908 | The Wall is one table of 63 rows whose fourth column is the rule. It can be split without loss. The item says the rules list's wording is not decided. | The owner's wording, or his word that the fourth column is used as it stands. |

## C. Findings delivered or investigations that need access (13)

| Item | State |
|---|---|
| #659 | Read against main. Not present: the "serving" unit, feed discovery when hidden, the question strip after an empty read, card refresh on visibility, the wording script's commit hash. Three real gaps for the owner to add as items: the question strip does not start polling again after a signed-out first read (`NeedsInputStrip.tsx` line 42); the thread's retry poll has no visibility listener, so its first poll back can be 30 s late (`Thread.tsx` lines 50–56); the header's date line can be clipped in its fixed 52 px row (`PostDetailHeader.tsx` lines 66–68). |
| #578 | The 26 findings are the table rows of `docs/reviews/main-a24587a-dry-service-audit.md`. Rank 1 is built; rank 8 is PR 8; rank 6 is PR 9. The other 23 are for the PM to file, one row each. |
| #60 | The production host appears about 11,000 times and the Supabase project host about 2,300 times, nearly all in `docs/evidence/`; 188 tracked files hold post or account ids; the only email addresses are test patterns. The owner chooses what stays. |
| #712 | The receipt that exists is `docs/evidence/run19/ten-photos.json` (pass true, 50 calls all 200). No tracked file records a failed ten-photo run. The failure claim is for the PM to withdraw or back. |
| #687 | No tracked file holds the submission text. GrokBot checks the mic and the switch; the owner checks the portal. |
| #695 | GrokBot on production: a feed photo asked for while the resizer is busy. PR 8 changes which address the feed asks for, so GrokBot re-checks after the merge. |
| #689 | In code the avatar route answers 404 to another non-admin user and sends a private cache header. The production check is GrokBot's. Reviewing the seven merged heads needs the PM's order naming them. |
| #694, #285, #617 | A read-only study of the owner's posts. Needs the owner's leave to read his production rows. |
| #373 | Needs the Supabase usage page. PR 8 and PR 9 cut photo and feed reads. |
| #368 | Not run: 60 fast sign-ups through production could lock judges out. Needs a time window from the owner and a second network. |
| #699 | The five most recently pushed other repositories are private; the read of them was declined at the permission prompt. Needs the owner to allow it. |

## D. The owner or a real phone (4)
#594 (ruled Nov 15: stays open until tried on a real phone), #212, #279, #716 (ruled Nov 15: the limit keeps counting new meals only; the PM records it and closes the item).

The item with no number yet (MCP server guide): `docs/agents.md` already tells a person how to create a token, where the server is (`/mcp`), which header to send and which four tools exist. The server accepts only a fixed `Authorization: Bearer` header and has no sign-in flow of its own (`src/lib/agents/tokens.ts` lines 25–26). Whether ChatGPT can send such a header was not checked, so the cause of its failure is not known. Needed: one attempt to connect ChatGPT following `docs/agents.md`, with the error it shows.

# Part 3 — notes for whoever continues this plan

- Run one test file alone, before PR 6 is merged, with:
  `node --env-file=.env.test.local --import ./tests/fixtures/local-providers.mjs --import tsx --test tests/<file>`.
  `npm test` with any argument runs the whole suite for minutes.
- GrokBot's Nov 5 failures on items in Part 2 A may be rows stored before a fix (the cocktail's caffeine, a meal with
  no reason) or a build older than the last Nov 5 merges. The planner could not tell which.
- On Nov 15 the second planner applied every edit in Part 1 to a fresh copy of main with a script that reads this file, type-checked it (nothing reported), linted it (the same 3 errors and 14 warnings as main) and ran the whole suite: 696 tests, 690 pass, 0 fail, 6 skipped. The lease change (PR 7), the photo route (PR 8) and the card change (PR 9) compile and break no test, but in that run no test exercised the new photo route, the heartbeat or PR 9's changed line. The third pass added a test of the photo route to PR 8; the planner did not run it. The heartbeat and PR 9's line still have none. No test exercises the bookmark's new message line or its 120-second message either; the repaired bookmark test covers which meals are refused. After that run, later passes added PR 8's photo test (not run) and the tests for #324, #572, #702 and #706 (run in memory, each with a failing control).
- The planner's copies were not git checkouts and used a symlinked `node_modules` in one place; `next build` refuses a symlinked `node_modules`. Neither affects a coder's worktree.
- Not built from GrokBot's Nov 15 readings, and for the owner to add as items if he wants them: a bookmark tapped on an upload card is lost when the finished card replaces it; a failed meal's page reads "Nutrition could not be updated." before any tap; a blocked cover photo offers no retry; a zero-byte or non-image file reads "Upload failed. The server didn't respond."; a cut-off JPEG is analysed as a meal.
- The first planner's Part 2 said the #625 test did not exist. Two tests in `tests/upload-guard.test.mjs` already covered half each; PR 13 adds the whole.
- Six read-only searches fed Part 2. The one on the owner's other repositories stopped at the permission prompt.

---

## For RT (read from here)

- **The run stops once,** before the merges, for the PM's order naming each PR and its head SHA.
- **50 engineering items are worked: 26 by a build, 24 by a check** (20 checks on the local build, 4 read-only on production after the merges). **27 are not, each with its reason** (8 + 2 + 13 + 4 = 27). None is called done.
- **The designer's six and the four Interdit items:** one designer item (#592, the arrow over "kcal") is checked on the local build. The other five wait for the designer. The four Interdit items are not worked.
- **The test suite on main is red: 28 of 692 tests fail before this plan changes anything.** This plan repairs all 28 (PRs 6, 13 and 14). The planner wrote each repair and ran it. With every edit as of the second pass applied: 696 tests, 690 pass, 0 fail, 6 skipped. The tests added after that run were not in it: PR 8's photo test (not run at all), and the tests for #324, #572, #702 and #706, each run alone in memory and passing, each failing when its fix is removed. The run must show them passing, or their PR does not merge.
- **Photos (your yes):** every photo gets a permanent secret address served through Vercel's CDN. Anyone handed an address can open that one photo without signing in. A deleted photo can still be served from a cache for up to a day at the CDN and up to a year in a browser that already has it. Photos are not made smaller or less sharp.
- **Photos, the risk and its test (PR 8):** this is the one change that widens who can see something. It now has a test that asks for a photo with no sign-in: the right secret opens it; a wrong secret, another photo's id, an unlisted size and a deleted meal are all refused. The planner wrote that test and could not run it; the run must show it passing before PR 8 merges.
- **A photo defect found and fixed (PR 8):** since the sharper camera, the small feed copy has failed for every new photo and the app has sent the full 1920-pixel file in its place. That is one cause of the slow first photo. The small copy works again.
- **One migration on production, which your approval of this plan approves:** `0063_photo_secret.sql` adds one column to the photo table. The coder applies it right before PR 8 merges, after the PM's merge order names PR 8, and reads it back. If it fails, PR 8 does not merge.
- **Four reads on production, read-only, which your approval also approves:** a count of nutrition rows, one of your meals (the Oct 29 black coffee the backlog names), the Days screen on the two test accounts, and three timed calls to the worker's status address.
- **Photos when the server is busy:** the new address answers with a one-minute link to the stored original, as today, so a photo never shows broken.
- **Behaviour changed (bookmark, PR 6):** a refused bookmark now explains itself in one line under that meal's buttons, not in a bar over the page. The three sentences are the plan's words, not yours: "This meal did not finish analysis and cannot be saved." (kept), "Answer the question about this meal first. Then it can be saved." (new), "This meal is still being analysed. Save it when it finishes." (new). The design has no frame for this line.
- **Behaviour changed:** "Log again" becomes "Eat this again"; "Drank in this meal" becomes "Drinks with this meal" on new cards (stored card images keep the old words); the Home question reads "A quick question about your meal".
- **Behaviour changed (your rulings today):** the thumbs are black at rest; the bookmark is never faded.
- **#686 gets no test, by the contract (the PM's ruling, Nov 15).** The contract allows new tests only for money, sign-in and access, mail routing, migrations and data rules, and #686 is a polling race on a meal's page. The fix is already on main. The PM is removing "and a test covers it" from #686 in the Doc. #572, #702 and #706 keep their tests: a matching rule, an image rule and saved-meal state.
- **#324 rides with PR 8.** It edits the same two files as the photo change, and no two PRs edit one file, so it merges, or not, with PR 8. If PR 8's photo test or its migration fails, the shared read of today is dropped with it and Home keeps the double read for now.
- **Behaviour changed (your ruling today, PR 8):** Home reads today's meals once and the day circles and the desktop Today column share that read; nothing fills in late. The column's numbers now come from the same read as Days, so where the two disagreed, the column now matches Days. Today's circle now counts a finished meal that still has an unanswered question stored, as the column and Days already did. If today's read fails, today's circle reads its own total and the column loads in the browser, as now; it costs one extra read on that open only. The old database function for today's totals is no longer used; it stays in the database until a later migration removes it.
- **Behaviour changed:** `/profile/about` lists the judge's own meals; its "Your meals ›" link goes.
- **Behaviour changed:** a finished meal's card no longer re-reads itself when Home opens.
- **Behaviour changed:** in a meal's detail with outlines on, a photo that changes while the screen is open shows the new photo at once (PR 14).
- **Behaviour changed:** a drink that names no caffeine source no longer lists caffeine under "Show all".
- **Behaviour changed:** the worker's lock lasts 60 seconds and is renewed every 20, so a deploy stalls the queue for at most about a minute. If renewals fail for a minute, two workers can run side by side.
- **Behaviour added:** a mic in the new-post caption, the drink description and Search. Its screen-reader label is "Speak"; you have not ruled on that word. Each clip is a paid model call. There is no leftovers caption in the app, so none is added there.
- **Behaviour added:** "Remove" on a failed added photo. Removing it deletes the photo kept on the phone.
- **Removed:** one test meal on test account 2 ("Fleet 17 post-close 2").
- **Design and product disagree, left as they are:** a pressed button's dim is removed 80 ms after the finger lifts. An unfinished meal's card checks again after 2, 4, 8 seconds and so on up to 30, not every 2 seconds (since Nov 4). A meal posted on a dead connection is tried six times, about 16 seconds, before it shows as failed (since Nov 5).
- **Not solved in this run:** why your leftovers upload failed; the chip covering the numbers; the Days names; the spoken-clip half of the voice check on production; the two-second photo line is measured, not promised; three smaller bookmark and failed-meal defects GrokBot saw on Nov 15 (listed in Part 3).
- **Nothing in this plan waits on you. Three things are left as they are, each by a default this plan takes** (Part 2 B and C): your production rows are not read for the nutrition study, so that study is not done; your five private repositories are not read; the Wall stays one table, because the wording of its rules list is not decided. Say so if you want any of the three changed, and it goes into a later fleet.
- **Recorded for the PM:** the hourly limit keeps counting new meals only (#716 closes); the photo-saving setting stays open (#594).
- **Merge control:** the contracts gain the written rule. GitHub still refuses nothing.