# Fleet 14 execution report

Observation cutoff: 2026-11-04T08:51:05.475040+00:00. All seven feature PRs are merged and READY on production main a24587a1ec3b57a7b2bdfb5f69cce4e0e73602db. Acceptance measurements and the six-hour memory series remain in progress; deployment is not physical-phone acceptance. The exact supplied plan is [plan-run14.md](plan-run14.md). `run13/docs` and PR #558 remain untouched. Four active-agent slots required scheduling eight lanes across three agents plus the coordinator; eight simultaneous coders were not available.

## Items 1–8

| Item | Implementation and evidence | Current boundary |
| --- | --- | --- |
| 1 — desktop shell, day note, calendar month | #559, exact reviewed head `fbb6d50916cb907313c2a2374e3bc9410f9f1b1e`; shared Home/shell frame, 500 px feed, Today hidden below 1148 px, no feed disclosure/asterisks, month summary | Preview and production geometry pass at1100/1280/1440; offline shell1280 shares500px+Today; native-CDP shell-cause premise P1 remains unproved |
| 2 — action row | #560, `45fddaf62f3932e48f054013c30773fadd2e7059`; 44 px boxes, immediate selected state, shared pending/failure ownership across navigation, exact retry error | Five rendered states passed locally; final external confirmation BLOCKERS:NONE; 2 px target overlap is the owner's explicit accepted layout tradeoff |
| 3 — immediate meal frame | #564, `e7789dbcafc81fd42cb80f44caa5e7c0c41bb7b7`; memory-only bounded card registry, phone frame, desktop modal, history and committed-input repairs | Eight local Firefox entry paths13–27 ms, photo top delta0 px; seven history/input/cancel/keyboard/double-tap regressions pass; exact CPU4×/Fast3G unproved |
| 4 — capture and model defects | #563, `83f8a4b7c702e8069a2ddf6773c2653de55058ca`; native Space exclusion, recoverable owner-bound durable flag, false keeps sheet open, completed retry idempotency, shared open-model deadline | 15 upload-guard cases pass; five open-provider cases pass; fake-camera native Space page look passed; final combined suite603/0/6 passed |
| 5 — auth and Today reads | #565, `66bfc9db504357e38de44cf4a57bdf3f04c21608`; verified UI cookie with RLS boundaries, page-seeded Today with ready/missing-data guards and stable ascending order | 25 focused cases pass; local browser Auth0, desktop `/api/days`0; first-page feed requests0 with correct zone; ids-refresh traffic remains. Underlying nutrition-read deduplication is not proved |
| 6 — production measurements | #566, `719d18448d6f28580e2c0b2aa39ba14e059445f4`; resource attribution, six-hour sampler, tick/header and alias identity, cap and browser drivers | Three eager cold samples completed; cap probe cleaned12/12; final production browser checks, lazy cold samples and full six-hour series pending |
| 7 — external #368 probe | [exact outside-bot prompt](prompts/openclaw-368.md), cleanup helper in #566 | Prompt copied verbatim. No bot run, account creation or cleanup execution is claimed |
| 8 — labelled model estimates | #561, `377df937b40f14f57abeadde81a75b50d5fba6e8`; estimate fallback, retained per100 g provenance, gram reconstruction versus volume-ratio scaling, migration0052 | 13 focused cases pass. Real Meta/disposable DB reanalysis persisted90 kcal/100g and the estimate sentence with cleanup. Final PPLX confirmation BLOCKERS:NONE;0052 applied/read back and PR merged |

## Merges and deployed source

[Exact-head merge ledger](evidence/run14/merged-prs.json). Main a24587a1 is READY deployment dpl_24RqPXLfHT5iuV9ZJEnADjoNzgFS, alias verified, health200. There are zero tracked-file differences against tested combined ea1a33fa, tree501108d7. [Identity receipt](evidence/run14/final-production.json). #564 needed only the anticipated main-only refresh d948c57→b59be8e.

## Validation and reviews

The first isolated H and D full suites each passed587 tests,0 failed,6 existing optional skips. Those preceded subsequent reviewer fixes and are not final combined-tree proof. H's serial DB gate passed39/39. Final combined source commit `ea1a33fa135bfa411791774b0c47947aba2ec520`, tree `501108d7d1af0cce724bcc5965cdfc9cf60139b6`: default build and TypeScript pass; full suite603 passed,0 failed,6 existing optional skips (609 including nested case),253500.535 ms; serial DB39/39,114149.428 ms; lint0 errors/11 warnings (6 existing,5 new). The earlier combined run had five VM importer fixture failures; their dependency mocks were repaired with all assertions preserved, then18 focused cases and the final complete suite passed. [Final validation](evidence/run14/integration-validation.json).

PPLX is the counting feature-review route; the owner accepts answers routed to ChatGPT6.1 and explicitly permits AGY in parallel. Request preference is not answer-model identity. Failed input selectors and an initial120-second capture timeout are failed attempts. Supplementary coder source reviews do not substitute for a counting external review. Real findings repaired: missing-portion estimate recovery; ml/gram rescale confusion; capture closing after false durability; recoverable owner binding; cross-remount feedback save races; stale desktop pending state; hidden-feed clicks during committed mobile loading; seeded Today order. The external claim about2px hit-target overlap conflicts with the owner's explicit accepted design decision and is not a defect to override that ruling.

AGY read all9 original measurement patch parts and returned BLOCKERS:NONE at3d660863. AGY confirmed the alias delta at719d1844 and final2 script parts at e142d52c with BLOCKERS:NONE. #565 received a complete22-part AGY review at148d9ab2 with BLOCKERS:NONE after PPLX source access returned429. [Counting index](reviews/run14-review-index.md).

## Premises and measurements

P1 remains unproved: repeated native Chromium page/network commands timed out on this host, even when Browser/Runtime health commands answered. This is a driver limitation, not evidence that the service-worker cause is true or false. The shared structural Home/shell repair was specified regardless of P1.

P4 passed: the project token created the temporary Vercel Protection Bypass secret (HTTP200), retained only in a private ignored file. Revocation remains due after preview checks finish. No secret is copied into source, receipts or public links.

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

New issues created by this run: none so far. No recording-start notice was received; preserve the recording-to-submission merge/migration hold. Migration0052 applied from reviewed e5d4f660 and independent readback confirms estimate markers in both functions, anon/authenticated execute false, service_role true. An initial transaction exited before function creation and rolled back; explicit READ WRITE retry succeeded. No cause is invented for the unrecorded first stderr. [Receipt](evidence/run14/production-0052.json).

## Cleanup

Completed:12 cap posts and objects removed; eager probe closed unmerged and remote branch deleted. Pending: preview bypass revocation, remaining production fixture cleanup, local apps/stacks/browsers and Fleet14 worktrees, final scripts/cleanup.sh. The original checkout's pre-existing untracked review remains preserved.
