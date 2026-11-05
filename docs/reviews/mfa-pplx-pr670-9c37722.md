Head at submission: 9c37722defaa7cef12017e889094face56e72dbc
Model proof: model_preference = gemini38flash
Elapsed since Enter: 37.3s
Elapsed since tab open: 43.5s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/670

Answer
Links
Images
Share
5:46 PM

code review 
 aibraincoach/my-food-ai#670

Finished
19s
Review verdict

Changes requested for PR #670, reviewed at commit 9c37722defaa7cef12017e889094face56e72dbc.

I found two correctness issues in the revised alcohol-name matcher. The protein-topping change looks appropriately scoped: it stops rejecting cheese toppings while retaining the existing checks for conflicting named proteins.

Findings
1. [P2] Food exclusions also suppress genuine alcoholic drink names

Location: src/lib/intake/alcohol.ts:6

The negative lookbehind applies to every alternative in ALCOHOLIC_NAME, not just cocktail:

ts
/(?<!fruit |shrimp |prawn )\b(cocktail|tiki|mojito|margarita|daiquiri|sangria|rum punch)\b(?! sauce)/i

Consequently, these calls return false when category and nutrient evidence are absent:

ts
isAlcoholic({
  name: 'fruit sangria',
  food_category: null,
  micronutrients: [],
});

isAlcoholic({
  name: 'fruit rum punch',
  food_category: null,
  micronutrients: [],
});

The first is a regression: the previous regex recognized sangria regardless of the preceding word. The second undermines the newly added rum punch support. These names should remain eligible for alcohol classification; only the food-specific use of cocktail needs the prefix exclusions.

Suggested fix: separate cocktail-food disambiguation from recognition of the other drink names. Add regression tests for fruit sangria, fruit mojito, and fruit rum punch, alongside the existing food cases.

2. [P2] Literal-space matching leaves ordinary food-name variants classified as alcohol

Location: src/lib/intake/alcohol.ts:6

The new exclusions recognize only an exact single-space spelling. They do not cover punctuation or whitespace variations:

ts
// Each still returns true with no category or micronutrients:
'fruit-cocktail'
'shrimp-cocktail'
'fruit  cocktail'
'cocktail-style sauce'

For example, the character immediately before cocktail in fruit-cocktail is a hyphen, so the fruit lookbehind does not exclude it. Likewise, the sauce lookahead only excludes the exact suffix sauce.

This leaves the food-classification bug partially unresolved. It also has downstream consequences: the existing hydration code returns zero item water for anything classified as alcoholic, and the item UI can display an alcohol-specific label.

Suggested fix: normalize whitespace and hyphens for name-based matching, or use explicit food-phrase patterns that accept those separators. Keep category and measured-alcohol evidence authoritative; a food-name exception should disable only the name heuristic, not override those other signals.

Test coverage and validation

The added tests cover the intended single-space examples, but not the false negatives or formatting variants above. I would add at least:

Name	Expected with null category and empty nutrients
fruit sangria	true
fruit mojito	true
fruit rum punch	true
fruit-cocktail	false
shrimp-cocktail	false
fruit cocktail	false
cocktail-style sauce	false

Also add a precedence test confirming that a food-like name with explicit alcoholic-category or alcohol-nutrient evidence remains classified as alcoholic.

Validation limits: this was a static review of the diff, both modified implementation files, and relevant callers—not an executed test run. The PR’s check-runs endpoint reported only a successful Vercel Preview Comments check; that is not evidence that the nutrition tests passed. No review or comments were posted to GitHub.

How can I rewrite that regex for the alcohol matcher
Show me the complete updated code for alcohol.ts
Where should I add the regression tests for this fix
Check if any other regex patterns need similar fixes
How do I test this change locally before pushing
⠴
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol