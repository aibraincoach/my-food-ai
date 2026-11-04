> Source snapshot: open docs PR #558, commit `d0effc6297ba4baa956901cf91a5bb039fc67fa9`, read November4,2026. This is that fleet's report, not a new deployment receipt. Fleet15 and current production facts are in [run15-report.md](run15-report.md) and [migrations.md](migrations.md). Historical intermediate states below retain their dated cutoffs.

# Fleet 13 execution report

The owner dispatched [the Fleet 13 plan](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/plan-run13.md) as the code-PR merge order. Execution started from origin/main `efa1e45d296344b90cec7fe80db3d7ed5f0f8c6b`, after Fleet 12's code and docs PRs had merged. No recording hold was received. The supplied plan is committed unchanged. No Fleet 12 feature was rebuilt. The docs branch also preserves the concurrent PM 12:41 WIB backlog update and its six existing design issues #550–#555, imported from PR #545; those are outside this fleet and were not created by it. The before/after #557 commits preserve that newer copy, including its In Flight section.

## Results

| Item | Engineering result | Issue acceptance |
| --- | --- | --- |
| 1 — closest USDA food | Code delivered, reviewed and merged (#549) | #523 stays open for owner production macaroni re-analysis |
| 2 — Sugars, Total | Done: merged; six sugar values backfilled (#547) | #524 closed after migration/readback and merge |
| 3 — whole detail photo | #556 merged; six local production page checks passed | #525 stays open for owner phone acceptance |
| 4 — barcode outages | #546 merged; provider errors 500/429 reject; true 404 returns null | #451 reopened for Oreo/second pack on three phones |
| 5 — label serving basis | #548 merged; real-provider and local page checks passed | #452 stays open for owner's Goldfish image and phones |

## What changed and why

The strict USDA matcher still runs its bounded searches. When those fail, food analysis may search the bare food noun and select a close generic Foundation, SR Legacy or Survey/FNDDS record. Numbers come from the chosen USDA record, with its actual id retained as source_ref and its name disclosed in the meal summary. No model-made nutrient estimates are used; foods with no close record remain unavailable. Drink identification remains exact only. The matcher version is v8.

The plan snippets labelled only fresh initial-analysis results. Review found missing disclosure on correction/rebuild/retry/reuse paths. Final source preserves approximation provenance with stored nutrition and derives disclosures from the final contributing rows. Migration 0051 adds service-only ownership-gated summary persistence: existing re-analysis comments update atomically with nutrition, while recompute summary updates validate the active job and item/source snapshot and target the current model revision, preserving earlier historical comments. Both entering and leaving approximation refresh the relevant disclosure; ordinary exact-only historical summaries stay untouched. Missing-schema rollout may fall back only when neither new nor previous disclosure is involved. Old RPC signatures remain unchanged. These are required correctness repairs to fulfill the named-record requirement; 0051 is additional to the dispatched plan's 0050.

Sugar scaling prefers nutrient 2000 and falls back to 1063, and 1063 no longer duplicates as a micronutrient row. Migration 0050 fills eligible null sugars only. Its private ledger records changed rows; a later write invalidates that row's ledger entry, including a same-value write. Rollback preserves pre-existing sugar and later writes. The broad equality-only rollback in the plan would not do that.

Detail images use contain with matching mask, box and pointer transforms. Phone detail follows stored photo ratio capped at 80dvh; desktop keeps its pane and letterboxes the whole image. Feed crops are unchanged. Tap-to-expand is removed because the image is already whole.

Open Food Facts failures propagate to the existing temporarily-unavailable retry state; a complete personal label remains usable during an outage. Genuine missing products retain the missing-product path. A readable label with no usable serving weight now says “The serving weight or volume could not be read” and keeps both recovery actions. The prompt binds any printed weight to the stated serving and never uses a multi-piece pack's total weight for one piece. This corrects the plan's ambiguous pack-weight sentence and absent-print assertion.

## Provider and database evidence

Real Meta/USDA food smoke: 17/17 fixtures passed in 72,061 ms, with 48 USDA requests and 24 Meta calls. The macaroni smoke selected 168904, “Macaroni, vegetable, enriched, cooked”, as the closest record. A ceramic plate stayed unavailable. This supports P1 for the fixture corpus, not all 94 historical failures. [Full provider receipt](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/evidence/run13/food-match-real.json).

A separate real-provider re-analysis persisted an old unavailable macaroni meal through local PostgREST and the new 0051 RPC. It became ready with one updated first model comment naming “Pasta, cooked”, source_ref 2708357, and a 50 g portion with 78.5 kcal, 2.88 g protein, 15.34 g carbs and 0.46 g fat. Two runs chose different real USDA references; the named record is visible in each. The unique disposable fixture and media were removed. No production food was re-analysed. [Persistence receipt](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/evidence/run13/macaroni-reanalysis.json).

A recompute failure injection rejected the summary acknowledgement after nutrition existed. The post stayed processing; retry restored the named-record summary before ready. Migration/data regression covers stale-job rejection without summary mutation, source snapshot mismatch, retry no-op, atomic existing-comment replacement, service-only access and rollback.

The standard real-label gate passed on the final prompt. Six direct real-model fixtures also passed: existing FDA panel, English FDA, Indonesian 250 ml/200 kcal, printed 30 g serving with per-100 g values of 480 kcal only, a serving of one piece in a 200 g pack containing several pieces, and “1 bungkus” without printed weight. The latter two returned readable nutrition with null serving; the per-100 basis stayed 100 g. Only trace writes were stubbed; no production label rows were written. [Standard gate](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/evidence/run13/label-standard.json), [six-case receipt](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/evidence/run13/label-real.json).

Production read-only trace inspection found six Open Food Facts calls, all attribution off without errors, at 00:21–00:22 UTC on November 4. Four concern the Oreo code; two concern a second pack. They do not establish an owner scan after the fix. Before #480 the resolver asked USDA FDC Branded, whose coverage missed these packs. [Source receipt](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/evidence/run13/barcode-sources.txt).

### Premise outcomes

- P1: supported for all 16 food fixtures plus the nonfood rejection; availability for every historical failure remains unknown.
- P2: not defined in the dispatched plan.
- P3: unproved. The owner's Goldfish photo is unavailable; the null-serving cause is plausible and the tested case is fixed.
- P4: confirmed on the disposable PostgreSQL stack with the real feedback revision trigger; 0050 succeeds.
- P5: supported. 94 current null-calorie items over 14 days split 83 (88.3%) designated test account, 0 second designated test account, 11 other account. This is not a 16% real-user failure-rate claim. Account ids and emails are omitted below.

| Food name (case retained) | Account | Items |
| --- | --- | --- |
| black coffee | Designated test | 2 |
| boiled shrimp nigiri | Designated test | 1 |
| Coffee | Designated test | 1 |
| conger eel nigiri | Designated test | 1 |
| cooked plain spaghetti | Designated test | 2 |
| cooked shrimp nigiri | Designated test | 1 |
| Cooked shrimp nigiri | Designated test | 1 |
| cooked spaghetti | Designated test | 2 |
| cucumber hosomaki | Designated test | 3 |
| Cucumber hosomaki | Designated test | 3 |
| eel nigiri | Designated test | 1 |
| green salad | Designated test | 1 |
| ham | Designated test | 1 |
| Japanese curry sauce | Designated test | 1 |
| Japanese toast | Designated test | 1 |
| minced tuna gunkan | Designated test | 1 |
| pickled ginger | Designated test | 3 |
| Pickled ginger | Designated test | 3 |
| plain cooked spaghetti | Designated test | 5 |
| Plain cooked spaghetti | Designated test | 1 |
| salmon nigiri | Designated test | 3 |
| Salmon nigiri | Designated test | 3 |
| salmon roe gunkan | Designated test | 1 |
| Scallop nigiri | Designated test | 1 |
| shrimp nigiri | Designated test | 1 |
| silver-skinned fish nigiri | Designated test | 1 |
| Silver-skinned fish nigiri | Designated test | 1 |
| Simmered conger eel nigiri | Designated test | 1 |
| Simmered eel nigiri | Designated test | 2 |
| squid nigiri | Designated test | 1 |
| surf clam nigiri | Designated test | 1 |
| Surf clam nigiri | Designated test | 2 |
| tamago nigiri | Designated test | 3 |
| Tamago nigiri | Designated test | 2 |
| Tamago omelet nigiri | Designated test | 1 |
| tamagoyaki | Designated test | 2 |
| toast | Designated test | 1 |
| toasted bread | Designated test | 5 |
| Tonkatsu | Designated test | 1 |
| tuna hosomaki | Designated test | 3 |
| Tuna hosomaki | Designated test | 3 |
| tuna nigiri | Designated test | 3 |
| Tuna nigiri | Designated test | 3 |
| white fish and scallop nigiri | Designated test | 1 |
| yellowtail and white fish nigiri | Designated test | 1 |
| Yellowtail nigiri | Designated test | 1 |
| beef tenderloin steak topped with butter | Other | 1 |
| Chopped scallions and pickled vegetables | Other | 1 |
| Fried tempeh | Other | 1 |
| salami | Other | 1 |
| Sauteed spinach with corn | Other | 1 |
| shrimp rice noodle roll | Other | 2 |
| spicy Indonesian fried macaroni snack | Other | 1 |
| Spicy smashed chicken with sambal (ayam geprek) | Other | 1 |
| Tonkatsu | Other | 1 |
| Tuna and black olive pain Suisse | Other | 1 |

## Rendered page checks

 portrait 3024x4032 (#189 breakfast repro), square1280x1280 and landscape1280x960 load fixtures. Firefox BiDi, no Playwright. No image files stored. One live viewport look of phone portrait and desktop portrait was captured directly to the tool display as JPEG bytes, never saved. Full photo visible, masks on food; no layout differences beyond requested whole-photo frame and letterboxing. The phone top/bottom and desktop edges are visible. Existing overlapping food-name chips remain as before.

| Viewport | Shape | Frame | Rendered complete photo | Mask offset |
|---|---|---|---|---|
|390x844|portrait .75|378x504|378x504|0,0|
|390x844|square1.0|378x378|378x378|0,0|
|390x844|landscape1.33|378x283.5|378x283.5|0,0|
|1280x800 desktop dialog|portrait .75|640x680|510x680|65,0|
|1280x800 desktop dialog|square1.0|640x680|640x640|0,20|
|1280x800 desktop dialog|landscape1.33|640x680|640x480|0,100|

Every image decoded at its original stored dimensions, computed objectFit=contain, and every measured loaded mask exactly matches the rendered image bounds (within2px tolerance). All six item-chip activations opened their editor. Separate real pointer actions at source-photo point1850,3100 hit the IMG outside any button, selected thick toast and opened its editor: phone viewport231.25,487.5; desktop517.004,582.817. This verifies the changed parent coordinate hit test on both viewport modes.

Before crop is inferred from the prior source cover math and these measured widths/stored dimensions, not a separate baseline runtime: old phone378x230 portrait showed45.63% height (54.37% cropped); desktop640x680 portrait showed79.69% height (20.31% cropped). Now0% cropped in both. Square phone old39.15% height cropped; landscape phone old18.87% height cropped. Desktop square old5.88% width cropped and landscape29.41% width cropped. Accepted geometry receipt is /tmp/run13-c-look.json and real pointer receipt/tmp/run13-c-hit.json (temporary, copy figures into final report; no screenshots).


The label page look used the actual hydrated capture/upload flow on the disposable local default-Turbopack production build, with only /api/label/read stubbed to return readable numbers and null serving. At 390x844 and 1280x800 the message, contained photo and both exits were visible; Take the photo again and Type it instead both worked. No screenshots were saved. [Geometry and interaction receipt](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/evidence/run13/label-page-look.json).

Driver limitations: two initial label-driver failures in about 75 seconds were fixture/hydration errors, reported during the run. Another agent completed the check with the corrected flow. Chromium cookie commands stalled for the detail check; Firefox BiDi succeeded. An alternate webpack build omitted Tailwind utilities because the app config uses the Turbopack CSS loader; it was rejected as page evidence. Accepted page evidence comes from the normal default production build.

## Reviews, merges and migrations

All five PRs hold counting PPLX reviews and independent supplementary coder reviews. The owner explicitly accepts ChatGPT answers in PPLX for this run. Captured request preference is not treated as answer-model identity; final captures show GPT-6.1 Sol where applicable. Earlier failed or superseded attempts do not approve a changed head.

| PR | Exact reviewed head | Counting receipt | Merge commit |
| --- | --- | --- | --- |
| #546 | `7756cc31f287886e66cef3fd13082e30d78f5918` | [PPLX](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/reviews/mfa-pplx-pr546-7756cc3.md) | `dfe1ed48168f9ef646890434120c3c1fd12db100` |
| #547 | `8bff5d10d7267c1f88ea3d463c6cc386e8017bec` | [Complete same-thread PPLX](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/reviews/mfa-pplx-pr547-8bff5d1-completed.md) | `921b391e36c4cb711a97edb8d4c745301f99878b` |
| #548 | `8b0c0d4cb8b83e2bcc4fa43c36fc7b79144f8abf` | [PPLX](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/reviews/mfa-pplx-pr548-8b0c0d4.md) | `5d4ef6ea36e42ce934a43b0c301cda51f600fdd7` |
| #549 | `1e90fc6713c22a24e0f51d4a95345752ddb9908f` | [Final same-thread confirmation, BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/reviews/mfa-pplx-pr549-1e90fc6.md) | `436c59430d105c7cd70a4a8483d1b74fac9b54dc` |
| #556 | `81c0b19a6218ca61397500b9d61f892bc6a5bafa` | [PPLX](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/reviews/mfa-pplx-pr556-81c0b19.md) | `4ad8eb4b355a977354ab8ac56033e0c7d9bb8f36` |

The review loop fixed the label pack-weight ambiguity and missing-serving copy; sugar rollback same-value write provenance; approximation reuse provenance; initial/recompute ownership and atomicity; approximation-to-exact/removal transitions; current-revision versus historical comment selection. [Triage](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/reviews/run13-pr549-triage.md) records the four real fallback findings and their fixes. All preview checks passed on the listed heads. [Head/check snapshot](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/evidence/run13/premerge-heads-and-checks.json).

Production migrations applied in order after their reviews and before their respective PR merges. Migration 0050 updated 6 null sugar values, with 6 ledger rows and 0 calorie changes; all 6 values and its invalidation trigger were read back. Migration 0051 created both RPCs and reloaded PostgREST; readback confirms anon/authenticated cannot execute either and service_role can. [0050 receipt](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/evidence/run13/production-0050-readback.txt), [0051 receipt](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/evidence/run13/production-0051-readback.txt). The complete merged Git tree exactly matches the tested combined worktree; both tree hashes are recorded in the validation receipt.

#524 is closed. #451 is reopened because its prior closure explicitly left the owner's three-phone checks unperformed. #523/#525/#452 remain open, with commit-pinned implementation/evidence comments. The PM copy of BACKLOG.md is preserved, with #557 added; the PM should reconcile the newly closed #524 and the now-merged In Flight entries against this report.

## New issues and unfixed observations

Created [#557 — An incomplete saved label can hide a barcode provider outage](https://github.com/aibraincoach/my-food-ai/issues/557). Both provider catch branches may suppress an error for source=label/per_100 data while mergeProduct also needs name and serving_unit. The database permits those fields to be null. This pre-existing source-confirmed edge is outside the small provider error-classification fix. No production failure is claimed. BACKLOG.md was committed before filing at `17b5e900` and after filing at `f43f8120`. No other issues were created by this run.

The reviewer recommended additional resolver-boundary coverage for #546; it was non-blocking. Existing overlapping food-name chips remain unchanged. A redundant same-transaction initial-comment UPDATE is an optional micro-optimization, classified by the reviewer as no correctness defect; distinct USDA sources on repeated food names are intentionally both disclosed. Production phone acceptance, the Goldfish photo and owner macaroni re-analysis remain outside the coder's checks. Stored card images retain their old sugar text as the plan disclosed. No model-made estimates, CAPTCHA activation or sign-up hammer were added.

## Validation and cleanup

The serial database gate passes 38/38, no failures or skips. The combined default production build passes, TypeScript passes and ESLint reports 0 errors / 6 existing warnings. The complete final application suite passes 584 tests, 0 failures and 6 existing optional skips (590 total including one nested case), in 237,338 ms, on the fresh disposable stack. Its 38/38 database gate ran serially and passed in 114,327 ms. [Validation summary](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/evidence/run13/validation.json).

An earlier full/DB concurrent run shared disposable accounts and produced invalid count assertions; it was discarded. A fresh serial application run identified one removal-reply wording regression (extra macros). The fix preserves the original generated reply format and appends only relevant USDA disclosure sentences; the existing 4 removal cases pass without changed expectations. A focused new-RPC transport fixture was aligned while retaining ownership/snapshot/no-repeat assertions. Final full-suite and serial database results above supersede those rejected/intermediate runs. Cleanup completed: all five feature worktrees/local branches and their merged remote branches were removed. Both disposable stacks and every run-owned Next/Chromium/Firefox process were stopped; all run ports were checked closed. scripts/cleanup.sh completed. Only the original checkout remains, and its pre-existing untracked docs/reviews/mfa-pplx-pr311-e7ece5c.md is preserved. The docs branch/PR stays unmerged as the plan requires. [Cleanup output](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/evidence/run13/cleanup.txt).

Final production deployment dpl_5cg4PsKoEXckBnhTZHLXZupwsAZm is READY for main 4ad8eb4b355a977354ab8ac56033e0c7d9bb8f36. The production alias points to that deployment and alias assignment is complete. This proves deployment identity, not physical-phone acceptance. [Deployment receipt](https://github.com/aibraincoach/my-food-ai/blob/d0effc6297ba4baa956901cf91a5bb039fc67fa9/docs/evidence/run13/production-deployment.json).
