# Tab-return reads

A hidden-to-visible transition or a persisted pageshow is one return. Focus alone does not reread. Readers share `onTabReturn`; a second distinct return during an in-flight read queues one follow-up. Online, readiness, mutation and Realtime paths remain. The Thread comment/status `again` behavior stays, but its feedback read runs separately on mount and return. ThumbsFeedback subscribes by post id, reads its current revision from a ref, rejects an older response and does not reread just because translations or props rerender.

## Current local count proof

The old Fleet50 figure was14GETs; it was not reproduced or used as today's baseline. The first current-main REST-only observation was10 per post return and5 per Home return. Completing the fixture and instrument exposed card and hydration requests through same-origin APIs. The strict settled test on main fails at10 post-page requests versus the7 target. Early exploratory observations that settled only by a fixed timeout varied; they are not used for a reduction claim.

The committed browser test waits for local fetches to settle, retains fetch and timer-origin stacks, and counts REST plus `/api/feed`, `/api/intake/post`, and RSC requests. With the synthetic three-card fixture (one hydration post, two food posts), head targets are:

| Reader | Post | Home |
|---|---:|---:|
| Thread comments |2 pages, including terminating empty page|0|
| Thread status|1|0|
| Thread feedback|1|0|
| Overlay status and rendered-fact projection|1|0|
| Overlay existing feedback_revision RPC|1|0|
| Feed new-id discovery|0|1|
| Readiness pending seed|0|1|
| Readiness newest-status discovery|0|1|
| Questions|0|1|
| Ready cards|0|1 batched request,3ids|
| Hydration|1|1 batch|
| Food-card feedback|0|2|
| **Browser HTTP total**|**7**|**8**|

Two immediate returns make14 and16 requests respectively, with no page errors. Both single returns have the same target. The Home id discovery and readiness status discovery are intentionally separate: one maintains feed traversal and one notices status changes. These are browser requests, not the number of internal PostgREST reads made by the API/server. There is no claim of a Home net-count reduction from the old partial instrument. An unchanged return makes no RSC refresh; a changed rendered fact does.

Source attribution comes from test-only fetch/timer stacks. Promise-only feedback calls can lose their initiating async frame; their table/select and the mounted food-card inventory identify those rows, with the raw stack retained rather than invented provenance. The probe uses Chromium390x844, scripted visibility changes, an owned loopback stack and synthetic meals. It is not a production or real-phone measurement.

## Overlay change coverage and cost

The same owner-scoped posts select includes status, analysis_initialized_at, fail_reason, caption, eaten_at, post_media(id,not_eaten), and current post_items(id,gtin,not_eaten_calories). A second existing feedback_revision RPC supplies the rendered fingerprint/model-comment identity. The overlay refreshes only if a rendered fact changes. A missing post still leaves the page. Virtual card slides without stored media ids do not enter the media identity comparison.

No current source writer updates box/mask_path in place. `persist.ts` constructs RPC rows; SQL geometry changes insert/supersede items. Existing same-id updates affect superseded_at,source,gtin or not_eaten_calories. Superseding changes current ids in the fingerprint; source is not rendered (nutrition provenance uses source_ref); barcode and leftover calories are included in the projection. Caption, time, photo add/remove, not-eaten flags and hidden nutrition edits are covered by regression cases.

One local owner-authenticated sample, caches unflushed (first query shape is not a cold-database claim): old30.188ms/new15.873ms initially; warm old9.910/new12.919ms. One additional realistic warm pair on5current items,3photos,1not-eaten photo and1barcode: old12.175ms/new14.396ms. The temporary cost post was removed and read back absent. No production or latency-distribution claim.

## Listener inventory

REST/API readers migrated: Thread,Feed (discovery and upload card),RealtimePost,useDrinkCard,NeedsInputStrip,PostReadinessListener,OutlineOverlay, plus the separately pinned feedback behavior. LiveNutritionCard and LocalTime only format local time; ShellHome's clock signals a date change; DiagnosticsRecorder records locally; CaptureSheet's return handler checks camera tracks; ServiceWorkerRegistration checks update safety. Their return listeners remain. The service-worker check can perform update traffic, but does not read meal REST data. FeedConnectionNotice's online/offline listeners remain.

The held #1392 changes Thread comment formatting. Whichever merges second must keep this feedback-read split and the same return subscription, then return the composed delta for review.

## Reproduction

Use a fresh disposable stack and private output directory outside the repository. `tests/fixtures/tab-return-acceptance.mjs setup` creates the synthetic account,3cards and one hydration row; cleanup deletes the account and verifies no posts/account remain. Set TEST_ENV_FILE,TAB_RETURN_DIR (or explicit TAB_RETURN_FIXTURE and TEST_SESSION_FILE),APP_URL,MFA_PLAYWRIGHT_MODULE,TEST_CHROMIUM_EXECUTABLE and TAB_RETURN_OUT. Serve the owned app and run `tests/browser/tab-return-count.mjs`; TAB_RETURN_OBSERVE=1 records a baseline without the head assertions.

`tests/browser/tab-return-behavior.mjs` uses the same fixture and loopback admin key, with ONLY_ENGINE=chromium or webkit. It tests hidden comments/facts, readiness, another-tab discovery, a simulated day boundary and visible discovery failure. The Realtime fixture acknowledges subscriptions only and emits no data: this proves return reconciliation, not Realtime event transport. WebKit runs in its Linux container; real devices remain unproven.

Detailed local receipts, including failed exploratory probes, are under `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/1161-tab-return/`. No production calls or model/provider traffic is part of this packet.
