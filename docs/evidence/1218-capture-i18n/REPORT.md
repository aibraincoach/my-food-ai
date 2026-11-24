# Capture translations: #1218 slice 3

This slice translates capture, composer, drink review, voice, first-use hints and pending-upload wording. It adds 388 keys: 382 in capture and 6 shared card-glyph labels, for 598 keys in each of English and Japanese. Japanese was drafted in bounded model calls and independently back-translated by a second model; it has not been reviewed by a native speaker.

The capture provider is scoped to signed-in tabs, post detail and the anonymous per-language shell. It is not added to Welcome or sign-in. A build check walks reachable source imports and rejects namespaces omitted from the provider. Converted files join the translation lint scope; the rule now also detects visible literal branches inside JSX expressions without treating comparisons or CSS attributes as visible text.

## Stored failures

Pending uploads now persist a structured failure and translate when displayed. IndexedDB version 3 upgrades old version-2 wording to the generic saved-before-update code and deletes the old message field, retaining the photo and retry identity. There is no legacy message reader. API capture mutations add message_code beside their unchanged error; operational code values retain their existing meaning. Known codes display the original English sentence, including the 26 helper/route sentences listed in [generic-failures.md](generic-failures.md). A finite table at the server boundary supplies stable codes for those existing app sentences, retaining response text and status. Unknown or absent codes display the PM-approved neutral “Something went wrong. Try again.” / 「問題が発生しました。もう一度お試しください。」; legacy migrated drafts use the same neutral text. Actual transport states retain their existing network/size wording.

PostCard and pending-upload-line change only their pending-message read. IntakeSheet, FoodSearchPanel, SavedMealListeners and LogAgainSheet receive the same narrow read adapter; tests exercise each reader with the real English translator. Their remaining copy belongs to later slices. Stored attachment captions remain data; upload chips derive translated attachment labels from the existing metadata rather than parsing a sentence.

A failed-photo browser check exposed an omitted structured transport failure. The final implementation persists the original three transport states (connection dropped, photo too large, server failed) with their original English, and both engines subsequently proved retry after restoring the draft using the same post ID.

## Validation

All browser runs were local at 390×844 with synthetic data and scripted provider replies, with the normal service worker unless a receipt explicitly says otherwise. No production action or external model inference was part of these acceptance runs.

| Check | Chromium | Playwright WebKit |
| --- | --- | --- |
| Camera, barcode surface, composer, text, typed caption, unavailable camera; both locales | 14 cases pass | 14 cases pass |
| Six English screen text and aria-label snapshots against base | Identical | Identical |
| Version-2 draft upgrade; English → Japanese → English; old field absent; photo retained | Pass | Pass |
| Offline Japanese shell opens Japanese capture without a missing-message error | Pass | Pass |
| Voice post: scripted transcript, rendered ready card, saved exact ID; both locales | 2 pass | 2 pass |
| Gallery, known barcode, unknown barcode → label, photo-drink half portion; both locales | 8 pass across split receipts | 8 pass in one fresh-fixture run |
| Failed photo → restore draft → Try again → ready same ID; both locales | 2 pass | 2 pass |
| Final Japanese label macro/serving wording | Pass, final 579-key build | Pass, final 579-key build |

The initial six-state snapshots precede the last targeted macro/serving/group-heading fixes. Whole-message golden tests cover those later changes, including exact English. Recording/transcribing wording has separate golden tests. This is not a claim that every possible camera/OS error or every unconverted screen is Japanese. Units, brand/proper names and synthetic food data remain unchanged. Native browser or operating-system error messages may still be supplied by the platform.

Selected related tests: 164 tests, 163 passed, zero failed, one optional scratch-database SQL test skipped. A separate real local HTTP food-post test passed. Focused migration/failure/namespace/reader/voice tests passed (61 tests); final fragment and lint tests passed (13). These overlap and are not added together as a full-suite count. The SQL skip was not run against the existing storage schema because it requires its own scratch database. Type checking, scoped lint, message validation and the production build are recorded separately.

## Update and first-use regression gate

- #1283 H1, Chromium: pass. Worker activation and API response occurred without a document reload under the camera; the draft survived.
- #1284 H4, WebKit: base and head pass with the same disclosed setup guard, leaving assertions unchanged. One observation established an existing opening-animation race: head handlers attached 318 ms earlier, and the early tap at opacity 0.198 hit Close. The guard waits for the same hittable, settled menu button. This was not a product change.
- #1285 H5, WebKit: pass with synthetic persisted pagehide/pageshow events; this is not proof of actual browser back-forward-cache restoration.
- #1287: all six accepted text-guard cases pass, three in each engine. A new document response and advancing boot count are used, without requiring WebKit's navigation-type label to say reload.
- #1320 Chromium: fresh/seen camera and first thumbs/thread interactions pass.
- #1320 WebKit: fresh camera passes; seen camera timed out once. Across slices 2 and 3 the head record is two timeouts in three runs. No cause was found and this is not a clean gate. The inherited script closed the failing context before a DOM/screenshot could be saved; it now saves them before closing for future failures. The separately run feed thumbs/thread cases pass. [#1338](https://github.com/aibraincoach/my-food-ai/issues/1338) records the intermittent finding. It was not rerun in a loop or fixed in this slice.

## Instrument corrections and limits

Failure receipts were retained. Corrections included a stale local app URL; stale tests asserting the old stored-message field; an external node_modules symlink incompatible with the build root (replaced by a local hard-linked copy); missing container browser/cache mounts; waiting for upload completion before comparing snapshots; a provider fixture lacking transcription; a repeated image correctly served from cache; unknown barcodes becoming known after an earlier label save; a duplicate product locator; and a reused synthetic account reaching its real hourly limit. Fresh independent fixtures and normal network transport were used for corrected flow runs. No caches were deleted to manufacture a product result.

WebKit offline font/network errors and local service-worker access-control noise are preserved in private receipts; there is no clean-console claim. The offline assertion checks the rendered language and absence of missing-message errors. Chromium uses a fake camera; WebKit uses a canvas/video stand-in or a library photo. Microphones are synthetic. Playwright WebKit is not Safari; real-phone camera, microphone, keyboard and layout behavior remain unproved.

At 390 px the observed controls wrapped without horizontal dialog overflow. The final Japanese label screenshot is checked separately. The original English barcode-tip claim about Photo mode is preserved even though it warrants a later source-copy review; no health or nutrition advice was added.

Raw translation answers, second readings, logs, failure receipts and synthetic screenshots are retained in the build seat's shared slice evidence. Reproduction and guarded fixture cleanup commands are in [testing.md](../../testing.md). Cleanup results and final build identity are recorded with the review handoff.

## Final checkpoint

The initial 579-key production build, TypeScript check and scoped lint passed. Both engines then passed the Japanese label flow with the serving labels included in the English-leak assertion. The grouped three-photo heading was rendered through the actual component in English and Japanese unit checks. The two final synthetic label screenshots and draft/offline/retry/cleanup receipts are included beside this report.

All five synthetic fixture accounts were signed out and removed; readbacks were zero for auth accounts, profiles, posts, upload drafts, jobs, media, comments, storage objects and sessions. Temporary cookie files were deleted and fixture passwords removed from the ledgers. All five owned local app/provider/proxy listeners were stopped. No production account was used.

## Review corrections

The first source review found a real stored-drink-PNG regression: DrinkPicture had acquired a next-intl hook, but ImageResponse has no provider. It now receives a plain translated label from the existing provider-free card translator. Both stored English card PNG fixtures, including coffee/caffeine, render byte-identical to their pre-slice goldens. No request or React translation hook is used by DrinkPicture.

The review also found five stale upload-draft assertions and four first-hint module stubs; they now exercise structured errors/the real English translator without changing their lifecycle assertions. The PM revised the earlier generic-error exception: all 26 known sentences retain their own English and Japanese, and truly unknown failures use neutral wording. Eighteen missing Japanese lines were drafted by the PM and received a second model reading (not strictly blind because the supplied table had adjacent English). The recommended leftovers terminology correction was adopted; the optional intent wording remains as drafted. These translations are not native-approved.

The final amendment adds tests for all 26 display-code round trips, no raw sentence persistence, neutral unknown/prototype-like inputs, and exact unchanged API error expressions. The original six-screen English snapshots and capture-flow receipts above precede this focused correction; their source paths were not changed by it. Final amended checks, full-suite comparison and neutral legacy-draft browser receipts are recorded in the review handoff.

The amended full-suite instrument matches the reviewer: MFA_TEST_DISPOSABLE=1, node --import tsx --test tests/*.test.mjs, with no integration environment loaded. Head: 1,329 tests, 1,266 passed, 41 failed, 22 skipped (exit 1). Its failure-name set is identical to the reviewer’s exact-base 41-name set: zero head-only and zero base-only names. These baseline environment/integration failures are not claimed fixed. A preliminary run retained two stale neutral-wording expectations; both were corrected and the final run above contains neither. Exact main-base PNG checks independently passed both English hash fixtures; the amended file passes those plus Japanese provider-free SVG naming.

The amended 598-key production build passed on one retry after the first build compiled but exited 143 during TypeScript checking without a build diagnostic. The interrupted log is retained; no cause is claimed. Both engines then passed the neutral legacy-draft wording check under English → Japanese → English: version 3, one retained file, no old message field, retry offered, and local drafts cleared. A sixth temporary fixture account was signed out and removed with all nine readback categories zero, cookie file deleted and password redacted; the amended-build app was stopped. The final Japanese draft screenshot includes surrounding English Home content that belongs to slice 4 and synthetic stored text.
