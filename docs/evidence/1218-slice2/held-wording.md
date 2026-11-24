# Owner wording holds (#1243/#1253)

These stay outside the message files under the one named HELD_FOR_OWNER_WORDING lint entry. Japanese checks must report them as known holds, not pass them as Japanese.

| Current wording (templates show the stored food name as {food}) | Source |
|---|---|
| Log a meal in seconds. | src/app/(auth)/_components/AuthProduct.tsx:22 |
| Photograph it, type it or say it. | src/app/(auth)/_components/AuthProduct.tsx:23 |
| Consumed nutrition from USDA FoodData Central | src/components/NutritionTable.tsx:16 |
| Nutrition values from USDA FoodData Central. | src/components/NutritionTable.tsx:22 |
| Log meals with a photo and get nutrition numbers. | src/app/layout.tsx:16 (metadata description) |
| The model did not treat “{food}” as a food, so no nutrition was estimated. | src/lib/fdc/unavailable.ts:22 |
| No USDA record matched “{food}” and the model gave no usable estimate. | src/lib/fdc/unavailable.ts:23 |
| No USDA record matched “{food}”. | src/lib/fdc/unavailable.ts:24 |

The matcher's quoted detail remains stored data and is never parsed or translated. Existing source-reason composition remains unchanged. The held visible hero and USDA elements declare lang=en for assistive technology without changing their words or styles.
