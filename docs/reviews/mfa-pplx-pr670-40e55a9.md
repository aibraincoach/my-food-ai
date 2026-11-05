Head at submission: 40e55a901f81e6a68af3e6bb83677cbf8a454068
Model proof: model_preference = gemini38flash
Elapsed since Enter: 30.4s
Elapsed since tab open: 38.2s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/670

Answer
Links
Images
Share
5:25 PM

code review 
 aibraincoach/my-food-ai#670

Finished
16s
Review verdict

Changes requested. I found two correctness issues in PR #670 at commit 40e55a9. Both are in the alcohol-name matcher; I found no additional issue in the protein-topping change. [github_mcp_direct]

1. P2 — Food exclusions also suppress valid alcoholic drink names

Location: src/lib/intake/alcohol.ts:6

The negative lookbehind applies to every alternative, not just cocktail:

ts
/(?<!fruit |shrimp |prawn )\b(cocktail|tiki|mojito|margarita|daiquiri|sangria|(?<!fruit )punch)\b(?! sauce)/i

Consequently, these name-only inputs change from alcoholic before the PR to nonalcoholic afterward:

ts
isAlcoholic({ name: 'fruit margarita', food_category: null, micronutrients: [] })
isAlcoholic({ name: 'fruit sangria', food_category: null, micronutrients: [] })

Both return false: the drink token immediately follows fruit , and neither category nor nutrient metadata supplies a fallback. The intended food exclusion for fruit cocktail should not disable recognition of margaritas or sangria. [github_mcp_direct]

Suggested fix: scope the food lookarounds to the cocktail alternative. Add regression tests for fruit margarita and fruit sangria alongside the existing food-cocktail tests.

2. P2 — Bare punch introduces false positives for nonalcoholic drinks

Location: src/lib/intake/alcohol.ts:6

Adding punch fixes the new rum punch fixture, but also makes any otherwise-unqualified punch alcoholic unless it immediately follows exactly fruit . For example:

ts
isAlcoholic({ name: 'nonalcoholic punch', food_category: null, micronutrients: [] })
// true

isAlcoholic({ name: 'cranberry punch', food_category: null, micronutrients: [] })
// true

These inputs previously returned false. The name match alone is sufficient to return true, regardless of the absence of alcohol nutrients or an alcoholic category. A generic punch token does not establish that the drink contains alcohol. [github_mcp_direct]

Suggested fix: recognize an explicitly qualified phrase such as rum punch, rather than adding bare punch. Include negative tests for generic punch and explicitly nonalcoholic punch.

Suggested matcher

This addresses both findings while preserving the existing positive rum punch test:

ts
const ALCOHOLIC_NAME =
  /\b(?:tiki|mojito|margarita|daiquiri|sangria|rum\s+punch)\b|(?<!fruit |shrimp |prawn )\bcocktail\b(?! sauce)/i;

This is a targeted correction, not a comprehensive parser for nonalcoholic variants of every cocktail name.

Scope and validation

I inspected all three changed files and the surrounding implementations of isAlcoholic, keepsCaffeine, and referenceProteinMismatch. The protein-topping guard now ignores toppings outside the configured protein-word list, consistent with the added chicken-and-cheese regression test. [github_mcp_direct]

I did not execute the repository’s test suite or post a review to GitHub. The earlier review’s failing-rum punch finding is no longer applicable to this head because punch has since been added to the matcher. [github_mcp_direct]

Code review audit: security, type safety, and async patterns for PR 670 in aibraincoach/my-food-ai
Computer
Draft a review comment with the suggested fixes
Show the corrected regex for src/lib/intake/alcohol.ts
Write regression tests for fruit margarita and sangria
Check how other drink matchers handle lookarounds
⠴
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol