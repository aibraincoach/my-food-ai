# Matcher #272 / observed failure #420

The original report baseline returned unavailable for four of five identical `cheeseburger with lettuce, tomato, onion and pickle` inputs; the fifth selected USDA 2706888. `dipping sauce` selected 2705618 in five of five calls.

An additional instrumented baseline reproduced a failure while **2706888 was actually in the first supplied candidate list**. Its final schema decision treated unspecified vegetable toppings as missing. Subsequent searches discarded this candidate, and the server ignored the second decision's distinct `cheeseburger` refinement. This evidence supports both protocol fixes; it does not claim that a candidate missing from the final search was absent throughout the resolution.

The fix keeps eligible identities across up to three searches, keeps their original nutrient values, accepts a distinct second refinement, and retains the first base-food fallback when refinement is absent or repeated. The chooser receives the remaining-search count. Generic whole-dish descriptions need not spell out every ordinary topping, but explicit exclusions, incompatible preparations and missing substantial components still reject. No food names, USDA identities or nutrient values are special-cased. Matcher reference version is v7.

## Real follow-up

- Exact original cheeseburger wording including commas: **5/5 selected 2706888**, each on the first search. The earlier punctuation-normalized follow-up also selected it 5/5, with search counts 3,1,3,1,1.
- Dipping sauce: **5/5 selected 2705618**, each on the first search.
- Existing sixteen-case real food-reference gate: **16/16 passed**, including non-food rejection and whole-dish composition cases.
- Controlled real-model exclusion test: candidate 900001 is a **synthetic test-only** hamburger explicitly without cheese, with valid nutrient metadata solely to make it eligible. All three supplied pools contained it; the chooser rejected it throughout. An earlier malformed fixture yielded an empty pool and is not evidence of component rejection.
- Whole `beef tenderloin steak topped with butter` and `sauteed spinach with corn` names still reject incomplete single references. This is intentional component preservation, not a claim that plain steak or spinach covers the full dish.

The identify prompt previously returned steak with butter as one 180 g compound. It now generically separates independently portionable additions and separately named side components in the existing identify call, retaining conventional whole dishes and forbidding hidden-ingredient inference or duplicate combined weights. The schema and worker already support these separate portions, including foods sharing a photo region.

Real caption-only identify → USDA resolution after this change:

| Caption | Estimated components | Genuine USDA references |
| --- | --- | --- |
| beef tenderloin steak topped with butter | steak 170 g; butter 10 g | 2705841 Beef, steak, tenderloin; 2710154 Butter, NFS |
| sauteed spinach with corn | spinach 100 g; corn 50 g | 2709618 Spinach, fresh, cooked with oil; 2709913 Corn, NS as to form, cooked |

These are model portion estimates, not measured amounts. Nutrients come from USDA only. Photo-based production acceptance remains a separate owner test; this local evidence does not declare the production Done criterion satisfied. Five consistent repeats demonstrate improvement, not a mathematical determinism guarantee for a probabilistic provider.

## Verification and cost

`real-matcher.json` contains actual supplied candidate identities and final provider schema decisions, chosen IDs/reasons for every report trial, component portions/references, and usage receipts. It contains no hidden model reasoning or credentials. All paid calls used Muse Spark 1.3 and a persisted pre-request reservation guard. USDA caches and model trace writes were in memory; the guard allowed only Meta, USDA and a local trace sink. No production DB/cache or customer-data requests were made.

Official input/output rates: [Muse Spark pricing](https://dev.meta.ai/models/muse-spark), US$1.25 / US$4.25 per million tokens. Input is conservatively charged at the full rate even when cached. Original baseline US$0.16986275 + all new experiments US$0.45744150 = **US$0.62730425** upper cost, below US$1 combined and the US$0.78 new-call limit. No further paid calls are needed for this PR.

Validation: focused matcher, integrity, identify retry/component retention and portion tests **32/32**; `npx tsc --noEmit`, ESLint for all changed code/tests, `npm run build`, and `git diff --check` passed. The build emits the repository's existing middleware convention deprecation warning. No SQL or DB behavior changed.
