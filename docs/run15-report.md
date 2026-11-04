# Fleet 15 report — implementation and local verification; deployment pending

Observed November 4, 2026. The supplied plan is preserved unchanged in `plan-run15.md`. This is an incomplete execution report: no Fleet 15 PR has merged, no production migration or role update has run, and no production-after acceptance or issue closure is claimed. Documentation has not been pushed.

## Implementation and review gates

| Lane | PR | Implementation and local evidence | Remaining |
|---|---|---|---|
| A | #590 | Camera ideals1920×1440 with existing still-capture improvement retained; original-based1040/1560 variants, matching feed/detail/preload srcsets, server/client fallback.48 focused tests; browser density and both fallback paths pass. | Exact-head review, merge, production bytes A.10, phone read-only sizes A.11, production acceptance. |
| B | #587 | Durable attachments, reload-safe idempotence, retry chips, processing bookmark gate, API409.20 manager tests and transactional saved-meal rule pass. Baseline production overlap and leftovers measured. | Exact-head review, merge, one bounded after probe B.3/B.4. |
| C | #582 |30-ring row,62px columns/10px gaps,72px snapping, history growth, Home reset. Local390px browser geometry and unchanged feed position verified. | Exact-head review, protected-preview look, merge, production look, owner phones. |
| D | #585 | Ready meals counted consistently; pending meals separate. Mixed-ready/pending and nutrition query regressions pass. | Exact-head review, merge, production D.6 readback. |
| E | #586 | Existing admin access retained; aggregate counts render locally; all7 service aggregates match direct SQL counts; ordinary account gets Not found. | Exact-head review, merge, authorized one-row owner promotion/readback, production404. |
| F | #583 | Authenticated about page and Profile link; fresh empty-account rendering; two-account RLS test signs an existing object as owner and denies the second account. | Exact-head review, merge, production two-account checks; README paragraph prepared locally. |
| G | #588 | Bare-name fallback, provenance once per food, unavailable reason persisted and rendered;0053 rewrite and0054 summary refresh with rollback tests. Real Meta/empty USDA reanalysis updates the same first comment and stores `unavailable:not_food:*`. | Exact-head review; reviewed0053/0054 production apply/readback before merge; production fallback trace and ceramic-plate check after merge. |
| H | #589 | Complete-label outage guard; complete/incomplete outage regressions pass. | Exact-head review and merge before closing#557. |
| I | #584 | Viewport-bounded desktop capture/composer;52px strip/96px shutter; background document clipped while modal is present. Final built Firefox measurements below pass. | Exact-head review, merge, production measurements before closing#576. |
| J | local `run15/docs` | Plan unchanged and this honest interim report prepared locally. | Final report/bytes after deployment; final-step docs push and unmerged docs PR. |

All code PRs branch directly from main, initially376e3306 (#581). The aggregate `run15/core` branch exists only for combined testing and has not been pushed. Code PRs have no docs pushes.

## Verification

Combined production build passes. `TEST_ENV_FILE=.env.run15.local npm test`:632 tests,626 passed,6 skipped,0 failed (249.4 seconds). Skipped live-route/SQL cases are reported by the runner; this is not a claim that they ran. The separate database suite ran43 cases:40 passed initially;3 HTTP/provider cases failed because the local built server lacked the disposable provider preload. After fixing that local launch configuration, targeted reruns pass all3 affected cases (plus one extra identity SQL case), with no skipped database cases. No broad repeat was run. Changed code passes TypeScript; scoped ESLint found a false-positive asynchronous month-loader effect, documented narrowly; the existing DaysView image warning remains.

Firefox tests used separately owned profiles and endpoints19515/19516/19517. No screenshots were stored. All timings are unthrottled, without CPU throttling.

| Viewport | Window | Camera | Document height | Content scroll/client | Composer scroll/client |
|---|---:|---:|---:|---:|---:|
|1366×650|602|454|650|602/602|602/602|
|1024×700|620|472|700|620/620|620/620|

At390px, ring6 occupies x376–438, so five full rings and part of the sixth appear. A100px scroll snaps to72px; the first card stays y187.4 before/after. Own disposable65-day history grows30→60; Home reset returns scrollLeft0. The supplied account2 first-post date of October31 is only a few days before this run, so it cannot itself prove history older than30 days; the local fixture supplies that case.

A browser checks: DPR3 selects1560 variant (density-corrected naturalWidth520). A deliberately cross-post404 fires one error; srcset is removed and existing v2 fallback loads. A valid4096² noisy JPEG of17,021,730 bytes exceeds the8MiB source limit: manual GET returns302/private,no-store; native browser network records variant302 → signed original200 and complete image (density-corrected width1365). All3 photo fixtures/storage were verified absent.

Plan correction: corrupting an original cannot leave a usable signed-original fallback. The valid oversized JPEG tests an actual server failure while preserving the fallback. Existing#581 v2 identity remains the1x/client fallback instead of regressing it to v1. No unmeasured production byte or decode-performance claim follows.

## Baseline production observations — unthrottled

Production baseline was the current#581 build, not the older a24587a baseline named in the plan. Overlapping photos closed on the first press in474ms and365ms; the second published while the first processed. A processing bookmark sent `/api/saved` POST400 and displayed “The meal could not be saved.” This proves that known toast path, not every possible phone failure.

A ready-meal probe measured387ms for the new-post sheet and1,730ms from leftovers file selection to sheet close. Those triggers differ and are named explicitly. One separate attempt on a needs_input fixture returned409; this was an unsuitable measurement fixture, not a newly filed product defect. Repeated baseline probes were stopped. Four owned production posts and their storage/stages were verified absent; no existing post was deleted.

The plan names `post_media.created_at`, which the current schema does not have. The bounded driver uses actual fields plus `post_photo_attachments.created_at` and analyze job timestamps instead. Baseline job receipts remain private under `run15-b/uploads/run15-b`; no unsupported span is invented. No after timing or bytes table exists yet.

## Real-model unavailable check

Disposable local stack, real Meta, empty USDA transport: ceramic plate reanalysis became ready in7,112ms, making4 empty USDA requests and2 actual Meta requests. The stored reference begins `unavailable:not_food:`; the existing first model comment now names the non-food decision. Own post, objects and disposable user were verified removed. Production caption-only check has not run.

0054 was necessary because0052 updated existing summaries only for approximation disclosures, preserving stale unavailable comments on reanalysis/recompute.0054 retains ownership/job fences and revision targeting; its migration/rollback regression tests pass. Neither0053 nor0054 has been applied to production.

## Reviews, production and unresolved acceptance

Muse CLI exact-head attempts for A/B/C returned HTTP429 “Subscription quota exhausted”, reset2026-11-09T00:00:00Z. No verdict exists. Further attempts against that exhausted quota were skipped.

PPLX on a fresh separately owned Firefox was blocked by Cloudflare: title “Just a moment...”, text “Performing security verification”, no review input across five live inspections. Its harness exited2 after5.2s; PR582's attempt comment explicitly records failure, not a review. Other fleets' authenticated browsers/profiles were not reused or restarted. No review gate is claimed satisfied and no production merge/mutation follows.

P1 phones: unverified. P2 second local account: verified provisioned by own disposable stack. P3 known bookmark toast: reproduced; broader phone screenshot cause remains an inference. P4 production decode ceiling: unverified; actual local oversize fallback verified. P5 production bytes/egress: unmeasured pending deployment. Owner phone/judge checks remain as the plan states.

Not done: production byte table/media-loading appendix, before/after server-span table, production day-count readback, role update, production two-account readback, production0053/0054 readback, one-search production fallback trace, production ceramic-plate observation, production rings/capture look, exact-head reviews, merges, closures and planned issue evidence comments. No issue is closed by local tests alone.

Backlog issues created by this run: none. Additional noticed items left unfixed: inaccessible protected preview without known bypass path; PPLX Cloudflare; Muse quota; GitHub intermittent5xx pushes (authoritative branch heads are checked before retry); pre-existing skipped live tests and image lint warning. No broad cleanup script was run because it can kill other fleets' browsers or remove their worktrees; cleanup is restricted to our exact resources.

## Current code heads

| PR | Branch | Head | Counting review | Merge |
|---|---|---|---|---|
|#582|run15/day-rings|`dc07c47f5992d92fc300972b8b41866404e2df3b`|none|not merged|
|#583|run15/judges-page|`d7d3c1430f2a037acd2ba5c3c4a2f2bc33be7b81`|none|not merged|
|#584|run15/capture-height|`7279ca386f43fcf1451cc3716d572cb2d5d73a69`|none|not merged|
|#585|run15/day-counts|`452c6fb7eaf12825b5305a18c6444b11a0ad3264`|none|not merged|
|#586|run15/admin-counts|`4b8ebcf5b1e6fa36737628693e427c537dc5b0df`|none|not merged|
|#587|run15/uploads|`03b29aefbdc7ac62194823d32fb52c07d814b633`|none|not merged|
|#588|run15/nutrition-reasons|`5b785d4ae484db3cf0b788b613de59e898f9850f`|none|not merged|
|#589|run15/barcode-complete|`9ff72811a42cecc0f90ea51720498320d5d92f35`|none|not merged|
|#590|run15/photos|`29b4d8e5d24f576058b7a4b2227b4d81977300f9`|none|not merged|

Resources owned by this run: PostgreSQL55559; backend ports61365–61368 and app61360; browser ports19515/19516/19517. The raw receipts and own-fixture ledgers stay ignored in `run15-core/uploads/run15`; no credential or full account identifier is committed.

Local teardown: own app, Firefox and disposable backend stopped. Code worktrees are removed only after verifying their PR heads are pushed. No broad cleanup script or other fleet cleanup ran. The unpushed aggregate/evidence and local docs worktrees are retained for the unfinished review/deployment phase.
