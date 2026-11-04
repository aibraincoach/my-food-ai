# Production migration status

Read-only observation: November4,2026,13:41–13:44UTC (20:41–20:44WIB,07:41–07:44MDT). Main `376e3306942161a5e659e8d99c85154c8ac26a35` was independently rechecked at13:49UTC. No migration or production data write was performed.

## Result and verification limits

No earlier-fleet migration is outstanding. All54 migration files on main are accounted for. The110 surviving application function bodies match production after processing CREATE, ALTER/RENAME and DROP in file order, allowing later migrations to supersede earlier definitions. Body comparison removes SQL comments and whitespace; it does not substitute for behavior tests. The schema comparison found no unexplained missing columns, indexes, constraints, triggers or policies. The local fixture deliberately excludes0024's external scheduler; its production objects were checked separately.

There is no application `supabase_migrations.schema_migrations` ledger in production. These are current-state checks, not invented application dates or proof that each historical data rewrite ran at a particular time. Earlier fleet reports supply application receipts where available. Storage's own migrations table is not the application's migration history.

0022 was reserved but unused and permanently retired, per [the historical PM snapshot](history/2026-10-31-pm-snapshot.md). Do not create or apply a placeholder.

## Earlier fleets

| Files | Fleet | Observed production state |
|---|---|---|
|0001–0034, including0005b/0007b/0007c, excluding retired0022|Earlier fleets through7|Expected surviving schema/functions present|
|0035|8|User call caps present|
|0036–0037|9|Soft-delete/purge and water-label definitions present; purge cron active|
|0038–0045|10|Unmark, deterministic conflicts, composer drinks, saved snapshots, modes and durable posting operations present|
|0046–0047|11|Separate drink-identification cap and alcohol constraints present|
|0048–0049|12|Feed indexes and feedback revision definitions present|
|0050–0051|13|Sugar-backfill evidence and summary RPCs present;0051 functions subsequently replaced by0052|
|0052|14|Both estimate-summary function bodies match production|

Specific readbacks:

- 0050:6 rollback-ledger rows,0 mismatches against current sugar values,0 remaining rows eligible under its original predicate. The invalidation trigger is present. Fleet13's application receipt separately records6 changed sugar rows and0 calorie changes.
- 0051/0052: both summary RPCs exist; anon/authenticated execute is false, service-role execute is true.
- 0024: worker target configured; expected once-per-minute wake cron active.
- 0036: expected purge cron active at `0 3 * * *`.
- Required extensions `pgcrypto`, `pg_trgm`, `pg_cron`, `pg_net` are present. Media bucket is private.

## Outstanding Fleet15 migrations in PR588

| File | Current state | Required order |
|---|---|---|
|0053_estimate_reader_rollout.sql|Unapplied: format table, normalizer/trigger and versioned claim overload absent|Apply reviewed preparation before deploying #588; existing readers continue to receive legacy format|
|0054_unavailable_summary.sql|Unapplied: production still matches0052 function bodies|Previous PM explicitly reserved the scope decision for the owner; no subsequent ruling is recorded. Apply before the matching new-code deployment if retained|
|0055_approximation_once.sql|Unapplied: all4 provenance-bearing nutrition rows currently repeat their labels|After verified reader-compatible production deployment, use `scripts/activate-compact-nutrition.sql`; never treat this as an ordinary pre-deployment sequential migration|

The activation script needs the verified40-character deployed reader SHA, immediate NOWAIT locks, and zero running jobs. It fences old claim entrypoints and switches the database format barrier atomically with compaction. It does not drain on a timer. New compact writers default off; the DB barrier maintains the applicable format. `scripts/rollback-compact-nutrition.sql` expands stored/future compact writes before restoring old claims. Rollback files are contingency procedures, not outstanding migrations to run forward.

These source files/scripts are on the open #588 branch, not deployed main. Its final reviewed head is `223bf70eb7b682a1a06a7d6bdcf33c79b9d36212`. The final combined disposable gate passed45/45; that is not production application evidence. Deployment and migration application need their applicable authorization; this status document supplies none.

## Other historical material and data work

`origin/card-best-effort` retains0015_card_best_effort.sql, from closed/unmerged PR133. Its complete_post_without_card function is absent from production and unused by current main. No open PR delivers it. This is abandoned branch material, not a migration backlog. A scan of all locally fetched origin branches found no other new migration filenames outside main except that file and Fleet15's0053–0055; the fresh open-PR inventory likewise finds migration changes only in #588.

Fleet10's item-drink backfill was run and retained10 unresolved name-query candidates. The same broad read-only query now returns12 ready/nondeleted current items without an item-linked intake. Coffee/tea/cola-like names are not a drink classifier; existing sheet drinks and foods can match. This is unresolved classification/reconciliation work, not proof of12 missing drink records and not an unapplied schema migration. No backfill was rerun.

The planned owner-admin promotion after #586 merges remains unperformed. It is a one-row role update, not a migration.

## Main migration inventory

Each file below is represented in production's current surviving state; later replacements are accounted for rather than replaying old definitions.

- `0001_init.sql`
- `0002_fdc_cache.sql`
- `0003_pin_search_path.sql`
- `0004_persist_analysis.sql`
- `0005_jobs_retry.sql`
- `0005b_profile_role_guard.sql`
- `0006_post_locations.sql`
- `0007_post_items_supersede.sql`
- `0007b_comment_corrections.sql`
- `0007c_feedback_revision.sql`
- `0008_post_media_kind.sql`
- `0009_posts_search.sql`
- `0010_post_media_phash.sql`
- `0011_posts_needs_input.sql`
- `0012_push_subscriptions.sql`
- `0013_profiles_hints.sql`
- `0014_model_calls.sql`
- `0015_posts_eaten_at_index.sql`
- `0016_intake_logs.sql`
- `0017_servings.sql`
- `0018_food_posts.sql`
- `0019_intake_logs_drink.sql`
- `0020_food_post_photo.sql`
- `0021_known_nutrition.sql`
- `0023_photo_publication.sql`
- `0024_worker_wake.sql`
- `0025_barcode_corrections.sql`
- `0026_saved_meals.sql`
- `0027_not_eaten.sql`
- `0028_multiple_leftovers.sql`
- `0029_drinks_from_items.sql`
- `0030_delete_and_remove.sql`
- `0031_agent_tokens.sql`
- `0032_identify_provider.sql`
- `0033_pending_items.sql`
- `0034_renew_lease.sql`
- `0035_user_call_caps.sql`
- `0036_soft_delete_posts.sql`
- `0037_water_tile_labels.sql`
- `0038_unmark_not_eaten.sql`
- `0039_feedback_conflict.sql`
- `0040_composer_drinks.sql`
- `0041_saved_drink_snapshots.sql`
- `0042_modes_hint.sql`
- `0043_food_post_operations.sql`
- `0044_copy_post_operations.sql`
- `0045_drink_post_operations.sql`
- `0046_drink_identify_cap.sql`
- `0047_alcohol_intake.sql`
- `0048_feed_post_indexes.sql`
- `0049_feedback_revisions.sql`
- `0050_sugar_total_backfill.sql`
- `0051_approximation_summary.sql`
- `0052_estimate_summary.sql`

## Audit evidence

Private read-only catalog snapshots and comparison output are retained under `run15-core/uploads/run15/`: migration-production-catalog.json, migration-local-catalog.json, main-migration-audit.json and migration-extra-production.json. They are excluded from the PM archive. This Markdown records the sanitized results. SQL used read-only transactions and read-only connection defaults; no worker RPC, migration, provider or backfill was invoked. The owned local PostgreSQL process briefly reopened for catalog comparison and was stopped afterward.
