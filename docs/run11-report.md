# Fleet 11 execution report

Plan: [plan-run11.md](plan-run11.md). Baseline: `e9bea0aed7cd12dd9093d2e30212c85eb57382a2` (current origin/main at start). This is an in-progress evidence record; no item is complete merely because its code is built.

## Current state

- Item 0: unchanged plan preserved in PR #475. This docs PR stays open.
- Item 1: PR #476, head `ed4904e`, production webpack build passed. Review and genuine production upload observation pending. The existing boundary excludes needs_input before the new read, so its redundant comparison was removed after TypeScript rejected it. The helper throws database errors to preserve the previous card.
- Item 2: production read-only constraint query returned `user_call_hits_route_check`. Migration 0046 and rollback written on run11/drink-cap. Applied only to disposable local PostgreSQL; boundary/isolation and cap-response tests passed (2/2). Production application, review and recording-session check pending.
- Item 3: fresh disposable stack created from baseline migrations; fresh database suite running. README audit and full suite pending.
- Item 4: not done.
- Item 5: multilingual prompt and distinct failed state implemented on run11/label-any-language; eslint passed. Provider/photo observations and build pending.
- Item 6: specified overlay tokens implemented on run11/barcode-prompt. Build and visual check pending.
- Items 7–10: not done.
- Item 11: not done.
- Item 12: draft implementation on run11/log-again-instant; not yet validated or pushed.
- Items 13–18: not done. Item 17 baseline changed: #462 is already merged at the baseline SHA above.

## Premises

P1–P5: unverified. No conclusion recorded yet.

## Reviews, merges and closures

No Fleet 11 code merge, production migration or issue closure performed yet. PR #476 has its ready-for-review comment. Full reviewed heads and merge commits will be recorded as they become available.

## Environment and cleanup

Original checkout untracked file: `docs/reviews/mfa-pplx-pr311-e7ece5c.md`; preserved. No leftover worktrees existed at start. Design ZIP exists in uploads; extracted round6 reference also exists. Separate lane worktrees created from baseline. Disposable stack uses `.env.run11.test.local` and `uploads/run11-test-stack`; no production credentials loaded into the test runner. Active handles and worktrees remain while execution continues; final cleanup is pending.

## Verified progress after initial report

- #476 merged as `153e83b56b07382cb1d96eca43746b667c1debfd`; Muse cleared exact head `ed4904e300c780cd8efbdb9e92da204bddc0bd10`, Vercel succeeded. Production new-upload observation remains pending.
- #477 merged as `c4a2e0f112faaa592ab248cb7773e1cbb9081aca`; Muse cleared exact refreshed head `1822af0c76888e745c52c807dfdb78d63f8c1a50`. Migration 0046 applied transactionally to production immediately before merge and [read back](evidence/run11/0046-production-readback.txt). Recording-length session pending.
- #478 merged as `eca1a5de84768961b658fb6a7e760454e4690662`; Muse cleared exact refreshed head `765eb4751e7103464d826626bf281013c427d571`. Provider fixture and UI acceptance pending.
- #479 barcode prompt, #480 OFF fallback, #481 alcohol caffeine, #482 continuous calendar, #483 caption keyboard, #484 historical gaps are open. Each has its full ready-for-review SHA in the PR comments; refreshes require current-head confirmation.
- Item 3 fresh disposable baseline run: [database 32 passed / 0 failed / 0 skipped](evidence/run11/baseline-db.txt); [full suite 567 passed / 0 failed / 6 skipped](evidence/run11/baseline-tests.txt). Initial four HTTP failures occurred before starting the local app; the corrected complete run is retained above. Plain main lint still scanned uploads and failed there; the missing uploads ignore is being restored on run11/readme-tests (0 errors / 6 warnings there). This contradicts the plan premise that all lint changes were already landed.
- P2 true: tiki post `8535b793-9222-44f8-b8ce-6d80d580ea92`, USDA `2710626`, category `liquor and cocktails`, nutrient 1057 `15.400000000000002 MG`, intake caffeine 15 mg / 220 ml. Scoped repair awaits merge of #481.
- Item 10: production constraint names confirmed read-only as `intake_logs_kind_check` and `intake_amount_range`. 0047 applied only on the disposable stack. New DB test accepts 16 g / 220 ml, rejects 600 g, proves zero hydration and Bintang 13.9 g -> amount 14. All 13 selected alcohol/drink checks passed. Production migration remains pending review.
- Item 17 **passed** at #462's exact head `905b47414efd119ba27b22782af647aa2059619f`: viewport 1100×800, Today right edge 1068 <= 1100, no document horizontal overflow, no overflowing children. [Geometry](evidence/run11-today/geometry.json), [screenshot](evidence/run11-today/1100x800.png). No Lane N needed.
- Item 18: all ten posts inspected read-only through getCurrentItems and isDrinkItem. [Full per-item record](evidence/run11/drink-gaps-before.json). Two real gaps: Pepsi Zero in `38de279e-2764-44f7-a224-f67f5f77da08` (no intake), Evian bottled water in `d06d4d29-b532-470e-a930-e285f4180123` (espresso has 64 mg / 30 ml; water missing). #377 reopened. Remaining eight posts are foods or sheet/tile posts with authoritative post-linked caffeine. #484 pins the two exact missing names and excludes similarly named food. Backfill awaits merge and will target only those two posts.
- Temporary Fleet11 preview access created for acceptance; private token retained outside the repository and must be revoked at final cleanup.

## Product build checkpoint

- #479 merged at `a22ffade4f0e138c1f30380c6c3bf7c15b2263d5`, reviewed current head `8d8e92cb013bf6c29c9976bba4bc39eaac8431bb` with zero blockers and successful Vercel checks. Busy-camera visual acceptance remains pending.
- #480 merged at `cfb86aa72c671b11cb77a836a499b210335b771b`, reviewed current head `321d5de102241a1a99fd04de28d9b6c2c2d9f4ef` with zero blockers and successful Vercel checks. Both live barcode lookups, attribution UI and product-post cleanup remain pending.
- #481–#487 are open product PRs. #485 is drink glyphs; #486 alcohol records; #487 immediate Log again. Their PR comments record current full heads after refresh. #486 must refresh after #481; #485 must refresh after #486. Every refreshed head still needs its reviewer confirmation.
- Item 8 pure glyph + existing drink tests passed (13 selected tests); webpack build and targeted eslint passed. P5: getPostHydrationData already detects all-item drink posts, while cardDataFromRow itself only trusted supplied kind/drink. #485 adds recognition of complete item links at that boundary.
- Item 10 expanded DB test also proves that 20 mg caffeine from Rum and coke survives hydration reads while its alcohol adds zero water. Alcohol rows store grams in amount, so a bounded read of their current item nutrition preserves that independent caffeine measure. Unknown alcohol remains unavailable. No production 0047 application yet.
- Item 11 (#483) and item 12 (#487) passed webpack production builds and targeted eslint. Keyboard emulation and Slow 4G/offline/reload acceptance remain pending.
- Five merged lane worktrees, local branches and remote branches removed: A, B, D, E, F. Main checkout's original untracked review remains preserved.
- Current baseline complete-suite results remain 567 passed / 0 failed / 6 existing skips, and DB 32/0/0. A final current-main run after remaining merges is required; intermediate lane checks do not substitute for it.

Next acceptance work: genuine production new upload; eight-photo cap session; Indonesian/English label probes; barcode fallback and attribution; phone calendar; keyboard and Log again; drink-card PNGs and alcohol; scoped tiki/two-gap backfills after their respective merges. Items 13–16 measurements, permitted closures and final cleanup remain open. Item 17 is already verified and reported on #462 with commit-pinned links.

## Runtime acceptance and investigations

- #481 merged at `db73ad2` after exact-head zero-blocker review. Scoped tiki repair changed caffeine 15 mg / 220 ml to water 220 ml / caffeine 0, and its summary now contains no caffeine. [Before/after](evidence/run11/tiki-repair.json). It must be resynchronized once more after item 10 to receive its alcohol kind. The repository backfill script has no scoped arguments despite the plan premise, so the same syncItemDrinks service was invoked directly for the one authorized post.
- #482 (continuous calendar) merged at `cf18bd6`; #483 (keyboard) merged at `a005f7a`; #484 (historical gaps) merged at `f81987f`. Exact reviewed heads are in their GitHub reviews. [Phone geometry and navigation](evidence/run11-phone/checks.json), [calendar screenshot](evidence/run11-phone/calendar-today.png), [keyboard at 450 px](evidence/run11-phone/keyboard-450.png). Calendar has 61 consecutive dates Oct 1–Nov 30, opens today visibly, marks Oct/Nov 1, jumps to October and opens the Oct 27 deep link. Keyboard geometry: caption y170–212, thumbnail 72×72, Post y370–420 in a 450 px viewport. Upload/identify were disabled only for that layout-only probe; it created no backend fixture.
- Historical-gap repair ran only for the two authorized post IDs. [Repair rows](evidence/run11/drink-gaps-repair.json), [all ten current records](evidence/run11/drink-gaps-after.json). Pepsi Zero now has 330 ml / 32 mg caffeine; Evian has 500 ml water beside the pre-existing 30 ml / 64 mg espresso. Their owners are neither designated test account, so a signed-in production UI acceptance has not been claimed or attempted through another person's session. #377 remains open until the card/day-total acceptance is established.
- Indonesian probe before and after returned 200 with the visible right-hand panel: 250 ml serving, 200 kcal, fat 5 g, protein 8 g, carbs 30 g, sugar 23 g, sodium 55 mg. English after returned 200: 55 g serving, 230 kcal, fat 8 g, protein 3 g, carbs 37 g, fibre 4 g, sugar 12 g, sodium 160 mg. [Responses and zero remaining photos/readings](evidence/run11-labels/responses.json). P3 remains unproven: the Indonesian baseline succeeded, and this does not reconstruct the owner's original Goldfish failure. Indonesian fixture is [Rantemario's unchanged Commons image](https://commons.wikimedia.org/wiki/File:Informasi_Nilai_Gizi.jpg), CC BY-SA 4.0.
- Item 13a: [management summary](evidence/run11-measurements/management-summary.json). Address fields are present. The 24-hour query found 419 token records, including 337 password login events across 3 actors and 6 distinct addresses. This does not label server-action calls versus direct SDK probes, so shared sign-in rate-limit attribution is still unknown; #368 stays open. No production sign-in/sign-up form submitted.
- Item 13c: usage API returned 404; [dashboard route](evidence/run11-measurements/dashboard-usage.json) opened Usage but required an authenticated dashboard session. Log-ingestion bytes remain unavailable; #373 and #375 stay open for that gap.
- Items 13g/h: [three isolated browser-open minutes and log query](evidence/run11-measurements/page-open-counts.json). Browser auth count is one for each page; browser direct totals count zero. Project-wide log counts were Home 35 auth / 4 totals, Days 18 / 0, Profile 20 / 0. Those include unrelated project traffic and cannot establish the combined per-opening count; #323/#324 remain open. Forged unsigned verified-user header still returns 307 to sign-in. P4 true for minute-filtered API access, but attribution remains unresolved.
- Item 14: new test-only PR #488. Scripted refusal reaches failed and owner retry returns 204 then ready. USDA Retry-After 120 queues run_after 120246 ms later with attempts 0. Integration passed in 92 seconds. Local tick polling simulates the managed cron omitted from the disposable stack; retry timestamps and attempt counts were never changed. UI evidence capture is running separately.
- Fallback external review is running in a sub-agent for #485–#488 because refreshed heads lack recent confirmations. The agent orchestrates PPLX; it does not review OpenAI-written code itself. Original authenticated Firefox restored; a changed Perplexity textbox selector was diagnosed and retried via a temporary runner copy. No product branch receipt-only commits will invalidate reviewed heads.

## Completed acceptance checkpoint

- Item 1 passed on a genuine production cohort: eight new photo posts all reached ready, with eight observed processing updates containing food names before any kcal. [Scoped observer/session receipt](evidence/run11-eight-photos/session.json). The photos were submitted through the real UI; no model/worker response was stubbed. Cleanup removed 8 posts and 45 objects, with zero remaining.
- Item 2: the same eight-photo cohort (six meals, coffee, cola) showed zero cap messages. An additional two-photo composer check deliberately waited for drink identification; [receipt](evidence/run11-drink-bucket/session.json) records two independent drink_identify hits and two ordinary post-stage hits, both resulting posts ready, no cap message, cleanup zero. The first cohort posted before composer checks, so it alone is not claimed to exercise the new identification bucket.
- Items 4/6 passed on production for both `7622300761363` and Indonesian `8992760221028`: real generated EAN-13 images were decoded by the installed scanner; lookup returned OFF products; capture and expanded post nutrition showed both attribution links. [Receipt and cleanup](evidence/run11-barcodes/checks.json), [busy-camera prompt](evidence/run11-barcodes/prompt-busy.png). Two posts and six objects removed, zero remaining. P1 is supported for these two packs only, not a claim of broad Indonesian-pack coverage.
- Migration 0047 applied transactionally and [read back](evidence/run11/0047-production-readback.txt), then #486 merged at `3738640` after Gemini cleared exact head `722bf3e76e6c22e0f0b658da0ff5709fab9d5422`. Today excludes unknown-alcohol sentinel values and explicitly labels unavailable alcohol. The drink-glyph integration awaits confirmation after its refresh.
- Tiki resynchronization now records alcohol 18 g / 220 ml with zero caffeine; summary is `Drank: 18 g alcohol · 1.3 standard drinks · 196 kcal`. The day's water drops by 220 ml and caffeine remains 95 mg from the other drink. [Final repair](evidence/run11/tiki-repair.json).
- Item 12: [five production-before and five preview-after Slow 4G / CPU4 trials](evidence/run11-saving/timings.json) all showed the sheet closing and local card before response. Ten copied server rows survived reload. Offline acceptance is still under diagnosis; the failed offline probe is retained as a failure, not a pass. #487 merged after exact-head Gemini confirmation at `1d74990b882fe6726cd4c8f1cff51703cb413a05`.
- Item 13b: per-photo Fleet10 feed/cache and matched strip byte tables added to [media-loading.md](media-loading.md). Phone/mobile-data acceptance stays RT under #379.
- Item 13f: [fresh eager/lazy tick observations](tick-cold.md) are 0.809013/0.230098/0.164041 s versus 0.531299/0.256762/0.178981 s. All HTTP200. Throwaway PR #489 closed without merge; eager/lazy remote branches and worktrees removed. Temporary preview bypass remains until all acceptance is complete.
- Item 14: [integration output](evidence/run11-recovery/integration.txt) and [actual local browser state/copy](evidence/run11-recovery/ui.json), [refusal screenshot](evidence/run11-recovery/meta-refusal.png), [429 screenshot](evidence/run11-recovery/usda-429.png). Clicking Try again reached ready; both local fixtures removed. Tests are in PR #488; final merge/review and closure pending.
- Authorized closures completed: #374, #413, #360, #363. #193 was already closed. #379 received the retained owner-only #370 and three-phone checks. No RT-only issue closed.
