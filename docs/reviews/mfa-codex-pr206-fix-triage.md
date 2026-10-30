Triage reviewer: Codex implementation agent; integrated head c0c4cd0c156f292e905753181024f181db6e6f0c, base main.
Original Codex receipt: https://github.com/aibraincoach/my-food-ai/pull/206#issuecomment-6489515001

1. P2 volume barcode nutrition lost on servings recompute — Real. create_food_post stores volume with null portion_grams, while the original servings RPC retained its old text and resolvePortionNutrition tried a gram-based FDC recompute. Servings now scales a known ml label while keeping mass null, and the worker rescales the original stored portion nutrition through pending revision chains without a density guess or another FDC lookup. Local data checks cover 250 to 500 to 125 ml and preserve the gram path, nutrition values and source reference.
2. P2 failed save orphans uploads and retries upload copies — Real. Previously staging returned upload capabilities without a durable owner of cleanup, and every save retry signed another stage. Staging now queues delayed detached cleanup before issuing capabilities. The client retains the stage and successful PUTs through save/partial-upload retries. Cleanup preserves referenced stages, the food RPC claims each photo idempotently, and its cleanup-job lock prevents a late claim racing eligible cleanup. Offline tests verify both-copy cleanup, committed-stage protection, failure to schedule cleanup, retry reuse, partial upload retry, repeat saves and expired/running cleanup rejection.

Main was integrated with a merge commit; no conflicts. No production database writes or migrations were run. SQL checks execute isolated function fixtures in a disposable local PostgreSQL schema rather than install either migration. Full migration/production HTTP tests remain deferred until the separately ordered migration.

Additional Codex confirmation on b1276b57ee0dec72fbe1a03ecad42699b4b93180:
https://github.com/aibraincoach/my-food-ai/pull/206#issuecomment-6521202821
- P1 staged path breaks correction authorization — Real. A photo post now uses the staging UUID as its actual post UUID, preserving the existing strict correction path check. The SQL fixture asserts that identity.
- P2 volume text absent from correction caller — Real. correct.ts now passes the corrected portion_text into the same retained-nutrition resolver as recompute.ts.
- P2 concurrent selections dropped — Real. addFiles now appends incoming files before checking the decoder lock, so they remain queued while a decode or lookup is active.
- P2 expired cached uploads cannot retry — Real. Cached stages renew after 110 minutes, before upload expiry or delayed cleanup, whether uploads were partial or complete. The offline fixture advances the clock and verifies fresh tracked stages.
Real findings: 6
