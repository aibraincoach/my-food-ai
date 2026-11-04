Same-thread completion read; https://www.perplexity.ai/search/a60fa73e-1480-40ef-8f8d-a1746a40904a
Original request/head proof retained in the corresponding exact-head initial capture. No new review request was submitted.

Answer
Links
Images
Share
1:08 AM

code review 
 aibraincoach/my-food-ai#561
Follow-up on the prior review findings, at the CURRENT exact PR head. Confirm fixes for estimate unknown-grams to known-grams recovery and for volume-only edits (milliliters must rescale stored consumed amounts by ratio, never treat ml as grams). Verify numeric values and disclosure provenance stay correct. Review the delta and relevant surrounding paths. Report remaining correctness blockers, or state BLOCKERS: NONE when resolved. Do not post or modify the repository.

Read more
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

Show me the suggested fix for this replay bypass
How does replayCorrection handle null gram weights
Explain how rebuildRemoved triggers this replay path
Show the diff for src/lib/worker/jobs/correct.ts
What test covers this volume ratio scenario
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol