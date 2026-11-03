# Desktop follow-up after #460

Base: merged main `618cf7e8bbadf4e020b9590eeb66e6368591f8db`. This branch contains the owner’s desktop fixes, separately from test/lint PR #461.

- Days selected-day totals, its post rows, Today total and Today post rows use the same English grouping as the calendar cells: **34,811**, preserving unavailable and sub-one values through the shared formatter. Phone formatting is unchanged.
- Home keeps the feed at 500px. From 1024–1147px, a 16px gap and a Today column up to 280px fit the available space; at 1148px and above the original 64px gap and 280px Today column return. At 1024px Today is 204px. [Actual dimensions](checks.json) confirm no page overflow at 1024, 1100, 1147, 1148 and 1280px.
- Below 668px browser height, the capture scrim scrolls the complete 620px window instead of clipping it. At 1280×650, client height is 650px and scroll height 668px. Shutter, Choose files and close are reachable. The attachment sheet keeps its existing internal scrolling.
- Existing-post photo attachment keeps Choose from library visible on desktop; its actual browser file chooser opens with no webcam. No file was selected or uploaded.
- Profile retains Muse Spark Open under the header and Recently deleted before the grid, in the same order and shared components used on the phone. A desktop-only Saved meals bookmark is added beside the header actions; the existing global bookmark remains available. Phone Profile itself has no Saved meals button in this main revision; no phone control was moved to manufacture matching placement.

## Verification

Read-only Chromium against the local disposable backend from #461 (127.0.0.1:55449), with one explicitly synthetic ready meal holding 34,811 kcal. This is a formatting fixture, not a food-accuracy example. The local model switch uses a dummy fixture key. Tick is stubbed and service workers blocked. No production settings or data changed, no photo uploaded and no model called. The one local layout fixture is removed before cleanup.

[Checks](checks.json) record all five widths, both total displays, Profile controls, short-height scroll and the native file chooser. Screenshots were literally viewed: [Home](home.png), [Days](days.png), [Profile](profile.png), [short capture](short-capture.png), [attachment](attachment-picker.png). Local Next dev badges are visible and are not application controls.

[Phone comparison](phone-checks.json): Home and Profile are pixel-identical to merged main at 390×844, same local account/data/time-zone cookie; 0 changed pixels each. The capture change only alters the desktop visibility class; the short-height CSS applies only at width ≥1024px. This is not physical-phone acceptance.

Focused tests: `node --import tsx --test tests/nutrition-totals.test.mjs tests/days-summary.test.mjs tests/camera-frame.test.mjs` — **8 passed, 0 failed, 0 skipped**. Changed-file ESLint passes with 0 errors/warnings. Production build passes, including TypeScript compilation.

The browser driver made three mistakes, totaling approximately 36 seconds: it measured Today before mounting, attempted a shortcut before its listener was ready, and required an exact New post button name without its N key chip. Passed checks were retained; the final run checked only the outstanding capture controls. No failed observation is counted as a pass.
