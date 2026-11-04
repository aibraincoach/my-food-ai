Head at submission: c2ddfb2cd09db1f15ed06a728c25831cbaf0ee41
Model proof: model_preference = gemini38flash
Elapsed since Enter: 142.9s
Elapsed since tab open: 180.2s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/561

Answer
Links
Images
Share
12:59 AM

code review 
 aibraincoach/my-food-ai#561

Finished
25s
Review verdict

Changes requested — I found one correctness regression in the estimate-rescaling path. Reviewed PR #561 at head c2ddfb2cd09db1f15ed06a728c25831cbaf0ee41. This was a static review; I did not run the application or database tests.

Finding
P2 — Volume-only corrections incorrectly treat milliliters as grams

Location: src/lib/nutrition/totals.ts, rescaleStoredNutrition(), new estimate-reference branch, approximately lines 177–181.

The new branch reconstructs an estimate’s per-100 g reference and calls:

ts
scaleNutrition(reference, newGrams == null ? null : toNumber(newGrams))

However, resolvePortionNutrition() also calls this function with milliliter values when both the old and new gram weights are unknown:

ts
if (oldMl !== null && newMl !== null)
  return rescaleStoredNutrition(nutrition, oldMl, newMl);

Previously, that path only scaled already-known consumed amounts by the volume ratio. The new estimate branch ignores the old quantity and interprets the new milliliter quantity as a gram weight. Consequently, changing—or simply retaining—a volume-only portion can manufacture known nutrition from an unknown mass.

Reproduction from the code paths:

Create an estimate with 200 kcal per 100 g.

Store it with scaleNutrition(food, null). Consumed calories are correctly null; the per-100 g estimate remains in provenance.

Set the prior portion to "100 ml" with portion_grams: null.

Resolve a correction to "200 ml", still with no gram weight.

The volume branch passes (100, 200) into rescaleStoredNutrition().

The new estimate branch treats that 200 as grams and returns 400 kcal, despite having no density or mass measurement.

This contradicts the explicit mass-versus-volume rule in nutrients.ts: a gram-based nutrient reference cannot convert a milliliter portion without density.

Suggested fix: separate ratio-based rescaling from mass-based reconstruction, or pass an explicit quantity basis. Only recover nutrition from retained per-100 g values when the new quantity is actually a gram weight. Volume-only revisions should preserve unknown amounts, or proportionally scale previously known consumed amounts without substituting milliliters for grams.

Add regression tests covering:

Unknown-mass estimate, "100 ml" → "200 ml": nutrition remains unavailable.

Unknown-mass estimate, "100 ml" → "100 ml": unchanged volume must not create nutrition.

Existing known consumed amounts with volume-only correction: preserve ratio-based behavior.

Validation gaps

The committed real-service evidence does not exercise the new estimate fallback: all successful food resolutions shown are selected or closest; the nonfood is unavailable. Its recorded head is the PR’s base SHA, 299f13a…, rather than the reviewed head. That evidence therefore does not establish real-provider behavior for this feature.

The GitHub check-runs response contained only a successful “Vercel Preview Comments” check. The PR description reports local TypeScript, lint, build, and focused-test results, but those are author-reported results, not checks I independently executed.

The added portion-recovery test covers unknown-to-known gram weights, but not the existing milliliter caller that exposes the regression.

The estimate provenance and unknown-to-known gram recovery are otherwise coherently connected in the reviewed changes. I have not posted a review or changed the pull request.

Build a GitHub pull request review bot that runs security, performance, and architecture audits on private repos and flags edge cases
Computer
Show me a fix for this regression
Explain the rest of the PR changes
Draft a review comment for PR #561
Check the rest of totals.ts for other issues
⠋
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash
GPT-6.1 Sol