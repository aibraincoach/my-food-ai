# Profile and Days thumbnail proof (#1420)

Profile keeps the existing signed `.feed.jpg` and defers far-off-screen downloads with native lazy loading. Days uses the existing 320 WebP instead of 640 for its visible 52 px DesktopDays thumbnails (156 device pixels at DPR 3). Both screens set decoding=async and explicit image dimensions. The 40 px DaysView markup has consistent attributes too.

The Profile public-640 experiment was dropped: every cold `/p/` miss reads the original and resizes it, which could increase Supabase egress compared with the signed feed JPEG. It also exposed the existing four-transform immediate-503 limit, tracked as #1425. No resize route, upload, format, schema, feed or detail code changes here.

## Local comparison

Base: main `4a38af48` (the served build's product source is identical to `ed9d0b03`; its later change was test-only). Head: this PR. Local production builds; Chromium and WebKit, English and Japanese, DPR 2 and 3. Profile viewport 390x844; actual DesktopDays panel at 1440x844. No network/CPU throttle or production measurement.

The same fixture has 94 Profile photos. The selected Days window has 12 photos: 3 public and 9 private. The independent many-cold-public failure is deliberately outside this acceptance window, by PM ruling; the failed 81-public Days baseline and Profile experiment are retained privately. Days with many simultaneous cold public copies fails on base and head alike, tracked as #1425.

Numbers below are cumulative image response-body bytes and request counts, including repeated signed URLs. Open means settled screen; scroll means one two-viewport scroll (Profile document or Days panel). Values are identical at DPR 2 and 3.

| Screen / engine / locale | Base open requests / bytes | Head open requests / bytes | Base after scroll requests / bytes | Head after scroll requests / bytes |
| --- | ---: | ---: | ---: | ---: |
| Profile / Chromium / en, ja | 188 / 12,212,480 | 140 / 9,094,400 | 188 / 12,212,480 | 164 / 10,653,440 |
| Profile / WebKit / en | 188 / 12,212,480 | 44 / 2,858,240 | 188 / 12,212,480 | 83 / 5,391,680 |
| Profile / WebKit / ja | 188 / 12,212,480 | 38 / 2,468,480 | 188 / 12,212,480 | 77 / 5,001,920 |
| Days / both engines / en, ja | 12 / 629,088 | 12 / 600,984 | 12 / 629,088 | 12 / 600,984 |

| Image request pattern and host | Base | Head |
| --- | --- | --- |
| Profile: Storage `/storage/v1/object/sign/media/<photo>.feed.jpg` | 64,960 B each | Same JPEG and host; fewer requests |
| Days private: Storage signed `.feed.jpg` | 9 requests, 584,640 B | Identical |
| Days public: app `/p/<media>_<secret>_<width>.webp` | 3 x 640, 44,448 B | 3 x 320, 16,344 B |

Profile makes **zero public-route requests or resizes**. Signing is unchanged: **two observed batches of 94 paths** per Profile open in both builds, and **one batch of 9 paths** on Days. The duplicate Profile signing and image transfers are included, not filtered away. Days performs **three cold original reads/resizes** in both builds, each reading this fixture's 64,960 B original; smaller output does not eliminate that CPU or origin read. Browser lazy-load thresholds differ, so some nearby off-screen images still download. All 12 Days images are near enough to load in this fixture; its saving is bytes, not request count.

All **16 paired screen comparisons** have identical server request multisets and browser data request multisets. Both browser locales and DPRs have zero failed image responses, zero 503s, zero page exceptions and loaded visible thumbnails. Fixed thumbnail boxes match base exactly: approximately 128.67 px square on Profile and 52 px square on Days. Screenshots show the grid and public 320 thumbnails at their displayed size without a visible image shift. Chromium's overall layout-shift trace includes other UI elements; this is not a zero-CLS claim. WebKit does not expose that trace here.

Next Link prefetch requests were blocked equally in both builds to isolate screen costs; queue wake requests were blocked. The raw prefetch counts and server traces are retained. Fixture bytes exclude response headers and are **not production savings or a real-food distribution**. Real-phone rendering is unproved.

## Verification and retained evidence

- Focused Profile and Days tests: **36/36** with the disposable local environment, including the existing avatar HTTP and role tests. A run without the local environment failed those two prerequisites; the configured run passes.
- New Days URL regression: **red on base** (640 versus expected 320), green on head. Private photos/cards remain signed; all-public Days makes no signing call.
- Production build, TypeScript build check, message check and `git diff --check` pass. Scoped ESLint: zero errors, one existing native-img warning in DaysView. The root suite was not rerun for this small change.
- The browser matrix is 2 builds x 2 engines x 2 locales x 2 DPRs x 2 screens. One head WebKit/en/DPR3 trace overlapped the avatar integration test; it was retained separately and repeated in isolation, rather than filtering out those calls.
- All 90 added synthetic posts and their media/storage objects were removed after proof; existing fixtures and shared services remain.

Private evidence: `state/build/1420-thumbnails/COMPARISON.json`, per-build/engine/locale/DPR JSON and screenshots, `browser.mjs`, `trace-fetch.mjs`, fixture setup/cleanup, `BASELINE-RED.tap`, `FOCUSED-LOCAL.log`, `BUILD.log`, `MESSAGES.log`, and `LINT-FINAL.log`. The rejected experiment is under `retained-cold-503/`; the overlapping test trace is under `retained-overlapping-avatar-test/`.

The planner's initial 40 px source reference was corrected to DesktopDays. DaysView's 40 px aside is hidden on mobile and replaced by DesktopDays after desktop hydration; because useDesktop's server snapshot is false, it may appear before hydration on a desktop. This PR keeps its attributes consistent and makes no removal claim.
