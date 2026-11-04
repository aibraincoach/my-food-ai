Lane G — exclusion guard (#596)

Implementation: ordinary and closest-generic USDA candidate pools exclude references with no/without a component unless the target explicitly excludes the same component. Target no/without synonyms are equivalent and whole component words are compared, avoiding substring false positives. No added fat/salt/sugar notes remain eligible.

Checks:
- node --import tsx --test tests/fdc-reference-search.test.mjs tests/fdc-match-response-budget.test.mjs tests/analysis-integrity.test.mjs tests/food-estimate.test.mjs: 32 pass, 0 fail.
- npx tsc --noEmit: exit 0.
- M6 real Meta/USDA gate: PASS all 18 cases, elapsed 76397ms, 54 USDA requests, code head 4329b97945a18ed523767fb46238c416fbdfcced. Full receipt /tmp/run16-g-real-smoke.json.
- Caesar selected USDA 2422578, Branded: CHICKEN CAESAR GRILLED CHICKEN ON LEAF LETTUCE WITH PARMESAN CHEESE, CROUTONS & CAESAR DRESSING SALAD, CHICKEN CAESAR.

Noticed, left unchanged: fixture accepts Squid nigiri -> Sushi, topped with tuna via existing closest-generic approximation policy. All 17 non-Caesar cases meet their existing gate assertions; this is not a species-accuracy claim.

M6 selected records:

|Case|Selected|Pass|
|---|---|---|
|Japanese toast|2707599 Bread, white, toasted|True|
|ham|2705878 Ham|True|
|green salad|2709792 Mixed salad greens, raw|True|
|scrambled egg|2707198 Egg omelet or scrambled egg, NS as to fat|True|
|black coffee|2710375 Coffee, brewed|True|
|Tonkatsu|2705876 Pork, steak, coated|True|
|Japanese curry sauce|2710178 Curry sauce|True|
|Cooked white rice|2708403 Rice, white, cooked, NS as to fat|True|
|lentil soup|2707462 Soup, lentil|True|
|baked salmon|2706286 Fish, salmon, baked or broiled|True|
|raw apple|2709215 Apple, raw|True|
|Squid nigiri|2708971 Sushi, topped with tuna|True|
|cooked spaghetti|2708357 Pasta, cooked|True|
|Margherita pizza|173292 Fast Food, Pizza Chain, 14" pizza, cheese topping, regular crust|True|
|Grilled chicken Caesar salad with croutons|2422578 CHICKEN CAESAR GRILLED CHICKEN ON LEAF LETTUCE WITH PARMESAN CHEESE, CROUTONS & CAESAR DRESSING SALAD, CHICKEN CAESAR|True|
|ceramic plate|unavailable|True|
|spicy Indonesian fried macaroni snack|2708357 Pasta, cooked|True|
|cendol|2710310 Gelatin dessert|True|

Review follow-up at head e54697c2abaacd65c98fbbc2f57ef8870c71d2f8:
- Incomplete/invalid PPLX output identified a concrete multiword collision: reference 'no hot peppers' was treated as compatible with target 'no hot sauce' because the original helper compared only the first word hot. This is a real code finding even though that capture does not count as independent review.
- Fixed by retaining the reference's full excluded component phrase up to punctuation/conjunction, matching that phrase to the beginning of an explicit target exclusion with a whole-word boundary. Target 'without hot peppers please' still permits reference 'no hot peppers'.
- All34 targeted tests pass, including candidate-level collision coverage and equivalent phrases/trailing context/conjunction cases. TypeScript passes.
- Real18 gate rerun once for changed parser; receipt /tmp/run16-g-real-smoke-multiword.json (final result appended below when terminal).

Final M6 rerun PASS all 18 cases at e54697c2abaacd65c98fbbc2f57ef8870c71d2f8, 79569 ms, 54 USDA requests. Caesar again selected 2422578 with croutons and Caesar dressing; no rejected phrase. Final receipt supersedes previous-head M6 receipt.

|Case|Selected record|Pass|
|---|---|---|
|Japanese toast|2707599 Bread, white, toasted|True|
|ham|2705878 Ham|True|
|green salad|2709792 Mixed salad greens, raw|True|
|scrambled egg|172187 Egg, whole, cooked, scrambled|True|
|black coffee|2710375 Coffee, brewed|True|
|Tonkatsu|2705876 Pork, steak, coated|True|
|Japanese curry sauce|2710178 Curry sauce|True|
|Cooked white rice|2708403 Rice, white, cooked, NS as to fat|True|
|lentil soup|2707462 Soup, lentil|True|
|baked salmon|2706286 Fish, salmon, baked or broiled|True|
|raw apple|2709215 Apple, raw|True|
|Squid nigiri|2708971 Sushi, topped with tuna|True|
|cooked spaghetti|2708357 Pasta, cooked|True|
|Margherita pizza|173292 Fast Food, Pizza Chain, 14" pizza, cheese topping, regular crust|True|
|Grilled chicken Caesar salad with croutons|2422578 CHICKEN CAESAR GRILLED CHICKEN ON LEAF LETTUCE WITH PARMESAN CHEESE, CROUTONS & CAESAR DRESSING SALAD, CHICKEN CAESAR|True|
|ceramic plate|unavailable|True|
|spicy Indonesian fried macaroni snack|2708357 Pasta, cooked|True|
|cendol|2710310 Gelatin dessert|True|
