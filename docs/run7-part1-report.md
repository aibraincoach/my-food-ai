# Run 7 — current pass partially complete

Historical pre-merge report. For merged/deployed state, issue dispositions and remaining checks, see [post–Run 7 reconciliation](post-run7-backlog-reconciliation.md).

The implementation is built and pushed. Item 1 remains partial: the final cold photo observation is 2,096.9 ms against a 2,000 ms target. The owner stopped further optimization so this pass could close with its remaining work stated explicitly. Nothing has been merged or deployed by this run; production migrations, provider environment values and owner acceptance remain Part 2.

## Items 0–7

| Item | Result | PR and source |
| --- | --- | --- |
| 0: supplied plan | Done: preserved unchanged | [#308](https://github.com/aibraincoach/my-food-ai/pull/308), this documentation branch |
| 1: feed opening and photos | Partial: batching, bounded reads, retained feed, private image cache, viewport gating and smaller first photo built; cold timing and phone acceptance remain open | [#310](https://github.com/aibraincoach/my-food-ai/pull/310) `f23efc554c3f17b229a9f502eafc23f9f5833f2e`; [#311](https://github.com/aibraincoach/my-food-ai/pull/311) `f32ba1c92d05fbe6e4ffce9803398ccd5cc41a4e` |
| 2: open weights | Part 1 done: working per-account Baseten path, committed provenance, eleven-case trial; not on production | [#315](https://github.com/aibraincoach/my-food-ai/pull/315) `2e55916ba1039901f5acd43d62f89b568ded5318` |
| 3: Facebook button | Built and verified inert on both auth pages | [#309](https://github.com/aibraincoach/my-food-ai/pull/309) `f84c68909e951139a195dd3885433eb0aabc50ac` |
| 4: instant taps | Built; immediate state and mocked failure rollback verified | [#314](https://github.com/aibraincoach/my-food-ai/pull/314) `1c4d72ab4b30a52b999944781974a3db6683fd16` |
| 5: names before totals | Built; owner/job fences and concurrent updates verified | [#313](https://github.com/aibraincoach/my-food-ai/pull/313) `ff221a7591ebc69d2011ad9910f7057bb32577a3` |
| 6: worker safety | Built; live lease renewal, durable USDA deferral and safe copy verified | [#312](https://github.com/aibraincoach/my-food-ai/pull/312) `9e5877b1ac67c5d195bf5f6887dde7ec66fb6519` |
| 7: judges' README | Written with evidence and deployment limits | [#308](https://github.com/aibraincoach/my-food-ai/pull/308) |

## Checks and limits

The private combined branch includes all seven feature heads above. Its final production build exits 0; 67 focused feed, cache, image, access and hint regressions pass with exit 0. TypeScript and changed-file lint pass. The earlier combined feature checks passed 74/74. Full-repository lint remains failing with 34 existing errors and 20 warnings; no clean full-lint claim is made.

The disposable local Auth/REST/PostgreSQL/app database suite passed 17/17 with zero failures or skips, including all three migration features and API-to-worker-to-detail model provenance. Its exact source and infrastructure limits are in the [verification receipt](run7-verification.md). The model/provenance and migration heads are unchanged by the final image follow-up. No generated-PNG upload or realtime acceptance is inferred from that local stack.

Final #315 real-model gates pass: identification four requests, 42.186 s, 4,044 output tokens; food reference twenty requests, 64.885 s, 17,127 output tokens and forty USDA reads. Eleven paired trial cases used the actual Open model: hosted totals 11/11, Open totals 10/11, with the unavailable case preserved. Baseten-only estimated spend including probes is $0.146187, below the $5 trial cap; hosted Meta usage is separate.

The final image route produced a 21,610-byte WebP and returned 401 without a session and 404 for another owner. Cold card/photo: 910.2/2096.9 ms. Actual cached reopening: 620.4/620.4 ms. The initial Home response lacked the early image Link; its absence remains unexplained. These are single throttled local observations, not percentiles or real-phone acceptance. The new private-route logout/new-tab/browser-restart cases pass worker unit tests but were not rerun in an actual browser after the owner stopped optimization. The earlier actual-browser privacy matrix covered signed JPEGs. [Detailed measurements](https://github.com/aibraincoach/my-food-ai/blob/run7/feed-open/docs/media-loading.md).

Before/after reliability: original main service and Home HTTP probes both completed 100/100; the previously reported production browser failures did not reproduce in that baseline. The source-equivalent preview before the final image follow-up completed 100/100 API reads and 100/100 Home HTTP responses. API p50/p95/max 1112.5/4260.5/8545.3 ms; Home 744.4/1834.5/8636.1 ms. These are HTTP repetitions, not 100 browser opens on the final image head. Request fan-out and unbounded waits were reduced; the original production failure's cause was not isolated.

The earlier missing-credential block was false: the Baseten key existed and authenticated successfully; models, image chat and Responses probes returned HTTP 200. No credential value was committed. Existing same-holder lease acquisition already extended a live lease; renewal ownership/failure handling still needed the dedicated RPC and tests. Conflicting plan batching recipes were resolved with paired revision fences and batched media/items/saved reads. A1 includes A2's runtime dependency files so its independent preview builds; subsequent A1 improvements are intentional. Protected-preview timing was separated from local built-app timing rather than treated as a phone result.

## Reviews and production gate

The owner accepts Muse's exact-head watch comments. [Accepted receipt snapshot](reviews/run7-muse-receipts.md). #310 retains its dependency blocker until #311 supplies the hook and first-photo wiring. #314's restore listener is supplied by #311. Muse reviewed the final #311 `f32ba1c92d05fbe6e4ffce9803398ccd5cc41a4e` head with [BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/311#pullrequestreview-5746773020). A review comment is not merge authorization.

The feature merge list, in ascending PR order, is #309 `f84c68909e951139a195dd3885433eb0aabc50ac` (no migration), #310 `f23efc554c3f17b229a9f502eafc23f9f5833f2e` (none), #311 `f32ba1c92d05fbe6e4ffce9803398ccd5cc41a4e` (none), #312 `9e5877b1ac67c5d195bf5f6887dde7ec66fb6519` (0034), #313 `ff221a7591ebc69d2011ad9910f7057bb32577a3` (0033), #314 `1c4d72ab4b30a52b999944781974a3db6683fd16` (none), #315 `2e55916ba1039901f5acd43d62f89b568ded5318` (0032). Docs #308 merges last under the plan. Part 2 remains behind its named-head merge order after evaluation; this report does not supply that order.

Own measurement browsers and app servers are stopped. SSO remained enabled. The owner's Firefox on port 9223 is preserved. No handover archive is created.
