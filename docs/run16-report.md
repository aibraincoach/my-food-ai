# Fleet 16 report

The Fleet 16 plan was executed and its ten code PRs (#605–#614) are merged. The owner declared Fleet 16 finished and ordered remaining defects onto the backlog for proper investigation and execution in a new fleet. I expanded scope after the plan by adding worker follow-up #616; that scope overrun is already merged and is recorded here, not presented as part of the original plan. Every merged head has a counting independent review and green preview checks. Production is commit `3677332317058a742284fba99fa806f074529632`; the final deployed build marker and worker acceptance are recorded below. Docs PR #604 remains open; #577 and #558 are untouched.

The source plan in [plan-run16.md](plan-run16.md) is unchanged: 94,513 bytes, exactly the attachment from the Fleet 16 heading through EOF. The owner-supplied backlog and concurrent Wall entries were preserved. Fleet 15's four held merges landed before the overlapping Fleet 16 work shipped. This run performed no Fleet 15 merges, migration, admin-role update or new production post.

## Work and issue state

|Lane / item|Result|Issue / remaining acceptance|
|---|---|---|
|A · #592|Live-card gutters; desktop arrow/text geometry passes at all three widths.|Open: phone detail has photo-only slides, so the requested phone numbers-slide reading is unavailable. Its actual separate kcal has no overlay arrows. No fourth named geometry pass is invented.|
|B · #593|Nothing outlined on load; J selects first; pointer clears; Tab outlines feed. Local and production checks pass.|Open for owner's desktop/address-bar confirmation.|
|C · #598|Per-build worker import, durable update marker, cache pruning and update navigation. Production import-only discovery failed; #616 adds explicit load-time update requests and a unique marker for same-commit rebuilds.|M3 remains unaccepted; #598 is backlogged for a new fleet.|
|D · #599|Today totals render on server; incomplete first-page seeds cause one server read. Production visible digits under one second on designated account.|Open for owner's populated-day/desktop confirmation.|
|E · #594|Device-local camera setting, native-camera shutter, Save photo share/download. M8 passes.|Open for real iPhone/Android share-sheet and camera-roll checks.|
|F · #580|All nine controls measure at least 44px in both dimensions.|Closed after merge and M5.|
|G · #596|Component-exclusion guard in ordinary and approximate matching, including distinct multiword components.|Closed after final 18/18 real-provider gate and merge.|
|H · #597|Planned lint fixes plus warnings from later Fleet 15 scripts; final lint 0 errors, 6 warnings.|Closed after merged-main lint and final exact-source suite.|
|J · Photo box 7f|Stored dimensions reserve the immediate/full box; no crop/bars; desktop cap also applies to direct URLs; original responsive variants retained.|M9/M10 pass. Owner's visual desktop confirmation remains his.|
|K · Typed fractional servings|Quarter-grid field, existing rescale route, confirmed value retained during refresh and failed saves.|M11 and SQL rescale/ownership/history/jobs pass.|
|I · #595 / docs|Current run14/docs head has three retain statements, copied below; report/evidence prepared.|#595 stays open as ordered; no docs PR merged.|

## Reviews and merge commits

|PR|Reviewed full head|Counting receipt|Merge commit|Deployment|
|---|---|---|---|---|
|[#605](https://github.com/aibraincoach/my-food-ai/pull/605)|`774267e444a0041f928cc37fa1b56ab5a542ede5`|[AGY fallback](reviews/run16/agy-pr605-774267e.md)|`5e59de98b453642c6fba7e6bea0a91672547f5ee`|MERGED; included in final READY production|
|[#606](https://github.com/aibraincoach/my-food-ai/pull/606)|`5f6871f47d843f766e636dae2e7d21abe4a5d8d3`|[AGY fallback](reviews/run16/agy-pr606-5f6871f-attempt2.md)|`3de232f7e8dbf416db44d8d30985d264bed03a30`|MERGED; included in final READY production|
|[#607](https://github.com/aibraincoach/my-food-ai/pull/607)|`422ae2ffc89ecd9f883b09b2e299cb5900de8862`|[AGY fallback](reviews/run16/agy-pr607-422ae2f.md)|`df582d017e0e6f020f03efb949579bdf18199d43`|MERGED; included in final READY production|
|[#608](https://github.com/aibraincoach/my-food-ai/pull/608)|`e54697c2abaacd65c98fbbc2f57ef8870c71d2f8`|[AGY fallback](reviews/run16/agy-pr608-e54697c.md)|`183b93e12a788061b60d10360f3d13974b0de335`|MERGED; included in final READY production|
|[#609](https://github.com/aibraincoach/my-food-ai/pull/609)|`1794affa85fd8f68bbf5c4c0e636fc92716caf22`|[AGY fallback](reviews/run16/agy-pr609-1794aff.md)|`830f591f06da45f3dace3b10dc4c22e53c25f944`|MERGED; included in final READY production|
|[#610](https://github.com/aibraincoach/my-food-ai/pull/610)|`994a11b48cb696d3c2f35039abd07651d375bbe1`|[AGY fallback](reviews/run16/agy-pr610-994a11b.md)|`3b1ca9de4c9f3726b9c0de79f2bf3dfeb2d1b11d`|MERGED; included in final READY production|
|[#611](https://github.com/aibraincoach/my-food-ai/pull/611)|`525d8e47e806c4adc151ac180b40affbbf2d6b1e`|[AGY fallback](reviews/run16/agy-pr611-525d8e4.md)|`f6d627a4455a38f4e56a9b0af9d3cfa5378dc50e`|MERGED; included in final READY production|
|[#612](https://github.com/aibraincoach/my-food-ai/pull/612)|`51bed0e65436fd60623ac92bb6b2035575e3af04`|[AGY fallback](reviews/run16/agy-pr612-51bed0e.md)|`18df7347dea0bebce854962dc4d84b63a2b788f6`|MERGED; included in final READY production|
|[#613](https://github.com/aibraincoach/my-food-ai/pull/613)|`e28aae131ef00432568aff24447462928dd2f2ad`|[AGY fallback](reviews/run16/agy-pr613-e28aae1.md)|`9ef762ed5965dc2566236634dfc775450bf78294`|MERGED; included in final READY production|
|[#614](https://github.com/aibraincoach/my-food-ai/pull/614)|`97389b138107eb0c446b6a1eaeb91f51cacf4727`|[AGY fallback](reviews/run16/agy-pr614-97389b1.md)|`7e0c7898688089cdb875632d7f13b9f65223b817`|MERGED; included in final READY production|
|[#616](https://github.com/aibraincoach/my-food-ai/pull/616)|`6109ab1688d68f77e33743ac56ec60f1afd05148`|[PPLX runner](reviews/mfa-pplx-pr616-6109ab1.md)|`3677332317058a742284fba99fa806f074529632`|MERGED; included in final READY production|

All code above is included in the final READY deployment. Rapid consecutive merges can supersede individual intermediate deployments; green PR previews are recorded separately from production inclusion. No unreviewed code PR remains. The laptop review list is empty; its self-contained prompt remains in the unchanged plan if needed for a future head.

## Acceptance readings and decisions

**M1:** Chromium DOM Range/arrow rectangles at 1100×800, 1280×800 and 1440×900 show zero intersections; minimum left gap 21.02px. At 390×844 the current detail has no numbers slide/arrows over the separate kcal. The named phone slide is unavailable, so #592 stays open with that limitation. [Geometry](evidence/run16/run16-adf-browser.json).

**M2:** Production build `7e0c7898`, 1280×800, test account 2: focused/outlined cards on load 0; J selects first; pointer clears to 0; Tab outlines a feed card after 13 presses. Tab starts in the page body, not browser chrome. Decision: comment results and leave #593 for the owner's desktop/address-bar check. [Production receipt](evidence/run16/run16-production-m2-m4.json).

**M3:** Not accepted as a full activation pass. The normal reload first showed the cached older build and then reached the new document. The expected newer worker was observed installed/waiting, but its activation-driven navigation was not proven. The owner ended the fleet and stopped extra verification. Decision: leave #598 on the backlog for investigation and a new fleet. [Unfinished observation](evidence/run16/worker-activation-unfinished.json).

The original #605 import-only reading reached a new document via the existing `?_=...` shell refresh, but did not observe the newer worker within 180 seconds. This was reported on #598, not claimed passed, and no merge was reverted. #616 explicitly requests an update after registration and assigns a commit-plus-timestamp build identifier. A later reading observed the new worker installed/waiting; Chromium's outgoing-request grace can be five minutes, so the observer was corrected to preserve a live update past its former three-minute cutoff. The extra reading used the same reviewed commit redeployed with a different marker. It was stopped by the owner before a full activation result, so this is not a completed acceptance claim. The driver performs no manual registration.update(), hard refresh or second reload after the Y signal; the app's normal-load update is the product change. [Original failure](evidence/run16/worker-update-activation-failure.json), [installed/waiting observation](evidence/run16/worker-update-installed-waiting.json), [source investigation](evidence/run16/worker-update-investigation.md).

**M4:** Production at 1280×800, designated test account 2: normal reload first visible kcal digits 849.7ms; hard reload 996.1ms. Both display 0 kcal on this account/day. Authenticated server HTML contains numeric kcal after its streamed placeholder. Local nonzero fixture reading was 626.4ms normal / 714.1ms hard, 260 kcal. Decision: comment #599, leave the owner's populated-day check open. [Production receipt](evidence/run16/run16-production-m2-m4.json), [local receipt](evidence/run16/run16-m4-local.json).

**M5:** Plus 44×44; More 44×44; Log now 79.125×44; Search 294×44; Photo 78.89×44; Text 66.14×44; Barcode 113.39×44; Caption 358×44; Drink 260×46. All nine pass at 390×844. Decision: close #580. [Geometry](evidence/run16/run16-adf-browser.json).

**M6:** Final head `e54697c2` passes all 18 real Meta/USDA cases (79.6s, 54 USDA requests). Caesar selects 2422578, explicitly including croutons and Caesar dressing. The full per-case chosen-record/pass table is in [lane G](evidence/run16/lane-g.md) and the [final raw receipt](evidence/run16/run16-g-real-smoke-multiword.json). Decision: close #596. No production post or persisted food/model trace was created by this in-memory gate.

**M7:** `npm run lint` against merged-main source: 0 errors, 6 warnings. Final exact-source full suite passes 665 tests: 659 pass, 0 fail, 6 existing optional skips. Decision: close #597. [Lint](evidence/run16/merged-main-lint.log), [full suite](evidence/run16/final-suite.md).

**M8:** Local production browser: switch persists reload; native-photo mode has 0 video elements; shutter dispatches 1 native capture click; app mode shares JPEG `meal.jpg` and fallback downloads `meal.jpg`. Real phone share-sheet contents and camera-roll retention remain owner checks. Decision: ship toggle, comment #594 and leave open. [Receipt](evidence/run16/run16-egk-browser.json).

**M9:** Exact read-only production SQL count is 0 at 14:50:17.696Z before the guarded backfill and 0 at 14:50:18.464Z after it. The backfill processes no rows; no production dimension write occurred. Earlier REST reads also found 0. Decision: existing rows need no fallback-square backfill. [SQL sequence](evidence/run16/missing-photo-dimensions.json).

**M10:** At 390×844, portrait immediate/full boxes both 390×520; landscape both 390×292.5. At 1280×800 the desktop window is portrait 510×680 / landscape 640×480, immediate and full equal. Direct URLs are phone-same; desktop portrait 480×640 under the shorter viewport cap, landscape 640×480. Images fill their boxes at natural ratio. With every image request blocked, the same boxes reserve their shape at naturalWidth/naturalHeight 0. A late scope audit fixed the direct desktop cap; actual compiled production CSS plus the shared helper measures portrait 510×680 at 1280×1000 and centered 300×400 at 390×500, preserving ratio. Decision: report photo-box implementation and retain owner's visual confirmation. [App geometry](evidence/run16/run16-j-m10.json), [before images](evidence/run16/photos-before-image-load.json), [cap geometry](evidence/run16/run16-photo-cap-browser.json).

**M11:** At 390×844 and 1280×800, typed values send {"servings":1.5} then {"servings":0.5}. Repeated invalid `abc` restores 0.5, shows a message and sends no request. An intercepted 503 save failure restores 0.5; next + sends 1. Disposable fixture restored to 1. SQL tests verify rescale, ownership, history and recompute jobs. Decision: report servings done. [Receipt](evidence/run16/run16-egk-browser.json).

## Premises and limits

P1: production build markers include the actual Vercel Git commit SHA, confirming its availability; the final suffix now changes even for a same-commit redeploy. Route and document markers match and remain stable across requests within a build.

P2/P3: iPhone Save Image/share-sheet behavior and each phone's camera-roll retention are unverified on the owner's devices. Profile text states that retention depends on the phone and that the choice is per device.

P4: the code removes dependence on a post-hydration browser fetch. Production/server HTML and local nonzero timing are verified; the owner's original populated-day cause is not independently reconstructed.

P5: browser-only imported-script discovery was insufficient in the measured running app; it is not asserted as generally broken in Chromium. The final approach explicitly starts the update on normal load. Final Chromium installation/activation evidence is M3; Safari remains an owner's-device check. Chromium's documented outgoing-request grace explains why an installed update must not be declared stopped merely when a shorter observer timeout expires.

## Verification and fixed findings

Final #616 source head `6109ab1688d68f77e33743ac56ec60f1afd05148` built successfully with TypeScript, then passed the full disposable suite: 665 total, 659 pass, 0 fail, 6 existing skips (267.988s). Its source/scripts/tests/config tree matches merged main `36773323`. Focused worker/media-session/push checks pass 41/41; actual-component ready/load and rejected register/update lifecycle checks pass. `/build.js` is 200/no-store, matches shell HTML and remains stable over repeated requests. [Final suite](evidence/run16/final-suite.md), [worker follow-up](evidence/run16/worker-followup.md).

Earlier combined verification exposed two VM harnesses missing new imports (Today nutrition totals and photo-box helpers). Both owning PRs were fixed before final acceptance. Internal review also fixed retired camera-stream rendering, servings refresh/failure state, multiword exclusion collisions, worker update identity surviving process restart, and direct desktop height cap. Production M3 prompted the additional #616 follow-up.

Driver corrections are recorded, not treated as product failures: hidden-marker visible/attached wait; two direct CDP setup stalls (about 20s each) replaced by isolated Chromium/Playwright for local geometry; non-TTY stdin closed the first M3 setup; a transient cached shell required its init-observer first-paint record; the live installed-worker observer needed to outlast Chromium's request-draining grace. No forced worker update or hard refresh is used as acceptance evidence.

## Review routes

Original PPLX runner attempts could not find removed `#ask-input`. Live inspection of the original authenticated Firefox showed the signed-in editor rather than Cloudflare. A temporary selector repair used the actual contenteditable textbox and exactly `code review <PR URL>`. Most initial batch captures hit the automation deadline; #608's truncated capture was not counted, its visible multiword finding was independently reproduced/fixed, and final code received AGY review. A conflicting follow-up-composer footer is preserved verbatim, not asserted as separate response-model proof.

Every code PR tried available PPLX routes in this session. Route 4 live SSH succeeded, but the other OCI host lacks the runner, Firefox and authenticated profile: `Error: Cannot find module '/home/opc/Projects/my-food-ai/tools/pplx-review.mjs'`, `MODULE_NOT_FOUND`. No profile was copied or replaced and no quota exhaustion was invented. AGY fallback uses `gemini-3.8-flash-high`; final receipts prove complete native-file coverage. #606's first non-JSON receipt was retried cleanly. Superseded C/J attempts were deliberately cancelled for code fixes and are not evidence AGY was unavailable.

#616's single-PR PPLX runner produced a complete review at the exact head, request proof `model_preference=gemini38flash`, and zero real findings. Per runner policy this network proof counts; the separate owner's-Chrome UI-label rule is not substituted for the Firefox route's proof. The follow-up composer label remains in the verbatim capture. No Codex external review was used for OpenAI-authored code.

Exact per-PR submission/error records: [routes](evidence/run16/review-routes.md), [route 4 batch](evidence/run16/run16-route4-all.log), [#616 capture](reviews/mfa-pplx-pr616-6109ab1.md), [#616 triage](reviews/mfa-pplx-pr616-6109ab1-triage.md).

## #595 exact retain statements

At current run14/docs head `eeba864c8e54c562f9a76cf90872187d172564ab`, all case-insensitive revok matches are retain statements. The issue was commented; no changes to #577 or its branch.

```text
5:> Owner amendment — November 4, 2026, 16:14–16:15 WIB: the protection-bypass secret is permanent reviewer/coder access. Retain it; it is never revoked or removed. This explicit owner ruling supersedes the original secret-removal instructions, including cleanup and the defaults below.
502:2. **Before (eager, preview):** `PATCH https://api.vercel.com/v1/projects/my-food-ai/protection-bypass` with `{"generate":{"note":"fleet14 tick probe"}}` (P4; a 403 ends this half with the response recorded). Branch `probe/tick-eager` from main; `git log --oneline -- src/app/api/jobs/tick/route.ts src/lib/worker/handlers.ts` names the #334 commit; `git show` it and reverse its lazy loading on this branch only (static imports of the job modules). Push, open a draft PR titled `probe: eager tick, never merge`, wait for its preview READY, run the probe with `--url <preview> --bypass <secret>` (header `x-vercel-protection-bypass`) three times with a forced redeploy each (`git commit --allow-empty`), record, close the PR unmerged, and delete the branch. Retain the protection-bypass secret permanently for reviewer/coder access; it is never revoked or removed (owner, November 4, 16:14–16:15 WIB).
682:- Production measurements sign in as designated test account 2, create a few posts and delete them; one Vercel bypass secret is created for the preview probe and retained permanently for reviewer/coder access, never revoked or removed.
```

## Existing items and owner checks

#370, #222 and #372 remain open for the owner's mobile-data checks. Their comments describe current shipped behavior without claiming phone acceptance. #455/#456/#457 were already closed and remain closed; their three-phone checks remain the owner's evidence. No new measurement is claimed for the photo-box measurement already recorded by the owner. Photo-box/servings items have no new issue numbers; the PM can file/close them from this report.

New observation filed as #617: the existing gate permits squid nigiri to use a tuna closest-generic approximation; a passing assertion is not species-accuracy proof. The phone numbers-slide reading is unavailable as described under M1. No other unresolved defect is hidden as a pass.

Backlog: #598 remains open for the unproven worker activation; #617 records the newly called-out squid-nigiri/tuna-reference observation for proper investigation in a new fleet. #616 was a scope-overrun attempt at the worker problem, not proof of final acceptance. No merge was reverted. The concurrently supplied beer backlog item #615 was preserved in the docs branch and was not part of this fleet's code scope.

## Cleanup and exit

Owned browser/check processes were stopped at the owner’s instruction. All Fleet 16 code/validation worktrees and local code branches were removed; merged remote branches including #616 were deleted. Both disposable test stacks and local app servers were stopped; private local stack files remain per testing documentation. No listeners remain on the owned app/database/browser ports. The original authenticated Firefox and unrelated existing checkouts were preserved. `scripts/cleanup.sh` ran; [output](evidence/run16/cleanup.log), [worktrees](evidence/run16/worktree-cleanup.log), [remote branches](evidence/run16/remote-branch-cleanup.log). Docs/evidence are published on #604; the docs branch remains open. A documentation-only correction includes the .log evidence files omitted by the repository's global log ignore rule; no product work, test run or deployment was added.

Owner checks remain: desktop/address-bar confirmation (#593), populated-day Today timing (#599), iPhone/Android camera mode/share sheet/retention (#594), phone acceptance for #370/#222/#372/#455/#456/#457, and visual photo-box confirmation. Permanent preview protection-bypass access is retained. No docs PR is merged.
