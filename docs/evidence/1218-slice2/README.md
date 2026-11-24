# #1218 slice 2 local evidence

137 keys per language: six Language keys and 131 new front-screen/card keys. AGY supplied the earlier 28 (Language6 plus two11-key batches), the PM drafted109. Every accepted batch had an independent model double reading; two PM keys were corrected and re-read. This is not native-speaker approval. No additional AGY calls were made after the bounded failure rule stopped that route.

Auth, About, not-found/error wording, navigation and the live card use the language files. Root html language and phone default switch on with these screens. Anonymous Welcome/root and shell copies are language-keyed; missing copies use the network, never the other language. Stored PNG rendering explicitly remains English until #1220. Other Home/Days/Profile and capture wording remains for later slices.

## Results

- check:messages:137keys, strict key/ICU parity, no English per-key fallback; translated-scope lint passes.
- Both final app builds, TypeScript and145 focused tests pass (69 focused,41 auth/desktop related,2 captcha,2 PNG,31 worker-cache; separate files, no repeated-count sum).
- Broader src lint has3 pre-existing errors: PostOpenTransition setState-in-effect and2 fixed-text errors in unconverted ui/Sheet. The same3 are reproduced on base; these unchanged files are outside this slice. Ten warnings on head. Do not call broad lint clean.
- English visible text and visible aria labels match the base in Chromium and WebKit on Welcome, sign-in, sign-up, reset, new-password, not-found, About and a ready meal; shell comparison covers the converted bottom navigation. Base tree dcf2e011 has empty diff against main d5b86946.
- Both languages and engines: Welcome/email, wrong-password banner, provider Coming soon, reset form outcomes, taken-handle error/Choose-a-handle recovery, and + menu. Local Auth confirmation off; no mail-delivery proof. First English reset accepted, later requests returned a localized failure under local throttling; not counted as delivered mail.
- Japanese screenshots and overflow measurements at390px: no overflow found on checked front screens, About, card or menu. Actual HCaptcha component SSR paragraph with a local fixture key, SDK omitted, assembles naturally without fragment gaps;350px content width inside390px fits in both engines. Policy links still target hCaptcha. Normal local Auth runs do not enable the external CAPTCHA SDK.
- Anonymous en/ja Welcome/root offline both engines: correct language; deleting matching copies produces a network failure, never the other language. Root first-response lang/default and explicit English override checked. Home content outside converted controls remains English.
- English sentence goldens cover9 cases; two1080px stored PNG hashes are byte-identical to main. No stored card/data rewritten.
- #1283 original Chromium scenario: B activated41ms; fetch200; draft survived, no reload under capture, reload at safe close.
- #1284 WebKit synthetic frame-timeout test and #1285 WebKit synthetic page-return test pass. These are stubs/events, not hardware or actual BFcache proof.
- #1287 original auth/comment/hidden text/Back/new-start/clear tests pass in both engines, with main-document responses/boot counters. Only fixture paths, ports and credentials changed; assertions retained.

## WebKit #1320 mixed receipt — review decision required

|Run|Result|
|---|---|
|First head run|Fresh camera passes; seen-camera video readiness times out. No cause found.|
|One planner-approved observation on head|Fresh and seen camera, thumbs and thread all pass. No failure-time snapshot because timeout did not recur.|
|One valid base comparison|Fresh/seen camera and thumbs pass; separate thread-hint saved-state assertion fails with local access-control errors.|

No camera fix was made. The initial head timeout is unexplained; the gate is not described as clean WebKit. PM accepted disclosure for submission and asks the reviewer whether this1-of2 receipt blocks merge. There is no rerun loop. Chromium passes all original fresh/seen camera and feed tip cases. Real-phone behavior and iPhone Safari are unproved; Playwright WebKit is not Safari.

## Instruments and cleanup

Initial DOM snapshots read streamed Loading states and pending client identity/hints; corrected to await the exact rendered targets. One shell locator was ambiguous and narrowed to the converted nav. The first auth-recovery locator matched a hidden retained form, corrected to visible fields; fresh synthetic emails were ledgered. A host Chromium path had moved; WebKit uses the existing container because host libraries are absent. Loopback JWTs expired before fixture creation; renewed locally, both builds use the same keys. Local server/runner exit143 interrupted cases; connection-refused/partial receipts kept and only interrupted cases restarted. These were not called product defects.

All8 ledgered disposable accounts (7 original plus1 isolated menu fixture), their meals/reservations/drafts/media/comments/jobs/storage and Auth sessions were removed and read back zero; local primary session signed out. No production action for this slice. The isolated menu check waits for all labels to finish animating and verifies they fit390px in both languages/engines; the early screenshots are retained. Raw results/screenshots, translation hashes/review receipts and cleanup.json are retained in the build evidence store under1218-slice2. Console reports include local WebKit access-control/WebSocket noise, not attributed to a product cause.

Held source wording is listed in held-wording.md; it stays unchanged in this pure-conversion PR and is approved for a separate #1243/#1253 follow-up. Card data paths and stored-text limits are in card-paths.md.
