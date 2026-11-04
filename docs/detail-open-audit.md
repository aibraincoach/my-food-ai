# Detail open: current-production latency audit

Measured 2026-11-04 UTC against current main and production `ca07be7014431d492039dafdda80186a2c697fb7`; [deployment receipt](evidence/run11-detail-audit/production-head.json). The older read-only audit was at `618cf7e8bbadf4e020b9590eeb66e6368591f8db` (#460), before #462 and Fleet11. All source findings below were checked again on current main. **No product fix, deployment, data fixture, or backlog-status closure was made for this audit.**

## Owner report and limits

Owner reports about14 seconds after tapping Details in the installed website on an iPhone using XL Axiata Prioritas5G in Indonesia. The installed app exposes no address bar, so the exact meal URL was unavailable. Owner explicitly requests documentation for a future fleet, not a fix now.

The14-second observation was not reproduced or traced on that device. We cannot honestly allocate its14 seconds to individual causes or attribute the reported500GB egress to this route. Tests below use an existing designated test-account meal, Chromium390×844, and synthetic network settings from OCI. They are not measurements of Indonesian5G, Safari, iOS installed-app behavior, or the owner’s exact meal/account. Service workers were blocked to expose network transfers; installed-PWA caching remains unmeasured.

## Actual production tap measurements

The same existing photo meal was opened by a real touch tap; no new meal/model call was made. Detail content means the actual nutrition control appears, not only URL change. Image complete means the signed original has decoded. Times are from pointerup; request timings are CDP monotonic timestamps. Each row is an observation, not a latency distribution or an instrumented cold-start claim.

| Trial | Conditions | Pressed feedback | Detail shell and nutrition content | Original photo decoded | Additional interval after detail appeared |
|---|---|---:|---:|---:|---:|
| First fresh context | Unthrottled network/CPU |8.9ms |3.440s |3.735s |0.295s |
| Fresh context |150ms latency,200,000B/s down,93,750B/s up,CPU4× |2.1ms |1.324s |2.631s |1.307s |
| New context, warm service |Same synthetic throttle |4.4ms |1.335s |2.261s |0.927s |
| Repeat in same browser context |Same synthetic throttle, HTTP cache retained |4.2ms |0.938s |1.915s |0.977s |
| Focused follow-up |Unthrottled network/CPU |10.0ms |0.931s |1.193s |0.262s |

[Four initial traces](evidence/run11-detail-audit/browser.json), [focused trace](evidence/run11-detail-audit/focused-browser.json), and screenshots in the same directory. The first unthrottled open being slower than throttled later opens is real; warm caches/service/module state differ. It does not show that throttling improves performance. No median/p95 is inferred from five opens.

### Suspect1: no loading screen — confirmed, with a distinction

`src/app/posts/[id]/page.tsx` sets `instant=false`; there is no `posts/[id]/loading.tsx`. `PostDetail.tsx` awaits auth and both data builders before returning the useful detail content. Shared pressed feedback now appears quickly, but is brief contact feedback, not a persistent loading state.

The focused capture still displayed Home at103ms and503ms after the tap, with no “loading/opening meal/post” indicator; Post and nutrition appeared at931ms. The first measured open retained the preceding screen for3.44s before the detail became useful. Thus “nothing appears” must distinguish brief pressed opacity from actual navigation/loading feedback. This finding does not prove the owner’s14-second duration.

### Suspect2: the same meal read twice — confirmed; cost bounded by a replay

Current `PostDetail.tsx` calls `Promise.all([getPostDetail(...), getPostCard(...)])`. These paths overlap but are not entirely interchangeable:

- `getPostDetail` reads the post, current items/nutrition, original-media pointer, original URL, each mask URL and day hydration.
- `getPostCard` reads the same post, revision, media, current items/nutrition, saved state, revision again and the same day hydration. Revision reads serve consistency checks; mask/detail versus feed data have different purposes. A future change must preserve those semantics rather than simply delete queries.

Three **read-only instrumented replays from OCI of the exact current helper functions** against the production test account produced:

| Replay | Auth | Detail branch | Card branch | Total wall time | HTTP requests |
|---|---:|---:|---:|---:|---:|
|0 |60.9ms |1,310.6ms |1,257.8ms |1,371ms |25 |
|1 |82.5ms |837.0ms |1,069.1ms |1,152ms |24 |
|2 |48.9ms |756.2ms |917.9ms |967ms |24 |

[Per-request starts, headers, body completion, query shapes and branch labels](evidence/run11-detail-audit/read-replay.json). These are not spans captured inside the actual Vercel render and must not be presented as such. The branches run concurrently: **do not add their durations** or claim deleting duplication saves their sum.

The warm replay has11detail requests,12card requests and1auth request. Eight request signatures repeat exactly: main current-item read, item nutrition, four day-hydration reads, its day-item read, and the two revision checks. Some other post/media reads overlap in purpose but request different fields. Both hydration branches fetch the selected day’s other meal items as well. The trace therefore confirms redundant work and serial dependency chains, not a measured14-second database stall. First replay has one additional signed card-URL request.

An additional source-correlated observation: browser windows contained5–19 Server Action POSTs, distinct from the navigation GET. Focused short responses identify profile hint-state reads returning `{userId,seen:true}`. `FirstRunHint` calls `getHintState`; that server action performs auth plus a profile read per call. Full attribution of every POST and any navigation-queue blocking was not measured, so it remains a separate suspect, not counted as24–25 meal-builder requests or assigned a causal duration.

### Suspect3: original fetched after small copy — confirmed in the controlled browser

The feed image was already decoded at503×512 through `/api/media/feed/.../v1.webp`. Detail then used a different signed Storage URL for the960×977 original `0.jpg`. Object metadata reports142,087B; CDP records roughly142.8KB including transfer overhead, plus about14KB for a mask. [Object-size sample](evidence/run11-detail-audit/photo-sizes.json). This was a full original, not reuse of the displayed feed representation.

On the synthetic throttle, original-image requests took approximately0.89–1.48s from request start to completion; they began only after the detail response could expose their URL. The repeat in the same context also transferred the original with `fromDiskCache=false`. Signed URLs can differ on later renders. This is a browser-HTTP-cache observation with service workers blocked; the app service worker has its own owner-bound media cache, so it does **not** establish that every installed-PWA reopen downloads the original again.

A read-only sample of the latest40test-account posts found originals up to457,406B. The measured meal is not an upper bound for the owner’s meal. Original-image reuse/preview-first rendering is a concrete future optimization candidate, but there was no global Storage billing attribution, no owner-PWA transfer capture, and no evidence tying this path to500GB.

## What can and cannot be said about the14 seconds

The measured navigation/content interval was0.931–3.440s and the complete original image appeared1.193–3.735s after the tap. We observed expensive overlapping read paths, a second image representation transfer, and no durable loading feedback. **The remaining difference to the owner’s14s is unmeasured, not explained.** Device/PWA cache state, actual meal/image/item complexity, request routing/round trips, render/CPU, background Server Action queueing and service cold state need correlated owner-path evidence before assigning the delay.

## Future-fleet backlog, not a fix in this fleet

Tracked as [#500](https://github.com/aibraincoach/my-food-ai/issues/500).

1. Capture a request-correlated detail open on the owner’s installed iPhone/XL path, including tap→feedback→shell→nutrition→photo→usable, response streaming, server auth/DB/Storage spans, image bytes/cache state and background actions. No new meal/model fixture is needed to profile an existing meal.
2. Show durable loading/preview feedback immediately; reuse the already displayed card/photo while details arrive.
3. Consolidate shared item/day reads and signing where safe; retain owner isolation, latest-revision checks, full nutrient/mask correctness and freshness.
4. Check repeated hint-state reads separately and measure any router action queueing before changing their behavior.
5. Establish and meet an owner-approved detail-open performance budget on installed iOS over mobile data. Report cold/warm distributions and transferred bytes; do not close on a desktop-only happy path or infer global egress savings.

No source changes, migrations, new model calls, or product deployment were made by this audit. Existing production records were only read. Browser contexts closed; transient SDK sessions signed out.
