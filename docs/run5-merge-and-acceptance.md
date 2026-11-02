# Run 5 merge and production acceptance report

Observed November 1, 2026, 15:19:11 UTC: main and production are `f095afe545a2be099ba6f2fca0b216d273db56e0`, READY, alias confirmed, health 200. #269 merged at the owner's exact head, then docs #266 merged last; #258 closed as superseded. The owner ordered the fleet closed and all subagents completed. [Final execution receipt](https://github.com/aibraincoach/my-food-ai/pull/266#issuecomment-6558350575).


Owner execution order received 2026-11-01. This report supersedes the pre-merge status in [run5-execution.md](run5-execution.md). The original plan remains unchanged.

## Wall of Stupid

The exact owner-supplied row was inserted first in the table and pushed in `fd4563ac87b68623117fbd931deea030beba2df1`. Docs PR #266 subsequently merged last under the owner’s explicit exact-head order.

## Full-suite gate before the first merge

All **126 discovered test files** ran on integrated head `b5410deb098cc4d6924a8e4296f093fc7203accb`: **347 tests passed, zero failed, zero skipped**, in 233.509 seconds. The Node runner exited zero. This completed before #259 merged. The built HTTP application used the integrated runtime code (the final head added only test-fixture repairs after that build), the configured database/test accounts and a separate disposable local PostgreSQL database for the two local-only SQL cases. Barcode, label ownership and drink HTTP cases ran against the local production build; the asynchronous post-to-ready test also used that build. This is a full-suite result, not an extrapolation from the earlier 48 targeted tests.

Command: `ALLOW_SHARED_DB_TESTS=1 LOCAL_TEST_DB_URL=<disposable local database> APP_URL=<local production build> node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/*.test.mjs tests/db/*.test.mjs`.

Private full-log SHA-256: `e66b868fec79430c67f6c6711145e0975df988ca34f751ce68ecf50c9258bcec`.

The first diagnostic run had 347 tests: 323 passed, 19 failed, five skipped. The broader run exposed stale fixtures for saved-meal completion, timezone/hydration reads, feed pagination/revision, photo arrays, upload-draft cleanup and the new remainder registry entry. Other failures were unconditional migration replays after the authorized schema installation, an obsolete offline FDC cache format/missing matcher-protocol fixture, and one database connection timeout. The fixes retain data/access assertions; no failing case was disabled. All five former skips ran in the successful full run.

The offline matcher response is explicitly **scripted** and selects no nutrition reference. It is not represented as a recorded real-model answer or nutrition-accuracy proof. The unchanged real-model gates and matching tests in the earlier report remain separate evidence.

## Owner-directed label fix

[PR #267](https://github.com/aibraincoach/my-food-ai/pull/267) removes the runtime quota RPC and its 429/503 gate. Label reading has no six-per-minute cap and never queries quota storage. Authentication, owner-scoped photo paths, photo opening/size checks and server-held label nutrition remain enforced. The historical quota table/function remains inert; no alternative limiter, dependency or environment variable was added.

Seven consecutive authenticated HTTP reads through the actual local production build and actual storage/database returned 200 and the recorded fixture's 230 kcal. This is an offline-model protocol/availability check, not seven real-model accuracy trials. Created reading rows and fixture storage were removed afterward.

The source head received [Gemini 3.8 Flash BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/267#issuecomment-6556995338) on exact `b5410deb098cc4d6924a8e4296f093fc7203accb` through the repository PPLX review skill. Its final tree-identical dependency merge `154f2f8f410516f0f3a41ed647c4385788335c08` received [its own confirmation](https://github.com/aibraincoach/my-food-ai/pull/267#issuecomment-6557187001). No prompt/client change was introduced by #267.

## Schema and merge execution

Migrations **0025, 0026 and 0027** were applied with psql in numeric order, each transaction committed successfully and the API schema reloaded. All were applied before their corresponding PR merges; the catalog confirmed corrections, saved meals, not-eaten fields and the attachment function. The final full-suite data/access tests used these installed functions inside rollback transactions.

| PR | Reviewed head actually merged | Merge commit |
| --- | --- | --- |
| [#259](https://github.com/aibraincoach/my-food-ai/pull/259) | `8135e33d48368b8c1af1823d59d9ef1a538836df` | `8ea31075bdd8d6c93c8390253b18b373eb5bad94` |
| [#260](https://github.com/aibraincoach/my-food-ai/pull/260) | `d78ce82fe72e0f7298ef4d05f469d1a71bbb5b92` | `8902e7446adb3eda807244a307a50547f681f72a` |
| [#261](https://github.com/aibraincoach/my-food-ai/pull/261) | `8a8f27b453534e9bdd4d1f4f6c240a0ea59bee6c` | `09e2e68a21def6dc2221ddce4ae5317e5130614c` |
| [#262](https://github.com/aibraincoach/my-food-ai/pull/262) | `c479f5f6ff290b692c418453d066737916d1165b` | `078861cde970fb2c1f835fddd9fb01ee2ea2816c` |
| [#263](https://github.com/aibraincoach/my-food-ai/pull/263) | `e68c45e50a1e2ee8e429bf2aced5a2231048790d` | `dd2951fb50b14742a911e982924002ecc96707d6` |
| [#264](https://github.com/aibraincoach/my-food-ai/pull/264) | `10bf343bce44ec40998038dc62471900663b900e` | `dd66a34c7405b7f0552c7d3a895ef59b408c8583` |
| [#265](https://github.com/aibraincoach/my-food-ai/pull/265) | `a4ad37472693e9bc2e5586048975187002881dcd` | `ea703aafd32c071b87c070eab5a6abadab020535` |
| [#267](https://github.com/aibraincoach/my-food-ai/pull/267) | `154f2f8f410516f0f3a41ed647c4385788335c08` | `e442cef68b6418228a6da26b8466e16735c495f7` |

#259–#265 merged in ascending order, then #267. Every merge used a merge commit after exact-head review, clean mergeability and successful checks including Vercel. #262 required a union of its correction listener with shared navigation; #263 combined saved-meal, GTIN and timezone fields. Their changed heads received fresh same-reviewer confirmations. #264/#265/#267 then propagated those reviewed integration commits without changing their file trees; their new exact heads also received confirmations. No rebase, amend or force push was used.

Main after #267 is `e442cef68b6418228a6da26b8466e16735c495f7`. Its entire tree is exactly `2a8d8f2b9539ae872a95a0845f8144f5f85e4a61`, identical to full-suite-tested `b5410deb098cc4d6924a8e4296f093fc7203accb`; `git diff b5410de origin/main` was empty. The merge phase introduced no untested source difference.

## Production acceptance and the defect fix

The complete initial Run 5 deployment `e442cef68b6418228a6da26b8466e16735c495f7` was READY, its production alias confirmed and health 200 at 11:16:14 UTC on November 1. All checks used the designated test account in Chrome at 390×844; no screenshots were stored. Physical phone/camera proof is not inferred from emulation.

| Check | Production result | Issue evidence |
| --- | --- | --- |
| a — Home map | PASS. Home-first pill on Feed/Search/Days/Profile/detail; camera, composer, barcode, story and sheet exits verified. | [#219](https://github.com/aibraincoach/my-food-ai/issues/219#issuecomment-6557516660) |
| b — short nutrition | PASS. Feed summary and four detail cells agree; Show all 22 opened 22 rows and Show less closed them. | [#220](https://github.com/aibraincoach/my-food-ai/issues/220#issuecomment-6557516661) |
| c — hydration | Initial soup FAIL, then PASS after #268. Water 330 ml and coffee 240 ml/95 mg caffeine passed initially. Final soup showed 350 ml water and 1,300 ml day intake. | [#214](https://github.com/aibraincoach/my-food-ai/issues/214#issuecomment-6557555918) |
| d — correction/rescan | PASS. Actual emulated-camera decoding, correction UI and a second scan retained the corrected name and original nutrition. | [#213](https://github.com/aibraincoach/my-food-ai/issues/213#issuecomment-6557516622) |
| e — missing code/label | PASS. Genuine missing code → label action → real FDA label read → ready 55 g/230 kcal post with photo and PNG. | [#212](https://github.com/aibraincoach/my-food-ai/issues/212#issuecomment-6557516659) |
| f — saved coffee | PASS. Two taps from the saved sheet at Now, plus an earlier-day copy; exact nutrients, intake links, 95 mg caffeine, correct local day headers and PNGs. | [#172](https://github.com/aibraincoach/my-food-ai/issues/172#issuecomment-6557516645) |
| g — Not eaten | PASS for transport/bounds/history. 798 kcal original → 53.9 kcal consumed, 744 kcal Not eaten footer; both versions and labelled photo retained. | [#195](https://github.com/aibraincoach/my-food-ai/issues/195#issuecomment-6557516648) |
| item 6 — attach photos | PASS. Menu meal-photo attachment then dashed-slide Not eaten attachment; three preserved estimates, 327.3 kcal final, 1,042 kcal footer, 130 ml food water. | [#173](https://github.com/aibraincoach/my-food-ai/issues/173#issuecomment-6557516650) |

### The soup defect and #268

The initial soup selected branded FDC 1930363 at 184 kcal. Both the stored record and full USDA detail genuinely lacked water nutrient 1051. Investigation found FNDDS 2709718, whose additional description explicitly includes butternut squash soup and reports 86.36 g water per 100 g. The broad query hid it and the matcher did not see the aliases.

[PR #268](https://github.com/aibraincoach/my-food-ai/pull/268) retains all 30 broad candidates, adds up to 30 strict generic candidates, deduplicates identities without replacing broad nutrition and passes USDA additional descriptions to selection. There is no food-name/ID special case and no invented water. Cache v3 and matching provenance v5 prevent reuse of the old candidate sets. All 60 candidate identities/core nutrients survive the bounded trace projection. The USDA gate request allowance changed from 30 to 60 for the two-search protocol; the 16 cases, quality assertions, Meta budget and unchanged ten-photo diagnostic were not weakened. No new migration, dependency or environment variable was added.

On final head `4a5c8cb57899e3a403efb5e286212067eb4fff8c`:

- Required real identify/frozen-matcher gate PASS: 3 Meta calls, 46.600 seconds.
- Unchanged 16-food matching gate PASS: 19 Meta calls, 38 USDA reads, 56.596 seconds.
- Focused alias/water gate PASS: 1 Meta call, 2 USDA reads; the model selected FNDDS 2709718 using its actual alias.
- Full **126-file suite: 349/349 passed, zero failures, zero skips**, 467.620 seconds. Its diagnostic predecessor found two stale expectations (raw barcode name versus the saved correction, and one versus two search requests); both assertions were repaired, not disabled. The barcode case now checks the owner-resolved name, all seven nutrient values, ownership and second-user isolation.
- Production build PASS; exact-head Vercel checks SUCCESS; independent [Gemini BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/268#issuecomment-6557476886), [triage Real findings: 0](https://github.com/aibraincoach/my-food-ai/pull/268#issuecomment-6557477009).

Full final log SHA-256: `1a72c1e69c3c3a656759ae9c638bef883e82974b788bf2012069b638f90f477e`. [Final gate receipts](reviews/run5-gates/pr268-food.md) retain source heads and actual selections.

#268 merged with merge commit `14c83c746bef064946fc6a1d75cc32c7c5b42841`. Its tree `45eeca06b1982f49365c223ae6195637964bb344` is identical to the 349-test source head. Production was READY, alias confirmed and health 200 at **11:49:07 UTC / 18:49:07 WIB on November 1**, before the November 3 freeze.

A new soup was then posted through the actual production UI at 04:49 America/Edmonton. It finished on attempt one using FDC 2709718: 400 g / portion text 400 ml, 288 kcal, 4.4 g protein, 27.44 g carbs and 18.8 g fat. Stored water was 345.44 g; the full ml share rounds to 350 ml for the meal. Feed summary, square card and detail agreed; Show all 72 opened 72 rows, including Water 345 g after figure rounding. The downloaded stored card was a valid 1080×1080 PNG. Independent aggregation gave 493.5344 ml food water → 490 ml, plus 810 ml drinks → 1,300 ml day intake. Aggregates round once, so separately rounded meal labels need not sum identically. The initial 184 kcal post was not silently rewritten.

### Retained failures and limits

- One two-photo toggle-off submission returned a reservation 409 and visibly retained both photos. Its operation payload was not captured, and subsequent full-document navigation lost the memory-only draft. Equivalent rollback SQL succeeded; a separately captured NEW operation returned 200 and completed normally. The initial cause remains unknown. No causal fix or same-operation retry is claimed.
- An additional unchanged ten-photo identification run returned **9/10**: photo 05 omitted visible fries and duplicated the burger patty. SAM, identify, prompts and the model client were byte-identical to the deployed parent. The [failed receipt](reviews/run5-gates/pr268-unchanged-identify-diagnostic.md) is retained, not retried for green; [#189 records it](https://github.com/aibraincoach/my-food-ai/issues/189#issuecomment-6557424637). The independent reviewer explicitly assessed it as no introduced blocker for #268. This report does not claim that identification is reliable on every run or that owner acceptance of meal totals has arrived.
- The Not eaten comparison uses the same licensed meal photograph twice. The pipeline, bounds, history and card were proven; actual weighed leftovers and model estimate accuracy were not. Both estimates and their differences remain visible.
- Real-pack/label phone acceptance, installed sessions, mobile-data timing, safe-area fit and background push remain the separate owner phone checklist. No account identifiers, signed URLs, screenshots or private design samples are published.

All coder-owned Run5 acceptance checks finished within their recorded limits. The owner then ordered the issue closures/reopenings listed in [the owner report](post-run5-owner-report.md). #269 merged first and #266 merged last; #258 closed as superseded. Physical-phone and owner food acceptance remain unproven. The original plan stays unchanged, acceptance posts/private proofs are retained, and fleet processes/worktrees were cleaned. The latest final receipt supersedes earlier pending-state lines.
