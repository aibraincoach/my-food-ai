Head at submission: 8c9ffe5ec3481162b443d6235567826e93d43552
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 25.4s
Elapsed since tab open: 29.2s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/633

Answer
Links
Images
Share
7:10 PM

code review 
 aibraincoach/my-food-ai#633

Finished
15s

Pull Request #633 (run18/estimate: refuse empty nutrition reuse) strengthens nutrition data integrity by blocking reuse of incomplete macro rows, preventing protein mismatches in USDA lookups, and tightening drink caffeine retention rules. The changes are well-scoped and backed by unit tests, though there are a few edge cases worth noting in caffeine filtering and synthetic food blending.

Empty Nutrition Reuse Guards

Centralized validation: Adding nutritionUnavailable in src/lib/nutrition/available.ts cleanly standardizes the check for missing calories, protein_g, carbs_g, or fat_g across certifiedPriorNutrition, replayCorrection, and recompute.

Upsert fix: Removing ignoreDuplicates: true from the item_nutrition upsert in src/lib/worker/jobs/recompute.ts ensures that previously saved incomplete rows are actually overwritten when recomputed.

Model estimate strictness: Requiring protein_g, carbs_g, and fat_g alongside calories in src/lib/fdc/estimate.ts prevents partial model estimates from entering the pipeline.

Protein Matching and Rice Blending

Mismatch filtering: referenceProteinMismatch in src/lib/fdc/protein-reference.ts effectively blocks whole-dish USDA records (such as tuna-topped sushi) from matching items with a different named protein (such as squid nigiri).

Fragile topping regex: The topped match (/\btopped with ([a-z]+)/) only captures the word immediately following topped with, so a phrase like "topped with grilled tuna" captures "grilled" instead of "tuna". The subsequent PROTEIN_WORDS loop still catches "tuna", making the first topped check redundant.

Unranked blend selection: In composeRiceWithProtein (src/lib/fdc/approximate.ts), proteins[0] and rices[0] are selected directly from searchFoods without ranking or LLM selection, which could pair an unintended preparation (such as fried rice or raw protein) with a fixed 55/45 split.

Synthetic FDC ID: blendFoodsPer100 in src/lib/fdc/nutrients.ts assigns fdcId: 0 to blended foods; verify that downstream tracing and storage treat 0 as a synthetic record rather than an invalid foreign key.

Drink Caffeine Retention Rules

Category override bug: In src/lib/intake/alcohol.ts, namesCaffeineSource returns true if CAFFEINE_DRINK_CATEGORIES.has(category) even when NO_CAFFEINE.test(item.name) is true. A USDA-categorized "Coffee" or "Tea" item named "decaf coffee" or "herbal tea" will still retain caffeine.

Name matching on dishes: DRINK_NAME includes wine, beer, tea, and coffee, which can classify non-drink items (such as "beer battered fish" or "tea cake") as drinks.

Test Coverage

The new tests/nutrition-availability.test.mjs and updated tests/prior-version-rollout.test.mjs cover the core macro availability checks, squid/tuna mismatch case, and basic drink caffeine rules. Adding test cases for "decaf coffee" with a "Coffee" food category and multi-word "topped with ..." descriptions would close the remaining gaps.

Show me the suggested code fixes for the PR
Explain the protein mismatch filtering logic more closely
Draft a review comment about the fragile topping regex
Check how the caffeine retention rules are implemented
How are the new unit tests structured
Sources
⠹
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen