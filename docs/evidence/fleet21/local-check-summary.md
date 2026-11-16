# Fleet 21 local checks before merge

These checks used the unmodified main application source against the disposable stack, after every branch test run and page look. They do not certify production completion. No screenshot was saved; Firefox was not slowed.

| Check | Item | Observed result |
| --- | --- | --- |
| K1 | #700 | Invalid holder: 409. Missing holder: 400. The lease test passes. |
| K2 | #701 | Zero /api/today requests during 15 seconds at desktop width. |
| K3 | #703 | Offline opening did not produce the prescribed failure message, so the retry sequence was not verified. Back online, Days opened. |
| K4 | #704 | F1 had a sharp-photo cache key. After injecting /missing.jpg and reloading, its photo displayed through a different URL; the cache entry still held /missing.jpg with the future expiry. |
| K5 | #709 | A failed added-photo chip disappeared when F6 was deleted and stayed absent after reload. The disposable row is soft-deleted. |
| K6 | #454, #512 | Initial scrollY 47, document height 891, viewport height 844. Today occupied y=604..648, above the tab bar at y=762. September, October and November were already loaded. Only 47 px upward scrolling remained; no month boundary crossed the sticky line, so header changes and an older-month insertion were not verified. |
| K7 | #569 | Thirty circles initially, sixty after the first end-scroll and five-second wait, seventy-six after continuing to the end. The final circle was wholly visible. |
| K8 | #351 | Six tiles: Water/glass, Coffee/cup, Espresso/double, Tea/mug, Coca-Cola/can, Water/bottle. A 700 ms touch hold on Water/glass opened 250, 500 and 750 ml sizes. The background Post a meal toggle is excluded from the tile count. |
| K9 | #554, #658 | First DOM change measured 0 ms at Firefox's clock resolution; full detail appeared after 915 ms. Two taps 100 ms apart on another meal neither opened detail nor left a preview. Not slowed. |
| K10 | #615 | Beer command exit 1: The beer post never settled with a question. No batch completed; caption/photo disagreement behavior was not established. |
| K11 | #705, #707 | The existing label-merge test and online/explicit-retry photo-lost test both pass in the main-code validation run. |
| K12 | #708 | The first Post action created no Fixture lost photo row within 60 seconds. A dialog-scoped retry failed to find the Post control. No fixture was established, so deleting drafts, retaking, the intents count and chip disappearance were not verified. |
| K13 | #599 | With today_summary renamed, the first inspection and five-second inspection showed Today's totals couldn't load. Try again. The function was restored in finally, and Try again loaded the two remaining ready photo meals. Literal first paint was not measured; their kcal values remain unavailable. The function's restored existence was read back. |
| K14 | #598 | Before build: local-1794758971410. First and second normal reloads: local-1794762748232. No waiting worker. Controller was /sw.js; caches were mfa-media-control-v1, my-food-ai-shell-v4 and mfa-media-v2. The build-change criterion passed on the first reload. BiDi could not distinguish shell-cache response provenance from HTTP-cache delivery; no stronger claim is made. |
| K15 | #571 | First card was uploading when the second opened. Both meals reached ready with one Post press each, without The meal could not be saved. Sixteen temporary detail-prefetch 404 responses, with shortened ids and times, are retained in the raw receipt. Not slowed. |
| K16 | #323 | Ten-second auth-container windows: Home 115 /user requests; Days 10; Profile 18. The one-call line was not met. |
| K17 | #710 | PR 14 database suite: 49 pass, 0 fail, 0 skipped. today_summary null semantics test passes and covers its three SQL cases. |
| K18 | #592 | F1's second slide in the desktop Home modal: minimum arrow/text gap 119.47 px at 1100; 122.20 px at 1280 and 1440; zero overlaps. At 390, settled F1 detail has no visible slide arrows. All text-node rectangles are retained. This is the canned cola presentation, not a general claim about every nutrition-card layout. |

The transcribe-cap premise was also checked against migration 0046 and the disposable database function: 60 requests per user in a fixed clock-hour bucket. The access test's requests passed the cap and stopped before a model call.

No test suite was rerun after seeding. K14 rebuilt main without changing product source. The original 75 seeded rows and F1..F6 were made once; the temporary count statuses were restored, F6 was deleted by K5, the two table fixtures were removed, and the two overlap fixtures remain only in the disposable stack until teardown.

Production reads R1..R4 and production Done when checks have not run. No merge or production migration has occurred. The original posting browser's draft remains inaccessible. Search for the authorized Fleet 17 post-close 2 test meal returned No meals found; no different meal was deleted.
