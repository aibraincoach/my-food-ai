# Fleet 38 — Home’s hidden desktop photos (#222)

Phones download images in Home’s hidden desktop Today column. The current candidate adds `loading="lazy"` to that column’s meal photos. Visible desktop images still load in view. The patch is one line in `src/components/DesktopToday.tsx`, on main `9f6e567e29f6ac76500758f0961dd7ca00b121ff`.

The remembered-photo cookie proposal has been dropped. It did not meet the PM’s minimum 150 ms median gain on returning slow or 4G, and it made the new-meal case slower. No cookie, ownership guard, HTTP Link hint or unused helper lands in this candidate. The existing main image-rendering/preload implementation is unchanged.

## Local comparison

All split builds used the same base `f5c69848`, six saved noise-photo meals, frozen instrument `b21d477bf09dabb772fb6f2f398b1a4be63ea99bf6fe0c57edcc35a3abef7ffa`, fresh Chromium at 390×844 DPR3, disabled HTTP cache and bypassed service worker. Returning opens warm Home before clearing HTTP cache. Each cell lists three photo-load times and their median, in milliseconds.

| Profile | Main | Lazy desktop photos only | Remembered hint only |
|---|---|---|---|
| Fresh, 1.6 Mbit/s, 150 ms | 3799.9 / 3712.4 / 3533.0; **3712.4** | 3415.6 / 3133.8 / 3203.7; **3203.7** | 3800.7 / 3499.6 / 3572.9; **3572.9** |
| Returning, same connection | 3236.9 / 3208.0 / 3224.9; **3224.9** | 3195.4 / 3216.3 / 3202.6; **3202.6** | 3224.4 / 3224.2 / 3227.4; **3224.4** |
| Returning, 9 Mbit/s, 70 ms | 912.0 / 884.4 / 892.4; **892.4** | 1071.2 / 861.1 / 1090.6; **1071.2** | 831.3 / 831.9 / 963.2; **831.9** |

The single additional lazy-only 4G run was **887.7 ms**. It demonstrates variability; it does not replace the original three-run median. The candidate stays draft for PM evaluation of the 4G uncertainty. The original combined proposal’s 1464.2 ms 4G median was not reproduced by either isolated part; its exact cause is not established.

On a fresh phone open, lazy-only removes six hidden desktop-photo requests and **70,372 bytes** before the first photo. Returning opens remove one such request and 10,478 bytes. Script/style/font bytes before the first photo were 314462/14434/42668 on main, 314469/14434/42668 lazy-only and 314635/14434/42668 hint-only.

One new-meal case per build used the identical saved noise JPEG, producing a 167,813-byte first-photo response: main **3213.9 ms**, lazy-only **3159.8 ms**, hint-only **4304.4 ms**. The hint starts the old 167,813-byte photo at high priority before the new photo, while main requests that old photo later at low priority. That additional competing transfer explains the observed new-meal cost. Each temporary meal was deleted before the next build.

These are controlled timings on `f5c69848`, not timings of the final candidate rebased on the subsequently merged CPU fix. Raw requests, starts, FCP, bytes and build markers are retained in the builder’s Fleet 38 rework proof. No production measurements were run for this rework.

## Verification and stop

Run the affected photo/auth/session tests and the current readiness/strip regression tests, typecheck, scoped lint and build locally. Do not repeat full branch suites. Fleet 38’s main-only application baseline passed 817 tests with 6 skips and no failures; database baseline passed 52 with no failures. The pre-existing `DesktopToday.tsx` `slowTimer` prefer-const error is retained as instructed.

The old combined PR is closed unmerged and the new lazy-only PR is draft. The PM assigns the reviewer seat at the exact final head after evaluating the data. Merge nothing at this stop; close no issue. Any later production check requires a named-head order and the owner’s rule 4: one sequential pass per side, no repeated cold opens, no parallel loads or extra database probes.

## What remains of #222

The issue requires the first photo and visible feed content within two seconds on a phone over mobile data. The 4G profile meets two seconds on main and both candidates. On the throttled 1.6 Mbit/s profile, the best lazy-only fresh result is **3133.8 ms**, with median **3203.7 ms**; the photo still misses two seconds by at least **1133.8 ms** in this comparison. The feed paints earlier (lazy-only fresh FCP 820/516/564 ms). Removing hidden image bytes helps, but this does not close #222. JavaScript transfer/rendering and photo transfer remain outside this one-line patch.
