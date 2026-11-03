# Fleet 10 execution report — in progress

Observed 2026-11-03, 09:06 UTC. This is an execution ledger, not a completion claim. The full supplied scope remains [the plan](plan-run10.md). Physical-phone acceptance and owner-only settings remain with RT.

## Items 0–8

| Item | Current evidence |
| --- | --- |
| 0 | Supplied plan copied byte-for-byte to docs/plan-run10.md; PR #385 remains open. Seventeen code worktrees and the docs worktree were created at the start. The original checkout's untracked review artifact was preserved. |
| 1 | #392 implements error mapping, one stale-revision retry, and one error surface. Disposable HTTP/DB suite: 24 passed, 0 failed/skipped with the additional migration in #395. Fresh production baselines on three cards returned 204; the original cause is not established. Production acceptance pending. |
| 2 | #390 adds Details to feed cards and adjusts dot spacing. Initial TypeScript, lint and build passed. Final refreshed checks and browser acceptance pending. |
| 3 | README replacement and final-main counts/private-string search pending; no invented test counts published. |
| 4 | #391 removes Cookie from Vary after owner-scoped authorization. Initial checks passed. Browser session-refresh byte measurements pending. |
| 5 | #393 declares iad1 and adds deployment documentation. Initial checks passed; deployment function-region inspection pending. |
| 6 | #386 merged after exact-head watch review and clean checks. The composer opens before background barcode decode, with an actual paint boundary. Barcode still opens. The 300 ms shutter condition is NOT met: camera encoding outside addFiles takes approximately two seconds in the emulation. #370 remains open. |
| 7 | Investigation evidence below is being collected. Unmeasured sections remain unproven. |
| 8 | #333 merged at its current reviewed head b9068d081dea94075734ae5570c9129b53bfb1c5 before code. #386, #387 and #388 merged. Production Sheet checks passed; #382 closed. All six tiles posted with expected values and were removed. Remaining acceptance/closures pending. |

## Additional implementation lanes

| Item | Current evidence |
| --- | --- |
| 9 | Coffee #388 merged; production six-tile check passed. |
| 10 | Water-only day reader and month grid in #400; local real Supabase test passed including other-user isolation and cleanup. |
| 11 | Last-feed shell #397 builds as static /shell; existing service-worker suite 20/20. Slow navigation and account-switch browser acceptance pending. |
| 12 | Matcher #394 reaches compatible steak on third search in regression; real two-meal production acceptance pending. |
| 13 | #401 backfill executed; 25 matching item gaps became 10. Every remaining post is explicitly reported; broad name query includes non-drinks and existing atomic tiles. |
| 14 | Composer drinks being implemented with durable owner-scoped reading/publish path, migration 0040. |
| 15 | Unmark/Replace being implemented with migration 0038, owner-isolation regression and truthful whole-meal note. |
| 16 | #399 delays destructive requests for six seconds and flushes once on pagehide; timer/undo/pagehide regression passes. Production acceptance pending. |
| 17 | #396 implements allowed sizes, hold, usage order and usual size; local HTTP/gesture acceptance passed. |
| 18 | #398 changes leftovers labels throughout; wording tests 2/2, lint zero errors after fixing an existing indicator effect. Production acceptance pending. |
| 19 | Existing pending-food-name feature needs actual production photo observation. |
| 20 | Visual issues #353–#367 and report-driven fixes remain in scope; concrete data-display fixes #355/#356/#361 under investigation. No blanket visual acceptance. |
| 21 | #387 merged. Feed and nested capture delete confirmation survived 10.5 seconds each in preview and production; Cancel worked. #382 closed. |

## Premises corrected or unproven

- P1: Three fresh production thumbs requests returned 204, including the oldest of the initial twenty cards. Stale-card causation was not reproduced by that baseline.
- PostgREST 14 retries SQLSTATE 40001 indefinitely: actual disposable HTTP reproduced it, and Supabase's official knowledge base confirms it. Additional #389 records the defect; #395 changes this deterministic conflict to PT409 with a rollback. Migration 0039 is reserved for it; production schema unchanged so far.
- The prescribed capture state update does not guarantee a paint before synchronous barcode work; a double animation-frame boundary was needed. The camera encode itself is outside item 6's addFiles scope and prevents claiming 300 ms acceptance.
- The plan's shell force-static route config fails the actual cacheComponents build. Removing the directive produces a static /shell without changing the intended public shell.
- Rounded proportional Coffee caffeine is 139 mg for 350 ml, whereas the explicit test/Done requires 138. #396 uses the explicit server-owned size value and documents this discrepancy.
- The 7j name regular expression also matches steak/chocolate and existing tile posts with deliberately post-linked rather than item-linked intake. Remaining rows are not automatically missing caffeine.
- The log API truncates a seven-day request to its first daily interval. Daily windows are being queried separately; HTTP 429 results are retried sequentially rather than treated as zero traffic.

## Production evidence

| UTC | Deployment/check | Result |
| --- | --- | --- |
| 08:45:25 | Before #388, Coffee tile, designated test account 1 | HTTP 502, body The drink could not be saved; request {tile:1}. |
| 08:49:18 | Migration 0037 function-definition check | true; no migration application needed. |
| 09:00:04 | Main 346dea1b7d51e473b741f6fdd4e1ab1c9c7f5b96 READY, Chromium 390×844 | Feed delete confirmation and nested capture confirmation each visible for 10.5 seconds; Cancel works; no deletion performed. |
| 09:04:28–09:04:50 | Main 252ddf12a06e30f7a283f73a8638c52b1f01916c READY, six tile taps | Water glass250/0, Coffee240/95, Espresso60/126, Tea300/45, Cola330/32, Water bottle500/0 (ml/mg). All HTTP201, top feed placement, values visible. Six DELETE cleanup responses204. |

## Issues

Closed: #382 with the production evidence above. Filed: #389 (deterministic stale-feedback retry loop). All other closures and required issue comments remain pending; #370 explicitly remains open. #383 is the later Coffee duplicate-scope issue and additionally requires actual UI Undo, now under test.

## PR ledger at this observation

| PR | Branch | State | Head |
| --- | --- | --- | --- |
| #384 | run10/backlog | OPEN | `c26be947a3f72cc2056008fc49027db199778f3d` |
| #385 | run10/docs | OPEN | `c54fe33d12da2b89469dfb4f3d757ee458dcc07f` |
| #386 | run10/capture-fast | MERGED | `06b55825db995e269d87a85a6518727d9cf0c3b9` |
| #387 | run10/sheet-host | MERGED | `6529331f81247e779f3a1129852bf1271e2b84de` |
| #388 | run10/coffee-tile | MERGED | `5fb729d0fffde5e0a9cccd58ae2d18634565816b` |
| #390 | run10/details | OPEN | `58b132031192ededd6472446b2844d83542a54c6` |
| #391 | run10/feed-cache | OPEN | `6a2c7054949addb5d5a871ec9cfac9309523678b` |
| #392 | run10/thumbs | OPEN | `f72161721a6671d2d72083ac25b9f9e377a628da` |
| #393 | run10/regions | OPEN | `f9a015d0d9bb32184b018847c5b80882672cd20f` |
| #394 | run10/matcher | OPEN | `aee4d21b571449d4250b6d859384ecc1ceb7df32` |
| #395 | run10/fix-371 | OPEN | `c9005443eee99cfa9ce8b881601e26ecf821da23` |
| #396 | run10/tile-sizes | OPEN | `ef7a68db3e0f2a464559a4c1b0c4e1767b3026b5` |
| #397 | run10/last-feed | OPEN | `07c8704fb0ffad27a26a7cea7c36e2ca5a16058b` |
| #398 | run10/leftovers-label | OPEN | `6f06a2e8a521b8c1dc59d0713440395a50619327` |
| #399 | run10/undo-removal | OPEN | `f461c6784ee7d2f87f87f57b66470620cd11f6ee` |
| #400 | run10/days-intake | OPEN | `663475ace1f92d2b603310878d0185b06a305378` |
| #401 | run10/drink-backfill | OPEN | `f558a69f7b3fbc43afc7f106e6580431b03f3ff7` |
