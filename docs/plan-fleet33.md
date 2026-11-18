# Fleet 33 — the proof-run gaps from Fleet 32: two fixes, six local checks, five production checks on test account 2, and what follows #990's study (2026-11-18)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** A new plan from the PM's packet of 2026-11-18 00:46Z, the backlog (`/home/opc/pm/my-food-ai/backlog/BACKLOG-web-current.md`) and Fleet 32's production reports (`state/build/fleet32-postmerge/report.md` and `browser/report.md`). It has two code PRs and one docs PR, six local checks, one stop before the merges, and two production sections after the PM's merge order. Planned from main `b47f9aee85c34c7d3588ee35350b1ef6b00949f8`. Main `aa11e8a2` adds only the study tool (#1052: `scripts/numbers/study.mjs`, `tests/numbers-study.test.mjs`) and `BACKLOG.md` after it. Nothing here touches those files, and the study itself runs under Fleet 32's last order.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix. A defect you find goes to the PM as one line for the backlog, and nothing more. A Find text that does not occur exactly once is skipped and reported, never rewritten.

**Stops: one**, before the merges (section 7). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void; the rest continues), and an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes, and the waits of section 9 add up to at most 30 minutes. Section 8 waits for nothing; what it needs comes from the builder's #990 report.

**Nothing runs against production before the merge order.** Section 9 writes only on test account 2 and removes what it wrote.

## 1. Each Fleet 32 gap: what it is and what this plan does

| Item | What it is | What this plan does |
|---|---|---|
| #570 | **Instrument fault.** A pending added photo shows at once as the first slide of its card, from its local preview (`src/components/UploadingPost.tsx` line 13, `UploadMedia`). Fleet 32 timed the server-loaded slide that comes later, off screen, lazily loaded. The sheet already closes as fast for both (median 152 against 153 ms) | P1: time each post to its own preview image in the card |
| #688 | **Instrument fault.** The swipe sent only a touch start and a touch end, with no movement, so no rail could scroll. The rail is a native horizontal scroller (`[aria-label="Meal photos"]`) | P2: `Input.synthesizeScrollGesture`, a real touch swipe |
| #628 | **Instrument fault in the repository script.** `scripts/run17-checks.mjs` taps Camera at once after "Post a meal" and hands the photo over before the capture sheet has mounted, so a later run's caption never appears ("Browser condition did not settle"). It is the same fault Fleet 31's K3 had | PR 1 adds the two waits; P5 runs post-close once on production |
| #970 | **Product defect, one cause.** When an added photo's upload to storage fails, `submitAttachment` sets no message, so the chip says only "Not saved · Try again" (`src/lib/posts/upload-manager.ts` line 266, `src/components/UploadChip.tsx` line 31). The other four refusals already have their own sentences (`src/lib/posts/attach-photo.ts` lines 9 to 15). Fleet 32 could not make three of them in time | PR 2 adds the sentence; L1 makes all five on the local stack |
| #938 | **Instrument fault.** Its predicate waited for the whole "Pending posts" panel to go, which another entry can keep open, and the reload never ran | L2: watch that one entry, then reload |
| #968 | **Missing state.** The return-to-tab check exists (`src/components/OutlineOverlay.tsx` lines 192 to 200), but it is armed only while the meal is queued or processing. A servings change did not put the meal in that state before the freeze. And freezing the page does not change `document.visibilityState` | L3: a meal queued on the local stack, and the page's own visibility events |
| #973 | **Missing state.** The photo area, the card and the thread all use `failureMessage()` (`src/lib/worker/failure-message.ts`), so they agree in the source. No failed meal without a photo exists on production, and none can be made there on purpose | L4: a failed text meal on the local stack. Its sentence says "This photo could not be analysed" for a meal with no photo; that wording goes to AGY |
| #987 | **Missing state.** The estimate already stores caffeine (`src/lib/fdc/estimate.ts`, the "#987" lines; commit 7fe33b10; `tests/estimate-caffeine.test.mjs`). The coffee W9 posted was matched to a record, so no estimate was made | Q1: read-only, any estimated coffee or tea stored since that commit was deployed |
| #972 | **Built; one part unchecked.** The capture sheet loads after the shell (`src/components/NavigationControls.tsx` line 13, commit 5e0a9cb1), and the service worker caches the chunks `/shell` names (`public/sw.js`). Opening offline was never checked, because every run bypassed the service worker | L5: offline with the service worker active, on the local stack |
| #222, #372 | **Missing state.** Test account 2's Home had no photo meal on screen: its only photos sat 2,857 and 3,451 px down, lazily loaded | P3: post one photo meal first, then measure |
| #351 | **Observed; "most used first" not shown.** Water glass led with 4 uses and every other tile had 0, so the order proves nothing about ordering by use | P4: make Coffee the most used, then reopen the sheet |
| #936 | **Test account half met** (0 requests). The owner half needs the owner's sign-in | Not in this run |
| #693 | **Mics shown in all four fields.** Playing speech into one needs a spoken clip. None exists in the repository (only `scripts/fixtures/tone.wav`), and this host has no speech synthesizer | Not in this run: needs a recorded clip or a phone |
| #955 | **Met at 390 wide; the largest text size needs a phone.** The app's sizes are fixed CSS pixels (the line stayed 11 px with larger browser fonts), so a browser cannot reproduce a phone's text-size setting | Not in this run: needs a phone |
| #990 | **Waiting on the builder's study report** | Section 8: what follows, for each result |

## 2. Facts the planner checked, and premises

- **PR 2 on the planner's stack.** A scratch copy of `tests/upload-guard.test.mjs`'s attachment harness was used, with the storage upload answering 500 (it is not part of the PR). With PR 2, the failed entry's `message` is "The photo did not reach the app. It is kept on this phone, so try again." With main's `upload-manager.ts` it is `undefined`, and the chip then shows only "Not saved · Try again", as Fleet 32 saw.
- **PR 1 on the planner's stack.** `run17-checks.mjs --mode=post-close` ran against the local built app as test user 2: exit 0, three runs closing in 492, 558 and 520 ms, each showing "Uploading photo". **Main's unchanged script also passed there.** So the race the waits remove is real in the source but did not reproduce locally. Fleet 32's production failure most likely came from production timing behind its request guard, and that is not proven. That is why PR 1 also makes every timed-out wait name its condition and its bound: if P5 fails again, its error says which wait failed. The only lint warning (`tickStop` unused) is on main too.
- **#987** is built and has its test (commit 7fe33b10, `fix: count estimated caffeine and categoryless drinks`). **#972** is built (commit 5e0a9cb1, `perf: load capture tools after the shell`). Neither needs code here.
- **Verified on the planner's stack** with both PRs together: `npx tsc --noEmit` clean; `npx eslint` on the changed files clean apart from main's own warning; the database suite 51 of 51; the application suite 789 of 795 (6 skips, 0 failures). The local checks L1 to L5 were not run by the planner.

## 3. Not in this run, and why

- #936's owner half, #684, #615's notification: the owner's sign-in or phone.
- #693's speech, #955's largest text, #452, #212, #999, #594, #579's camera: a phone (or, for #693, a recorded clip the owner could supply).
- #1000: needs a design. #373, #375: the usage page's byte figures. #368, #279: fast throwaway sign-ups and the owner's phone. #578: a ruling on each finding. #60: waits for the last feature. #553, #552, #217: a slowed-processor table of every control. #571, #683, #708: failures made on purpose beyond these checks. #694, #285, #617: larger written findings. #323's server half: the server log. #695: a busy resizer cannot be forced. #575: no ready meal with an unavailable value can be made on purpose.
- #456, #969, #449, #937, #1041, #1049, #1047, #1048: closed in Fleet 32. #1021, #988, #377, #454, #494, #120: met in Fleet 31.

## 4. How it runs

1. **Worktrees.** One fresh worktree per PR from `origin/main`, under `/tmp/mfa-f33`. Before any test in a worktree: `npm ci` — in the worktree, never in the original checkout.
2. **Your own stack.** `TEST_PORT_BASE=61360 TEST_PG_PORT=55649 TEST_STACK_DIR=/tmp/mfa-f33/stack TEST_ENV_FILE=.env.test.fleet33`. Never stop or touch a container that does not end in `-61360`.
3. **Tests and suites.** As Fleet 32: `PATH="$PWD/tests/bin:/usr/pgsql-17/bin:$PATH" TZ=UTC MFA_TEST_DISPOSABLE=1 timeout 600 node --import ./tests/fixtures/local-providers.mjs --import tsx --test <files>`. The application and database suites once each, on a scratch branch that merges both PRs locally (never pushed), with the built app started. Bound: 10 minutes each.
4. **Per PR:** apply the edits; `node --check` on each changed `.mjs`; `npx tsc --noEmit`; `npx eslint <changed files>`.
5. **Reviews.** One PPLX review per code PR on its final head, full 40-character SHA, with main's runner. AGY when PPLX is unavailable, and AGY in any case for PR 2's new sentence (the owner's ruling: AGY decides wording). The docs PR needs no review.
6. **Local checks** L1 to L6 (section 6), on the scratch branch of step 3, in fresh native Chromium with CDP at 390 by 844, DPR 3, unless a check says otherwise. Each check's bound is 10 minutes; run each once, and if one fails, report its first error and do not repeat it. Generated photos go to the capture sheet through its `capture-files` event, after a 600 ms pause between "Post a meal" and Camera and a wait for `[aria-label="Capture content"]`.
7. **Docs PR**, branch `docs/fleet33` from `origin/main`: this plan unchanged as `docs/plan-fleet33.md`.
8. **Stop** (section 7).

## 5. The code PRs

### PR 1 — branch `fix33/run17-waits` — #628

File `scripts/run17-checks.mjs`.

Find:
```
until=async(expression,ms=30000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await evaluate(expression))return;await pause(200);}throw Error('Browser condition did not settle');};
```
Replace:
```
until=async(expression,ms=30000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await evaluate(expression))return;await pause(200);}throw Error(`Browser condition did not settle after ${ms} ms: ${expression.replace(/\s+/g,' ').slice(0,120)}`);};
```

Find:
```
 await tap('button','Post a meal');await tap('button[data-entry]','Camera');
```
Replace:
```
 // #628: the entry menu animates in, and the capture sheet must be mounted before it can take the photo.
 await tap('button','Post a meal');await pause(600);await tap('button[data-entry]','Camera');
 await until(`!!document.querySelector('[aria-label="Capture content"]')`,10000);await pause(300);
```


No test: a check script. L6 is its evidence.

### PR 2 — branch `fix33/attach-upload-message` — #970

File `src/lib/posts/upload-manager.ts`.

Find:
```
const RETAKE_ATTACHMENT_MESSAGE = 'This photo was not kept. Take it again.';
export interface UploadState {
```
Replace:
```
const RETAKE_ATTACHMENT_MESSAGE = 'This photo was not kept. Take it again.';
const ATTACHMENT_UPLOAD_FAILED = 'The photo did not reach the app. It is kept on this phone, so try again.';
export interface UploadState {
```

Find:
```
            d.attachmentPhoto=await entry.attachmentUpload.prepare(d.files[0]);
```
Replace:
```
            // #970: a photo that never reached storage says so; the chip shows d.message beside Try again.
            try{d.attachmentPhoto=await entry.attachmentUpload.prepare(d.files[0]);}
            catch(error){d.message=ATTACHMENT_UPLOAD_FAILED;throw error;}
```


No test: the contract asks for none for wording. L1 is its evidence. The sentence is AGY's to approve or change in its review; a changed sentence is applied as AGY gives it.

## 6. The local checks

- **L1, #970: all five refusals.** On test user 1, post a meal with a generated food photo and let the local worker make it ready (`/api/jobs/tick` every 2 seconds, at most 60 seconds). Then add a photo to it through its post menu's "Add photo", once for each cause below. After each, read the chip's `[role="alert"]` text and the button text.
  1. **Storage failure:** `Fetch` fails the upload of the photo's bytes (the request to the storage upload URL, not to `/api/`). Expected with PR 2: "The photo did not reach the app. It is kept on this phone, so try again."
  2. **Not ready:** to a second meal you post, before you tick the worker.
  3. **Eight photos:** a ninth photo on a meal that holds eight. Add them with the service key in `post_media` on the local database, and say so.
  4. **Has drinks:** a meal with a sheet drink row (`intake_logs` with `source = 'sheet'`), inserted the same way.
  5. **Deleted:** a meal you delete (`deleted_at` set) after the sheet opens and before you tap Add.

  Met when each shows its own sentence beside "Not saved · Try again". Report each sentence. Remove the fixtures.
- **L2, #938.** At 1280 by 800, repeat L1's first case. Record the chip entry's box and its Remove button's box, by the entry's own text. Tap Remove. Wait at most 5 seconds for that entry (not the panel) to go, reload, and check it stays gone. Met when Remove lies inside the chip and the entry stays gone.
- **L3, #968.** Post a meal and do not tick the worker, so it stays queued. Open its page; "Updating nutrition…" must show. Then set the page hidden with `Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'})` and `document.dispatchEvent(new Event('visibilitychange'))`. Wait 20 seconds and record the requests the page makes, then set it back to `'visible'` the same way. Record the time to the next request for that meal (its `/posts/<id>` refresh or its posts read). Met when that is 1 second or less.
- **L4, #973.** Insert, on the local database, a text meal (no `post_media`) with `status='failed'` and `fail_reason=null`. Open Home and its page, and read the card's sentence and the photo area's sentence. Met when they are the same. Report the sentence for AGY ("This photo could not be analysed." on a meal with no photo).
- **L5, #972.** Do not bypass the service worker. Open Home and wait until `navigator.serviceWorker.controller` is set and `caches.keys()` lists the shell cache (at most 60 seconds). Reload once. Then set `Network.emulateNetworkConditions` offline, tap "Post a meal" and then Camera, and wait at most 10 seconds for `[aria-label="Capture content"]`. Met when the sheet opens offline. Also record Home's script bytes on the first load.
- **L6, #628.** With PR 1, run `scripts/run17-checks.mjs --mode=post-close` against the local app (`--url=` your app, `--cdp=` a fresh headless Chromium) and `--mode=beer` with a fresh Firefox BiDi session, each once under `timeout 600`. Report each exit code, every run's close time and "uploading", and the first error.

## 7. The stop

Stop when both code PRs and the docs PR are open, each code PR reviewed or reported "written, not reviewed", and L1 to L6 are reported. Report to the PM, in one message:

1. Each PR: number, branch, final head (40 characters), checks and their results, and the reviews' results (PR 2's AGY sentence).
2. The two suites' counts.
3. L1 to L6, with the numbers each asks for.
4. Anything void under section 2.
5. The merge order this plan expects: PR 1, PR 2, then the docs PR. Section 9 needs PR 1 on main and PR 2 served on production.

Then wait for the PM's merge order. It names each PR and its full head SHA.

## 8. After the builder's #990 study report

The study (PR #1052 and its S1 to S6) is run under Fleet 32's last order. This section only says what follows, for each result. It writes nothing on production.

- **If S6 says "closes":** #990's passing-meal part is done. With Fleet 31's other-account and saved-meal results, every part of #990's done line has its recorded disposition. The PM decides the issue.
- **If S6 says "does not close":** for each disagreeing meal, the builder's report names the food whose estimate differs most and why. The next plan groups them by cause (record chosen, grams, or stored value) and plans one fix per cause. This fleet re-analyses nothing. An incomplete estimate counts as neither agreeing nor disagreeing; if too few are complete, the next step is S2 to S4 again for those meals only.
- **The three meals still failing a rule**, whatever S6 says:
  - **6fad4a16 (a2, e):** the salami's weight. Only the owner can give it (section 10). With the weight, the fix is one servings or portion correction to that one food, under the restore rule.
  - **a0e6b3bf and e7e1782c (e):** the owner gave 3 g in a comment, and the meals hold that. Rule e's 5 g floor flags a figure the owner chose. They are listed as owner-confirmed, with no data change.
  - **1c4f16bf** is cleared by Fleet 31's rule.

## 9. After the PM's merge order: production, test account 2

As Fleet 32's write-allowed run, in fresh native Chromium with CDP at 390 by 844, DPR 3, signed in as test account 2.
- **The guard:** app-origin writes are allowed, and so are Supabase media uploads for test account 2. Every other origin is blocked, and service workers are bypassed.
- **Photos:** the repository plate2 derivative, sent as in section 4, step 6.
- **The ledger:** record every post id before the next action.
- **Cleanup at the end:** delete each post with the service key, along with its `post_upload_drafts`, `post_photo_attachments` and `intake_logs` rows and its stored files. Read each back as absent, and report the count.

Each step's bound is 10 minutes; the waits add up to at most 30 minutes.

- **P1, #570.** Three alternating pairs, the first in each pair a regular photo post and the second a leftovers photo added to that pair's ready meal. For each, time from the tap that sends it (Post, or the leftovers confirm) to:
  - the sheet closing;
  - that post's own preview image in its card: the first `img` in that card's `[aria-label="Meal photos"]` whose `src` starts with `blob:` and is `complete` with a `naturalWidth`, measured whether or not it is scrolled into view;
  - the server saving it (the post `ready`, or the attachment's `post_media` row), from the service key, for the record.

  Met when each median of the second time is within 200 ms of the regular one. Report all three times for every post.
- **P2, #688.** On Home, on a meal with at least two photos (P1's last meal), run `Input.synthesizeScrollGesture` at the centre of that card's `[aria-label="Meal photos"]` with `xDistance: -300`, `yDistance: 0` and `gestureSourceType: 'touch'`. Record the `scrollLeft` of every rail before and 1 second after, and `window.scrollY` before and after. Met when only that rail moved, by at least 200 px, and the page did not scroll more than 200 px.
- **P3, #222 and #372.** Post one regular photo meal and wait until it is ready (at most 240 seconds), so it is first on Home. Then Fleet 32's W15 exactly: four cold opens, unthrottled first and then three slowed, with the same records and the same 60-second bound. Met for #222 when each slowed time is 2 seconds or less. For #372, met when the width ratio is 2 or more. Report all four.
- **P4, #351.** From the drink sheet, log "Coffee cup" twice (a tap each, no hold). Close the sheet and open it again. Record the tile order. Met when "Coffee cup" is first. Remove the two drinks in the cleanup.
- **P5, #628.** `scripts/run17-checks.mjs --mode=post-close` once against production as test account 2, as Fleet 32's W1 did, with PR 1 on main. Met when it exits 0. Beer passed in Fleet 32 and is not repeated.
- **Q1, #987, read-only.** Every current food whose name matches `\m(coffee|espresso|americano|kopi|tea|teh|matcha)\M`, whose micronutrients carry an approximation of kind `estimate`, and whose row was written after the deployment of 7fe33b10. Print the prefix, name, calories and caffeine (1057). Met when each one has a caffeine value. With no rows, report "no estimated coffee or tea since the fix", and the PM decides on the code and its test.

**What section 9 reports.** One row per check, met, not met or not checked, with its numbers. Also the cleanup count, and each created row read back as absent.

## 10. For the owner (optional)

Written for the owner, in the style the owner asked for. Send it only if the PM chooses to:

- "Your salami meal (6fad4a16) has no weight for the salami, so its calories are a guess. What weight is printed on the bag?"
- "To check that speaking into a field works, we need a short recording of you saying what you ate, for example 'two fried eggs and rice'. Could you record one on your phone and send it?"
