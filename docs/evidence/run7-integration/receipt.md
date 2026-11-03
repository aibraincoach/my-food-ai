# Run 7 integration browser evidence

Integration branch: `run7/integration`, commit `9f908671174888567bac418ff360cb4add3db576`.

Recovered completed browser runs; no additional browser or worker run was performed during recovery. Results contain no account IDs, post IDs, storage paths, cookies, or signed URLs.

- Automatic service-worker first visit cached three CORS photos without a manual warm fetch. On full second navigation an invalid signed token still decoded the cached original photo: 960px, 110498 bytes.
- Four cached cards painted at 707ms browser time / 755ms wall time during a five-second server hold. All four remained visible after both server and client failure; no wrong-account content was observed.
- Keyboard navigation focused visible content; four total and four visible rows, zero retired cache rows.
- Mocked logout reduced two account cache keys to zero; production auth action was not executed.
- Accepted mocked delete removed both DOM and cache before response. Mocked corrected food updated DOM and cache, preserving deletion. A fresh navigation (`performance.timeOrigin` changed) retained both at 342ms while server seed was held for five seconds.
- Waiting-state checks passed for partial foods, known kcal, waiting copy, no retry button, no total, and no overflow.

Build and typecheck had passed; focused regression log reports 74/74. Full lint remains failing with 34 errors and 20 warnings reported as existing by the preceding integration work.

Limitations: delete, correction, logout, and failure conditions were locally mocked. Earlier browser guards missed mutating GET `/api/jobs/tick`; app logs include missing renewal RPC errors against an unmigrated schema. Later fixture blocks this endpoint and all non-GET requests. The earlier run cannot be described as wholly read-only; a prior zero-count database observation does not prove no later writes. No worker retry, schema/environment change, deployment, push, merge, or review invocation was performed in recovery.

Cleanup verified: integration app 3115 and integration Firefox 9225 are absent; fixture control files are absent and integration git worktree is clean. Original Firefox 9223 and A1 measurement server/browser 3116/9236 were preserved.
