Head at submission: a50674c66a6f7946f8eff7c59c11127cf6a43bf2
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 26.6s
Elapsed since tab open: 30.4s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/641

Answer
Links
Images
Share
11:09 AM

code review 
 aibraincoach/my-food-ai#641

Finished
16s

PR #641 (
 #641 — run18/label-serving: per-serving labels and crop retry) is a clean, focused change that enables per-serving nutrition labels when serving weight/volume is missing and adds a medium-effort cropped retry when macros are incomplete. There are no blocking issues, though a few edge cases and minor cleanups are worth noting.

Label Reading and Crop Retry

In src/lib/meta/label.ts, readNutritionLabel now crops to reading.box with 10% padding and retries at medium reasoning effort if any of protein_g, carbs_g, or fat_g is null .

Unused parameter: cropLabelBox accepts mime: string but never uses it .

Partial replacement check: macroCompleteness(retry) > macroCompleteness(reading) only counts non-null protein_g, carbs_g, and fat_g . If the retry recovers one extra macro but drops kcal or serving, the retry still overwrites the first reading.

Box boundary edge case: If box.x is 1.0 and box.w is 0, left evaluates to width, which causes sharp.extract to throw . The try/catch in readNutritionLabel safely falls back to the initial reading, so it will not crash, though clamping left to width - 1 (and top to height - 1) would avoid the exception.

Food Post API Route

In src/app/api/posts/food/route.ts, reading.serving is no longer assumed non-null when publishing a label post or saving barcode corrections .

Grams fallback: When reading.serving is null, p_grams is set to body.servings (for example, 1 or 2) while portion_unit is "serving" . Confirm that downstream consumers of p_grams expect serving counts rather than grams when portion_unit is "serving".

Redundant calculation: per100 is computed before publish, and then labelNutrition(reading, 100 / reading.serving.amount) is called a second time as perServing inside the barcode_corrections upsert block . Reusing per100 directly avoids the duplicate call.

Capture UI and Tests

Dead state branch: src/components/CaptureSheet.tsx removes the setLabelState("noServing") call, but the JSX still checks labelState === "noServing" . That branch can be removed if nothing else sets "noServing".

Test coverage: tests/barcode-corrections.test.mjs updates the labelNutrition test to verify portion_unit: 'serving' when serving is null . Adding unit tests for readNutritionLabel's crop-and-retry path and POST /api/posts/food with serving: null would cover the remaining new behavior.

Show me how to fix the macroCompleteness issue
Write unit tests for the crop and retry logic
Show how to clamp the box boundaries safely
Review the per100 calculation logic
Draft a comment for the PR author
Sources
⠼
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen