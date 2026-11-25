# Local measurements of updates held by unsent text

These are bounded laboratory observations, not production latency estimates. Chromium kept updates pending while text remained in visible or retained hidden fields. Clearing a Search query, or a failed sign-in that cleared its fields, let the next simulated hidden event release the update. A restart loaded the new build without an extra guard reload.

The matrix is **incomplete**. Some instrument actions failed, one case was interrupted by the builder, and WebKit did not deliver an update-ready message in the pending-update setup. Unavailable values below are not passing results or measured hold durations. The PM decides whether another measurement packet is useful; this filing implements no fix.

## Setup and bounds

- Product source: `4cdaaa526ca54c2641e0c358e8ddf42294e6563e`, identical in both local builds. The update, Auth and diagnostic source is unchanged in main `7ef136cda8d7fcab8971f88079ad1254b984578b`.
- Two optimized builds: A `local-1795601146842`; B `local-1795602198292`. They share the local Server Action key and IDs, avoiding an unrelated Auth build mismatch. No key is published.
- Chromium and emulated iPhone WebKit at 390×844; one local fixture account and meal, plus fixture sign-up attempts. No model calls, production data, telemetry or field contents were collected. The manual runner is [update-hold-1310.mjs](../tests/browser/update-hold-1310.mjs).
- Real worker installation, activation and messages; no injected `app-update-ready` event. Only the local realtime transport was scripted. Visibility changes were simulated DOM events, not real OS backgrounding. Autofill was simulated by setting native input values, not a password manager.
- Each case was capped at two minutes. One instrument-corrected repeat was used for Chromium M0; the original is retained beside it. No other case was repeated. Some later cases stopped before the cap on an action error.
- Corrected runs pin a document's non-navigation requests to its original build; worker checks and full navigations see the deployed build. This **version affinity is a lab assumption**. Production Vercel skew protection or equivalent routing was not checked.
- M0/M2 use 20 screen changes between Home and Search, not 20 distinct cached routes. The measurements do not test eviction under 20 distinct route keys.

## Results

Times are from the app's own persisted diagnostic `waiting` to `reloading` events where both exist. They mostly reflect when the script took the next action, not a scheduled delay. A lower bound uses the last observed `deferred` event; it does not include time after leaving the measured document.

| Case | Engine | Safe moments / observation | Release and measured time | Status |
|---|---|---|---|---|
| M0 original | Chromium | Switching the whole upstream caused a new document on the sixth screen change; the worker was discovered afterwards | A later route safe point reloaded, 79 ms after waiting | Confounded instrument result; not uninterrupted client navigation |
| M0 corrected | Chromium | 20 client screen changes and simulated hide: 0 document boots, 0 worker checks, 0 update-ready messages | Explicit full load loaded B and requested B worker bytes; `found` recorded | Navigation sequence measured; activation was not seen in the brief post-load sample |
| M0 | WebKit | Same 20 changes and hide: 0 boots, 0 checks, 0 update-ready messages | Explicit full load loaded B and requested B worker bytes; `found` recorded | Same bounded discovery result |
| M1 visible comment | Chromium | Visible comment deferred on hide; retained hidden comment deferred on route change | Still deferred at least 777 ms after waiting; saved-sheet and clear sequence not completed | Partial: action error; exact cause not established |
| M1 visible comment | WebKit | Update check started, but no page update-ready message or `waiting` diagnostic within the 120 s cap | Not available | Pending-update setup unavailable; not a 120 s text hold |
| M2 retained comment | Chromium | Hidden, nonempty comment remained at all 20 transitions; route checks deferred | Deferred through 3,268 ms after waiting; clear-and-release not measured | Partial: Back loop missed restoration and reached a blank document; its later tail is not a hold measurement |
| M2 retained comment | WebKit | New worker installed, activated and changed the controller; no update-ready message or `waiting` event within cap | Not available | Pending-update setup unavailable |
| M3 simulated autofill | Chromium | Nonempty email/password deferred on hide. Failed sign-in cleared both fields; next hide released | 492 ms | Failed-sign-in branch measured. Successful sign-in happened after release, so it has no pending-update latency result |
| M3 simulated autofill | WebKit | Signed-out setup also reached worker activation and controller change, but no update-ready or waiting event within 120 s; page-side manifest build probe returned null | Not available | Pending-update setup unavailable |
| M4 taken handle | Chromium | Browser was stopped by the builder while diagnosing the preceding case using stale process state | Not available | Invalidated by operator interruption; no repeat |
| M4 taken handle | WebKit | Not attempted after pending-update prerequisite failed in signed-in and signed-out setup | Not available | Unmeasured |
| M5 Search query | Chromium | Query deferred while visible and retained hidden; Back, clear, then hide released | 678 ms | Measured |
| M5 Search query | WebKit | Same unavailable prerequisite | Not available | Unmeasured |
| M6 restart | Chromium | Visible comment deferred before closing the persistent context. Reopening the same storage loaded B on Home | Initial navigation (`navigate`), B manifest, no extra guard reload | Measured; not a `waiting` to `reloading` duration |
| M6 restart | WebKit | Same unavailable prerequisite | Not available | Unmeasured |

M0's answer is narrow: no worker check was observed during the uninterrupted 20-change sequence. A full page load performed a check and loaded B. This does **not** prove a browser can never discover an update while left open; browser background scheduling was not observed.

The Chromium successful-sign-in step retained nonempty hidden Auth fields, but its earlier failed-sign-in step had already released the pending update. Those booleans support a source-based concern about a *future* update, not a measured successful-sign-in delay. The current taken-handle path is `/choose-handle`, not the historical three-field sign-up form; this packet did not complete that case.

## What can hold indefinitely: inference, not a long observation

[ServiceWorkerRegistration](../src/components/ServiceWorkerRegistration.tsx) checks visible and hidden fields through [hasUnsentText](../src/lib/sw-update-safety.ts). Its safe points are a hidden event, route change, sheet close and entry close. There is no timer-based release. While nonempty editable fields remain, those checks defer. Clearing or removing the fields, then a safe point, can release; restarting loads the deployed document normally. Pending photos, dialogs and live camera tracks are separate blockers and were not varied here.

“Held for days” is therefore an inference from the release rules, **not an observed duration**. No hours-long run or observation window was started. Real Safari/iPhone behavior and production version affinity remain unproved.

## Instrument failures and evidence

The original M0 mixed client navigation with deployment skew. Its corrected repeat isolates worker discovery with the affinity assumption above. Chromium M1's action error is only classified by error name in its first receipt, so its precise cause is not asserted. Chromium M2's Back instrumentation missed the route-restoration point; later first attempts use frame settling and a finite history bound. The Chromium M4 interruption was the builder's error, not an app failure. These rows must not be converted into successful tests.

WebKit M1/M2 did not establish the pending page state required to measure text release. M2 records worker states through `activated` and a controller change, without a page message. The cause is not established and no product fix is proposed as proven. The signed-out M3 result repeats activation/controller change without a page message, and its page-side manifest build probe returns null. That does not establish why the worker did not notify the page. Remaining WebKit M4–M6 were not started because the prerequisite failed on both page types; they remain explicitly unmeasured.

Raw receipts, commands, build logs and cleanup readbacks are retained in the local proof folder `state/build/1310-update-hold/`. It contains the original/corrected M0, per-case diagnostic timestamps, field-presence booleans, and explicit invalid/unavailable rows. The script stops after an incomplete case; later processes were used only for cases not yet attempted. No automatic case retry is implemented. A receipt's `completed` flag means its runner returned; it does not override the missing-step flags or the partial/invalid classification in this report. The final runner makes a missed comment-restoration step fail visibly and records when the update was already released before the successful-sign-in branch; those diagnostic refinements were not used to repeat earlier cases.

## Proposed follow-up, for PM decision only

1. Establish why this WebKit laboratory update reaches activation without a page update-ready notification before measuring its text holds.
2. If useful, authorize a new small packet for the unavailable comment-clear, taken-handle and successful-sign-in branches, with a separately bounded instrument review.
3. Keep the no-timer policy unchanged unless the PM chooses a product change. These short measurements do not justify weakening protection of unsent text.

No change under `src/` or `public/` is part of this packet. `node --check` and ESLint pass on the manual runner; `git diff` shows no product changes. The single fixture account and owned Auth/profile/posts/drafts/jobs/media/comments/storage/sessions read back zero. Both app servers and proxy listeners are stopped, all run profile directories (including diagnostics) are absent, and copied credentials/env files are removed. Some cap-hit rows could not clear IndexedDB in-page; deleting their owned profiles removed those stores. The shared backend was preserved. This report does not close #1310 or claim a complete matrix.
