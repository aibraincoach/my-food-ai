# Reading screens: #1218 slice 4a

This slice translates the phone feed, post detail, comments, post menus, sheets, DayHeader and DayRings. It adds 304 keys (feed 42, post 81, postMenu 161, thread 20), giving 902 keys in each language. The eight existing first-use hint keys move unchanged from capture into hints. Fifty reading files now join the enforced translation lint scope. No package, migration or production change is included.

Base: 188cbd42b9a87691aa3840d36b4f0eff5d581c53. Plan pin: 92b265e2eadf3014aca2d0fce086eb79680ab1677e74efc398d219a9bc33183f, with the planner's later servings and comment-test rulings.

## Providers and formats

DeletePostSheet and PostOpenTransition are root siblings outside the route provider. A first-feed test caught their missing context. They now have a provider inside their existing Suspense, carrying full feed, post, postMenu and hints namespaces. These four namespaces ship on every page, including auth and shell. Minified UTF-8 JSON sizes are 12,056 bytes in English and 15,217 in Japanese; these are dictionary sizes, not measured HTTP or compressed transfer sizes. The whole capture dictionary is not passed to those root siblings.

The namespace graph now follows root siblings and named component imports. It fails on the old unscoped root and a root missing hints, and passes the repaired scope. Capture/reading providers also carry hints. FirstRunHint's dismissal behavior and translations are unchanged.

LocalTime now passes a required locale to formatLocalTime/formatLocalDate. DayHeader, DayRings, DeletePostSheet, EatenAtEditor and IntakeSheet use locale-aware dates/numbers. LogAgainSheet's formerly device-default clock and LocalTime's formerly device-default formats now use the selected app locale. Time zones stay unchanged. StoryPlayer explicitly passes en until slice 4b converts it. Energy, nutrient, micronutrient and portion helpers retain existing English precision, rounding and fraction glyphs.

PostDetailHeader uses one ICU servingAmount message. The quantity helper returns only amount/count; the unused English servingsText formatter is deleted. Fixed English/Japanese goldens replace that old helper as a test reference. The one English difference is outside the valid input range: zero formats as “0 servings” instead of “0 serving”; the minimum is 0.1. Valid UI states retain their English wording. Existing capture preset labels continue to use their slice-3 ICU messages.

## Japanese review and exceptions

The PM drafted 14 batches; the reviewer independently checked each batch and corrections were adopted. Batch sizes: 25, 25, 26, 23, 27, 20, 24, 21, 22, 26, 24, 27, 13 and 1 (304 total). Japanese has not been reviewed by a native speaker.

The accepted Recently deleted label is 削除した食事; slice 4b must use it consistently. Tea displays 紅茶, matching the existing black-tea reference; server-owned drink labels and values stay unchanged. Other teas are tracked in #1342. The Japanese save-photo hint avoids asserting an unverified iOS menu label; its English stays unchanged. Real iPhone wording is unproved.

The Japanese audit prints these exceptions, rather than treating stored or deferred text as translated:

- Selectors: [data-i18n-stored], [data-i18n-server-wording], .text-avatar and .text-avatar-sm. These identify stored captions, names, comments, handles/initials and read-time server wording deferred to slice 5. Prefilled stored input values remain data.
- Proper names: My Food AI, Coca-Cola, Open Food Facts, Open Database License, Muse Spark Open, Muse Spark 1.3 and AI.
- Units: kcal, ml, mg, oz, g, IU and kJ.

Thirty Japanese screenshots from Chromium and the timestamped WebKit walk all have a CSS width of 390 px. The scanner reports off-screen controls in horizontal day/photo strips; those findings are retained. Long Japanese lines wrap; the more link wraps after a held English summary, and long input placeholders elide. No layout redesign was made. Examples: [drink sheet](chromium-ja-drink.png), [caption editor](webkit-ja-caption.png).

## Validation

All browser checks use local synthetic accounts/data, scripted provider replies and 390×844 iPhone emulation. English comparison uses en-US/UTC, with service workers blocked identically on base/head and the same Realtime subscription/heartbeat fixture. Its final receipt verifies 20 acknowledged joins on each side and zero supplied data events. Earlier zero-join output was rejected. Only 12-hour clock values in the LogAgain text snapshot are normalized because Now changes between runs; its other text/aria and the other snapshots must match. Time formatting also has fixed goldens. Japanese reading flows use the normal worker. Explicit error fault contexts block the worker so the injected fault is deterministic.

| Check | Chromium | Playwright WebKit |
|---|---|---|
| English DOM text and visible aria labels against base | 15 states identical, plus empty feed | Head English states exercised; cross-build parity is Chromium's check |
| Japanese reading states and Latin exceptions | 15 pass, zero pageerrors | 15 text audits pass; original runtime receipt fails with one worker error; follow-up 15-state observation has zero pageerrors |
| Empty feed | Base/head English identical; Japanese passes | English/Japanese pass |
| Reconnect warning and tabs error | Six base/head/locale cases pass | Four locale cases pass |
| First-use hints | Fresh/seen camera pass; thumbs/thread pass | Four functional cases pass; eight access-control pageerrors recorded |
| Voice post and rendered result | English/Japanese pass, 830 rendered vs 830 API item calories | English/Japanese pass, same totals; synthetic microphone stream |
| Comment send | English/Japanese pass; one request per action, including Japanese double-tap; exact IDs verified in DB | Same checks pass, zero comment-run pageerrors |
| Offline Japanese shell opens Japanese capture | Pass, normal worker, no missing-message error | Pass, normal worker, no missing-message error |
| #1283 worker update while camera live | Pass; draft survives, API responds, no capture reload | Existing gate uses Chromium |
| #1287 text preservation / cleared text / isolated tab | Three pass, zero pageerrors | Three functional passes; clear-text receipt records four access-control errors |
| #1285 failed frame | Existing gate uses WebKit | Frame recovery passes |
| #1284 page return | Existing gate uses WebKit | Synthetic persisted page-return passes |

The separate #1321 modes-tip persistence observation is not changed. The #1320 seen-camera timeout did not recur in this WebKit run. This does not close #1338. The offline case is one acceptance pass, not the ten-pass/definite-cause proof required to close #1340; it remains open.

WebKit access-control errors remain unresolved in #1343. The original reading run recorded one sw.js pageerror; the single authorized timestamped Japanese observation recorded none (1/1 then 0/1). No base or further reading rerun was performed. The first-hint and clear-text receipts also contain background RSC/REST access-control errors without lifecycle timestamps. They are functional passes with disclosed runtime observations, not clean runtime passes. Worker/registration code is unchanged by this slice; interrupted-fetch/teardown is a lead, not a proved cause.

Comment-test history is retained: the first Japanese hit-test failed, one observation passed, and the cause is unproved. A guard that did not scroll failed with Send below the viewport (y1082 in an 844px viewport); the composer is inline by design. The final approved setup scrolls Send to the center, waits two animation frames, then requires opacity, viewport bounds and a successful hit-test within ten seconds. Persistent coverage still fails with geometry and the covering element recorded. Assertions remain. Unique fixture payloads avoid matching a comment from an earlier attempt. Final fresh-fixture sends pass in both locales/engines; the two original successful comments and the final successful pairs were checked by exact ID. No product layout fix was made.

Other failed setup attempts are retained: an ambiguous menu locator, snapshots before the question strip/profile identity loaded, an unavailable local Realtime service, a direct /shell offline URL that the worker does not intercept, and locally terminated app services. Their corrected setups retain the original assertions. First-hint feed checks use the original single-meal fixture so another card cannot claim the one-time hint.

## Unit and build checks

TypeScript, strict 902-key validation, namespace checks, scoped lint and a fresh guarded production build pass. Lint has zero errors and five existing warnings. Focused locale/format/namespace/hint checks pass, including planted literals in every reading lint target and 0/1/2 plurals in both languages.

The feed/Days run had 90/97 passes; its seven stale Intl/source-fixture failures then passed in their original files. The remaining converted-consumer run had 99/117 passes; its original 18 failures now pass in the original nine files (24/24 including six already-passing tests). Later servings-only checks pass after the unused formatter is removed. No replacement tests or removed assertions are claimed as those original passes. [The assertion audit](assertions.md) lists all 18, old/new static assertion counts and every changed servings assertion/source-anchor line. Seventeen retain their counts; the servings source-contract test increases from six to nine call sites, adding fixed English/Japanese goldens.

No full-suite green result is claimed. The new browser fixtures enforce disposable loopback configuration and synthetic fixture ownership. Core setup/cleanup remains in tests/fixtures/capture-acceptance.mjs; reading-acceptance.mjs extends it or soft-deletes its owned meals for the empty state. reading-comment-check.mjs checks the exact successful IDs. Browser module/executable paths and local stack environment follow docs/testing.md. Always clean the core fixture and read back absence after a run.

Every owned fixture was locally signed out and deleted, with zero readback for auth users, profiles, posts, drafts, jobs, media, comments, storage and sessions. All owned app/model/proxy services were stopped. The shared stack was left intact.

Playwright WebKit is not Safari. Real-device camera, microphone, keyboard, scrolling, menu wording and regional nuance remain unproved. No production action or native-speaker approval is claimed. Browser acceptance used only scripted local providers.
