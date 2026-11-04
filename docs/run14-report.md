# Fleet 14 execution report

Observation cutoff: 2026-11-04T08:51:05.475040+00:00. All seven feature PRs are merged and READY on production main a24587a1ec3b57a7b2bdfb5f69cce4e0e73602db. Acceptance measurements and the six-hour memory series remain in progress; deployment is not physical-phone acceptance. The supplied plan, with the owner’s explicit amendment preserving bypass access, is [plan-run14.md](plan-run14.md). `run13/docs` and PR #558 remain untouched. Four active-agent slots required scheduling eight lanes across three agents plus the coordinator; eight simultaneous coders were not available.

## Items 1–8

| Item | Implementation and evidence | Current boundary |
| --- | --- | --- |
| 1 — desktop shell, day note, calendar month | #559, exact reviewed head `fbb6d50916cb907313c2a2374e3bc9410f9f1b1e`; shared Home/shell frame, 500 px feed, Today hidden below 1148 px, no feed disclosure/asterisks, month summary | Preview and production geometry pass at1100/1280/1440; offline shell1280 shares500px+Today; late native-CDP reproduction confirms the old shell mechanism; original screenshot cause remains unproved |
| 2 — action row | #560, `45fddaf62f3932e48f054013c30773fadd2e7059`; 44 px boxes, immediate selected state, shared pending/failure ownership across navigation, exact retry error | Five rendered states passed locally; final external confirmation BLOCKERS:NONE; 2 px target overlap is the owner's explicit accepted layout tradeoff |
| 3 — immediate meal frame | #564, `d948c57baf9af7bffc9cf47b2473341318464c4b`; memory-only bounded card registry, phone frame, desktop modal, history and committed-input repairs | Eight local Firefox entry paths13–27 ms, photo top delta0 px; seven history/input/cancel/keyboard/double-tap regressions pass; native Chromium CPU4×/Fast3G six trials: frame23.3–45.4ms,0px shift; item readiness1162.3–2443.4ms |
| 4 — capture and model defects | #563, `83f8a4b7c702e8069a2ddf6773c2653de55058ca`; native Space exclusion, recoverable owner-bound durable flag, false keeps sheet open, completed retry idempotency, shared open-model deadline | 15 upload-guard cases pass; five open-provider cases pass; fake-camera native Space page look passed; final combined suite603/0/6 passed |
| 5 — auth and Today reads | #565, `148d9ab2158734cf849274660c38e7841054be17`; verified UI cookie with RLS boundaries, page-seeded Today with ready/missing-data guards and stable ascending order | 25 focused cases pass; local browser Auth0, desktop `/api/days`0; first-page feed requests0 with correct zone; ids-refresh traffic remains. Underlying nutrition-read deduplication is not proved |
| 6 — production measurements | #566, `e142d52ccf962a4ab9f808675e208afa545401f9`; resource attribution, six-hour sampler, tick/header and alias identity, cap and browser drivers | Three eager cold samples completed; cap probe cleaned12/12; production browser checks have scoped receipts; six lazy cold samples are recorded; full six-hour series remains pending |
| 7 — external #368 probe | [exact outside-bot prompt](prompts/openclaw-368.md), cleanup helper in #566 | Prompt copied verbatim. No bot run, account creation or cleanup execution is claimed |
| 8 — labelled model estimates | #561, `e5d4f660ac4d9ab3c352dbd7709b1335c2db446e`; estimate fallback, retained per100 g provenance, gram reconstruction versus volume-ratio scaling, migration0052 | 13 focused cases pass. Real Meta/disposable DB reanalysis persisted90 kcal/100g and the estimate sentence with cleanup. Final PPLX confirmation BLOCKERS:NONE;0052 applied/read back and PR merged |

## Merges and deployed source

[Exact-head merge ledger](evidence/run14/merged-prs.json). Main a24587a1 is READY deployment dpl_24RqPXLfHT5iuV9ZJEnADjoNzgFS, alias verified, health200. There are zero tracked-file differences against tested combined ea1a33fa, tree501108d7. [Identity receipt](evidence/run14/final-production.json). #564 needed only the anticipated main-only refresh d948c57→b59be8e.

## Validation and reviews

The first isolated H and D full suites each passed587 tests,0 failed,6 existing optional skips. Those preceded subsequent reviewer fixes and are not final combined-tree proof. H's serial DB gate passed39/39. Final combined source commit `ea1a33fa135bfa411791774b0c47947aba2ec520`, tree `501108d7d1af0cce724bcc5965cdfc9cf60139b6`: default build and TypeScript pass; full suite603 passed,0 failed,6 existing optional skips (609 including nested case),253500.535 ms; serial DB39/39,114149.428 ms; lint0 errors/11 warnings (6 existing,5 new). The earlier combined run had five VM importer fixture failures; their dependency mocks were repaired with all assertions preserved, then18 focused cases and the final complete suite passed. [Final validation](evidence/run14/integration-validation.json).

PPLX is the counting feature-review route; the owner accepts answers routed to ChatGPT6.1 and explicitly permits AGY in parallel. Request preference is not answer-model identity. Failed input selectors and an initial120-second capture timeout are failed attempts. Supplementary coder source reviews do not substitute for a counting external review. Real findings repaired: missing-portion estimate recovery; ml/gram rescale confusion; capture closing after false durability; recoverable owner binding; cross-remount feedback save races; stale desktop pending state; hidden-feed clicks during committed mobile loading; seeded Today order. The external claim about2px hit-target overlap conflicts with the owner's explicit accepted design decision and is not a defect to override that ruling.

AGY read all9 original measurement patch parts and returned BLOCKERS:NONE at3d660863. AGY confirmed the alias delta at719d1844 and final2 script parts at e142d52c with BLOCKERS:NONE. #565 received a complete22-part AGY review at148d9ab2 with BLOCKERS:NONE after PPLX source access returned429. [Counting index](reviews/run14-review-index.md).

## Premises and measurements

Initial P1 drivers timed out. The later native Chromium reproduction succeeded on the old immutable deployment: page and worker2500ms yielded the1025px shell without Today; zero latency yielded500px and Today. This proves the reproduced mechanism, not the cause of the owner’s earlier screenshot. [Receipt](evidence/run14/historical-shell-reproduction.md).

P4 passed: the project token created the Vercel Protection Bypass secret (HTTP200), retained only in a private ignored file. The owner explicitly ruled at16:15 WIB on November4 that this access secret stays in place and is never revoked or listed for revocation. No secret is copied into source, receipts or public links.

### Tick before measurements

| Eager preview | Cold header | First response ms | Warm response ms |
| --- | --- | ---: | --- |
| dpl_H1ZFVANA9dxfJxa5gHgmi4KFnhZE | 1 | 858.2 |252.8,204.8|
| dpl_E2ibFp4EP21ZQ83oS6kGoEXKGwus | 1 |612.1|214.6,193.6|
| dpl_GSSKye4w1jnY14rGivUotXC6LyZX | 1 |1144.2|222.1,190.6|

Temporary probe PR#562 is closed unmerged; its remote branch is deleted. These are measured cold-header responses, not an inference from deployment creation. Production lazy samples completed: six explicit cold headers and15 warm responses; #564 was already warm. Custom-alias identity is verified before sampling.


### Lazy production tick observations

| PR | Deployment | First header / ms | Warm follow-up ms |
|---|---|---|---|
|#559|dpl_AbyXU2TcRMbiAo5rxxQCGr1MvXh6|1 / 587.3|167.9, 175.4|
|#560|dpl_BZYreFnVozAD8b8vssLuFPz9btWz|1 / 602.6|218.4, 120.5|
|#561|dpl_DMWGxh6KTVnBYcctkJR1mK7Zprcp|1 / 484.9|207.1, 158.8|
|#563|dpl_DtuYL7TtdSFs2jkooH75RxKeAWnM|1 / 480.3|179.6, 179.0|
|#564|dpl_2Z4npM3nprf8M2LR6cxVw4Q6GW5L|0 / 128.7|125.2, 139.2|
|#565|dpl_BoxRAcgmqrPgE1QMCipbjQvqVz26|1 / 519.7|175.6, 158.6|
|#566|dpl_24RqPXLfHT5iuV9ZJEnADjoNzgFS|1 / 515.8|441.1, 150.8|

Eager previews and lazy production differ in environment and complete business-code revision; these totals do not establish a controlled causal speed percentage. Each labelled cold sample returned header1.

### Recording cap

[Per-post route counters and verified cleanup](evidence/run14/recording-cap.json):12 sequential real-photo posts on designated test account2;4 ready and8 needs_input, no refusal. Post counter progressed1→12 in the same hour against40/h, leaving28 post requests. Other named route buckets were absent, not silently inferred provider-call counts. This is recording-length cap evidence, not a claim that all12 photos completed nutrition. All12 posts and all run-created Storage objects were removed and absence verified. No script used the recording or owner account.

### Storage and memory

[Historical window](evidence/run14/egress-historical.md), [latest24h](evidence/run14/egress-latest.md), [read-only DB memory/connection snapshot](evidence/run14/db-memory.txt). Latest window: feed-source responses1,767,928,692 B; automation1,720,939,521 B. The largest observed browser source was mobile feed sources45,635,749 B, followed by desktop originals19,496,314 B. The existing #372 proxy resizes feed responses, but its upstream Storage source remains a `.feed.jpg`; this does not establish billed Storage savings or a before/after bill. Browser classifications are user-agent heuristics, not verified human identities. Node/undici can be an app proxy serving real humans; automation-class bytes are not proven bot-only traffic. Missing Content-Length is counted explicitly.

The first memory sample measured950,153,216 B total,484,290,560 B available and427,454,464 B cached. Page cache is reclaimable and differs from per-process committed memory. PostgreSQL shared_buffers256 MB; work_mem3500 kB is per operation, not a preallocated per-connection budget; max_connections60 is a limit, not the observed number of active connections. effective_cache_size768 MB is a planner estimate, not an allocation. The database is57 MB; PostgREST, Storage and Realtime hold standing connections. The requested full hourly series remains running. Log-ingestion bytes have no available Management API endpoint; the dashboard Usage page is the source, and neither log rows nor response bytes are ingestion bytes.

### Existing caffeine and wording

[Read-only caffeine receipt](evidence/run14/old-caffeine.txt): posts376e1cae and7184bd65 each retain32 mg for330 ml. This does not prove the owner's visual card check or day totals; those remain distinct.

The wording search at observed main299f13a4 found stored/schema/regex uses of "Clarification needed", with the visible NeedsInputStrip mapping to "A question about this meal". No hit for the other three searched obsolete phrases. Repeat against final main before closing#294. Installed Next16.4.3's `app-segment-config.js:152` parses `case 'instant'`;#499's premise is false and exports remain.

## Gaps, notices and new issues

The live18-case provider gate passed17: cendol selected closest USDA gelatin dessert; the ceramic plate stayed unavailable. The retained failure was the existing grilled chicken Caesar fixture choosing a no-dressing strict-match reference. Separate successful estimate persistence deliberately used empty USDA transport with real Meta and real disposable DB/card storage; it does not prove live USDA lacks cendol. [Provider receipt](evidence/run14/food-match-real.json), [persistence receipt](evidence/run14/estimate-reanalysis.json).

Remaining measurements are not labelled done: complete control rows and CPU4×/Fast3G scope; production phase timings; per-navigation physical reads; three-phone acceptance; final deployment/lazy tick samples; six-hour memory series. Owner physical-phone/meal-reference acceptance stays with the owner; no bot/phone result is fabricated. The current code/report must not close those issues on build success alone. #323 stays open: local windows recorded7/9/14 server Auth verifications (document plus prefetch/refresh), although browser Auth reads are0. [Local windows](evidence/run14/navigation-local-final.json). The eight items added after the37-item paste (#452,#557 and six without numbers) are outside this fleet, not planner omissions.

New issues created by this run: [#580](https://github.com/aibraincoach/my-food-ai/issues/580), nine measured target-size gaps, including caption More (37.18×19.6px), saved-meal Log now (79.12×34px), bottom-bar +, three capture tabs and three input fields. Feedback latency pass does not establish44px geometry. No recording-start notice was received; preserve the recording-to-submission merge/migration hold. Migration0052 applied from reviewed e5d4f660 and independent readback confirms estimate markers in both functions, anon/authenticated execute false, service_role true. An initial transaction exited before function creation and rolled back; explicit READ WRITE retry succeeded. No cause is invented for the unrecorded first stderr. [Receipt](evidence/run14/production-0052.json).

## Cleanup

Completed:12 cap posts and objects removed; eager probe closed unmerged and remote branch deleted. Pending: remaining production fixture cleanup, local apps/stacks/browsers and Fleet14 worktrees, final scripts/cleanup.sh. The original checkout's pre-existing untracked review remains preserved.

## Team status snapshot — 2026-11-04T08:59:00.199578+00:00

All seven code PRs559/560/561/563/564/565/566 are merged and deployed at a24587a1 (READY dpl_24RqPXLfHT5iuV9ZJEnADjoNzgFS, alias verified, health200). Every tracked deployed file equals the combined603/0/6 and39/39 tested tree. Counting feature reviews are cleared, and AGY cleared the complete auth/Today change plus the measurement-script deltas. The docs are in draft PR577; old docs PR558 remains untouched and no docs merge is authorized.

Completed production checks:500px desktop feed at1100/1280/1440, Today hidden only1100, balanced workspace and no stray note; browser Auth GETs0 onHome/Days/Profile; known-zone first-page browser feed reads0 with ids refreshes2, unknown-zone first-page1 with ids3; desktop api/days0. The physical server Auth window still has7/9/14 reads due prefetch/refresh, and underlying nutrient-read deduplication is not proven.

Production after-detail observations: immediate frame10–25ms on all six trials; five completed item rendering1030–1787ms with0px photo-top shift. One older desktop card had no item completion within20seconds. A focused subsequent check rendered its real modal, consumed summary and four editors; the non-completion was not reproduced and remains retained without a verified cause. These are unthrottled Firefox observations; they do not prove requested nativeChromium CPU4×/Fast3G or physical-phone timing. [After summary](evidence/run14/navigation-after-summary.json).

Two real production gallery fixtures became ready, showed pending food names before every calorie was available, and closed the posting sheet within388/390ms upper bounds (driver includes300mssettle). Cola persisted138.6kcal and30mg caffeine. Both posts/drafts/detached cleanup jobs/Storage prefixes were verified absent. A focused third cola fixture also became ready, but its rendered-rail driver did not establish the second slide; it was then fully cleaned. Do not claim the rendered drink-card check passed. The earlier12-post cap probe also removed its12posts/objects. [Initial gallery receipt](evidence/run14/production-gallery-initial.json).

Readonly UI checks: six drink tiles111.33×92px in3columns, usage order matched; actual virtual-camera video640×480 with scanning prompt opaque rgb(26,25,23). Calendar61dates October1–November30 contiguous and today visible. The entire calendar fits844px, so the November marker cannot be moved near the top; the label correctly names October at the current top, but production November switching remains unexercised. Do not close512 on that evidence alone.

Still running: hourly resource collector,2 of7 samples collected at07:40:46 and08:40:46UTC; the configured six-hour series ends13:40:46UTC. Still being finished: remaining control-table states/rendered cola proof, final issue comments/closures, final report/index/backlog reconciliation and local-service/worktree cleanup. Core feature coding, external review, tests, migration and deployment are finished. No new feature work is dispatched. All physical-phone/owner acceptance and the outside-bot368probe remain outside completed coder evidence.

## Owner steering — November4,16:15 WIB

The protection-bypass secret stays in place and is never revoked or listed for revocation. Its access material is retained privately outside disposable worktrees. This explicitly supersedes the original unchanged plan’s bypass-cleanup clauses. No revocation was performed. Review/planner suggestions must be checked for loss of fleet access before becoming backlog items or owner instructions. The verbatim correction is recorded in WALL_OF_STUPID.md.

## Verified follow-up — November 4

The complete original 26-finding DRY/service-boundary audit of main a24587a is preserved [verbatim](reviews/main-a24587a-dry-service-audit.md). The owner explicitly unblocked #579 at15:56WIB and directed it be fixed today; it is now separately assigned for implementation. This new steering is outside the original37-item planner input.

The later [historical shell reproduction](evidence/run14/historical-shell-reproduction.md) verifies the old deployment’s mechanism: at1280×800, slowing both page and service worker2500ms produced the1025px shell without Today; zero latency produced the500px feed with Today. This late reproduction does not establish the cause of the owner’s original screenshot.

The fifth gallery fixture passed the actual rendered second-slide drink check: Coca-Cola Original Taste330ml,30mg caffeine, visible tumbler illustration. All five gallery fixtures were removed with post/draft/job/Storage checks; with the12 cap posts this accounts for17 cleaned production posts. [Rendered proof](evidence/run14/cola-settled-proof.json), [scope](evidence/run14/cola-settled-visual.md). A separately tracked sixth gallery fixture is currently being used for the shared processing-state check; it is excluded from that completed-cleanup count until its receipt confirms removal.

All seven formerly missing control rows now have explicitly scoped evidence. Local render/network-interception fixtures are distinguished from live persisted state, Firefox timing from CPU-throttled Chromium, and unavailable CLS evidence remains unavailable. Nine direct interactive rectangles fall below44px and are filed in#580; the original feedback verdicts are not geometry passes. [Control scope](evidence/run14/control-scope-final.md), [queue measurements](evidence/run14/control-queue-production.json).

The hourly collector process3230892 was verified live during this follow-up. Its full series remains pending; its worktree and private protection-bypass access are retained.

Issue reconciliation posted19 commit-pinned evidence comments for the owner/window acceptance items in section9. Their ledger is [final-comments.json](evidence/run14/final-comments.json). Previously closed348/351/449/453/454/370 are reopened for the outstanding owner-phone acceptance explicitly required by that section; delivered implementation is retained.

Remote cleanup verified with `git ls-remote`: all seven merged Fleet14 feature branches and the closed probe branch are absent; run14/docs is retained. [Deletion ledger](evidence/run14/remote-cleanup.json). Local worktrees remain while evidence/services are reconciled; the live metrics collector and new579 work are preserved.

Native Chrome151 CPU4×/Fast3G evidence now verified from the completed artifact: six detail entries (three posts at390px and1280px), all immediate frames23.3–45.4ms and photo-top shift0px. Items became ready1162.3–2443.4ms, with two trials above2seconds; no blanket2second completion claim. All three Home windows recorded browser Auth GET0 and api/days0; ids refreshes remain. These are isolated-context emulation results, not physical phones. [Sanitized summary](evidence/run14/native-cpu-summary.json).

## Measured control table

Firefox production touch observations at390×844. Mutation timing includes pressed feedback; it is not completion latency. CLS was unavailable, so every unavailable value remains unmeasured. Initial verdicts below cover feedback only; sub44 geometry is separately failed in#580. Rows originally unexercised have scoped follow-up evidence in [control-scope-final.md](evidence/run14/control-scope-final.md). Native CPU4× acceptance is separate.

| Control | Hit area px | Pressed | Visible mutation ms | CLS | Double tap outcome | Feedback verdict |
|---|---:|---|---:|---|---|---|
| Bottom bar Home | 63.6×46.0 | True | 1 | unmeasured | {"first":{"path":"/","dialogs":0},"second":{"path":"/","dialogs":0},"pointerdowns":2} | pass |
| Bottom bar Search | 63.6×46.0 | True | 0 | unmeasured | {"first":{"path":"/search","dialogs":0},"second":{"path":"/search","dialogs":0},"pointerdowns":2} | pass |
| Bottom bar Days | 63.6×46.0 | True | 0 | unmeasured | {"first":{"path":"/days","dialogs":0},"second":{"path":"/days","dialogs":0},"pointerdowns":2} | pass |
| Bottom bar Profile | 63.6×46.0 | True | 1 | unmeasured | {"first":{"path":"/profile","dialogs":0},"second":{"path":"/profile","dialogs":0},"pointerdowns":2} | pass |
| Bottom bar + | 34.0×34.0 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":0},"second":{"path":"/","dialogs":0},"pointerdowns":2} | pass; target below44 |
| Saved meals header | 44.0×44.0 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":0},"pointerdowns":2} | pass |
| Today ring | 66.0×76.4 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":1},"pointerdowns":2} | pass |
| Past-day ring | 66.0×76.4 | True | 1 | unmeasured | {"first":{"path":"/","dialogs":0},"second":{"path":"/days/2026-11-03","dialogs":1},"pointerdowns":2} | pass |
| Meal menu | 44.0×44.0 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":0},"pointerdowns":2} | pass |
| Menu Edit caption | 216.0×44.0 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":0},"pointerdowns":2} | pass |
| Thumbs up | 44.0×44.0 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":0},"second":{"path":"/","dialogs":0},"pointerdowns":2} | pass |
| Thumbs down | 44.0×44.0 | True | 0 | unmeasured | {"first":{"path":"/posts/f1737bd7-7214-42c6-8e6a-0d1080a87e60","dialogs":0},"second":{"path":"/posts/f1737bd7-7214-42c6-8e6a-0d1080a87e60","dialogs":0},"pointerdowns":2} | pass |
| Comment | 44.0×44.0 | True | 0 | unmeasured | {"first":{"path":"/posts/e20a5590-9281-436b-900e-2afec24d2567","dialogs":0},"second":{"path":"/posts/e20a5590-9281-436b-900e-2afec24d2567","dialogs":0},"pointerdowns":2} | pass |
| Log again row | 44.0×44.0 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":1},"pointerdowns":2} | pass |
| Details | 52.2×44.0 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":0},"second":{"path":"/posts/e20a5590-9281-436b-900e-2afec24d2567","dialogs":0},"pointerdowns":2} | pass |
| Photo | 378.0×378.0 | True | 1 | unmeasured | {"first":{"path":"/posts/f1737bd7-7214-42c6-8e6a-0d1080a87e60","dialogs":0},"second":{"path":"/posts/f1737bd7-7214-42c6-8e6a-0d1080a87e60","dialogs":0},"pointerdowns":2} | pass |
| More | unmeasured | unmeasured | unmeasured | unmeasured | unmeasured | not exercised |
| Bookmark | 44.0×44.0 | True | 1 | unmeasured | {"first":{"path":"/","dialogs":0},"second":{"path":"/","dialogs":0},"pointerdowns":2} | pass |
| Try again failed post | unmeasured | unmeasured | unmeasured | unmeasured | unmeasured | not exercised |
| Days month navigation | 48.8×44.0 | True | 1 | unmeasured | {"first":{"path":"/days","dialogs":1},"second":{"path":"/days","dialogs":0},"pointerdowns":2} | pass |
| Days day cell | 48.3×44.0 | True | 1 | unmeasured | {"first":{"path":"/days","dialogs":0},"second":{"path":"/days/2026-10-31","dialogs":1},"pointerdowns":2} | pass |
| Search field | 294.0×21.0 | True | 0 | unmeasured | {"first":{"path":"/search","dialogs":0},"second":{"path":"/search","dialogs":0},"pointerdowns":2} | pass; target below44 |
| Search result | unmeasured | unmeasured | unmeasured | unmeasured | unmeasured | not exercised |
| Profile grid post | 128.7×128.7 | True | 1 | unmeasured | {"first":{"path":"/posts/e20a5590-9281-436b-900e-2afec24d2567","dialogs":0},"second":{"path":"/posts/e20a5590-9281-436b-900e-2afec24d2567","dialogs":0},"pointerdowns":2} | pass |
| Profile Connect an agent | 358.0×64.0 | True | 0 | unmeasured | {"first":{"path":"/profile","dialogs":0},"second":{"path":"/profile/agents/new","dialogs":0},"pointerdowns":2} | pass |
| Profile model setting | 44.0×44.0 | True | 0 | unmeasured | {"first":{"path":"/profile","dialogs":0},"second":{"path":"/profile","dialogs":0},"pointerdowns":2} | pass |
| Detail action row | 44.0×44.0 | True | 0 | unmeasured | {"first":{"path":"/posts/f1737bd7-7214-42c6-8e6a-0d1080a87e60","dialogs":0},"second":{"path":"/posts/f1737bd7-7214-42c6-8e6a-0d1080a87e60","dialogs":0},"pointerdowns":2} | pass |
| Capture Text entry | 52.0×52.0 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":1},"pointerdowns":2} | pass |
| Capture Photo mode | 78.9×36.0 | True | 1 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":1},"pointerdowns":2} | pass; target below44 |
| Capture Text mode | 66.1×36.0 | True | 1 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":1},"pointerdowns":2} | pass; target below44 |
| Capture Barcode mode | 113.4×36.0 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":1},"pointerdowns":2} | pass; target below44 |
| Capture Caption field | 358.0×42.0 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":1},"pointerdowns":2} | pass; target below44 |
| Capture Post empty draft | 358.0×50.0 | False | 48 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":1},"pointerdowns":2} | not available |
| Capture shutter | 72.0×72.0 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":1},"pointerdowns":2} | pass |
| Drink sheet entry | 53.3×53.3 | True | 1 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":1},"pointerdowns":2} | pass |
| Drink description | 260.0×21.0 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":1},"pointerdowns":2} | pass; target below44 |
| Drink photograph action | 48.0×48.0 | True | 0 | unmeasured | {"first":{"path":"/","dialogs":1},"second":{"path":"/","dialogs":1},"pointerdowns":2} | pass |
| Days month list selection | 350.0×48.0 | True | 0 | unmeasured | {"first":{"path":"/days","dialogs":0},"second":{"path":"/days","dialogs":0},"pointerdowns":2} | pass |
| Days day panel | 44.0×44.0 | True | 1 | unmeasured | {"first":{"path":"/days/2026-10-31","dialogs":1},"second":{"path":"/days","dialogs":0},"pointerdowns":2} | pass |
| Profile Sign out | 53.5×44.0 | True | 0 | unmeasured | {"first":{"path":"/profile","dialogs":0},"second":{"path":"/sign-in","dialogs":0},"pointerdowns":2} | pass |
| Capture Post populated draft | unmeasured | unmeasured | unmeasured | unmeasured | unmeasured | not exercised |
| Saved meals Log now offline | unmeasured | unmeasured | unmeasured | unmeasured | unmeasured | not exercised |
| Drink tile double tap | unmeasured | unmeasured | unmeasured | unmeasured | unmeasured | not exercised |
| Edit caption Save | unmeasured | unmeasured | unmeasured | unmeasured | unmeasured | not exercised |
