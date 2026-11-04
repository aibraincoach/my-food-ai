Head at submission: 30b574601998dceb0073c64636e7a43396a3bb36
Model proof: model_preference = gemini38flash
Elapsed since Enter: 93.5s
Elapsed since tab open: 120.2s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/561

Answer
Links
Images
Share
12:50 AM

code review 
 aibraincoach/my-food-ai#561

Finished
21s
Review result

Changes requested: I found one correctness issue in PR #561 at head 30b5746 that can leave model-estimated nutrition permanently unavailable after a portion correction. This was a static review of the diff and relevant scaling/reuse code; I did not execute the application or database tests.

Finding
P1 — Estimates cannot recover when an unknown portion becomes known

Location: src/lib/nutrition/portion.ts, numeric-source guard and subsequent rescaleStoredNutrition(...) return.

The new guard correctly prevents an estimate:... source reference from being sent to USDA’s numeric-ID lookup, but it also removes the only recovery path for nutrition stored without a usable portion. Estimate rows now fall through to proportional rescaling even when there is no original gram amount to scale from.

The failure sequence is:

A food receives a valid model estimate, but its initial portion_grams is null or nonpositive.

scaleNutrition() retains the estimate’s source and provenance, but stores null for every nutrient value when the portion is unknown. The original per-100 g values are not retained separately.

The user corrects the same food to a known amount, such as 50 g.

resolvePortionNutrition() skips reconstruction because the source reference is nonnumeric.

rescaleStoredNutrition() computes a null scaling factor because the old grams are not positive, returning null nutrition despite the newly valid portion.

The function returns that row rather than indicating that fresh resolution is needed. Thus, the portion correction cannot recover the estimate through this reuse path. USDA-backed rows have an explicit detail-fetch branch for this situation; the newly introduced estimate-backed rows do not. The same issue occurs if an estimate is first scaled from a valid portion to an unknown portion, then corrected back to known grams. These conclusions follow directly from the retrieved portion-resolution, scaling, and stored-rescaling implementations.

Suggested fix:

Preserve the estimate’s per-100 g nutrient values separately from portion-scaled values, allowing reconstruction without another model call; or

When an estimate cannot be rescaled because the prior portion or amounts are unavailable, explicitly trigger fresh food resolution instead of returning a null-valued reused row.

Add a regression test covering estimate → unknown grams → known grams, asserting both recovered numeric nutrition and retained model-estimate disclosure. Also cover known → unknown → known.

Validation gaps

The three added estimate unit tests cover nonfood refusal, direct scaling/disclosure, and malformed or out-of-range provider output. They do not exercise resolvePortionNutrition() or the unknown-to-known portion transition.

The committed real-service evidence does not demonstrate successful execution of the new estimate fallback: cendol and the fried macaroni snack resolve through closest USDA matches, while the ceramic plate remains unavailable. Its recorded head is the base SHA 299f13a, not the reviewed PR head, so it does not establish exact-head validation.

The only check run returned by GitHub was “Vercel Preview Comments,”

⠹
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash
GPT-6.1 Sol