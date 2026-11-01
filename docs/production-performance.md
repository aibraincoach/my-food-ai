# Production meal latency, Nov 1

The change in [PR #256](https://github.com/aibraincoach/my-food-ai/pull/256) deployed as `44576592955ce576b2a66f875518d18a4ebb8bd4`, READY at 01:01:50 UTC on 2026-11-01. The prior runtime was `72910d0f49a3ba0a96bea015921d874ba13a6c5f`. No migration was needed. Worker concurrency remained one and its scheduled wake remained enabled.

## Where time goes

The fresh baseline repeatedly spent output tokens on reasoning before emitting a small identification or matching answer. Curry and the busy photo each discarded an initial 2,048-token identify call before retrying at 8,192. Food decisions were limited to two parallel lanes. The image path also encoded and uploaded every SAM region before knowing which regions described a food, and downloaded the original again for identify.

The change explicitly requests `reasoning.effort: low` for identify and matching, starts identify at its existing 8,192 ceiling, and keeps the matcher’s 4,096→8,192 exhaustion fallback. Acceptance criteria, the single improved food search, incompatible-unit rejection and whole-dish/component safeguards stay in place. Four food lanes now run within one meal, not four simultaneous worker jobs. The original is loaded once; only selected food masks are encoded/uploaded, in four lanes, with all in-flight operations settled before a failure or publication. The prior-decision certification version became v4, preventing v3 decisions from short-circuiting the after measurements. USDA candidate caching remains enabled on both sides.

Meta documents low reasoning effort as a supported Responses setting for reducing latency and token use. Output caps still include reasoning; this change did not shrink them. [Meta reasoning documentation](https://dev.meta.ai/docs/reasoning)

## Controlled production observations

The same three ordinary test-account posts were submitted as a cohort on each runtime: two caption-only meals and the unchanged licensed sushi photo with caption “Sushi platter.” These are one before/after observation per meal, not latency percentiles. There was no manual tick, retry or nutrition selection. Each finished on attempt one with no error. SAM and identify ran for both photo posts; no same-meal copy shortcut occurred.

| Case | Before active worker seconds | After active worker seconds | Model calls before → after | Output tokens before → after | Queue seconds before → after | Created-to-finished seconds before → after |
| --- | ---: | ---: | --- | --- | --- | --- |
| Breakfast | 43.706 | 16.497 | 7 → 7 | 10,542 → 4,703 | 1.019 → 0.839 | 44.725 → 17.336 |
| Curry | 49.456 | 19.539 | 6 → 5 | 10,740 → 4,081 | 44.453 → 18.201 | 93.909 → 37.740 |
| Busy photo 03 | 115.739 | 25.188 | 14 → 13 | 21,596 → 9,652 | 94.871 → 36.639 | 210.610 → 61.827 |

Queue wait is separate: the curry and photo waited behind the earlier posts. These timings are server job spans; they exclude capture and client upload before post creation, and exclude the final browser refresh/poll delay. Output-token totals include reasoning; production trace rows do not separately retain reasoning-token counts.

Overlapping matching calls cannot be added to get wall time. The following uses the union of their time spans:

| Case | Identify seconds before → after | Matching wall seconds before → after | SAM seconds before → after | Other non-model/non-USDA seconds before → after |
| --- | --- | --- | --- | --- |
| Breakfast | 10.119 → 3.305 | 29.979 → 9.299 | — | 3.605 → 3.887 |
| Curry | 22.871 → 3.409 | 24.131 → 10.233 | — | 2.454 → 4.740 |
| Busy photo 03 | 39.485 → 8.084 | 54.956 → 10.838 | 1.741 → 1.337 | 19.551 → 4.921 |

“Other” includes storage, mask work, persistence, rendering and uninstrumented overhead; the trace does not isolate those individually. USDA/cache-read wall spans after the change were 0.008 s, 1.158 s and 1.600 s. USDA retrieval was not the dominant bottleneck in these cached observations.

## Quality alongside speed

Breakfast retained identical five references, portions and calculated total: white toast FDC 2707599 (60 g), ham 2705878 (10 g), raw salad greens 2709792 (40 g), scrambled egg 172187 (50 g), brewed coffee 2710375 (240 g), **272.8 kcal**. None unavailable.

Curry retained all three reference identities: coated pork steak 2705876, curry sauce 2710178 and cooked white rice 2708403. Its visual-language portion estimates changed from 180/200/300 g to 200/240/350 g, so the total changed from 1,072 to **1,229.5 kcal**. These are estimates, not measurements or an accepted owner result. None unavailable.

A read-only storage check fetched all nine selected mask objects successfully (7,379–10,284 bytes each).

The busy photo retained the same nine food groups, portions, FDC references and **1,323.4 kcal**; all nine selected foods retained masks. The broad Sushi NFS reference remains a generic proxy for some mixed seafood sushi, not species-specific nutrient ground truth. None unavailable. No persimmon or condiment-only substitute was selected in the breakfast/curry checks. Owner acceptance remains outstanding.

| Case | Before post | After post |
| --- | --- | --- |
| Breakfast | `eed95180-7361-4e2b-ac99-1e3e244f9ba9` | `af17c93d-abc8-4b40-9939-13d3ee09d98c` |
| Curry | `3b9b5bac-33a5-4959-bf54-4b1613a93c32` | `b0f44479-904d-406b-add2-e28edeb71442` |
| Photo 03 | `d9410a54-8168-4f82-8c61-3f61dd6bd712` | `7b093288-f6b7-4d61-ae08-dc7deaa4f5be` |

## Pre-merge gates and review

The final code passed 44 isolated data/concurrency/storage tests, TypeScript, lint and the production build. Live requests on that code passed the 16-case food gate (15 foods plus rejection of an empty ceramic plate), the full busy-photo gate and all ten real SAM-plus-identify photo checks. The food gate took 35.597 s, with 21 Meta calls and 16,757 output tokens (14,726 reasoning). The full busy gate took 67.138 s with 17 identified/resolved foods, 26 model calls, and 23,149 output tokens (20,031 reasoning). It does not include storage uploads. The older quoted 38-call/69,169-token gate was a full busy-photo gate on an earlier matching policy with 16 identified foods; it is not a controlled before/after latency comparison with the new production cohort.

The ten-photo visual gate took 89.719 s across 20 actual SAM/identify calls and retained visible cheese, egg and croutons. It does not certify portion estimates or exact seafood species. The generic visible-component prompt repair addresses the [photo 05 error](eval.md) without runtime food-name special cases.

The independent Gemini review confirmed the final source-identical head `591a4e3344a49add185a7eb6217eb5de9b50cd23` with [BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/256#issuecomment-6551478478). Source-based triage found no real blocker. The final commit adds only review capture/triage to tested code head `85910ea6f4660619f019f2aec58fa6a522320dac`.

## What remains

A one-worker burst still queues: the earlier twenty-post median of 607 seconds is not the service time of one meal, and no new twenty-post burst was run for this change. These three observations do not establish a new burst percentile or eliminate rate-limit risk. Matching continues to require multiple real model decisions. Any further batching, candidate reduction or worker-concurrency change needs its own food-quality and load evidence; none was silently enabled here.

For the demo, keep the queue clear of evaluation/load-test traffic. That is test scheduling, not a product throughput fix. Use the [uncut rehearsal result](demo-rehearsal.md) and the [physical-phone acceptance checklist](phone-acceptance.md) for the remaining proof.

[Structured timing observations](performance/2026-11-01-meal-timings.md) · [Item, nutrition and resolution observations](performance/2026-11-01-food-results.md).
