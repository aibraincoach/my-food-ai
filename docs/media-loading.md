# Media-loading measurement

## Current implementation scope — November 4, 2026

Earlier sections retain their measured versions. Current main uses small authenticated feed-photo URLs, cached feed data and server first-page reuse (#528); cached-card expiry fallback is merged (#529). Detail reuses media/item reads and displays a preview before the full original (#541); the complete image and aligned masks use contain geometry (#556). Feed crops remain square. None of this is a new two-second physical-phone receipt or a billed-egress attribution. #222/#372/#379 still need owner mobile-data evidence; [Fleet 13](run13-report.md) records local checks and their limits.

Read-only investigation on 2026-10-31 used the first configured test account's licensed evaluation image. No post, upload, job retry or analysis was created. Credentials and signed URLs stayed in memory.

The existing feed requests the `.feed.jpg` derivative rather than the original. For the sampled derivative, two independently signed URLs 1.1 seconds apart differed even though both returned the same 152,193 bytes with HTTP 200. Signing took 151 ms and 54 ms; the subsequent image requests took 331 ms and 94 ms from this server. The GET responses did not include a Cache-Control header. These are server observations, not phone or mobile-data timings.

That URL churn prevents a consistent browser cache key across refreshes. A bounded in-process cache now retains each successful owner/path read capability for five minutes, inside its one-hour storage signature lifetime. Calls first read the owned media/post through the session's RLS queries; cache keys include the actual owner and immutable object path. A mismatched owner path is rejected, failures are not cached, and concurrent requests share signing work. A correction's new immutable path has its own entry. The original image and detail-resolution path are unchanged.

A read-only run of the changed service on the same derivative took 234.86 ms to sign initially and 0.03 ms for the repeated read, returning the same URL. This demonstrates the removed signing request and stable key inside a warm instance; it does not prove an improvement across separate cold serverless instances or the complete feed.

A separate native Chrome probe at 390x844, emulating 1.6 Mbit/s downstream, 0.75 Mbit/s upstream and 150 ms latency, was inconclusive: its browser navigation reached sign-in despite the helper session working in a direct authenticated HTTP read. No decoded-image or first-picture result is claimed from that probe. Its request interceptor blocked job ticks and non-read requests.

Still required before closing #222: a successful authenticated cold/warm page measurement, before/after decoded first-image time and transferred bytes under the same network profile, and the first feed photo within two seconds on a real phone over mobile data. Real-device acceptance remains unproven.

Stored nutrition PNGs now retain the time zone recorded when the post was captured or logged. Worker completion, corrections and remainder processing reuse that zone, so a meal logged near UTC midnight includes the same local-day hydration as its live card at logging. Legacy posts without a recorded zone use an explicit UTC fallback. A PNG is a static capture-zone snapshot: if the viewer later travels to another zone, live cards use that device's local day while the existing PNG retains the original day context. Stored card images continue to omit clocks.

## Run 7 — bounded batched feed reads

The read-only baseline on November 3 used the larger designated test account (146 posts), a Node Supabase client calling getUser then the unchanged main getFeed (20 posts), and 100 authenticated production Home GETs. No post, correction or model request was created. The prior browser failures did not reproduce: 100/100 service reads completed and 100/100 Home requests returned 200 without a digest. This does not establish that the old browser feed promises always settle; cause not isolated. The reported earlier 3 server digests and 15 browser no-feed results are retained as separate evidence.

### Before: main 2624204

| Request family | Count over 100 opens | p50 ms | p95 ms | Max ms | HTTP failures |
| --- | ---: | ---: | ---: | ---: | --- |
| user | 100 | 50.9 | 104.8 | 820.3 | none |
| posts | 300 | 65.2 | 409.9 | 580.8 | none |
| rpc/feedback_revision | 4000 | 87.8 | 188.3 | 3818.5 | none |
| post_media | 2000 | 62.6 | 148.9 | 3213.9 | none |
| object/sign | 80 | 471.3 | 601.6 | 813.9 | none |
| current_post_items | 2300 | 63.5 | 135.0 | 2569.2 | none |
| item_nutrition | 2300 | 75.4 | 149.5 | 2667.6 | none |
| saved_meals | 2000 | 57.2 | 112.2 | 270.0 | none |
| intake_logs | 200 | 54.4 | 81.0 | 144.3 | none |

Service time: median 1964.4 ms, p95 4170.9 ms, max 6723.9 ms. First failing run: none. The one in-process media URL cache retained signed URLs after the initial 80 signing reads; this is a warm server-client observation, not browser cache proof.

### Implementation and remaining preview evidence

The plan gives conflicting read recipes (embedded versus separate batches, and one versus paired feedback revision reads). The implementation uses one core post page, one media batch, one current-items batch with embedded nutrition, one saved-meal batch, one batch URL signing call and paired per-ready-post revision fences. This preserves feedback consistency around nutrition reads while removing per-post media, item and saved reads. Hydration timelines share reads across the requested days. Day totals group only contiguous requested dates, and card events refresh only touched dates. Each optional family has an eight-second timeout; first-page HTTP fetch has a fifteen-second deadline. A failed optional field does not hide the entire page or manufacture nutrition. The initial page contains six posts; later pages retain twenty.

A1 includes the exact hook/cache/Carousel files from A2 source commit f23efc554c3f17b229a9f502eafc23f9f5833f2e so its independent preview can compile. Both branches still start from main; identical dependency files merge without introducing a second implementation.

### Final preview browser evidence — runtime e2c74b1

On November 3 (approximately 02:10 UTC / 09:10 WIB), native Chrome CDP opened the authenticated Vercel preview at 390×844 with 1.6 Mbit/s downstream, 0.75 Mbit/s upstream and 150 ms latency. The cold navigation cleared HTTP, local-storage and service-worker caches; HTTP caching remained enabled so the second navigation used actual browser cache state. Both navigations waited another twelve seconds after the first decoded photo to allow hydration and cache persistence. The interceptor blocked every non-GET/HEAD/OPTIONS request and `/api/jobs/tick`, including requests in attached worker targets. This intentionally blocks client storage-signature POSTs; the server-provided photo still decoded. No post, correction, retry or model call was created.

| Navigation | First visible card ms | First decoded photo ms | Bytes through hydration settle | Saved first-page cache |
| --- | ---: | ---: | ---: | --- |
| Cold | 1994.2 | 5610.2 | 1355474 | 6 posts / 33518 bytes |
| Warm second visit | 6116.3 | 6150.0 | 503617 | Same persisted 6-post cache; cached fallback visible |

Both displayed six cards without horizontal overflow; the first photo had high fetch priority. The warm visit consumed the actual saved feed cache, but neither warm card nor either decoded photo met two seconds. The cold visible card narrowly met two seconds. These are single observations under browser emulation, not percentile or physical-phone acceptance. The earlier short-window probe (cold card 1540.9 ms/photo 5728.7 ms, warm card/photo 4789.6 ms) ended before feed-cache persistence and cannot establish cached first-page acceptance. Its byte windows also excluded the twelve-second settle and must not be compared directly with the table.

Physical-phone first-photo acceptance over mobile data remains unproven. The slow warm cache presentation and photo decode results remain failed performance gates; no runtime optimization is claimed from this measurement.


### Final 100 authenticated HTTP opens

The exact e2c74b1 preview completed 100/100 six-post Feed API reads and 100/100 Home HTTP 200 responses without a server digest or first failure, using the designated 146-post account. API duration includes the probe's authenticated getUser read before the API call. API p50/p95/max: 1112.5/4260.5/8545.3 ms. Home p50/p95/max: 744.4/1834.5/8636.1 ms. These sequential HTTP reads establish this preview's response reliability; they are not 100 browser opens or proof that the original production failure's cause was isolated.

Batching and bounded reads reduce request fan-out and make optional-family failures settle independently. The original production no-feed/digest cause remains unisolated. Earlier local 96/100 results remain failed historical attempts. The final runtime passed 25 focused regression cases, TypeScript checking and the production build. No production deployment, merge, schema change or environment change was performed.

The warm preview's cached scripts began at 5927 ms and finished at 5988 ms with zero transferred script bytes; the cached card appeared at 6116 ms. A subsequent navigation-timing snapshot recorded requestStart 5010.8 ms and responseStart 5897.3 ms, but did not retain its navigation identity, so it cannot prove the cause of the initial delay. Follow-up navigation inspection crossed a document transition and was inconclusive; a bounded follow-up was stopped without a usable result. This does not establish a feed-cache implementation defect or a full-open performance pass.


The cold first-photo preload began at 1215.4 ms and completed at 5609.2 ms (4393.8 ms duration); the decoded observation followed about 1 ms later. CSS completed at 367.8/621.6 ms, while the four font reads completed at 1402.4–3389.1 ms. The photo request duration dominates this cold observation; no significant decode delay is demonstrated. Cross-origin Resource Timing reported zero transferSize for the photo, and individual encoded image bytes were not retained, so zero is not evidence of a zero-byte download. The warm first-image request ran from 6116.6 to 6119.7 ms, with the decoded observation at 6150 ms.


### Local built-app control, same runtime

A separate native Chrome run against the exact local production build at `http://localhost:3116` removed Vercel protection/SSO navigation from the measurement. Under the strict read guard, the visible desktop-card row appeared at 2491.5 ms and its photo decoded at 6205.5 ms cold; the actual cached second visit appeared at 518.4 ms and decoded at 567.2 ms. The cold first photo transferred 142775 encoded bytes; the warm photo was served by the service worker/browser cache with zero encoded network bytes. This observer did not include the earlier server first-photo seed, so its cold card timing is not the earliest content timing.

A subsequent control included the first server seed, required a changed document `performance.timeOrigin` before sampling, and allowed only two verified read-only POST operations: the exact `getHintState` action (Auth plus profile SELECT), and `/storage/v1/object/sign/media` URL signing. All other POSTs and `/api/jobs/tick` remained blocked. Cold first visible seed/card: 880.6 ms; decoded photo: 3537.5 ms. Warm actual cached second visit: 364.3/406.4 ms. Both persisted the six-post cache. These are distinct single observations with different guard/observer protocols, not interchangeable before/after claims. The local cached second visit passes two seconds, while the cold photo still fails; the protected-preview warm delay did not reproduce locally.

In the latter cold control the high-priority first photo took about 130 ms to first response headers and about 2.55 seconds after headers to completion, transferring 142745 encoded bytes. Three low-priority later photos began only about 124 ms before the first finished. This establishes a small overlap; it does not isolate those photos as the main source of the earlier download delay. Full navigation and sanitized network timestamps were retained for separate diagnosis. The exact temporary preview bypass was revoked with HTTP 200 and verified absent by a subsequent HTTP 200 project read; SSO protection remained enabled.

## Current pass: partial completion

The final candidate adds an authenticated, first-photo-only resize endpoint. Its immutable same-origin URL contains owner, post and media UUIDs; the endpoint validates the signed-in owner and selects the matching photo through RLS before any Storage access. It downloads a bounded JPEG, transforms at most two megapixels with Sharp, limits native work to four requests, and emits a private, no-store WebP of at most 50,000 bytes. An authorized original remains available on resize failure. Other photos keep their existing URLs, and post detail keeps its full-resolution photo. No source image or Storage object is changed. The service worker recognizes only the exact same-origin private route and retains its session epochs, durable logout tombstones and write barriers.

Home can publish an early image Link header after a 350 ms bounded owner-scoped read. The same URL is used by the SSR seed and first feed slide, and that slide no longer needs a signed-URL request. Offscreen photo URLs remain unset until within 100 px of the viewport.

A normal, unmodified 390×844 local production-build test at 1.6 Mbit/s down, 0.75 Mbit/s up and 150 ms latency returned the first image as HTTP 200 image/webp: **21,610 encoded bytes**, rather than roughly 143 KB. Cold first card/photo were **910.2/2096.9 ms**; the actual cached reopen was **620.4/620.4 ms** after verifying cache persistence. **The cold two-second photo gate still fails.** The initial cold Home response did not carry the private-photo Link hint; later responses did. Its initial absence was not isolated. These are single browser observations, not percentiles or a real-phone pass.

Live access checks returned 401 without cookies and 404 for the wrong owner, both private/no-store. Sixty-seven focused regressions, TypeScript, changed-file lint and the production build pass. The private-route logout/new-tab/browser-restart matrix is covered by worker unit tests; the actual-browser matrix was previously run against legacy signed JPEGs and was **not rerun against the new private route** after the owner stopped further optimization. That live case remains unverified. The owner requested closing this pass with partial completion rather than continuing to chase the cold threshold. No more performance tuning is included in this pass.

## Run 8 — first-paint follow-up

### Run 8 before (production `58d127b`)

Five independent cold/warm pairs on November 3 used the second designated test account, whose newest card has a photograph. The larger account's newest card is the caption-only Run 7 Open-model smoke; it is unsuitable for a first-visible-photo comparison without scrolling. The private-photo preload intentionally emits no image hint when the first card has no photo. No existing post was modified for this measurement.

Native Chromium at 390×844, Asia/Jakarta, 1.6 Mbit/s down, 0.75 Mbit/s up and 150 ms latency: each pair starts with a fresh context and cleared HTTP cache, then retains real browser/service-worker cache for the warm navigation. Each navigation waits 12 seconds after the photo before recording the final transfer window. CDP request interception blocks tick and non-read requests except Storage URL signing; the same guard is required for After. No Playwright route interception is used, since that disables browser HTTP caching. These are guarded emulated openings, not unmodified phone acceptance. The observer samples the first visible loaded/renderable image (`complete` and positive `naturalWidth`) on an animation frame, consistently before and after.

| Pair | Cold card ms | Cold photo ms | Warm card ms | Warm photo ms |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1542.7 | 2244.3 | 556.9 | 556.9 |
| 2 | 1070.1 | 2107.0 | 566.2 | 566.3 |
| 3 | 1115.5 | 2138.7 | 503.3 | 503.4 |
| 4 | 1335.2 | 2037.8 | 425.4 | 441.9 |
| 5 | 1114.6 | 2098.8 | 474.1 | 492.1 |

Every document returned HTTP 200 and carried the correct first-photo `Link`. Cold private WebP network responses were 33,457–33,458 bytes; every warm first-photo response used zero encoded network bytes. Thus the earlier missing-Link symptom does **not** reproduce on this current photo-first dataset. Missing Link for the larger account is expected for its caption-only first card; the unexplained historical Run 7 initial absence is not retroactively attributed to that newer post. Private exact-header/network evidence stays in ignored local receipts; published values contain no session or signed capability.

### Implementation and font bytes

Middleware removes every incoming `x-mfa-verified-user` value before Auth, then forwards only Auth's real user ID on the server request. The cookie bridge explicitly rebuilds `NextResponse.next` after setting that ID, retaining refreshed cookies. Pages still create owner-scoped Supabase clients, and fall back to `getUser` if no verified ID exists; API routes retain their own Auth checks. Days' redundant check actually lives in `DaysScreen`, and Search has no second server `getUser` call to replace.

Home's two streams share one request-scoped five-day totals promise. The initial Feed receives that snapshot; subsequent page reads supply validated known dates so `/api/feed` reads only missing totals. This also requires a narrow `getFeed` option and API boundary change: only changing Feed's own refresh function would leave the existing API's duplicate read intact. Nutrition/hydration refreshes and mutation-driven totals updates remain active, and dates from another device time zone are not reused.

| Font | Before bytes | After bytes |
| --- | ---: | ---: |
| Manrope 300 | 31,140 | 13,960 |
| Manrope 400 | 31,228 | 13,928 |
| Manrope 500 | 30,648 | 13,872 |
| Manrope 600 | 31,196 | 13,968 |
| Total | 124,212 | 55,728 |

`scripts/font-codepoints.mjs` scans literal/template/JSX text above U+00FF; its output supplements the specified Latin/punctuation subset. Each resulting font retains all 226 originally available requested codepoints and identical advance widths. FontTools/Brotli installation required `python -m ensurepip --user` first because pip was absent, then `python -m pip install --user fonttools brotli`. The four files were already WOFF2; the backlog's old 390 KB TrueType premise is stale.

### Run 8 after

On the built local app, one authenticated Home document GET returned HTTP 200 with the photo Link. Node undici diagnostics recorded exactly one outbound `/auth/v1/user` request, and the server recorded exactly one `feed read day-totals` line. The identity was absent as a browser response header. An unsigned request carrying a forged identity to Profile redirected to sign-in (307). These are actual built-app HTTP checks, in addition to the spoof/cookie and shared-totals regression tests.

At that pre-deployment checkpoint, preview access and measured acceptance were pending. Subsequent preview and final production results are below; no timing pass is inferred from source changes or unit tests. The final run also completed 100 actual controlled browser openings. Physical-phone mobile-data acceptance remains separate.

## Final Run 8 production acceptance

The final combined production revision is `6996817cec6aaf865357e9fee6550abf27cdfd0f` (#343). After batching the measured day-total fan-out, the same Chromium 1148/profile/read guard passed all five cold and warm pairs. These are emulated browser observations, not physical-phone acceptance.

| Pair | Cold card ms | Cold photo ms | Warm card ms | Warm photo ms |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1573.4 | 1828.3 | 496.3 | 496.3 |
| 2 | 1160.6 | 1590.8 | 493.1 | 493.1 |
| 3 | 1474.8 | 1487.0 | 481.3 | 481.5 |
| 4 | 1391.3 | 1501.7 | 507.0 | 507.0 |
| 5 | 1402.3 | 1480.2 | 490.4 | 490.5 |

All ten documents returned 200 with the image Link. Cold photos transferred one 16,598-byte WebP each; all warm photos transferred zero network bytes. The prior #342 production series is retained as **partial: four of five cold photos passed, first 2,201.0 ms**. The five final passes do not erase that observation. Independent-preview attempts had worker/protection differences, so their warm-cache results are not treated as equivalent to production.

The largest designated test account (147 posts) also passed 100 actual full browser openings: no digest, blank/error feed, sign-in redirect or page exception. A separate 100-run feed-reader/Home HTTP probe passed 100/100 on each boundary. These two reliability streams ran concurrently after the five photo pairs; the photo experiment was separate. Browser visibility was confirmed after DOMContentLoaded plus a one-second settle; it is not substituted for the animation-frame first-photo observer. [Full report](run8-final-report.md), [sanitized observations](evidence/run8-production/receipt.md). Physical-phone mobile-data checks and independent lower-photo competition isolation remain owner acceptance under #222/#305.

## Session refresh (Fleet 10, #376)

Observed 2026-11-03T09:16:01.168Z in Chromium390×844 with a custom network profile (150ms,200kB/s down,93.75kB/s up), rather than the current DevTools Fast4G preset (165ms,1,012,500B/s down,168,750B/s up), designated test account1. Three actual owner-scoped feed photo URLs were rendered in a temporary image probe on Home. Service workers were blocked to isolate browser HTTP cache; this is a photo-cache probe, not the plan’s complete scroll-based page timing. The auth cookie’s expires_at was moved into the past, then Profile and Home navigations let normal SSR refresh it. Both runs confirmed the session cookie changed. No production sign-up or live form probe was sent.

| Run | Photo | After refresh source | Network bytes |
| --- | --- | --- | ---: |
| before | 1 | memory cache | 0 |
| before | 2 | memory cache | 0 |
| before | 3 | memory cache | 0 |
| after | 1 | memory cache | 0 |
| after | 2 | memory cache | 0 |
| after | 3 | memory cache | 0 |

The old-header production run also transferred zero bytes, so this experiment does not reproduce Cookie-induced refetching or establish a measured improvement. The planned header change ships independently of the measurement. The preview after run measured head `721f3daa389f52c81319225a0a2cf391989e9b9a`. The merged-production natural-scroll repeat is recorded below.

### Correct-preset pre-change repeat

At2026-11-03T11:45:54.940Z, reran the three-image HTTP-cache probe against the exact pre-#391 immutable deployment at `bf6d7f6dd3659c54ba6a59ec2189bfe132c5d1ec`, READY. Chromium390×844, actual Fast4G165ms/1,012,500 B/s down/168,750 B/s up; service workers blocked. The deployment-protection bypass was used only for an own-origin bootstrap request, then an origin-scoped cookie; no global header or sign-in form probe. The normal Profile/Home session refresh changed the Auth cookie and rotated the actual access token; comparison was performed privately without logging token values.

| Pre-change photo | Source after refresh | Network bytes |
| --- | --- | ---: |
| 1 | memory cache | 0 |
| 2 | memory cache | 0 |
| 3 | memory cache | 0 |

This confirms the earlier failure-to-reproduce result at the correct requested preset. The images are real owner-scoped media URLs rendered in a temporary image probe; this is not a claim of a natural-scroll measurement. Final production natural-scroll measurements are recorded below. No cache improvement is inferred from these zero-byte pre-change observations.

### Merged production natural-scroll repeat

At 2026-11-03T12:42:09.127Z, Chromium 156 at 390×844 with Fast4G (165ms, 1,012,500 B/s down, 168,750 B/s up) naturally scrolled Home past three distinct post photos. Service workers were blocked to isolate HTTP caching. No temporary image probe or response stub was used. The auth cookie expires_at was moved into the past; normal Profile and Home navigations rotated the actual access token, verified privately. Production remained READY at `66f7f8e9470cd40e54e6fa87b2dd2446987792b1` before and after.

| Natural feed photo | After refresh source | Network bytes |
| --- | --- | ---: |
| 1 | memory cache | 0 |
| 2 | memory cache | 0 |
| 3 | memory cache | 0 |

All three actual rendered photos met #376’s zero-byte condition. This proves the current behavior; the pre-change zero-byte results mean no measured improvement can be attributed to removing Vary: Cookie. This read-only check created no test posts.

### Natural pre-change feed versus current feed

A bounded natural-scroll repeat on the exact pre-#391 deployment `bf6d7f6dd3659c54ba6a59ec2189bfe132c5d1ec` found an important distinction from the API-image probes above: its actual Home photos used legacy signed Storage JPEG URLs. After a verified real access-token rotation and normal Home return, all three natural photos downloaded again. Both deployment guards were READY at that same SHA. Chromium156,390×844,genuine Fast4G; no temporary image probes, interception, model calls or data writes. The deployment-protection bypass was limited to an own-origin cookie bootstrap; no global bypass header.

| Natural pre-change photo | After refresh source | Network bytes |
| --- | --- | ---: |
| 1 | network, HTTP200 | 142754 |
| 2 | network, HTTP200 | 161981 |
| 3 | network, HTTP200 | 305103 |
| Total | | 609838 |

The current natural-scroll check above used the immutable owner-authorized API route and transferred zero bytes for its three photos. These are different rendering paths and photo sets, not an isolated Cookie-header experiment. The pre-change API-image probes also used zero bytes; the natural legacy JPEG refetch instead supports the route-coverage fix in #414. No project-wide billed-egress reduction is inferred. [Exact old-deployment natural receipt and limitations](https://github.com/aibraincoach/my-food-ai/tree/run10/docs/docs/evidence/run10-cache-before-natural).


## Fleet 11 evidence reconciliation (#372)

Fleet 10 fixed the actual feed route in [#414](https://github.com/aibraincoach/my-food-ai/pull/414) and the needs-input strip in [#439](https://github.com/aibraincoach/my-food-ai/pull/439). Their measurements answer different questions.

| Photo | Legacy natural-feed bytes after session refresh | Current natural-feed bytes after session refresh |
| --- | ---: | ---: |
| 1 | 142754 | 0 (memory cache) |
| 2 | 161981 | 0 (memory cache) |
| 3 | 305103 | 0 (memory cache) |
| Total | 609838 | 0 |

The feed rows above use different photo sets and rendering paths. They establish route coverage/cache behavior, not a controlled per-image size reduction. [Before evidence](https://github.com/aibraincoach/my-food-ai/tree/0003f3a16342f43af8574e13b1bfac9fec938bbf/docs/evidence/run10-cache-before-natural), [method and current result](https://github.com/aibraincoach/my-food-ai/blob/9d88e9ab6b8502413dfda6f408c929586c6d5383/docs/media-loading.md).

| Same needs-input strip photo | Signed JPEG bytes before | Small endpoint bytes after |
| --- | ---: | ---: |
| 1 | 133353 | 20656 |
| 2 | 142579 | 21286 |
| 3 | 221659 | 21778 |
| Total | 497591 | 63720 |

The matched strip comparison reduced downloaded bytes by 87.19%. [Per-photo receipt](https://github.com/aibraincoach/my-food-ai/blob/1069cd3aa181919f9171dcb05c98ae1639a6181e/docs/evidence/run10-strip-thumbnails/receipt.json). The phone/mobile-data two-second and visual-equivalence acceptance remains RT's check under #379; #372 remains open for those parts. No billed-egress or log-ingestion-byte reduction is inferred.
