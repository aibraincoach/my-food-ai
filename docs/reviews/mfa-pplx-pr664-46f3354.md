Head at submission: 46f3354cd15a42c5d6351cdfbc642104c40a1f3e
Model proof: model_preference = gemini38flash
Elapsed since Enter: 29.3s
Elapsed since tab open: 37.3s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/664

Answer
Links
Images
Share
4:50 PM

code review 
 aibraincoach/my-food-ai#664

Finished
16s

An in-depth review of 
 #664 — fix18: label serving unit + crop merge identifies several strengths alongside key bugs and structural improvements to address before merging.

Summary of Changes

The pull request modifies two core components:

Image Processing & Label OCR (src/lib/meta/label.ts):

Adds .rotate() to sharp before reading metadata and extracting the bounding box to respect EXIF orientation.

Adds mergeLabelReading() to merge retry results back into the first-pass reading rather than replacing it wholesale.

Database Functions (supabase/migrations/0060_label_serving_unit.sql):

Updates create_food_post and create_food_post_without_gtin to accept 'serving' alongside 'g' and 'ml'.

Formats portion_text dynamically ("1 serving" vs "X servings") and sets portion_grams to null when the unit is not 'g'.

Critical Issues

Normalized vs. Rotated Coordinate Mismatch in cropLabelBox

In cropLabelBox, box coordinates (x, y, w, h) were predicted by the vision model on the original unrotated image buffer.

Calling .rotate() applies EXIF orientation transforms (e.g., swapping width/height or flipping axes for photos taken in portrait orientation on mobile phones).

If an image has non-standard EXIF orientation (such as orientation 6 or 8), oriented.metadata() returns swapped dimensions, but the normalized bounding box coordinates still reference the raw image matrix. Extracting using those coordinates against the rotated image will crop the wrong region.

Recommendation: Either orient the image before passing it to the initial reading (readLabelOnce), or pass the unrotated image buffer through crop calculation if coordinates were derived prior to orientation normalization.

Database Migration Logic Duplication

create_food_post and create_food_post_without_gtin share over 95% identical validation, advisory locking, media verification, and post creation logic (only differing by food_category on item_nutrition).

Copy-pasting this logic across functions in migration scripts increases future maintenance risk and regression potential.

Recommendation: Consider refactoring common validation and record creation into an internal helper function, or calling create_food_post_without_gtin as the base handler.

Medium-Priority Issues

Overwriting Existing Macros with Worse Retry Values

In mergeLabelReading:

ts
for (const key of ["kcal", "protein_g", "carbs_g", "fat_g", "fibre_g", "sugar_g", "sodium_mg"] as const) {
  if (retry.per_serving[key] !== null) panel[key] = retry.per_serving[key];
}

If the first reading correctly extracted protein_g: 10, but the retry read an erroneous or lower-quality value (or partial hallucination), it unconditionally overwrites the first reading.

Recommendation: Only fill keys where panel[key] === null (coalesce behavior), or verify whether the intention was backfilling missing fields versus overwriting.

Validation Error Message Discrepancy

The validation check ensures:

sql
if p_grams is null or p_grams <= 0 or p_grams > 100000 then 
  raise exception 'Portion must be between 0 and 100000 grams' using errcode = '22023'; 
end if;

When v_unit = 'serving', p_grams represents serving count, not weight in grams. The error message 'Portion must be between 0 and 100000 grams' is misleading to API callers submitting unit-based servings.

Test Coverage Observations

Unit Tests: tests/label-reading.test.mjs properly checks that serving and box are preserved from the first reading while missing macros are populated from retry.

Database Tests: tests/db/label-serving-unit.test.mjs verifies the singular/plural serving string formatting and rejection of unsupported units (cup).

Missing Test Scenarios:

EXIF orientation handling with real rotated JPEG samples in cropLabelBox.

Calling create_food_post_without_gtin with 'serving' to ensure parity between both SQL procedures.

Show me how to fix the EXIF orientation bug
Review the remaining comments on the pull request
Write a test case for the serving unit migration
Refactor mergeLabelReading for better performance
Check the rest of the PR diff for security issues
⠴
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash