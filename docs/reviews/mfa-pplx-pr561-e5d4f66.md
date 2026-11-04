Head at submission: e5d4f660ac4d9ab3c352dbd7709b1335c2db446e
Model proof: model_preference = gemini38flash
Elapsed since Enter: 118.3s
Elapsed since tab open: 134.0s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/561
Confirm the final fix at current exact head e5d4f660ac4d9ab3c352dbd7709b1335c2db446e for the remaining replay blocker: replayCorrection and ordinary edits now use shared rescalePortionNutrition, with actual replay tests for100ml250kcal to100ml250 and200ml500 without invented grams. Confirm no remaining blockers in the delta, values and provenance. Do not post or modify repository.

Answer
Links
Images
Share
Finished
32s

BLOCKERS: 1 — volume-only correction replay still loses stored consumed amounts instead of scaling them by the volume ratio.

Reviewed exact head 377df937b40f14f57abeadde81a75b50d5fba6e8; a final PR-head read confirmed it had not changed. This was a read-only source review. I did not post, modify the repository, or execute application/database tests.

Remaining correctness blocker
P2 — Correction replay bypasses the volume-ratio fix

Location: src/lib/worker/jobs/correct.ts, replayCorrection(), the replaying && region?.name === item.name branch.

The ordinary correction/recompute path now correctly sends volume-only edits through resolvePortionNutrition(), which calls rescaleStoredAmounts() with the old and new milliliter quantities.

However, correction replay still directly calls:

ts
rescaleStoredNutrition(
  {...retainedNutrition(region), post_item_id: region.id},
  region.portion_grams,
  item.portion_grams
)

It does not inspect region.portion_text or item.portion_text. When both gram weights are null, the retained estimate reference is reconstructed with a null mass, clearing all consumed amounts rather than applying the volume ratio.

This path is reachable through rebuildRemoved() in src/lib/worker/jobs/recompute.ts, which calls replayCorrection(..., false, true) when rebuilding after a correction or leftovers-photo removal.

Concrete reproduction using the same known-consumed/unknown-mass state covered by the new regression test:

State or operation	Expected	Replay result
Stored estimate: 500 kcal/100 g; stored consumed amount 250 kcal; portion "100 ml"; grams null	250 kcal retained	Initially retained
Replay correction to "200 ml"; grams still null	500 kcal, from the 2× volume ratio	null calories
Replay correction retaining "100 ml" but not marked keep	250 kcal	null calories

Protein, sodium, and the other nutrient amounts are cleared in the same way. The estimate source and disclosure survive, but the numeric consumed values do not.

Required fix: apply the same explicit volume-ratio dispatch to in-memory correction replay, ideally through shared logic rather than a second implementation. Add a regression exercising replayCorrection(..., replaying=true) or the removal-rebuild caller—not just resolvePortionNutrition().

Confirmed fixes
Unknown-grams → known-grams estimate recovery

The retained-reference implementation is coherent:

scaleNutrition() stores immutable per-100 g values in approximation.per100, separately from consumed value.

storedEstimateFood() reconstructs only entries with matching estimate provenance and source reference.

rescaleStoredNutrition() uses that reference when the new quantity is a gram weight.

The ordinary portion-resolution path returns null for legacy estimates lacking a retained reference when recovery requires fresh resolution.

For the committed fixture—500 kcal, 2 g protein, and 600 mg sodium per 100 g—a 50 g portion correctly reconstructs 250 kcal, 1 g protein, and 300 mg sodium. The committed tests cover null/zero → known and known → unknown → known.

Ordinary volume-only edits

The latest delta fixes the originally reported milliliter-as-grams regression in resolvePortionNutrition():

Unknown consumed values remain unknown for "100 ml" → "100 ml" and "100 ml" → "200 ml".

Known consumed values scale by newMl / oldMl.

The retained per-100 g estimate is not substituted for consumed amounts on this path.

The new regression test checks both unchanged volume and doubled volume.

Disclosure provenance

For valid estimate rows, both reconstruction and ratio scaling retain the estimate source identity and provenance. Ratio scaling changes consumed nutrient value fields without scaling the retained per100 values. approximationLabels() and summary wording distinguish model estimates from closest-USDA references; the migration also recognizes estimate disclosures when refreshing or clearing summaries.

Validation limits

The committed tests support the two direct-path fixes, but they do not cover the replay bypass above. I independently inspected their assertions; I did not run them. The author-reported focused-suite results therefore do not resolve this remaining surrounding-path blocker.

1:20 AM

code review 
 aibraincoach/my-food-ai#561
Confirm the final fix at current exact head e5d4f660ac4d9ab3c352dbd7709b1335c2db446e for the remaining replay blocker: replayCorrection and ordinary edits now use shared rescalePortionNutrition, with actual replay tests for100ml250kcal to100ml250 and200ml500 without invented grams. Confirm no remaining blockers in the delta, values and provenance. Do not post or modify repository.

Read more
Finished
27s

BLOCKERS: NONE

Confirmed the remaining replay blocker is resolved at exact PR head e5d4f660ac4d9ab3c352dbd7709b1335c2db446e. I checked the current head before reviewing and again afterward; it remained unchanged.

Fix verification

The final delta replaces the replay-only call to rescaleStoredNutrition() with the shared rescalePortionNutrition() dispatcher:

Ordinary edits use it through resolvePortionNutrition().

replayCorrection(..., replaying=true) calls it directly, passing both old/new gram weights and old/new portion text.

When both gram weights are unknown and both texts specify milliliters, it selects rescaleStoredAmounts() and scales consumed values by newMl / oldMl.

Milliliters never enter the retained per-100 g reconstruction branch on that path. Other edits retain the existing gram-based reconstruction behavior.

This closes the bypass identified in the previous review.

Numeric values and provenance

The actual replay regression in tests/food-estimate.test.mjs invokes replayCorrection(), rather than testing only the helper. It supplies keep: null, so the unchanged-volume case also exercises rescaling instead of taking the unchanged-item shortcut.

Starting with stored consumed nutrition of 250 kcal, 1 g protein, and 300 mg sodium at "100 ml" with portion_grams: null, the assertions cover:

Replay result	Calories	Protein	Sodium
"100 ml" → "100 ml"	250 kcal	1 g	300 mg
"100 ml" → "200 ml"	500 kcal	2 g	600 mg

The implementation preserves the null gram weight; it changes consumed amounts by ratio without inventing mass. The test explicitly checks the numeric results, unchanged source_ref, and continued model-estimate disclosure.

I also checked the surrounding rescaling and provenance handling:

Consumed nutrient value fields scale; retained approximation.per100 reference values do not.

Estimate kind, basis, and source-reference metadata survive ratio scaling.

Unknown consumed amounts remain unknown rather than being manufactured from the per-100 g reference.

The unknown-grams → known-grams recovery path remains intact and separate from volume-only scaling.

Review scope

I reviewed the final commit delta, the shared dispatcher, stored rescaling, estimate-provenance reconstruction, leftovers handling, and the committed replay regression. No remaining correctness blockers were found in this follow-up scope.

This was a read-only source review: I inspected the tests but did not execute them or independently validate the full application/database suite. I did not post or modify anything in the repository.

Show me the test file changes
Check for potential race conditions
Verify the git diff for this commit
Are there any remaining edge cases
Write a summary for the PR description
⠏
Run in Computer for a more thorough code review
Computer can better assess the code changes, replay behavior, and remaining correctness blockers.
Run task
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash
GPT-6.1 Sol