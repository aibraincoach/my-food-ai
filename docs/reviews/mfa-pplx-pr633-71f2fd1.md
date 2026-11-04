Head at submission: 71f2fd1da7d933ce50884d06bfc9ffdd59f15b5b
Model proof: model_preference = gemini38flash
Elapsed since Enter: 27.5s
Elapsed since tab open: 32.2s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/633

Answer
Links
Images
Share
10:52 AM

code review 
 aibraincoach/my-food-ai#633

Finished
15s
Code Review: PR #633 (run18/estimate: refuse empty nutrition reuse)

Overall Assessment: The pull request introduces solid safeguards to prevent partial or empty nutrition from being reused or certified across rollout, correction, and recompute workflows [github_mcp_direct]. However, there are a few edge cases, regex inconsistencies, and performance considerations that warrant attention before merging.

1. High Priority Issues
Unconditional Rice Composition in Food Matching

In src/lib/fdc/match.ts:

typescript
const closest = result.baseFood ? await closestGenericFood(...) : { food: null, reason: result.reason };
if (closest.food && !referenceProteinMismatch(name, closest.food.description)) return { food: closest.food, unavailable: null };
const composed = await composeRiceWithProtein(admin, name, caption, signal);
if (composed.food) return { food: composed.food, unavailable: null };

Issue: composeRiceWithProtein runs on any unmatched item that contains a protein keyword (such as "grilled chicken", "beef stew", or "steamed salmon"), even when the dish contains no rice.

Impact: Plain meats or non-rice dishes that fail generic matching will fallback to combining 55% cooked rice and 45% protein instead of proceeding to model estimation via estimateFood.

Fix: Guard composeRiceWithProtein so it only triggers if the dish explicitly involves rice or sushi/nigiri:

typescript
const dishSuggestsRice = /\b(rice|sushi|nigiri|donburi|bowl)\b/i.test(`${name} ${caption}`);
if (dishSuggestsRice) {
  const composed = await composeRiceWithProtein(admin, name, caption, signal);
  if (composed.food) return { food: composed.food, unavailable: null };
}
2. Moderate Issues & Logic Gaps
Inconsistent Protein Word Lists

In src/lib/fdc/protein-reference.ts:

PROTEIN_WORDS recognizes 25 distinct terms (including turkey, duck, lamb, veal, bacon, ham, sausage, tofu, etc.) [github_mcp_direct].

The second fallback regex in referenceProteinMismatch only searches for 8:

typescript
for (const word of desc.match(/\b(squid|octopus|tuna|salmon|shrimp|chicken|beef|pork)\b/g) ?? [])

Impact: If a user logs "tofu bowl" and the USDA match is "Fried rice with pork", the mismatch check triggers [github_mcp_direct]. But if the user logs "pork bowl" and the USDA match is "Rice bowl with tofu", it fails to trigger the mismatch because tofu is not in the secondary regex list.

Fix: Reuse PROTEIN_WORDS or a unified regex set across both functions.

Word-Boundary Matching with Substring Checks

In referenceProteinMismatch:

typescript
if (topping !== itemProtein && !itemName.toLowerCase().includes(topping)) return true;

Using .includes() rather than word-boundary checks (\b) can produce false positives/negatives with compound names or substring overlaps (e.g., ham in graham or hamburger).

Drink Caffeine Detection Overlaps

In src/lib/intake/alcohol.ts:

typescript
function isDrink(item: ...): boolean {
  return isAlcoholic(item) || CAFFEINE_DRINK_CATEGORIES.has(category) || ALCOHOL_CATEGORIES.has(category) || /\bbeverage/.test(category) || DRINK_NAME.test(item.name);
}

DRINK_NAME regex tests for plain drink or soda without case-insensitive flag (/i), whereas other regular expressions use /i [github_mcp_direct].

DRINK_NAME contains words already covered by CAFFEINE_SOURCE (tea, coffee, cola) [github_mcp_direct]. If an item is named "Coffee cake" or "Tea cookies", DRINK_NAME.test("Coffee cake") will match coffee, marking the food item as a drink and applying drink-specific caffeine rules [github_mcp_direct].

3. Architecture & Performance Suggestions
Concurrent Search in composeRiceWithProtein

In src/lib/fdc/approximate.ts:

typescript
const proteins = eligible(await searchFoods(admin, proteinTerm, signal));
const rices = eligible(await searchFoods(admin, "rice cooked", signal));

These two database queries are executed sequentially. Running them in parallel via Promise.all cuts the lookup latency in half within strict budget boundaries (NUTRITION_MAX_MS):

typescript
const [rawProteins, rawRices] = await Promise.all([
  searchFoods(admin, proteinTerm, signal),
  searchFoods(admin, "rice cooked", signal),
]);
const proteins = eligible(rawProteins);
const rices = eligible(rawRices);
4. Strengths

Strict Macro Integrity: nutritionUnavailable cleanly prevents incomplete records (missing calories, protein, carbs, or fat) from contaminating downstream computations and persistent rollout state [github_mcp_direct].

Replay Safety: replayCorrection and recompute now reliably fall back to fresh resolution when existing entries have missing macronutrients [github_mcp_direct].

Test Coverage: Added clean unit tests in tests/nutrition-availability.test.mjs verifying the new availability and rollout constraints [github_mcp_direct].

Show me the rest of the review
How can I fix the rice composition bug
Show the updated match.ts code
Are there tests for the empty nutrition guard
What are the moderate issues found
⠙
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash