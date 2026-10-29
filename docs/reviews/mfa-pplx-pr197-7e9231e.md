Head at submission: 7e9231eeaebdfb7d2b6c77bc65c0c59643cf6667
Model proof: model_preference = gemini38flash
Elapsed since Enter: 60.7s
Elapsed since tab open: 64.9s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/197

Answer
Links
Images
Share
10:22 PM

code review 
 aibraincoach/my-food-ai#197

Finished
30s

Pull request 
 aibraincoach/my-food-ai#197 introduces text-scoring heuristics (scoreFoodMatch) in src/lib/fdc/nutrients.ts, wires query strings into chooseBestMatch across pipeline workers, and adds explicit portion anchors in src/lib/prompts/spark/identify.ts.

Summary of Changes

The PR addresses issue #189, where searching for common breakfast items resolved to incorrect condiments or dairy alternatives:

src/lib/fdc/nutrients.ts: Adds scoreFoodMatch to prioritize keyword token overlaps, applies category-specific bonuses/penalties (for salads, coffee, and eggs), and breaks ties by USDA data-type rank.

Pipeline integration: Updates chooseBestMatch(foods, row.name) in persist.ts, correct.ts, and recompute.ts so food candidate lists are evaluated against the detected item query.

Prompt rules: Tightens portion estimates in src/lib/prompts/spark/identify.ts for breakfast foods (thin ham slices, single Japanese toast slices, individual eggs, black coffee, and green salads).

Automated tests: Adds unit test suite in tests/fdc-match.test.mjs verifying keyword selection heuristics.

Key Findings
1. Hardcoded Rules vs Generic Token Weighting

The domain heuristics inside scoreFoodMatch use negative and positive regex rules tailored to known failure cases:

/\\bpepper\\b/.test(desc) && !/\\bcoffee\\b/.test(desc) to avoid Dr Pepper or black pepper spices when matching coffee.

Fixed point penalties (-8, -10, +4) create an arbitrary hierarchy that could invert rankings for multi-ingredient or hybrid dishes. For example, a query for "coffee with soy milk" will still heavily penalize FDC entries containing "soymilk" or "silk" by -8.

Recommendation: Consider checking whether the penalized keyword was explicitly present in the query before applying a penalty, similar to the compound salad check (compound && !q.includes(compound)).

2. Token Normalization Strips Alphanumeric Markers

In queryTokens:

ts
query.toLowerCase().split(/[^a-z]+/).filter((token) => token.length > 2 && !QUERY_STOP.has(token))

Splitting strictly on /[^a-z]+/ drops numbers and non-ASCII letters. Queries such as "2% milk" lose the "2", and foods with accented names (e.g., "café") will split unexpectedly. Using Unicode word boundaries or /[\p{L}\p{N}]+/u ensures numbers and localized names remain searchable.

3. Redundant Tie-Breaking Condition

In chooseBestMatch:

ts
if (score > bestScore || (score === bestScore && rankOf(food.dataType) < rankOf(best.dataType)))

Because scoreFoodMatch already incorporates score -= rankOf(food.dataType) * 0.01, candidate scores with identical base points will rarely evaluate to score === bestScore unless their data types are also identical. The secondary comparison is harmless dead code, but consolidating data-type ranking into one place clarifies logic.

4. Commits and Repository Artifacts

A review snapshot (docs/reviews/mfa-pplx-pr197-2760df6.md) was committed to the repository history in commit 7e9231e. Unless intentional as permanent audit documentation, review markdown dumps should generally be omitted from production source code.

Verdict

The PR successfully prevents the catastrophic food misclassifications identified in #189 while preserving deterministic fallback behavior when query text is missing. Addressing the negative-penalty checks for intentional queries (e.g. coffee with soy milk) and cleaning up review artifacts are recommended prior to merging.

Show the suggested code changes for scoreFoodMatch
Check the tests in tests/fdc-match.test.mjs
Look at the prompt rules in identify.ts
Explain the FDC data-type rank tiebreaker
Draft a review comment for this pull request
Sources
⠧
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash