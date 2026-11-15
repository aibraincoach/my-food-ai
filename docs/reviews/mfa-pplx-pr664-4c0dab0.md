Head at submission: 4c0dab0166a3bf2130e2b37e7d4f483aa0aec52f
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 22.3s
Elapsed since tab open: 26.1s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/664

Answer
Links
Images
Share
11:12 AM

code review 
 aibraincoach/my-food-ai#664

Finished
12s

PR #664 (fix18: label serving unit + crop merge, already merged) cleanly addresses EXIF orientation before label cropping, non-destructive retry merging, and serving portion units in the database.

Label orientation and retry merge

EXIF orientation fix: Adding orientLabelImage (sharp(image).rotate().toBuffer()) and passing oriented to both readLabelOnce and cropLabelBox ensures that bounding-box coordinates from the first pass align with the pixel buffer during the crop retry.

Non-destructive merge: mergeLabelReading preserves first.box, first.product_name, and first.serving (falling back to retry only when null) while filling in non-null per_serving nutrients from retry.

Minor edge case: readNutritionLabel only calls mergeLabelReading when macroCompleteness(retry) > macroCompleteness(reading) (counting only protein_g, carbs_g, fat_g). If retry recovers kcal, fibre_g, sugar_g, or sodium_mg without increasing the core-macro count, those values are discarded.

Database migration for serving units

Unit validation and storage: 0060_label_serving_unit.sql updates both create_food_post and create_food_post_without_gtin to allow 'serving' alongside 'g' and 'ml', formats portion_text with singular/plural handling (1 serving vs 2 servings), and sets portion_grams to null when v_unit <> 'g'.

Stale validation message: Both functions still raise 'Portion must be between 0 and 100000 grams' when p_grams is out of range, even when v_unit is 'ml' or 'serving'.

Duplication: create_food_post and create_food_post_without_gtin duplicate the same ~60 lines of validation and media-lock logic (differing only in food_category on item_nutrition), which increases maintenance risk if future unit rules change.

Test coverage

Unit and DB tests: tests/label-reading.test.mjs verifies mergeLabelReading behavior, and tests/db/label-serving-unit.test.mjs verifies create_food_post with 'serving' (plural) and rejection of 'cup' inside a rolled-back transaction.

Gaps: Neither create_food_post_without_gtin nor the singular '1 serving' branch is covered by the new DB test.

Code review audit for GitHub pull request #664 — architectural risks, security flaws, and test gaps
Computer
Show me the SQL migration file for the serving unit fix
Write a SQL test for the create_food_post serving unit
How can we refactor the duplicated SQL validation logic
Show me the code changes for the EXIF orientation fix
Sources
⠧
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen