# PR #590: current-head review receipt

Observed2026-11-04T13:49:06Z. Head `69a216b956be40f9dc434cdf379b328864f64421`; stateOPEN; draftFalse; mergeabilityMERGEABLE. Vercel and Vercel Preview Comments report SUCCESS at this head. Receipt source: https://github.com/aibraincoach/my-food-ai/pull/590#issuecomment-6630743736. Public comment text follows; no new review was run for packaging.

AGY receipt — head `69a216b956be40f9dc434cdf379b328864f64421`, base `376e3306942161a5e659e8d99c85154c8ac26a35`, PR #590.

Invocation: `agy --model gemini-3.8-flash-high --effort high --sandbox --dangerously-skip-permissions --disable-slash-commands --output-format json --json-schema /home/opc/Projects/my-food-ai-wt/run15-core/uploads/run15/reviews/agy-69a216b/schema.json --print-timeout 10m --print` (prompt omitted), cwd `/home/opc/Projects/my-food-ai-wt/run15-core/uploads/run15/reviews/agy-69a216b`, started 2026-11-04T12:26:08.419Z, finished 2026-11-04T12:34:05.708Z, agy exit 0.
Delivery: 17 changed paths as 17 on-disk patch parts (≤ 40000 bytes each), read via view_file only; deletions carry full removed content.

Completeness check: PASS — 17/17 paths, 17/17 parts complete, all via view_file.

Verdict: **BLOCKERS: NONE**
Tool exit code: 0 (0 clean, 2 coverage gap, 3 blockers found, 4 agy failure).

| # | path | status | parts | reported bytes | complete |
| --- | --- | --- | --- | --- | --- |
| 1 | public/sw.js | M | 1 | 824 | yes |
| 2 | scripts/run15-photo-checks.mjs | A | 1 | 17292 | yes |
| 3 | src/app/(tabs)/page.tsx | M | 1 | 2937 | yes |
| 4 | src/app/api/media/feed/[owner]/[post]/[media]/[variant]/route.ts | A | 1 | 4543 | yes |
| 5 | src/components/Carousel.tsx | M | 1 | 2073 | yes |
| 6 | src/components/OutlineOverlay.tsx | M | 1 | 2013 | yes |
| 7 | src/components/PostOpenFrame.tsx | M | 1 | 2248 | yes |
| 8 | src/lib/posts/feed-photo-url.ts | M | 1 | 858 | yes |
| 9 | src/lib/posts/feed-photo.ts | M | 1 | 2741 | yes |
| 10 | src/lib/posts/home-photo-preload.ts | D | 1 | 2168 | yes |
| 11 | src/middleware.ts | M | 1 | 1232 | yes |
| 12 | tests/feed-cache-lifecycle.test.mjs | M | 1 | 1941 | yes |
| 13 | tests/home-day-totals.test.mjs | M | 1 | 1908 | yes |
| 14 | tests/home-photo-preload.test.mjs | M | 1 | 10615 | yes |
| 15 | tests/sharp-feed-photo.test.mjs | A | 1 | 5092 | yes |
| 16 | tests/sharp-image-identity.test.mjs | A | 1 | 3933 | yes |
| 17 | tests/sw-media-cache.test.mjs | M | 1 | 1190 | yes |

Raw reviewer response follows unchanged.

```json
{
  "base": "376e3306942161a5e659e8d99c85154c8ac26a35",
  "blockers": [],
  "files": [
    {
      "findings": [
        "Service worker media owner check regex is updated to recognize density-specific variant webp endpoints (/api/media/feed/.../(?:v[12]|v2-1040|v2-1560).webp) and maintain owner isolation in cache matching."
      ],
      "parts": [
        {
          "bytes_read": 824,
          "complete": true,
          "name": "patches/001-public__sw.js.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "public/sw.js",
      "status": "M"
    },
    {
      "findings": [
        "Verification test script run15-photo-checks.mjs added to measure photo byte weights, density variants, and fallback behaviors while guaranteeing cleanup of owned fixture reservations only."
      ],
      "parts": [
        {
          "bytes_read": 17292,
          "complete": true,
          "name": "patches/002-scripts__run15-photo-checks.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "scripts/run15-photo-checks.mjs",
      "status": "A"
    },
    {
      "findings": [
        "Responsive srcset and imageSrcSet hints added to HomeFirstPhoto and homeSeed preload calls, replacing middleware HTTP Link preload headers with native HTML image preloading."
      ],
      "parts": [
        {
          "bytes_read": 2937,
          "complete": true,
          "name": "patches/003-src__app__tabs__page.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/app/(tabs)/page.tsx",
      "status": "M"
    },
    {
      "findings": [
        "New dynamic route endpoint /api/media/feed/[owner]/[post]/[media]/[variant]/route.ts correctly validates UUID parameters, variant boxes (v2-1040.webp, v2-1560.webp), enforces session owner RLS authentication and storage path checks, bounds concurrent sharp operations with reserveFeedPhoto(), and falls back to a signed URL redirect on transform failure or timeout."
      ],
      "parts": [
        {
          "bytes_read": 4543,
          "complete": true,
          "name": "patches/004-src__app__api__media__feed__owner__post__media__variant__route.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/app/api/media/feed/[owner]/[post]/[media]/[variant]/route.ts",
      "status": "A"
    },
    {
      "findings": [
        "MealPhoto in Carousel.tsx incorporates feedPhotoSrcSet(active) and robustly falls back to the 1x active image upon candidate load error via onError state tracking scoped to imageIdentity(active)."
      ],
      "parts": [
        {
          "bytes_read": 2073,
          "complete": true,
          "name": "patches/005-src__components__Carousel.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/components/Carousel.tsx",
      "status": "M"
    },
    {
      "findings": [
        "DetailImage in OutlineOverlay.tsx adds srcset support during preview and maintains proper identity tracking so preview swaps immediately to loaded original photos without cross-photo race conditions."
      ],
      "parts": [
        {
          "bytes_read": 2013,
          "complete": true,
          "name": "patches/006-src__components__OutlineOverlay.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/components/OutlineOverlay.tsx",
      "status": "M"
    },
    {
      "findings": [
        "PostOpenFrame.tsx sets responsive feedPhotoSrcSet on the fast-open photo frame and falls back to 1x URL on candidate error."
      ],
      "parts": [
        {
          "bytes_read": 2248,
          "complete": true,
          "name": "patches/007-src__components__PostOpenFrame.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/components/PostOpenFrame.tsx",
      "status": "M"
    },
    {
      "findings": [
        "feedPhotoSrcSet helper added in feed-photo-url.ts to format responsive candidates (1x, 2x at 1040px, 3x at 1560px) from valid /v[12].webp endpoints."
      ],
      "parts": [
        {
          "bytes_read": 858,
          "complete": true,
          "name": "patches/008-src__lib__posts__feed-photo-url.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/posts/feed-photo-url.ts",
      "status": "M"
    },
    {
      "findings": [
        "feed-photo.ts defines MAX_ORIGINAL_SOURCE_BYTES (8MB), SHARP_FEED_BOXES (1040 and 1560), configurable byte limit on readFeedSource, and resizeSharpPhoto helper with bounded execution time and output size checks."
      ],
      "parts": [
        {
          "bytes_read": 2741,
          "complete": true,
          "name": "patches/009-src__lib__posts__feed-photo.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/posts/feed-photo.ts",
      "status": "M"
    },
    {
      "findings": [
        "home-photo-preload.ts safely deleted now that responsive preloads are emitted via React HTML preloads rather than middleware database lookups."
      ],
      "parts": [
        {
          "bytes_read": 2168,
          "complete": true,
          "name": "patches/010-src__lib__posts__home-photo-preload.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/posts/home-photo-preload.ts",
      "status": "D"
    },
    {
      "findings": [
        "middleware.ts removes the database query and Link preload header for home photos, retaining session verification and private no-store caching headers."
      ],
      "parts": [
        {
          "bytes_read": 1232,
          "complete": true,
          "name": "patches/011-src__middleware.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/middleware.ts",
      "status": "M"
    },
    {
      "findings": [
        "feed-cache-lifecycle.test.mjs mock updated to include feedPhotoSrcSet and getEarliestPostDate."
      ],
      "parts": [
        {
          "bytes_read": 1941,
          "complete": true,
          "name": "patches/012-tests__feed-cache-lifecycle.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/feed-cache-lifecycle.test.mjs",
      "status": "M"
    },
    {
      "findings": [
        "home-day-totals.test.mjs mock updated to include feedPhotoSrcSet and getEarliestPostDate."
      ],
      "parts": [
        {
          "bytes_read": 1908,
          "complete": true,
          "name": "patches/013-tests__home-day-totals.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/home-day-totals.test.mjs",
      "status": "M"
    },
    {
      "findings": [
        "home-photo-preload.test.mjs updated to verify that middleware makes no photo queries or preload Link headers, and validates that React emits responsive HTML preloads matching img srcset candidates."
      ],
      "parts": [
        {
          "bytes_read": 10615,
          "complete": true,
          "name": "patches/014-tests__home-photo-preload.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/home-photo-preload.test.mjs",
      "status": "M"
    },
    {
      "findings": [
        "sharp-feed-photo.test.mjs tests the dynamic variant route under sharp transforms, 401/404 security checks, and 302 signed fallback behavior on error or abort."
      ],
      "parts": [
        {
          "bytes_read": 5092,
          "complete": true,
          "name": "patches/015-tests__sharp-feed-photo.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/sharp-feed-photo.test.mjs",
      "status": "A"
    },
    {
      "findings": [
        "sharp-image-identity.test.mjs tests candidate error isolation across Carousel, PostOpenFrame, and OutlineOverlay components."
      ],
      "parts": [
        {
          "bytes_read": 3933,
          "complete": true,
          "name": "patches/016-tests__sharp-image-identity.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/sharp-image-identity.test.mjs",
      "status": "A"
    },
    {
      "findings": [
        "sw-media-cache.test.mjs tests that density-specific copies are isolated by owner and variant in the service worker cache."
      ],
      "parts": [
        {
          "bytes_read": 1190,
          "complete": true,
          "name": "patches/017-tests__sw-media-cache.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/sw-media-cache.test.mjs",
      "status": "M"
    }
  ],
  "head": "69a216b956be40f9dc434cdf379b328864f64421",
  "summary": "PR 590 introduces high-density responsive feed photos (2x at 1040px and 3x at 1560px) alongside 1x fallbacks. All 17 changed paths across the 17 parts were read completely in full using view_file. Evaluation across runtime correctness, data/privacy requirements (owner isolation, server-side authorization, secrets isolation, and trace hygiene), and cross-PR integration revealed no blockers.",
  "verdict": "BLOCKERS: NONE"
}
```


## Supplementary Muse watch review

Source: https://github.com/aibraincoach/my-food-ai/pull/590#issuecomment-6631008651

<!-- watch-review -->
Watch review of head 69a216b956be40f9dc434cdf379b328864f64421 by muse-spark-1.3.

Verdict: zero blockers.

Earlier finding "the HTTP image preload can download the wrong photo size": FIXED at this head (read in code). The Link-header preload is removed entirely (src/middleware.ts, home-photo-preload.ts deleted); the home photo now uses HTML preload with imageSrcSet plus srcSet on the img (src/app/(tabs)/page.tsx), so the browser selects the density candidate.

Earlier finding "one failed image disables sharper photos for later ones": FIXED at this head (read in code). Carousel/PostOpenFrame/OutlineOverlay now record the failed image identity and disable srcset only for that image (failedSharp vs imageIdentity), and the variant route has per-request 302-to-signed-original fallback with no cross-request latch (variant route.ts, src/lib/posts/feed-photo.ts). Pinned by tests/sharp-image-identity.test.mjs.

Bytes/egress: no byte or egress measurements exist for this change; stating plainly, none were found in the PR and none are claimed here. scripts/run15-photo-checks.mjs is a measurement driver only, with no results in the repo. Code facts only: variant outputs are capped at 600KB each and the original download at 8MB before falling back to the signed original (read in code); actual egress is unmeasured.

Non-blocking notes (read in code): density variants raise per-photo byte ceilings versus the 50KB v1 preview cap, unmeasured; year-immutable ETags per variant would also pin bytes across a future encoder change; camera.ts was touched and fully reverted inside the PR, net zero at this head.

Other checks (read in code): variant route enforces UUIDs, owner match (404, no leak), RLS lookup, storage-path prefix, variant allowlist and signed-URL origin; SW cache update stays owner-scoped; no migration; no nutrition paths touched.

Not checked: real-device density selection, measured bytes, test-suite execution.
