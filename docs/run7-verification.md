# Run 7 combined verification

This records coder verification, not independent code-review approval or production acceptance. Muse owns the current reviews. No Run 7 PR has been merged or production migration applied by this run.

## Combined source

| PR | Source head |
| --- | --- |
| #309 | `f84c68909e951139a195dd3885433eb0aabc50ac` |
| #310 | `f23efc554c3f17b229a9f502eafc23f9f5833f2e` |
| #311 | `e2c74b1c7ff73e6b0ce38a27fa19286e2c7b57b9` |
| #312 | `9e5877b1ac67c5d195bf5f6887dde7ec66fb6519` |
| #313 | `ff221a7591ebc69d2011ad9910f7057bb32577a3` |
| #314 | `1c4d72ab4b30a52b999944781974a3db6683fd16` |
| #315 | `2e55916ba1039901f5acd43d62f89b568ded5318` |

A private integration branch combines these independent PRs; it is not a replacement merge order. Clean build and TypeScript checks exit 0. Focused regressions pass 74/74. Full lint exits 1 with 34 existing errors and 20 warnings; this is not described as a clean full lint run.

## Database and real models

The disposable local PostgreSQL, Auth, REST and built-app stack passes `npm run test:db`: 17 passed, zero failed or skipped. It includes post-to-ready, lease renewal, pending-item ownership/concurrency and atomic successful-identification provenance. The API-to-worker-to-detail test checks the committed model label. Local storage upload is not provisioned and uses the existing optional fallback; this does not establish generated-PNG upload or realtime acceptance. [Database receipt](https://github.com/aibraincoach/my-food-ai/pull/308#issuecomment-6593384089).

On exact #315 head above, the real identification gate passes with four model requests (42.186 seconds, 4,044 output tokens); the real food-reference gate passes with 20 model requests and 40 USDA requests (64.885 seconds, 17,127 output tokens). The completed eleven-case hosted/Open trial is in [the provider PR](https://github.com/aibraincoach/my-food-ai/pull/315); Baseten-only estimated usage including probes is $0.146187. Hosted Meta usage is separate and is not included in that estimate.

## Actual browser cache checks

Firefox tests on the combined source above exercised the actual service worker and browser storage. No production logout was executed: the real profile sign-out action was intercepted before its server POST.

- After clearing a populated private image cache, a **new** image request from the still-valid old session left zero private image entries.
- A new tab carrying the old cookie also left zero entries, with that session disabled.
- Terminating and reopening the same test browser profile retained the block across the worker/browser restart; another new old-session request left zero entries.
- Positive new-session epoch behavior is covered by unit tests; it was not separately exercised through a new real browser authentication transition in this audit.

A separate fresh-profile visit automatically cached three decoded CORS photos without a manual warming fetch. After a full second navigation and a restart of the private app server, an image with an intentionally invalid signing token still decoded at 960 pixels from the original 110,498 cached bytes. This proves the actual image path reused the query-independent cache across signed-URL churn. It does not prove a mobile-data timing target. [Privacy triage receipt](https://github.com/aibraincoach/my-food-ai/pull/310#issuecomment-6593588594).

One integration browser run initially blocked non-GET writes but missed the existing `GET /api/jobs/tick`, which can start a worker. The app logged a missing `renew_worker_lease` RPC against the unmigrated schema. Subsequent checks also intercept that GET. Read-only job/model-call checks found no new rows in the inspected interval, but the origin is still being reconciled; these browser checks are not described as wholly read-only. No production migration or worker retry was issued to investigate.

On the final combined source, an additional browser check held server reads for five seconds: four cached cards painted at 707 ms from navigation (755 ms wall time). After both server and client refresh failed, all four cached cards remained visible, no wrong-account marker appeared, and there were no hidden duplicate keyboard rows. Mocked sign-out cleared both account-cache keys. This is a functional delayed-server test, separate from the throttled network performance gate.

The final source-equivalent #311 Vercel preview completed 100/100 feed API reads and 100/100 Home HTTP responses. API p50/p95/max were 1112.5/4260.5/8545.3 ms; Home 744.4/1834.5/8636.1 ms. These are HTTP repetitions, not 100 browser opens. The original production failure was not isolated.

Throttled preview observations still fail the two-second photo target: cold card/photo 1994.2/5610.2 ms; warm card/photo 6116.3/6150.0 ms. Protected-preview overhead is being separated through an exact built-app local measurement. The remaining timing and mutation-persistence checks are reported when complete. Real-phone acceptance and production checks remain outstanding.
