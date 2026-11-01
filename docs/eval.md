# Ten-photo production evaluation

Baseline runtime: `4f51b7afec2ded63374a9615dd6ad5d3b9508bad`, 2026-10-31 18:06–18:12 UTC. Ten normal test-account photo posts reached ready; an independent read at 18:30:03 UTC confirmed all ten analysis jobs finished on attempt 1 with no error. The observations below retain the original expected labels and unchanged legacy name scorer. Portions are visual estimates and annotations, not measurements.

The legacy scorer reports **12 found, 3 missed and 14 invented**. These are mechanical name-agreement categories, not an audited hallucination rate. In particular, spaghetti adjectives and sushi-component granularity make that aggregate misleading. The separate visual reading below preserves uncertainty instead of changing the expected labels after the run.

**Direct visual recheck, Nov 1:** one of the 26 returned food descriptions is demonstrably incomplete: photo 05 says Hamburger despite visible cheese. This is a material identification failure, not an invented food. No additional returned category can confidently be called nonexistent from these pixels. That does not certify all other rows: the lemon in 06, fine sushi species in 03 and lamb species in 10 remain uncertain. Photo 06 additionally fails nutrition-reference coverage in the original run; photo 04 has a branded-reference caveat.

All 26 returned items had calorie values; this does not establish that all 26 references were accurate. Independent reference inspection found 24 structurally compatible references, a branded-pizza proxy caveat and one genuine Caesar component-coverage defect.

| Photo | Returned foods | Pipeline seconds | Nutrition availability | Visual adjudication |
| --- | --- | ---: | --- | --- |
| 01.jpg | scrambled eggs; toast | 7.45 | 2/2 calorie values | Eggs and toast agree with the visible foods; parsley garnish is visible but unannotated. Butter is not visually established. This result reused prior nutrition, not a fresh identify call. |
| 02.jpg | plain cooked spaghetti | 17.38 | 1/1 calorie values | Plain cooked spaghetti is the expected spaghetti with extra descriptive words. The mechanical miss/invention is a name-score artifact, not a demonstrated missing or invented food. |
| 03.jpg | Gunkan sushi with salmon roe and minced tuna; Shrimp nigiri; Tuna nigiri; Pickled ginger; Cucumber hosomaki rolls; Salmon nigiri; Tuna hosomaki rolls; Tamagoyaki nigiri; Assorted white fish, squid, octopus, clam and scallop nigiri | 86.29 | 9/9 calorie values | Nine rows describe visible sushi components at finer granularity than the single expected platter. They are not nine demonstrated inventions. Exact species and component proportions remain uncertain; Sushi NFS is a whole-dish proxy. |
| 04.jpg | Margherita pizza | 24.93 | 1/1 calorie values | Pizza agrees with the image. The original branded PIZZA HUT reference is a recipe/proxy caveat, separately corrected in a fresh follow-up. |
| 05.jpg | Dipping sauce; Hamburger; French fries | 38.30 | 3/3 calorie values | **Fail: visible cheese was omitted from Hamburger and its selected no-cheese reference.** Fries agree. A dipping-sauce bowl is visibly present at the edge; sauce contents are uncertain, so the extra sauce row is not a demonstrated invention. |
| 06.jpg | Grilled chicken Caesar salad with croutons; Lemon wedge | 41.37 | 2/2 calorie values | Chicken Caesar and croutons agree. A tiny yellow wedge is plausible but uncertain, not a confidently invented lemon. The original no-dressing reference omitted material components; fresh follow-up corrected that defect. |
| 07.jpg | pancakes | 40.95 | 1/1 calorie values | Two pancakes agree; syrup or butter is not established visually. |
| 08.jpg | Ramen | 17.75 | 1/1 calorie values | Ramen agrees. Visible egg and vegetable components may be represented within the dish rather than separate rows; hidden broth ingredients are not independently verified. |
| 09.jpg | Cheeseburger; French fries | 29.96 | 2/2 calorie values | Cheeseburger and fries agree with the photograph; no extra food row was returned. |
| 10.jpg | Stuffing; Roast lamb; Gravy; Yorkshire pudding | 67.27 | 4/4 calorie values | Roast, stuffing and Yorkshire pudding agree; gravy is visible despite being absent from expected labels. Lamb species comes from the licensed source/caption, not a reliable visual measurement. |

PR #256 adds a general visible-topping/filling preservation instruction. A new real SAM-plus-identify gate on all ten unchanged images retained cheese on photo 05 and passed all ten food-category/component checks. This is a separate gate, not a rewritten baseline score. See [production latency and quality results](production-performance.md).

## Provenance and subsequent repairs

Photo 01 used two copied-nutrition events and a same-meal decision; it did not make fresh SAM or identify calls. Other rows retain their recorded lookup/cache provenance. Pipeline elapsed time includes queue, storage and publication work and is not a per-model latency measurement.

The baseline Caesar reference described a no-dressing salad despite the identified croutons and dressing. PR #254 added general component-coverage and reference-proxy rules. Fresh production photo rechecks on `a0c22e16911af83fe0aade470e3295a5109595b0` selected unbranded whole cheese pizza (FDC 173292, 665 kcal for an estimated 250 g) and complete chicken Caesar with croutons and dressing (FDC 2422578, 406.4 kcal for 320 g), plus lemon 4.35 kcal. These are separate rechecks, not replacements for the ten-photo baseline. Recipe-specific accuracy remains unproven.

The image-only spaghetti demonstration initially returned unavailable nutrition. PR #253 repaired generic preparation/refinement. The second UI demonstration on `4598a0ea51f9478ed6fc49d069ef6b5ff7eb7f81` automatically selected plain cooked pasta FDC 169728: estimated 200 g, 262 kcal. No manual match was used for this follow-up.

Fresh version-3 breakfast and curry re-logs selected all five and all three foods, respectively: breakfast 290.8 kcal, curry 971.2 kcal. The breakfast egg reference changed from an earlier scrambled-egg variant to FDC 2707198, explaining an 18 kcal difference from the older 272.8 kcal result. Owner acceptance has not been given. [Item-level production evidence](https://github.com/aibraincoach/my-food-ai/issues/189#issuecomment-6547473918).

Current-version copied nutrition separately preserved two items, source lineage, matching version and nutrient values with two explicit reuse records, without pretending that new model/search calls occurred. [Trace evidence](https://github.com/aibraincoach/my-food-ai/issues/67#issuecomment-6547442271).

## Unmodified automated item report

<!-- eval-results:start -->
Run: 2026-10-31T18:12:41.458Z.

Weights below are visual annotations, not measured ground truth.

## Photo 01.jpg

Pipeline outcome: ready; elapsed 7.45 seconds.

| Expected item | Returned item | Expected grams | Returned grams | Status |
| --- | --- | ---: | ---: | --- |
| scrambled eggs | scrambled eggs | 150 | 100 | found |
| toast | toast | 70 | 60 | found |

Totals: found 2, missed 0, invented 0.

## Photo 02.jpg

Pipeline outcome: ready; elapsed 17.38 seconds.

| Expected item | Returned item | Expected grams | Returned grams | Status |
| --- | --- | ---: | ---: | --- |
| spaghetti | — | 200 | — | missed |
| — | plain cooked spaghetti | — | 200 | invented |

Totals: found 0, missed 1, invented 1.

## Photo 03.jpg

Pipeline outcome: ready; elapsed 86.29 seconds.

| Expected item | Returned item | Expected grams | Returned grams | Status |
| --- | --- | ---: | ---: | --- |
| sushi | — | 650 | — | missed |
| — | Gunkan sushi with salmon roe and minced tuna | — | 185 | invented |
| — | Shrimp nigiri | — | 150 | invented |
| — | Tuna nigiri | — | 105 | invented |
| — | Pickled ginger | — | 20 | invented |
| — | Cucumber hosomaki rolls | — | 110 | invented |
| — | Salmon nigiri | — | 70 | invented |
| — | Tuna hosomaki rolls | — | 150 | invented |
| — | Tamagoyaki nigiri | — | 110 | invented |
| — | Assorted white fish, squid, octopus, clam and scallop nigiri | — | 460 | invented |

Totals: found 0, missed 1, invented 9.

## Photo 04.jpg

Pipeline outcome: ready; elapsed 24.93 seconds.

| Expected item | Returned item | Expected grams | Returned grams | Status |
| --- | --- | ---: | ---: | --- |
| margherita pizza | Margherita pizza | 300 | 250 | found |

Totals: found 1, missed 0, invented 0.

## Photo 05.jpg

Pipeline outcome: ready; elapsed 38.30 seconds.

| Expected item | Returned item | Expected grams | Returned grams | Status |
| --- | --- | ---: | ---: | --- |
| hamburger | Hamburger | 250 | 280 | found |
| french fries | French fries | 150 | 150 | found |
| — | Dipping sauce | — | 30 | invented |

Totals: found 2, missed 0, invented 1.

## Photo 06.jpg

Pipeline outcome: ready; elapsed 41.37 seconds.

| Expected item | Returned item | Expected grams | Returned grams | Status |
| --- | --- | ---: | ---: | --- |
| caesar salad | — | 220 | — | missed |
| — | Grilled chicken Caesar salad with croutons | — | 320 | invented |
| — | Lemon wedge | — | 15 | invented |

Totals: found 0, missed 1, invented 2.

## Photo 07.jpg

Pipeline outcome: ready; elapsed 40.95 seconds.

| Expected item | Returned item | Expected grams | Returned grams | Status |
| --- | --- | ---: | ---: | --- |
| pancakes | pancakes | 120 | 120 | found |

Totals: found 1, missed 0, invented 0.

## Photo 08.jpg

Pipeline outcome: ready; elapsed 17.75 seconds.

| Expected item | Returned item | Expected grams | Returned grams | Status |
| --- | --- | ---: | ---: | --- |
| ramen | Ramen | 500 | 550 | found |

Totals: found 1, missed 0, invented 0.

## Photo 09.jpg

Pipeline outcome: ready; elapsed 29.96 seconds.

| Expected item | Returned item | Expected grams | Returned grams | Status |
| --- | --- | ---: | ---: | --- |
| cheeseburger | Cheeseburger | 280 | 280 | found |
| french fries | French fries | 150 | 150 | found |

Totals: found 2, missed 0, invented 0.

## Photo 10.jpg

Pipeline outcome: ready; elapsed 67.27 seconds.

| Expected item | Returned item | Expected grams | Returned grams | Status |
| --- | --- | ---: | ---: | --- |
| roast lamb | Roast lamb | 180 | 180 | found |
| Yorkshire pudding | Yorkshire pudding | 80 | 60 | found |
| stuffing | Stuffing | 80 | 80 | found |
| — | Gravy | — | 60 | invented |

Totals: found 3, missed 0, invented 1.

Overall: found 12, missed 3, invented 14. Ready photos: 10/10.

Non-ready photos are reported as missed expected items because no completed result was available; this includes pipeline failures, not only recognition failures. Unmatched returned names are labeled invented by this mechanical matcher; ingredient-level versus composite-dish naming requires visual review and is not itself proof of hallucination.

<!-- eval-results:end -->
