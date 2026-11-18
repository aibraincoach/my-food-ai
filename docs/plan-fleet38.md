# Fleet 38 — Home’s hidden desktop photos (#222)

Phones download images in Home’s hidden desktop Today column. The current candidate adds `loading="lazy"` to that column’s meal photos. Visible desktop images still load in view. The runtime change is one line in `src/components/DesktopToday.tsx`, on main `9f6e567e29f6ac76500758f0961dd7ca00b121ff`. A source regression test pins the thumbnail attribute; it fails against a scratch copy without the attribute.

The remembered-photo cookie proposal has been dropped. It did not meet the PM’s minimum 150 ms median gain on returning slow or 4G, and it made the new-meal case slower. No cookie, ownership guard, HTTP Link hint or unused helper lands in this candidate. The existing main image-rendering/preload implementation is unchanged.

## Local comparison

All split builds used the same base `f5c69848`, six saved noise-photo meals, frozen instrument `b21d477bf09dabb772fb6f2f398b1a4be63ea99bf6fe0c57edcc35a3abef7ffa`, fresh Chromium at 390×844 DPR3, disabled HTTP cache and bypassed service worker. Returning opens warm Home before clearing HTTP cache. Each cell lists three photo-load times and their median, in milliseconds.

| Profile | Main | Lazy desktop photos only | Remembered hint only |
|---|---|---|---|
| Fresh, 1.6 Mbit/s, 150 ms | 3799.9 / 3712.4 / 3533.0; **3712.4** | 3415.6 / 3133.8 / 3203.7; **3203.7** | 3800.7 / 3499.6 / 3572.9; **3572.9** |
| Returning, same connection | 3236.9 / 3208.0 / 3224.9; **3224.9** | 3195.4 / 3216.3 / 3202.6; **3202.6** | 3224.4 / 3224.2 / 3227.4; **3224.4** |
| Returning, 9 Mbit/s, 70 ms | 912.0 / 884.4 / 892.4; **892.4** | 1071.2 / 861.1 / 1090.6; **1071.2** | 831.3 / 831.9 / 963.2; **831.9** |

The single additional lazy-only 4G run was **887.7 ms**. It demonstrates variability; it does not replace the original three-run median. The PM subsequently resolved the 4G uncertainty with ten samples per build and a maximum permitted median slowdown of 100 ms; see the next section. The original combined proposal’s 1464.2 ms 4G median was not reproduced by either isolated part; its exact cause is not established.

On a fresh phone open, lazy-only removes six hidden desktop-photo requests and **70,372 bytes** before the first photo. Returning opens remove one such request and 10,478 bytes. Script/style/font bytes before the first photo were 314462/14434/42668 on main, 314469/14434/42668 lazy-only and 314635/14434/42668 hint-only.

One new-meal case per build used the identical saved noise JPEG, producing a 167,813-byte first-photo response: main **3213.9 ms**, lazy-only **3159.8 ms**, hint-only **4304.4 ms**. The hint starts the old 167,813-byte photo at high priority before the new photo, while main requests that old photo later at low priority. That additional competing transfer explains the observed new-meal cost. Each temporary meal was deleted before the next build.

These are controlled timings on `f5c69848`, not timings of the final candidate rebased on the subsequently merged CPU fix. Raw requests, starts, FCP, bytes and build markers are retained in the builder’s Fleet 38 rework proof. No production measurements were run for this rework.

## Ten-run 4G decision

On the same six saved photos and unchanged frozen instrument, current main `9f6e567e` and candidate head `5ac2ca21b52455954e6c416fc5bd8727da9b13ec` were built and measured separately, ten returning 4G opens each. All photo responses were 200 and 167,813 bytes.

| Build | All ten first-photo loads, ms | Median | Range |
|---|---|---|---|
| Main | 943.7, 1031.0, 912.3, 1012.2, 889.9, 1112.2, 846.0, 891.3, 862.9, 888.2 | 901.80 | 846.0–1112.2 |
| Lazy-only | 1036.3, 821.9, 831.7, 833.2, 804.0, 841.7, 803.3, 864.3, 944.0, 853.3 | 837.45 | 803.3–1036.3 |

The candidate median is 64.35 ms faster, meeting the PM’s no-more-than-100-ms-slower condition. Desktop image requests were two per returning main open and zero in every candidate open. This does not claim a large statistically established speedup. The prior three-run figures remain above; none was discarded or substituted.

## Verification and rollout

Run the affected photo/auth/session tests and the current readiness/strip regression tests, typecheck, scoped lint and build locally. Do not repeat full branch suites. Fleet 38’s main-only application baseline passed 817 tests with 6 skips and no failures; database baseline passed 52 with no failures. The pre-existing `DesktopToday.tsx` `slowTimer` prefer-const error is retained as instructed.

The old combined PR #1092 is closed unmerged. The reviewer seat found no blockers in the runtime change at `94d08a9a`; the subsequent `5ac2ca21` commit changes only the regression test. The PM’s conditional order authorizes #1100 to merge after the ten-run threshold is met, followed by this docs PR. Then take only one fresh signed-in test-account-2 Home open at 390×844 after the deployed build is READY: report desktop-image requests, the first photo response/Cache-Control/request start, and page load. No production baseline, repeats, bulk reads or issue closure; a slower number alone is not a rollback trigger. #222 stays open.

## What remains of #222

The issue requires the first photo and visible feed content within two seconds on a phone over mobile data. The 4G profile meets two seconds on main and both candidates. On the throttled 1.6 Mbit/s profile, the best lazy-only fresh result is **3133.8 ms**, with median **3203.7 ms**; the photo still misses two seconds by at least **1133.8 ms** in this comparison. The feed paints earlier (lazy-only fresh FCP 820/516/564 ms). Removing hidden image bytes helps, but this does not close #222. JavaScript transfer/rendering and photo transfer remain outside this one-line patch.
