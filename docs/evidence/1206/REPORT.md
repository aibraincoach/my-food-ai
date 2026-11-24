# #1206: explicit freeze reports

A person can open **Send freeze report** directly below Language in Profile, inspect the snapshot and send it once. Cancel sends nothing. Failures and the account rate limit are visible; reconnecting or reopening does not resend. Admin accounts can read the newest 50 on `/admin/freeze-reports`.

The device keeps only 20 fixed-enum technical events in its separate `mfa-diagnostics` IndexedDB database. Paths become fixed screen names before recording. Camera and update hooks only observe their existing decisions. Browser details (300 characters), build (80) and camera permission are captured only when the person opens the report. Send submits that immutable preview. No photo, meal/comment text, handle, URL or identity enters the event ring. The server derives the owner from verified Auth, and inserts with that person's client. The database repeats the event whitelist and serializes each account's 60-second cap; authenticated callers cannot read, update, delete or backdate reports. Admin reads happen only after the page's own role check, in addition to middleware.

## Verification

All actions used disposable loopback services, synthetic accounts and replies. No production reads or writes.

| Check | Result |
| --- | --- |
| Focused camera, hints, entry, i18n, update, schema, route and SQL-whitelist tests | 46 passed; the final validation-only subset of 8 also passed after input coercion hardening |
| Type checking, scoped lint, message validation, production build | passed; 209 matching English/Japanese keys |
| Original #1283 Chromium camera/update test | passed with original seen-hint setup and unchanged assertions |
| Original #1284 and #1285 WebKit tests | passed unchanged |
| Original #1287 auth, retained-field and clear-field tests | all 3 passed in each engine, unchanged assertions |
| Original #1320 fresh/seen camera and feed tips | passed in Chromium and WebKit; prior slice-2 WebKit 1-of-2 history is not rewritten |
| IndexedDB ring implementation | 20 retained, oldest dropped, invalid values rejected, identical after closing/reopening in both engines |
| Profile and preview, en/ja, both engines | placement correct, preview equals sent payload; no automatic requests through camera/navigation/background/kill/reopen; earlier events survive |
| Explicit send, en/ja, both engines | one POST and one stored row; actual caption, handle and fixture UUIDs absent |
| Failure, en/ja, both engines | 429 and offline visible natively; 500 visible, one request, no reconnect/reopen resend |
| Admin, en/ja, both engines | admin list renders; normal and signed-out visitors get 404; signed-out POST gets 401 |
| Final server validation, both engines | two concurrent requests yield 200/429; unrenderable date gets 400 |
| Exact 0077 on local database | rollback rehearsal, apply, own insert, cross-owner denial, read denial, timestamp-column denial, enum/privacy rejection and rate limit pass |
| Clean disposable database | all migrations including 0077 apply from an empty new stack; stopped afterwards |
| Cleanup | one fixture account; reports, auth, profile, posts, drafts, jobs, media, comments, storage and sessions all read back zero; local sign-out; six persistent browser directories (including IDB) removed |

The full repository suite was not rerun. Its previously reported environment failures are not claimed fixed here.

## Instrument limits and preserved failures

- Chromium's first H1 run used a fresh hint, and its original navigation-count assertion saw +1 same-document navigation. Only the initial document response existed; the composer and saved draft survived. The original seen-hint setup passed unchanged. Fresh and seen states independently passed the original #1320 test. Initial receipt remains preserved.
- WebKit's normal worker bypassed the 500 stand-in. Its third explicit send displayed the real 429, as the preserved screenshot shows. Only the 500 case uses a worker-blocked context (the previously accepted #1218 method). Offline and rate-limit proofs use the normal worker.
- The WebKit Japanese native run completed its product assertions, then exited nonzero because the browser container lacks `psql`. It was not rerun. Cleanup moved to the host. The separate WebKit admin attempt also had no product result before this setup fault was corrected; its host-managed run passed.
- The initial admin seed encountered the previous owned report's rate limit; it cleaned that report and was corrected to clear its own report before seeding. Runs are sequential.
- Existing tests needed two new import stubs (`sw-update-safety`, `i18n-document`); their assertions were retained.
- Final server hardening only rejects invalid timestamp/name inputs and classifies an unexpected storage exception as 500. Its targeted tests and build passed after the UI/regression runs; successful UI paths and the camera/update hook implementation did not change afterwards.

Receipts and raw scripts: `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/1206/`. Browser records, screenshots and cleanup readbacks are in its `browser/` directory. Script failures remain alongside corrected receipts. Synthetic cameras and Playwright WebKit do not prove iPhone Safari or real-phone behavior.

## Words

66 new `support` keys were drafted by the PM and independently double-read by the reviewer model. Seven approved corrections cover eight keys (58 originally passed as written). [Old and new wording](WORDING-CORRECTIONS.md) is recorded. Japanese has not been approved by a native speaker. Help text describes the actual fixed payload; no health or nutrition advice is added.

## Rollout — not performed

Migration 0077 is additive: only new objects. Per the PM's separate rollout ruling, after zero-blocker review and an explicit **exact-head step order**, apply 0077 to production first using the 0075/0076 preflight, transaction/timeouts, grants/readback, judge check and cleanup protocol; then merge that exact PR head; then one authorized judge Send/admin-list check. No production application or check is part of this local proof. Until the schema is present, Send fails visibly. #1206 remains open for that completion.

Admin means any signed-in account whose `profiles.role` is `admin`, as ruled by the PM. No production role count was requested or performed. #1190 and #1260 remain held.
