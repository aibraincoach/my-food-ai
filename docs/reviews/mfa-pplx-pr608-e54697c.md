Head at submission: e54697c2abaacd65c98fbbc2f57ef8870c71d2f8
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 28.5s
Elapsed since tab open: 32.1s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/608

Answer
Links
Images
Share
11:22 AM

code review 
 aibraincoach/my-food-ai#608

Finished
19s

PR 
 aibraincoach/my-food-ai#608 cleanly prevents USDA candidate selection from silently picking records that omit dish components (such as "no dressing") unless the target meal also excludes them, and it is already merged into main .

What Works Well

Early filtering in both pipelines: Filtering happens before .slice(0, 30) in src/lib/fdc/approximate.ts and before adding to eligible in src/lib/fdc/match.ts, so excluded records never consume candidate slots .

Preparation-note exemption: The negative lookahead (?!added\b|salt\b|sugar\b|fat\b) in src/lib/fdc/exclusions.ts preserves standard USDA preparation notes like no added fat or without sugar .

Phrase-level matching: Capturing full multi-word phrases up to conjunctions/punctuation avoids false positives like matching no hot peppers against no hot sauce, while targetComponent.startsWith(${component} ) handles trailing words like please .

Focused test coverage: tests/fdc-reference-search.test.mjs covers both unit behavior of excludedComponents and end-to-end matchFood filtering .

Edge Cases to Watch

Shared-negation lists: EXCLUSION only captures the first item after no/without when a single negation spans multiple items (for example, "no dressing or croutons" only captures "dressing", leaving "croutons" unguarded) .

Non-ASCII or numeric ingredients: Because the character class is [a-z]+, accented characters (like jalapeño) or numbers (like 2% milk) will truncate the captured component phrase .

Fallback error messaging: In src/lib/fdc/approximate.ts, if every generic candidate is filtered out by excludedComponents, closestGenericFood still returns "No generic USDA record with nutrition was found for this food.", which does not distinguish missing-component rejections from missing nutrition data .

Minor Suggestions

Extract a shared helper: Both src/lib/fdc/match.ts and src/lib/fdc/approximate.ts duplicate !excludedComponents(food.description, `${name} ${caption}`).length; wrapping that in a small hasExcludedComponent(food, name, caption) helper in src/lib/fdc/exclusions.ts would keep the call sites consistent .

Broaden character matching if needed: Switching [a-z]+ to [\p{L}\p{N}]+ with the u flag would handle accented ingredients without changing existing behavior .

Show me a fix for shared-negations
Help me write a test for accented ingredients
Show how the fallback error message looks
Review another pull request
Check the rest of the codebase
Sources
⠸
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen