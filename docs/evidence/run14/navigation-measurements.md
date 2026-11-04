# Production navigation and meal-detail observations

Before: main `299f13a49af5320cb81d4cdf4e9de14263214a96`. After: main `a24587a1ec3b57a7b2bdfb5f69cce4e0e73602db`, independently observed READY at 08:48:13 UTC as `dpl_24RqPXLfHT5iuV9ZJEnADjoNzgFS`, with the production alias assigned to that same deployment. [Runtime observation](https://github.com/aibraincoach/my-food-ai/blob/eeba864c8e54c562f9a76cf90872187d172564ab/docs/evidence/run14/navigation-after-runtime.json).

Native Firefox WebDriver BiDi, isolated browser user contexts, designated test account 2 only. No posts were created by this measurement. No images or screenshots were saved. These are **unthrottled** observations: the planned Chromium CPU 4× / Fast 3G conditions were not established. The source receipts record their own UTC cutoffs.

## Requests observed in each navigation window

Auth below counts actual browser GETs to `/auth/v1/user`; the first before-Home window also included one CORS OPTIONS request. Feed first-page reads and `ids=` revision refreshes are separate.

| Navigation | Before Auth GET | After Auth GET | Before → after first-page feed | Before → after ids refresh | Before → after `/api/days` | Before → after action POST |
| --- | ---: | ---: | --- | --- | --- | --- |
| Home, 390 px, zone cookie present | 1 | 0 | 0 → 0 | 1 → 2 | 0 → 0 | 2 → 2 |
| Home, 390 px, zone cookie absent | 1 | 0 | 1 → 1 | 3 → 3 | 0 → 0 | 6 → 6 |
| Days, 390 px | 1 | 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| Profile, 390 px | 1 | 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| Home, 1280 px, zone cookie present | not sampled | 0 | not sampled → 0 | not sampled → 2 | not sampled → 0 | not sampled → 4 |

The absent-zone Home established its browser zone and made one additional first-page read; it is not the known-zone case. The known-zone observations reused the server feed seed. Desktop Today was present with zero `/api/days` requests in its observed window. These browser counts do not prove one underlying server Auth or nutrition query: middleware also verifies protected server-action and prefetch requests, while the shared day-total query still reads current nutrition separately from the feed.

The after count windows ended before 08:42:15 UTC. The sibling's two measurement posts were reserved at 08:43:48 and 08:44:12 UTC and removed around 08:44:40 UTC, so those mutations did not overlap the count windows. Two interrupted detail-driver attempts during this coordination are excluded from timing conclusions; their exceptions were reported to the coordinator. Final detail receipts preserve their own observations, including the incomplete trial below.

## Photo-tap observations

Same three pre-existing photo posts, 390×844 and 1280×800. First-frame time is the first visible frame DOM mutation after capture-phase pointer-up; the photo top is measured against the settled detail. Before, every desktop photo tap navigated to the full post page. After, desktop photo taps open the post window.

| Post prefix | Width | Before items visible, ms | After frame, ms | After items visible, ms | After photo-top delta, px |
| --- | ---: | ---: | ---: | ---: | ---: |
| f1737bd7 | 390 | 1112 | 10 | 1370 | 0 |
| 48d4e1b2 | 390 | 1195 | 14 | 1706 | 0 |
| 88dfce5d | 390 | 1122 | 11 | 1030 | 0 |
| f1737bd7 | 1280 | 994 | 25 | 1787 | 0 |
| 48d4e1b2 | 1280 | 1055 | 15 | 1689 | 0 |
| 88dfce5d | 1280 | 983 | 18 | not observed within 20 seconds | unavailable |

The incomplete third desktop trial issued no matching detail navigation GET in its trace. A focused follow-up on that same existing post succeeded: preview and committed-open events named the correct post, its URL selected it by 1200 ms, and the real modal contained a consumed summary and four editable items at the 2500 ms observation, with no alerts. Its exact item-render timestamp was not measured. The earlier incomplete trial remains in the receipt; its cause is not established and it is not converted into a successful timing result. [Focused follow-up](https://github.com/aibraincoach/my-food-ai/blob/eeba864c8e54c562f9a76cf90872187d172564ab/docs/evidence/run14/navigation-after-third-desktop-followup.json).

Before full RSC streams were approximately 540–665 ms. The after completed target streams were approximately 448–649 ms; additional small prefetch responses are retained separately. Their response starts were cache/service-worker-mediated (typically 0–2 ms), not measurements of uncached server TTFB. The owner’s 14-second experience was not reproduced by these successful unthrottled samples, and its cause remains unexplained. These observations do not establish a controlled performance improvement or physical-phone acceptance.

## Image bytes and transport

A separate authenticated read of the first baseline ready-meal photo, f1737bd7, returned **16,598 bytes**, WebP, HTTP 200, in 425.2 ms. [Ready-photo receipt](https://github.com/aibraincoach/my-food-ai/blob/eeba864c8e54c562f9a76cf90872187d172564ab/docs/evidence/run14/navigation-ready-photo-bytes.json). The older 152,193-byte comparator is a historical observation, not a controlled same-photo before sample.

The 21,286-byte response observed in the navigation resource list belongs to the needs-input thumbnail path; it is not a decoded first feed-card photograph. No above-fold feed-card photo was proved decoded in those initial Home windows. Both separate proxy reads are outside the browser navigation request counts.

| Post prefix | Original body bytes | Before phone transfer, ms | Before desktop transfer, ms | After phone completed responses | After desktop completed responses |
| --- | ---: | ---: | ---: | --- | --- |
| f1737bd7 | 236806 | 349 | 170 | 276 ms; 366 ms | 150 ms; 177 ms |
| 48d4e1b2 | 110498 | 294 | 197 | 248 ms; 148 ms | 323 ms; 120 ms |
| 88dfce5d | 239273 | 437 | 242 | 241 ms; 133 ms | no completed original response in the incomplete trial |

Two completed original-image GET responses were observed in each successful after trial; they are not silently deduplicated in the evidence. Their cause and billed egress impact were not isolated by this measurement.

## Source receipts

[Before summary](https://github.com/aibraincoach/my-food-ai/blob/eeba864c8e54c562f9a76cf90872187d172564ab/docs/evidence/run14/navigation-before-summary.json), [before events](https://github.com/aibraincoach/my-food-ai/blob/eeba864c8e54c562f9a76cf90872187d172564ab/docs/evidence/run14/navigation-before-events.json), [after summary](https://github.com/aibraincoach/my-food-ai/blob/eeba864c8e54c562f9a76cf90872187d172564ab/docs/evidence/run14/navigation-after-summary.json), [after events](https://github.com/aibraincoach/my-food-ai/blob/eeba864c8e54c562f9a76cf90872187d172564ab/docs/evidence/run14/navigation-after-events.json). Signed token values, cookie values and storage-owner path segments are excluded. Request header names and timing/body-size metadata are retained; no credentials are included.
