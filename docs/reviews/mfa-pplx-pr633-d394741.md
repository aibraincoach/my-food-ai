Head at submission: d3947416ac606cce6e390af1d17c6a25a6547ac5
Model proof: model_preference = gemini38flash
Elapsed since Enter: 52.9s
Elapsed since tab open: 59.6s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/633

Answer
Links
Images
Share
11:07 AM

code review 
 aibraincoach/my-food-ai#633

Finished
24s

Review verdict: changes requested for PR #633 at head d3947416. I found four correctness issues in the new fallback and caffeine logic. The missing-macro reuse guards are a useful improvement, but the issues below should be addressed before merging.

Findings
1. [P1] The fallback can add rice to a dish that contains none

Location: src/lib/fdc/match.ts, dishSuggestsRice and the call to composeRiceWithProtein.

The fallback tests the entire name and caption for rice|sushi|nigiri|donburi|bowl. That makes “bowl” sufficient evidence of rice, and it lets another food mentioned in the caption determine this item’s composition.

For example, when earlier matching fails:

chicken salad bowl can become 55% rice and 45% chicken.

An item named grilled salmon can receive rice because the caption mentions a separate rice dish.

The composed food returns immediately, so estimateFood never gets an opportunity to resolve the actual dish.

Fix: require item-specific evidence that rice is an ingredient. Do not use “bowl” alone, and do not infer an individual item’s ingredients from unrelated caption text. Otherwise, continue to the estimate path.

Regression tests: assert that “chicken salad bowl” does not invoke rice composition, and that rice elsewhere in the caption does not alter “grilled salmon.”

2. [P1] Component selection accepts the first search hit without checking that it is the intended ingredient

Location: src/lib/fdc/approximate.ts, composeRiceWithProtein, lines 56–62.

The new composer takes rices[0] and proteins[0]. Its eligibility filter checks data type, nutrient presence, exclusions, and a limited protein-mismatch heuristic—but never establishes that the selected record is plain cooked rice or the intended protein preparation.

In particular:

ts
referenceProteinMismatch("squid nigiri", "Fish, salmon, raw")

returns false. The guard only rejects differing protein words when the description contains “topped with” or "with " + word. It is not a positive ingredient-identity check.

Consequently, if a search result starts with a compound dish, unsuitable preparation, or unrelated protein, the composer can accept it automatically and bypass the model estimate.

Fix: validate each component’s identity and preparation before blending. Require a suitable cooked-rice record and the requested protein, rather than relying on search order and the absence of a mismatch. Return null when either component cannot be validated.

Regression tests: mock search results with a wrong-protein record or compound rice dish first, followed by the correct component; ensure the correct record is selected or composition is declined.

3. [P2] Category matching overrides explicit caffeine-free names

Location: src/lib/intake/alcohol.ts, namesCaffeineSource.

The expression is:

ts
(CAFFEINE_SOURCE.test(item.name) && !NO_CAFFEINE.test(item.name))
  || CAFFEINE_DRINK_CATEGORIES.has(category)

The category branch bypasses NO_CAFFEINE. These therefore all return true:

ts
keepsCaffeine({ name: "caffeine-free cola", food_category: "soft drinks" })
keepsCaffeine({ name: "herbal tea", food_category: "tea" })
keepsCaffeine({ name: "decaf coffee", food_category: "coffee" })

Under the policy already expressed by NO_CAFFEINE, this retains precisely the reference caffeine the name is supposed to suppress. The existing alcohol-specific suppression also regresses for an explicitly caffeine-free drink assigned one of these categories.

Fix: make the negative-name rule take precedence over both positive-name and category matching:

ts
if (NO_CAFFEINE.test(item.name)) return false;
return CAFFEINE_SOURCE.test(item.name)
  || CAFFEINE_DRINK_CATEGORIES.has(category);

Regression tests: cover explicit caffeine-free names with positive drink categories, not just food_category: null.

4. [P2] Blending energy by nutrient ID can silently drop one component’s calories

Location: src/lib/fdc/nutrients.ts, blendFoodsPer100, lines 98–106.

The blend merges nutrients only when their IDs match. However, scaleNutrition treats energy IDs 1008, 2047, and 2048 as alternatives and reads only the first available one.

A valid pair can therefore produce incorrect calories:

Rice supplies 100 kcal under ID 1008, with share 0.55.

Protein supplies 200 kcal under ID 2047, with share 0.45.

The blend stores 55 under 1008 and 90 under 2047.

scaleNutrition reads 1008 and reports 55 kcal rather than the weighted 145 kcal.

The same general problem exists when equivalent nutrients use different units: the merge silently skips the later contribution instead of converting it or rejecting the blend.

Fix: normalize each component to canonical nutrient IDs and units before blending. Resolve each component’s preferred energy value first, then combine those values into a single canonical energy nutrient.

Regression test: blend records that use different supported energy IDs and assert the weighted total after scaleNutrition.

Validation and scope

I inspected the PR diff and the head versions of the approximation and nutrient-scaling code. This was a static review; I did not execute the test suite.

The returned check-run list contained only a successful “Vercel Preview Comments” check—not evidence that the application tests passed. The new tests cover the basic missing-macro predicate, one protein-topping mismatch, and drinks without categories; they do not cover the failure cases above.

No review comments or approval were posted to GitHub.

Show me the code fixes for those P1 issues
How do I test the rice fallback locally
Write a polite review comment for this PR
Explain the regression test strategy here
Check if other files need macro guards
⠋
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol