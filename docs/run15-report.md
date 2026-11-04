# Fleet 15: implementation and verification, deployment pending

Observed November 4, 2026. All nine code PRs are open. No Fleet 15 PR has merged, no production migration or role update has run, and no production-after acceptance or issue closure is claimed. The supplied plan is preserved byte-for-byte in [plan-run15.md](plan-run15.md). This docs PR is the final-step push and remains unmerged.

## Reconciliation with deployed Fleet 14 work

Main is `376e3306942161a5e659e8d99c85154c8ac26a35`, the merge of #581. That commit is also the merge base of #590 (`run15/photos`): this PR was not cut from the plan's older `a24587a` revision.

The overlap audit nevertheless found a regression: the stale plan reduced #581's camera ideals from 2560×1920 to 1920×1440. Commit `aa4b31ce8d119f61f2808cdd414d61fd7ce3d94a` restores #581's setting and original test. Compared with main, the camera module, reencoding module, existing v1/v2 routes and their shared serving helper now have zero changes. Native still capture and the existing v2 fallback remain intact. Lane A only extends that deployed path with density-specific copies from originals, corresponding srcsets/preloads and failure handling. Eleven focused camera/variant tests pass after reconciliation.

The owner's supplied Doc rev 1168, stamped 17:58 WIB, is the PM's Fleet 14 reconciliation. It does not add the newly reported #595/#599 work to this fleet's scope. This run does not edit BACKLOG.md or earlier fleets' docs branches.

## Implementation and remaining gates

| Lane | PR | Implemented and verified | Remaining |
|---|---|---|---|
| A | #590 | Preserves #581; adds original-based 1040/1560 variants, matching feed/detail/preload srcsets, server/client fallbacks. Local density and both failure paths pass. | Exact-head review, merge, production byte table A.10, phone-size observation A.11 and owner phone acceptance. |
| B | #587 | Durable background attachments, reload-safe idempotence, retry chips, processing bookmark gate, API 409. Twenty manager tests and transactional saved-meal rule pass. Production baseline measured. | Exact-head review, merge, one bounded after probe and before/after server-span table B.3/B.4. |
| C | #582 | Thirty-ring row, 62px columns/10px gaps, 72px snapping, history growth and Home reset. Local and exact-head protected-preview checks pass. | Exact-head review, merge, production look and owner phones. |
| D | #585 | Ready and pending counts are separate in calendar APIs, desktop panel and phone story. Exact-head preview shows four ready posts, one pending, and “4 posts · 1 not finished”. | Exact-head review, merge and production D.6 readback. |
| E | #586 | Admin table renders; all seven aggregates match direct SQL; ordinary account gets Not found locally. | Exact-head review, merge, authorized one-row owner promotion/readback and production ordinary-user 404. |
| F | #583 | About page and Profile link; existing-object storage ownership test; direct foreign post pages return 404 before streaming. Exact-head preview confirms owner access, foreign denial and account isolation. | Exact-head review, merge and production-after two-account check. |
| G | #588 | Bare-name fallback, provenance once per food, unavailable reason persistence/display; 0053 rewrite and 0054 summary refresh with rollback tests. Real Meta/empty USDA reanalysis passes locally. | Exact-head review, production migration application/readback before merge, then production fallback trace and ceramic-plate observation. |
| H | #589 | Complete-label outage guard; complete/incomplete outage regressions pass. | Exact-head review and merge before closing #557. |
| I | #584 | Viewport-bounded desktop capture/composer; 52px strip, 96px shutter, clipped background document. Final local production-build measurements pass. | Exact-head review, merge and production measurements before closing #576. |
| J | this PR | Supplied plan unchanged, implementation report, README link description. | Final deployed results, bytes appendix and issue receipts; docs PR remains unmerged. |

Each code PR branches directly from main. The aggregate `run15/core` branch is only for combined testing and is not pushed.

## Tests and browser checks

The combined production build passed. At aggregate head `467aff7a`, the full local suite ran 632 tests: 626 passed, six skipped, zero failed, in 249.4 seconds. The separate DB suite ran 43 cases: 40 initially passed; three HTTP/provider cases failed because the local built server lacked the disposable provider preload. After correcting that launch configuration, targeted reruns passed all three affected cases plus an additional identity SQL case. No broad repeat was run.

Later preview checks found and fixed two gaps that the original source replacements missed: the phone story lacked the unfinished count, and a streamed foreign-post not-found document returned HTTP 200. The phone fix passes TypeScript, scoped lint and 13 query/nutrition tests. The access fix passes TypeScript, scoped lint and 17 access/session/preload tests. Current PR-head Vercel builds pass. The earlier full-suite result is not represented as a fresh full run of these later changes.

The access guard adds one authenticated owner-metadata read for a direct `/posts/<id>` request. The detail page and RLS still enforce their own access checks. Signed-out users still redirect to sign-in. Canonical UUID handling and cookie refresh behavior are covered.

All browser checks use separately owned Firefox profiles and ports. No screenshots are stored. Timings are unthrottled, without CPU throttling.

| Local viewport | Window | Camera | Document height | Camera scroll/client | Composer scroll/client |
|---|---:|---:|---:|---:|---:|
| 1366×650 | 602 | 454 | 650 | 602/602 | 602/602 |
| 1024×700 | 620 | 472 | 700 | 620/620 | 620/620 |

Protected previews were accessed using the project's existing bypass entry, obtained by a read-only Vercel project request and retained in the ignored private file `run15-core/uploads/run15/preview-project-private.json`. It was not changed, regenerated or revoked. Deployment identities were checked against exact commit SHAs.

* Rings, head `dc07c47f5992d92fc300972b8b41866404e2df3b`: at 390px, ring six spans x376–438. A 100px scroll snaps to 72px. The last ring is wholly visible at x300–362. Home resets to zero; grey rings are inert; a ring with posts opens its day. After feed hydration settles, card y315.4 and row height86.4 remain unchanged while scrolling. The initial asynchronous feed shifted before settling; no claim of zero initial layout shift is made.
* The designated account has fewer than 30 days of history. A separately owned local 65-day fixture proves the 30→60 history growth. The plan's October 31 first-post date cannot itself prove history older than 30 days.
* Days, head `dc60980fc387723bbb9ff0e63ed6aced7110e688`: both preview APIs return four ready posts, one pending, and 1842.1 kcal for October 31 in America/Edmonton. The phone story visibly says “4 posts · 1 not finished”. This is preview evidence against live account data, not production-deployment acceptance.
* Access/about, head `e7db5cee8ffe0ebe0d88d96ef8c73b584f8c7e76`: an owned post returns 200 and renders its detail marker; another designated account's post returns 404 and its photo returns 404; Days returns only the signed-in account's posts; the about page returns 200. The first probe exposed the streamed-200 behavior and is retained privately alongside the passing final probe.

Local photo checks: DPR3 selects the 1560 variant (density-corrected naturalWidth520). A deliberately cross-post 404 fires one error, removes srcset and loads the existing v2 fallback. A valid 4096² noisy JPEG of 17,021,730 bytes exceeds the 8MiB source limit: manual GET returns 302/private,no-store; the native browser records variant302 → signed-original200 and a complete image (density-corrected width1365). All three photo fixtures and objects were verified absent.

The plan's corrupt-original fallback setup is impossible: the fallback would serve the same corrupt original. The valid oversized JPEG exercises a real source-limit failure while preserving a usable original. No production decode-speed or byte/egress claim follows from this local check.

## Production baseline and real-model receipt

The production baseline was the deployed #581 build, not the plan's older a24587a revision. Overlapping photos closed on the first press in 474ms and 365ms, with the second publishing while the first processed. A processing bookmark sent `/api/saved` POST400 and displayed “The meal could not be saved.” This proves the known toast path; it does not prove every possible phone failure shares that cause.

A ready-meal probe measured 387ms for the new-post sheet and 1,730ms from leftovers file selection to sheet close. Those triggers differ and are named explicitly. A separate needs_input fixture returned 409 during an unsuitable leftovers measurement attempt; it was not filed as a new product defect. Repeated baseline probes were stopped. Four owned production posts and their storage/stages were verified absent. No pre-existing post was deleted.

The plan names `post_media.created_at`, which the schema does not have. The bounded driver uses actual fields, `post_photo_attachments.created_at` and analyze-job timestamps instead. No unavailable span is invented. The after timing table and production bytes table remain pending deployment.

Real Meta, empty USDA transport, disposable stack: ceramic-plate reanalysis became ready in 7,112ms, using four empty USDA requests and two actual Meta requests. Its reference begins `unavailable:not_food:`; its existing first model comment now names the non-food decision. The owned post, objects and disposable user were verified removed. The production caption-only check has not run.

0054 is needed because 0052 refreshed existing comments only for approximation disclosures, leaving stale unavailable summaries on reanalysis/recompute. Its job/ownership fences and revision targeting remain covered by migration/rollback tests. Neither 0053 nor 0054 has been applied to production.

## Review blocker and unfinished acceptance

Muse CLI attempts returned HTTP429 “Subscription quota exhausted”, resetting November 9 at00:00UTC. Further attempts against that exhausted quota were skipped. Waiting for the reset was flagged and skipped; no timer or collection remains running.

PPLX on a fresh, separately owned Firefox was blocked by Cloudflare: title “Just a moment...”, text “Performing security verification”, with no review input across five live inspections. The harness exited2 after5.2s. Its PR582 comment records a failed attempt, not a review. Other fleets' authenticated browsers/profiles were not reused or restarted. No counting verdict exists for any current code head.

P1 phones remain unverified. P2, a second disposable account, was verified. P3, the known bookmark toast, was reproduced; the broader screenshot cause remains an inference. P4, the production decode ceiling, remains unverified; local oversize fallback passes. P5 production bytes and egress remain unmeasured. Owner phone/judge checks remain as the plan states.

Still required: exact-head reviews; production migration readbacks; merges; production byte/media-loading appendix; after upload/server-span measurements; production Days readback; owner role update/readback; production two-account checks; one-search production fallback trace; production ceramic-plate observation; production rings/capture checks; issue closures and evidence comments. No issue is closed from local or preview tests alone.

Backlog issues created: none. Other observations retained without new scope: the initial feed hydration shift, six skipped pre-existing live tests, an existing DaysView image lint warning, and intermittent GitHub5xx pushes. Preview access is now resolved using the unchanged bypass entry.

## Current code heads

| PR | Branch | Head | Review | Merge |
|---|---|---|---|---|
| #582 | run15/day-rings | `dc07c47f5992d92fc300972b8b41866404e2df3b` | none | not merged |
| #583 | run15/judges-page | `e7db5cee8ffe0ebe0d88d96ef8c73b584f8c7e76` | none | not merged |
| #584 | run15/capture-height | `7279ca386f43fcf1451cc3716d572cb2d5d73a69` | none | not merged |
| #585 | run15/day-counts | `dc60980fc387723bbb9ff0e63ed6aced7110e688` | none | not merged |
| #586 | run15/admin-counts | `4b8ebcf5b1e6fa36737628693e427c537dc5b0df` | none | not merged |
| #587 | run15/uploads | `03b29aefbdc7ac62194823d32fb52c07d814b633` | none | not merged |
| #588 | run15/nutrition-reasons | `5b785d4ae484db3cf0b788b613de59e898f9850f` | none | not merged |
| #589 | run15/barcode-complete | `9ff72811a42cecc0f90ea51720498320d5d92f35` | none | not merged |
| #590 | run15/photos | `aa4b31ce8d119f61f2808cdd414d61fd7ce3d94a` | none | not merged |

Raw receipts and exact own-fixture ledgers remain ignored under `run15-core/uploads/run15`; credentials and full account identifiers are not committed. Only owned browser/server/backend resources are stopped, and only owned pushed code worktrees are removed. The broad cleanup script is avoided because it can affect other fleets. The aggregate evidence worktree is retained for the unfinished deployment phase.
