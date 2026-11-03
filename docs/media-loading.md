# Media-loading measurement

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
