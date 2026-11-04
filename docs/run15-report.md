# Fleet 15: implementation and verification, deployment pending

Updated 2026-11-04T13:49:35.672Z for PM replacement. All nine code PRs are open. No Fleet 15 PR has merged, no production migration or role update has run, and no production-after acceptance or issue closure is claimed. The supplied plan is preserved byte-for-byte in [plan-run15.md](plan-run15.md). This docs PR is the final-step push and remains unmerged.

## Reconciliation with deployed Fleet 14 work

Main is `376e3306942161a5e659e8d99c85154c8ac26a35`, the merge of #581. That commit is also the merge base of #590 (`run15/photos`): this PR was not cut from the plan's older `a24587a` revision.

The overlap audit nevertheless found a regression: the stale plan reduced #581's camera ideals from 2560×1920 to 1920×1440. Commit `aa4b31ce8d119f61f2808cdd414d61fd7ce3d94a` restores #581's setting and original test. Compared with main, the camera module, reencoding module, existing v1/v2 routes and their shared serving helper now have zero changes. Native still capture and the existing v2 fallback remain intact. Lane A only extends that deployed path with density-specific copies from originals, corresponding srcsets/preloads and failure handling. Eleven focused camera/variant tests pass after reconciliation.

The owner's supplied Doc rev 1168, stamped 17:58 WIB, is the PM's Fleet 14 reconciliation. It does not add the newly reported #595/#599 work to this fleet's scope. This run does not edit BACKLOG.md or earlier fleets' docs branches.

## Implementation and remaining gates

| Lane | PR | Implemented and verified | Remaining |
|---|---|---|---|
| A | #590 | Preserves #581; adds original-based 1040/1560 variants, matching feed/detail/preload srcsets, server/client fallbacks. Local density and both failure paths pass. | merge, production byte table A.10, phone-size observation A.11 and owner phone acceptance. |
| B | #587 | Durable background attachments, reload-safe idempotence, retry chips, processing bookmark gate, API 409. Twenty manager tests and transactional saved-meal rule pass. Production baseline measured. | merge, one bounded after probe and before/after server-span table B.3/B.4. |
| C | #582 | Thirty-ring row, 62px columns/10px gaps, 72px snapping, history growth and Home reset. Local and exact-head protected-preview checks pass. | merge, production look and owner phones. |
| D | #585 | Ready and pending counts are separate in calendar APIs, desktop panel and phone story. Exact-head preview shows four ready posts, one pending, and “4 posts · 1 not finished”. | merge and production D.6 readback. |
| E | #586 | Admin table renders; all seven aggregates match direct SQL; ordinary account gets Not found locally. | merge, authorized one-row owner promotion/readback and production ordinary-user 404. |
| F | #583 | About page and Profile link; existing-object storage ownership test; direct foreign post pages return 404 before streaming. Exact-head preview confirms owner access, foreign denial and account isolation. | merge and production-after two-account check. |
| G | #588 | Bare-name fallback, provenance once per food, unavailable reason persistence/display; 0053 reader preparation, gated 0055 compact rewrite, and 0054 summary refresh with rollback tests. Real Meta/empty USDA reanalysis passes locally. | production migration application/readback before merge, then production fallback trace and ceramic-plate observation. |
| H | #589 | Complete-label outage guard; complete/incomplete outage regressions pass. | Merge before closing #557. |
| I | #584 | Viewport-bounded desktop capture/composer; 52px strip, 96px shutter, clipped background document. Final local production-build measurements pass. | merge and production measurements before closing #576. |
| J | this PR | Supplied plan unchanged, implementation report, README link description. | Final deployed results, bytes appendix and issue receipts; docs PR remains unmerged. |

Each code PR branches directly from main. The aggregate `run15/core` branch is only for combined testing and is not pushed.

## Tests and browser checks

After all five remediation reviews completed, one full combined run passed at aggregate head `692de1ee45ebbf3038f17a3d80c7893185ddf6b3`, tree `0bdbed83656a44c831c77d8098be112939a089ea`: 656 tests, 650 passed, six skipped, zero failed (247.1 seconds). The database gate passed all 45 tests, with zero skips or failures (116.7 seconds). The production build passed at the same final tree. This supersedes the earlier partial reruns and incorrectly configured local-server gate.

The merge rehearsal finds one conflict in the obsolete HTTP-preload test. Retaining #590's reviewed replacement, which includes the access stub, produces exactly the tested tree. No production migration or merge has occurred.

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

0054 is needed because 0052 refreshed existing comments only for approximation disclosures, leaving stale unavailable summaries on reanalysis/recompute. Its job/ownership fences and revision targeting remain covered by migration/rollback tests. None of 0053, 0054 or 0055 has been applied to production.

## Review blocker and unfinished acceptance

Muse CLI attempts returned HTTP429 “Subscription quota exhausted”, resetting November 9 at00:00UTC. Further attempts against that exhausted quota were skipped. Waiting for the reset was flagged and skipped; no timer or collection remains running.

The owner's quota override permits AGY and ChatGPT inside PPLX. All nine current heads now have complete review receipts; all five changed heads have fresh zero-blocker AGY receipts. The earlier PPLX model deviations, truncated captures and failed attempts remain labelled. Failed in-progress comments were closed with their outcome, preserving the original claims. The owner's Perplexity tabs were left untouched.

All five reported blockers were confirmed against source; none was dismissed:

- #585: the first ready post now seeds nutrition totals without a pending-post placeholder introducing a false unavailable-food warning. Both post orders are covered.
- #587: a definitive expired-stage response permits re-upload; committed stages remain idempotent. A failed first local save relinquishes queue ownership. An additional inspection found active Save controls for unfinished meals; the controls now fail closed for unknown/non-ready status, while Unsave remains available.
- #588: the old-reader compatibility finding is real. Compact writes default off. Migration 0053 prepares a database format barrier and versioned claims; activation of 0055 requires the verified reader-compatible production SHA, obtains immediate locks, refuses running jobs and fences old claims. Rollback expands data before restoring old claims. Actual old-reader compatibility and rollback tests pass. There is no timed drain or soak.
- #589: a saved label needs at least one finite, nonnegative energy/protein/carbs/fat value; zero remains valid. Empty corrections cannot erase usable provider data.
- #590: the HTTP preload was removed; the responsive HTML preload has explicit 1x/2x/3x sources. Sharp/original fallback state follows image identity. Fresh browser contexts at DPR 1/2/3 each made exactly one successful photo request: v2 40,024 bytes; 1040 variant 16,446 bytes; 1560 variant 27,084 bytes. These are local fixture measurements, not production bytes.

The owner still has two reserved rulings: retain migration 0054's stale-summary repair, and retain #583's owner-metadata lookup on direct post navigation. These did not delay remediation or its reviews and combined gate. The previous PM explicitly reserved those rulings for the owner; none has arrived. A named-head merge order is also absent under the PM/planner contracts. This handover does not supply either authority.

P1 phones remain unverified. P2, a second disposable account, was verified. P3, the known bookmark toast, was reproduced; the broader screenshot cause remains an inference. P4, the production decode ceiling, remains unverified; local oversize fallback passes. P5 production bytes and egress remain unmeasured. Owner phone/judge checks remain as the plan states.

Still required: production migration readbacks; merges; production byte/media-loading appendix; after upload/server-span measurements; production Days readback; owner role update/readback; production two-account checks; one-search production fallback trace; production ceramic-plate observation; production rings/capture checks; issue closures and evidence comments. No issue is closed from local or preview tests alone.

Backlog issues created: none. Other observations retained without new scope: the initial feed hydration shift, six skipped pre-existing live tests, an existing DaysView image lint warning, and intermittent GitHub5xx pushes. Preview access is now resolved using the unchanged bypass entry.

## Current code heads and issue mapping

| PR | Branch | Head | Issues | Review receipt |
|---|---|---|---|---|
| #582 | run15/day-rings | `dc07c47f5992d92fc300972b8b41866404e2df3b` | #569 | [PPLX Gemini](https://github.com/aibraincoach/my-food-ai/pull/582#issuecomment-6630247976) |
| #583 | run15/judges-page | `e7db5cee8ffe0ebe0d88d96ef8c73b584f8c7e76` | #568 | [AGY](https://github.com/aibraincoach/my-food-ai/pull/583#issuecomment-6630264223) |
| #584 | run15/capture-height | `7279ca386f43fcf1451cc3716d572cb2d5d73a69` | #576 | [AGY](https://github.com/aibraincoach/my-food-ai/pull/584#issuecomment-6630291367) |
| #585 | run15/day-counts | `5887f56e6ceb92cece48192a8b56d2f7b9e6a2fc` | #574 | [AGY](https://github.com/aibraincoach/my-food-ai/pull/585#issuecomment-6630712980) |
| #586 | run15/admin-counts | `4b8ebcf5b1e6fa36737628693e427c537dc5b0df` | #567 | [AGY](https://github.com/aibraincoach/my-food-ai/pull/586#issuecomment-6630204125) |
| #587 | run15/uploads | `2195a5cd4c5d6b66d81b33c3eb710fb2c95c498f` | #570, #571, #578 finding 1 | [AGY](https://github.com/aibraincoach/my-food-ai/pull/587#issuecomment-6630905849) |
| #588 | run15/nutrition-reasons | `223bf70eb7b682a1a06a7d6bdcf33c79b9d36212` | #572, #573, #575 | [AGY](https://github.com/aibraincoach/my-food-ai/pull/588#issuecomment-6630756566) |
| #589 | run15/barcode-complete | `911c33bac2853c88ad1e9ead20302fef0a414f2e` | #557 | [AGY](https://github.com/aibraincoach/my-food-ai/pull/589#issuecomment-6630691845) |
| #590 | run15/photos | `69a216b956be40f9dc434cdf379b328864f64421` | #579; byte evidence for #372/#222 | [AGY](https://github.com/aibraincoach/my-food-ai/pull/590#issuecomment-6630743736) |

Supplementary Muse watch reviews now report zero blockers at the current heads of #585/#587/#588/#589/#590. [Offline current-head receipt copies](reviews/run15-pr585-current.md) accompany the package, with one file per PR.

All nine remain unmerged. Docs #600 sits beside Fleet 14 docs #577; it does not replace it.

Raw receipts and exact own-fixture ledgers remain ignored under `run15-core/uploads/run15`; credentials and full account identifiers are not committed. Only owned browser/server/backend resources are stopped, and only owned pushed code worktrees are removed. The broad cleanup script is avoided because it can affect other fleets. The aggregate evidence worktree is retained for the unfinished deployment phase.

## Production and migration reconciliation

The November4 read-only [migration audit](migrations.md) finds no missing prior-fleet migration. Production remains #581/main376e3306. No Fleet15 migration, role update or production-after acceptance ran. The owner has fired the PM and requested a successor handover. No new code scope, merge order or database-write permission is inferred from that request. The fresh GitHub index holds118 open issues; #591–#599 remain outside this fleet's dispatched work. The latest full repository backlog is12:41WIB; the later owner-reported Doc rev1168 at17:58WIB was not supplied in full.
