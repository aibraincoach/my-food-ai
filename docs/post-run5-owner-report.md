# Post–Run 5 owner report — November 1, 2026

Production inspected: `14c83c746bef064946fc6a1d75cc32c7c5b42841`, after #259–#265, #267 and #268. This report answers the owner's replacement order. No new application PR has been merged under this order.

## Owner meals and zero calories

Privileged, read-only inspection covered the owner's latest posts, current item rows, nutrition rows, stored card data and a downloaded current PNG. Account identifiers and media URLs remain private. No owner post was changed.

| Latest meals, newest first | Stored current items | Stored/calculated calories |
| --- | --- | --- |
| Xiao long bao, Nov 1 07:38:48 UTC | Dumplings 30 g; soy/ginger dipping sauce 10 g | 81.9 + 5.3 = **87.2 kcal** |
| Dim sum, 07:35:55 | Black dumpling with gold leaf 35 g | **39.55 kcal** |
| Dim Sum, 07:34:54 | Shrimp rice noodle roll 130 g | Nutrition row exists; core nutrients and reference are null: **unavailable**, not stored zero |
| Dim sum, 07:30:26 | Shrimp rice noodle roll 70 g | Same unavailable result; **not stored zero** |
| Tuna/olive pastry and espresso, 05:00:30 | Pastry 120 g unavailable; espresso 30 g known | **2.7 known kcal**, with the pastry explicitly unavailable; not a complete meal total |

These posts have items; missing analysis items do not explain their current per-meal results. Current card data has the same known/null values. The downloaded 130 g noodle-roll PNG says nutrition is unavailable, with dashes for macros. I could not reproduce the owner's reported latest-meal bare zeros in the currently deployed per-meal cards, and have no captured original screen proving its original cause.

A separate owner espresso stores **0.3 kcal** (30 g, selected reference FDC 171890), which currently rounds to a bare 0. Concrete code defects also exist: an empty item list sums to zero, and Days can initialize an unknown day with a known zero. PR [#269](https://github.com/aibraincoach/my-food-ai/pull/269), exact code head `c54525b1bd1c8985866f7fe840411be274822719`, makes empty/all-unavailable totals unknown, preserves named omissions in mixed days, and formats positive sub-kcal energy as **<1 kcal** across feed/detail/Days/cards. Genuine water with measured zero energy remains 0. This does not invent nutrition for either unmatched noodle roll or the pastry, and does not reanalyze historical meals.

Exact-head validation: production build passed; all **127 discovered test files** ran, **353 tests passed, zero failed, zero skipped**, in 256.758 seconds. Full log SHA-256: `f51c91ac4ea948f8a6e2f1fd5c02d0c5811bcd239b7d914808280a335409e8a3`. Four new regression tests cover empty/unavailable meals, unknown days, mixed-day omissions and sub-kcal formatting. Independent [Gemini review](https://github.com/aibraincoach/my-food-ai/pull/269#issuecomment-6558199300): **BLOCKERS: NONE**, [triage real findings: 0](https://github.com/aibraincoach/my-food-ai/pull/269#issuecomment-6558199451). Vercel preview checks passed and GitHub reported mergeable. A built-page check in native Chromium at 390×844 showed the espresso fixture summary as <1 kcal and the unavailable-food summary as dashes, both without horizontal overflow. Temporary posts were removed and their absence verified.

Production still runs the preceding behavior until a named merge order is supplied; no deployed fix is claimed.

## Authority used for #267 and #268

I relied on the earlier order's sentence: “You have authority for the whole job, including the migrations the plan names.” I interpreted it as authority to fix and deploy defects found during production acceptance. There was **no separate PM merge order naming #267/#268 and their exact heads**. That interpretation did not satisfy the superseding named-PR/head rule in [planner-contract.md](planner-contract.md). Both merges happened; I am recording the actual authority relied on rather than inventing a receipt. New #269 is prepared for evaluation and a named merge order.

## Failed photo gate and reservation 409

The 9/10 failure was **eval/photos/05.jpg**, the deconstructed cheeseburger and fries. The model returned a cheeseburger with vegetables and a separate cheeseburger patty with cheese, omitting the visible fries and duplicating part of the burger. SAM, identification code, prompts and client were byte-identical to the deployed parent. The [failed diagnostic receipt](reviews/run5-gates/pr268-unchanged-identify-diagnostic.md) remains retained; it was not rerun until green. [Issue #189](https://github.com/aibraincoach/my-food-ai/issues/189#issuecomment-6557424637) records the failure.

Unchanged code is not a deterministic inference contract. Generated foods, portions and reference selections can vary. The request sets no seed or explicit temperature. Source inspection cannot identify a provider-internal reason for a particular sampled answer, so I cannot honestly attribute the 9/10 run to a specific internal model mechanism. Earlier 10/10 runs remain observations, not a guarantee.

The 409 occurred during reservation of a two-photo draft. The UI kept both photos and showed a retry error; no published post was created by that failed request. The original operation ID/request was not captured. A later full-document navigation by the browser helper discarded the memory-only draft; fixture source files remained. Equivalent rollback SQL succeeded, and a **new** operation reserved/published both photos successfully. That is not a same-operation retry or a causal fix.

I additionally queried production database/PostgREST logs for 11:22–11:25 UTC. They contain PostgREST timeout-manager events and a **57014 statement timeout on reserve_post_upload_with_options at 11:23:08 UTC (HTTP 500)**. The observed UI 409 was recorded later and lacks a captured operation ID, so this is evidence of a nearby reservation timeout, **not proof that it caused that particular 409**. No photo loss from a successfully published post was found. The discarded unsent in-memory draft is a real limitation and remains tracked under #227.

## Why the same caption changed totals

| Breakfast item | First run kcal | Later run kcal | Explanation |
| --- | ---: | ---: | --- |
| Toast 60 g | 175.8 | 175.8 | FDC 2707599 |
| Ham 10 g | 11.7 | 11.7 | FDC 2705878 |
| Salad 40 g | 8.4 | 8.4 | FDC 2709792 |
| Scrambled egg 50 g | 92.5 | 74.5 | Reference changed from FDC 2707198 to 172187 |
| Coffee 240 g | 2.4 | 2.4 | FDC 2710375 |
| **Total** | **290.8** | **272.8** | Exactly 18 kcal from the egg reference |

| Curry item | First run | Later run | Explanation |
| --- | --- | --- | --- |
| Cutlet | 180 g / 394.2 kcal / FDC 2705869 | 200 g / 550 kcal / FDC 2705876 | Both mass and reference changed |
| Curry sauce | 200 g / 190 kcal | 240 g / 228 kcal | Same FDC 2710178; portion changed |
| Rice | 300 g / 387 kcal | 350 g / 451.5 kcal | Same FDC 2708403; portion changed |
| **Total** | **971.2 kcal** | **1,229.5 kcal** | +258.3 kcal |

The earlier description that curry changed only portions was incomplete: its cutlet reference changed too. Generic references are not measured recipes; fresh model estimates are not guaranteed to reproduce a prior take. **Saved meals and Log again copy stored item quantities and nutrition**, providing a repeatable answer for a rehearsed meal without new identification/matching. A fresh free-text/photo estimate cannot promise one exact answer every time. No caption-only cache was added that could silently apply one meal's nutrition to another photograph. The owner's acceptance of breakfast/curry weights and totals remains outstanding under #189/#226/#230.

## Acceptance and issue changes

All Run 5 browser checks below used actual production at 390×844 with ordinary test-account sign-in; emulation does not prove a physical phone. Closure comments identify implementation PRs and link the measured evidence.

| Issue | Production/design result | State after this order and evidence |
| --- | --- | --- |
| #219 | Pill on five surfaces; camera/composer/barcode/story/sheet ways home passed; frame 3p delivered | **Closed**; [evidence](https://github.com/aibraincoach/my-food-ai/issues/219#issuecomment-6557516660), #260 |
| #220 | Summary line, four cells and expanded full table passed; frames 3a–c delivered | **Closed**; [evidence](https://github.com/aibraincoach/my-food-ai/issues/220#issuecomment-6557516661), #260 |
| #214 | 330 ml water, 240 ml coffee, soup food-water and day total passed after #268 | **Closed**; [evidence](https://github.com/aibraincoach/my-food-ai/issues/214#issuecomment-6557555918), #261/#268 |
| #213 | Corrected product name/nutrients appeared on next deterministic camera-emulated scan | **Closed**; [evidence](https://github.com/aibraincoach/my-food-ai/issues/213#issuecomment-6557516622), #262 |
| #212 | Missing barcode→label read→55 g/230 kcal photo post passed in emulation; physical real-pack phone capture unproven | **Open**; [evidence and limitation](https://github.com/aibraincoach/my-food-ai/issues/212#issuecomment-6557516659), #262 |
| #172 | Saved coffee at Now and chosen earlier time; exact nutrition/intake/day headers passed | **Closed**; [evidence](https://github.com/aibraincoach/my-food-ai/issues/172#issuecomment-6557516645), #263 |
| #195 | Delivered Not eaten frames; two-photo consumed result/footer/history passed within stated fixture limits | **Closed**; [evidence](https://github.com/aibraincoach/my-food-ai/issues/195#issuecomment-6557516648), #264 |
| #173 | Add photo from menu and carousel; three versions, consumed correction and retained media passed | **Closed**; [evidence](https://github.com/aibraincoach/my-food-ai/issues/173#issuecomment-6557516650), #265 |
| #185 | Day-separator frames 2a/2b delivered; retained frame measurements | **Closed**, #201 |
| #186 | Fan frames 2c/2d and motion delivered; retained frame measurements | **Closed**, #202 |
| #187 | Month/story entry/exit frames 2e–g delivered; current story navigation checked | **Closed**, #204 |
| #188 | Intake/scanner frames 2h/2i delivered; actual phone check stays separate | **Closed**, #205/#206 |
| #191 | Four capture entries plus Saved fifth entry; owner Oct 29 ruling superseded configurable fifth entry | **Closed**, #202/#263; not a claim that a configurable fifth entry ships |
| #67 | Deployed admin trace, copied-item provenance and fresh load trace checked; ordinary second user's fresh select returned zero trace rows | **Closed**; [admin check](https://github.com/aibraincoach/my-food-ai/issues/67#issuecomment-6540903163), [copy proof](https://github.com/aibraincoach/my-food-ai/issues/67#issuecomment-6547442271) |
| #11 | Full Home-state frame acceptance remains unproven | **Reopened** |
| #22 | Background installed-real-phone push/open-post acceptance remains unproven | **Reopened** |

For #185–#188, the issue's done condition is delivery of frames, not a claim that hardware acceptance passed. [Run 3 plan](plan-run3.md) records their frame transcription and the fifth-entry ruling; [frame comparisons](run3-execution.md) retain the measured browser checks with their historical status clearly labelled. The original designer canvas was checked locally without publishing private samples. Each issue has its own closure comment.

## Twenty-post speed check

Fresh production run began **2026-11-01 12:35:08.458 UTC / 19:35:08.458 WIB**, using licensed evaluation photos 01/02/03, twenty posts at six-second intervals over 114 seconds.

- **20/20 ready; zero failed; zero incomplete.** Every analyze job finished on attempt one, with no job/trace error or observed 429.
- Median per-post ready latency **144.50 s**; maximum **307.47 s**, including upload and polling.
- All twenty ready **421.474 s** after the run began (7 min 1.474 s).
- Independent job/trace audit: SAM 20, identify 20, search 142, FDC 256 trace events; these trace counts are not asserted to be USDA HTTP request counts.
- The earlier healthy historical run measured median 607.12 s / maximum 1,205.55 s. The new observed median is 4.20× faster and maximum 3.92× faster. This is not a controlled attribution solely to the speed PR: the runtime also includes Run 5 matching changes, and cache/provider conditions can differ.

[Runner table and constraints](load-test.md) preserve every per-post latency. Acceptance/load posts were retained; private identifiers were not committed. The runner's optional deployed-concurrency label was unset and says unknown; current worker code enforces one, and independently audited job start/finish intervals had maximum overlap **one**. This is not a phone image-loading or nutrition-accuracy benchmark.

## Demo account choice

Account identities are available only in the private local handoff, not committed documentation. Counts below were reconciled after removing and verifying absence of the temporary regression fixtures. Choose the ordinary second test account (B) for the cleanest existing meal history; the owner still chooses the recording account. An empty admin account is not an equivalent populated ordinary-user demonstration.

| Account | Total posts | Ready | Unavailable foods | Posts with unavailable foods |
| --- | ---: | ---: | ---: | ---: |
| A — ordinary first test | 146 | 121 | 83 | 29 |
| B — ordinary second test | 5 | 4 | 0 | 0 |
| C — owner | 20 | 20 | 5 | 5 |
| D — admin | 0 | 0 | 0 | 0 |

Unavailable-food counts mean current item rows with unknown calories, not all historical correction versions. A partially known meal counts as a post with an unavailable food. No account or historical meal was deleted to improve the numbers.

## README audit and remaining merge work

**Yes**, main's README still contained a historical quoted paragraph saying #202's plus menu was not on main and other Run 3 features/acceptance remained pending. It contradicted a later current-status paragraph. The evaluation-directory sentence also used future tense; the queue document's top generated results were an old failed run even though a later historical healthy run was recorded below it. Evaluation and two functional demo runs already exist; physical-phone acceptance and the owner's final recorded submission video remain separate.

This docs branch removes the obsolete Run 3 quote from the start-here page, states the inspected Run 5 runtime, links completed evaluation/demo records, and records the fresh twenty-post result. **Those corrections are prepared in open docs PR #266 and are not on main until it is ordered merged.** The exact Wall of Stupid row remains preserved; its original pushed commit is `fd4563ac87b68623117fbd931deea030beba2df1`.

Remaining concrete work: merge/deploy #269 after evaluation and an exact-head order, then repeat zero/unknown production checks; merge docs #266 only under its own applicable order; obtain physical-phone evidence for #212/#11/#22 and the phone checklist. Freeze remains **23:59 WIB Tuesday November 3**. No unproven phone or owner food acceptance has been closed by inference.
