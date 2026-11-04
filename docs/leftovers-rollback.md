# Leftovers rollout and way back

> Historical rollout procedure, not a pending current migration order. Leftovers and multiple after-meal photos have since shipped; Fleet 12 uses “Leftovers”. The real half-eaten-plate accuracy check remains outstanding. Consult [CLAUDE.md](../CLAUDE.md) and [phone-acceptance.md](phone-acceptance.md) for current scope.

Migration 0028 is not applied by this document or by the rollback tests. A PM order naming the PR and exact head is still required.

Before applying 0028, let existing work drain and hold the worker lease across the migration and deployment. Apply the migration in one transaction with bounded lock/statement timeouts. Confirm the new production runtime before releasing the lease. Do not allow the old worker to consume new multi-photo jobs during the handoff.

## If the production check fails after records have been accepted

Do **not** revert blindly to the old worker or recreate `post_media_one_not_eaten`. Two marked photo rows on one post violate that unique index. The old worker reads one marked photo with `maybeSingle`, and its correction path does not reconstruct and reapply cumulative deductions. The new data also includes cumulative grams/calories, immutable item revisions, and per-photo job receipts. Removing an extra marker or its history merely to make the old index build would discard a user's record.

The data-preserving reverse operation is [0028_pause_leftovers.sql](../supabase/rollback/0028_pause_leftovers.sql). It rolls back the new capability without rolling back accepted food data:

1. Hold the worker lease, and wait for affected running jobs to finish. The SQL refuses to proceed if any remain. Run the script with `psql -X -v ON_ERROR_STOP=1 -f …`; its explicit transaction has 5-second lock and 30-second statement limits.
2. The transaction blocks new marked photos, unmarking existing photos, and ordinary added photos on a meal that already has leftovers. A refused publication/attachment is rolled back and returns an error instead of silently treating the photo as food. Existing media flags and stored deductions are untouched.
3. It parks queued or subsequently enqueued analysis/correction/recompute/remainder jobs for affected meals, retaining each original retry deadline in the job payload. Pending work remains visibly pending, not falsely completed. Other meals and unmarked photo uploads remain available.
4. Keep the compatible 0028 schema and reviewed application running for existing records. Release the lease so unaffected meals can drain. Investigate/fix forward in another reviewed, named-head deployment. Do not erase accepted rows to restore an old index.
5. After that fix is deployed, hold the lease again and apply [0028_resume_leftovers.sql](../supabase/rollback/0028_resume_leftovers.sql). It removes the temporary guards and restores original deadlines, without changing accepted photos, quantities, nutrition, comments or per-photo receipts. Then release the lease and verify the parked work.

The pause/resume scripts are outside `supabase/migrations/`; a normal migration apply does not execute them. A local PostgreSQL regression test starts with two accepted marked photos and a cumulative 70 g / 140 kcal record, proves that new affected work is blocked/parked while an ordinary meal still works, and proves that resuming retains the two markers and restores both original job deadlines.

This is an intentional feature rollback/containment, not a claim that old application code can read all new data safely. A full old-code/schema rollback is only safe before new leftover data or dependent revisions are accepted. If accepted multi-photo data exists, full reversal would require an explicitly designed, lossless conversion and compatible reader; this PR does not pretend that recreating a one-row index supplies one.

The rollback test runs only in a disposable local schema. No rollback script or migration has been applied to production under this build order.
