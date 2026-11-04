Thread URL: https://www.perplexity.ai/search/39d32019-1633-4e5f-8ce0-4bae491fddf5
Head at submission: 498bb1f143ced81a95228e5f8158bbee6dd704af
Model proof: model_preference = gemini38flash
Elapsed since Enter: 45.0s
Elapsed since tab open: 55.5s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/493

Answer
Links
Images
Share
5:53 PM

code review 
 aibraincoach/my-food-ai#493

Finished
18s

This pull request correctly fixes the feed summary regression where photographed alcohol drinks reported "alcohol unavailable" due to feed item snapshots omitting micronutrient 1018.

Overview
Dimension	Details
Pull Request	
 aibraincoach/my-food-ai#493
Branch	run11/alcohol-summary-hydration → main
Scope	2 files (+15, -2 lines)
Key Changes	Prioritize hydrated drink.alcoholG / row.alcoholG before falling back to item micronutrients in summaryLine(); update outdated test assertion and add hydration test cases
Code Analysis

The bug stemmed from summaryLine re-deriving alcohol grams solely from post.items.reduce(..., alcoholGrams(item.micronutrients)) . Because feed item snapshots strip non-water micronutrients to minimize payload size, nutrient 1018 is absent, causing g to evaluate to 0 and triggering the fallback label "alcohol unavailable" .

The updated resolution logic in src/lib/posts/summary-line.ts:

typescript
const g = drink?.kind === 'alcohol' && drink.alcoholG != null
  ? drink.alcoholG
  : drinks
      .filter(row => row.kind === 'alcohol')
      .reduce(
        (sum, row) =>
          sum + (row.alcoholG ?? alcoholGrams(post.items.find(item => item.id === row.post_item_id)?.micronutrients)),
        0
      );

Precedence order: Direct drink.alcoholG takes first priority if drink.kind === 'alcohol' .

Linked row hydration: If drink is omitted or unhydrated, it aggregates row.alcoholG across alcohol item drinks .

Legacy nutrient fallback: If row.alcoholG is nullish, it evaluates alcoholGrams(...) against the matching item's micronutrients .

Zero handling: Using drink.alcoholG != null and row.alcoholG ?? ... preserves valid numeric zeroes without falling back erroneously on falsy checks .

Test Coverage

The test suite in tests/search-drink-summary.test.mjs was augmented with comprehensive assertions:

Aligns the existing caffeine assertion with recent wording updates ("mg caffeine today") .

Validates a feed snapshot containing only water nutrients (1051) where alcohol is sourced from hydrated drink data (15 g alcohol · 1.1 standard drinks · 160 kcal) .

Confirms parity between summaryLine and cardDataFromRow .

Verifies behavior when drink: null falls back to itemDrinks[].alcoholG, as well as when alcoholG: 0 renders "alcohol unavailable" .

Recommendation

LGTM (Approved). The patch is minimal, cleanly isolates the regression, preserves backward compatibility with raw micronutrient callers, and provides full unit test coverage. It is ready to merge.

Draft a release note for this fix
Show me the updated unit tests
Check for other missing micronutrients
How could we prevent future regressions here
Suggest a clean refactor for summary-line.ts
⠙
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash