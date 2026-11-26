# Profile and Days lazy-thumbnail proof (#1420)

Profile and both Days list views use native lazy loading, async decoding and explicit image dimensions. Profile keeps its signed `.feed.jpg`; Days keeps its existing 640 public `photoUrl` for every consumer, including the story hero and summary grid. `grid.ts`, `days.ts`, image routes and upload code are unchanged against main. There is no new image field, format, migration or signing policy.

## Local comparison

Base: main `4a38af48` (served product source identical to `ed9d0b03`, whose later delta was test-only). Head: this PR. Local production builds, Chromium and WebKit, English and Japanese, DPR 2 and 3. Profile viewport 390x844; actual DesktopDays panel at 1440x844. No timing, network-throttle or production claim.

The same fixture has 94 Profile photos. The selected Days window has 12 photos: 3 public and 9 private. The older many-cold-public failure is outside this acceptance window by PM ruling, tracked as #1425; the failed 81-public Days baseline and rejected Profile public-copy experiment remain in private evidence.

Cumulative image response-body counts and bytes include repeated signed URLs. Open means settled screen; scroll means one two-viewport scroll of the Profile document or Days panel. Results agree at DPR 2 and 3.

| Screen / engine / locale | Base open requests / bytes | Head open requests / bytes | Base after scroll requests / bytes | Head after scroll requests / bytes |
| --- | ---: | ---: | ---: | ---: |
| Profile / Chromium / en, ja | 188 / 12,212,480 | 140 / 9,094,400 | 188 / 12,212,480 | 164 / 10,653,440 |
| Profile / WebKit / en | 188 / 12,212,480 | 44 / 2,858,240 | 188 / 12,212,480 | 83 / 5,391,680 |
| Profile / WebKit / ja | 188 / 12,212,480 | 38 / 2,468,480 | 188 / 12,212,480 | 77 / 5,001,920 |
| Days / both engines / en, ja | 12 / 629,088 | 12 / 629,088 | 12 / 629,088 | 12 / 629,088 |

| Image request pattern / host | Base and head |
| --- | --- |
| Profile: Storage `/storage/v1/object/sign/media/<photo>.feed.jpg` | 64,960 B each, fewer requests with lazy loading |
| Days private: Storage signed `.feed.jpg` | 9 requests, 584,640 B |
| Days public: app `/p/<media>_<secret>_640.webp` | 3 requests, 44,448 B |

Profile has zero `/p/` requests/resizes. Signing is unchanged: two observed batches of 94 per Profile open, one batch of 9 on Days. The existing duplicate signing/downloads are included, not silently filtered; #1427 traces them to the readiness listener's initial refresh. Days performs three cold original reads/resizes in each build. All 12 Days thumbnails fall within the browser's lazy threshold in this fixture, so **no Days byte or request saving is claimed**. Nearby off-screen images can still load; far-off-screen Profile downloads are deferred.

All 16 paired screen comparisons have equal server request and browser data-request multisets, no failed image responses/503s or page exceptions, and matching boxes: approximately 128.67 px square on Profile, 52 px square in DesktopDays. Screenshots at DPR 2/3 show clear thumbnails at displayed size without an observed image shift. Overall Chromium layout-shift traces include other UI; this is not a zero-CLS claim. WebKit does not expose those traces here.

Next Link prefetches and queue wakes were blocked equally to isolate screen costs; raw counts are retained. These are synthetic fixture response-body bytes, excluding headers, **not production savings**. Real phones are unproved.

## Rejected size changes and review correction

The Profile public-640 experiment was rejected because every cold `/p/` miss downloads the original and resizes it, potentially increasing Supabase egress. It also exposed #1425's immediate four-slot 503 limit. Days with many simultaneous cold public copies fails on base and head alike; that independent issue remains open.

A smaller Days thumbnail was measured, then rejected. Its list-only fixture used 600,984 B versus 629,088 B, a 28,104 B reduction. The original shared-field implementation also changed StoryPlayer's full-width hero and summary grid to soft 320/q32, which the primary reviewer caught: that was outside scope. A separate 320 thumbnail plus the retained 640 story would instead generate two cold copies per public photo when both screens are opened, increasing original reads and resize CPU (six versus three for this fixture). The PM dropped the size change entirely. StoryPlayer source and Days URL generation now match main byte for byte; there is no `thumbUrl`.

The original plan's 40 px Days reference was corrected to the visible 52 px DesktopDays panel. DaysView's 40 px aside remains consistent: mobile CSS hides it; desktop hydration replaces it, although useDesktop's false server snapshot can show it before hydration. No removal claim is made.

## Verification

Production build/TypeScript, messages, `git diff --check` and 34 focused Profile/Days tests with the disposable local environment pass. Scoped lint has zero errors and one existing DaysView native-img warning. There are no test changes in the final diff. The primary review ran the earlier root suite and found the same 47 failing names as main; the builder did not rerun the root suite for this attributes-only delta.

Private evidence: `state/build/1420-thumbnails/COMPARISON.json`, per-engine/locale/DPR JSON and screenshots, `browser.mjs`, `trace-fetch.mjs`, setup/cleanup scripts, `FOCUSED-LOCAL.log`, `BUILD.log`, `MESSAGES.log`, `LINT-FINAL.log`. Rejected data remains under `retained-cold-503/` and `retained-rejected-days320/`. An earlier trace overlapping the avatar integration test is retained separately; final checks and browser runs are sequential. All 90 added synthetic posts and their storage objects are removed after proof; shared services and existing fixtures are preserved.
