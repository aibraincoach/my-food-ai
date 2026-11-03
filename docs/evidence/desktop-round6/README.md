# #413 — Round 6 desktop evidence

Implements the [supplied plan](../../plan-desktop-round6.md), from main `63f9e817e4d8055ab7c7c336a9edf99706875ebf`. The source archive is `uploads/My Food AI app design (3).zip`; extracted source and rendered reference frames remain in ignored `uploads/design-round6/`. Chromium 156, 1280×800, designated test account 1, local Next dev. These are layout and interaction checks, not latency or physical-camera acceptance. No production setting, CAPTCHA, schema or environment was changed.

| Frame | Implementation / actual screenshot |
| --- | --- |
| 6a | [Home](6a.png): 240px sidebar; only New post is dark; 500px feed and sticky 280px Today with 64px gap. Day rules replace phone headers. First post has ink focus; J/K and Enter navigate. |
| 6b | [Post window](6b.png): centered 1000×680 overlay, 640px photo and 360px record column; actual decoded photograph and stored outlines. [Existing item editor](6b-edit.png) opens above it. Live record, nutrients, comments and pinned action/composer area remain. Arrows change slides; J/K and outside buttons step posts; Esc/scrim close; `?post=` retained. |
| 6c | [New post](6c.png): 960×620, 600×450 camera view plus mode strip/shutter, 360px file zone. Webcam/Upload switch removed. Space captures; file selection, drop, paste and denied-camera fallback passed. The fake camera is visibly synthetic. |
| 6d | [Days](6d.png): one month, 100px cells; today outlined, selection filled; previous/next month; 340px full-height day panel and bottom Open the day. Arrow selection and Enter/Esc checked. Phone month list unchanged. |
| 6e | [Search](6e.png): 720px column, Esc chip/count, 128px thumbnails, inline item/portion/nutrition rows. Down/Up, Enter and successive Esc clear/leave checks passed. |
| 6f | [Profile](6f.png): 820px column, 88px avatar, agent/sign-out buttons, three-column grid. Grid arrows and Enter open the same post window. [Agent setup](agent.png) is centered at 480px; no token was created. |

Account-name text is made invisible in committed screenshots, preserving its layout space. No signed request URLs or sessions are committed. Reference and app images were literally viewed; live records differ from the designer's example records. Frame 6b's actual reference uses a 640×680 photo area; that governs its geometry rather than interpreting the plan's “640px square” literally.

Two existing controls are deliberately retained and flagged for the owner: Saved meals remains beside the sidebar title although the reference omits it, as the setup asks to preserve it; the Muse Spark Open setting remains below the Profile buttons, since removing it would remove the judge's model switch. Recently deleted remains available as well.

## Verification and limits

- TypeScript `npx tsc --noEmit`: passed.
- Focused real regressions: `node --import tsx --test tests/feed-cache-lifecycle.test.mjs tests/feed-photo.test.mjs tests/camera-frame.test.mjs tests/camera-flip.test.mjs tests/comment-label.test.mjs tests/nutrition-table.test.mjs tests/search-drink-summary.test.mjs`: **23 passed, 0 failed, 0 skipped**.
- Full `node --import tsx --test tests/*.test.mjs`: **500 passed, 56 failed, 13 skipped**, on both main and branch, with identical failed test names ([comparison](unit-comparison.json)). No new skips. This is not an all-green suite. These counts use TS loading and therefore differ from README #444's historical bare-Node run.
- `npm test` cannot run: main has no `test` script. This branch does not redefine that gate or repair unrelated unit failures tracked by #450.
- Full `npm run lint`: **2 errors, 6 warnings**, matching the documented baseline. Errors remain in PostHandle and PostMenu; no lint-rule waiver was added for them. New private/local images retain the existing direct-image policy.
- [Phone comparison](phone-comparison.json): all six routes show **0 changed pixels** at 390×844. Live camera video was masked in both captures. Home's first differing values were a time-zone-cookie race; the corrected same-cookie repeat is the comparison used. No physical-phone acceptance claim.
- [Capture controls](capture-checks.json): no-camera, Space, file input, drop and paste passed. Four POST attempts were intercepted with a controlled 429 before the backend to test layout without creating fixtures. **0 backend posts, 0 model requests**; this is not successful posting acceptance. No storage objects were uploaded and no agent token was created.
- Browser tick responses were stubbed and service workers blocked for these layout checks. Actual API readers supplied Home, Days, Search, Profile and detail data; no successful post response was invented.

The initial browser driver waited for network idle on a polling feed and was corrected. An item-editor heading selector unnecessarily waited 20 seconds twice; actual nested-dialog checks passed, the 40-second waste was reported to the owner, and the reproducible runner now uses the dialog's actual “Edit meal item” label. A later snapshot rejected a not-yet-decoded detail photo; only the decoded-photo capture above is used. Generated dev files are excluded from the PR.

Reproduce keyboard/layout checks with `scripts/verify-desktop-round6.mjs`, a local signed-in test environment, `PLAYWRIGHT_MODULE` pointing to Playwright Core's `index.mjs`, and `CHROMIUM_EXECUTABLE_PATH` pointing to Chromium. `ROUND6_ORIGIN` defaults to `http://127.0.0.1:3100`; outputs go to ignored uploads. It never submits Post. Build, preview, issue comments and cleanup receipts are appended after completion.

Production build: `npm run build` passed (exit 0). The final code additionally keeps the chosen day and its panel when Escape returns from a desktop day story. The global baseline unit/lint gates remain unmet and tracked separately.
