# Fleet 43 — #1097: finished worker jobs are deleted after 14 days, failed ones after 60, in small batches (2026-11-18)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's packet of 2026-11-18 09:39Z (`qitem-20261118093928-eafca6edeba4d530`), issue #1097, under RT's rules 4 and 5 of Nov 18 (`/home/opc/pm/my-food-ai/decisions/OWNER-RULINGS-2026-11-16.md`).
- **Order:** after #1099 (the CPU PR, migration 0070) merges.
- **Policy:** the PM's. This plan is its implementation.
- **Shape:** one code PR and one docs PR, local checks only before the stop, one stop before the merges.
- **After the PM's merge order:** the migration, then one dry run on production, and a stop. **No row is deleted on production by this fleet.** The first real batch runs only on the PM's separate order.
- **Base:** main `f5c69848b29c234a2781405608ad6c8542644cad`. The patch touches no file of #1099, so it also applies after #1099's merge. Check that with `git apply --check`.
- **Files, all new except the copied function:**
  - `supabase/migrations/0071_job_retention.sql` and `supabase/rollbacks/0071_job_retention.down.sql`;
  - `scripts/retention/run.mjs`;
  - `tests/db/retention-jobs.test.mjs`.

  Fleet 44 (#1098) builds on these. Fleets 39, 40, 42 and #1092 touch none of them.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix.

**Stops: one**, before the merges (section 6). The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes.

## 1. The policy, and what the code adds to it

**The PM's rule:**
- A job that **finished** more than **14 days** ago is deleted.
- A job that **failed** (`status = 'error'`) more than **60 days** ago is deleted.
- Queued and running jobs are never deleted.

**What else reads old jobs.** The planner read every reader of `public.jobs` on `f5c69848`: `git grep "from public.jobs"` in the migrations, and `from('jobs')` in `src` and `scripts`. These jobs are **kept as long as their meal exists** (a meal's deletion already removes its jobs by cascade):

| Kept | Why (the reader) |
|---|---|
| The job a meal is working under (`posts.active_job_id`) | `post_work_matches`, and the push sender (`src/lib/push/send.ts:30`) |
| A photo stage's cleanup job (`post_photo_attachments.cleanup_job_id`, `post_upload_drafts.cleanup_job_id`) | The attachment's column is a foreign key, so deleting the job would fail. `src/lib/posts/attach-photo.ts:32` reads the job |
| An **applied correction** job (`kind 'correct'`, payload `correction_applied` true) or a **question** job (payload `needs_input_question` true) | **They are state, not a log.** Their payload holds the meal's correction sequence and the comments already applied. Every later correction reads them (0029 lines 104, 109, 273, 275; 0011 lines 58, 62). Deleting them would re-apply old comments and reset the sequence |
| Every **leftovers** job (`kind 'remainder'`) | Its payload holds the leftover items. Its unique index (`jobs_one_remainder_per_photo`) stops a photo being processed twice |
| The **latest failed job of a meal that is still failed** | Try again reads its kind and payload (`src/app/api/posts/[id]/retry/route.ts:17`), in the same order the rule uses |

**What does not need a rule.**
- **Operation receipts:** `food_post_operations`, `copy_post_operations` and `drink_post_operations` hold no job id, so the PM's "referenced by an operation receipt" case does not occur.
- **The admin stats:** they count recent jobs only.
- **A correction job that finished without being applied** (superseded) is read by nothing, and is deleted.

**One related old path (rule 5).** `create_food_post` and `create_food_post_without_gtin` (migration 0060) treated a pack-photo stage **with no cleanup job** as valid: `if found and (…expired…)`.
- `sign-upload` always writes that job before it signs (`src/lib/media/staged-photo.ts`), so a missing job means the stage is gone.
- Once jobs are deleted, that branch could let an old stage through. 0071 redefines both functions with `if not found or (…)`, copied from 0060 with that one change.
- The planner checked locally that a stored stage with no job is now refused, "Pack photo expired".

## 2. The implementation

**Migration `0071_job_retention.sql`:**
- **`public.retention_summary`:** the audit trail of what was deleted (`ran_at`, `table_name`, `rule`, `day`, `kind`, `deleted`). It has row-level security on and no grants, so only the service role and the owner of the database can read it.
- **`jobs_ended_at`:** a partial index on `jobs (finished_at) where status in ('finished','error')`, so candidates are found without scanning the table.
- **`retention_job_candidates(p_now)`:** the rule, together with every keep rule in section 1.
- **`retention_jobs_dry_run(p_now default now)`:** counts per rule, kind and day. It deletes nothing.
- **`retention_jobs_batch(p_limit)`:**
  - deletes at most `p_limit` candidates, oldest first, in one statement;
  - writes their counts per rule, day and kind to `retention_summary`;
  - returns the number deleted;
  - refuses a size outside 1 to 1000.
- **Permissions:** all three functions are `security definer`, revoked from `public`, `anon` and `authenticated`.
- **The two food-post functions**, as in section 1.

**Rollback `0071_job_retention.down.sql`:**
- drops the functions, the index and the summary table (its counts are lost);
- restores 0060's two functions verbatim.

**Deleted jobs cannot be restored by any rollback.** What was deleted is recorded only as counts per day, rule and kind in `retention_summary`.

**`scripts/retention/run.mjs`:**
- **The default is a dry run:** it prints each rule's counts per day and kind, and deletes nothing.
- **`--delete`** runs at most `--batches` (1 to 50, default 1) batches of `--batch-size` (1 to 1000, default 200), one after another, with `--pause-ms` (1,000 to 600,000, default 5,000) between them.
- **It stops** at the first batch that deletes nothing, or at the first error.
- **Each batch** is one `psql` call with `statement_timeout = '30s'`.
- **It is strict:** an unknown option or table is refused, and nothing runs in parallel.

**`tests/db/retention-jobs.test.mjs`** (local throwaway database):
- **The options:** the default is a dry run; out-of-range and unknown options are refused.
- **The rules, on 15 fixture jobs:**
  - the dry run deletes nothing, and names the four expected deletions;
  - three batches of 2 delete exactly those four. One is finished 15 days ago, one failed 61 days ago, one is an older failed job of a failed meal, and one is a finished stage cleanup job;
  - all ten kept jobs are still there: finished 13 days ago, failed 59 days ago, an applied correction, a question, a leftovers job, the latest failure of a failed meal, an active job, a stage cleanup job a draft points to, a queued job and a running job;
  - `retention_summary` counts the four.
- **The guards:** a batch size of 0 is refused, and a stored pack-photo stage with no cleanup job is "Pack photo expired".

## 3. Facts the planner checked

- **Attached:** `/home/opc/.claude/plans/fleet43-job-retention.patch`, sha256 `53042ae34f048e0e76c7cba3c08ec5cb316ddae2451ae9e0fb026e194bcf1ef9`. It applies to `f5c69848` with `git apply`, and Fleet 44's patch applies after it. If the hash does not match, the PR is void.
- **Verified on the planner's local stack** (`TEST_PORT_BASE=62260`, a fresh database with every migration):
  - 0071 applies, and its rollback applies and re-applies;
  - the fixture behaves as in section 2;
  - `tests/db/retention-jobs.test.mjs` passes 3 of 3;
  - `npx eslint` on the new script and test is clean, and so is `npx tsc --noEmit`.
- **One fault caught in the prototype:** a correction job with an empty payload read as NULL, so it was kept by mistake. The rule now uses `coalesce(…, false)`, and the fixture covers that case (job 7).
- **Not run by the planner:** the two suites, and anything on production.

## 4. The code PR — branch `fix43/job-retention` — #1097

1. **Worktree** `/tmp/mfa-f43` from `origin/main` (after #1099's merge), with `npm ci`. Apply with `git apply /home/opc/.claude/plans/fleet43-job-retention.patch`.
2. **Your own stack.** `TEST_PORT_BASE=62360 TEST_PG_PORT=56649 TEST_STACK_DIR=/tmp/mfa-f43/s TEST_ENV_FILE=.env.test.fleet43`. Keep the stack path short: Postgres's socket path has a 107-byte limit.
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on the new files;
   - both suites once, with the built app started (10 minutes each);
   - `tests/db/retention-jobs.test.mjs` by itself.
4. **The query plan, locally:** run `explain` (not `analyze`) on `select * from retention_jobs_dry_run()`. Report the plan's join types. A nested loop that scans `posts` once per candidate is a fault: fix it with an index in this PR, and say which.
5. **Review:** one PPLX review on the final head (AGY if PPLX is unavailable).
6. **Docs PR:** branch `docs/fleet43`, with this plan unchanged as `docs/plan-fleet43.md`.

## 6. The stop

Stop when:
- the code PR and the docs PR are open;
- the code PR is reviewed or reported "written, not reviewed";
- item 4's plan is reported.

Report to the PM in one message:
- the PR's number, branch, final head (40 characters), checks and results, and review;
- the suites' counts and the query plan;
- the merge order: **the code PR, then the docs PR**.

Then wait for the PM's merge order, which names each PR and its full head SHA.

## 7. After the PM's merge order: production, once, read-only after the migration

Rule 4 applies: one sequential pass, and no load test.
1. **Deployment:** wait for READY with the alias matched (at most 10 minutes).
2. **The migration:** apply 0071 once. Read back once that the three functions, the index and `retention_summary` exist.
3. **The plan, once:** `explain` (not `analyze`) of `select * from retention_jobs_dry_run()`. If it scans `posts` or `jobs` once per row, stop here and report it.
4. **The dry run, once:** `node scripts/retention/run.mjs --table=jobs`. Report its whole output. **Delete nothing.**
5. **Stop and report.** The PM orders the first real run separately: `--delete --batches=1`, then one batch per order, until a batch deletes 0.

## 8. Not in this run, and why

- **A schedule** (pg_cron or a timer): the PM orders each run by hand for now. A schedule is a later decision.
- **The trace rows:** these are Fleet 44 (#1098).
