# Days heading follows the visible calendar

Main 31257482a41e193280e398dd623c9760b1307bd8 names October on a short, unscrollable October–November calendar opened on real 24 November 2026. With June–November loaded, the bottom position names September, and the middle position also names a month above the midpoint. These findings replace the earlier assumption that only opening needed a guard.

PM option B (20:53Z), plan 7edd7b4772c9add96427a4659e0a7cbab61026d916f6b09075a67367eb64f4c2: replace the old rule. A calendar at its bottom (within one pixel), including a short calendar, names the current month. At the top it names the first loaded month. Otherwise it names the month whose rows contain the midpoint between the sticky header bottom and viewport bottom. There are no input flags, layout changes or additional timers. The same function runs on mount, scroll and resize. DesktopDays is unchanged.

## Browser evidence

Local synthetic meals and accounts, real server date, both English and Japanese. Phone viewport 390×844. Chromium uses emulated iPhone with CDP touch; WebKit uses the full iPhone 13 profile with programmatic scrolling. Neither proves physical touch or Safari.

| Check | Main | Head |
| --- | --- | --- |
| Short calendar names November | fails both engines/locales | passes |
| Loaded history bottom names November | fails both engines/locales | passes |
| Middle position names containing month | fails both engines/locales | passes |
| Month chooser selects June | passes | passes |
| Upward scroll shows every month in order | prior rule retained as observation | November, October, September, August, July, June in both engines/locales |
| Older-month insertion anchor | September 1 at 76 px, scrollY 47→287 | identical in both engines/locales |
| Desktop 1280 px current/previous/current headings | correct | identical, a no-regression check that cannot fail main |

Raw private evidence: state/build/1347/browser. Chromium comparison: chromium-base-rule.json and chromium-head-rule.json. Full-mobile WebKit baseline: webkit-base-mobile-60px.json; head: webkit-head-rule.json. Baseline's 60-pixel upward steps and head's 20-pixel steps differ only in sequence sampling; the three compared positions use the same setup. Base results explicitly record failed expectations; an observation runner exiting successfully is not a claim that main passed them. Older anchors are in each engine/build's *-anchor.json.

Retained harness observations: mobile WebKit rejects native wheel input; viewport-only wheel runs do not count as the full iPhone proof. The first settle helper reused a previous stable signature; resetting it for every gesture corrected both sides. A 60-pixel programmatic step can jump across July's narrow interval near the top, so the full-mobile head uses 20-pixel steps. A MutationObserver records headings between settled Chromium snapshots. A later redundant WebKit baseline attempt stopped before measuring positions because a strict day locator matched two responsive nodes; the completed full-mobile baseline above stands, and this stopped receipt is retained. Main's history opening timing variation is also retained. No product changes were made for those observations.

## Regression and cleanup

139 targeted unit tests pass, including seven new heading-rule cases and existing feed/Days, capture-entry, camera, first-hint, update-safety, unsent-text and voice-lifecycle tests. TypeScript passes. Scoped ESLint has zero errors and one existing effect-dependency warning. Guarded production build explicitly exits zero; message check reports 1,090 keys in each locale. This is not a full-suite green claim.

Comments pass in both locales/engines; four exact IDs, owner and bodies match database readback. Voice transcription through the real local route to a scripted loopback provider renders ready in both locales/engines; four exact owned post IDs, stored captions and calories verified. No external model/provider calls.

First-hint four functional cases pass in each engine, including the seen-camera case. WebKit records 13 access-control errors (seven RSC, six local PostgREST); no exclusion or rerun for those errors, and no runtime-clean claim. They are disclosed on #1343; the runner lacks per-error timing/navigation, so cancellation is unproved. Earlier hint attempts on calendar accounts passed camera cases but failed the thumbs fixture because newly created voice posts preceded its target meal. Dedicated single-meal accounts corrected the fixture setup; both original failures remain.

Existing update/capture recovery gates: H1 update activates in 131 ms with no capture reload, retains the draft, and reloads on safe close. WebKit H4 frame timeout shows its existing error and restores controls; H5 synthetic persisted page return closes the menu. Text update auth/clear/isolated cases pass in both engines using the unchanged assertions and local A/B worker probe. These are synthetic update/media fixtures, not real camera, BFcache or release-deployment proof.

All four owned disposable accounts cleaned with readback zero for auth, profiles, posts, drafts, jobs, media, comments, storage and sessions. Owned app servers, model stand-in and update proxy stopped. Shared local stack retained. #1343, #1338 and #1340 remain open; no fixes for them are included. #1218 remains open for language slices 5 and 6.
