# Fleet 10 execution report — in progress

Observed 2026-11-03, 11:07 UTC. This is an execution ledger, not a completion claim. The full supplied scope remains [the plan](plan-run10.md). Physical-phone acceptance and owner-only settings remain with RT.

## Items 0–8

| Item | Current evidence |
| --- | --- |
| 0 | Supplied plan copied byte-for-byte to docs/plan-run10.md; PR #385 remains open. Seventeen code worktrees and the docs worktree were created at the start. The original checkout's untracked review artifact was preserved. |
| 1 | #392/#395 merged; disposable HTTP/DB suite24/24. Production stale409→retry204, up/down reload persistence, offline and double-tap single-error checks passed; original fresh baseline204 does not establish original cause. |
| 2 | #390 merged; production feed cards on both designated accounts had exactly one Details link, correct destination, and none in post detail. |
| 3 | README replacement and final-main counts/private-string search pending; no invented test counts published. |
| 4 | #391 merged. Controlled session refresh3photos before/after both0networkbytes; original failure not reproduced. Earlier profile150ms/200kBps is custom, not Fast4G. #414 now routes every normal/realtime photo through the small endpoint; final natural-photo repeat pending. |
| 5 | #393 merged; exact READY preview and production function configuration verified iad1. |
| 6 | #386 and follow-up#409 merged. Controlled frozen-frame preview samples after409 were58.5–91.3ms versus222.2–1045.9ms before under customnetwork/CPU4. Final actualFast4G shutter/barcode repeat pending; no physical-camera claim. |
| 7 | Investigation evidence below is being collected. Unmeasured sections remain unproven. |
| 8 | #333 merged first at reviewed headb9068d081dea94075734ae5570c9129b53bfb1c5. Ordered implementation merges through#418 completed. Full final acceptance/closures and cleanup remain pending. |

## Additional implementation lanes

| Item | Current evidence |
| --- | --- |
| 9 | Coffee #388 merged; production six-tile check passed. |
| 10 | #400 merged; disposable-local owner-isolation test passed. Final standalone-intake calendar repeat pending. |
| 11 | #397 merged; worker20/20; installed Slow4G3opens1477/1944/1367ms and logout/account isolation passed. Final deployment repeat pending. |
| 12 | #394 merged; #424 follow-up real matcher/reference integrity+identify components ready, unmerged. Real report trials and costUS$0.62730425 documented; final two production meals pending. |
| 13 | #401 backfill executed; 25 matching item gaps became 10. Every remaining post is explicitly reported; broad name query includes non-drinks and existing atomic tiles. |
| 14 | #419 combined photographed drinks, paired photos and frozen preview passed static/build. Disposable-local runtime checks ongoing; deterministic SQL conflicts being changed toPT409 before merge. Migration0040 not applied. |
| 15 | #402 merged; production0038applied10:47:59UTC, owner/privilege readback passed. LocalDBtest1/1 and combinedintegration checks passed; final production flows pending. |
| 16 | #399 delays destructive requests for six seconds and flushes once on pagehide; timer/undo/pagehide regression passes. Production acceptance pending. |
| 17 | #396 implements allowed sizes, hold, usage order and usual size; local HTTP/gesture acceptance passed. |
| 18 | #398 changes leftovers labels throughout; wording tests 2/2, lint zero errors after fixing an existing indicator effect. Production acceptance pending. |
| 19 | Existing pending-food-name feature needs actual production photo observation. |
| 20 | All15 visual issues have individual PRs. Merged code#404–#418 except issue-specific docs#430–#432 pending; source/reference evidence and report table retained. Report discoveries also produced#422PNG,#424matcher,#425hints,#428Auth,#429dayreads. #306durablebarcode/searchposting now being built from measuredmulti-secondclose delays. |
| 21 | #387 merged. Feed and nested capture delete confirmation survived 10.5 seconds each in preview and production; Cancel worked. #382 closed. |

## Premises corrected or unproven

- P1: Three fresh production thumbs requests returned 204, including the oldest of the initial twenty cards. Stale-card causation was not reproduced by that baseline.
- PostgREST 14 retries SQLSTATE 40001 indefinitely: actual disposable HTTP reproduced it, and Supabase's official knowledge base confirms it. Additional #389 records the defect; #395 changes this deterministic conflict to PT409 with a rollback. Migration0039was applied09:38UTC and verified PT409 before#395merged.
- The prescribed capture state update does not guarantee a paint before synchronous barcode work; a double animation-frame boundary was needed. The camera encode itself is outside item 6's addFiles scope and prevents claiming 300 ms acceptance.
- The plan's shell force-static route config fails the actual cacheComponents build. Removing the directive produces a static /shell without changing the intended public shell.
- Rounded proportional Coffee caffeine is 139 mg for 350 ml, whereas the explicit test/Done requires 138. #396 uses the explicit server-owned size value and documents this discrepancy.
- The 7j name regular expression also matches steak/chocolate and existing tile posts with deliberately post-linked rather than item-linked intake. Remaining rows are not automatically missing caffeine.
- The log API truncates a seven-day request to its first daily interval. Seven adjacent daily windows were queried successfully; HTTP429was retried sequentially rather than treated as zero traffic.

## Production evidence

| UTC | Deployment/check | Result |
| --- | --- | --- |
| 08:45:25 | Before #388, Coffee tile, designated test account 1 | HTTP 502, body The drink could not be saved; request {tile:1}. |
| 08:49:18 | Migration 0037 function-definition check | true; no migration application needed. |
| 09:00:04 | Main 346dea1b7d51e473b741f6fdd4e1ab1c9c7f5b96 READY, Chromium 390×844 | Feed delete confirmation and nested capture confirmation each visible for 10.5 seconds; Cancel works; no deletion performed. |
| 09:04:28–09:04:50 | Main 252ddf12a06e30f7a283f73a8638c52b1f01916c READY, six tile taps | Water glass250/0, Coffee240/95, Espresso60/126, Tea300/45, Cola330/32, Water bottle500/0 (ml/mg). All HTTP201, top feed placement, values visible. Six DELETE cleanup responses204. |

## Issues

Evidence closed #382, #381/#383, #107, #316, #228, #325/#378, #371/#215/#389, #65/#66, #305 (already built under Facts), and #377 (all residual IDs/errors listed under the explicit plan condition). Remaining issues stay open until their required final evidence is inspected; the canonical investigation marks pending acceptance explicitly. Additional discoveries include #407 copied-drink jobs, #420 matcher, #421 PNG footer, #423 modes hint, #426 Auth reads and #427 day reads. Their PRs are tracked below.

## PR ledger at this observation

| PR | Branch | State | Head |
| --- | --- | --- | --- |
| #384 | run10/backlog | OPEN | `c26be947a3f72cc2056008fc49027db199778f3d` |
| #385 | run10/docs | OPEN | `c3b941a5a4fecb69fa72d6da40fafd80a4413a16` |
| #386 | run10/capture-fast | MERGED | `06b55825db995e269d87a85a6518727d9cf0c3b9` |
| #387 | run10/sheet-host | MERGED | `6529331f81247e779f3a1129852bf1271e2b84de` |
| #388 | run10/coffee-tile | MERGED | `5fb729d0fffde5e0a9cccd58ae2d18634565816b` |
| #390 | run10/details | MERGED | `58b132031192ededd6472446b2844d83542a54c6` |
| #391 | run10/feed-cache | MERGED | `64e8a59827bf1f1c0557f49e138ac1761541a3ad` |
| #392 | run10/thumbs | MERGED | `6a017d3d35888c798ce981b6d339ac00de242f87` |
| #393 | run10/regions | MERGED | `2c297288e69e290466fd953224b0f5ba27f43394` |
| #394 | run10/matcher | MERGED | `b7b2b118b0176cdf09f9cabad3d59c3005c55f8a` |
| #395 | run10/fix-371 | MERGED | `771ccd2b6a6ff72d014118f161b21002ca773c91` |
| #396 | run10/tile-sizes | MERGED | `fdc3aeeac7db58f8862594c2b184e09e9c423bcc` |
| #397 | run10/last-feed | MERGED | `85fba33b96f00c9abb029af9a8b1a6400255bf07` |
| #398 | run10/leftovers-label | MERGED | `7e245e30080b2f366f8cddb6666ce2728e50d9e1` |
| #399 | run10/undo-removal | MERGED | `b363e709e333a452710c9970c0fd814996268a0b` |
| #400 | run10/days-intake | MERGED | `5d43b478d806a99da9d5122629492b7606b6360f` |
| #401 | run10/drink-backfill | MERGED | `3e1939e0651204fc277da493dbf865c2e0991e59` |
| #402 | run10/unmark-replace | MERGED | `9797689c6c1aa242bff3a3a6fc8fa6ac823bf0c4` |
| #403 | run10/fix-366 | MERGED | `985ec8cf50ea10ed466e41ba82fbae5aed88285e` |
| #404 | run10/fix-363 | MERGED | `5a06d50e53ae0ad07bf5edbffc6b99aaca8e86a1` |
| #405 | run10/fix-364 | MERGED | `418a9b98df3df6c91603ebdb84e3450cd79036ac` |
| #406 | run10/fix-365 | MERGED | `c08579a3d0559ac8c41cbe3874b5667cd08a5bce` |
| #408 | run10/fix-367 | MERGED | `2a7547d4e5a7cace5494233c4d7d3aac6b8d53d8` |
| #409 | run10/fix-370 | MERGED | `d22f9db4cfe0dcae055fdad2e7f9bbb05c3ec39c` |
| #410 | run10/fix-356 | MERGED | `25aee7f8988f2728df01d068bb2654ce5f046c27` |
| #411 | run10/fix-361 | MERGED | `c27f28a109eedc0b3b34f3c3bb1211c117b8a3c9` |
| #412 | run10/fix-355 | MERGED | `baff25afd5f67a88fd8559f05f5f93da052d2a6f` |
| #414 | run10/fix-372 | MERGED | `2609e1414ec0cf818fbce2159800d681e1093718` |
| #415 | run10/fix-360 | MERGED | `91f05180c9d8b0e930c9e965171c120ac6bda01b` |
| #416 | run10/fix-359 | MERGED | `d4099c1622115ed2d586a6b0b51eea738a50a2a0` |
| #417 | run10/fix-357 | MERGED | `4c27b2ed750ed0e410483c5b6995172b078aa8e1` |
| #418 | run10/fix-362 | MERGED | `f76bc4c4c17bfc80b8a6adb15e134387665ea865` |
| #419 | run10/composer-drink | OPEN | `f8d2ba7a4d5517c4aedad7f5f447bd4d53602bf0` |
| #422 | run10/fix-283 | OPEN | `a73aa5ef734fc7db733bd41951d2caa15fa31fb6` |
| #424 | run10/fix-272 | OPEN | `23ffaa2911c6a8f40d00fb26c9611151ff64c878` |
| #425 | run10/fix-23 | OPEN | `a331220535bd03f16af212a11c95db9092832c72` |
| #428 | run10/fix-323 | OPEN | `e1bb47c331437382249ed934e6f8125d917af72a` |
| #429 | run10/fix-324 | OPEN | `fa75d2afc750e48dfd8337cf0afd36c750a2e311` |
| #430 | run10/fix-358 | OPEN | `b2cbc7a72ede1a436574afd786567c4c640be950` |
| #431 | run10/fix-354 | OPEN | `03d18866ebcf588d972784cb6edba1f37df9d549` |
| #432 | run10/fix-353 | OPEN | `e7d353253fdc079effd52a93b60aa3365b593759` |
