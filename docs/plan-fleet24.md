# Fleet 24 plan

Planner: Fable 5.2, planner seat. Nov 16 2026 (WIB). All code read on `origin/main` = `9f5b60538f12525d225f37456faadf4d007c6636` (merge of #963) on Nov 16.
On Nov 16 the planner applied every code edit in Part 1 to a scratch copy of main outside the repository and ran there: `npx tsc --noEmit`, `npx eslint`, and the test files the edits touch or sit beside. The planner also built main and commit `96ecdcf` (the commit before Fleets 21 to 23) with placeholder settings and measured their JavaScript. The results are in the Facts table. The planner did not run the whole suite, a browser, the test stack or anything on production. Nothing was written to the repository or to GitHub.

**Stops: one.** One dispatch, one prompt. The run builds, reviews, tests, looks and audits without stopping. It then stops once, before the merges: the coder posts each PR number with its full head SHA and waits for the PM's merge order naming them. After the order the run goes to its end without another stop.

**Halts.** The only legal halts are: a review tool is unavailable when the review is reached; a fact this plan states turns out false; an operation would contact a customer or breach an explicit prohibition. A halt stops only its own item. Every independent item continues.

**When done, stop.** Done means every numbered item in Part 1 is reported done or not done. After that the coder opens no new PR, makes no new reading and no new fix. A defect found during the run, and every finding of the audit, is reported to the PM for the backlog and is not fixed in this run.

**Size.** The Engineering backlog (the owner's Doc, rev 1948, read from the PM's copy on Nov 16) holds 47 items, and the PM added #966 on Nov 16: 48. Every item has a GitHub issue number. This dispatch works **18**: 9 by a build with exact text, 8 by a check with exact steps, and 1 (#222) by the performance audit the PM ordered. The other **30** each have a stated reason in Part 2.

---

# Part 1: the dispatch (18 items)

Builds (9): #753, #944, #945, #946, #947, #948, #949, #955, #966.
Checks (8): #322, #323, #454, #512, #523, #615, #703, #708.
Audit (1): #222, with #323's production count and #322's timing as two of its readings.

In this plan, `<main>` means the main checkout, `/home/opc/Projects/my-food-ai`, and `<w>` means `/tmp/mfa-f24/stack-src`, a worktree that step 5a makes and step 8 removes.

## How it runs

1. **Cleanup first.** Run `git worktree list`. If it lists anything but the main checkout, remove it with `git worktree remove --force <path>`, then `git worktree prune`. Do not commit, stash or discard the uncommitted change in `<main>`.
2. **Build.** Each PR below in its own fresh worktree branched from `origin/main`. Nothing is stacked. No PR depends on another. No two touch the same file. There are 8 code PRs and one docs PR.
3. After each push: open the PR, then remove that worktree and delete its local branch.
4. **Reviews** run in a sub-agent beside the build, never before it. One external reviewer per PR: **PPLX** (`skills/pplx-review/SKILL.md`), one pass per head, run to zero blockers; PPLX then confirms the fixes only. If PPLX cannot run for a PR, use AGY (`skills/agy-review/SKILL.md`) for that PR. Codex does not review these PRs, because the code is written by an OpenAI model. If neither can run, that PR halts and the others continue. The docs PR is reviewed the same way.
5. **At the very end, in this order.**
   a. Once: `mkdir -p /tmp/mfa-f24 && git -C <main> fetch origin fix24/local-storage-copy && git -C <main> worktree add --detach /tmp/mfa-f24/stack-src origin/fix24/local-storage-copy`. In `<w>`: `npm ci`, then `TEST_STACK_DIR=/tmp/mfa-f24/stack TEST_ENV_FILE=.env.test.fleet24 npm run test:stack`. The stack is made from PR 8's branch, which is main plus one change to the local storage stand-in, because an added photo cannot finish on a stack made from main (fact below). The stack's keys expire 24 hours after this command.
   b. **Main's own result.** In `<w>`: `npm run lint`; `npx tsc --noEmit`; then with `TEST_ENV_FILE=.env.test.fleet24` set: `npm run test:app -- build`, `npm run test:app -- start` in the background, `MFA_TEST_DISPOSABLE=1 npm test`, `MFA_TEST_DISPOSABLE=1 npm run test:db`; stop the app. Write down the results. This is the one whole-suite run of the fleet.
   c. **Build and test each code PR.** For each code PR branch, in a temporary worktree: `npm ci`, `npm run lint`, `npx tsc --noEmit`, `TEST_ENV_FILE=/tmp/mfa-f24/stack-src/.env.test.fleet24 npm run test:app -- build`, then the test files its section names, each with `MFA_TEST_DISPOSABLE=1 node --env-file=/tmp/mfa-f24/stack-src/.env.test.fleet24 --import ./tests/fixtures/local-providers.mjs --import tsx --test --test-concurrency=1 <files>`. The whole suite is not run again per branch: seven repeats took about two hours in Fleet 22 and the PM accepted skipping them. Keep each worktree and its build for step 5e. **PR 6 is tested last**, and only for PR 6: first apply its migration to the disposable database, `psql "$(grep ^SUPABASE_DB_URL= /tmp/mfa-f24/stack-src/.env.test.fleet24 | cut -d= -f2-)" -v ON_ERROR_STOP=1 -f supabase/migrations/0064_drop_today_summary.sql`, then in PR 6's worktree start its app and run `MFA_TEST_DISPOSABLE=1 TEST_ENV_FILE=/tmp/mfa-f24/stack-src/.env.test.fleet24 npm run test:db`.
   d. **What counts as a pass.** A PR passes lint when it reports no error that main does not. A PR passes when its named test files pass, its type check is clean and its build succeeds. PR 5's and PR 7's new tests must pass on their branches.
   e. **The seed, the fixtures and the looks.** In `<w>`: start its app in the background, run the seed, start the browser, sign in and make the fixtures (section "The browser and the fixtures"); stop the app. Then for each PR that has a look, in its worktree from step 5c: start its app, do the look, stop the app, remove the worktree.
   f. **The local checks** K1 to K4 and the audit's local readings A2 and A3, in `<w>`, with its app started. Then stop that app.
   g. **The one stop.** Post one comment on each PR: its number, its full head SHA, its review result, its test result and its look result. Wait for the PM's merge order.
6. **The look**: that PR's own build at `http://127.0.0.1:60260`, signed in as local test user 2, at the width the PR names. Write what was seen against the PR's "Look" line as one comment on the PR. Store no image. Do not use Playwright.
7. **Merges.** Merge in ascending PR number, each only at the head SHA the order names. **Immediately before merging PR 6, and only after the merge order names PR 6,** apply its migration to production. In `<main>`, with `<SHA>` the full head SHA the order names for PR 6: `git fetch origin fix24/drop-today-summary && git show <SHA>:supabase/migrations/0064_drop_today_summary.sql > /tmp/mfa-f24/0064.sql && set -a && . ./.env.local && set +a && psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f /tmp/mfa-f24/0064.sql`, then read it back: `psql "$SUPABASE_DB_URL" -Atc "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='today_summary'"` (it must print 0). Write the number on PR 6. If the migration fails, PR 6 is not merged and is reported; the other PRs still merge. Delete each remote branch after its merge. The docs PR is not merged unless the order names it. After the last merge is deployed, run the production readings A4 to A7 and write each result in the final report and in the audit file's copy for the PM.
8. **End state.** Stop the browser and remove its profile and the driver script. In `<w>`: `TEST_STACK_DIR=/tmp/mfa-f24/stack TEST_ENV_FILE=.env.test.fleet24 npm run test:stack -- down`. Then `git -C <main> worktree remove --force /tmp/mfa-f24/stack-src`, remove the `96ecdcf` worktree of reading A2 the same way, and `rm -rf /tmp/mfa-f24`. Run `scripts/cleanup.sh`. `git worktree list` shows only the main checkout; `podman ps` shows no `mfa-test-` container. Paste the three outputs in the final report.
9. **Final report:** the 18 item numbers, each done or not done; for each check and reading what was seen, with the numbers; every finding, one line each, for the PM.
10. **New tests: two**, both data rules. PR 5 (Home and Days count the same meals and the same caffeine). PR 7 (a job that is not due is not waiting work). No test is added for a page, a poll or a message, by the PM's ruling in Fleet 23. #703's done line asks for a test; under that ruling it gets a check (K1) and no test. The planner wrote and ran such a test; it is not in this plan.

## Facts (planner checked on Nov 16 2026; the coder does not re-check)

| Fact | Check |
|---|---|
| `origin/main` is `9f5b6053`. Fleet 22's eight PRs and Fleet 23's three are merged. The only open PR is #682. | `git log origin/main -4`; `gh pr list --state open`, 15:40 UTC |
| Every "Find" text in Part 1 occurs exactly once in its file on `origin/main`. | a script counted each with Python's `str.count` on a copy made by `git archive origin/main` |
| With every code edit of Part 1 applied to a copy of main, `npx tsc --noEmit` reports nothing, and `npx eslint` reports the same 3 errors and 14 warnings as unmodified main. | run on scratch copies |
| PR 5's new test fails on unmodified main (300 against 100 kcal, 115 against 95 mg) and passes with PR 5's edits. PR 7's new test fails on unmodified main and passes with PR 7's edits; with PR 7's change to the existing worker test, `tests/worker-recovery-wake.test.mjs`, `tests/queue.test.mjs`, `tests/tick-split.test.mjs` and `tests/drain-lease.test.mjs` pass 6 of 6. | `MFA_TEST_DISPOSABLE=1 node --import tsx --test --test-concurrency=1 <files>` on both copies |
| These files, which need no stack, pass on the edited copy: `days-summary`, `days-range`, `days-reader-queries`, `home-day-totals`, `intake`, `today-view`, `feed-nutrition`, `needs-input-batch`, `sharp-image-identity`, `save-meal-readiness`, `day-total-changes`, `unknown-meal-totals` (with the two new files: 62 tests, 62 pass). | the same command |
| **Home's JavaScript did not grow.** Built with the same placeholder settings, the Home page's first-load JavaScript is 1,099,351 bytes (324,914 gzip, 20 files) at `96ecdcf` and 1,104,551 bytes (326,431 gzip, 20 files) at main `9f5b6053`: 5,200 bytes more, 0.5%. All client JavaScript is 1,808,491 bytes in 35 files against 1,844,415 in 36. `package.json` and `package-lock.json` are identical at both commits. No date-parsing or model-client library is in any client file at either commit. | `next build` in two scratch copies; `.next/diagnostics/route-bundle-stats.json` summed with a script; `git diff 96ecdcf origin/main -- package.json package-lock.json` is empty |
| Between `96ecdcf` and main, `src/` changed in 42 files (+369, −175). No new client component is mounted on Home, and no new timer, realtime channel or page refresh was added. What changed on a Home open: photos moved to new addresses (`/p/…`), which made every stored photo copy on every phone useless once; the server's first feed read gained one extra query; one profile read moved from the server to the browser. | `git diff --stat 96ecdcf origin/main -- src public package.json`; `src/lib/posts/feed-photo-url.ts`; `src/lib/posts/feed.ts`; `src/components/FirstRunHint.tsx` |
| The new photo address answers from Vercel's cache for one day. On a miss it reads two database rows, downloads the stored original (up to 8 MB) and resizes it; four resizes run at once per server instance, and when busy it answers with a redirect to the full original. | `src/app/p/[file]/route.ts` lines 26–48; `src/lib/posts/feed-photo.ts` lines 11, 64–70 |
| The capture sheet (camera, composer, barcode, food search: about 121,000 bytes of source in 15 files) is loaded with Home although it is used only after a tap. No client code uses `next/dynamic`. Three source files are imported by nothing: `src/components/NutritionImage.tsx`, `src/components/SafeImage.tsx`, `src/lib/queue/enqueue.ts`. | `src/components/NavigationControls.tsx` line 9; `grep -rn "next/dynamic" src` → nothing; a script resolved every import in `src`, `scripts`, `tools`, `tests`, `eval` |
| **The worker wake counts jobs that are not due.** The tick counts every job whose status is `queued`. Every staged photo upload queues a clean-up job due three hours later, and the worker claims only jobs that are due. So for three hours after any upload the tick reports waiting work: it tries to take the lease and can start a drain with nothing to do, and every open app polls it once a minute. Fleet 22's read R4 found 10 jobs queued or running across five minutes. | `src/lib/queue/tick.ts` lines 24–35; `src/lib/media/staged-photo.ts` line 8; `supabase/migrations/0027_not_eaten.sql` line 124 (`run_after<=p_now`); `src/components/QueueTicker.tsx`; Fleet 22's post-merge report |
| Production signs its tokens with ES256 and a key id, so the sign-in guard checks a token locally and asks the sign-in service nothing. The local stack uses HS256, where the guard asks once per guarded request: 19, 11 and 18 calls on Home, Days and Profile in Fleet 22's check K5. Those local counts do not describe production. | Fleet 22's post-merge report, read R5, and its report, check K5 |
| The Home question strip starts no read when its first read finds no session, or is overtaken by a sign-in event, and the sign-in handler starts none either. Only a tab focus restarts it. In Fleet 22's look no question read appeared in the network log at all. | `src/components/NeedsInputStrip.tsx` lines 23–29, 41, 42; Fleet 22's verification report, #953 |
| The meal page's retry poll backs off to 30 seconds and has no listener for a return to the tab. | `src/components/Thread.tsx` lines 50–56 |
| A failed meal's page prints "Nutrition could not be updated." and "The meal could not be updated." whatever failed. `OutlineOverlay` already receives `initialized` (the meal was analysed at least once); `failureMessage(reason)` already gives the feed card its sentence. | `src/components/OutlineOverlay.tsx` line 280; `src/components/Thread.tsx` lines 33, 42; `src/components/PostDetail.tsx` line 27; `src/lib/worker/failure-message.ts` |
| The meal header row is a fixed 52 px. | `src/components/PostDetailHeader.tsx` line 66 |
| Offline, the service worker answers a meal's request with the saved Home page, Next then reloads the document, and the failure message can never show. The retry bug #703 describes is gone: retry bumps a counter the timer effect depends on. Back on the failure screen always goes back in history, even when nothing was opened. | `public/sw.js` lines 296–306; `src/components/PostOpenTransition.tsx` lines 48, 50, 53 |
| Home's earlier-day circles count a finished meal only when it has no stored question; Days and today's circle count every finished meal. Days drops an alcoholic drink's own caffeine; the feed adds it. | `src/lib/posts/days.ts` lines 59, 96–104, 121, 189; `src/lib/intake/hydration.ts` lines 55, 147, 200; `src/lib/intake/intake.ts` lines 47–57 |
| Nothing in `src/` or `scripts/` calls `today_summary`. Only `tests/db/today-summary.test.mjs` does. The function has one signature, `public.today_summary(text)`. The highest migration is `0063`. The test stack applies every migration file it finds, so no list needs changing. | `grep -rn today_summary src scripts tests supabase`; `scripts/test-stack.mjs` line 39 |
| An added photo cannot finish on the local stack: the app copies the staged photo to its place with Storage's copy call, and the local storage stand-in has no copy, so the app answers "The photo could not be copied." three times and the upload fails. Real Storage has copy; this does not explain the owner's failure in #684. | `src/lib/posts/attach-photo.ts` lines 33–39; `tests/fixtures/local-gateway.mjs` |
| An added photo has no Post button: it sends itself as soon as the photo arrives, and it never makes a new meal. Its three requests go through the page's own `fetch`: `POST /api/media/sign-upload`, two `PUT`s to Storage, `POST /api/posts/<id>/media`. A meal open asks for `/posts/<id>` through the page's `fetch` too. | `src/components/CaptureSheet.tsx` lines 298–322, 563–566, 609–613; `src/lib/posts/upload-manager.ts` lines 262–281; `src/lib/media/pack-photo-upload.ts` |
| Fleet 22's checks K2 and K4 did not run because this Firefox refuses a `*` in a URL pattern. Its check K3 saw the September to August heading change and no jump beyond the commanded scroll; the strict one-pixel reading was not made. | Fleet 22's report |
| The browser, how a photo is attached, fixtures F1 to F4 and the seed are in `docs/plan-fleet21.md` on main. Fixtures F7 to F9 are in `docs/plan-fleet22.md` on main. | both files on `origin/main` |
| The ponytail skills at `github.com/DietrichGebert/ponytail`, commit `96608e078b2d5ea607c5c3b8b5a54d1c1fba6846`, are readable. `ponytail-audit` is the one that audits a whole repository for slow paths, load problems and code to delete; it reports and changes nothing. `ponytail-review` does the same for one change. `ponytail-debt` only lists comments marked `shortcut:`. `ponytail` is a way of writing code, and `ponytail-gain` shows a fixed scoreboard; neither audits. | `gh api repos/DietrichGebert/ponytail/contents/skills/<name>/SKILL.md`, each read |

**Premises (unchecked; the coder verifies before relying on them):**
- The fixtures and the browser of the Fleet 21 and 22 plans still work on today's main.
- The local storage stand-in's new copy answer works on a running stack. It parses; it was not run.
- A page-level `fetch` stand-in installed with one `script.evaluate` is what the app's code then calls (checks K1 and K2). Read from Next's and the app's source, not run.
- After a reload, an upload that failed before its photo reached Storage comes back as a failed chip that offers a retake once its stored photo is deleted (check K2).
- The logs table has a `timestamp` column (reading A5). If the query is refused, run it once per minute of the window with the two time parameters and no `minute` column.
- `96ecdcf`'s app runs against a database made from today's migrations (reading A2). The migrations since are additive.
- `.env.local` holds `SUPABASE_ACCESS_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `APP_URL`, `SUPABASE_DB_URL` and the two test accounts. The planner did not open that file.

---

## PR 1: branch `fix24/question-strip-signin` (#944; the fix behind #615's missing row)
**Service:** the strip's own read in `NeedsInputStrip.tsx`. **Boundary:** Home.
**Blast radius:** the Home question strip. If it fails, the strip shows no question or reads in a loop.
**What it does:** a sign-in or an account change starts a read, and a read that was overtaken runs again, so the strip no longer stays stopped.
**Tests to run:** `tests/needs-input-batch.test.mjs`.
**Look (also check #615):** at 390 wide, reload Home with fixture F8, with the network log on. Expected: within 5 seconds a request to the `posts` table whose address contains `question` appears, and the strip shows one row. Tap the row: the text "Was the sauce made with cream?" shows. Close it and tap the row's X. Expected: the row goes without a reload, and F8's meal is still in the feed.

File `src/components/NeedsInputStrip.tsx`.
Find:
```
    let hasPending = false;

```
Replace:
```
    let hasPending = false;
    let again = false;

```
Find:
```
        if (live) { setPosts([]); setSelected(null); }

```
Replace:
```
        if (live) { setPosts([]); setSelected(null); }
        // A sign-in or an account change starts a read, after this callback has returned.
        setTimeout(kick, 0);

```
Find:
```
if(live)schedulePoll();}finally{busy=false;}
    };

```
Replace:
```
if(live)schedulePoll();}finally{busy=false;if(again&&live){again=false;void refresh();}}
    };
    const kick = () => { if (!live) return; if (busy) again = true; else void refresh(); };

```
Done when: the look shows the read, the row, the dismissal and the meal still in the feed. Not covered, and still open under #615: the beer caption and the notification on production.

## PR 2: branch `fix24/thread-wake-failed-words` (#753, #948)
**Service:** `failureMessage` in `src/lib/worker/failure-message.ts` owns the sentence. **Boundary:** `Thread.tsx` and `OutlineOverlay.tsx` on the meal page.
**Blast radius:** the meal page and the desktop meal window. If the read is wrong, the thread says "Comments could not be loaded."
**What it does:** returning to the tab makes the retry poll check at once. A meal whose first analysis failed shows the same sentence its feed card shows, with Try again, and no longer says an update failed. A meal that was analysed and then failed an update keeps today's two sentences.
**Tests to run:** `tests/sharp-image-identity.test.mjs`, `tests/save-meal-readiness.test.mjs`.
**Look:** at 390 wide. (a) Open fixture F10's page. Expected: "The analysis service refused this request. Try again." once, a "Try again" button, and neither "Nutrition could not be updated." nor "The meal could not be updated." (b) Open fixture F2's page. Expected: both of those sentences, as today. (c) Open fixture F3's page with the network log on, wait 10 seconds, then evaluate `document.dispatchEvent(new Event('visibilitychange'))`. Expected: a request to the `posts` table for that meal within 1 second.

File `src/components/Thread.tsx`.
Find:
```
import {correctionFeedback} from '@/lib/posts/correction-feedback';
```
Replace:
```
import {correctionFeedback} from '@/lib/posts/correction-feedback';
import {failureMessage} from '@/lib/worker/failure-message';
```
Find:
```
client.from('posts').select('status').eq('id',postId).maybeSingle(),
```
Replace:
```
client.from('posts').select('status,analysis_initialized_at,fail_reason').eq('id',postId).maybeSingle(),
```
Find:
```
setError(feedback==='failed'?'The meal could not be updated.':'');
```
Replace:
```
setError(feedback==='failed'?(post.analysis_initialized_at?'The meal could not be updated.':failureMessage(post.fail_reason)):'');
```
Find:
```
  timer=setTimeout(tick,delay);
  return()=>{live=false;clearTimeout(timer);};
```
Replace:
```
  timer=setTimeout(tick,delay);
  // Returning to the tab checks at once and starts the backoff again.
  const visible=()=>{if(document.visibilityState!=='visible')return;clearTimeout(timer);delay=2000;void wake.current();timer=setTimeout(tick,delay);};
  document.addEventListener('visibilitychange',visible);
  return()=>{live=false;clearTimeout(timer);document.removeEventListener('visibilitychange',visible);};
```
File `src/components/OutlineOverlay.tsx`.
Find:
```
{status === "failed" ? <p role="status" className="px-screen-x text-meta text-muted">Nutrition could not be updated.</p> : null}
```
Replace:
```
{status === "failed" && initialized ? <p role="status" className="px-screen-x text-meta text-muted">Nutrition could not be updated.</p> : null}
```
Done when: the three parts of the look are as expected.

## PR 3: branch `fix24/header-date` (#955)
**Service and boundary:** `PostDetailHeader.tsx` on the meal page.
**Blast radius:** the meal page's header row. At the default text size nothing changes. With larger text, or the servings editor open, the row now grows where it used to spill under the photo.
**What it does:** the row has a minimum height of 52 px, not a fixed one.
**Tests to run:** `tests/save-meal-readiness.test.mjs`.
**Look:** at 390 wide, open fixture F1's page. Evaluate `document.documentElement.style.fontSize='200%'`. Read the bounding boxes of the date line and of the photo. Expected: the date line's bottom is at or above the photo's top, and all of its text is inside the screen's width or wraps inside the row.

File `src/components/PostDetailHeader.tsx`.
Find:
```
<div className="flex h-[52px] items-center gap-[10px] px-inset">
```
Replace:
```
<div className="flex min-h-[52px] items-center gap-[10px] px-inset">
```
Done when: the look shows the whole date line at the largest size.

## PR 4: branch `fix24/offline-open` (#945)
**Service:** `openPost` in `src/lib/posts/open-post.ts`. **Boundary:** `PostOpenTransition.tsx`, mounted for every page.
**Blast radius:** every meal opened on a phone. If it fails, meals do not open on phones, or Back leaves Home. Desktop is left out by a width test.
**What it does:** when the phone reports itself offline, tapping a meal shows "Couldn't open this meal." with Try again and Back, and starts no request. Try again opens the meal once the phone is online. Back closes the message without going back in history when nothing was opened.
**Tests to run:** `tests/tap.test.mjs`, `tests/sharp-image-identity.test.mjs`.
**Look:** at 390 wide on Home. Evaluate `window.__mark=1;Object.defineProperty(navigator,'onLine',{get:()=>window.__offline!==false?false:true,configurable:true})`. Tap fixture F1's "Details ›" link. Expected: "Couldn't open this meal." shows and `window.__mark` is still 1 (the page did not reload). Tap "Back": the message closes and the address is still Home's. Tap the link again, then "Try again": the message stays. Evaluate `window.__offline=false`, tap "Try again": the meal opens.

File `src/lib/posts/open-post.ts`.
Find:
```
/** Dispatch the provisional open frame, then navigate to the meal. */
```
Replace:
```
/** A phone that is offline cannot open a meal: the service worker would answer the request with the cached shell and the document would reload. */
export function cannotOpenPost(): boolean {
  return navigator.onLine === false && !matchMedia("(min-width:1024px)").matches;
}

/** Dispatch the provisional open frame, then navigate to the meal. */
```
Find:
```
{ detail: { id, committed: true } }));
  router.push(href);
```
Replace:
```
{ detail: { id, committed: true } }));
  if (cannotOpenPost()) return;
  router.push(href);
```
File `src/components/PostOpenTransition.tsx`.
Find:
```
import {createClient} from '@/lib/supabase/client';
```
Replace:
```
import {createClient} from '@/lib/supabase/client';
import {cannotOpenPost} from '@/lib/posts/open-post';
```
Find:
```
   if(id)preview(new CustomEvent('post-open-preview',{detail:{id,committed:true}}));
```
Replace:
```
   if(!id)return;
   // Offline, keep the link from navigating; the failure message is shown instead.
   if(cannotOpenPost())event.preventDefault();
   preview(new CustomEvent('post-open-preview',{detail:{id,committed:true}}));
```
Find:
```
  if(!opening)return;
  setPhase('opening');
```
Replace:
```
  if(!opening)return;
  const blocked=opening.committed&&cannotOpenPost();
  setPhase(blocked?'error':'opening');
  if(blocked)return;
```
Find:
```
const retry=()=>{setPhase('opening');setAttempt(n=>n+1);router.push(`/posts/${opening.id}`);};
```
Replace:
```
const retry=()=>{setPhase('opening');setAttempt(n=>n+1);if(!cannotOpenPost())router.push(`/posts/${opening.id}`);};
```
Find:
```
onClick={()=>{setOpening(null);router.back();}}>Back</button>
```
Replace:
```
onClick={()=>{setOpening(null);if(path!==opening.from)router.back();}}>Back</button>
```
Done when: the look is as expected. Known limit: a phone that reports itself online with no working connection still reloads as before.

## PR 5: branch `fix24/day-rules` (#946, #947)
**Service:** `countsAsPost` in `src/lib/posts/days.ts` is the one meal-counting rule; `rowCaffeineMg` in `src/lib/intake/intake.ts` becomes the one caffeine rule. **Boundary:** Home's day circles, the feed's day totals, Days, the desktop Today column.
**Blast radius:** day calories and day caffeine everywhere they show. If it fails, a day's numbers are wrong or Days does not load. Days makes one more read on a day that holds an alcoholic drink.
**What it does:** Home's earlier-day circles count the same finished meals as Days. Days adds an alcoholic drink's own caffeine, as the feed does. Each rule is written once.
**Tests to run:** `tests/home-days-agreement.test.mjs` (new), `tests/days-summary.test.mjs`, `tests/days-range.test.mjs`, `tests/days-reader-queries.test.mjs`, `tests/home-day-totals.test.mjs`, `tests/intake.test.mjs`, `tests/today-view.test.mjs`, `tests/feed-nutrition.test.mjs`, `tests/day-total-changes.test.mjs`, `tests/unknown-meal-totals.test.mjs`; and with the app started, `tests/db/days-intake.test.mjs` and `tests/db/alcohol-intake.test.mjs`.

File `src/lib/posts/days.ts`.
Find:
```
import {visibleDrinkRows} from '@/lib/intake/hydration';
```
Replace:
```
import {visibleDrinkRows,withAlcoholNutrition,type DrinkRow} from '@/lib/intake/hydration';
```
Find:
```
import { groupIntakeByDay, emptyIntake, type IntakeRow, type IntakeTotals } from "@/lib/intake/intake";
```
Replace:
```
import { groupIntakeByDay, emptyIntake, type IntakeTotals } from "@/lib/intake/intake";
```
Find:
```
    const intake: (IntakeRow & {post_id?:string|null})[] = [];
```
Replace:
```
    const intake: Pick<DrinkRow,'kind'|'amount'|'logged_at'|'post_id'|'post_item_id'>[] = [];
```
Find:
```
supabase.from("intake_logs").select("kind,amount,logged_at,post_id")
```
Replace:
```
supabase.from("intake_logs").select("kind,amount,logged_at,post_id,post_item_id")
```
Find:
```
      intake.push(...((data ?? []) as IntakeRow[]));
```
Replace:
```
      intake.push(...((data ?? []) as typeof intake));
```
Find:
```
      const byDay = groupIntakeByDay(await visibleDrinkRows(supabase,userId,intake), (instant) => dateInZone(instant, zone));
```
Replace:
```
      // The feed's rule: an alcoholic drink's own caffeine (a rum and cola) counts toward the day.
      const byDay = groupIntakeByDay(await withAlcoholNutrition(supabase,await visibleDrinkRows(supabase,userId,intake)), (instant) => dateInZone(instant, zone));
```
Find:
```
.eq('user_id', userId).eq('status', 'ready').or('needs_input.is.null,status.eq.failed')
```
Replace:
```
.eq('user_id', userId).in('status', LOGGED_STATUSES.filter(countsAsPost))
```
Find:
```
// The calendar cell (getMonthSummary) and the day summary (getDays) both use it.
```
Replace:
```
// The calendar cell (getMonthSummary), the day summary (getDays) and Home's day circles (getDayTotals) all use it.
```
File `src/lib/intake/intake.ts`.
Find:
```
export const emptyIntake = (): IntakeTotals => ({ water: 0, caffeine: 0 });
```
Replace:
```
export const emptyIntake = (): IntakeTotals => ({ water: 0, caffeine: 0 });

// The one caffeine rule for a logged drink: a caffeine row's own amount, or the caffeine an alcoholic drink keeps (a rum and cola).
export function rowCaffeineMg(row: { kind: string; amount: number | string; caffeineMg?: number }): number {
  return row.kind === "caffeine" ? Number(row.amount) || 0 : row.kind === "alcohol" ? row.caffeineMg ?? 0 : 0;
}
```
Find:
```
export function groupIntakeByDay(rows: IntakeRow[], dayOf: (instant: string) => string): Map<string, IntakeTotals> {
  const days = new Map<string, IntakeTotals>();
  for (const row of rows) {
    if (!isIntakeKind(row.kind) || !validIntake(row.kind, row.amount)) continue;
    const day = dayOf(row.logged_at);
    const totals = days.get(day) ?? emptyIntake();
    totals[row.kind] += row.amount;
```
Replace:
```
export function groupIntakeByDay(rows: (IntakeRow | { kind: "alcohol"; amount: number; logged_at: string; caffeineMg?: number })[], dayOf: (instant: string) => string): Map<string, IntakeTotals> {
  const days = new Map<string, IntakeTotals>();
  for (const row of rows) {
    const kept = row.kind === "alcohol" ? rowCaffeineMg(row) : 0;
    if (!kept && !(isIntakeKind(row.kind) && validIntake(row.kind, row.amount))) continue;
    const day = dayOf(row.logged_at);
    const totals = days.get(day) ?? emptyIntake();
    if (row.kind === "alcohol") totals.caffeine += kept; else totals[row.kind] += row.amount;
```
File `src/lib/intake/hydration.ts`.
Find:
```
import {alcoholGrams,isAlcoholic,keepsCaffeine} from './alcohol';
```
Replace:
```
import {alcoholGrams,isAlcoholic,keepsCaffeine} from './alcohol';
import {rowCaffeineMg} from './intake';
```
Find:
```
async function withAlcoholNutrition(db:SupabaseClient,rows:DrinkRow[]):Promise<DrinkRow[]>{
```
Replace:
```
export async function withAlcoholNutrition<T extends Pick<DrinkRow,'kind'|'post_item_id'>>(db:SupabaseClient,rows:T[]):Promise<(T&{alcoholG?:number;caffeineMg?:number})[]>{
```
Find:
```
total + (row.kind === "caffeine" ? toNumber(row.amount) : row.kind === "alcohol" ? row.caffeineMg??0 : 0), 0));
```
Replace:
```
total + rowCaffeineMg(row), 0));
```
Find:
```
ml: toNumber(row.ml), caffeineMg: row.kind === "caffeine" ? toNumber(row.amount) : row.kind === "alcohol" ? row.caffeineMg??0 : 0 }));
```
Replace:
```
ml: toNumber(row.ml), caffeineMg: rowCaffeineMg(row) }));
```
New file `tests/home-days-agreement.test.mjs` with this text:
```
// node --import tsx --test tests/home-days-agreement.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {getDayTotals,getDays} from '../src/lib/posts/days.ts';
import {hydrationSoFar} from '../src/lib/intake/hydration.ts';

const day='2026-10-31';
// A stand-in for PostgREST that applies the status and question filters each reader sends.
function database(tables){
 return createClient('https://fixture.invalid','fixture',{global:{fetch:async input=>{
  const url=new URL(input instanceof Request?input.url:String(input)),table=url.pathname.split('/').at(-1);
  let rows=tables[table]??[];
  const status=url.searchParams.get('status');
  if(status?.startsWith('eq.'))rows=rows.filter(row=>row.status===status.slice(3));
  if(status?.startsWith('in.('))rows=rows.filter(row=>status.slice(4,-1).split(',').map(value=>value.replaceAll('"','')).includes(row.status));
  if(table==='posts'&&url.searchParams.get('or')==='(needs_input.is.null,status.eq.failed)')rows=rows.filter(row=>row.needs_input==null||row.status==='failed');
  return Response.json(rows);
 }}});
}
const nutrition=calories=>({calories,protein_g:5,carbs_g:10,fat_g:4,fibre_g:0,sugar_g:0,sodium_mg:0,micronutrients:[]});
const meal=(id,status,calories,needs_input=null)=>({id,status,needs_input,caption:id,eaten_at:`${day}T12:00:00Z`,post_media:[],current_post_items:status==='ready'?[{id:`item-${id}`,name:id,portion_grams:100,item_nutrition:[nutrition(calories)]}]:[]});

test('a finished meal that still has a question counts in Home\'s day circle exactly as it does on Days',async()=>{
 const question={short:'Clarification needed',question:'Was the rice fried?',options:[]};
 const db=database({posts:[meal('plain','ready',100),meal('asked','ready',200,question),meal('held','needs_input',400,question),meal('working','processing',800)]});
 const [circle]=await getDayTotals(db,'u','UTC',[day]);
 const [days]=await getDays(db,'u','UTC',day,day);
 assert.equal(days.totals.calories,300,'Days counts both finished meals and neither unfinished one');
 assert.equal(circle.kcal,days.totals.calories);
 assert.deepEqual(circle.posts.map(post=>post.id).sort(),days.posts.map(post=>post.id).sort());
});

test('a rum and cola adds the same caffeine to the day on Home and on Days',async()=>{
 const logged_at=`${day}T20:00:00Z`;
 const rum={id:'rum',post_id:'night',name:'Rum and coke',portion_grams:220,portion_text:'220 ml',item_nutrition:[{...nutrition(150),food_category:'Liquor and cocktails',micronutrients:[
  {nutrientId:1018,nutrientName:'Alcohol, ethyl',unitName:'G',basis:'portion',value:13.9},
  {nutrientId:1057,nutrientName:'Caffeine',unitName:'MG',basis:'portion',value:20}]}]};
 const db=database({
  posts:[{...meal('night','ready',150),eaten_at:logged_at,current_post_items:[rum]}],
  current_post_items:[rum],
  intake_logs:[
   {kind:'caffeine',amount:95,ml:240,label:'Coffee',logged_at:`${day}T08:00:00Z`,post_id:null,source:'sheet',post_item_id:null},
   {kind:'alcohol',amount:14,ml:220,label:'Rum and coke',logged_at,post_id:'night',source:'item',post_item_id:'rum'}],
 });
 const home=await hydrationSoFar(db,'u',day,'UTC',`${day}T23:59:59Z`);
 const [days]=await getDays(db,'u','UTC',day,day);
 assert.equal(home.caffeineMg,115,'the feed counts the coffee and the cola in the rum');
 assert.equal(days.intake.caffeine,home.caffeineMg);
});
```
Done when: the named tests pass.

## PR 6: branch `fix24/drop-today-summary` (#949). Migration 0064.
**Service:** the database. **Boundary:** none in the app; Home's totals come from the Days reader.
**Blast radius:** one unused database function and its one test. If something outside the repository calls the function on production, that call fails after the migration.
**What it does:** removes the function and its test.
New file `supabase/migrations/0064_drop_today_summary.sql` with this text:
```
-- Home reads today's totals with the Days reader; nothing calls this function any more.
drop function if exists public.today_summary(text);
notify pgrst, 'reload schema';
```
Delete the file `tests/db/today-summary.test.mjs`. Leave the old rollback files as they are.
**Tests to run:** step 5c's `test:db` for PR 6, and `tests/today-view.test.mjs`, `tests/home-day-totals.test.mjs`.
**Look:** at 1280 wide, on PR 6's build after its migration is applied to the disposable database, open Home. Expected: the Today column shows its numbers.
Done when: the database suite passes without the deleted test, the look shows today's totals, and on production the read-back in step 7 prints 0.

## PR 7: branch `fix24/queue-due-only` (#966)
**Service:** `queueTick` in `src/lib/queue/tick.ts`. **Boundary:** the tick route, called on app open, tab focus, after every queued action and once a minute by the database.
**Blast radius:** the worker's wake. If it fails, due work is not picked up until the database's once-a-minute wake, which does not use this count.
**What it does:** the tick counts only queued jobs that are due. A clean-up job due in three hours no longer makes the app wake the worker or keep polling.

File `src/lib/queue/tick.ts`.
Find:
```
admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "queued"),
```
Replace:
```
// A job that is not due yet (a photo-stage cleanup runs three hours later) is not waiting work.
    admin.from("jobs").select("id", { count: "exact", head: true }).lte("run_after", new Date().toISOString()).eq("status", "queued"),
```
File `tests/worker-recovery-wake.test.mjs`.
Find:
```
return {select(){return this;},eq(column,value){assert.equal(column,'status');return Promise.resolve({count:value==='running'?1:0});}};},
```
Replace:
```
return {select(){return this;},lte(column){assert.equal(column,'run_after');return this;},eq(column,value){assert.equal(column,'status');return Promise.resolve({count:value==='running'?1:0});}};},
```
In the same file `tests/worker-recovery-wake.test.mjs`, append at the end of the file:
```

test('a queued job that is not due yet does not wake the worker', async () => {
  const calls=[];
  // The stand-in holds one queued job due in three hours and nothing running.
  const due=Date.now()+3*60*60*1000;
  const admin={
    from(table){assert.equal(table,'jobs');let before=Infinity;return {select(){return this;},lte(column,value){assert.equal(column,'run_after');before=Date.parse(value);return this;},eq(column,value){assert.equal(column,'status');return Promise.resolve({count:value==='queued'&&due<=before?1:0});}};},
    async rpc(name){calls.push(name);return {data:true,error:null};},
  };
  assert.deepEqual(await queueTick(admin,'idle'),{queued:0,running:0,traffic:'low',started:false});
  assert.deepEqual(calls,[],'no lease is taken');
});
```
**Tests to run:** `tests/worker-recovery-wake.test.mjs`, `tests/queue.test.mjs`, `tests/tick-split.test.mjs`, `tests/drain-lease.test.mjs`, `tests/worker-wake.test.mjs`.
Done when: the tests pass, and reading A7 on production shows the tick answering `queued` 0 while only not-due jobs exist. Not covered: the traffic label reads its own count of every queued job (`src/lib/queue/traffic.ts`), a second copy of the old rule; it is listed for the PM in Part 3.

## PR 8: branch `fix24/local-storage-copy` (the fixture that lets #708 be checked)
**Service and boundary:** `tests/fixtures/local-gateway.mjs`, the local stand-in for Storage. No product code.
**Blast radius:** the local test stack only.
**What it does:** the stand-in answers Storage's copy call, so an added photo can finish on the local stack.
**Tests to run:** `tests/added-photo.test.mjs`, `tests/attachment-stage-expiry.test.mjs`.

File `tests/fixtures/local-gateway.mjs`.
Find:
```
let key=p.replace(/^\/object\/(upload\/sign|sign|authenticated|public)\//,'').replace(/^\/object\//,'');
```
Replace:
```
if(req.method==='POST'&&p==='/object/copy'){const data=body(),from='media/'+data.sourceKey,to='media/'+data.destinationKey;if(data.bucketId!=='media'||!valid(from)||!valid(to))return answer(404,{message:'Object not found'});if(!allowed(req,from)||!allowed(req,to))return answer(403,{message:'new row violates row-level security policy'});let payload;try{payload=await readFile(file(from));}catch{return answer(404,{message:'Object not found'});}if(sql(`select 1 from storage.objects where bucket_id='media' and name=${esc(data.destinationKey)}`))return answer(409,{message:'The resource already exists'});await mkdir(path.dirname(file(to)),{recursive:true});await writeFile(file(to),payload);sql(`insert into storage.objects(bucket_id,name,owner,metadata)values('media',${esc(data.destinationKey)},${esc(data.destinationKey.split('/')[0])}::uuid,${esc(JSON.stringify({size:payload.length,mimetype:'image/jpeg'}))}::jsonb)`);return answer(200,{Key:to,Id:randomUUID()});}
let key=p.replace(/^\/object\/(upload\/sign|sign|authenticated|public)\//,'').replace(/^\/object\//,'');
```
Done when: fixture F11 (an added leftovers photo) reaches a second photo row in step 5e.

## Docs PR: branch `docs/fleet24` (#222: the audit report)
**Blast radius:** two new files. Reviewed by PPLX. Not merged unless the PM's order names it.
Commit this plan unchanged as `docs/plan-fleet24.md`. Create `docs/findings/performance-audit-2026-11-16.md` with exactly the headings and the first section given in "The audit" below, and fill each later section with what its reading found. The production readings A4 to A7 come after the merges; the docs PR at the stop carries the local sections, and the production sections go to the PM in the final report.

---

## The browser and the fixtures
The browser, how it is driven, how a photo is attached, fixtures F1 to F4 and the seed are exactly as the sections "The browser", "Local fixtures" and "The seed" of `docs/plan-fleet21.md` on main say. Fixtures F7 and F8 are as `docs/plan-fleet22.md` on main says. Where those plans say "the main checkout", use `<w>`; read `/tmp/mfa-f21` and `/tmp/mfa-f22` as `/tmp/mfa-f24`, and their env files as `/tmp/mfa-f24/stack-src/.env.test.fleet24`. In the commands below, `$DB` stands for `"$(grep ^SUPABASE_DB_URL= /tmp/mfa-f24/stack-src/.env.test.fleet24 | cut -d= -f2-)"`.

Make F1, F2, F3, F4, F7 and F8 as those plans say. Then make these two:

| Fixture | What it is | How it is made |
|---|---|---|
| F10 | A meal whose first analysis failed | Make a meal as F1 is made, with caption `Fixture never analysed`. When it has finished: `psql $DB -v ON_ERROR_STOP=1 -c "update public.posts set status='failed', fail_reason='meta: fixture', analysis_initialized_at=null where caption='Fixture never analysed'"` |
| F11 | A finished meal with a second, leftovers photo | On meal F4, add a photo as "Local fixtures" says, with `notEaten:true` and `plate3.jpg`. There is no Post button to tap: the photo sends itself and the sheet closes. Wait up to 90 seconds for `psql $DB -Atc "select count(*) from public.post_media m join public.posts p on p.id=m.post_id where p.caption='Fixture ready 2' and m.kind='photo'"` to print 2. If it does not, read the upload's row in the browser's IndexedDB database `mfa-uploads`, store `drafts` (`state`, `message`), and the answers to `POST /api/posts/<id>/media` in the network log, and write them in the report. |

**A request that hangs, and a request that fails.** This Firefox refuses `*` in a URL pattern, so the page's own `fetch` is replaced for the length of one check, with one `script.evaluate` each.
- **Hold meal opens** (check K1): `(()=>{const real=window.__mfaFetch??=window.fetch,held=[];window.__mfaRelease=()=>{window.fetch=real;delete window.__mfaFetch;for(const go of held.splice(0))go();};window.fetch=function(input,init){const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);if(url.origin===location.origin&&/^\/posts\/[0-9a-f-]{36}$/i.test(url.pathname))return new Promise((resolve,reject)=>held.push(()=>real.call(window,input,init).then(resolve,reject)));return real.call(window,input,init);};return true;})()`
- **Fail an added photo's first request** (check K2): `(()=>{const real=window.__mfaFetch??=window.fetch;window.__mfaRelease=()=>{window.fetch=real;delete window.__mfaFetch;};window.fetch=function(input,init){const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);const method=String(init?.method??(typeof input==='object'&&'method' in input?input.method:'GET')).toUpperCase();if(url.origin===location.origin&&url.pathname==='/api/media/sign-upload'&&method==='POST')return Promise.reject(new TypeError('NetworkError when attempting to fetch resource.'));return real.call(window,input,init);};return true;})()`
- **Put it back:** evaluate `window.__mfaRelease()`, or reload.

If a fixture cannot be made, write what was seen and report the looks and checks that name it as not done; the rest of the run continues.

## Checks on the local build
Run once in step 5f, in `<w>`, signed in as local test user 2, at 390 × 844. Nothing here touches production or a customer. Each result goes in the final report as what was seen, with the numbers. A check that cannot be carried out is reported as not checked, with the reason; it stops nothing else.
**Blast radius:** rows in the disposable database only.

| Check | Item | Steps | Record |
|---|---|---|---|
| K1 | #703 | On Home, install "Hold meal opens". Tap fixture F1's "Details ›" link. Wait 12 seconds. Tap "Try again". Wait 12 seconds. Then evaluate `window.__mfaRelease()` and wait 3 seconds. | Whether "Couldn't open this meal." showed after the first wait and again after the second, and whether the meal's page opened after the release with no overlay left over it (tap its Back button: it must respond). |
| K2 | #708 | Open fixture F1's page from Home. Install "Fail an added photo's first request". Add a photo to F1 (`notEaten:false`, `plate2.jpg`). Wait up to 30 seconds for the failed chip. Evaluate `window.__mfaRelease()`. In the page, open the IndexedDB database `mfa-uploads` and delete every row of the store `drafts`, leaving `intents`. Reload. Read the chip's words. Tap its retake button. List the rows of `intents`. Reload. | The chip's words before and after the first reload; whether the camera opened; the number of rows in `intents` after the tap (expected 0); whether the chip is gone after the second reload. If the chip after the first reload offers no retake, say what it offers. |
| K3 | #454, #512 | Open Days. Read `window.scrollY`, the month name at the top and the bounding box of today's cell. Evaluate one call that scrolls to the top and then, on every animation frame for 4 seconds, records the number of months on the page (cells marked `data-month-start`) and the distance from the top of the screen to the cell of September 1: `(async()=>{const cell=()=>document.querySelector('[data-day="2026-09-01"]');const out=[];window.scrollTo(0,0);const end=performance.now()+4000;while(performance.now()<end){await new Promise(requestAnimationFrame);out.push([Math.round(performance.now()),document.querySelectorAll('[data-month-start]').length,Math.round(cell()?.getBoundingClientRect().top??-1),Math.round(window.scrollY)]);}return JSON.stringify(out.filter((r,i,a)=>i===0||r[1]!==a[i-1][1]||Math.abs(r[2]-a[i-1][2])>1));})()` | Whether today's cell lay wholly on screen above the tab bar at the start. From the returned rows: each time the month count rose (an older month loaded), the September 1 distance in the frame before and the frame after. The item is met when no row shows that distance changing by more than 1 px after the first frame. The cells carry `data-day="<date>"` and the month name at the top is the paragraph marked `aria-live="polite"` (`src/components/PhoneCalendar.tsx` lines 77, 91). |
| K4 | #523 | Run `psql $DB -v ON_ERROR_STOP=1 -c "update public.item_nutrition set fibre_g=null where post_item_id in (select i.id from public.post_items i join public.posts p on p.id=i.post_id where p.caption='Fixture ready')"`. Open fixture F1's page. | Whether the sentence that begins "Known nutrition shown. Nutrition unavailable:" is absent, and whether the Fibre row names the food as unavailable. This is the case Fleet 22 could not establish for #956. |

## The audit (#222): why the app feels slower
Read-only. Nothing is changed and nothing is fixed. Every finding goes to the PM as one line. The report file's headings, in this order: "What was measured", "1. JavaScript size", "2. Requests when Home opens", "3. The photo address", "4. Sign-in calls on production", "5. The worker wake", "6. Slow paths and code to delete", "7. What the planner would look at first".

**Section "1. JavaScript size" is written by the planner; copy it exactly:**
```
Built with the same placeholder settings on Nov 16 2026, Home's first-load JavaScript is:

| Commit | Files | Bytes | Gzip bytes |
|---|---|---|---|
| 96ecdcf (before Fleets 21 to 23) | 20 | 1,099,351 | 324,914 |
| 9f5b6053 (main) | 20 | 1,104,551 | 326,431 |

The difference is 5,200 bytes, 0.5%. The dependencies are identical. The slowdown is not bundle growth.

Home loads about 1.1 MB of JavaScript at either commit. The capture sheet (camera, composer, barcode reader, food search) is about a ninth of it and is used only after a tap. Three source files are imported by nothing: src/components/NutritionImage.tsx, src/components/SafeImage.tsx and src/lib/queue/enqueue.ts.
```

| Reading | Where | Steps | Record |
|---|---|---|---|
| A2 | local | Make a second worktree: `git -C <main> worktree add --detach /tmp/mfa-f24/old 96ecdcf`; in it `npm ci` and `TEST_ENV_FILE=/tmp/mfa-f24/stack-src/.env.test.fleet24 npm run test:app -- build`. For each of the two builds (`<w>`, then `/tmp/mfa-f24/old`): start its app; in the browser at 390 wide, signed in, evaluate `(async()=>{for(const k of await caches.keys())await caches.delete(k);for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();return true;})()`; turn the network log on; open Home; wait 15 seconds (the cold open); reload; wait 15 seconds (the warm open); stop the app. | For each build and each open: the number of requests and the bytes received, in these groups: the page; JavaScript and styles; photos (`/p/` or `/api/media/feed/`); background page loads (address contains `_rsc`); `/api/`; the database's own address (`/rest/v1/`, `/auth/v1/`, `/realtime/`); other. Then the difference between the builds, group by group. |
| A3 | local | With the app of `<w>` running, read the address of fixture F1's feed photo from the page (`currentSrc`). Run `curl -s -o /dev/null -w '%{http_code} %{size_download} %{time_total}\n' <address>` twice for each of its three widths (replace the width in the address with 640, 1080 and 1600). | For each width: the status, bytes and seconds of the first and the second request. This is the cost of one resize on this machine. |
| A4 | production | Signed in as test account 2 at 390 wide, open Home and read the `currentSrc` of the first feed photo. Run `curl -s -o /dev/null -D - -w 'total %{time_total}\n' <address>` twice, ten seconds apart, and once each for the other two widths. | For each request: the status, `x-vercel-cache`, `age`, `content-length` and the total time. A `MISS` followed by a `HIT` shows the cache working; a 302 shows the resize was busy. |
| A5 | production | Note the time to the minute. Signed in as test account 2 at 390 wide, open Home and wait 60 seconds, open Days and wait 60 seconds, open Profile and wait 60 seconds. Wait 5 minutes. Then, in `<main>`, run the command under this table with the start and the end of that 10-minute window. | Requests to `/auth/v1/user` and to `/auth/v1/token` for each minute, by kind of caller. The item's line is one sign-in call per page open. Other people may have used the app in the same minutes; say so beside the numbers. |
| A6 | production | `psql "$SUPABASE_DB_URL" -Atc "select kind, status, count(*), min(run_after), max(run_after), count(*) filter (where run_after<=now()) from public.jobs where status in ('queued','running') group by 1,2 order by 1,2"` | The rows. This shows what the 10 waiting jobs of Fleet 22's read R4 are and how many are due. |
| A7 | production (#322, #966) | After PR 7 is deployed: run `psql "$SUPABASE_DB_URL" -Atc "select count(*) from public.jobs where status='running' or (status='queued' and run_after<=now())"`. Only when it prints 0: `curl -s -D - -w '\ntotal %{time_total}\n' "$APP_URL/api/jobs/tick"` three times, ten seconds apart. When it prints another number, wait 60 seconds and read again, up to five times; then report the reading as not done. | For each call: `x-tick-cold`, the answer's `queued` and `running`, and the total time. With nothing due the call writes nothing. Expected after PR 7: `queued` 0 even while reading A6 shows not-due jobs. |
| A8 | the repository | Read the audit skill with `gh api "repos/DietrichGebert/ponytail/contents/skills/ponytail-audit/SKILL.md?ref=96608e078b2d5ea607c5c3b8b5a54d1c1fba6846" --jq .content \| base64 -d`. Use it as a checklist only; it reports and changes nothing. Apply its parts "Scale", "Speed" and "Lean", and its rule that every finding needs a concrete case, to: `src/app/(tabs)`, `src/components`, `src/lib/posts`, `src/lib/queue`, `src/lib/media`, `src/middleware.ts` and `public/sw.js`. Say which parts were not read. | Section 6 of the report, in that skill's output form: each finding with its file, its concrete case and the smallest fix, ranked. |

(In this table, `\|` stands for the plain character `|`.)

The command for reading A5 (it reads logs with one SELECT and prints counts only):
```
node --env-file=.env.local -e '
const ref=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const [start,end]=process.argv.slice(1);
const p="log_attributes[\x27request.path\x27]",a="log_attributes[\x27request.headers.user_agent\x27]";
const ua=`multiIf(positionCaseInsensitive(${a},\x27pg_net\x27)>0,\x27pg_net\x27,positionCaseInsensitive(${a},\x27Mozilla\x27)>0,\x27browser\x27,positionCaseInsensitive(${a},\x27vercel\x27)>0 OR positionCaseInsensitive(${a},\x27node\x27)>0 OR positionCaseInsensitive(${a},\x27undici\x27)>0,\x27server runtime\x27,\x27other/absent\x27)`;
const sql=`select toStartOfMinute(timestamp) as minute, ${p} as path, ${ua} as user_agent, count(*) as requests from logs where source=\x27edge_logs\x27 and ${p} in (\x27/auth/v1/user\x27,\x27/auth/v1/token\x27) group by minute,path,user_agent order by minute,path,user_agent`;
const u=new URL(`https://api.supabase.com/v1/projects/${ref}/analytics/endpoints/logs`);
u.searchParams.set("sql",sql);u.searchParams.set("iso_timestamp_start",start);u.searchParams.set("iso_timestamp_end",end);
const r=await fetch(u,{headers:{Authorization:`Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`},signal:AbortSignal.timeout(30000)});
const b=await r.json().catch(()=>({}));if(!r.ok||b.error){console.error("HTTP",r.status,b.error?"query rejected":"");process.exit(1);}
console.table(b.result??[]);' <start, for example 2026-11-17T03:00:00Z> <end, ten minutes later>
```

**Section "7. What the planner would look at first"; copy it exactly, then add what the readings change:**
```
From reading the code, in order of likely effect:

1. The photo address change (Fleet 21). Every photo got a new address, so every phone's stored copies went unused once. A photo not in Vercel's cache is resized on demand from the full original, four at a time for each server instance, and a busy resize sends the phone the full original. Readings A3 and A4 measure it.
2. The worker wake (#966). For three hours after any photo upload the app wakes the worker on every open and polls it once a minute. Readings A6 and A7 measure it.
3. Home refreshes its whole server page every 60 seconds while it is on screen, and again on every return to the tab (PostReadinessListener). This is older than Fleet 21.
4. Each feed card loads two meal pages in the background before any tap. Reading A2 counts them.
5. The capture sheet loads with Home.
```

---

# Part 2: not dispatched (30 items): each one's reason

None of these items is called done by this plan.

| Item | Reason | What it needs |
|---|---|---|
| #937 | Fleet 22's PR #952 is the fix, and its look recorded zero not-found answers. The cause is written in `docs/plan-fleet22.md`. | PM closes. |
| #571 | Fleet 22's look saw both overlapping meals save on one press each with no failed request. The owner's "could not be saved" was never reproduced. | GrokBot repeats it on production; the PM closes or keeps it on that. |
| #683 | Its done line is GrokBot's reading on production. PR 2 of this plan fixes the failed meal's words (#948); the queued-meal and no-food bookmark messages are on main. | GrokBot. |
| #377, #456 | The code is right for new and re-analysed drinks. Fleet 22's read found the Oct 29 coffee stored with no category and no caffeine; the three cocktails keep old rows. Each needs its meal analysed again on production. | The owner's yes to re-analyse four of his meals. |
| #628, #690 | #628's script repairs were PR #918, which was closed without merging on Nov 16 with both commands still failing; the PM told the planner to hold its file. #690's sentence merged with PR #922. | The PM's ruling on #918; the PM closes #690. |
| #698 | The written rule merged with PR #922. | The PM closes on the owner's acceptance. |
| #715, #925 | Both turn on PR #682, still open. | The owner's ruling on #682. |
| #929 | The review runner that makes the fleet's receipts is not the one in the repository. | The coder says where it lives and commits it. |
| #699 | The owner's other repositories are private. | The owner's leave to read them. |
| #694, #285 | A study of the owner's meals and photos on production. | The owner's leave. |
| #212, #594, #579 | A real phone: a packaged product, the share sheet, the camera. | The owner or a phone. |
| #279 | The owner turns CAPTCHA on when the app goes public. | The owner. |
| #368 | Fast sign-ups through production could lock people out. | A time window from the owner and a second network. |
| #373 | Billed log bytes and memory are on the Supabase usage page. Fleet 23's log report now shows about 125 MB of Storage bytes in 24 hours, most of it the photo address fetching originals to resize. | The usage page. Reading A6 and PR 7 remove one cause of needless reads. |
| #60 | The README is a start-here page. Which host names stay is the owner's choice. | The owner. |
| #687 | The portal. | The owner. |
| #689, #659 | #689 needs the PM's order naming the seven heads. #659's three gaps are now #944, #753 and #955, all in this plan. | The PM closes #659 when those three merge. |
| #578 | The remaining findings are the PM's to file one each. This plan removes two more copies (PR 5). | The PM. |
| #617 | The finding is written (Fleet 22 plan, Part 2 A). | The PM decides whether the match is acceptable. |
| #684 | The chip's place needs the designer. The owner's failure needs his failed upload's row; by reading, the app's sentence "The photo could not be attached." hides which of five conditions failed. | The designer; the owner's leave to read that row. |
| #552, #553, #217 | Looks under a slowed processor, which the fleet's Firefox cannot do. A Chromium is installed on this machine (`/usr/bin/chromium-browser`) and can slow a processor, but no fleet has driven it and Fleet 19's attempt timed out. | GrokBot, or a later fleet that first proves the Chromium works. |

Count: 1 + 1 + 1 + 2 + 2 + 1 + 2 + 1 + 1 + 2 + 3 + 1 + 1 + 1 + 1 + 1 + 2 + 1 + 1 + 1 + 3 = 30.

---

# Part 3: found while reading, for the PM to file (none is planned: no issue number)

- The traffic label counts every queued job, not only due ones (`src/lib/queue/traffic.ts`), so a person can see "traffic medium" with nothing running. It is a second copy of the rule PR 7 fixes.
- Home refreshes its whole server page every 60 seconds while visible and on every return to the tab (`PostReadinessListener.tsx` lines 79–80).
- The meal detail's own "updating" poll has no listener for a return to the tab either (`OutlineOverlay.tsx` lines 181–190); PR 2 fixes the thread's.
- No request in the added-photo path has a time limit, so one that never answers leaves the chip on "Uploading" for good (`pack-photo-upload.ts`, `upload-manager.ts` line 271). The chip's title reads "Uploading N posts…" even when all of them have failed (`UploadChip.tsx` line 30).
- "The photo could not be attached." is one sentence for five different refusals (`attach-photo.ts` line 9).
- Three unused source files and ten one-off run scripts under `scripts/` (about 111,000 bytes) that nothing imports. `docs/evidence` is 38 MB in 597 files. None of it reaches a phone.
- The capture sheet could load on first tap. It needs the service worker to keep the new file for offline use, so it is not a one-line change.
- The first analysed-then-failed and never-analysed meal pages will show two differently worded sentences when the meal has no photo ("This meal could not be analysed." in the photo area).

---

## For RT (read from here)

- **The run stops once,** before the merges, for the PM's order naming each PR and its full head SHA.
- **18 of the 48 Engineering items are worked:** 9 by a build, 8 by a check, and the slow-feed item by the audit. The other 30 each have a reason.
- **Why the app feels slower: it is not bloat.** The planner built the app as it was before Fleet 21 and as it is now. Home's code grew by 0.5% (5,200 bytes of 1.1 MB). Nothing new runs on Home.
- **The two most likely causes, from the code.** First, Fleet 21 gave every photo a new address, so every phone had to fetch every photo again, and a photo not yet in the cache is resized on demand. Second, for three hours after any photo is posted the app keeps waking the worker for nothing, once a minute in every open app (#966, fixed in this run). The audit measures both, on the local build and with read-only readings on production.
- **The ponytail skills were read.** One of them, the repository audit, covers slow paths, load problems and code to delete. The plan has the coder apply it as a checklist to the app's own folders and report; it changes nothing.
- **One migration on production, which your approval of this plan approves:** it removes one database function nothing uses (#949). It is applied right before its PR merges and read back.
- **Readings on production, all read-only:** two photo requests, a count of sign-in calls from the logs, the list of waiting jobs, and three timed calls to the worker's address made only when nothing is due. One sign-in as test account 2.
- **Behaviour changed (PR 4):** with the phone offline, tapping a meal says "Couldn't open this meal." with Try again, where today the page silently reloads.
- **Behaviour changed (PR 2):** a meal whose first analysis failed says what its feed card says, with Try again, and no longer says an update failed. Coming back to the app checks a waiting meal at once.
- **Behaviour changed (PR 5):** an earlier day's circle on Home now counts a finished meal that still has a question, as Days does. Days now counts the caffeine in a rum and cola, as the feed does.
- **Behaviour changed (PR 1):** the question strip on Home shows its questions after a sign-in without a reload.
- **Behaviour changed (PR 3):** the date under a meal's name is never cut off at large text sizes.
- **#703 and #708 have a way to be proved now.** The test browser could not hold or fail a request the old way; the plan replaces the page's own request function for the length of one check. Added photos could never finish on the test stack because its storage stand-in lacked one call; PR 8 adds it.
- **Nothing in this plan waits on you.** One thing would unblock two items if you say yes: analysing four of your meals again on production (the Oct 29 black coffee and the three cocktails), so their caffeine is stored correctly (#377, #456).
