Head at submission: 2760df69e5a411ff6828be922173a446105ce12a
Model proof: model_preference = gemini38flash
Elapsed since Enter: 61.3s
Elapsed since tab open: 65.5s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/197

Answer
Links
Images
Share
10:18 PM

code review 
 aibraincoach/my-food-ai#197

Finished
30s

Pull request 
 aibraincoach/my-food-ai#197 introduces text-based ranking heuristics and calorie constraints to prevent nonsensical FDC food mappings, passes item names through the pipeline, and updates prompt portion guidance. The changes effectively resolve the immediate mapping issues reported in #189, though the scoring logic introduces several edge cases and maintainability tradeoffs.

Summary of Changes

Added scoreFoodMatch in src/lib/fdc/nutrients.ts to rank candidate foods by query token containment, domain-specific rule penalties/bonuses, and data-type rank.

Updated chooseBestMatch to accept an optional query string and score candidates before falling back to data-type rank.

Wired item.name into chooseBestMatch across persist.ts, correct.ts, and recompute.ts.

Updated prompt rules in src/lib/prompts/spark/identify.ts with explicit portion anchors for thin slices (ham, toast), scrambled eggs, black coffee/tea, and undressed green salads.

Added unit tests in tests/fdc-match.test.mjs verifying match preferences for salad, coffee, eggs, and queries without text.

High-Priority Findings
Partial Token Substring Matching

In queryTokens, the token matching checks substring inclusion rather than word boundaries:

ts
for (const token of queryTokens(query)) {
  if (desc.includes(token)) score += 1;
}

Short tokens or shared stems will match unintended words (for example, token "egg" matches "eggplant", "nut" matches "donut", or "pea" matches "peach").

Recommendation: Match tokens against word boundaries using regex or by tokenizing desc:

ts
const descTokens = new Set(desc.split(/[^a-z]+/));
for (const token of queryTokens(query)) {
  if (descTokens.has(token)) score += 1;
}
Fragile Domain-Specific Hardcoding

Rules in scoreFoodMatch use ad-hoc string and regex checks:

/\\b(tuna|ham|potato|egg) salad\\b/.test(desc) penalizes salads containing egg, tuna, etc. If a user actually logs "egg salad" or "tuna salad", /\\bsalad\\b/.test(q) still matches while !/\\bdressing\\b/.test(q) is true, penalizing the correct item by 4 points.

/\\bpepper\\b/.test(desc) && !/\\bcoffee\\b/.test(desc) in the coffee block was likely added to handle Dr Pepper or pepper spices, but penalizing specific brand/flavor anomalies directly in matching logic causes regression risk as food vocabulary grows.

Checking kcal !== null && kcal <= 5 in coffee matching is a good heuristic, but if a zero-calorie drink hit lacks energy nutrient fields (energyPer100Kcal returns null), it misses the +3 boost.

Recommendation: Check if the modifier in the description exists in the query before penalizing (e.g., only penalize "tuna salad" if the query does not contain "tuna"):

ts
if (/\\b(tuna|ham|potato|egg) salad\\b/.test(desc)) {
  const match = desc.match(/\\b(tuna|ham|potato|egg)\\b/)?.[1];
  if (match && !q.includes(match)) score -= 4;
}
Medium-Priority Suggestions
Case Sensitivity in Token Extraction

In queryTokens(query):

ts
function queryTokens(query: string): string[] {
  return [...new Set(
    query.toLowerCase().split(/[^a-z]+/).filter((token) => token.length > 2 && !QUERY_STOP.has(token)),
  )];
}

This regex drops numbers (e.g., "2% milk" loses "2", "7up" becomes "up", and accented characters or non-Latin food names are stripped). Consider using /\p{L}+/u or preserving alphanumeric food identifiers.

Data Type Tie-Breaking Consistency

In chooseBestMatch:

ts
if (score > bestScore || (score === bestScore && rankOf(food.dataType) < rankOf(best.dataType))) {
  best = food;
  bestScore = score;
}

Because scoreFoodMatch already subtracts rankOf(food.dataType) * 0.01, two items with identical integer rule scores will already have distinct floating-point scores unless their data types are identical. The explicit score === bestScore check is largely redundant, but harmless.

Prompt Guidelines

The adjustments in src/lib/prompts/spark/identify.ts provide clear, realistic portion baselines for common breakfast items (5–15 g for thin ham slices, ~50 g per egg, ~240 g per cup of coffee/tea). These constraints will help prevent LLM vision overestimation on standard café/diner plating.

Show me the rest of the code review findings
How can I fix the token substring matching issue
Write a test case for the egg penalty rule
Show me how to refactor scoreFoodMatch
Review the prompt changes in identify.ts
Sources
⠴
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash