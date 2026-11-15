Head at submission: 1e90fc6713c22a24e0f51d4a95345752ddb9908f
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 22.9s
Elapsed since tab open: 26.7s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/549

Answer
Links
Images
Share
7:04 PM

code review 
 aibraincoach/my-food-ai#549

Finished
9s

PR #549 (aibraincoach/my-food-ai) introduces a labelled closest-generic USDA fallback when strict food matching fails, along with metadata provenance and atomic SQL wrappers to keep meal summary disclosures synchronized with active-job ownership. Overall, the implementation is well-scoped, defensive around concurrency and retries, and backed by solid migration/rollback tests.

Architecture and Data Flow

Fallback Matching (src/lib/fdc/approximate.ts, src/lib/fdc/match.ts): When matchFood exhausts its strict attempts and options.approximate is enabled, resolveFoodMatch falls back to closestGenericFood using the extracted baseFood noun. It restricts candidates to generic USDA types (Foundation, SR Legacy, Survey (FNDDS)), excluding Branded records, and uses muse-spark-1.3 with a strict JSON schema to pick the closest match or return null.

Provenance Tracking (src/lib/fdc/nutrients.ts, src/lib/fdc/approximation-metadata.ts, src/lib/nutrition/portion.ts): Approximation metadata ({ kind: "closest", basis, sourceRef }) is embedded directly on micronutrient entries in scaleNutrition. foodApproximation validates that value.sourceRef === row.source_ref, ensuring stale or mismatched provenance is ignored, and resolvePortionNutrition preserves this metadata during portion rescaling.

Trust & Summary Formatting (src/lib/pipeline/prior-nutrition.ts, src/lib/pipeline/wording.ts): priorNutritionTrusted explicitly rejects approximated items so they are not reused as cached exact matches on re-analysis. plainConsumed and safeSummary append "Nutrition for <name> is taken from the closest USDA record, <basis>." for each unique (name, source_ref) pair.

Potential Issues and Edge Cases

String-Matching Coupling for Disclosures: Both persist.ts and 0051_approximation_summary.sql detect existing disclosures by checking for the literal substring ' is taken from the closest USDA record, '. If the wording in wording.ts is ever localized or rephrased, the SQL transition logic and fallback guard in persist.ts will silently fail to clear old disclosures.

Missing baseFood Skips Approximation: In matchFood, baseQuery is only populated when attempt === 0 && decision.query_food is truthy. If the initial strict search returns no candidates or the model omits query_food on the first attempt, baseFood remains null and closestGenericFood will not run.

recompute.ts vs wording.ts Punctuation: In rebuildRemoved (src/lib/worker/jobs/recompute.ts), the summary joins formatConsumed(...) and approximation labels with '. ' without a trailing period on the label itself, whereas plainConsumed in wording.ts appends a trailing period to each label. This is minor, but creates slight formatting inconsistency between initial/corrected summaries and rebuilt-removed summaries.

Inconsistent ORDER BY in persist.ts Fallback: In src/lib/pipeline/persist.ts, the fallback query reads the first model comment with .order('created_at').limit(1).maybeSingle(), whereas 0051_approximation_summary.sql uses order by created_at, id limit 1. Adding .order('id') as a tie-breaker in persist.ts would match the SQL deterministic ordering.

SQL Migration and Rollback

Locking and Ownership (supabase/migrations/0051_approximation_summary.sql): Both persist_approximated_analysis and refresh_owned_approximation_summary acquire FOR UPDATE on public.posts, delegate/check post_work_matches, and revoke EXECUTE from public, anon, and authenticated (granting only to service_role).

Retry & History Safety: persist_approximated_analysis only updates the first model comment when initialized is null, preventing retries from overwriting committed summaries. refresh_owned_approximation_summary verifies current_post_items count and (id, source_ref) pairs against p_expected, and targets feedback_revision(p_post_id)->>'modelCommentId' so historical comments remain untouched.

Clean Rollback (supabase/rollbacks/0051_approximation_summary.down.sql): Drops only the two new wrapper functions and reloads PostgREST schema, leaving persist_owned_analysis and persist_identified_analysis intact.

Test Coverage

DB Regression (tests/db/approximation-summary.test.mjs): Thoroughly exercises the migration and rollback against a local database, covering initial commitment, retry idempotency, PT409 on changed source_refs, approximate-to-exact transitions, stale job rejection, anon/authenticated privilege denial, and rollback verification.

Unit & Integration (tests/correction-ready.test.mjs, tests/identify-provenance.test.mjs): Verifies refresh_owned_approximation_summary invocation during recompute, legacy RPC fallback behavior when persist_approximated_analysis is missing, and rejection of fallback when an existing approximation disclosure needs to be cleared.

Show me the review comments for the database migration
Explain how the fallback matching handles concurrency issues
Summarize the security implications of the new SQL wrappers
Show me the tests added for the USDA approximation logic
Draft a reply for the pull request comments
Sources
⠼
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen