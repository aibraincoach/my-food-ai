# Fleet 10 execution report — reconciled handoff

Reconciled 2026-11-03 after the 14:37 UTC handoff. This report separates completed implementation from incomplete acceptance. The full supplied scope remains [the plan](plan-run10.md). Physical-phone acceptance and owner-only settings remain with RT.

Latest user scope clarification: **#413 and Round6 belong to the next design fleet and are excluded. Only phone differences from #353–#367 remain in Fleet10; superseded desktop-frame differences are skipped.** Desktop changes already merged before this clarification are recorded for handoff and will not be expanded or rolled back as part of this run.

## Items 0–8

| Item | Current evidence |
| --- | --- |
| 0 | Supplied plan copied byte-for-byte to docs/plan-run10.md; PR #385 remains open. Seventeen code worktrees and the docs worktree were created at the start. The original checkout's untracked review artifact was preserved. |
| 1 | #392/#395 merged; disposable HTTP/DB suite24/24. Production stale409→retry204, up/down reload persistence, offline and double-tap single-error checks passed; original fresh baseline204 does not establish original cause. |
| 2 | #390 merged; production feed cards on both designated accounts had exactly one Details link, correct destination, and none in post detail. |
| 3 | #444 exact supplied README template merged after exact-head BLOCKERS:NONE; measured READY789c2b7: DB32/0/0, bareunit153/148/2 (all148names), lint2errors/6warnings. All25relative links resolve; all24private-stringhitslisted, none removed. |
| 4 | #391 merged. Controlled session refresh3photos before/after both0networkbytes; API-image probes did not reproduce header-related refetch; bounded natural old-Home repeat did refetch609838B via legacy signed JPEGs, a different rendering path. Earlier profile150ms/200kBps is custom, not Fast4G. #414 now routes every normal/realtime photo through the small endpoint; natural-scroll production repeat at12:42UTC on READY66f7f8e rotated the actual access token; all3 rendered photos used memory cache with0networkbytes. #436 records corrected methods. |
| 5 | #393 merged; exact READY preview and production function configuration verified iad1. |
| 6 | #386 and follow-up#409 merged. Controlled frozen-frame preview samples after409 were58.5–91.3ms versus222.2–1045.9ms before under customnetwork/CPU4. Final actualFast4G+CPU4 compositor87.21–104.54ms,5/5<=300; realbarcodeFound1154.7ms. Final9postsready/clean0; barcodePost-close1136.6msoutlierretained. #370closed; no physical-camera claim. |
| 7 | Investigation evidence is preserved in run10-investigations.md and the final evidence folders. Remaining measurements are listed below. |
| 8 | #333 merged first at reviewed headb9068d081dea94075734ae5570c9129b53bfb1c5. Code PRs through #448 are merged, including phone label normalization #446. Only documentation PRs #344/#384/#385 remain open. Acceptance limits and cleanup are recorded below. |

## Additional implementation lanes

| Item | Current evidence |
| --- | --- |
| 9 | Coffee #388 merged; production six-tile check passed. |
| 10 | #400 merged; disposable-local owner-isolation test passed. Production stronger standalone intake-onlyOct19 showsdrank/enabled, andWater-postOct22 story250ml; cleanup0; #175closed. |
| 11 | #397 and#437 merged. The latter fixes measured cached-startup delay and blank transition: local installed Slow4G cached1721/1716/1700ms→fresh2302/2290/2285ms, compositor no gap/jump and privacy checks pass. Production installed repeat passed1880/1860/1770ms cached→fresh2996/2855/2737ms, no-gap/privacy; #304closed. |
| 12 | #394 merged; #424 follow-up real matcher/reference integrity+identify components merged. Real report trials and costUS$0.62730425 documented; exact two production caption meals passed12:51–12:53UTC, both2components each with actual USDA source refs, cleanup0; #272closed. |
| 13 | #401 backfill executed; 25 matching item gaps became 10. Every remaining post is explicitly reported; broad name query includes non-drinks and existing atomic tiles. |
| 14 | #419 combined photographed drinks merged after disposable runtime proof; production migration0040 applied11:15:58UTC with PT409 conflicts verified. Actual production water/cola composer+201/storedintake passed12:58–12:59UTC with cachedreadingreuse and cleanup0; hydrated DRANK150/330ml output verified; screenshots overshot the second slide, so visible selected drink-card acceptance remains unproven (evidence/run10-drink-photo-final/README.md). |
| 15 | #402 merged; production0038applied10:47:59UTC, owner/privilege readback passed. LocalDBtest1/1 and combinedintegration checks passed; productionReplace attachesnewbeforeoldDELETE; Unmark retainsphoto andrealreanalysis100g eaten; cleanup0; #349closed. |
| 16 | #399 delays destructive requests for six seconds and flushes once on pagehide; timer/undo/pagehide regression passes. Production photoUndo418ms/correctionUndo154ms, wait>6s zero destructiveHTTP, rowsunchanged, cleanup0; #350closed. |
| 17 | #396 implements allowed sizes, hold, usage order and usual size; local HTTP/gesture acceptance passed. |
| 18 | #398 changes leftovers labels throughout; wording tests 2/2, lint zero errors after fixing an existing indicator effect. Production source inventory confirms the requested wording; #446 fixes duplicate prefixes. Physical-phone acceptance remains outstanding. |
| 19 | Actual new-upload observation captured no food names before totals. Gap #449 remains open with #307; the upload-card reader omits pending_items. No successful streaming claim. |
| 20 | All15 visual issues have individual PRs. Merged code#404–#418 including issue-specific docs #430–#432 merged; source/reference evidence and report table retained. Report discoveries also produced#422PNG,#424matcher,#425hints,#428Auth,#429dayreads. #433 durable food/barcode/label posting merged, migration0043 applied12:25:54UTC; copy recovery#438 merged with0044applied12:47:03UTC; #443drink recovery merged with0045applied13:17:08UTC. Final controlledcopyproofs and9realpostingtrials passed, cleanup0. #435 phone font correction merged. #437 PWA reconciliation merged; NeedsInputStrip#439 merged and guarded production repeat confirms actual matched3-photo497591→63720B. Phone CorrectProduct contrast#440/#441 fixed andactualproductionforeground verified; duplicate-prefix fix #446 merged. Parenthesized drink volume fix #448 merged. |
| 21 | #387 merged. Feed and nested capture delete confirmation survived 10.5 seconds each in preview and production; Cancel worked. #382 closed. |

## Premises corrected or unproven

- P1: Three fresh production thumbs requests returned 204, including the oldest of the initial twenty cards. Stale-card causation was not reproduced by that baseline.
- PostgREST 14 retries SQLSTATE 40001 indefinitely: actual disposable HTTP reproduced it, and Supabase's official knowledge base confirms it. Additional #389 records the defect; #395 changes this deterministic conflict to PT409 with a rollback. Migration0039was applied09:38UTC and verified PT409 before#395merged.
- The prescribed capture state update does not guarantee a paint before synchronous barcode work; a double animation-frame boundary was needed. Encoding completion is not first-paint timing; the final actual compositor measurements separately prove5/5first-photo paints below300ms.
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

## Historical PR review ledger, with final merge states

Reviewed-head values record earlier review observations, not review approval for the latest docs head. #385 remains open; pushed evidence at takeover was 9ede089.

| PR | Branch | State | Reviewed head | Merge commit |
| --- | --- | --- | --- | --- |
| #384 | run10/backlog | OPEN | `c26be947a3f72cc2056008fc49027db199778f3d` | — |
| #385 | run10/docs | OPEN | `cfa2862c0d030d117c059ba6d9e736e20551483f` | — |
| #386 | run10/capture-fast | MERGED | `06b55825db995e269d87a85a6518727d9cf0c3b9` | `707ea3eba630106e8f475331b0b78f0716a953a4` |
| #387 | run10/sheet-host | MERGED | `6529331f81247e779f3a1129852bf1271e2b84de` | `346dea1b7d51e473b741f6fdd4e1ab1c9c7f5b96` |
| #388 | run10/coffee-tile | MERGED | `5fb729d0fffde5e0a9cccd58ae2d18634565816b` | `252ddf12a06e30f7a283f73a8638c52b1f01916c` |
| #390 | run10/details | MERGED | `58b132031192ededd6472446b2844d83542a54c6` | `bf6d7f6dd3659c54ba6a59ec2189bfe132c5d1ec` |
| #391 | run10/feed-cache | MERGED | `64e8a59827bf1f1c0557f49e138ac1761541a3ad` | `93eb8eaa258776deb602ce9c02e836f956f8ce75` |
| #392 | run10/thumbs | MERGED | `6a017d3d35888c798ce981b6d339ac00de242f87` | `abcbab96e86c0c3dc81b2c230ada9943e0e733c6` |
| #393 | run10/regions | MERGED | `2c297288e69e290466fd953224b0f5ba27f43394` | `bbd13fdd4083c480e14890e572f6fed10b8c688d` |
| #394 | run10/matcher | MERGED | `b7b2b118b0176cdf09f9cabad3d59c3005c55f8a` | `70384bcd056ba642cc0a3461f1216e022cfe35dc` |
| #395 | run10/fix-371 | MERGED | `771ccd2b6a6ff72d014118f161b21002ca773c91` | `932fd1670a4baf1072d8ae9365c41595bb67e554` |
| #396 | run10/tile-sizes | MERGED | `fdc3aeeac7db58f8862594c2b184e09e9c423bcc` | `ff16a21a6e55e46db005d70377fbae90a633bd20` |
| #397 | run10/last-feed | MERGED | `85fba33b96f00c9abb029af9a8b1a6400255bf07` | `b2ed345e1c1005c1f3befe86fbeea3f1964b4148` |
| #398 | run10/leftovers-label | MERGED | `7e245e30080b2f366f8cddb6666ce2728e50d9e1` | `424bf0e5260be9527b66118571b441fb6f994bfd` |
| #399 | run10/undo-removal | MERGED | `b363e709e333a452710c9970c0fd814996268a0b` | `dfa427d3cd802595b47d0ae0f149dd97dbaf31b7` |
| #400 | run10/days-intake | MERGED | `5d43b478d806a99da9d5122629492b7606b6360f` | `02f3077b449de42b463f5c743409a0e65103080b` |
| #401 | run10/drink-backfill | MERGED | `3e1939e0651204fc277da493dbf865c2e0991e59` | `08f3ac9bd88ac96cf8a66a4a61e3d04188ffb83f` |
| #402 | run10/unmark-replace | MERGED | `9797689c6c1aa242bff3a3a6fc8fa6ac823bf0c4` | `93932418077ba520f0ea5d90a12d66f64595ac1a` |
| #403 | run10/fix-366 | MERGED | `985ec8cf50ea10ed466e41ba82fbae5aed88285e` | `e4aceded045846e42367ac58d06a8bcb1d8bdca0` |
| #404 | run10/fix-363 | MERGED | `5a06d50e53ae0ad07bf5edbffc6b99aaca8e86a1` | `ade526909b68ab6ca370e3070ba93437187b87e5` |
| #405 | run10/fix-364 | MERGED | `418a9b98df3df6c91603ebdb84e3450cd79036ac` | `d0948cd0da5cc835a06185fb834881728067c828` |
| #406 | run10/fix-365 | MERGED | `c08579a3d0559ac8c41cbe3874b5667cd08a5bce` | `ad8bf79411da361b33e00a0c41e0f747a74da117` |
| #408 | run10/fix-367 | MERGED | `2a7547d4e5a7cace5494233c4d7d3aac6b8d53d8` | `adf3d71b8a47c66c8fdeafd133cc40a7d7eebf3f` |
| #409 | run10/fix-370 | MERGED | `d22f9db4cfe0dcae055fdad2e7f9bbb05c3ec39c` | `6f6fe5f424558a228224878187485e37e644d045` |
| #410 | run10/fix-356 | MERGED | `25aee7f8988f2728df01d068bb2654ce5f046c27` | `ef2fc6e0d3ba2eb20cdb7a939604c4347f5d1253` |
| #411 | run10/fix-361 | MERGED | `c27f28a109eedc0b3b34f3c3bb1211c117b8a3c9` | `36209c93b878ddb67fc17a8b50dc5a4eb59ea3f8` |
| #412 | run10/fix-355 | MERGED | `baff25afd5f67a88fd8559f05f5f93da052d2a6f` | `2588ec8e8cd09dac5375113c65d8d2f2163352b2` |
| #414 | run10/fix-372 | MERGED | `2609e1414ec0cf818fbce2159800d681e1093718` | `aea12dd0f2224742c4ad974d2f1b03d74df43aca` |
| #415 | run10/fix-360 | MERGED | `91f05180c9d8b0e930c9e965171c120ac6bda01b` | `ca0dcd9d5148b456fd867902422f20cd425b57fd` |
| #416 | run10/fix-359 | MERGED | `d4099c1622115ed2d586a6b0b51eea738a50a2a0` | `f8618a337e5ebebd24cc9c6e5cf577a5683c87f0` |
| #417 | run10/fix-357 | MERGED | `4c27b2ed750ed0e410483c5b6995172b078aa8e1` | `42879be593b748d32f232b8c723a966cebb6008b` |
| #418 | run10/fix-362 | MERGED | `f76bc4c4c17bfc80b8a6adb15e134387665ea865` | `e07423537d1bc0f54f1997845e86f014c885ef93` |
| #419 | run10/composer-drink | MERGED | `4fd7ea0770def9bdfc81b834b703b546a7450d5d` | `8bc5f58ebd7bd73682f25acd003002190579d1f5` |
| #422 | run10/fix-283 | MERGED | `ab9961ce72a27d44140d44e13c6cf23ddc3f005d` | `e664804ee5329d1e6030e49e36cd92f0185204df` |
| #424 | run10/fix-272 | MERGED | `2a7016aaf10a751487a59bb9e92728f7776a65ba` | `20852c4799f4e3e66aef3ee3ff00e73884026291` |
| #425 | run10/fix-23 | MERGED | `6730725e12d8d87819f3b37e8fb08223ad014973` | `06304b603cb8b5388fa1faaf9752d96139248919` |
| #428 | run10/fix-323 | MERGED | `fedd11ca406c0e0e44fadfc6c4a3688d70b02ae5` | `82ec6963b80e6f900904c3b12b515c7ce382ecff` |
| #429 | run10/fix-324 | MERGED | `2cba097c166acef9d29c77ab3ea2458c95363103` | `76da35e8ed4feb394811824311a17c27b31bb3ed` |
| #430 | run10/fix-358 | MERGED | `f8f8079b9c78c1f97d180ad6c65cad46245b3c33` | `2d1a64cb9cd8ff1cffc53d6f46b1e6021ab564b3` |
| #431 | run10/fix-354 | MERGED | `7b5866de83ed301db720653ef78295bedd45f4a7` | `28ee80a647108e07a44d2b1add260cdebbca7e7d` |
| #432 | run10/fix-353 | MERGED | `620930528aa3a5cb3bf6ba1cff302df90997cd6c` | `ab3aff3b3127c509bbd3785b18a78db0a7b020de` |
| #433 | run10/fix-306 | MERGED | `2e9acb405d0b8182be64135a87dfae6892945892` | `44447da730faf62cc34283fc894f2886fe516cfe` |
| #435 | run10/fix-359-typography | MERGED | `4f0116c24c79e0f427f8b630863df7f221f34efe` | `f8b0324cd8e18c0a18109e22930eb622ec634f7e` |
| #436 | run10/media-evidence | MERGED | `903ad66c01815623b08cfa34be97ebf7d169da50` | `afbb18efe317d6a0981b45a160dc9dc015642bbe` |
| #437 | run10/fix-304 | MERGED | `f5e81ea36ec1b92d793943a6d8588033c1479fa2` | `66f7f8e9470cd40e54e6fa87b2dd2446987792b1` |
| #438 | run10/fix-306-copy | MERGED | `bcfc3d5e0cd5691ea33098f64b198d785deb7aea` | `9c431d270330888259084c36692c4fa3cf0c5689` |
| #439 | run10/fix-372 | MERGED | `24be9c3b530e2975702afc3bfa40ad96103d4564` | `6f857ac4bb8e906cf6b24f0ab3227158236e69ef` |
| #441 | run10/fix-367-contrast | MERGED | `86716f942b700de0c6b2d5fc511b54a4368cad99` | `5681c3ec44fdd79d0c70eaa76635ff0e083e55e5` |
| #442 | run10/media-natural-evidence | MERGED | `9d88e9ab6b8502413dfda6f408c929586c6d5383` | `effea0c43b369c43082439d5be5b6d8154526ec6` |
| #443 | run10/fix-306-drinks | MERGED | `57d016ab4b89b01967007ecf3fe491e5c0221503` | `789c2b7db3ac5a75f7c2b7271419a8a3176c9702` |
| #444 | run10/readme | MERGED | `e8ad173eed4eebca7df32b6df4ec3d5bddb1e722` | `b65ccb9fc1240e72f11cafff8d24d8a960f75c23` |
| #446 | run10/fix-294-leftovers-label | MERGED | `f401dbf4a1d17ac30e86d605cede8dbee3aef9ea` | `7de510781af7b75ab50610f0a43eeee6e80d7da4` |
| #448 | run10/fix-348-volume | MERGED | `81d70c321a0c5b3ae6f6f187fd7f9c5ae6975aaa` | `3ce84730a33f6e5ce8163c80e454eb63b7d9998a` |

Production closure update12:45UTC: #376 closed after actual token rotation and three natural photos each memorycache0bytes. Evidence and method correction merged in#436.

Evidence update12:51UTC: final7h ten natural production opens on stable6f857ac passed10/10, firstcard443.2–894.6ms median754.55,1browserAuth/0directdayreads each. Five natural feed photos total116762B; strip photos separately63720B (497591B before). Worker wire bytes are separately retained. No initial-photo latency claim because initialcard is text-only. Tickpair firstobserved47safterREADY0.178652/0.297646s is not cold-instance evidence. #368/#374/#373/#375/#372 received report-answer comments; #304/#376 are closed with production evidence.

12:56UTC: coder #281 check passed actual MuseSparkOpen/Baseten trace and full visible detail line; switch returnedoff, fixture removed, prefs restored, zero cleanup issues. Owner acceptance remains open. Two prior overly strict exact-text driver checks are disclosed in the committed evidence.


## Final acceptance limits

Production recorded READY at `3ce84730a33f6e5ce8163c80e454eb63b7d9998a`; this reconciliation performs no deployment. #413, Revision 6 and superseded desktop-frame work remain excluded.

- Tap audit: [144 records, 131 traced gestures](evidence/run10-taps-final/README.md). 111 gestures have a captured changed control region after release; 20 remain unknown. Observed frame bounds: median 47.537ms, p95 816.108ms, maximum 1267.521ms. Five changes during contact do not prove pressed styling. Per-control pressed-state and jump/flicker inspection remains incomplete; no blanket smoothness pass.
- Confirmed-photo Post: not measured in the final audit. Actual identify returned 429, “You have made a lot of requests this hour. Try again later.” The proposed 15:00 UTC / 22:00 WIB retry was cancelled. No quota override, synthetic success or retry is claimed.
- Food names before totals: failed observation on a genuine new upload; #449 records the transport gap related to #307. Existing-card/reload evidence does not satisfy new-upload acceptance.
- Photo-top: two completed emulated openings observed first photos at 777.7ms and 916.8ms. The third run recorded a preliminary 911.1ms, then failed when its browser was closed; exclude it from completed trials. The earlier copy-only setup had no photo and cannot support photo timing. Qualified photo-tap measurement was cancelled. Physical-phone acceptance remains with the owner and does not block report/cleanup.
- README #444 remains merged: DB 32 passed; unit 153 passed / 148 failed / 2 skipped; lint 2 errors / 6 warnings. These are reported failures, not a green suite.

## Cleanup reconciliation

The predecessor removed 30 completed worktrees and 28 merged remote branches, stopped local test servers, and cleaned owned test fixtures. This session preserves the untracked `docs/reviews/mfa-pplx-pr311-e7ece5c.md`, retains open docs branches/PRs #344/#384/#385, and records final cleanup output in `docs/evidence/run10-cleanup/cleanup.txt`. The docs worktree is removed only after its commits are pushed and their remote SHA is checked. Raw signed-URL traces remain private in ignored uploads.
