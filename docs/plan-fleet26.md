# Fleet 26 — numbers you can trust, a queue that does not stall, and the unfinished checks (2026-11-17)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** A new plan from the owner's Engineering backlog (Doc rev 1975). It has eight code PRs and one docs PR, one stop before the merges, and production steps that run only after the PM's merge order.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix. A defect you find goes to the PM as one line for the backlog, and nothing more. A Find text that does not occur exactly once is skipped and reported, never rewritten.

**Stops: one**, before the merges (section 8). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void; the rest continues), and an operation that would contact a customer.

**Long waits.** Every wait in this plan is bounded and says its bound; none is longer than 10 minutes. The production re-analysis in section 9 is several commands of at most 10 minutes each. Under AGENTS.md it needs the PM's and the owner's written confirmations, and the merge order must carry them, as Fleet 25's did. Without them, flag it as the AGENTS.md rule says and skip it.

**Nothing in this plan runs against production before the merge order.** Customer contact is forbidden.

## 1. The items

| # | Item | What changes for a person | PR |
|---|---|---|---|
| 1 | F1 delay (the cause behind the unfinished checks) | A new meal no longer sits "Processing" for a minute or more after another worker stopped without letting go of the queue | 1 |
| 2 | #967 | The "traffic" label stops saying medium or high when nothing is waiting | 1 |
| 3 | #983 | One command re-analyses a list of meals, keeps their old rows, and puts any meal back | 2 |
| 4 | #997 | Putting a meal back never queues work for a deleted meal | 2 |
| 5 | #998 | The two number audits pick the same food name every run | 2 |
| 6 | #989 (first step) | The meals whose numbers break a rule are listed, re-matched and, where still wrong, re-analysed (production, after the merge order) | 2, section 9 |
| 7 | #984 | A re-analysed meal never copies numbers or a hint from an earlier meal | 3 |
| 8 | #985 | After a re-analysis, the meal's first comment and its saved-meal copy show the new numbers | 3 |
| 9 | #986 | Removing a correction or a leftovers photo after a re-analysis keeps the re-analysed numbers | 3 |
| 10 | #987 | A coffee or tea whose numbers are a model estimate stores a caffeine value | 4 |
| 11 | #988 | A drink whose USDA record has no category, such as a cola or a rum cocktail, counts as a drink | 4 |
| 12 | #968 | Returning to a meal's tab checks for an update at once | 5 |
| 13 | #973 | A meal with no photo that failed shows one failure sentence, the same in both places | 5 |
| 14 | #120 | Home with only finished meals stops reloading its whole page every minute | 5 |
| 15 | #969 | An added photo whose request never answers fails, shows the failed chip, and the chip stops saying "Uploading" | 6 |
| 16 | #970 | Each refusal of an added photo says what happened and what to do | 6 |
| 17 | #972 | The capture sheet loads after the page, not with it, and still opens offline | 7 |
| 18 | #971 | Nine unused files are removed; every other candidate is kept with its reason | 8 |
| 19 | #523, #615, #703, #708, #323 | The checks that could not run in Fleet 24 run again on the local stack | section 7 |
| 20 | Docs PR | This plan and the check results | docs |

## 2. Facts the planner checked on 2026-11-17, and premises

Facts. Read on main `84a6c1b7358ec2f4e92b0e91f7376e8ec84ec152`; do not check them again.

- Every Find text in sections 5 and 6 occurs exactly once in its file on that commit. The planner applied every edit of this plan to an export of that commit, and the result matched the tested copy byte for byte.
- On a copy of main with all eight code PRs applied (as one copy, so the per-PR runs in step 5 are still needed): `npx tsc --noEmit` reported nothing; `npx eslint` on every changed file reported only the 1 error and 2 warnings that main has in those files (OutlineOverlay.tsx set-state-in-effect and exhaustive-deps; upload-guard.test.mjs unused `rows`); the application suite passed 747 of 754 with 6 skipped and 1 failure, and the database suite passed 49 of 49 in 118 seconds. The failure was `tests/estimate-rollout-compatibility.test.mjs`: it reads an old file with `git show`, and the copy was not a git checkout. With `GIT_DIR` pointing at the repository it passed 3 of 3. In a worktree it passes as it does on main.
- **The F1 delay, reproduced.** The worker lease is one row (`public.worker_lease`). When a post is published, the post route ticks the queue once (`src/app/api/posts/route.ts`, `kickoff`). If another holder's lease is still live at that moment, the tick starts nothing (`src/lib/queue/tick.ts`, `tryAcquireLease`). A holder that died never releases its lease, which lasts 60 s (`LEASE_TTL_SECONDS`). After it expires, nothing ticks again: the local stack has no once-a-minute database wake, the database test does not tick, and in a browser `QueueTicker` ticks again only after 60 s. On the planner's local stack, with ten not-due cleanup jobs queued and a lease row left live for 40 s by a holder that was not running, `tests/db/after.test.mjs` failed after 121.6 s with the meal still `queued`, exactly as in Fleet 24. Without the live lease, three runs passed in 1.8 s each, also with the ten cleanup jobs, so the cleanup jobs are not the cause. With PR 1's change the same live-lease run passed in 42.5 s, and a normal run in 1.8 s. Production has the database wake each minute, so there the stall is at most about a minute plus the lease; PR 1 shortens that too.
- `tests/fixtures/local-model.mjs` switches its scripted answers with `POST <model origin>/__fixture` and `{"mode":…}`. With PR 1's new mode `beer-question`, a photo meal posted on the local stack became `ready` with a stored question ("The photo does not look like a beer. Was this a pint of Bintang beer?") and the item "Bintang beer", 568 g. `{"mode":null}` resets it.
- An operator re-match and re-analysis on the local stack wrote their new rows with a `created_at` equal to the `superseded_at` of the rows they replaced, and wrote no new model comment; the first model comment kept the first analysis's text. PR 3's rebuild and summary rules rely on both.
- The five refusal sentences of PR 6 were chosen by AGY (gemini-3.8-flash-high, conversation `265f0632-4f92-4053-a468-814cb4235f6d`, 2026-11-17). The planner kept the existing expiry sentence and added the deleted-meal refusal as the fifth.
- `src/lib/queue/enqueue.ts` is imported by `src/app/api/posts/[id]/retry/route.ts` and `src/lib/posts/retry.ts`, so #971 keeps it.

Premises. From earlier reports, not checked by the planner.

- P1: The Fleet 25 study's counts hold on production today: 151 ready meals for the owner's account; current items failing rule a2 on 2 meals, b on 3, e on 6, f on 1 and g1 on 8 (the coffee 4dfe4411 among them, since fixed).
- P2: The Fleet 25 coffee re-match used 6 model calls and 20,801 tokens. A full re-analysis of one meal uses at most about 15 model calls.
- P3: Every operator re-analysis or re-match that finishes sends the owner's phone one "meal ready" notification. This plan does not change that.

## 3. Not in this run, and why

| Item | Why it is left out |
|---|---|
| #990 | It comes after #989's first step. What it needs is in section 9.4. |
| #929 | The review runner that wrote Fleet 24's and Fleet 25's receipts is not the one in the repository (`tools/pplx-review.mjs`), so the route cannot be planned to exact text. To plan it, the planner needs the path of the runner the builder actually uses. |
| #323's fix | The cause of the extra sign-in calls is not established. This plan only measures again, with the requests beside the calls (check K5). |
| The other 32 Engineering items | Not chosen for this fleet by the PM's packet. |
| Scripts outside #971's list that nothing runs (the eleven `real-*-smoke`, `meta-check`, `make-tone` and similar) | Not named by #971. Reported to the PM as one line. |

## 4. How it runs

1. **Worktrees.** One fresh worktree per PR from `origin/main`, branches as named in each PR. Before any test in a worktree: `npm ci`.
2. **Your own stack.** Use `TEST_PORT_BASE=60760 TEST_PG_PORT=55499 TEST_STACK_DIR=/tmp/mfa-f26/stack TEST_ENV_FILE=.env.test.fleet26`. Containers end in `-60760`. Never stop or touch another team's stack (containers ending in another number). Where an earlier plan's command says port 60260, read 60760; where it says `/tmp/mfa-f21` or `/tmp/mfa-f24`, read `/tmp/mfa-f26`.
3. **Test command.** `PATH="$PWD/tests/bin:/usr/pgsql-17/bin:$PATH" TZ=UTC TEST_ENV_FILE=.env.test.fleet26 MFA_TEST_DISPOSABLE=1 npm test`, and the same with `npm run test:db`. Bound: 10 minutes each (`timeout 600`). The application suite took 394 s for the planner; the database suite 118 s.
4. **Build.** `TEST_ENV_FILE=.env.test.fleet26 MFA_TEST_DISPOSABLE=1 npm run test:app -- build`. On this host the build ends with exit 1 and `SecurityFatalError: Your version of Next.js is affected by a known security vulnerability` after it has finished: "Generating static pages (44/44)" and a fresh `.next/BUILD_ID` mean it built. Upgrading Next.js is not part of this plan; report the line once.
5. **Per PR**, in its worktree: apply the edits; `npx tsc --noEmit`; `npx eslint <changed files>` (expected: no finding that main does not have); the PR's named tests; then the application suite once on PR 1's worktree, and the database suite once on PR 3's worktree (it adds migration 0065: the stack applies migrations when it starts, so start the stack from PR 3's worktree for that run). Report each command with its exit code and counts.
6. **Reviews.** One PPLX review per code PR on its final head, full 40-character SHA; AGY when PPLX is unavailable. The docs PR needs no review. A review finding is fixed in that PR only if it is a defect in this plan's change; anything else goes to the PM.
7. **Checks** (section 7) on PR 1's build, after PR 1's tests pass.
7a. **Docs PR**, branch `docs/fleet26` from `origin/main`: commit this plan unchanged as `docs/plan-fleet26.md`, and add `docs/findings/fleet26-checks.md` with one section per check of section 7 (what was seen, with the numbers). Run `node scripts/audit/customer-data.mjs --check` before the push if it exists on main.
8. **Stop** (section 8).

## 5. The code PRs

### PR 1 — branch `fix26/worker-wake` — F1 delay, #967, #615's stand-in

**Service:** the queue wake (`src/lib/queue/tick.ts`, `traffic.ts`, the tick route) and the local model stand-in.
**What changes:** the due-only queue count lives once, in `traffic.ts` (`countDueQueued`), and both the tick and the traffic label use it (#967). A tick that finds due work while another holder has a live lease now looks once more, when that lease can have expired, by calling the tick again in the background (`retickWhenBlocked`, at most one pending per server instance, waiting at most one lease lifetime plus one second). The stand-in gains the mode `beer-question` for check K4.

File `src/lib/queue/traffic.ts`.

Find:
```
  return depth < 10 ? "low" : depth <= 50 ? "medium" : "high";
}
```
Replace:
```
  return depth < 10 ? "low" : depth <= 50 ? "medium" : "high";
}

// The one rule for waiting work: queued and due. A job that is not due yet (a photo-stage cleanup
// runs three hours later) is not waiting. The tick's wake decision and the traffic label both read this.
export function countDueQueued(admin: SupabaseClient) {
  return admin.from("jobs").select("id", { count: "exact", head: true }).lte("run_after", new Date().toISOString()).eq("status", "queued");
}
```

Find:
```
      const { count, error } = await admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "queued");
```
Replace:
```
      const { count, error } = await countDueQueued(admin);
```

File `src/lib/queue/tick.ts`.

Find:
```
import { getTraffic, type Traffic } from "@/lib/queue/traffic";
```
Replace:
```
import { countDueQueued, getTraffic, type Traffic } from "@/lib/queue/traffic";
```

Find:
```
    // A job that is not due yet (a photo-stage cleanup runs three hours later) is not waiting work.
    admin.from("jobs").select("id", { count: "exact", head: true }).lte("run_after", new Date().toISOString()).eq("status", "queued"),
```
Replace:
```
    countDueQueued(admin),
```

Find:
```
  return { queued: depth, running: running ?? 0, traffic, started };
}
```
Replace:
```
  return { queued: depth, running: running ?? 0, traffic, started };
}

let retickPending = false;

// queueTick found due work while another holder has the lease. A healthy holder claims that work
// itself, but a holder that died never releases, and this tick can be the only wake the job gets
// (the post route ticks once; a stack without the minute database wake has nothing else). So the
// caller looks again once that lease can have expired. One pending look per server instance.
export async function retickWhenBlocked(
  admin: SupabaseClient,
  status: { queued: number; started: boolean },
  tickSelf: () => Promise<unknown>,
  ttlSeconds: number
): Promise<boolean> {
  if (status.started || status.queued === 0 || retickPending) return false;
  retickPending = true;
  try {
    const { data } = await admin.from("worker_lease").select("expires_at").eq("id", 1).maybeSingle();
    const expiresAt = data?.expires_at ? Date.parse(data.expires_at as string) : Date.now();
    const wait = Math.min(Math.max(expiresAt - Date.now(), 0), ttlSeconds * 1000) + 1000;
    await new Promise((resolve) => setTimeout(resolve, wait));
  } catch {
    // An unreadable lease still gets its second look, straight away.
  } finally { retickPending = false; }
  await tickSelf();
  return true;
}
```

File `src/app/api/jobs/tick/route.ts`.

Find:
```
import { queueTick } from "@/lib/queue/tick";
```
Replace:
```
import { queueTick, retickWhenBlocked } from "@/lib/queue/tick";
```

Find:
```
        .then((response) => { if (!response.ok) throw new Error(`Drain failed: ${response.status}`); }));
    }
```
Replace:
```
        .then((response) => { if (!response.ok) throw new Error(`Drain failed: ${response.status}`); }));
    } else {
      const tickUrl = new URL("/api/jobs/tick", request.url);
      after(() => retickWhenBlocked(admin, status, () => fetch(tickUrl, { cache: "no-store", signal: AbortSignal.timeout(10_000) }), LEASE_TTL_SECONDS));
    }
```

File `tests/fixtures/local-model.mjs`.

Find:
```
if(mode==='meta-refusal'&&name==='identify')return send(200,{status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'Scripted refusal'}]}],usage:{input_tokens:1,output_tokens:1}});
if(mode&&name==='identify'){const response=structuredClone(fixture),water=mode==='water',unknown=mode==='cola-unknown';const meal={items:[{confidence:1,name:mode==='fdc-429'?'USDA rate-limit fixture '+crypto.randomUUID():water?'Water':'Coca cola',portion_grams:unknown?null:water?300:330,portion_text:water?'300 ml, estimated from the photo':'330 ml, read from the can',region_index:null}],needs_input:null,summary:water?'Water in a glass.':'Cola in a can.',nutrition_label:false};for(const output of response.output)for(const text of output.content??[])if(text.type==='output_text')text.text=JSON.stringify(meal);return send(200,response);}
```
Replace:
```
if(mode==='meta-refusal'&&name==='identify')return send(200,{status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'Scripted refusal'}]}],usage:{input_tokens:1,output_tokens:1}});
// #615: a caption that disagrees with the photo. The beer is named from the caption and the model asks one question.
if(mode==='beer-question'&&name==='identify'){const response=structuredClone(fixture);const meal={items:[{confidence:0.6,name:'Bintang beer',portion_grams:568,portion_text:'1 pint, from the caption',region_index:null}],needs_input:{question:'The photo does not look like a beer. Was this a pint of Bintang beer?',short:'Clarification needed',options:['Yes, a pint of beer','No, something else']},summary:'A pint of beer, from the caption.',nutrition_label:false};for(const output of response.output)for(const text of output.content??[])if(text.type==='output_text')text.text=JSON.stringify(meal);return send(200,response);}
if(mode&&name==='identify'){const response=structuredClone(fixture),water=mode==='water',unknown=mode==='cola-unknown';const meal={items:[{confidence:1,name:mode==='fdc-429'?'USDA rate-limit fixture '+crypto.randomUUID():water?'Water':'Coca cola',portion_grams:unknown?null:water?300:330,portion_text:water?'300 ml, estimated from the photo':'330 ml, read from the can',region_index:null}],needs_input:null,summary:water?'Water in a glass.':'Cola in a can.',nutrition_label:false};for(const output of response.output)for(const text of output.content??[])if(text.type==='output_text')text.text=JSON.stringify(meal);return send(200,response);}
```

New files, given whole in section 6: `tests/blocked-tick-retick.test.mjs`, `tests/traffic-due.test.mjs`.

**Tests:** `tests/blocked-tick-retick.test.mjs`, `tests/traffic-due.test.mjs`, `tests/worker-recovery-wake.test.mjs`, `tests/empty-job-claim.test.mjs`; and `tests/db/after.test.mjs` twice on PR 1's build: once as it is, and once after `psql $DB -c "insert into public.worker_lease(id,holder,expires_at) values(1,'dead-holder',now()+interval '40 seconds') on conflict(id) do update set holder=excluded.holder, expires_at=excluded.expires_at"` (expected: passes in under 60 s; on main it fails at 120 s).

**Done when:** the live-lease run of `tests/db/after.test.mjs` passes, and the traffic label of a queue holding only not-due jobs is "low".

### PR 2 — branch `fix26/numbers-tools` — #983, #997, #998, #989 (the selection)

**Service:** operator scripts in `scripts/numbers/`. Nothing a person uses runs them.
**What changes:** a new command `reanalyse.mjs` runs the existing files 08, 09, 11, 12 and 13 one meal at a time, keeps a private ledger and snapshot, stops on its own limits, and restores any meal (#983); it copies no SQL from them. `13-restore.sql` refuses a deleted meal (#997). `03` and `04` choose one cached description per record by the rule of `06`: a detail entry before a search entry, then text order (#998). The new read-only `14-rule-failures.sql` lists the meals failing rules a1, a2, b, d, e, f or g1, and whether `12` would accept each (#989).

File `scripts/numbers/13-restore.sql`.

Find:
```
from public.posts p where p.id = :'post'::uuid and p.status = 'ready'
```
Replace:
```
from public.posts p where p.id = :'post'::uuid and p.status = 'ready' and p.deleted_at is null
```

File `scripts/numbers/03-suspicious.sql`.

Find:
```
  select distinct on (fdc_id) fdc_id, description from (
    select (f->>'fdcId') as fdc_id, f->>'description' as description
```
Replace:
```
  -- One description per record, chosen the same way every run and by the rule of 06-seafood.sql:
  -- a detail entry ('fdc_cache detail') wins over a search entry ('fdc_cache search'); then the first description in text order.
  select distinct on (fdc_id) fdc_id, description from (
    select (f->>'fdcId') as fdc_id, f->>'description' as description, 'fdc_cache search' as found_in
```

Find:
```
    select coalesce(c.response->'payload'->>'fdcId', c.response->>'fdcId'), coalesce(c.response->'payload'->>'description', c.response->>'description')
```
Replace:
```
    select coalesce(c.response->'payload'->>'fdcId', c.response->>'fdcId'), coalesce(c.response->'payload'->>'description', c.response->>'description'), 'fdc_cache detail'
```

Find:
```
  where fdc_id in (select source_ref from items where source_ref ~ '^[1-9][0-9]*$') and description is not null
  order by fdc_id
), described0 as (
```
Replace:
```
  where fdc_id in (select source_ref from items where source_ref ~ '^[1-9][0-9]*$') and description is not null
  order by fdc_id, found_in, description
), described0 as (
```

File `scripts/numbers/04-summary.sql`.

Find:
```
  select distinct on (fdc_id) fdc_id, description from (
    select (f->>'fdcId') as fdc_id, f->>'description' as description
```
Replace:
```
  -- One description per record, chosen the same way every run and by the rule of 06-seafood.sql:
  -- a detail entry ('fdc_cache detail') wins over a search entry ('fdc_cache search'); then the first description in text order.
  select distinct on (fdc_id) fdc_id, description from (
    select (f->>'fdcId') as fdc_id, f->>'description' as description, 'fdc_cache search' as found_in
```

Find:
```
    select coalesce(c.response->'payload'->>'fdcId', c.response->>'fdcId'), coalesce(c.response->'payload'->>'description', c.response->>'description')
```
Replace:
```
    select coalesce(c.response->'payload'->>'fdcId', c.response->>'fdcId'), coalesce(c.response->'payload'->>'description', c.response->>'description'), 'fdc_cache detail'
```

Find:
```
  where fdc_id in (select source_ref from items where source_ref ~ '^[1-9][0-9]*$') and description is not null
  order by fdc_id
), described0 as (
```
Replace:
```
  where fdc_id in (select source_ref from items where source_ref ~ '^[1-9][0-9]*$') and description is not null
  order by fdc_id, found_in, description
), described0 as (
```

File `scripts/numbers/README.md`.

Find:
```
Files 03 and 04 hold the same rules. Each must be one SELECT so that it runs in a read-only session. Change a rule in both.
```
Replace:
```
Files 03 and 04 hold the same rules. Each must be one SELECT so that it runs in a read-only session. Change a rule in both.

## Re-analysing a list of meals: reanalyse.mjs

`node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse --meals=<prefix,...> --ledger=<private directory outside the repository>` works the meals one at a time with 11-rematch.sql or 12-reanalyse.sql. Before it touches a meal it appends that meal's snapshot (08) to `<ledger>/snapshots.jsonl`, and afterwards one line per meal (prefix, before and after totals, seconds waited, model calls) to `<ledger>/ledger.jsonl`. It stops on its own at `--max-meals` (default 10), at `--max-minutes` (default 45), after two failed or timed-out meals in a row, or when more than one meal in ten has failed. `--dry-run` writes nothing. `restore --meal=<prefix> --ledger=<directory>` puts one meal back from its snapshot with 13-restore.sql. `--help` gives every option. It needs `SUPABASE_DB_URL`, `APP_URL` and psql.

14-rule-failures.sql is read-only, like 02 to 09: one row per ready meal that fails rule a1, a2, b, d, e, f or g1 of 03, and whether 12-reanalyse.sql would accept it. It repeats those rules, so a rule change is made in 03, 04 and 14.
```

New files, given whole in section 6: `scripts/numbers/reanalyse.mjs`, `scripts/numbers/14-rule-failures.sql`, `tests/numbers-reanalyse.test.mjs`.

**Tests:** `tests/numbers-reanalyse.test.mjs`. Then on the stack: make three photo meals as F1 is made; `reanalyse.mjs run --mode=rematch` on two of them, `--mode=reanalyse` on the third, a `--dry-run`, a prefix that matches nothing (exit 4), `--max-meals=1` given two meals (exit 3), and `restore` on one re-matched meal; run `14-rule-failures.sql` and `03-suspicious.sql` read-only (`PGOPTIONS='-c default_transaction_read_only=on'`). For #997: `update public.posts set deleted_at=now()` on one ready meal, run `13-restore.sql` for it (no job row appears), then for an undeleted one (one job row). For #998: insert two `fdc_cache` rows naming the same record with different descriptions (one `fdc-detail:` query, one search) and run 03 and 04 three times each: the same description each time.

**Done when:** each command above gives the exit code and ledger lines described, and the two #997 and #998 cases hold.

### PR 3 — branch `fix26/reanalysis-safety` — #984, #985, #986

**Service:** the analysis and recompute jobs (`src/lib/worker/jobs/analyze.ts`, `recompute.ts`, `src/lib/pipeline/persist.ts`) and migration 0065.
**What changes:** a job whose payload carries `operator` (written only by `scripts/numbers/11`, `12` and `13`) takes no hint and no copy from an earlier meal (#984). For such a job the database rewrites the first model comment with the new summary, and a new function `refresh_operator_saved_meal` rebuilds the meal's saved-meal copy through `save_meal_from_post`, the one function that builds it; the job handlers call it after the meal is ready (#985). The rebuild after a removed correction or leftovers photo starts from the newest operator revision instead of the first analysis, unless that revision already holds a correction (#986). Ordinary jobs are unchanged.
**Migration:** `0065_operator_revision.sql` with `supabase/rollbacks/0065_operator_revision.down.sql`. The rollback restores the two functions exactly as 0054 left them and drops the new one. Production applies it in section 9.1.

File `src/lib/pipeline/persist.ts`.

Find:
```

// Publication clears clarification atomically with ready under the post lock. The stored card is optional:
```
Replace:
```

// #985: after an operator re-analysis, re-match or restore (scripts/numbers) has made the meal ready,
// its saved-meal copy takes the meal's current numbers. The database refuses any other job.
export async function refreshOperatorSavedMeal(admin: SupabaseClient, job: { id: string; post_id: string | null; payload: Record<string, unknown> }): Promise<void> {
  if (!job.post_id || !("operator" in job.payload)) return;
  const { error, status } = await admin.rpc("refresh_operator_saved_meal", { p_post_id: job.post_id, p_job_id: job.id });
  if (error) throw ioError("The saved meal could not be refreshed.", error, status);
}

// Publication clears clarification atomically with ready under the post lock. The stored card is optional:
```

File `src/lib/worker/jobs/analyze.ts`.

Find:
```
import { persistAnalysis, markReady } from "@/lib/pipeline/persist";
```
Replace:
```
import { persistAnalysis, markReady, refreshOperatorSavedMeal } from "@/lib/pipeline/persist";
```

Find:
```
  const prior = (photoCount??0)>1?null:await findPrior(admin,job.post_id);
```
Replace:
```
  // #984: an operator re-analysis (scripts/numbers/12-reanalyse.sql) exists because stored numbers are
  // in doubt, so it takes neither a hint nor a copy from an earlier meal; that meal may be wrong too.
  const prior = (photoCount??0)>1||"operator" in job.payload?null:await findPrior(admin,job.post_id);
```

Find:
```
  await persistAnalysis(admin, named, named.labelNutrition?[named.labelNutrition]:reusable?.nutrition, job.id);
  if (named.needsInput && !named.questionShown) await sendPostPush(admin, job.post_id, named.needsInput.question);
```
Replace:
```
  await persistAnalysis(admin, named, named.labelNutrition?[named.labelNutrition]:reusable?.nutrition, job.id);
  await refreshOperatorSavedMeal(admin, job);
  if (named.needsInput && !named.questionShown) await sendPostPush(admin, job.post_id, named.needsInput.question);
```

File `src/lib/worker/jobs/recompute.ts`.

Find:
```
import { markReady } from "@/lib/pipeline/persist";
```
Replace:
```
import { markReady, refreshOperatorSavedMeal } from "@/lib/pipeline/persist";
```

Find:
```
    await markReady(job.post_id, admin, job.id, { notify: false, saveMeal: false });
    return;
```
Replace:
```
    await markReady(job.post_id, admin, job.id, { notify: false, saveMeal: false });
    await refreshOperatorSavedMeal(admin, job);
    return;
```

Find:
```
  await markReady(job.post_id, admin,job.id);
}


```
Replace:
```
  await markReady(job.post_id, admin,job.id);
  await refreshOperatorSavedMeal(admin, job);
}

// #986: one transaction writes one revision, so its rows share created_at. A correction, a leftovers
// photo and a removal each write a model reply at that instant; an operator revision writes none.
// The rebuild starts from the newest operator revision after the first analysis:
// - a re-analysis (scripts/numbers/12-reanalyse.sql): every earlier row was superseded before it;
// - a re-match (11-rematch.sql): the copy written in the transaction that superseded the rows before
//   it, unless that copy holds a correction or leftovers, because the corrections that are kept are
//   replayed on top of the starting rows.
type RevisionRow={created_at:string;superseded_at?:string|null;not_eaten_grams?:unknown;not_eaten_count_text?:unknown};
type RevisionComment={author:string;created_at:string;reverted_at?:string|null};
function analysisRevision(rows:RevisionRow[],thread:RevisionComment[],first:string):string{
 const replies=new Set(thread.filter(comment=>comment.author==='model').map(comment=>comment.created_at));
 let base=first;
 for(const at of new Set(rows.map(row=>row.created_at))){
  const time=Date.parse(at);
  if(replies.has(at)||time<=Date.parse(first))continue;
  if(rows.some(row=>row.superseded_at===at)){
   const corrected=rows.some(row=>row.created_at===at&&(row.not_eaten_grams!=null||row.not_eaten_count_text!=null))
    ||thread.some(comment=>comment.author==='user'&&Date.parse(comment.created_at)<time&&(!comment.reverted_at||Date.parse(comment.reverted_at)>time));
   if(!corrected)base=at;
  }else if(rows.every(row=>Date.parse(row.created_at)>=time||(row.superseded_at!=null&&Date.parse(row.superseded_at)<time)))base=at;
 }
 return base;
}

```

Find:
```
 let items:import('@/lib/nutrition/totals').CurrentItem[]=(original??[]).filter(row=>row.created_at===first).map(row=>{
```
Replace:
```
 const base=first?analysisRevision(original??[],thread,first):first;
 let items:import('@/lib/nutrition/totals').CurrentItem[]=(original??[]).filter(row=>row.created_at===base).map(row=>{
```

New files, given whole in section 6: `supabase/migrations/0065_operator_revision.sql`, `supabase/rollbacks/0065_operator_revision.down.sql`, `tests/reanalysis-prior.test.mjs`, `tests/removal-after-reanalysis.test.mjs`, `tests/db/operator-revision.test.mjs`.

**Tests:** `tests/reanalysis-prior.test.mjs`, `tests/removal-after-reanalysis.test.mjs`, `tests/removal-rebuild*.test.mjs` if present, and the full database suite (step 5), which includes `tests/db/operator-revision.test.mjs` and the existing summary tests.

**Done when:** the three new test files pass, and the database suite passes with no new failure.

### PR 4 — branch `fix26/drinks` — #987, #988

**Service:** the model estimate (`src/lib/fdc/estimate.ts`) and drink counting (`src/lib/intake/drinks-from-items.ts`, `alcohol.ts`).
**What changes:** the estimate asks for caffeine as an eighth value and stores it as nutrient 1057, exactly as a matched record's caffeine is stored; a missing, zero or out-of-range value (above 400 mg per 100 g) stores none and never fails the estimate; `keepsCaffeine` still drops it for a drink with no caffeine source (#987). A food with no category counts as a drink when the part of its name before "with", "in", "on", a comma or a bracket is or ends with a plain drink or an alcoholic drink name, using the two existing lists (#988). Seafood, crab and lobster cocktails join the existing fruit and shrimp exceptions.

File `src/lib/fdc/estimate.ts`.

Find:
```
const ESTIMATE_INSTRUCTIONS = `No USDA record matches this food. Estimate its typical nutrition per 100 g as eaten: calories (kcal), protein, carbohydrate, fat, fibre and sugar in grams, sodium in milligrams. Base the estimate on the closest common foods and preparation and name them in basis, in a few words (for example "fried wheat pasta snack, seasoned"). If the item is not a food or drink (a plate, a napkin, a hand), set food to false and every number to null.`;
const SCHEMA = { type: "object", additionalProperties: false, properties: { food: { type: "boolean" }, basis: { type: "string" }, calories: { type: ["number", "null"] }, protein_g: { type: ["number", "null"] }, carbs_g: { type: ["number", "null"] }, fat_g: { type: ["number", "null"] }, fibre_g: { type: ["number", "null"] }, sugar_g: { type: ["number", "null"] }, sodium_mg: { type: ["number", "null"] } }, required: ["food", "basis", "calories", "protein_g", "carbs_g", "fat_g", "fibre_g", "sugar_g", "sodium_mg"] };
type Estimate = { food: boolean; basis: string; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null; fibre_g: number | null; sugar_g: number | null; sodium_mg: number | null };
```
Replace:
```
const ESTIMATE_INSTRUCTIONS = `No USDA record matches this food. Estimate its typical nutrition per 100 g as eaten: calories (kcal), protein, carbohydrate, fat, fibre and sugar in grams, sodium in milligrams, and caffeine in milligrams (0 for a food or drink with none). Base the estimate on the closest common foods and preparation and name them in basis, in a few words (for example "fried wheat pasta snack, seasoned"). If the item is not a food or drink (a plate, a napkin, a hand), set food to false and every number to null.`;
const SCHEMA = { type: "object", additionalProperties: false, properties: { food: { type: "boolean" }, basis: { type: "string" }, calories: { type: ["number", "null"] }, protein_g: { type: ["number", "null"] }, carbs_g: { type: ["number", "null"] }, fat_g: { type: ["number", "null"] }, fibre_g: { type: ["number", "null"] }, sugar_g: { type: ["number", "null"] }, sodium_mg: { type: ["number", "null"] }, caffeine_mg: { type: ["number", "null"] } }, required: ["food", "basis", "calories", "protein_g", "carbs_g", "fat_g", "fibre_g", "sugar_g", "sodium_mg", "caffeine_mg"] };
type Estimate = { food: boolean; basis: string; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null; fibre_g: number | null; sugar_g: number | null; sodium_mg: number | null; caffeine_mg?: number | null };
```

Find:
```
    return {
      fdcId: 0, description: `Model estimate: ${basis}`, dataType: "Estimate",
      foodNutrients: [...nutrient(1008, "Energy", "KCAL", parsed.calories), ...nutrient(1003, "Protein", "G", parsed.protein_g), ...nutrient(1005, "Carbohydrate, by difference", "G", parsed.carbs_g), ...nutrient(1004, "Total lipid (fat)", "G", parsed.fat_g), ...nutrient(1079, "Fiber, total dietary", "G", parsed.fibre_g), ...nutrient(2000, "Sugars, total including NLEA", "G", parsed.sugar_g), ...nutrient(1093, "Sodium, Na", "MG", parsed.sodium_mg)],
```
Replace:
```
    // #987: caffeine is extra to the seven values. A missing, zero or implausible figure (above 400 mg
    // per 100 g) stores no caffeine and never fails the estimate.
    const caffeine = typeof parsed.caffeine_mg === "number" && parsed.caffeine_mg > 0 && parsed.caffeine_mg <= 400 ? parsed.caffeine_mg : null;
    return {
      fdcId: 0, description: `Model estimate: ${basis}`, dataType: "Estimate",
      foodNutrients: [...nutrient(1008, "Energy", "KCAL", parsed.calories), ...nutrient(1003, "Protein", "G", parsed.protein_g), ...nutrient(1005, "Carbohydrate, by difference", "G", parsed.carbs_g), ...nutrient(1004, "Total lipid (fat)", "G", parsed.fat_g), ...nutrient(1079, "Fiber, total dietary", "G", parsed.fibre_g), ...nutrient(2000, "Sugars, total including NLEA", "G", parsed.sugar_g), ...nutrient(1093, "Sodium, Na", "MG", parsed.sodium_mg), ...nutrient(1057, "Caffeine", "MG", caffeine)],
```

File `src/lib/intake/alcohol.ts`.

Find:
```
const ALCOHOLIC_NAME = /\b(tiki|mojito|margarita|daiquiri|sangria|rum punch|alcoholic punch|spiked punch)\b|(?<!\b(?:fruit|shrimp|prawn) )\bcocktail\b(?! sauce)/i;
```
Replace:
```
export const ALCOHOLIC_NAME = /\b(tiki|mojito|margarita|daiquiri|sangria|rum punch|alcoholic punch|spiked punch)\b|(?<!\b(?:fruit|shrimp|prawn|seafood|crab|lobster) )\bcocktail\b(?! sauce)/i;
```

File `src/lib/intake/drinks-from-items.ts`.

Find:
```
import {alcoholGrams,isAlcoholic,keepsCaffeine} from './alcohol';
```
Replace:
```
import {ALCOHOLIC_NAME,alcoholGrams,isAlcoholic,keepsCaffeine} from './alcohol';
```

Find:
```
}
export function isDrinkItem(item: Pick<DrinkItem, 'name' | 'food_category'>): boolean {
```
Replace:
```
}
// #988: with no category, the name decides, by one rule over the two existing lists. The drink is the
// part before "with", "in", "on", a comma or a bracket, and that part must be or end with a plain drink
// ("iced black coffee", "a can of Coca-Cola") or an alcoholic drink name ("rum cocktail"). A food that
// only mentions a drink ("coffee cake", "tea-smoked duck", "chicken braised in cola") stays a food.
const ALCOHOLIC_DRINK_ENDING = new RegExp(`(?:${ALCOHOLIC_NAME.source})$`, 'i');
function plainDrinkName(name: string): boolean {
  const words = name.trim().toLowerCase().replace(/\s+/g, ' ').split(/[,(]| (?:with|in|on) /)[0].trim().split(' ');
  return ALCOHOLIC_DRINK_ENDING.test(words.join(' ')) || words.some((_, start) => PLAIN_DRINKS.has(words.slice(start).join(' ')));
}
export function isDrinkItem(item: Pick<DrinkItem, 'name' | 'food_category'>): boolean {
```

Find:
```
    : PLAIN_DRINKS.has(item.name.trim().toLowerCase());
```
Replace:
```
    : plainDrinkName(item.name);
```

New files, given whole in section 6: `tests/estimate-caffeine.test.mjs`, `tests/drink-names.test.mjs`.

**Tests:** `tests/estimate-caffeine.test.mjs`, `tests/drink-names.test.mjs`, and every existing `tests/food-estimate*.test.mjs`, `tests/*drink*.test.mjs` and `tests/*alcohol*.test.mjs`.

**Done when:** those files pass.

### PR 5 — branch `fix26/meal-page` — #968, #973, #120

**Service:** the meal page (`src/components/OutlineOverlay.tsx`, `PostDetail.tsx`) and the page refresh (`src/components/PostReadinessListener.tsx`).
**What changes:** returning to the meal's tab checks at once and restarts the poll's backoff, as `Thread.tsx` does (#968). The photo area of a failed meal shows `failureMessage(fail_reason)`, the sentence the card shows (#973). On Home, the minute refresh and the return-to-tab refresh happen only while a meal is waiting or when the local day has changed; the other tabs keep both (#120). What can go stale: an update to an older finished meal from another device reaches Home through its own realtime reader, not through this refresh.

File `src/components/OutlineOverlay.tsx`.

Find:
```
import { formatGrams } from "@/lib/nutrition/totals";
import { tokens } from "@/lib/theme/tokens";
```
Replace:
```
import { formatGrams } from "@/lib/nutrition/totals";
import { failureMessage } from "@/lib/worker/failure-message";
import { tokens } from "@/lib/theme/tokens";
```

Find:
```
export default function OutlineOverlay({ desktopModal=false, desktopHeader, desktopThread, slides=[], initialized, readOnly = false, postId, caption, eatenAt, status, photo, items, modelCommentId=null, fingerprint=null, saved=false, handle:providedHandle, cardData, initialDrink, children }: {
  desktopModal?:boolean; desktopHeader?:ReactNode; desktopThread?:ReactNode; slides?:import('@/lib/posts/items').DetailSlide[];
  cardData?: CardData; initialDrink?: DrinkCardData|null;
```
Replace:
```
export default function OutlineOverlay({ desktopModal=false, desktopHeader, desktopThread, slides=[], initialized, readOnly = false, postId, caption, eatenAt, status, photo, items, modelCommentId=null, fingerprint=null, saved=false, handle:providedHandle, cardData, initialDrink, failReason=null, children }: {
  desktopModal?:boolean; desktopHeader?:ReactNode; desktopThread?:ReactNode; slides?:import('@/lib/posts/items').DetailSlide[];
  cardData?: CardData; initialDrink?: DrinkCardData|null; failReason?: string|null;
```

Find:
```
    if (poll) timer = setTimeout(tick, delay);
    return () => { live = false; if (timer) clearTimeout(timer); void supabase.removeChannel(channel); };
```
Replace:
```
    // Returning to the tab checks at once and starts the backoff again.
    const visible = () => {
      if (document.visibilityState !== "visible") return;
      if (timer) clearTimeout(timer);
      delay = 2000;
      void refresh();
      timer = setTimeout(tick, delay);
    };
    if (poll) { timer = setTimeout(tick, delay); document.addEventListener("visibilitychange", visible); }
    return () => { live = false; if (timer) clearTimeout(timer); document.removeEventListener("visibilitychange", visible); void supabase.removeChannel(channel); };
```

Find:
```
      </> : showNutrition ? <ResultsCard data={displayCard} size={width} time={localTime} gutter={visibleSlides.length>1?ARROW_GUTTER:0} /> : <div role="status" className="flex h-full items-center justify-center px-screen-x text-body text-muted">{status === "failed" ? "This meal could not be analysed." : status === "needs_input" ? "A quick question about your meal" : "Processing, traffic low"}</div>}
```
Replace:
```
      </> : showNutrition ? <ResultsCard data={displayCard} size={width} time={localTime} gutter={visibleSlides.length>1?ARROW_GUTTER:0} /> : <div role="status" className="flex h-full items-center justify-center px-screen-x text-body text-muted">{status === "failed" ? failureMessage(failReason) : status === "needs_input" ? "A quick question about your meal" : "Processing, traffic low"}</div>}
```

File `src/components/PostDetail.tsx`.

Find:
```
  <OutlineOverlay desktopModal={desktopModal} desktopHeader={header} desktopThread={thread} slides={detail.slides} key={id} initialized={detail.post.analysis_initialized_at!=null} readOnly={detail.isDrink} postId={id} caption={detail.post.caption} eatenAt={detail.post.eaten_at} status={detail.post.status} photo={detail.photo} items={detail.items} cardData={detail.cardData} initialDrink={detail.drink} modelCommentId={card?.modelCommentId??null} fingerprint={card?.analysisFingerprint??null} saved={Boolean(row?.saved_meal_id)}>
```
Replace:
```
  <OutlineOverlay desktopModal={desktopModal} desktopHeader={header} desktopThread={thread} slides={detail.slides} key={id} initialized={detail.post.analysis_initialized_at!=null} readOnly={detail.isDrink} postId={id} caption={detail.post.caption} eatenAt={detail.post.eaten_at} status={detail.post.status} photo={detail.photo} items={detail.items} cardData={detail.cardData} initialDrink={detail.drink} failReason={detail.post.fail_reason??null} modelCommentId={card?.modelCommentId??null} fingerprint={card?.analysisFingerprint??null} saved={Boolean(row?.saved_meal_id)}>
```

File `src/components/PostReadinessListener.tsx`.

Find:
```
    // A visible page re-renders once a minute: this covers an update to an older meal that
    // `discover` cannot see and carries "today" across local midnight (the server derives it).
    const reconcileTimer = setInterval(() => { if (document.visibilityState === "visible" && live) refreshView(); }, 60_000);
    const visible = () => { if (document.visibilityState === "visible" && live) refreshView(); };
```
Replace:
```
    // Once a minute and on a return to the tab. Home's feed keeps its own meals current, so Home
    // re-renders here only while a meal is waiting or when the local day has changed (the server
    // derives "today"). Other tabs have no reader of their own and still re-render every time.
    let day = new Date().toDateString();
    const visible = () => {
      if (document.visibilityState !== "visible" || !live) return;
      const today = new Date().toDateString();
      const newDay = today !== day;
      day = today;
      if (newDay || pending.size > 0 || refreshAfterReadinessSeed(location.pathname,Boolean(document.querySelector("[data-home-feed]")))) refreshView();
    };
    const reconcileTimer = setInterval(visible, 60_000);
```

File `tests/readiness-refresh.test.mjs`.

Find:
```
  const events=new EventTarget(),document=Object.assign(new EventTarget(),{visibilityState:'visible',querySelector:selector=>selector==='[data-shell]'?(shell?{}:null):home?{}:null}),exports={};let effect,refreshes=0,pendingRows=[],subscribed,revalidations=0;const timers=new Map();events.addEventListener('feed-revalidate',()=>revalidations++);
```
Replace:
```
  const events=new EventTarget(),document=Object.assign(new EventTarget(),{visibilityState:'visible',querySelector:selector=>selector==='[data-shell]'?(shell?{}:null):home?{}:null}),exports={};let effect,refreshes=0,pendingRows=[],subscribed,revalidations=0,day=null;const FakeDate=class extends Date{toDateString(){return day??super.toDateString();}};const timers=new Map();events.addEventListener('feed-revalidate',()=>revalidations++);
```

Find:
```
  vm.default.runInNewContext(code,{exports,Map,Date,Promise,Event,CustomEvent,window:events,document,location:{pathname:home?'/':'/days'},setInterval:(run,ms)=>{timers.set(ms,run);return ms;},clearInterval(){},require(name){
```
Replace:
```
  vm.default.runInNewContext(code,{exports,Map,Date:FakeDate,Promise,Event,CustomEvent,window:events,document,location:{pathname:home?'/':'/days'},setInterval:(run,ms)=>{timers.set(ms,run);return ms;},clearInterval(){},require(name){
```

Find:
```
  return{events,refreshes:()=>refreshes,revalidations:()=>revalidations,visible:()=>document.dispatchEvent(new Event('visibilitychange')),minute:()=>timers.get(60000)(),setPending:rows=>{pendingRows=rows;},reconnect:async()=>{subscribed('SUBSCRIBED');await tick();},cleanup,tick};
```
Replace:
```
  return{events,refreshes:()=>refreshes,revalidations:()=>revalidations,visible:()=>document.dispatchEvent(new Event('visibilitychange')),minute:()=>timers.get(60000)(),setDay:value=>{day=value;},setPending:rows=>{pendingRows=rows;},reconnect:async()=>{subscribed('SUBSCRIBED');await tick();},cleanup,tick};
```

Find:
```
 shell.visible();shell.minute();assert.equal(shell.revalidations(),2);assert.equal(shell.refreshes(),0);
 shell.setPending([{id:'pending-shell-meal'}]);await shell.reconnect();shell.events.dispatchEvent(new CustomEvent('post-ready',{detail:{id:'pending-shell-meal'}}));
 assert.equal(shell.revalidations(),3);assert.equal(shell.refreshes(),0,'the active shell updates its API reader rather than replacing the page');shell.cleanup();
```
Replace:
```
 shell.visible();shell.minute();assert.equal(shell.revalidations(),0,'Home with only finished meals makes no minute or return-to-tab refresh');assert.equal(shell.refreshes(),0);
 shell.setPending([{id:'pending-shell-meal'}]);await shell.reconnect();
 shell.visible();shell.minute();assert.equal(shell.revalidations(),2,'a waiting meal keeps both refreshes');shell.events.dispatchEvent(new CustomEvent('post-ready',{detail:{id:'pending-shell-meal'}}));
 assert.equal(shell.revalidations(),3);assert.equal(shell.refreshes(),0,'the active shell updates its API reader rather than replacing the page');
 shell.visible();shell.minute();assert.equal(shell.revalidations(),3,'once the meal is finished the refreshes stop again');
 shell.setDay('Tue Jan 02 2024');shell.minute();assert.equal(shell.revalidations(),4,'a new local day refreshes Home once');shell.minute();assert.equal(shell.revalidations(),4);shell.cleanup();
```

**Tests:** `tests/readiness-refresh.test.mjs` and every test that names `OutlineOverlay` or `PostReadinessListener` (`grep -l` in `tests/`).

**Done when:** those files pass.

### PR 6 — branch `fix26/added-photo` — #969, #970

**Service:** the added-photo path (`src/lib/media/pack-photo-upload.ts`, `src/lib/posts/upload-manager.ts`, `create.ts`, `attach-photo.ts`, the media route) and the upload chip.
**What changes:** every request on the path has a time limit: 20 s for each JSON request and the byte check, 120 s for each photo PUT (the 120 s the new-meal upload already allows). A request that never answers fails and goes through the existing three-attempt rule to the failed chip. The chip's title counts only uploads that have not failed (#969). Five refusals each get a stable code from the server and their own sentence, chosen by AGY (#970); the expiry retry keeps its code `attachment_stage_expired` and its sentence:

| Refusal (raised by 0028) | Code | Sentence |
|---|---|---|
| Wait for this meal to be ready | `attachment_meal_not_ready` | This meal is still being analysed, so try again a little later. |
| Drink amounts were recorded when posted | `attachment_meal_has_drink` | Photos cannot be added to meals with drinks, so log this as a new meal instead. |
| A meal has at most eight photos | `attachment_photo_limit` | This meal already has eight photos, so remove one before trying again. |
| Photo upload incomplete | `attachment_upload_incomplete` | The photo did not finish reaching the app, so try again to send it. |
| Post not found | `attachment_meal_missing` | This meal was deleted, so remove this photo or log it as a new meal. |

File `src/lib/media/pack-photo-upload.ts`.

Find:
```
import type { SignedUpload } from "./storage";

```
Replace:
```
import type { SignedUpload } from "./storage";

// A request that never answers must fail, so the three-attempt rule can end as the failed chip.
// The photo limit equals the 120 s the new-meal upload already allows (put-with-progress.ts).
export const JSON_REQUEST_LIMIT_MS = 20_000;
export const PHOTO_PUT_LIMIT_MS = 120_000;

```

Find:
```
    const { data, error } = await createClient().storage.from("media").download(path);
```
Replace:
```
    const { data, error } = await createClient().storage.from("media").download(path, {}, { signal: AbortSignal.timeout(JSON_REQUEST_LIMIT_MS) });
```

Find:
```
      const response = await this.request("/api/media/sign-upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staged: true }) });
```
Replace:
```
      const response = await this.request("/api/media/sign-upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staged: true }), signal: AbortSignal.timeout(JSON_REQUEST_LIMIT_MS) });
```

Find:
```
      try { confirmed = (await this.request(url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob })).ok; }
```
Replace:
```
      try { confirmed = (await this.request(url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob, signal: AbortSignal.timeout(PHOTO_PUT_LIMIT_MS) })).ok; }
```

File `src/lib/posts/upload-manager.ts`.

Find:
```
import { PackPhotoUpload } from '@/lib/media/pack-photo-upload';
```
Replace:
```
import { PackPhotoUpload, JSON_REQUEST_LIMIT_MS } from '@/lib/media/pack-photo-upload';
```

Find:
```
        const response=await this.foodRequest(`/api/posts/${attachment.postId}/media`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({photo:d.attachmentPhoto,not_eaten:attachment.notEaten})});
```
Replace:
```
        const response=await this.foodRequest(`/api/posts/${attachment.postId}/media`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({photo:d.attachmentPhoto,not_eaten:attachment.notEaten}),signal:AbortSignal.timeout(JSON_REQUEST_LIMIT_MS)});
```

File `src/lib/posts/create.ts`.

Find:
```
import { uploadedMatches } from "@/lib/media/pack-photo-upload";
```
Replace:
```
import { uploadedMatches, JSON_REQUEST_LIMIT_MS, PHOTO_PUT_LIMIT_MS } from "@/lib/media/pack-photo-upload";
```

Find:
```
    const create = await this.request("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation_id: pending.id, capture_intent: intent, ...options, caption, location, eaten_at: eatenAt ?? new Date().toISOString(), shots: images.map((image, position) => ({ position, width: image.width, height: image.height, phash: image.phash })) }) });
```
Replace:
```
    const create = await this.request("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation_id: pending.id, capture_intent: intent, ...options, caption, location, eaten_at: eatenAt ?? new Date().toISOString(), shots: images.map((image, position) => ({ position, width: image.width, height: image.height, phash: image.phash })) }), signal: AbortSignal.timeout(JSON_REQUEST_LIMIT_MS) });
```

Find:
```
            else confirmed = (await this.request(url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob })).ok;
```
Replace:
```
            else confirmed = (await this.request(url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob, signal: AbortSignal.timeout(PHOTO_PUT_LIMIT_MS) })).ok;
```

Find:
```
    const complete = await this.request("/api/posts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: pending.id }) });
```
Replace:
```
    const complete = await this.request("/api/posts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: pending.id }), signal: AbortSignal.timeout(JSON_REQUEST_LIMIT_MS) });
```

File `src/lib/posts/attach-photo.ts`.

Find:
```
function stageError(error:{code?:string;message?:string},status?:number):Error {
 return error.code==='22023'&&error.message==='Photo stage expired'
  ?new AttachmentStageExpired():ioError('The photo could not be attached.',error,status);
```
Replace:
```
/** One stable code and one sentence per refusal the attachment functions raise
 * (supabase/migrations/0028_multiple_leftovers.sql), keyed by the raised text. */
export const ATTACH_REFUSALS=new Map<string,{code:string;message:string}>([
 ['Wait for this meal to be ready',{code:'attachment_meal_not_ready',message:'This meal is still being analysed, so try again a little later.'}],
 ['Drink amounts were recorded when posted',{code:'attachment_meal_has_drink',message:'Photos cannot be added to meals with drinks, so log this as a new meal instead.'}],
 ['A meal has at most eight photos',{code:'attachment_photo_limit',message:'This meal already has eight photos, so remove one before trying again.'}],
 ['Photo upload incomplete',{code:'attachment_upload_incomplete',message:'The photo did not finish reaching the app, so try again to send it.'}],
 ['Post not found',{code:'attachment_meal_missing',message:'This meal was deleted, so remove this photo or log it as a new meal.'}],
]);
function stageError(error:{code?:string;message?:string},status?:number):Error {
 if(error.code==='22023'&&error.message==='Photo stage expired')return new AttachmentStageExpired();
 const refusal=ATTACH_REFUSALS.get(error.message??'');
 return refusal?Object.assign(ioError(refusal.message,error,status),{refusal:refusal.code}):ioError('The photo could not be attached.',error,status);
```

File `src/app/api/posts/[id]/media/route.ts`.

Find:
```
  return NextResponse.json({error:error instanceof Error?error.message:'The photo could not be attached.'},{status:code==='42501'?404:code==='55000'||code==='40001'?409:code?.startsWith('22')?400:503});
```
Replace:
```
  const refusal=(error as {refusal?:string})?.refusal;
  return NextResponse.json({error:error instanceof Error?error.message:'The photo could not be attached.',...(refusal?{code:refusal}:{})},{status:code==='42501'?404:code==='55000'||code==='40001'?409:code?.startsWith('22')?400:503});
```

File `src/components/UploadChip.tsx`.

Find:
```
 const view=()=>{if(upload.attachment){router.push(`/posts/${upload.attachment.postId}`);return;}router.push('/');setTimeout(()=>document.querySelector(`[data-upload-id="${upload.operationId}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),300);};
 const chip=<aside aria-label="Pending posts" className={`overflow-hidden rounded-card bg-surface shadow-pill ${inSidebar?'relative mx-3':'fixed inset-x-6 z-40 mx-auto max-w-[342px]'}`} style={{boxShadow:'var(--color-shadow-pill)',...(!inSidebar?{bottom:'calc(96px + env(safe-area-inset-bottom))'}:{})}}><div className="flex min-h-14 items-center gap-3 px-3 py-2">{upload.previewUrl&&<img src={upload.previewUrl} alt="" className="size-10 rounded-thumb object-cover"/>}<div className="min-w-0 flex-1"><p className="truncate text-body font-semibold">{uploads.length>1?`Uploading ${uploads.length} posts…`:upload.caption||'New post'}</p>{failed?(upload.photoLost?<><button className="text-detail text-accent" onClick={()=>{void (async()=>{if(!upload.attachment)return;window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',forPost:upload.attachment.postId,notEaten:upload.attachment.notEaten}}));try{await uploadManager.remove(upload.operationId);}catch{/* camera is open; durable cleanup can finish later */}})();}}>{upload.message??'This photo was not kept. Take it again.'}</button><button className="ml-3 text-detail text-muted" onClick={()=>{void uploadManager.remove(upload.operationId).catch(()=>{});}}>Remove</button></>:<><button className="text-detail text-accent" onClick={()=>uploadManager.retry(failed.operationId)}>{failed.kind==='copy'?'Not confirmed · Try again':'Not saved · Try again'}</button>{failed.attachment?<button className="ml-3 text-detail text-muted" onClick={()=>{void uploadManager.remove(failed.operationId).catch(()=>{});}}>Remove</button>:null}</>):<p className="text-detail text-muted">{upload.kind?(upload.removing?'Removing pending post…':upload.kind==='copy'?'Saving copy…':upload.kind==='drink'?'Saving drink…':'Saving food…'):(upload.text?'Posting caption…':upload.attachment?(upload.attachment.notEaten?'Adding leftovers photo…':'Adding photo…'):'Uploading photo…')}</p>}</div><button className="min-h-tap px-2 text-body font-semibold" onClick={view}>View</button></div><UploadBar upload={upload}/></aside>;
```
Replace:
```
 const active=uploads.filter(upload=>upload.state!=='failed').length;
 const view=()=>{if(upload.attachment){router.push(`/posts/${upload.attachment.postId}`);return;}router.push('/');setTimeout(()=>document.querySelector(`[data-upload-id="${upload.operationId}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),300);};
 const chip=<aside aria-label="Pending posts" className={`overflow-hidden rounded-card bg-surface shadow-pill ${inSidebar?'relative mx-3':'fixed inset-x-6 z-40 mx-auto max-w-[342px]'}`} style={{boxShadow:'var(--color-shadow-pill)',...(!inSidebar?{bottom:'calc(96px + env(safe-area-inset-bottom))'}:{})}}><div className="flex min-h-14 items-center gap-3 px-3 py-2">{upload.previewUrl&&<img src={upload.previewUrl} alt="" className="size-10 rounded-thumb object-cover"/>}<div className="min-w-0 flex-1"><p className="truncate text-body font-semibold">{active>1?`Uploading ${active} posts…`:upload.caption||'New post'}</p>{failed?(upload.photoLost?<><button className="text-detail text-accent" onClick={()=>{void (async()=>{if(!upload.attachment)return;window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',forPost:upload.attachment.postId,notEaten:upload.attachment.notEaten}}));try{await uploadManager.remove(upload.operationId);}catch{/* camera is open; durable cleanup can finish later */}})();}}>{upload.message??'This photo was not kept. Take it again.'}</button><button className="ml-3 text-detail text-muted" onClick={()=>{void uploadManager.remove(upload.operationId).catch(()=>{});}}>Remove</button></>:<><button className="text-detail text-accent" onClick={()=>uploadManager.retry(failed.operationId)}>{failed.kind==='copy'?'Not confirmed · Try again':'Not saved · Try again'}</button>{failed.attachment&&failed.message?<p role="alert" className="text-detail text-muted">{failed.message}</p>:null}{failed.attachment?<button className="ml-3 text-detail text-muted" onClick={()=>{void uploadManager.remove(failed.operationId).catch(()=>{});}}>Remove</button>:null}</>):<p className="text-detail text-muted">{upload.kind?(upload.removing?'Removing pending post…':upload.kind==='copy'?'Saving copy…':upload.kind==='drink'?'Saving drink…':'Saving food…'):(upload.text?'Posting caption…':upload.attachment?(upload.attachment.notEaten?'Adding leftovers photo…':'Adding photo…'):'Uploading photo…')}</p>}</div><button className="min-h-tap px-2 text-body font-semibold" onClick={view}>View</button></div><UploadBar upload={upload}/></aside>;
```

File `tests/attachment-stage-expiry.test.mjs`.

Find:
```
import {attachPostPhoto,AttachmentStageExpired} from '../src/lib/posts/attach-photo.ts';
```
Replace:
```
import {attachPostPhoto,AttachmentStageExpired,ATTACH_REFUSALS} from '../src/lib/posts/attach-photo.ts';
```

Find:
```
 const {db,calls}=harness({lease:{status:'queued',run_after:'2999-01-01T00:00:00Z'}});await assert.rejects(()=>attachPostPhoto(db,'post','owner',photo,true),AttachmentStageExpired);assert.equal(calls.filter(c=>c==='copy').length,2);
});
```
Replace:
```
 const {db,calls}=harness({lease:{status:'queued',run_after:'2999-01-01T00:00:00Z'}});await assert.rejects(()=>attachPostPhoto(db,'post','owner',photo,true),AttachmentStageExpired);assert.equal(calls.filter(c=>c==='copy').length,2);
});
test('each database refusal keeps its own stable code, sentence and status source',async()=>{
 const raised=[['Wait for this meal to be ready','55000','attachment_meal_not_ready'],['Drink amounts were recorded when posted','55000','attachment_meal_has_drink'],['A meal has at most eight photos','22023','attachment_photo_limit'],['Photo upload incomplete','22023','attachment_upload_incomplete'],['Post not found','42501','attachment_meal_missing']];
 assert.equal(ATTACH_REFUSALS.size,raised.length);assert.equal(new Set([...ATTACH_REFUSALS.values()].map(r=>r.message)).size,raised.length);
 for(const [message,sqlstate,code]of raised){
  const {db}=harness({prepareError:{code:sqlstate,message}});
  await assert.rejects(()=>attachPostPhoto(db,'post','owner',photo,true),error=>error.refusal===code&&error.message===ATTACH_REFUSALS.get(message).message&&error.message!=='The photo could not be attached.'&&error.cause.code===sqlstate&&!(error instanceof AttachmentStageExpired));
  const late=harness({lease:{status:'queued',run_after:'2999-01-01T00:00:00Z'},complete:{data:null,error:{code:sqlstate,message},status:400}});
  await assert.rejects(()=>attachPostPhoto(late.db,'post','owner',photo,true),error=>error.refusal===code);
 }
});
test('an unlisted database refusal keeps the general sentence and no code',async()=>{
 const {db}=harness({prepareError:{code:'22023',message:'Photo already claimed'}});
 await assert.rejects(()=>attachPostPhoto(db,'post','owner',photo,true),error=>error.refusal===undefined&&error.message==='The photo could not be attached.');
});
```

File `tests/upload-guard.test.mjs`.

Find:
```
 assert.deepEqual(attempts,[old.path]);assert.equal(calls.filter(c=>c.endsWith('/api/media/sign-upload')).length,0);
});
```
Replace:
```
 assert.deepEqual(attempts,[old.path]);assert.equal(calls.filter(c=>c.endsWith('/api/media/sign-upload')).length,0);
});
test('an added-photo request that never answers is limited, tried three times and ends as the failed chip',async()=>{
 const signals=[];
 const {manager,rows,calls}=attachHarness(init=>{signals.push(init.signal);throw new DOMException('The operation timed out.','TimeoutError');});
 await manager.initialize('owner');const id=await manager.postAttachment(file,{postId:'post-1',notEaten:false});
 await until(()=>manager.list()[0]?.state==='failed');
 assert.equal(signals.length,3);assert.ok(signals.every(signal=>signal instanceof AbortSignal));
 assert.equal(calls.filter(c=>c.endsWith('/media')).length,3);assert.equal(calls.filter(c=>c==='/api/media/sign-upload').length,1);
 assert.equal(manager.list()[0].postId,undefined);assert.equal(rows.get(id).files[0].size,file.size);
});
```

**Tests:** `tests/attachment-stage-expiry.test.mjs`, `tests/upload-guard.test.mjs`, and every test that names `pack-photo-upload`, `upload-manager` or `attach-photo`.

**Done when:** those files pass.

### PR 7 — branch `fix26/capture-sheet` — #972

**Service:** `src/components/NavigationControls.tsx` and the service worker `public/sw.js`.
**What changes:** the capture sheet is imported on demand: 1.5 s after the page is up, or at once on the first tap; a failed fetch closes the entry so the next tap tries again. At install, the service worker also caches the files that the shell's scripts fetch on demand, one level deep, at most 16, under the same public-and-immutable rule, so the sheet still opens offline.

File `src/components/NavigationControls.tsx`.

Find:
```
import CaptureSheet from '@/components/CaptureSheet';
import IntakeBar from '@/components/IntakeBar';

```
Replace:
```
import type CaptureSheetComponent from '@/components/CaptureSheet';
import IntakeBar from '@/components/IntakeBar';

// Fetched after the page is up, not with it. public/sw.js keeps the file for offline opens.
const loadCaptureSheet=()=>import('@/components/CaptureSheet').then(module=>module.default);
```

Find:
```
  const closeEntry=useCallback(()=>{setEntry(null);setAttachment(null);setInitialFiles(undefined);},[]);
  const closeCapture=useCallback(()=>{window.dispatchEvent(new Event('entry-closed'));closeEntry();router.push('/');},[closeEntry,router]);
```
Replace:
```
  const closeEntry=useCallback(()=>{setEntry(null);setAttachment(null);setInitialFiles(undefined);},[]);
  const [CaptureSheet,setCaptureSheet]=useState<typeof CaptureSheetComponent|null>(null);
  const capture=entry==='camera'||entry==='text';
  useEffect(()=>{
    if(CaptureSheet)return;
    let live=true;
    // A failed fetch closes the entry, so the next tap tries again instead of breaking the page.
    const load=()=>{void loadCaptureSheet().then(component=>{if(live)setCaptureSheet(()=>component);},()=>{if(live&&capture)closeEntry();});};
    if(capture){load();return()=>{live=false;};}
    const timer=window.setTimeout(load,1500);
    return()=>{live=false;window.clearTimeout(timer);};
  },[CaptureSheet,capture,closeEntry]);
  const closeCapture=useCallback(()=>{window.dispatchEvent(new Event('entry-closed'));closeEntry();router.push('/');},[closeEntry,router]);
```

Find:
```
    {entry==='camera'||entry==='text'?<CaptureSheet initialFiles={initialFiles} key={`${entry}:${attachment?.postId??"new"}:${attachment?.notEaten??false}`} forPost={attachment?.postId} attachNotEaten={attachment?.notEaten} initialMode={entry==='camera'?'photo':'text'} onClose={closeCapture}/>:null}
```
Replace:
```
    {capture&&CaptureSheet?<CaptureSheet initialFiles={initialFiles} key={`${entry}:${attachment?.postId??"new"}:${attachment?.notEaten??false}`} forPost={attachment?.postId} attachNotEaten={attachment?.notEaten} initialMode={entry==='camera'?'photo':'text'} onClose={closeCapture}/>:null}
```

File `public/sw.js`.

Find:
```
    await Promise.allSettled(shellAssets(shell).map(async url => {
      const response = await fetch(new Request(url, {credentials: "omit", cache: "force-cache"}));
      const policy = response.headers.get("cache-control") ?? "";
      if (response.ok && /\bpublic\b/i.test(policy) && /\bimmutable\b/i.test(policy) && !/\bprivate\b|no-store/i.test(policy)) await putDecoded(cache, url, response);
    }));
    // Retain only the shell and immutable files named by this deployment.
    const keep = new Set(["/", "/shell", "/manifest.webmanifest"].map(path => new URL(path, self.location.origin).href).concat(shellAssets(shell)));
```
Replace:
```
    const named = shellAssets(shell), onDemand = new Set();
    const store = async (url, scan) => {
      const response = await fetch(new Request(url, {credentials: "omit", cache: "force-cache"}));
      const policy = response.headers.get("cache-control") ?? "";
      if (!response.ok || !/\bpublic\b/i.test(policy) || !/\bimmutable\b/i.test(policy) || /\bprivate\b|no-store/i.test(policy)) return;
      // A shell script names the files it fetches on demand (the capture sheet)
      // as "static/chunks/…", the same form a Flight reference has.
      if (scan && new URL(url).pathname.endsWith(".js")) for (const next of shellAssets(await response.clone().text())) if (!named.includes(next) && onDemand.size < 16) onDemand.add(next);
      await putDecoded(cache, url, response);
    };
    await Promise.allSettled(named.map(url => store(url, true)));
    await Promise.allSettled([...onDemand].map(url => store(url, false)));
    // Retain only the shell and immutable files named by this deployment.
    const keep = new Set(["/", "/shell", "/manifest.webmanifest"].map(path => new URL(path, self.location.origin).href).concat(named, [...onDemand]));
```

File `tests/sw-media-cache.test.mjs`.

Find:
```
 await restarted.event('activate');assert.deepEqual(navigated,[]);
});
```
Replace:
```
 await restarted.event('activate');assert.deepEqual(navigated,[]);
});
test('install keeps the files a shell script fetches on demand, one level deep, under the same public rule',async()=>{
 const w=worker(),requests=[];
 w.setFetch(async request=>{
  requests.push(request);
  const path=new URL(request.url).pathname;
  if(path==='/shell')return new Response('<script src="/_next/static/chunks/shell.js"></script>');
  const body=path.endsWith('/shell.js')?'t.v(s=>Promise.all(["static/chunks/sheet.js","static/chunks/private.js"].map(s=>t.l(s))))':path.endsWith('/sheet.js')?'import("static/chunks/deeper.js")':path;
  return new Response(body,{headers:path.endsWith('/private.js')?{'Cache-Control':'private, immutable'}:{'Cache-Control':'public, max-age=31536000, immutable'}});
 });
 await w.event('install');
 const store=w.stores.get('my-food-ai-shell-v4'),sheet='https://app.example/_next/static/chunks/sheet.js';
 assert.ok(requests.every(r=>r.credentials==='omit'));
 assert.ok(store.has('https://app.example/_next/static/chunks/shell.js'));assert.ok(store.has(sheet));
 assert.equal(store.has('https://app.example/_next/static/chunks/private.js'),false);
 assert.equal(requests.some(r=>new URL(r.url).pathname.endsWith('/deeper.js')),false);
 w.setFetch(async()=>{throw Error('offline');});
 assert.equal(await(await w.request(sheet)).text(),'import("static/chunks/deeper.js")');
});
```

**Tests:** `tests/sw-media-cache.test.mjs` and every test that names `NavigationControls`. **Look:** on PR 7's build at 390 wide, open Home, wait 5 s, read `caches.keys()` and whether the shell cache holds the chunk that contains the text "Your photo was kept; try again" (find its file name with `grep -l` under `.next/static/chunks`). Set the browser offline, reload, tap the plus button and then Photo: the capture sheet opens. Compare Home's first-load JavaScript bytes with main's, measured as Fleet 24's audit section 1 measured them.

**Done when:** the sheet opens offline after one online visit, and Home's first-load JavaScript is smaller than main's.

### PR 8 — branch `fix26/cleanup` — #971

**Service:** none; files that nothing imports.
**What changes:** `git rm` of the nine files below (76,435 bytes). The planner searched `src`, `scripts`, `tests`, `tools`, `eval`, `skills`, `supabase`, `config`, `package.json`, `next.config.ts`, `AGENTS.md`, `CLAUDE.md`, `docs/testing.md` and `docs/process.md` on main for each file's name; only old plans, reviews and reports name them. With the nine removed, `npx tsc --noEmit` reported nothing.

```
git rm src/components/NutritionImage.tsx src/components/SafeImage.tsx scripts/run14-control-table.mjs scripts/run14-navigation-counts.mjs scripts/run14-production-checks.mjs scripts/run15-page-checks.mjs scripts/run15-photo-checks.mjs scripts/run15-unavailable-stack.mjs scripts/run19-ten-photos.mjs
```

Kept, with the reason (write these on the PR):

| File | Why it stays |
|---|---|
| `src/lib/queue/enqueue.ts` | Imported by `src/app/api/posts/[id]/retry/route.ts` and `src/lib/posts/retry.ts`. |
| `scripts/run15-b-production.mjs` | `docs/plan-fleet21.md`'s browser section, which this plan's checks use, points to it. |
| `scripts/run17-checks.mjs` | Check K4 (#615) runs it, and open item #628 is about it. |
| `scripts/fleet14-metrics.mjs`, `scripts/egress-report.mjs` | `egress-report.mjs` imports `fleet14-metrics.mjs`; `docs/egress.md` documents it, and open item #375 needs it. |
| `docs/evidence` (38 MB, 597 files) | Open backlog items and past reports link to it (for example #523 names `docs/evidence/fix18/recompute-ids.json`). Removing it from the tree would not make the repository smaller, because Git history keeps it; that would need a history rewrite, which is out of scope. |

**Tests:** `npx tsc --noEmit`, `npx eslint`, the build, and the application suite (step 5 runs it on PR 1; run it here too).

**Done when:** the build and the suite pass with the nine files gone.


## 6. New files

### `tests/blocked-tick-retick.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as tick from '../src/lib/queue/tick.ts';

// Stand-in database: one due queued job, nothing running, and a lease another holder has.
function blockedAdmin(expiresAt){
  const calls=[];
  return {calls,
    from(table){
      if(table==='worker_lease')return {select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{expires_at:expiresAt},error:null})};
      assert.equal(table,'jobs');
      return {select(){return this;},lte(){return this;},eq(column,value){return Promise.resolve({count:value==='queued'?1:0,error:null});}};
    },
    async rpc(name){calls.push(name);assert.equal(name,'try_acquire_worker_lease');return {data:false,error:null};},
  };
}

test('a tick that finds due work behind another holder\'s lease looks again once that lease can have expired', async () => {
  const original=globalThis.setTimeout;const waits=[];let ticks=0;
  globalThis.setTimeout=(callback,delay)=>{waits.push(delay);callback();return 0;};
  try {
    const admin=blockedAdmin(new Date(Date.now()+40_000).toISOString());
    const status=await tick.queueTick(admin,'second-tick',60);
    assert.equal(status.queued,1);assert.equal(status.started,false,'the lease is held by someone else');
    assert.equal(typeof tick.retickWhenBlocked,'function','a blocked tick must have a way to look again');
    assert.equal(await tick.retickWhenBlocked(admin,status,async()=>{ticks++;},60),true);
    assert.equal(ticks,1,'the blocked tick ticks again');
    assert.equal(waits.length,1);
    assert.ok(waits[0]>39_000&&waits[0]<=41_000,`waits for the lease expiry plus one second, got ${waits[0]}`);
    // A lease far in the future (a fixture run) never makes the wait longer than one lease lifetime.
    waits.length=0;
    await tick.retickWhenBlocked(blockedAdmin(new Date(Date.now()+600_000).toISOString()),status,async()=>{ticks++;},60);
    assert.deepEqual(waits,[61_000]);assert.equal(ticks,2);
    // Nothing to look again for: this tick started the worker, or no due work waits.
    waits.length=0;
    assert.equal(await tick.retickWhenBlocked(admin,{queued:1,started:true},async()=>{ticks++;},60),false);
    assert.equal(await tick.retickWhenBlocked(admin,{queued:0,started:false},async()=>{ticks++;},60),false);
    assert.deepEqual(waits,[]);assert.equal(ticks,2);
  } finally {globalThis.setTimeout=original;}
});

test('only one second look is pending per server instance', async () => {
  const original=globalThis.setTimeout;const pending=[];let ticks=0;
  globalThis.setTimeout=(callback)=>{pending.push(callback);return 0;};
  try {
    const admin=blockedAdmin(new Date(Date.now()+40_000).toISOString());
    const first=tick.retickWhenBlocked(admin,{queued:1,started:false},async()=>{ticks++;},60);
    assert.equal(await tick.retickWhenBlocked(admin,{queued:1,started:false},async()=>{ticks++;},60),false,'a second blocked tick does not stack another wait');
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(pending.length,1);pending[0]();
    assert.equal(await first,true);assert.equal(ticks,1);
  } finally {globalThis.setTimeout=original;}
});

test('the tick route hands a blocked tick to the second look', () => {
  const route=readFileSync(new URL('../src/app/api/jobs/tick/route.ts',import.meta.url),'utf8');
  assert.match(route,/retickWhenBlocked\(admin, status,/);
});
```

### `tests/traffic-due.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getTraffic } from '../src/lib/queue/traffic.ts';

test('a queue holding only jobs that are not due yet shows low traffic', async () => {
  // Sixty queued jobs, every one due in three hours. A count of all queued jobs would say "high".
  const due=Date.now()+3*60*60*1000;
  const admin={from(table){assert.equal(table,'jobs');let before=Infinity;return {
    select(){return this;},
    lte(column,value){assert.equal(column,'run_after');before=Date.parse(value);return this;},
    eq(column,value){assert.equal(column,'status');assert.equal(value,'queued');return Promise.resolve({count:due<=before?60:0,error:null});},
  };}};
  assert.equal(await getTraffic(admin),'low');
});

test('the tick and the traffic label read the same due-only count', () => {
  const read=name=>readFileSync(new URL(`../src/lib/queue/${name}`,import.meta.url),'utf8');
  const rule=/\.lte\("run_after"/g;
  assert.equal(read('traffic.ts').match(rule)?.length,1,'the rule is written once, in traffic.ts');
  assert.equal(read('tick.ts').match(rule),null,'tick.ts has no copy of the rule');
  assert.match(read('tick.ts'),/countDueQueued\(admin\)/);
  assert.equal(read('traffic.ts').match(/countDueQueued\(admin\)/g)?.length,1,'the label uses the shared count');
});
```

### `scripts/numbers/reanalyse.mjs`

```
#!/usr/bin/env node
// Re-analyse or re-match a list of meals, one at a time, keeping every old row, and restore any of them.
// It runs the SQL files beside it (08, 09, 11, 12, 13) through psql and wakes the worker with /api/jobs/tick.
// Usage and rules: node scripts/numbers/reanalyse.mjs --help, and scripts/numbers/README.md.
import { spawnSync } from 'node:child_process';
import { appendFileSync, chmodSync, existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlFile = (name) => path.join(here, name);
export const MODE_FILES = { rematch: '11-rematch.sql', reanalyse: '12-reanalyse.sql' };
export const EXIT = { ok: 0, incomplete: 1, stopped: 3, usage: 4 };
export const WAIT_HARD_MAX_SECONDS = 600;
const POLL_SECONDS = 10, TICK_SECONDS = 60, FIRST_POLL_SECONDS = 2;
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export const HELP = `Re-analyse or re-match meals one at a time, keeping their old rows, and restore any of them.

  node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse
       (--meals=<prefix,prefix,...> | --meals-file=<path>) --ledger=<directory>
       [--max-meals=10] [--max-minutes=45] [--wait-seconds=300] [--dry-run]
  node scripts/numbers/reanalyse.mjs restore --meal=<prefix> --ledger=<directory> [--snapshot=last|first]
       [--wait-seconds=300]

Environment: SUPABASE_DB_URL (psql connection) and APP_URL (the app whose /api/jobs/tick wakes the worker).
psql must be on PATH. Nothing else is read.

run
  --mode=rematch      11-rematch.sql: same foods and portions, nutrition looked up again.
  --mode=reanalyse    12-reanalyse.sql: the photos are read again from the start.
  --meals             comma-separated 8-character meal id prefixes, worked in the order given.
  --meals-file        the same, one prefix per line; blank lines and lines starting with # are ignored.
  --ledger            a private directory OUTSIDE the repository. It receives snapshots.jsonl (the full
                      rows of each meal before it is touched: the only way back) and ledger.jsonl (one
                      line per meal, prefixes only). Made with mode 0700; the files with mode 0600.
  --max-meals         stop after this many meals (default 10).
  --max-minutes       stop when this much wall clock has passed since the command started (default 45).
  --wait-seconds      longest wait for one meal (default 300, never more than ${WAIT_HARD_MAX_SECONDS}).
  --dry-run           resolve the prefixes and print what would be done. Writes nothing, takes no snapshot.

  Every prefix must match exactly one meal that is not deleted, or nothing is started.
  A meal the SQL file's own guards refuse is recorded as skipped and the run goes on.
  The next meal starts only when the previous one is ready (or was skipped, or failed for good).
  The run stops, and says why, when: --max-meals is reached; --max-minutes is used up; two meals in a
  row failed or timed out; more than one in ten meals failed (after at least 10); or a meal is still
  being worked when its wait runs out.

restore
  Puts one meal back as its snapshot in <ledger>/snapshots.jsonl recorded it, with 13-restore.sql.
  --snapshot=last (default) uses the newest snapshot of that meal: it undoes the latest run.
  --snapshot=first uses the oldest: the meal as it was before the first run with this ledger.
  A meal left "failed" is first set back to "ready" with its analysis time from the snapshot.

Exit codes: 0 every meal changed, unchanged or skipped (restore: the meal is ready);
            1 finished, but a meal failed or timed out;
            3 a stop condition fired; 4 usage or guard error (nothing was started).`;

export class UsageError extends Error {}

function positiveInt(text, name, max) {
  if (!/^[1-9][0-9]*$/.test(String(text))) throw new UsageError(`${name} must be a whole number above zero.`);
  const n = Number(text);
  if (max && n > max) throw new UsageError(`${name} cannot be more than ${max}.`);
  return n;
}

export function parsePrefixes(text) {
  const list = String(text).split(/[\s,]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (!list.length) throw new UsageError('No meal prefixes were given.');
  for (const p of list) if (!/^[0-9a-f]{8}$/.test(p)) throw new UsageError(`"${p.slice(0, 20)}" is not an 8-character meal id prefix.`);
  const twice = list.find((p, i) => list.indexOf(p) !== i);
  if (twice) throw new UsageError(`Prefix ${twice} is listed twice.`);
  return list;
}

export function parseMealsFile(text) {
  return parsePrefixes(String(text).split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#')).join(','));
}

// Pure: turns argv (after "node script") into a checked request. Throws UsageError.
export function parseArgs(argv, readFile = (file) => readFileSync(file, 'utf8')) {
  if (argv.includes('--help') || argv.includes('-h')) return { command: 'help' };
  const [command, ...rest] = argv;
  if (!['run', 'restore'].includes(command)) throw new UsageError('Use "run" or "restore". See --help.');
  let values;
  try {
    ({ values } = parseNodeArgs({ args: rest, allowPositionals: false, strict: true, options: {
      mode: { type: 'string' }, meals: { type: 'string' }, 'meals-file': { type: 'string' }, meal: { type: 'string' },
      ledger: { type: 'string' }, 'max-meals': { type: 'string' }, 'max-minutes': { type: 'string' },
      'wait-seconds': { type: 'string' }, 'dry-run': { type: 'boolean' }, snapshot: { type: 'string' } } }));
  } catch (error) { throw new UsageError(error.message); }
  if (!values.ledger) throw new UsageError('--ledger=<private directory outside the repository> is required.');
  const waitSeconds = positiveInt(values['wait-seconds'] ?? 300, '--wait-seconds', WAIT_HARD_MAX_SECONDS);
  if (command === 'restore') {
    for (const key of ['mode', 'meals', 'meals-file', 'max-meals', 'max-minutes', 'dry-run']) if (values[key] !== undefined) throw new UsageError(`--${key} is not a restore option.`);
    if (!values.meal) throw new UsageError('--meal=<8-character prefix> is required.');
    const [meal, more] = parsePrefixes(values.meal);
    if (more) throw new UsageError('restore takes one meal.');
    const snapshot = values.snapshot ?? 'last';
    if (!['last', 'first'].includes(snapshot)) throw new UsageError('--snapshot is last or first.');
    return { command, meal, ledger: values.ledger, snapshot, waitSeconds };
  }
  for (const key of ['meal', 'snapshot']) if (values[key] !== undefined) throw new UsageError(`--${key} is not a run option.`);
  if (!Object.hasOwn(MODE_FILES, values.mode ?? '')) throw new UsageError('--mode=rematch or --mode=reanalyse is required.');
  if ((values.meals === undefined) === (values['meals-file'] === undefined)) throw new UsageError('Give exactly one of --meals and --meals-file.');
  let meals;
  if (values.meals !== undefined) meals = parsePrefixes(values.meals);
  else {
    let text;
    try { text = readFile(values['meals-file']); } catch { throw new UsageError('The --meals-file could not be read.'); }
    meals = parseMealsFile(text);
  }
  return { command, mode: values.mode, meals, ledger: values.ledger, dryRun: values['dry-run'] === true, waitSeconds,
    maxMeals: positiveInt(values['max-meals'] ?? 10, '--max-meals'), maxMinutes: positiveInt(values['max-minutes'] ?? 45, '--max-minutes') };
}

// Pure: is child the same as, or inside, parent? Both absolute.
export function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
}

// Pure: the reason a ledger directory is refused, or null. roots are the repository directories to stay out of.
export function ledgerRefusal(ledger, roots) {
  for (const root of roots.filter(Boolean)) if (isInside(root, ledger)) return `The ledger directory is inside the repository (${root}). It holds private rows; choose a directory outside it.`;
  return null;
}

// Follows symlinks for the part of the path that already exists.
function realPath(target) {
  let existing = path.resolve(target); const tail = [];
  while (!existsSync(existing) && path.dirname(existing) !== existing) { tail.unshift(path.basename(existing)); existing = path.dirname(existing); }
  return path.join(realpathSync(existing), ...tail);
}

function repositoryRoots() {
  const roots = [realPath(path.resolve(here, '..', '..'))];
  const git = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (!git.error && git.status === 0 && git.stdout.trim()) roots.push(realPath(git.stdout.trim()));
  return roots;
}

// Pure: why the run must not start another meal, or null.
// outcomes: the outcomes so far, in order. started: how many meals have been worked. remaining: how many are left.
export function stopReason({ outcomes, started, remaining, maxMeals, maxMinutes, elapsedMinutes, previousInFlight = false }) {
  if (remaining <= 0) return null;
  if (previousInFlight) return 'the previous meal is still being worked after its wait ran out; meals are worked one at a time';
  const bad = (o) => o === 'failed' || o === 'timeout';
  if (outcomes.length >= 2 && outcomes.slice(-2).every(bad)) return 'two meals in a row failed or timed out';
  const failed = outcomes.filter((o) => o === 'failed').length;
  if (outcomes.length >= 10 && failed * 10 > outcomes.length) return `more than one in ten meals failed (${failed} of ${outcomes.length})`;
  if (started >= maxMeals) return `--max-meals reached (${maxMeals})`;
  if (elapsedMinutes >= maxMinutes) return `--max-minutes used up (${maxMinutes})`;
  return null;
}

const NUMBERS = ['items', 'calories', 'protein_g', 'carbs_g', 'fat_g'];

// Pure: changed or unchanged, from the two totals.
export function compareTotals(before, after) {
  return NUMBERS.every((key) => Number(before?.[key] ?? NaN) === Number(after?.[key] ?? NaN) || (before?.[key] == null && after?.[key] == null)) ? 'unchanged' : 'changed';
}

// Pure: (after - before) / before, rounded to four places; null when there is no "before" to divide by.
export function relativeChange(before, after) {
  if (before == null || after == null || Number(before) === 0) return null;
  return Math.round(((Number(after) - Number(before)) / Number(before)) * 10000) / 10000;
}

// Pure: the snapshot of one meal out of the text of snapshots.jsonl (only snapshots of a ready meal count). Throws UsageError when there is none or two meals share the prefix.
export function findSnapshot(text, prefix, which = 'last') {
  const found = [];
  for (const line of String(text).split('\n')) {
    if (!line.trim()) continue;
    let snapshot;
    try { snapshot = JSON.parse(line); } catch { continue; }
    if (typeof snapshot?.post?.id === 'string' && snapshot.post.id.startsWith(prefix) && snapshot.post.status === 'ready') found.push(snapshot);
  }
  if (!found.length) throw new UsageError(`No snapshot of meal ${prefix} is in this ledger.`);
  if (new Set(found.map((s) => s.post.id)).size > 1) throw new UsageError(`Two different meals in this ledger start with ${prefix}.`);
  return { snapshot: which === 'first' ? found[0] : found.at(-1), count: found.length };
}

// Pure: what 13-restore.sql needs, from one snapshot line.
export function restoreParams(snapshot) {
  const oldIds = (snapshot.items ?? []).filter((item) => item.superseded_at === null).map((item) => item.id);
  if (!oldIds.length) throw new UsageError('The snapshot has no current items to put back.');
  for (const id of oldIds) if (!/^[0-9a-f-]{36}$/.test(id)) throw new UsageError('The snapshot holds an item id that is not a uuid.');
  const summary = (snapshot.comments ?? []).find((comment) => comment.author === 'model');
  return { post: snapshot.post.id, old_ids: `{${oldIds.join(',')}}`, summary_comment_id: summary?.id ?? NIL_UUID, old_summary: summary?.body ?? '',
    analysis_initialized_at: snapshot.post.analysis_initialized_at ?? '' };
}

const fmt = (value, digits = 1) => (value == null ? '-' : Number(value).toFixed(digits));

// Pure: the table printed at the end. Prefixes only.
export function summaryTable(rows) {
  const head = ['meal', 'mode', 'outcome', 'items', 'kcal before', 'kcal after', 'change', 'waited s', 'model calls'];
  const body = rows.map((r) => [r.meal, r.mode, r.outcome, `${r.before?.items ?? '-'} -> ${r.after?.items ?? '-'}`, fmt(r.before?.calories), fmt(r.after?.calories),
    r.calories_change == null ? '-' : `${(r.calories_change * 100).toFixed(1)}%`, String(r.seconds_waited ?? 0), String(r.model_calls ?? 0)]);
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((row) => row[i].length)));
  const line = (cells) => cells.map((cell, i) => cell.padEnd(widths[i])).join('  ').trimEnd();
  const counts = {};
  for (const r of rows) counts[r.outcome] = (counts[r.outcome] ?? 0) + 1;
  const sum = (pick) => rows.reduce((total, r) => total + Number(pick(r) ?? 0), 0);
  return [line(head), line(widths.map((w) => '-'.repeat(w))), ...body.map(line), '',
    `Totals: ${rows.length} meal(s): ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ') || 'none'}; ` +
    `kcal ${fmt(sum((r) => r.before?.calories))} -> ${fmt(sum((r) => r.after?.calories))}; ${sum((r) => r.model_calls)} model call(s); ${sum((r) => r.seconds_waited)} s waited.`].join('\n');
}

// ---- database and worker (not pure) ----

function psql({ file, input, vars = {}, extra = [] }) {
  const args = ['-X', '-At', '-v', 'ON_ERROR_STOP=1', '--dbname', process.env.SUPABASE_DB_URL, ...extra];
  for (const [key, value] of Object.entries(vars)) args.push('-v', `${key}=${value}`);
  if (file) args.push('-f', file);
  const result = spawnSync('psql', args, { encoding: 'utf8', input: file ? undefined : input, timeout: 120000, maxBuffer: 256 * 1024 * 1024 });
  if (result.error) throw new Error(`psql could not be run: ${result.error.code ?? result.error.message}`);
  if (result.status !== 0) throw new Error(`psql failed: ${String(result.stderr).trim().split('\n').slice(-3).join(' ')}`);
  return result.stdout;
}

const one = (sql, vars) => psql({ input: sql, vars }).trim();

function resolvePrefixes(prefixes) {
  const rows = one(`select left(id::text, 8) || ' ' || id::text from public.posts
    where deleted_at is null and left(id::text, 8) = any(string_to_array(:'prefixes', ',')) order by 1;`, { prefixes: prefixes.join(',') });
  const ids = new Map(prefixes.map((p) => [p, []]));
  for (const row of rows.split('\n').filter(Boolean)) { const [prefix, id] = row.split(' '); ids.get(prefix)?.push(id); }
  const problems = prefixes.filter((p) => ids.get(p).length !== 1).map((p) => `${p} matches ${ids.get(p).length === 0 ? 'no meal that is not deleted' : `${ids.get(p).length} meals`}`);
  if (problems.length) throw new UsageError(`Nothing was started: ${problems.join('; ')}.`);
  return prefixes.map((prefix) => ({ prefix, id: ids.get(prefix)[0] }));
}

// Current items of one meal: count and sums, the meal's status, and whether a job for it is queued or running.
function readTotals(post) {
  const text = one(`select json_build_object('status', p.status, 'items', count(i.id), 'calories', sum(n.calories), 'protein_g', sum(n.protein_g),
      'carbs_g', sum(n.carbs_g), 'fat_g', sum(n.fat_g), 'deleted', p.deleted_at is not null,
      'job_in_flight', exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running')))
    from public.posts p left join public.post_items i on i.post_id = p.id and i.superseded_at is null
    left join public.item_nutrition n on n.post_item_id = i.id
    where p.id = :'post'::uuid group by p.id;`, { post });
  if (!text) throw new Error('The meal is no longer there.');
  return JSON.parse(text);
}
const publicTotals = ({ status, items, calories, protein_g, carbs_g, fat_g }) => ({ status, items, calories, protein_g, carbs_g, fat_g });

const dbNow = () => one('select now();');
const jobsSince = (post, since) => Number(one(`select count(*) from public.jobs where post_id = :'post'::uuid and created_at >= :'since'::timestamptz;`, { post, since }));

// Model calls for the meal since a time, counted by 09-usage.sql (its "calls" column).
function modelCalls(prefix, since) {
  const lines = psql({ file: sqlFile('09-usage.sql'), vars: { prefixes: prefix, since }, extra: ['-P', 'tuples_only=off', '-P', 'footer=off', '-F', '\x1f'] }).split('\n').filter(Boolean);
  if (!lines.length) return 0;
  const column = lines[0].split('\x1f').indexOf('calls');
  if (column < 0) throw new Error('09-usage.sql no longer has a "calls" column.');
  return lines.slice(1).reduce((total, line) => total + Number(line.split('\x1f')[column] ?? 0), 0);
}

async function tick() {
  try {
    const response = await fetch(new URL('/api/jobs/tick', process.env.APP_URL), { cache: 'no-store', signal: AbortSignal.timeout(30000) });
    if (!response.ok) console.log(`  (the tick answered ${response.status})`);
  } catch (error) { console.log(`  (the tick could not be reached: ${error.name})`); }
}

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));
const settled = (totals) => ['ready', 'failed', 'needs_input'].includes(totals.status) && !totals.job_in_flight;

// Ticks, then polls every 10 seconds (first look after 2), ticking again every 60, until the meal settles or the wait runs out.
async function waitForMeal(post, waitSeconds) {
  const started = Date.now(); let lastTick = started, totals;
  const waited = () => Math.round((Date.now() - started) / 1000);
  await tick();
  await sleep(Math.min(FIRST_POLL_SECONDS, waitSeconds));
  for (;;) {
    totals = readTotals(post);
    if (settled(totals)) return { totals, seconds: waited(), timedOut: false };
    const left = waitSeconds - (Date.now() - started) / 1000;
    if (left <= 0) return { totals, seconds: waited(), timedOut: true };
    if (Date.now() - lastTick >= TICK_SECONDS * 1000) { lastTick = Date.now(); await tick(); }
    await sleep(Math.min(POLL_SECONDS, left));
  }
}

function requireEnv(names) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) throw new UsageError(`Set ${missing.join(' and ')} in the environment.`);
}

function checkedLedger(ledger) {
  const resolved = realPath(ledger);
  const refusal = ledgerRefusal(resolved, repositoryRoots());
  if (refusal) throw new UsageError(refusal);
  return resolved;
}

function appendPrivate(directory, name, line) {
  mkdirSync(directory, { recursive: true, mode: 0o700 }); chmodSync(directory, 0o700);
  const file = path.join(directory, name);
  appendFileSync(file, line + '\n', { mode: 0o600 }); chmodSync(file, 0o600);
}

async function run(request) {
  const ledger = checkedLedger(request.ledger);
  requireEnv(request.dryRun ? ['SUPABASE_DB_URL'] : ['SUPABASE_DB_URL', 'APP_URL']);
  const meals = resolvePrefixes(request.meals);
  const file = MODE_FILES[request.mode];
  if (request.dryRun) {
    console.log(`Dry run: nothing is written and no snapshot is taken. Mode ${request.mode} (${file}); at most ${request.maxMeals} meal(s), ${request.maxMinutes} minute(s), ${request.waitSeconds} s per meal.`);
    meals.forEach(({ prefix, id }, index) => {
      const t = readTotals(id);
      const note = index >= request.maxMeals ? 'would NOT be started: --max-meals' : t.job_in_flight ? 'would be skipped: a job for this meal is queued or running'
        : t.status !== 'ready' ? `would be skipped: the meal is ${t.status}, not ready` : `would snapshot, then run ${file}`;
      console.log(`${prefix}  ${t.status}  ${t.items} item(s)  ${fmt(t.calories)} kcal  ${note}`);
    });
    console.log(`Ledger directory (not created by a dry run): outside the repository, accepted.`);
    return EXIT.ok;
  }
  const startedAt = Date.now(), rows = [], outcomes = [];
  let stop = null, previousInFlight = false, broken = null;
  try { for (let index = 0; index < meals.length; index++) {
    stop = stopReason({ outcomes, started: index, remaining: meals.length - index, maxMeals: request.maxMeals, maxMinutes: request.maxMinutes,
      elapsedMinutes: (Date.now() - startedAt) / 60000, previousInFlight });
    if (stop) break;
    const { prefix, id } = meals[index];
    const row = { meal: prefix, mode: request.mode, outcome: 'skipped', at: new Date().toISOString(), before: null, after: null, calories_change: null, seconds_waited: 0, model_calls: 0 };
    const first = readTotals(id);
    row.before = publicTotals(first);
    if (first.deleted) row.reason = 'the meal was deleted after the run started';
    else if (first.job_in_flight) row.reason = 'a job for this meal is queued or running';
    else if (first.status !== 'ready') row.reason = `the meal is ${first.status}, not ready`;
    else {
      const snapshot = psql({ file: sqlFile('08-snapshot.sql'), vars: { prefixes: prefix } }).split('\n').find((line) => line && JSON.parse(line).post?.id === id);
      if (!snapshot) throw new Error(`08-snapshot.sql returned no line for meal ${prefix}; nothing was written for it.`);
      appendPrivate(ledger, 'snapshots.jsonl', snapshot);
      const since = dbNow();
      psql({ file: sqlFile(file), vars: { post: id } });
      if (jobsSince(id, since) === 0) row.reason = "refused by the file's guards";
      else {
        const waitResult = await waitForMeal(id, request.waitSeconds);
        row.seconds_waited = waitResult.seconds;
        row.after = publicTotals(waitResult.totals);
        row.calories_change = relativeChange(row.before.calories, row.after.calories);
        row.model_calls = modelCalls(prefix, since);
        if (waitResult.timedOut) { row.outcome = 'timeout'; row.reason = `still ${waitResult.totals.status} after ${request.waitSeconds} s`; previousInFlight = waitResult.totals.job_in_flight; }
        else if (waitResult.totals.status === 'ready') row.outcome = compareTotals(row.before, row.after);
        else { row.outcome = 'failed'; row.reason = waitResult.totals.status === 'needs_input' ? 'the meal now asks its owner a question (needs_input)' : 'the meal is failed'; }
      }
    }
    if (row.outcome === 'skipped') row.after = row.before;
    appendPrivate(ledger, 'ledger.jsonl', JSON.stringify(row));
    rows.push(row); outcomes.push(row.outcome);
    console.log(`${prefix}  ${row.outcome}${row.reason ? ` (${row.reason})` : ''}  kcal ${fmt(row.before?.calories)} -> ${fmt(row.after?.calories)}  waited ${row.seconds_waited} s`);
  } } catch (error) { broken = error; }
  console.log('\n' + summaryTable(rows));
  if (broken) { console.error(`\nSTOPPED at meal ${meals[rows.length].prefix}: ${broken.message} Its ledger line was not written; read its state before going on.`); return EXIT.incomplete; }
  if (stop) { console.log(`\nSTOPPED before meal ${meals[rows.length].prefix}: ${stop}. ${meals.length - rows.length} meal(s) not started: ${meals.slice(rows.length).map((m) => m.prefix).join(', ')}.`); return EXIT.stopped; }
  return outcomes.some((o) => o === 'failed' || o === 'timeout') ? EXIT.incomplete : EXIT.ok;
}

async function restore(request) {
  const ledger = checkedLedger(request.ledger);
  requireEnv(['SUPABASE_DB_URL', 'APP_URL']);
  let text;
  try { text = readFileSync(path.join(ledger, 'snapshots.jsonl'), 'utf8'); } catch { throw new UsageError('There is no snapshots.jsonl in that ledger directory.'); }
  const { snapshot, count } = findSnapshot(text, request.meal, request.snapshot);
  const params = restoreParams(snapshot);
  const before = readTotals(params.post);
  if (before.deleted) throw new UsageError(`Meal ${request.meal} is deleted; it is not restored.`);
  if (before.job_in_flight) throw new UsageError(`A job for meal ${request.meal} is queued or running; try again when it has finished.`);
  if (!['ready', 'failed'].includes(before.status)) throw new UsageError(`Meal ${request.meal} is ${before.status}; only a ready or failed meal is restored.`);
  console.log(`Restoring meal ${request.meal} from its ${request.snapshot} snapshot (${count} in the ledger): ${params.old_ids.split(',').length} item(s) come back.`);
  const since = dbNow();
  // One psql session: a failed meal is first made ready again with its analysis time, then 13-restore.sql runs as it is.
  psql({ vars: { post: params.post, old_ids: params.old_ids, summary_comment_id: params.summary_comment_id, old_summary: params.old_summary, initialized: params.analysis_initialized_at },
    input: `update public.posts p set status = 'ready', fail_reason = null, analysis_initialized_at = nullif(:'initialized', '')::timestamptz
  where p.id = :'post'::uuid and p.status = 'failed' and p.deleted_at is null
    and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'));
\\i '${sqlFile('13-restore.sql').replaceAll("'", "\\'")}'
` });
  if (jobsSince(params.post, since) === 0) console.log('13-restore.sql queued no job (its guards refused); the totals below are read as they stand.');
  const waitResult = await waitForMeal(params.post, request.waitSeconds);
  const row = { meal: request.meal, mode: 'restore', outcome: waitResult.timedOut ? 'timeout' : waitResult.totals.status === 'ready' ? 'restored' : 'failed',
    before: publicTotals(before), after: publicTotals(waitResult.totals), seconds_waited: waitResult.seconds, model_calls: modelCalls(request.meal, since) };
  row.calories_change = relativeChange(row.before.calories, row.after.calories);
  console.log(summaryTable([row]));
  const was = snapshot.items.filter((item) => item.superseded_at === null).reduce((total, item) => total + Number(item.nutrition?.calories ?? 0), 0);
  console.log(`Snapshot: ${params.old_ids.split(',').length} item(s), ${fmt(was)} kcal. Now: ${row.after.items} item(s), ${fmt(row.after.calories)} kcal, status ${row.after.status}.`);
  return row.outcome === 'restored' ? EXIT.ok : EXIT.incomplete;
}

export async function main(argv) {
  let request;
  try {
    request = parseArgs(argv);
    if (request.command === 'help') { console.log(HELP); return EXIT.ok; }
    return await (request.command === 'run' ? run(request) : restore(request));
  } catch (error) {
    if (error instanceof UsageError) { console.error(error.message); return EXIT.usage; }
    console.error(error.message); return EXIT.incomplete;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main(process.argv.slice(2));
```

### `scripts/numbers/14-rule-failures.sql`

```
-- Meals with numbers that cannot be right, and whether 12-reanalyse.sql would take each one.
-- Read-only, one SELECT. psql variable: uid (the account id).
-- It repeats rules a1, a2, b, d, e, f and g1 of 03-suspicious.sql word for word (not c, g2, h or i),
-- because one SELECT in a read-only session cannot read another file. A rule change is made in 03, 04 and 14.
-- can_reanalyse repeats the guards of 12-reanalyse.sql; a change to those guards is made in 12 and 14.
with items as (
  select p.id as post_id, i.id as item_id, i.name, i.portion_grams,
         n.post_item_id is not null as has_row, n.calories, n.protein_g, n.carbs_g, n.fat_g,
         n.fibre_g, n.sugar_g, n.sodium_mg
  from public.posts p
  join public.post_items i on i.post_id = p.id and i.superseded_at is null
  left join public.item_nutrition n on n.post_item_id = i.id
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
), flags as (
  select post_id, item_id, 'a1' as rule from items where not has_row
  union all
  select post_id, item_id, 'a2' from items where has_row and (calories is null or protein_g is null or carbs_g is null or fat_g is null)
  union all
  select post_id, item_id, 'b' from items
  where portion_grams > 20 and (calories = 0 or (protein_g = 0 and carbs_g = 0 and fat_g = 0))
    and not (name ~* '\m(water|tea|coffee|espresso|americano|diet|zero)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|mocha|bubble|boba)\M')
  union all
  select post_id, item_id, 'd' from items
  where portion_grams > 0 and calories is not null and (calories / portion_grams < 0 or calories / portion_grams > 9)
  union all
  select post_id, item_id, 'e' from items where portion_grams is null or portion_grams < 5 or portion_grams > 1500
  union all
  select post_id, item_id, 'f' from items
  where calories < 0 or protein_g < 0 or carbs_g < 0 or fat_g < 0 or fibre_g < 0 or sugar_g < 0 or sodium_mg < 0
  union all
  select post_id, item_id, 'g1' from items
  where name ~* '\m(coffee|espresso|americano|tea)\M' and name !~* '\m(milk|latte|cappuccino|sugar|mocha)\M'
    and portion_grams > 0 and calories / portion_grams > 0.25
), failing as (
  select post_id, count(distinct item_id) as items_failing, count(distinct rule) as rule_count,
         string_agg(distinct rule, ',' order by rule) as rules
  from flags group by post_id
)
select left(f.post_id::text, 8) as post, f.items_failing, f.rules,
       round((select sum(it.calories) from items it where it.post_id = f.post_id), 1) as kcal,
       (p.analysis_initialized_at is not null and p.source_post_id is null
        and exists (select 1 from public.post_media m where m.post_id = p.id and m.kind = 'photo' and not m.not_eaten)
        and not exists (select 1 from public.post_media m where m.post_id = p.id and m.kind = 'photo' and m.not_eaten)
        and not exists (select 1 from public.post_comments c where c.post_id = p.id and c.author = 'user' and c.reverted_at is null)
        and not exists (select 1 from public.intake_logs l where l.post_id = p.id and l.source = 'sheet')
        and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))) as can_reanalyse
from failing f join public.posts p on p.id = f.post_id
order by f.rule_count desc, kcal desc nulls last, post;
```

### `tests/numbers-reanalyse.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { EXIT, HELP, UsageError, compareTotals, findSnapshot, isInside, ledgerRefusal, parseArgs, parseMealsFile, relativeChange, restoreParams, stopReason, summaryTable } from '../scripts/numbers/reanalyse.mjs';

const script = fileURLToPath(new URL('../scripts/numbers/reanalyse.mjs', import.meta.url));
const A = '11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa', B = '22222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const item = (id, superseded_at, calories) => ({ id, superseded_at, nutrition: { calories } });
const snapshot = (id, status = 'ready', extra = {}) => ({ post: { id, status, analysis_initialized_at: '2026-11-01T00:00:00+00:00' },
  items: [item('aaaaaaaa-0000-4000-8000-000000000001', '2026-11-02T00:00:00+00:00', 10), item('aaaaaaaa-0000-4000-8000-000000000002', null, 20), item('aaaaaaaa-0000-4000-8000-000000000003', null, 30)],
  comments: [{ id: 'cccccccc-0000-4000-8000-000000000001', author: 'user', body: 'mine' }, { id: 'cccccccc-0000-4000-8000-000000000002', author: 'model', body: 'Consumed: 50 kcal' }, { id: 'cccccccc-0000-4000-8000-000000000003', author: 'model', body: 'later' }], ...extra });

test('run arguments are parsed with their defaults and limits', () => {
  assert.deepEqual(parseArgs(['run', '--mode=rematch', '--meals=1E5F8815, 8e7033dd', '--ledger=/private/l']),
    { command: 'run', mode: 'rematch', meals: ['1e5f8815', '8e7033dd'], ledger: '/private/l', dryRun: false, waitSeconds: 300, maxMeals: 10, maxMinutes: 45 });
  const fromFile = parseArgs(['run', '--mode=reanalyse', '--meals-file=list', '--ledger=/l', '--max-meals=3', '--max-minutes=5', '--wait-seconds=600', '--dry-run'], (file) => { assert.equal(file, 'list'); return '# first\n1e5f8815\n\n 8e7033dd \n'; });
  assert.deepEqual(fromFile, { command: 'run', mode: 'reanalyse', meals: ['1e5f8815', '8e7033dd'], ledger: '/l', dryRun: true, waitSeconds: 600, maxMeals: 3, maxMinutes: 5 });
  assert.deepEqual(parseMealsFile('1e5f8815\n# no\n'), ['1e5f8815']);
  assert.deepEqual(parseArgs(['--help']), { command: 'help' });
});

test('wrong run arguments are refused as usage errors', () => {
  const bad = [
    [], ['again'], ['run', '--mode=rematch', '--meals=1e5f8815'], ['run', '--meals=1e5f8815', '--ledger=/l'], ['run', '--mode=both', '--meals=1e5f8815', '--ledger=/l'],
    ['run', '--mode=rematch', '--ledger=/l'], ['run', '--mode=rematch', '--meals=1e5f8815', '--meals-file=x', '--ledger=/l'],
    ['run', '--mode=rematch', '--meals=1e5f881', '--ledger=/l'], ['run', '--mode=rematch', '--meals=1e5f8815-a836-4c46-a933-d903fe443122', '--ledger=/l'],
    ['run', '--mode=rematch', '--meals=1e5f8815,1e5f8815', '--ledger=/l'], ['run', '--mode=rematch', '--meals=', '--ledger=/l'],
    ['run', '--mode=rematch', '--meals=1e5f8815', '--ledger=/l', '--wait-seconds=601'], ['run', '--mode=rematch', '--meals=1e5f8815', '--ledger=/l', '--max-meals=0'],
    ['run', '--mode=rematch', '--meals=1e5f8815', '--ledger=/l', '--max-minutes=1.5'], ['run', '--mode=rematch', '--meals=1e5f8815', '--ledger=/l', '--force'],
    ['run', '--mode=rematch', '--meals=1e5f8815', '--ledger=/l', '--meal=1e5f8815'], ['restore', '--ledger=/l'], ['restore', '--meal=1e5f8815'],
    ['restore', '--meal=1e5f8815,8e7033dd', '--ledger=/l'], ['restore', '--meal=1e5f8815', '--ledger=/l', '--mode=rematch'], ['restore', '--meal=1e5f8815', '--ledger=/l', '--snapshot=middle'],
  ];
  for (const argv of bad) assert.throws(() => parseArgs(argv, () => '1e5f8815'), UsageError, argv.join(' '));
  assert.throws(() => parseArgs(['run', '--mode=rematch', '--meals-file=x', '--ledger=/l'], () => { throw Error('missing'); }), UsageError);
  assert.deepEqual(parseArgs(['restore', '--meal=1e5f8815', '--ledger=/l']), { command: 'restore', meal: '1e5f8815', ledger: '/l', snapshot: 'last', waitSeconds: 300 });
});

test('a ledger directory inside the repository is refused', () => {
  assert.equal(isInside('/repo', '/repo'), true);
  assert.equal(isInside('/repo', '/repo/uploads/ledger'), true);
  assert.equal(isInside('/repo', '/repo-ledger'), false);
  assert.equal(isInside('/repo', '/home/me/ledger'), false);
  assert.equal(isInside('/repo/sub', '/repo'), false);
  assert.match(ledgerRefusal('/repo/uploads/ledger', ['/elsewhere', '/repo']), /inside the repository/);
  assert.equal(ledgerRefusal('/home/me/ledger', ['/repo', undefined]), null);
});

test('each stop condition fires before the next meal and not after the last', () => {
  const base = { outcomes: [], started: 0, remaining: 5, maxMeals: 10, maxMinutes: 45, elapsedMinutes: 0 };
  assert.equal(stopReason(base), null);
  assert.match(stopReason({ ...base, outcomes: ['changed'], started: 1, maxMeals: 1 }), /--max-meals reached \(1\)/);
  assert.equal(stopReason({ ...base, outcomes: ['changed'], started: 1, maxMeals: 1, remaining: 0 }), null);
  assert.match(stopReason({ ...base, elapsedMinutes: 45 }), /--max-minutes used up \(45\)/);
  assert.equal(stopReason({ ...base, elapsedMinutes: 44.9 }), null);
  assert.match(stopReason({ ...base, outcomes: ['changed', 'failed', 'timeout'], started: 3 }), /two meals in a row/);
  assert.match(stopReason({ ...base, outcomes: ['timeout', 'timeout'], started: 2 }), /two meals in a row/);
  assert.equal(stopReason({ ...base, outcomes: ['failed', 'changed', 'failed'], started: 3 }), null);
  assert.equal(stopReason({ ...base, outcomes: ['failed', 'skipped', 'timeout', 'unchanged'], started: 4 }), null);
  const nine = ['failed', ...Array(8).fill('changed')];
  assert.equal(stopReason({ ...base, outcomes: [...nine, 'changed'], started: 10, maxMeals: 50 }), null, 'one in ten is allowed');
  assert.equal(stopReason({ ...base, outcomes: ['failed', 'changed', 'failed', 'changed'], started: 4, maxMeals: 50 }), null, 'not before ten meals');
  assert.match(stopReason({ ...base, outcomes: [...nine, 'changed', 'failed', 'changed'].slice(1).concat('failed', 'changed'), started: 13, maxMeals: 50 }), /more than one in ten meals failed \(2 of 13\)/);
  assert.match(stopReason({ ...base, outcomes: ['timeout'], started: 1, previousInFlight: true }), /still being worked/);
  assert.equal(stopReason({ ...base, outcomes: ['timeout'], started: 1, previousInFlight: true, remaining: 0 }), null);
});

test('totals decide changed or unchanged and the relative change in calories', () => {
  const t = { status: 'ready', items: 4, calories: 830, protein_g: 41.5, carbs_g: 83, fat_g: 37.35 };
  assert.equal(compareTotals(t, { ...t }), 'unchanged');
  assert.equal(compareTotals(t, { ...t, fat_g: 37.4 }), 'changed');
  assert.equal(compareTotals(t, { ...t, items: 5 }), 'changed');
  assert.equal(compareTotals({ ...t, calories: null }, { ...t, calories: null }), 'unchanged');
  assert.equal(compareTotals({ ...t, calories: null }, t), 'changed');
  assert.equal(relativeChange(1679, 830), -0.5057);
  assert.equal(relativeChange(830, 830), 0);
  assert.equal(relativeChange(0, 10), null);
  assert.equal(relativeChange(null, 10), null);
  assert.equal(relativeChange(10, null), null);
});

test('restore parameters come from the snapshot line of that meal', () => {
  const later = snapshot(A, 'ready', { comments: [] });
  const text = [JSON.stringify(snapshot(A)), JSON.stringify(snapshot(B)), 'not json', '', JSON.stringify(later), JSON.stringify(snapshot(A, 'failed', { items: [] }))].join('\n');
  assert.equal(findSnapshot(text, '11111111').count, 2, 'a snapshot of a meal that was not ready is not used');
  assert.deepEqual(findSnapshot(text, '11111111').snapshot, later);
  assert.deepEqual(findSnapshot(text, '11111111', 'first').snapshot, snapshot(A));
  assert.throws(() => findSnapshot(text, '33333333'), UsageError);
  assert.throws(() => findSnapshot(JSON.stringify(snapshot(A)) + '\n' + JSON.stringify(snapshot('11111111-cccc-4ccc-8ccc-cccccccccccc')), '11111111'), /Two different meals/);
  assert.deepEqual(restoreParams(snapshot(A)), { post: A, old_ids: '{aaaaaaaa-0000-4000-8000-000000000002,aaaaaaaa-0000-4000-8000-000000000003}',
    summary_comment_id: 'cccccccc-0000-4000-8000-000000000002', old_summary: 'Consumed: 50 kcal', analysis_initialized_at: '2026-11-01T00:00:00+00:00' });
  const none = restoreParams(later);
  assert.equal(none.summary_comment_id, '00000000-0000-0000-0000-000000000000');
  assert.equal(none.old_summary, '');
  assert.throws(() => restoreParams(snapshot(A, 'ready', { items: [item('aaaaaaaa-0000-4000-8000-000000000001', '2026-11-02T00:00:00+00:00', 1)] })), UsageError);
  assert.throws(() => restoreParams(snapshot(A, 'ready', { items: [item("x'}; drop", null, 1)] })), UsageError);
});

test('the summary shows prefixes only and adds up', () => {
  const rows = [{ meal: '11111111', mode: 'rematch', outcome: 'changed', before: { items: 4, calories: 1679 }, after: { items: 4, calories: 830 }, calories_change: -0.5057, seconds_waited: 2, model_calls: 28 },
    { meal: '22222222', mode: 'rematch', outcome: 'skipped', before: { items: 0, calories: null }, after: { items: 0, calories: null }, calories_change: null, seconds_waited: 0, model_calls: 0 }];
  const table = summaryTable(rows);
  assert.ok(table.includes('11111111  rematch  changed  4 -> 4  1679.0       830.0       -50.6%  2         28'), table);
  assert.match(table, /Totals: 2 meal\(s\): 1 changed, 1 skipped; kcal 1679\.0 -> 830\.0; 28 model call\(s\); 2 s waited\./);
  assert.doesNotMatch(table, /[0-9a-f]{8}-[0-9a-f]{4}-/);
});

test('the command line answers --help and refuses bad usage without a database', () => {
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env: { PATH: process.env.PATH } });
  const help = run('--help');
  assert.equal(help.status, EXIT.ok);
  assert.equal(help.stdout.trim(), HELP);
  assert.equal(run('run', '--mode=rematch', '--meals=1e5f8815').status, EXIT.usage);
  const inside = run('run', '--mode=rematch', '--meals=1e5f8815', '--dry-run', '--ledger=' + fileURLToPath(new URL('../uploads/ledger', import.meta.url)));
  assert.equal(inside.status, EXIT.usage);
  assert.match(inside.stderr, /inside the repository/);
  const outside = run('run', '--mode=rematch', '--meals=1e5f8815', '--dry-run', '--ledger=/nonexistent-private/ledger');
  assert.equal(outside.status, EXIT.usage);
  assert.match(outside.stderr, /Set SUPABASE_DB_URL/);
});
```

### `supabase/migrations/0065_operator_revision.sql`

```
-- #985: after an operator re-analysis or re-match (scripts/numbers), the meal's summary comment and
-- its saved-meal copy follow the new numbers. Ordinary analysis, corrections and recomputes are unchanged:
-- every new rule below applies only to a job whose payload carries "operator".
create or replace function public.persist_approximated_analysis(
 p_post_id uuid,p_job_id uuid,p_items jsonb,p_summary text,p_needs_input jsonb default null,
 p_identify_model text default null,p_identify_host text default null,p_is_label boolean default false
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare initialized timestamptz;
begin
 select analysis_initialized_at into initialized from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 -- These functions enforce the active job fence before any item/comment write.
 if p_identify_model is not null then
  perform public.persist_identified_analysis(p_post_id,p_job_id,p_items,p_summary,p_needs_input,p_identify_model,p_identify_host,p_is_label);
 elsif p_is_label then
  perform public.persist_owned_label(p_post_id,p_job_id,p_items,p_summary,p_needs_input);
 else
  perform public.persist_owned_analysis(p_post_id,p_job_id,p_items,p_summary,p_needs_input);
 end if;
 -- A previously committed retry must not rewrite its authoritative summary.
 -- #985: an operator re-analysis (scripts/numbers/12-reanalyse.sql) always rewrites the first comment.
 if initialized is null and (
  exists(select 1 from public.jobs where id=p_job_id and payload ? 'operator') or
  (position(' is taken from the closest USDA record, ' in p_summary)>0 or position(' is a model estimate, ' in p_summary)>0 or position('The model did not treat “' in p_summary)>0 or position('No USDA record matched “' in p_summary)>0)
  or exists(select 1 from public.post_comments where id=(select id from public.post_comments where post_id=p_post_id and author='model' order by created_at,id limit 1)
   and (position(' is taken from the closest USDA record, ' in body)>0 or position(' is a model estimate, ' in body)>0 or position('The model did not treat “' in body)>0 or position('No USDA record matched “' in body)>0))
 ) then
  update public.post_comments set body=p_summary
  where id=(select id from public.post_comments where post_id=p_post_id and author='model' order by created_at,id limit 1);
 end if;
end $$;
revoke all on function public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean) from public,anon,authenticated;
grant execute on function public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean) to service_role;
create or replace function public.refresh_owned_approximation_summary(
 p_post_id uuid,p_job_id uuid,p_summary text,p_expected jsonb
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare changed integer; expected_count integer; current_count integer; matched_count integer; revision_comment uuid;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found or not public.post_work_matches(p_post_id,p_job_id) then
  raise exception 'Nutrition summary job no longer owns this meal' using errcode='PT409';
 end if;
 if p_expected is null or jsonb_typeof(p_expected)<>'array' then raise exception 'Current items are required' using errcode='22023';end if;
 expected_count:=jsonb_array_length(p_expected);
 select count(*) into current_count from public.current_post_items where post_id=p_post_id;
 select count(*) into matched_count from public.current_post_items i
 join public.item_nutrition n on n.post_item_id=i.id
 where i.post_id=p_post_id and exists(select 1 from jsonb_array_elements(p_expected) e
  where (e->>'id')::uuid=i.id and (e->>'source_ref') is not distinct from n.source_ref);
 if current_count<>expected_count or matched_count<>expected_count then
  raise exception 'Nutrition summary items changed' using errcode='PT409';
 end if;
 -- Resolve the same current model revision used by feedback, under the post lock.
 revision_comment:=(public.feedback_revision(p_post_id)->>'modelCommentId')::uuid;
 -- Older initial/correction comments stay untouched. Refresh on either side
 -- of the transition so removing the last approximate food clears its label.
 -- #985: an operator re-match (scripts/numbers/11-rematch.sql) always rewrites the comment.
 if not exists(select 1 from public.jobs where id=p_job_id and payload ? 'operator')
  and position(' is taken from the closest USDA record, ' in p_summary)=0 and position(' is a model estimate, ' in p_summary)=0 and position('The model did not treat “' in p_summary)=0 and position('No USDA record matched “' in p_summary)=0
  and not exists(select 1 from public.post_comments where id=revision_comment
   and (position(' is taken from the closest USDA record, ' in body)>0 or position(' is a model estimate, ' in body)>0 or position('The model did not treat “' in body)>0 or position('No USDA record matched “' in body)>0)) then return;end if;
 update public.post_comments set body=p_summary
 where id=revision_comment;
 get diagnostics changed=row_count;
 if changed<>1 then raise exception 'Nutrition summary is missing' using errcode='22023';end if;
end $$;
revoke all on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) to service_role;
-- The saved-meal copy of a meal is rebuilt by the one function that builds it, save_meal_from_post,
-- under the owner's identity as save_ready_meal does. Returns the number of copies refreshed.
create function public.refresh_operator_saved_meal(p_post_id uuid,p_job_id uuid) returns integer
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_post public.posts; v_saved record; v_claims text; refreshed integer:=0;
begin
 select * into v_post from public.posts where id=p_post_id and status='ready' and deleted_at is null for update;
 if not found then return 0;end if;
 if not exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id and payload ? 'operator') then return 0;end if;
 if not exists(select 1 from public.current_post_items where post_id=p_post_id) then return 0;end if;
 v_claims:=current_setting('request.jwt.claims',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_post.user_id,'role','authenticated')::text,true);
 for v_saved in select id,name from public.saved_meals where source_post_id=p_post_id and user_id=v_post.user_id loop
  perform public.save_meal_from_post(p_post_id,v_saved.name);
  refreshed:=refreshed+1;
 end loop;
 perform set_config('request.jwt.claims',coalesce(v_claims,''),true);
 return refreshed;
end $$;
revoke all on function public.refresh_operator_saved_meal(uuid,uuid) from public,anon,authenticated;
grant execute on function public.refresh_operator_saved_meal(uuid,uuid) to service_role;
```

### `supabase/rollbacks/0065_operator_revision.down.sql`

```
-- Restore the summary rules of 0054: an operator re-analysis or re-match no longer rewrites the comment,
-- and the saved-meal refresh is removed.
drop function if exists public.refresh_operator_saved_meal(uuid,uuid);
create or replace function public.persist_approximated_analysis(
 p_post_id uuid,p_job_id uuid,p_items jsonb,p_summary text,p_needs_input jsonb default null,
 p_identify_model text default null,p_identify_host text default null,p_is_label boolean default false
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare initialized timestamptz;
begin
 select analysis_initialized_at into initialized from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 -- These functions enforce the active job fence before any item/comment write.
 if p_identify_model is not null then
  perform public.persist_identified_analysis(p_post_id,p_job_id,p_items,p_summary,p_needs_input,p_identify_model,p_identify_host,p_is_label);
 elsif p_is_label then
  perform public.persist_owned_label(p_post_id,p_job_id,p_items,p_summary,p_needs_input);
 else
  perform public.persist_owned_analysis(p_post_id,p_job_id,p_items,p_summary,p_needs_input);
 end if;
 -- A previously committed retry must not rewrite its authoritative summary.
 if initialized is null and (
  (position(' is taken from the closest USDA record, ' in p_summary)>0 or position(' is a model estimate, ' in p_summary)>0 or position('The model did not treat “' in p_summary)>0 or position('No USDA record matched “' in p_summary)>0)
  or exists(select 1 from public.post_comments where id=(select id from public.post_comments where post_id=p_post_id and author='model' order by created_at,id limit 1)
   and (position(' is taken from the closest USDA record, ' in body)>0 or position(' is a model estimate, ' in body)>0 or position('The model did not treat “' in body)>0 or position('No USDA record matched “' in body)>0))
 ) then
  update public.post_comments set body=p_summary
  where id=(select id from public.post_comments where post_id=p_post_id and author='model' order by created_at,id limit 1);
 end if;
end $$;
revoke all on function public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean) from public,anon,authenticated;
grant execute on function public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean) to service_role;
create or replace function public.refresh_owned_approximation_summary(
 p_post_id uuid,p_job_id uuid,p_summary text,p_expected jsonb
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare changed integer; expected_count integer; current_count integer; matched_count integer; revision_comment uuid;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found or not public.post_work_matches(p_post_id,p_job_id) then
  raise exception 'Nutrition summary job no longer owns this meal' using errcode='PT409';
 end if;
 if p_expected is null or jsonb_typeof(p_expected)<>'array' then raise exception 'Current items are required' using errcode='22023';end if;
 expected_count:=jsonb_array_length(p_expected);
 select count(*) into current_count from public.current_post_items where post_id=p_post_id;
 select count(*) into matched_count from public.current_post_items i
 join public.item_nutrition n on n.post_item_id=i.id
 where i.post_id=p_post_id and exists(select 1 from jsonb_array_elements(p_expected) e
  where (e->>'id')::uuid=i.id and (e->>'source_ref') is not distinct from n.source_ref);
 if current_count<>expected_count or matched_count<>expected_count then
  raise exception 'Nutrition summary items changed' using errcode='PT409';
 end if;
 -- Resolve the same current model revision used by feedback, under the post lock.
 revision_comment:=(public.feedback_revision(p_post_id)->>'modelCommentId')::uuid;
 -- Older initial/correction comments stay untouched. Refresh on either side
 -- of the transition so removing the last approximate food clears its label.
 if position(' is taken from the closest USDA record, ' in p_summary)=0 and position(' is a model estimate, ' in p_summary)=0 and position('The model did not treat “' in p_summary)=0 and position('No USDA record matched “' in p_summary)=0
  and not exists(select 1 from public.post_comments where id=revision_comment
   and (position(' is taken from the closest USDA record, ' in body)>0 or position(' is a model estimate, ' in body)>0 or position('The model did not treat “' in body)>0 or position('No USDA record matched “' in body)>0)) then return;end if;
 update public.post_comments set body=p_summary
 where id=revision_comment;
 get diagnostics changed=row_count;
 if changed<>1 then raise exception 'Nutrition summary is missing' using errcode='22023';end if;
end $$;
revoke all on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) to service_role;
```

### `tests/reanalysis-prior.test.mjs`

```
// node --import tsx --test tests/reanalysis-prior.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createRequire} from 'node:module';
const analyze=createRequire(import.meta.url)('../src/lib/worker/jobs/analyze.ts').default;

// The handler reads the post and its photos, then (for an ordinary single-photo meal) asks for
// earlier meals. The fixture stops the run at the first read made by the analysis itself.
async function requests(payload){
 const seen=[];let posts=0;
 const db=createClient('http://127.0.0.1:1','fixture',{auth:{persistSession:false},global:{fetch:async input=>{
  const path=new URL(input).pathname;seen.push(path.slice(path.lastIndexOf('/')+1));
  if(path.endsWith('/posts'))return Response.json(posts++===0?[{analysis_initialized_at:null,question:null}]:[]);
  if(path.endsWith('/post_media'))return Response.json([{id:'photo',not_eaten:false}]);
  if(path.endsWith('/rpc/meal_prior_candidates'))return Response.json([]);
  throw Error(`Unexpected fixture request ${path}`);
 }}});
 await assert.rejects(analyze(db,{id:'job',post_id:'post',kind:'analyze',payload}),/post/i);
 return seen;
}

test('an ordinary single-photo analysis consults earlier meals',async()=>{
 assert.deepEqual(await requests({}),['posts','post_media','meal_prior_candidates','posts']);
});

test('an operator re-analysis never consults earlier meals: no hint and no copied numbers',async()=>{
 for(const payload of [{operator:'reanalysis'},{operator:'reanalysis',post_ownership:true}]){
  assert.deepEqual(await requests(payload),['posts','post_media','posts']);
 }
});
```

### `tests/removal-after-reanalysis.test.mjs`

```
// Run: node --import tsx --test tests/removal-after-reanalysis.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createRequire} from 'node:module';
const recompute=createRequire(import.meta.url)('../src/lib/worker/jobs/recompute.ts').default;
// One transaction writes one revision: its rows, and any reply, share a timestamp.
const at=minute=>`2026-11-02T00:0${minute}:00+00:00`;
const nutrition=(id,grams)=>({post_item_id:id,calories:grams,protein_g:grams/10,carbs_g:grams/5,fat_g:grams/20,fibre_g:0,sugar_g:0,sodium_mg:0,micronutrients:[],source_ref:'123',food_category:'baked products'});
const food=(id,grams,created_at,changes={})=>({id,name:'Toast',source:'model',portion_grams:grams,portion_text:`${grams} g`,created_at,superseded_at:null,not_eaten_grams:null,not_eaten_calories:null,box:null,mask_path:null,supersedes:null,...changes,item_nutrition:nutrition(id,grams)});
const comment=(id,body,author,created_at,reverted_at=null)=>({id,body,author,created_at,reverted_at});

// history: every model row of the meal, oldest first; the last one is the current row.
async function rebuilt({history,comments}){
 const calls={corrections:[],saved:null};
 const priorFetch=globalThis.fetch,priorKey=process.env.MODEL_API_KEY;process.env.MODEL_API_KEY='fixture';
 globalThis.fetch=async(_input,init)=>{
  let body={};try{body=JSON.parse(init?.body??'{}');}catch{}
  if(!body.model)return new Response(null,{status:201});
  const input=JSON.parse(body.input[0].content[0].text);calls.corrections.push(input);
  const grams=Number(input.items[0].portion_grams)/2;
  return Response.json({id:'fixture-model',status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify({items:[{name:'Toast',portion_text:`${grams} g`,portion_grams:grams,region_index:0,keep:null}],reply:'Updated the meal.',needs_input:null})}]}]});
 };
 const current=history.at(-1);
 const db=createClient('http://127.0.0.1:1','fixture',{auth:{persistSession:false},global:{fetch:async(input,init)=>{
  const url=new URL(input),path=url.pathname;
  if(path.endsWith('/current_post_items'))return Response.json([{...current,item_nutrition:undefined}]);
  if(path.endsWith('/item_nutrition'))return Response.json([current.item_nutrition]);
  if(path.endsWith('/post_items'))return Response.json(history);
  if(path.endsWith('/post_comments'))return Response.json(url.searchParams.has('or')?[]:comments);
  if(path.endsWith('/post_media'))return Response.json([]);
  if(path.endsWith('/posts'))return Response.json({user_id:'owner',caption:'Toast',analysis_initialized_at:at(0)});
  if(path.endsWith('/persist_removed_rebuild')){calls.saved=JSON.parse(init.body);return Response.json({message:'fixture captured atomic save',code:'40001'},{status:409});}
  throw Error(`Unexpected fixture request ${path}`);
 }}});
 try{await assert.rejects(recompute(db,{id:'job',post_id:'post',payload:{reason:'correction_reverted',comment_id:'removed'}}));return calls;}
 finally{globalThis.fetch=priorFetch;if(priorKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=priorKey;}
}

test('removing a correction after an operator re-analysis rebuilds from the re-analysed rows',async()=>{
 // 400 g first analysis (old numbers), superseded by the operator at minute 1; the worker's
 // re-analysis wrote 300 g at minute 2 and no new comment; a correction at minute 4 halved it.
 const calls=await rebuilt({
  history:[food('first',400,at(0),{superseded_at:at(1)}),food('reanalysed',300,at(2),{superseded_at:at(4)}),food('current',150,at(4),{supersedes:'reanalysed'})],
  comments:[comment('initial','Consumed: 300 kcal.','model',at(0)),comment('removed','Halve it.','user',at(3),at(5)),comment('reply','Consumed: 150 kcal.','model',at(4))],
 });
 assert.equal(calls.corrections.length,0);
 assert.equal(calls.saved.p_items[0].portion_grams,300,'the first analysis must not come back');
 assert.equal(calls.saved.p_items[0].nutrition.calories,300);
 assert.equal(calls.saved.p_reply,'Removed the correction "Halve it.". Consumed: 300 kcal.');
});

test('a correction kept after the re-analysis is replayed once on the re-analysed rows',async()=>{
 const calls=await rebuilt({
  history:[food('first',400,at(0),{superseded_at:at(1)}),food('reanalysed',300,at(2),{superseded_at:at(4)}),food('halved',150,at(4),{supersedes:'reanalysed',superseded_at:at(6)}),food('current',75,at(6),{supersedes:'halved'})],
  comments:[comment('initial','Consumed: 300 kcal.','model',at(0)),comment('kept','Halve it.','user',at(3)),comment('reply','Consumed: 150 kcal.','model',at(4)),comment('removed','Halve it again.','user',at(5),at(7)),comment('reply2','Consumed: 75 kcal.','model',at(6))],
 });
 assert.deepEqual(calls.corrections.map(input=>input.items[0].portion_grams),[300]);
 assert.equal(calls.saved.p_items[0].portion_grams,150);assert.equal(calls.saved.p_items[0].nutrition.calories,150);
});

test('removing a correction after an operator re-match of an uncorrected meal keeps the re-matched rows',async()=>{
 // The re-match superseded the 400 kcal row and wrote its copy in one transaction (minute 1).
 const rematched={...food('rematched',400,at(1),{superseded_at:at(3)}),item_nutrition:{...nutrition('rematched',400),calories:320,source_ref:'456'}};
 const calls=await rebuilt({
  history:[food('first',400,at(0),{superseded_at:at(1)}),rematched,food('current',200,at(3),{supersedes:'rematched'})],
  comments:[comment('initial','Consumed: 320 kcal.','model',at(0)),comment('removed','Halve it.','user',at(2),at(4)),comment('reply','Consumed: 160 kcal.','model',at(3))],
 });
 assert.equal(calls.saved.p_items[0].nutrition.calories,320);assert.equal(calls.saved.p_items[0].nutrition.source_ref,'456');
});

test('a re-match copy that already holds a correction is never the starting point',async()=>{
 // Halved at minute 2, then re-matched at minute 3: the 200 g copy holds the correction.
 // Replaying "Halve it." on it would halve the meal twice, so the rebuild keeps the first analysis.
 const calls=await rebuilt({
  history:[food('first',400,at(0),{superseded_at:at(2)}),food('halved',200,at(2),{supersedes:'first',superseded_at:at(3)}),food('copy',200,at(3),{superseded_at:at(5)}),food('current',100,at(5),{supersedes:'copy'})],
  comments:[comment('initial','Consumed: 400 kcal.','model',at(0)),comment('kept','Halve it.','user',at(1)),comment('reply','Consumed: 200 kcal.','model',at(2)),comment('removed','Halve it again.','user',at(4),at(6)),comment('reply2','Consumed: 100 kcal.','model',at(5))],
 });
 assert.deepEqual(calls.corrections.map(input=>input.items[0].portion_grams),[400]);
 assert.equal(calls.saved.p_items[0].portion_grams,200);
});
```

### `tests/db/operator-revision.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

// #985: an operator re-analysis or re-match (scripts/numbers) rewrites the meal's summary comment and
// refreshes its saved-meal copy; the same calls from an ordinary job change neither.
test('an operator job rewrites the summary comment and refreshes the saved-meal copy; an ordinary job does not',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(url,'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable database only');
 const migration=readFileSync(new URL('../../supabase/migrations/0065_operator_revision.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollbacks/0065_operator_revision.down.sql',import.meta.url),'utf8');
 const input=`begin;
 drop function if exists public.refresh_operator_saved_meal(uuid,uuid);
 ${migration}
 do $test$
 declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();plain_job uuid:=gen_random_uuid();operator_job uuid:=gen_random_uuid();
 first_comment uuid;item uuid;saved uuid;expected jsonb;
 payload jsonb:=jsonb_build_array(jsonb_build_object('name','black coffee','portion_grams',180,'portion_text','1 cup',
  'nutrition',jsonb_build_object('calories',2,'protein_g',0.2,'carbs_g',0,'fat_g',0,'source_ref','2710375','micronutrients','[]'::jsonb)));
 begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'operator-revision-'||u);
 insert into posts(id,user_id,status,save_as_meal)values(p,u,'processing',true);
 insert into post_items(post_id,name,source,portion_grams,portion_text)values(p,'black coffee','model',180,'1 cup')returning id into item;
 insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,source_ref)values(item,112,3.7,18.5,2.6,'175224');
 insert into post_comments(post_id,author,body)values(p,'model','Consumed: 112 kcal')returning id into first_comment;
 insert into jobs(id,post_id,kind,status,payload)values(plain_job,p,'analyze','running','{"post_ownership":true}');
 update posts set active_job_id=plain_job,status='ready',analysis_initialized_at=clock_timestamp() where id=p;
 saved:=save_ready_meal(p);
 if saved is null or (select items->0->'nutrition'->>'calories' from saved_meals where id=saved)::numeric<>112 then raise exception 'Fixture saved meal is wrong';end if;

 -- An ordinary re-analysis keeps an ordinary first comment (the rule of 0054), and refreshes no saved meal.
 update post_items set superseded_at=clock_timestamp() where post_id=p;
 update posts set status='processing',analysis_initialized_at=null where id=p;
 perform persist_approximated_analysis(p,plain_job,payload,'Consumed: 2 kcal');
 if (select body from post_comments where id=first_comment)<>'Consumed: 112 kcal' then raise exception 'An ordinary re-analysis rewrote the first comment';end if;
 update posts set status='ready' where id=p;
 if refresh_operator_saved_meal(p,plain_job)<>0 or (select items->0->'nutrition'->>'calories' from saved_meals where id=saved)::numeric<>112 then raise exception 'An ordinary job refreshed the saved meal';end if;

 -- The operator re-analysis: the first comment and the saved-meal copy take the new numbers.
 insert into jobs(id,post_id,kind,status,payload)values(operator_job,p,'analyze','running','{"operator":"reanalysis","post_ownership":true}');
 update post_items set superseded_at=clock_timestamp() where post_id=p and superseded_at is null;
 update posts set active_job_id=operator_job,status='processing',analysis_initialized_at=null where id=p;
 perform persist_approximated_analysis(p,operator_job,payload,'Consumed: 2 kcal');
 if (select body from post_comments where id=first_comment)<>'Consumed: 2 kcal' then raise exception 'The operator re-analysis kept the old first comment';end if;
 if (select count(*) from post_comments where post_id=p and author='model')<>1 then raise exception 'The operator re-analysis added a comment';end if;
 update posts set status='processing' where id=p;
 if refresh_operator_saved_meal(p,operator_job)<>0 then raise exception 'A meal that is not ready refreshed its saved meal';end if;
 update posts set status='ready' where id=p;
 if refresh_operator_saved_meal(p,operator_job)<>1 then raise exception 'The operator job did not refresh the saved meal';end if;
 if (select items->0->'nutrition'->>'calories' from saved_meals where id=saved)::numeric<>2
 or (select count(*) from saved_meals where source_post_id=p)<>1 then raise exception 'The saved-meal copy kept the old numbers';end if;

 -- The operator re-match: recompute's summary refresh rewrites the current comment even when it is ordinary.
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'source_ref',n.source_ref)),'[]'::jsonb) into expected from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=p;
 update posts set active_job_id=plain_job,status='processing' where id=p;
 perform refresh_owned_approximation_summary(p,plain_job,'Consumed: 3 kcal',expected);
 if (select body from post_comments where id=first_comment)<>'Consumed: 2 kcal' then raise exception 'An ordinary recompute rewrote an ordinary comment';end if;
 update jobs set payload='{"operator":"rematch","post_ownership":true}' where id=operator_job;
 update posts set active_job_id=operator_job where id=p;
 perform refresh_owned_approximation_summary(p,operator_job,'Consumed: 3 kcal',expected);
 if (select body from post_comments where id=first_comment)<>'Consumed: 3 kcal' then raise exception 'The operator re-match kept the old comment';end if;

 -- A deleted meal and another meal's job refresh nothing; app clients cannot call the function.
 if refresh_operator_saved_meal(gen_random_uuid(),operator_job)<>0 then raise exception 'A job refreshed a meal that is not its own';end if;
 update posts set status='ready',deleted_at=clock_timestamp() where id=p;
 if refresh_operator_saved_meal(p,operator_job)<>0 then raise exception 'A deleted meal refreshed its saved meal';end if;
 if has_function_privilege('authenticated','public.refresh_operator_saved_meal(uuid,uuid)','EXECUTE')
 or has_function_privilege('anon','public.refresh_operator_saved_meal(uuid,uuid)','EXECUTE') then raise exception 'App clients can refresh a saved meal';end if;
 end $test$;
 ${rollback}
 do $down$ begin
 if to_regprocedure('public.refresh_operator_saved_meal(uuid,uuid)') is not null then raise exception 'The rollback kept the saved-meal refresh';end if;
 end $down$;
 select 'operator-revision-ok';rollback;`;
 const output=execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','--dbname',url,'-At'],{input,encoding:'utf8',timeout:60000});
 assert.match(output,/operator-revision-ok/);
});
```

### `tests/estimate-caffeine.test.mjs`

```
// node --import tsx --test tests/estimate-caffeine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NUTRITION_COMPACT_WRITE='1';
process.env.MODEL_API_BASE_URL='http://127.0.0.1:1/v1';process.env.MODEL_API_KEY='offline-meta';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-trace';
const {estimateFood}=await import('../src/lib/fdc/estimate.ts');
const {scaleNutrition}=await import('../src/lib/fdc/nutrients.ts');
const {foodApproximation,approximationLabels,storedEstimateFood}=await import('../src/lib/fdc/approximation-metadata.ts');
const {drinksFromItems}=await import('../src/lib/intake/drinks-from-items.ts');
const {nutritionTableRows}=await import('../src/lib/nutrition/table.ts');
const {plainConsumed}=await import('../src/lib/pipeline/wording.ts');
const coffee={food:true,basis:'brewed black coffee',calories:1,protein_g:0.1,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:2,caffeine_mg:40};
let request;
async function withPayload(payload,fn){const original=globalThis.fetch;globalThis.fetch=async(input,init)=>{const url=new URL(input);if(url.origin==='https://trace.invalid')return new Response(null,{status:201});assert.equal(url.port,'1');request=JSON.parse(init.body);return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(payload)}]}],usage:{input_tokens:1,output_tokens:1}});};try{return await fn();}finally{globalThis.fetch=original;}}
const stored=(name,n,grams)=>({id:'item',name,portion_text:null,portion_grams:grams,food_category:n.foodCategory,source_ref:n.sourceRef,micronutrients:n.micronutrients});

test('the estimate asks the model for caffeine',async()=>withPayload(coffee,async()=>{
 await estimateFood('black coffee','');
 assert.match(request.instructions,/caffeine in milligrams/);
 assert.deepEqual(request.text.format.schema.properties.caffeine_mg,{type:['number','null']});
 assert.ok(request.text.format.schema.required.includes('caffeine_mg'));
}));

test('an estimated coffee stores caffeine as nutrient 1057 for the portion and keeps the estimate label',async()=>withPayload(coffee,async()=>{
 const food=await estimateFood('black coffee','');const n=scaleNutrition(food,180);
 const caffeine=n.micronutrients.find(entry=>entry.nutrientId===1057);
 assert.deepEqual({nutrientName:caffeine.nutrientName,unitName:caffeine.unitName,value:caffeine.value,basis:caffeine.basis,per100:caffeine.per100},{nutrientName:'Caffeine',unitName:'MG',value:72,basis:'portion',per100:40});
 assert.equal(n.calories,1.8);assert.match(n.sourceRef,/^estimate:/);assert.equal(n.foodCategory,null);
 const row=stored('black coffee',n,180);
 assert.deepEqual(foodApproximation(row),{kind:'estimate',basis:coffee.basis});
 assert.match(plainConsumed({calories:n.calories,protein_g:n.proteinG,carbs_g:n.carbsG,fat_g:n.fatG},approximationLabels([row])),/Nutrition for black coffee is a model estimate, brewed black coffee\./);
 // The drink row and the nutrition table read it exactly as they read a matched record's caffeine.
 assert.deepEqual(drinksFromItems([row]),[{post_item_id:'item',kind:'caffeine',amount:72,ml:180,label:'black coffee',caffeineMg:72,alcoholG:0}]);
 assert.equal(nutritionTableRows([{...row,calories:n.calories,protein_g:n.proteinG,carbs_g:n.carbsG,fat_g:n.fatG,fibre_g:n.fibreG,sugar_g:n.sugarG,sodium_mg:n.sodiumMg}]).find(line=>line.name==='Caffeine').value,72);
 // The per-100 g reference survives a later portion change.
 assert.equal(storedEstimateFood(row).foodNutrients.find(entry=>entry.nutrientId===1057).value,40);
}));

test('an estimated drink with no caffeine source drops the estimated caffeine',async()=>withPayload({...coffee,basis:'orange juice',calories:45,carbs_g:10,sugar_g:8,caffeine_mg:12},async()=>{
 for(const name of ['orange juice','herbal tea','decaf coffee']){
  const n=scaleNutrition(await estimateFood(name,''),200);
  assert.equal(n.micronutrients.find(entry=>entry.nutrientId===1057).value,24);
  // Only "herbal tea" and "decaf coffee" are drinks by name without a category; orange juice needs a category.
  const [drink]=drinksFromItems([{...stored(name,n,200),food_category:name==='orange juice'?'citrus juice':null}]);
  assert.equal(drink.caffeineMg,0,name);assert.equal(drink.kind,'water',name);
  assert.equal(nutritionTableRows([{...stored(name,n,200),food_category:name==='orange juice'?'citrus juice':null,calories:1,protein_g:0,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0}]).some(line=>line.name==='Caffeine'),false,name);
 }
}));

test('no caffeine, zero, an older answer without the field, and an out-of-range figure store no caffeine and keep the estimate',async()=>{
 for(const caffeine_mg of [null,0,undefined,-1,401,5000,'40',Number.NaN]){
  await withPayload({...coffee,caffeine_mg},async()=>{
   const food=await estimateFood('black coffee','');
   assert.equal(food.foodNutrients.some(entry=>entry.nutrientId===1057),false,String(caffeine_mg));
   assert.deepEqual(food.foodNutrients.map(entry=>entry.nutrientId),[1008,1003,1005,1004,1079,2000,1093]);
   assert.equal(scaleNutrition(food,180).calories,1.8);
  });
 }
 await withPayload({...coffee,caffeine_mg:400},async()=>{assert.equal((await estimateFood('espresso','')).foodNutrients.find(entry=>entry.nutrientId===1057).value,400);});
});
```

### `tests/drink-names.test.mjs`

```
// node --import tsx --test tests/drink-names.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { drinksFromItems, isDrinkItem } from '../src/lib/intake/drinks-from-items.ts';
import { isAlcoholic } from '../src/lib/intake/alcohol.ts';

const item = (changes = {}) => ({ id: 'drink', name: 'Cola', food_category: null, portion_text: '330 ml', portion_grams: 330, micronutrients: [], ...changes });
const caffeine = value => ({ nutrientId: 1057, nutrientName: 'Caffeine', unitName: 'MG', basis: 'portion', value });
const alcohol = value => ({ nutrientId: 1018, nutrientName: 'Alcohol, ethyl', unitName: 'G', basis: 'portion', value });

test('a cola whose record has no category counts as a drink, with its stored caffeine', () => {
  for (const name of ['Cola', 'Regular cola', 'Iced cola', 'A can of Coca-Cola', 'Glass of Coke with ice', 'Diet cola (can)', 'Coca-Cola Zero, 330 ml can']) {
    assert.equal(isDrinkItem({ name, food_category: null }), true, name);
    assert.deepEqual(drinksFromItems([item({ name, micronutrients: [caffeine(29.7)] })]),
      [{ post_item_id: 'drink', kind: 'caffeine', amount: 30, ml: 330, label: name.slice(0, 40), caffeineMg: 30, alcoholG: 0 }], name);
  }
});

test('a coffee or tea whose record has no category counts as a drink', () => {
  for (const name of ['black coffee', 'Iced black coffee', 'Vietnamese drip coffee', 'Cup of coffee', 'Sweet lemon iced tea', 'Hot green tea', 'Espresso on ice', 'Bottle of sparkling water']) {
    assert.equal(isDrinkItem({ name, food_category: null }), true, name);
  }
  assert.equal(drinksFromItems([item({ name: 'Iced black coffee', portion_text: '1 cup', portion_grams: 180, micronutrients: [caffeine(72)] })])[0].caffeineMg, 72);
});

test('a cocktail whose record has no category keeps its drink row and stays alcohol without caffeine', () => {
  for (const name of ['Rum cocktail', 'Lime and rum tiki cocktail', 'Peach bicyclette cocktail with Prosecco, peach and bitters', 'Fiore cocktail with chamomile-infused vodka', 'Mojito', 'Frozen margarita', 'Rum punch']) {
    assert.equal(isDrinkItem({ name, food_category: null }), true, name);
    const rows = drinksFromItems([item({ name, portion_text: '1 glass', portion_grams: 220, micronutrients: [caffeine(15.4), alcohol(18.3)] })]);
    assert.deepEqual(rows, [{ post_item_id: 'drink', kind: 'alcohol', amount: 18, ml: 220, label: name.slice(0, 40), caffeineMg: 0, alcoholG: 18.3 }], name);
  }
});

test('a food that only mentions a drink stays a food when its record has no category', () => {
  for (const name of ['coffee cake', 'Coffee cake with icing', 'tea-smoked duck', 'rum raisin ice cream', 'Cola cake', 'Cola chicken wings', 'Chicken braised in cola', 'Green tea ice cream', 'Espresso chocolate brownie cookie',
    'Coffee beans', 'Tea leaf salad', 'Water chestnuts', 'Watermelon', 'Margarita pizza', 'Mojito chicken', 'Cocktail sausages', 'Cocktail sauce', 'Fruit cocktail', 'Shrimp cocktail', 'Prawn cocktail', 'Seafood cocktail', 'Crab cocktail',
    'Steak with red wine sauce', 'Milk', 'Milk chocolate', 'Pepsi Zero cake', 'Evian bottled water biscuit', 'Snickers bar', 'Pain au chocolat']) {
    assert.equal(isDrinkItem({ name, food_category: null }), false, name);
    assert.equal(drinksFromItems([item({ name, micronutrients: [caffeine(10)] })]).length, 0, name);
  }
});

test('a category still decides before any name: a solid food named like a drink stays a food', () => {
  assert.equal(isDrinkItem({ name: 'Iced coffee', food_category: 'cookies and brownies' }), false);
  assert.equal(isDrinkItem({ name: 'Rum cocktail', food_category: 'Snacks' }), false);
  assert.equal(isDrinkItem({ name: 'coffee cake', food_category: 'Coffee' }), true);
});

test('seafood cocktails are not alcoholic by name', () => {
  for (const name of ['Seafood cocktail', 'Crab cocktail', 'Lobster cocktail']) assert.equal(isAlcoholic({ name, food_category: 'Snacks', micronutrients: [] }), false, name);
  for (const name of ['Rum cocktail', 'Tiki cocktail']) assert.equal(isAlcoholic({ name, food_category: 'Snacks', micronutrients: [] }), true, name);
});
```


## 7. Checks on the local build — #523, #615, #703, #708, #323

Run once, on PR 1's build (PR 1 holds the queue fix and the beer mode), signed in as local test user 2, at 390 × 844. The browser, how it is driven, how a photo is attached, the seed and fixtures F1 and F4 are exactly as "The browser", "Local fixtures" and "The seed" of `docs/plan-fleet21.md` on main say; the two scripted requests "Hold meal opens" and "Fail an added photo's first request" are as "The browser and the fixtures" of `docs/plan-fleet24.md` on main says. `$DB` stands for `"$(grep ^SUPABASE_DB_URL= /tmp/mfa-f26/.env.test.fleet26 | cut -d= -f2-)"`, and `<model>` for the origin of `MODEL_API_BASE_URL` in that file.

Make F1 and F4. F1's 60-second deadline stands. If it is missed again, read and report `psql $DB -Atc "select holder, expires_at - now() from public.worker_lease"` and `psql $DB -Atc "select kind, status, count(*) from public.jobs where status in ('queued','running') group by 1, 2"` at the moment it is missed, report every check that names F1 as not done, and go on.

**Blast radius:** rows in the disposable database only.

| Check | Item | Steps | Record |
|---|---|---|---|
| K1 | #703 | Fleet 24's K1, word for word. | As Fleet 24's K1 says. |
| K2 | #708 | Fleet 24's K2, word for word. | As Fleet 24's K2 says. |
| K3 | #523 | Fleet 24's K4, word for word. | As Fleet 24's K4 says. |
| K4 | #615 | `curl -s -X POST -H 'content-type: application/json' -d '{"mode":"beer-question"}' <model>/__fixture`. Run `scripts/run17-checks.mjs --mode=beer` against the local build, as Fleet 21's PR 11 ran it (its line 4 shows the command; point `--url` at `http://127.0.0.1:60760`). Then, whatever happened, `curl -s -X POST -H 'content-type: application/json' -d '{"mode":null}' <model>/__fixture`. Open Days for today. | The command's exit code and first error; whether the post stayed in the feed with its kcal, whether the question row showed on Home, whether its X dismissed the row without a reload and the post stayed; the line "Your meal needs a reply" in the app's log (`grep -c "needs a reply"` on the app's output; a headless browser cannot see the notification itself); and whether Days counted the beer's kcal. |
| K5 | #323 | Note the time. Open Home once and wait 10 seconds. Run `podman logs --since <that time> mfa-test-auth-60760 2>&1 \| grep -o '"path":"[^"]*"' \| sort \| uniq -c`, and from the browser's network log for the same 10 seconds count the requests by kind: the page itself, RSC requests (`_rsc=` in the address or the header `RSC: 1`), `/api/…` and others. Repeat for Days and for Profile. | Per page: each auth path with its count, and the request counts by kind. The item's line is one sign-in call per page open; this run only measures. |

## 8. The stop

Stop after the reviews and the checks. Report, in this order:
1. For each of the nine PRs: number, branch, full 40-character head, the model that wrote it, each command of step 5 with exit code and counts, and the review receipt link.
2. Items 1 to 19, each done or not done, with what was seen.
3. Every finding outside this plan's diffs, one line each, for the PM.
4. Cleanup: `npm run test:stack -- down` with this plan's variables; `podman ps` shows no container ending in `-60760`; `/tmp/mfa-f26` removed; `scripts/cleanup.sh` output.

Merge nothing. The PM's merge order names each PR and its head.

## 9. After the PM's merge order: production

Merge in this order, each at the head the order names: PR 1, PR 2, PR 3 (then apply migration 0065, below), PR 4, PR 5, PR 6, PR 7, PR 8, then the docs PR last. Wait for the production deployment of the last code merge to be READY before section 9.2 (bound: 10 minutes; if it is not READY, stop section 9 and report).

### 9.1 Migration 0065

`psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -f supabase/migrations/0065_operator_revision.sql`, then `psql "$SUPABASE_DB_URL" -X -c "notify pgrst, 'reload schema'"`. Read back: `select to_regprocedure('public.refresh_operator_saved_meal(uuid,uuid)')` returns the function's name. **Undo:** `supabase/rollbacks/0065_operator_revision.down.sql` the same way. Apply it after PR 3 has merged and before any operator run: PR 3's code calls the function only for an operator job, so ordinary meals are unaffected in the minutes between.

### 9.2 #989, first step: the meals that fail a rule

`$UID` is the owner's account id, found as the Fleet 25 study found it (its private ledger; never printed). The ledger directory is `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/fleet26/private/ledger`, outside the repository (the command refuses one inside it).

1. **List.** `PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=30s' psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -v uid=$UID -f scripts/numbers/14-rule-failures.sql -A -F $'\t' -o <ledger>/failing-before.tsv`. Expected: about 18 meals (premise P1, less the coffee).
2. **Dry run.** `node scripts/numbers/reanalyse.mjs run --mode=rematch --meals-file=<the prefixes from step 1, one per line> --ledger=<ledger> --dry-run`. No write.
3. **Re-match every listed meal**, at most 10 meals per command: `node scripts/numbers/reanalyse.mjs run --mode=rematch --meals-file=<file> --ledger=<ledger> --max-meals=10 --max-minutes=5 --wait-seconds=300`. Each command ends within 10 minutes. Run it again with the meals not yet started until each listed meal has one ledger line. A re-match keeps the foods and portions and looks the nutrition up again; it reads no photo. Expected cost: about 6 model calls and 21,000 tokens per meal (P2), so about 110 calls and 380,000 tokens for 18 meals.
4. **List again** as in step 1, to `failing-after-rematch.tsv`.
5. **Re-analyse what still fails and can be re-analysed** (`can_reanalyse` is `t`): the same command with `--mode=reanalyse`, at most 10 meals per command, the same bounds. A re-analysis reads the photos again from the start. Expected cost: at most about 15 model calls per meal (P2). A meal with `can_reanalyse` `f` is not re-analysed: list it with its reason (a copied meal, a leftovers photo, an owner comment, a drink from the drink sheet, or a job in flight).
6. **List again**, to `failing-after.tsv`. Read the usage with `scripts/numbers/09-usage.sql` for the run's start time.
7. **Put back what came out worse.** A meal is worse when it now fails a rule it did not fail before, or its calories moved by more than half and it fails a rule: `node scripts/numbers/reanalyse.mjs restore --meal=<prefix> --ledger=<ledger> --snapshot=first`. Each restore waits at most 300 s.

**Undo for any meal:** step 7's command. `snapshots.jsonl` holds every row of each meal as it was before the first command touched it. Keep the ledger directory until the PM accepts the result. Never commit it.

**What the owner sees:** the listed meals' numbers change on their cards, their first comment and any saved-meal copy. The phone receives one "meal ready" notification per finished meal (P3).

### 9.3 Report

Per meal (8-character prefix only): rules failed before, mode, outcome, kcal before and after, rules failed after, restored or not. Totals: model calls, tokens and model seconds from 09-usage.sql. The price in money is not available from the usage table; do not estimate one. Then ask GrokBot, through the PM, to open three of the changed meals on production and read the kcal on each card, its first comment and its day's total.

### 9.4 What #990 needs after this

- A sample of the meals that pass every rule, checked against an independent estimate: a second reading of the same photo by another model with no earlier meal as a hint. The next plan names the model, the sample size (the Fleet 25 plan's 20 ordinary meals) and the rubric.
- The other accounts: a read-only count of their ready meals and of those failing a rule, made with 14-rule-failures.sql per account. Whether their meals are re-analysed is the PM's decision.
- Saved meals: a copy made from a meal that this run re-analysed is refreshed by migration 0065. Saved meals whose source meal is deleted, or that have none, are listed with their reason.

## 10. Blast radius, by PR

| PR | What it touches | What could go wrong, and how it would show |
|---|---|---|
| 1 | The queue wake; the traffic label; a test stand-in | A tick blocked by a live lease waits for the lease to expire, then ticks once more; one wait per server instance. A wrong wait shows as a meal that stays "Processing" longer than a minute. |
| 2 | Operator scripts only | Nothing a person uses runs them. |
| 3 | Analysis and recompute jobs; migration 0065 | Every new rule applies only to a job whose payload has "operator". Ordinary meals keep today's behaviour; the tests check both. |
| 4 | Model estimates and drink counting | A food named like a drink could be counted as one; the tests hold "coffee cake", "tea-smoked duck" and "rum raisin ice cream" as foods. |
| 5 | The meal page's poll and failure sentence; Home's refresh | Home could miss an update to an older meal for longer; a new local day still refreshes it once. |
| 6 | Added-photo requests and their messages | A slow but working upload over 120 s now fails and can be tried again. |
| 7 | The capture sheet's loading; the service worker's install | On a first tap before the sheet's file has arrived, the sheet opens a moment later. Offline, the file comes from the cache the worker filled at install. |
| 8 | Deletes nine files nothing imports | A deleted file that something did need would fail the build or a test in step 5. |
| docs | `docs/plan-fleet26.md` | None. |

## 11. For RT

Each line states what this plan does. Nothing here waits on you.

1. **The numbers.** After the merges, the team lists every meal on your account whose numbers break a basic rule (missing, zero, negative, impossible density, impossible portion, or a plain coffee or tea with too many calories). It looks each one up again, and re-reads the photo where the number is still wrong. About 18 meals. Any meal that comes out worse is put back as it was.
2. **What you will notice.** Those meals' numbers change on their cards, in their first comment and in any saved copy, and your phone gets one "meal ready" notification for each meal the run finishes.
3. **A slow first meal.** A new meal could sit at "Processing" for a minute or more after the background worker stopped without finishing. That is fixed.
4. **Added photos.** An added photo that never finishes uploading now fails and says why, and the chip stops saying "Uploading" when nothing is uploading.
