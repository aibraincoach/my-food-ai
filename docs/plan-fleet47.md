# Fleet 47 — the quiet retries deleted, the cron log bounded, one revision read per meal page (2026-11-18)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. **Nothing here touches production before the PM's merge order**, and after it only one migration, one dry run and one read. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 12:38Z, after the production Query Performance report (`/home/opc/pm/my-food-ai/decisions/SUPABASE-QUERY-REPORT-2026-11-18.md`), under RT's rules 4 and 5 of Nov 18 (`/home/opc/pm/my-food-ai/decisions/OWNER-RULINGS-2026-11-16.md`).

**Amended 14:05Z** (the PM's yes of 14:02Z):
- **The local stack has no pg_cron and no Realtime.** Item 8's test, L1 and section 7 are changed to fit.
- **New in section 7:** one privilege read, and one production check after the merges.
- **Issues:** #1114, #1115, #1116, #1117, #1118, #1119 (PR 1); #1120, #1121 (PR 2); #1122 (PR 3). Each PR title names its issues. #1123 (the historical 482 million requests) and #1124 are not in this fleet.
- **Order:** after Fleet 46 (#1102–#1104). Fleet 46 changes `src/lib/posts/items.ts` near this plan's item 8; rebase on main after its merge.
- **Base:** main `778e483a90b00c835438237595a86600f4ba44b2`.
- **Shape:** one fleet, **three code PRs** (the browser polls, the worker and cron, the revision reads) and one docs PR. Local checks only before the stop, and one stop before the merges.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix.

**Stops: one**, before the merges (section 6). The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes.

## 1. Why

**The report.** It covers about 18 days, measured by the minute wake's 26,205 calls. Over that time it counts 482 million PostgREST requests, while the gateway now shows about 17 a minute. So that burst is not today's traffic, and this fleet does not claim to explain it.

**What this fleet removes** are the app's own timers that re-send a request with no new event. Rule 5 forbids them: "don't add fallbacks that quietly retry". Realtime (posts, filtered to the user since #1094, and post_comments) already carries every change these timers wait for:
- **Status changes** are posts updates.
- **The picture card's publication** also updates posts: `publish_results_card` sets the meal's status in the same transaction (migration 0011).
- **A model reply** is a post_comments insert.

**What replaces each timer:**
- the Realtime event;
- a read when the tab becomes visible or gains focus (most already have one);
- for a read that failed, the failure shows on the card, and the person's tap or the next focus reads again.

A healthy open tab then makes no timed request at all.

## 2. PR 1 — branch `fix47/no-quiet-retries` — the browser polls

**Each item below is one deletion. Keep the Realtime handlers and the focus and visibility reads.**

1. **#1114 `src/components/RealtimePost.tsx` — the card poll.** Delete `schedulePoll` and every call to it, `pollBackoffMs`, the `POLL_*` and `CARD_*` constants and `cardPolling`, along with the mount read's dependence on them.
   - **Kept:** the channel's UPDATE and DELETE handlers, `media-removed` and `correction-reverted`, and the `visible` handler, which reads once when the tab becomes visible or gains focus.
   - **A meal still analysing** gets its updates from the posts UPDATE event, as the picture card's publication does.
   - **A card whose optional read failed** (`hasUnavailableFields`) shows its existing unavailable state. It reads again on focus or visibility, never on a timer.
   - Tests:
     - `tests/card-polling.test.mjs` and `tests/feed-unavailable-retry.test.mjs` encode the poll ("…keeps polling and recovers…", "…backs off…", "…still repairs itself"). Rewrite them to the rule: with fake timers, **ten simulated minutes on a failed card make 0 reads**, and one focus makes exactly 1 read, which recovers the nutrition.
     - An UPDATE event makes exactly 1 read.
     - "Clarification and deleted meals retire" stays.
2. **#1115 `src/components/Feed.tsx` (the upload card's `read`, about lines 545–590) — the 2/5/10/30-second reread of an unsettled upload card.** Delete the `delays` timer and `step`.
   - **Kept:** the `upload-post-${id}` channel's UPDATE handler, `changed` and `visible`.
   - Test: an upload card that stays unsettled makes **0 reads in ten simulated minutes**. One UPDATE event makes 1 read.
3. **#1116 `src/components/QueueTicker.tsx` — the 60-second re-tick while any job is queued or running.** Delete the `pending` timer.
   - **Kept:** the tick on mount and on `focus`, `post-created`, `upload-started` and `upload-finished`.
   - **Why it can go:** the minute cron wake already starts the worker for due work, as the file's own comment says ("The cron wake still recovers due work"). The counts it read are global, so every user's open tab ticked for every other user's job.
   - Test: with a fake `/api/jobs/tick` answering `queued: 3`, **ten simulated minutes make 0 further ticks**. One `focus` makes 1.
4. **#1117 `src/components/Thread.tsx` — the 2-to-30-second poll while waiting for a reply (lines 50–60).** Delete that effect.
   - **What replaces it:** the thread already reloads on post_comments INSERT and UPDATE. For a correction that fails without a comment, the thread also listens to the existing window event `post-readiness`, which `PostReadinessListener` dispatches from the user's posts channel, and calls `load()` when its `detail.id` is this meal. **No new channel.** Add a visibility read, as the other components have.
   - Test: waiting, **ten simulated minutes make 0 loads**. A `post-readiness` event for this meal makes 1, and one for another meal makes 0.
5. **#1118 `src/components/PostReadinessListener.tsx` — the 3-second / 15-second status poll of pending meals (lines 140–163).** Delete the `setInterval` and `polling`.
   - **Kept:**
     - the user's posts channel and `settle`;
     - `seedPending` and `discover` on subscribe and focus;
     - the reconnect catch-up (once per reconnect, at most every 30 s per tab), with its visible failure status.
   - Test: `tests/readiness-cpu.test.mjs`'s five-idle-minutes test gains a pending meal and still counts **0 reads**. A channel event settles it. Its other two tests stay.
6. **#1119 `src/components/NeedsInputStrip.tsx` — the 60-second discovery poll, the 2-to-30-second backoff while questions show, and the media retry timer.** Delete `schedulePoll`, `pollTimer`, the `POLL_*` and `DISCOVERY_IDLE_MS` constants, `mediaRetryAt` and `mediaFailures`.
   - **Kept:** `kick` on `post-readiness`, sign-in and account change, plus `focus` and `visible`.
   - **A thumbnail that failed** shows the existing grey square, and the next focus or event reads again.
   - Test: with one question showing, **ten simulated minutes make 0 reads**. `tests/needs-input-batch.test.mjs` stays green.

**One source test for PR 1:** none of the six files contains `setInterval`, and a `setTimeout` that schedules a database or `/api/` read is gone from each. List any `setTimeout` that stays and say what it is for; the UI timers (toasts, focus, animation) stay.

**What a person sees:**
- Live meals still update at once.
- A card whose read failed says so, and fixes itself when they return to the app or tap.
- Nothing changes on a timer while the app sits open.

## 3. PR 2 — branch `fix47/worker-and-cron` — the worker's self-tick, and the cron log

7. **#1120 `src/lib/worker/drain.ts:76-85` — the self-tick after a round that processed nothing.**
   - **Today:** `runWorker` re-ticks itself whenever `next_worker_wake()` names a time. It waits at least 1 s and stays inside its 270-second budget. When work is "due" but `claim_post_job` skips it, the worker loops about once a second until its budget ends, about 7 requests a round. The minute wake then starts it again.
     - **Example:** a queued job behind a running job on the same meal, 360 s after that job started, until recovery fails it.
   - **The change:** if no lane processed a job in this invocation, return without `tickSelf`. The minute wake handles the next due time. Self-tick stays for an invocation that did work and still has some (the 60-second lane limit).
   - **Tests:**
     - `tests/worker-recovery-wake.test.mjs` "blocked due work waits for eligibility…" becomes: due-but-unclaimable work makes **0 self-ticks**.
     - "A lone abandoned running job can acquire a recovery worker" and "a queued job that is not due yet…" stay green.
     - New: two processed jobs with more remaining make exactly 1 self-tick.
   - **The effect:** a job that becomes claimable mid-invocation, after a blocked round, waits for the next minute wake (at most 60 s) instead of about 1 s. Report this in the PR body.
8. **#1121 The cron run log, `cron.job_run_details`: 7 days kept.**
   - **Migration `0073_cron_run_retention.sql`:**
     - `retention_cron_runs_dry_run(p_now default now())`: counts rows with `end_time < p_now - interval '7 days'`, per day and status. It deletes nothing.
     - `retention_cron_runs_batch(p_limit)`: deletes at most `p_limit` (1 to 5000) of those rows, oldest first, in one statement. It writes the count per day to Fleet 43's `retention_summary` (`table_name 'cron.job_run_details'`, rule `older_7d`) and returns the number deleted.
     - **Permissions:** both are `security definer`, owned by `postgres`, and revoked from `public`, `anon` and `authenticated`.
     - **The schedule is not created by the migration.**
   - **Rollback `0073_cron_run_retention.down.sql`:** drops both functions, and unschedules `retention-cron-runs` if it exists. Deleted run details cannot be restored; only their counts per day remain in `retention_summary`.
   - **`scripts/retention/run.mjs`** gains `--table=cron_runs`, with the same bounds, dry-run default, pause and stop.
   - **Write both functions in plpgsql**, so 0073 applies on a stack without `cron.job_run_details`: a plpgsql body is resolved when it runs.
   - **The stand-in table.** `scripts/test-stack.mjs`, beside its stub `cron.schedule` (line 36), creates `cron.job_run_details(jobid bigint, runid bigint primary key, job_pid integer, database text, username text, command text, status text, return_message text, start_time timestamptz, end_time timestamptz)`. These are pg_cron 1.6's columns.
   - **Test** `tests/db/retention-cron-runs.test.mjs` (local throwaway database, on the stand-in table): seed rows at 6, 8 and 30 days old. The dry run counts 2 and deletes nothing; a batch of 1 twice deletes the two; the 6-day row stays; `retention_summary` counts 2.
   - **The delete permission** cannot be shown on a stand-in table. It is one read in section 7, step 3.

**The PM's question: can the minute wake go?** No. The event path (the post and comment routes' tick, focus, and the worker's self-tick) runs only when someone acts. Four kinds of work wait on a clock, and only the minute wake reaches them:
- **retries:** `fail_job` sets `run_after` with backoff;
- **rate-limited USDA jobs:** `requeue_rate_limited_job`;
- **photo-stage cleanup,** three hours later;
- **recovery of a job whose worker died** (`recover_abandoned_jobs`, after 360 s).

Without the wake, a failed meal would retry only when the person next opens the app. **It already skips when nothing is due:** `wake_due_worker()` returns at once when `next_worker_wake()` is null or in the future, and only then calls `net.http_get` (0024). What remains each minute is one cheap function call and one run-log row, which item 8 bounds. Item 7 also stops the wake's worker from spinning.

## 4. PR 3 — branch `fix47/one-revision-read` — the meal page and thread

9. **#1122 One `feedback_revision` read per meal page, none in its thread.**
   - **`src/lib/posts/feed.ts`, `toFeedPost`:** when `known` is given (only `getPostDetail` passes it), `revisionAfter` is `known.revisionBefore`, not a second `latestRevision` call.
   - **Why the second read can go:** a vote whose fingerprint no longer matches is already refused by `save_revision_feedback`. `/api/posts/[id]/feedback` answers 409 with the current revision, so a stale fingerprint fails visibly. Server card reads without `known` (agent ops) are unchanged.
   - **`src/components/Thread.tsx`:** it takes a `fingerprint` prop from `PostDetail.tsx` (`card?.analysisFingerprint ?? null`), and `rpc('feedback_revision')` in `load()` is deleted. `accepted` is computed from the verdict row and that prop. After a correction, the thread's existing `router.refresh()` brings the new fingerprint.
   - **Tests:**
     - a meal page load makes **exactly 1** `/rpc/feedback_revision` request;
     - a thread load makes **0**;
     - a vote whose fingerprint is stale gets the 409 with the current revision (the existing route test).
   - **Shared reader:** the fingerprint comes from `getPostDetail`'s one read, not a copy.

## 5. How it runs

1. **Worktree** `/tmp/mfa-f47` from `origin/main` (after Fleet 46's merge), with `npm ci`. One branch per PR, each from `origin/main`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=62860 TEST_PG_PORT=57149 TEST_STACK_DIR=/tmp/mfa-f47s TEST_ENV_FILE=.env.test.fleet47`. A stack folder inside the worktree breaks the Next build.
3. **Checks, per PR:** `npx tsc --noEmit`, `npx eslint` on the changed files, and the PR's tests.
4. **The suites:** both once, on a scratch branch of the three PRs together, with the built app started (10 minutes each). Compare the counts with main's, test by test.
5. **The local check, L1:** on the stack, as test user 1, at 390 × 844.
   - **Realtime:** the stack has none, so the Realtime paths are proven by PR 1's fake-channel tests, the pattern `tests/readiness-cpu.test.mjs` uses. Each fires a fake `postgres_changes` payload and asserts exactly 1 read.
   - **The run:** open Home with one ready meal, one meal still analysing and one question showing, then leave the tab visible for 10 minutes. Count every request to `/rest/v1/`, `/api/` and `/rpc/` from the browser and from the app server's log. Then make one correction on the meal page.
   - the analysing meal is ready in the database, and **one window focus** brings it to the page within 1 read. With no Realtime locally, the card is expected to stay as it was until that focus;
   - after it is ready, the 10 idle minutes make **0** timed requests (list any that occur, with their source);
   - the correction's reply appears in the thread after one focus. Its live path is a fake post_comments INSERT test that makes 1 load;
   - the meal page makes 1 `feedback_revision` request.
6. **Review:** one PPLX review per code PR on its final head (AGY if PPLX is unavailable).
7. **Docs PR:** branch `docs/fleet47`, with this plan unchanged as `docs/plan-fleet47.md`.

## 6. The stop

Stop when:
- the three code PRs and the docs PR are open;
- each code PR is reviewed or reported "written, not reviewed";
- L1 is reported.

Report to the PM in one message:
- each PR's number, branch, final head (40 characters), checks and review;
- the suites' counts against main;
- L1, with its request counts;
- anything void under the halts;
- the merge order: **PR 1, PR 2, PR 3 (any order among them), then the docs PR**.

Then wait for the PM's merge order, which names each PR and its full head SHA.

## 7. After the PM's merge order: production, once (rule 4: one sequential pass)

1. **Deployment:** wait for READY with the alias matched (at most 10 minutes).
2. **The migration:** apply 0073 once. Read back once that both functions exist.
3. **The dry run and the privilege, once, in one read-only session:**
   - run `select has_table_privilege('cron.job_run_details','DELETE');`;
   - run `node scripts/retention/run.mjs --table=cron_runs`.

   Report both outputs whole. **Delete nothing.** If the privilege is false, stop and report; no batch can run.
4. **The Realtime check, once,** after all three PRs are merged and deployed. **No repeat, no other probe.** It is the same shape as the #1099 gate.
   1. **One write:** post one photo meal as test account 2, and ledger it.
   2. **One open:** a fresh, signed-in Chromium at 390 × 844.
   3. **Met when:**
      - the meal reaches ready on the page **without a reload**;
      - the page's own network log (client side, so it adds no database reads) shows **0 timed requests** in 5 idle minutes after that. List any request it shows, with its source.
   4. **Delete the meal,** and read it back once as absent.
   5. **Report:** ready time, the idle count and the deletion read.
5. **Stop and report.** The PM orders the first batch, and whether to schedule `retention-cron-runs` (one batch of 5000 a day), separately.

PR 3 and item 7 need no production check: each only removes requests. PR 1's check is step 4.

## 8. Not in this run, and why

- **The 482 million preludes (#1123):** not today's traffic (the gateway shows about 17 requests a minute). The PM asks RT whether to reset the statistics so the next read measures main alone.
- **Memory commitment:** the app holds no Postgres connection of its own (section 9), so no app setting changes it. That is a database settings or compute decision for RT.
- **The day-read index:** the PM's order (e), skipped. The unfiltered form is history.

## 9. Database connections from the app (the PM's question (c), from source)

- **Server:** the app opens **no direct Postgres connection.** There is no `pg` or `postgres` dependency, and every server client is `@supabase/supabase-js` over HTTPS:
  - `createAdminClient` and the request client make PostgREST, Storage and Auth HTTP calls. Supabase's own services hold the database connections.
  - A new client per request costs no connection.
  - The only direct connections are the hand-run scripts that use `SUPABASE_DB_URL` (`psql`, for migrations and retention), one at a time.
- **Browser:** `createBrowserClient` from `@supabase/ssr` is one shared client per tab, so each open tab holds one Realtime WebSocket with its channels:
  - the user's posts channel;
  - one channel per card (#1095);
  - the thread;
  - upload cards.

  Realtime's server keeps its own small database pool, not one connection per socket. Its cost is CPU (row 2, `list_changes`), which #1094 cut.
- **So the committed memory** is set by the database's own settings and Supabase's service pools:
  - `max_connections` × `work_mem`, with `shared_buffers` and `maintenance_work_mem`;
  - the PostgREST, Supavisor, Realtime, Storage and Auth pools;
  - pg_net's and pg_cron's workers.

  The app's pool settings cannot change it.
- **The read that would show it (once, by whoever holds production access):**
  - `select usename, application_name, state, count(*) from pg_stat_activity group by 1,2,3 order by 4 desc;`
  - `show max_connections; show shared_buffers; show work_mem; show maintenance_work_mem;`

  Lowering any of these is a production settings change (Supabase's Postgres configuration) or a compute change. RT decides.
