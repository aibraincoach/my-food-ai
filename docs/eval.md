# Meal photo evaluation

Run after the merge phase with `node --env-file=.env.local scripts/eval.mjs`. The script uses the ordinary test session and the application's post/upload routes. Photo provenance and licence notices are in `eval/SOURCES.md`; expected items and estimated grams are in `eval/expected.json`.

Matching uses case-insensitive word-padded trigram sets with Jaccard similarity at least 0.5. Matching is one-to-one, choosing the highest-scoring available pair first. The report distinguishes matched items, missed expected items and unmatched returned items. Grams are visual annotations, not measured ground truth; reported differences are descriptive only. Composite-dish versus ingredient naming can lower agreement without proving the analysis wrong.

<!-- eval-results:start -->
Not run. The implementation and runtime follow-up merges are complete, but the full ten-photo production evaluation remains outstanding. The busy-photo gate and repeated three-fixture queue test are separate checks, not this accuracy table. No complete ten-photo model accuracy or timing result is claimed.
<!-- eval-results:end -->
