# What a stronger Muse model does to My Food AI

Written Nov 16 2026 from the code on main (`5aaded91`). Each mark says what the code hands to a model today. No newer model was measured.

A stronger model removes none of the product's steps. It improves the steps that are model calls today. It leaves unchanged the steps that deterministic code and the database own, and those are what the product keeps.

| Step | What the code does | Who does the work | Mark |
|---|---|---|---|
| Find regions and outlines | Sends the photo to SAM and stores a box and a mask for each region (`src/lib/meta/sam.ts`). | Model call (SAM) | Unchanged: a separate model, and its masks draw the outlines. |
| Identify the food | Sends the photo, the caption and the boxes to Muse Spark, which returns one named item per food (`src/lib/meta/spark.ts`). | Model call | Improved: the names are the model's. |
| Estimate the portion | The same call returns grams per item; the prompt carries fixed anchors such as an egg at 50 g (`src/lib/prompts/spark/identify.ts`). | Model call | Improved: the grams are the model's. |
| Match a USDA record | Code searches FoodData Central and filters the results; the model picks one record or asks for another search, up to three (`src/lib/fdc/match.ts`). | Code and model call | Improved: the model chooses among records the code found. |
| Closest record when none matches | Code searches the plain food name among generic records and the model picks the nearest; for rice dishes code blends a rice record and a protein record (`src/lib/fdc/approximate.ts`). | Code and model call | Improved: the pick is the model's; the search and the label are code. |
| Estimate when no record is close | The model returns values per 100 g; code range-checks them and stores them as an estimate with its basis (`src/lib/fdc/estimate.ts`). | Model call | Improved: these numbers come from the model alone. |
| Scale and total | Multiplies the record's values by the grams and sums the meal (`src/lib/fdc/nutrients.ts`, `src/lib/nutrition/totals.ts`). | Code | Unchanged: arithmetic on stored values. |
| Consumed amount from a leftovers photo | The model estimates the grams not eaten per item; code subtracts and rescales the stored nutrition (`src/lib/meta/remainder.ts`, `src/lib/pipeline/remainder-rule.ts`). | Model call and code | Improved: the reading is the model's; the accounting is code. |
| Drink, caffeine and alcohol records | Classifies items by USDA category, name and the alcohol value, then writes water and caffeine records (`src/lib/intake/`). | Code and database | Unchanged: no model decides these records. |
| Corrections by comment or voice | Muse Voice transcribes; the model rewrites the item list; code matches the changed foods again and reapplies the deductions (`src/lib/worker/jobs/correct.ts`). | Model calls and code | Improved: the model applies the words; the versions and the undo are code. |
| Reuse an earlier meal | The database scores earlier meals, the model confirms the same meal, and code copies the stored nutrition (`src/lib/pipeline/prior.ts`). | Database, model call, code | Unchanged: it depends on the account's stored meals. |
| Keep the history | Stores items, versions, day totals, saved meals and copies for "Eat this again" (`src/lib/posts/`). | Database and code | Unchanged: stored rows and queries. |
| The trail behind a number | Stores the record id, the estimate's basis or the reason a value is unavailable, logs every search and decision, and writes the closest-record sentence in the meal's first comment (`src/lib/fdc/unavailable.ts`, `src/lib/pipeline/wording.ts`, `src/lib/trace/record.ts`). | Code and database | Unchanged: code writes it from the decision. |

## What a stronger model replaces

- The fixed portion anchors in the identify prompt and the long compatibility rules in the match prompt.
- The loops that retry a call with a larger output allowance (`match.ts`, `approximate.ts`, `estimate.ts`).
- The word-list guard against a wrong-species record (`src/lib/fdc/protein-reference.ts`).
- The estimate with no record: there the product adds only a range check and a label to the model's own numbers.

## What the product keeps that a general model with a camera does not have

- Numbers from a named source: a USDA record multiplied by grams. The model supplies numbers only in the labelled estimate.
- A stored trail: each food carries its record id, its estimate's basis or the reason it is unavailable.
- Consumed-versus-leftover accounting that is kept per item and reapplied after a correction.
- Water, caffeine and alcohol records per day.
- The account's own history: Days, saved meals, "Eat this again" and reuse of an earlier meal.
- Outlines that tie each number to a region of the photo.
