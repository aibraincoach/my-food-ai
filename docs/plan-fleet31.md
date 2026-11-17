# Fleet 31 — #990's remaining steps, the removal's row lock, the overlapping-upload count, and a read-only production proof run (2026-11-17)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** A new plan from the PM's packet of 2026-11-17 21:05Z, the backlog (`/home/opc/pm/my-food-ai/backlog/BACKLOG-web-current.md`, Doc rev 2014), and the Fleet 29 and Fleet 30 production reports. It has two code PRs and one docs PR, one local check, one stop before the merges, and one production section after the PM's merge order. Planned from main `1a62479088b6384edf5484b76da8e20553d65216`.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix. A defect you find goes to the PM as one line for the backlog, and nothing more. A Find text that does not occur exactly once is skipped and reported, never rewritten.

**Stops: one**, before the merges (section 7). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void; the rest continues), and an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes, and the waits of sections 8 and 9 add up to at most 45 minutes (the PM's standing confirmation): section 8 at most 40, section 9 at most 5 (B6's 30 seconds and B7's 150 seconds). Nothing here is a long run under AGENTS.md.

**Nothing runs against production before the merge order.** Every job of section 8 is an operator job, so no phone gets a notification (#1001). Section 9 writes nothing at all.

## 1. The items

| # | Item | What changes | Where |
|---|---|---|---|
| 1 | #1040 | `18-remove.sql` locks the meal's row before its readiness check; a test runs a concurrent queue change against it | PR 1 |
| 2 | #990 | Rule g1 leaves out a coffee or tea matched to a record that holds milk (meal 1c4f16bf) | PR 2 |
| 3 | #990 | A read-only report of every saved meal and copy against its source (`19-saved.sql`) | PR 2, section 8 |
| 4 | #990 | The study of the fixed sample of 20 passing meals against an independent estimate, with a bounded re-analysis of any that disagree | section 8, S1 to S5 |
| 5 | #990 | The other account with failing meals (fe79cc4a) re-analysed or listed; saved meals and copies listed | section 8, O1 to O3 |
| 6 | #990 | The four meals that still fail: one cleared by item 2, three listed with their reason | section 8, F1 |
| 7 | #1021 | A read-only script prints each meal's card, first-comment and day calories as the app computes them (`cards.mjs`) | PR 2, section 9, Q1 |
| 8 | #1041, #937 | The overlapping first-upload count, measured with a corrected helper | check K3 |
| 9 | Backlog for GrokBot | A read-only production proof run as test account 2 at 390 wide, plus read-only SQL | section 9 |

## 2. Facts the planner checked on 2026-11-17, and premises

- **Why Fleet 30's K3 never saw the first card.** Its helper read the `operation_id` from the body of `POST /api/posts` and waited for `article[data-upload-id]` to equal it. They are two different random ids: `PostUploadDraft` (`src/lib/posts/create.ts` line 48) makes the reservation's id, which becomes the post id; `uploadManager.stage()` (`src/lib/posts/upload-manager.ts` line 149) makes the card's operation id. The card did show "Uploading photo…". The predicate could never be true.
- **The corrected helper passed 4 of 4 runs on the planner's stack** (main `1a624790` with PR 1 and PR 2, built app, fake model): the first card showed "Uploading photo…" 2 to 11 ms after the sheet closed, the second upload started while it was uploading, both meals were ready within 6.4 to 7.1 seconds, and 2 or 3 responses under `/posts/` were recorded, all 200. No 404. Besides the id, it needed two waits: for the entry menu before it taps Camera (600 ms), and for the capture sheet (`[aria-label="Capture content"]`) before it hands the sheet the photo. Without them the tap or the photo was lost. The helper is `/home/opc/.claude/plans/fleet31-k3.mjs`, sha256 `9f1731fe425f6f601a63b747cef7d9d81bd939171169d1f3f0e0e79f821e722f`. It is Fleet 30's `checks/native-k.mjs` with those three changes, a named condition in each timed-out wait, and its URL and output folder taken from `APP_URL` and `K3_OUT`.
- **PR 1's test fails on main and passes with the fix.** On main's `18-remove.sql`, a removal that waits behind a writer holding the meal (queued, a job inserted, then commit) still supersedes the foods and queues a second job (it printed `…|recompute|200`). With the lock it prints nothing and both foods stay current. A writer that inserts a job without touching the meal's row is not held back by the lock; the removal's statement then still sees every job committed before it starts.
- **PR 2's rules test fails on main** (14 listed the milk-matched coffee too) and passes with the fix. 03 and 04 already found each record's description (`cache_foods`, `described0`, `described`); 14 did not, so PR 2 copies those three CTEs into 14 word for word.
- **The census** (Fleet 29, `fleet29-postmerge/report.md`): six accounts with ready meals. Only 02b7a48c (the owner, now 4 failing meals) and fe79cc4a (7 failing) fail a rule. Saved meals: fe79cc4a 1, 98f58d0a 3. Copies: fe79cc4a 2. None is "saved without a meal".
- **The sample frame** is `fleet29-postmerge/private/ledger/sample-frame.txt`: 20 owner meal prefixes, taken in `md5(id||'fleet29')` order from meals that passed every rule.
- **#990's own test** (its issue body, from the Fleet 25 study): keep a new result only when it is within 25% of the independent estimate or the photo check prefers it.
- **Day totals are not stored.** Home and Days sum them in `src/lib/posts/days.ts` (`getDays`) and round them with `formatCalories` (`src/lib/nutrition/totals.ts`). `cards.mjs` calls those two functions, so it repeats the app's numbers without copying its arithmetic. It cannot show what a screen draws; section 9 says where that matters.
- **The four failing meals** (Fleet 30 report): 6fad4a16 a2 and e (the salami: its USDA record has no value for one nutrient and its weight is unknown; owner comments block a blind re-analysis); 1c4f16bf g1 (the coffee's name, its milk-based record); a0e6b3bf e and e7e1782c e (3 g portions the owner gave in a comment).
- **Leftovers refusals** (`src/lib/posts/attach-photo.ts` lines 9 to 15): a meal that has drinks, eight photos, or is not ready refuses an added photo with its own sentence; anything else reads "The photo could not be attached." Q6 reads the owner's two failed meals for these causes.
- **The slow-network test profile** is 150 ms latency, 1.6 Mbit/s down and 0.75 Mbit/s up (`scripts/run17-checks.mjs` line 66, `docs/media-loading.md`).
- **Verified on the planner's stack** with PR 1 and PR 2 together: `npx tsc --noEmit` clean; `npx eslint` on the changed files clean; the numbers tests 3 of 3; the database suite 51 of 51; the application suite 777 of 783 (6 skips, 0 failures).

## 3. Not in this run, and why

Engineering backlog:

- **#999** (black camera on the Photo screen), **#212** (barcode and label through the camera), **#594** (where a photo is saved), **#579**'s real-camera part: each needs a physical phone.
- **#1000** (merge two posts): a new feature with no design and undecided rules.
- **#373**, **#375** (egress and log bytes): need the Supabase usage page's byte figures, which no seat can read.
- **#368**, **#279** (sign-in rate limits, CAPTCHA): need throwaway sign-ups at speed and the owner's phone; CAPTCHA stays off by ruling.
- **#687**: its production half is B11 of section 9; the portal check is the owner's.
- **#689**: its production half is B12 of section 9; the merged-head reviews are review work, not a plan step.
- **#578**: 25 audit findings await a ruling on each; no item text to plan to.
- **#60**: the start-here README waits for the last feature.
- **#553**, **#552**, **#217**: each needs taps that save a vote or a post, so not a read-only run; and #217 needs a slowed-processor table of every control.
- **#571**, **#683**, **#708**: each needs a failed or overlapping upload made on purpose. #571's overlap is K3; its "could not be saved" toast is not reproduced, and K3 records whether it appears.
- **#694**, **#285**, **#617**: written findings from read-only pulls of the owner's data, larger than one fleet; #990's sample (S1 to S5) is the first measured part of #694.
- **#523**: its done line is read by Q5 of section 9.

In flight: #659 (docs merged in #1039), #1018 (merged in #1038), #703 (Fleet 30's K2 passed: second failure shown, no overlay after release, Back lands Home) and #1022 (merged in #1036; its done line asks the owner to agree with wrapping) have nothing left to plan; the PM decides their closing. #937 and #990 are planned here.

Backlog for GrokBot: section 9 lists every item and how it can be read.

## 4. How it runs

1. **Worktrees.** One fresh worktree per PR from `origin/main`, under `/tmp/mfa-f31`. Before any test in a worktree: `npm ci`.
2. **Your own stack.** `TEST_PORT_BASE=61360 TEST_PG_PORT=55649 TEST_STACK_DIR=/tmp/mfa-f31/stack TEST_ENV_FILE=.env.test.fleet31`. Keep `TEST_STACK_DIR` short (a Postgres socket path over 107 bytes is refused). Never stop or touch a container that does not end in `-61360`. If the stack reports "Local service did not become ready", remove the stack directory and the env file and start it once more.
3. **Tests.** Load the env file (`set -a; . ./.env.test.fleet31; set +a`), then `PATH="$PWD/tests/bin:/usr/pgsql-17/bin:$PATH" TZ=UTC MFA_TEST_DISPOSABLE=1 timeout 600 node --import ./tests/fixtures/local-providers.mjs --import tsx --test <files>`. The two numbers tests need only the stack's database.
4. **Suites.** The application suite (`npm test`, with the built app started) and the database suite (`npm run test:db`) once each, on a scratch branch that merges both PRs locally (never pushed), with the same env. Bound: 10 minutes each.
5. **Per PR:** apply the edits; `node --check` on each changed `.mjs`; `npx tsc --noEmit`; `npx eslint <changed files>`; the PR's named tests. Also run each PR's test once on main's files (before the edits) and report that it fails.
6. **Reviews.** One PPLX review per code PR on its final head, full 40-character SHA, with main's runner. AGY when PPLX is unavailable. The docs PR needs no review.
7. **Check K3** (section 6.1), on the scratch branch of step 4.
8. **Docs PR**, branch `docs/fleet31` from `origin/main`: this plan unchanged as `docs/plan-fleet31.md`.
9. **Stop** (section 7).

## 5. The code PRs

### PR 1 — branch `fix31/remove-lock` — #1040

The removal locks the meal's row in its own statement first. The statement that checks and writes then takes its snapshot only once the lock is held, so a writer that changed the meal's row before it (for example queued it) is seen, and one that comes after waits. A lock inside the same statement would not do: its readiness subqueries would still read the older snapshot. Its output goes to `/dev/null`, so a refusal still prints nothing, as before.

File `scripts/numbers/18-remove.sql`.

Find:
```
-- psql variables: post (the full meal id) and item (the full id of the current food to remove).
begin;
with meal as (
  select p.id from public.posts p
```
Replace:
```
-- psql variables: post (the full meal id) and item (the full id of the current food to remove).
begin;
-- #1040: lock the meal's row before the readiness check. A writer that changes the row (queues the meal, changes
-- its status) waits until this transaction ends, and the statement below takes its snapshot only once the lock is
-- held, so it sees every such change committed before. The lock's own output is discarded.
select id from public.posts where id = :'post'::uuid for update \g /dev/null
with meal as (
  select p.id from public.posts p
```


File `tests/numbers-remove.test.mjs`.

Find:
```
import { execFileSync } from 'node:child_process';
```
Replace:
```
import { execFileSync, spawn } from 'node:child_process';
```

Find:
```
  assert.equal(remove(post, last).trim(), '', 'the last food of a meal is never removed');
});
```
Replace:
```
  assert.equal(remove(post, last).trim(), '', 'the last food of a meal is never removed');
});

// #1040: a writer that queues the meal while the removal waits must win; the removal then changes nothing.
test('18-remove.sql waits for a concurrent queue change and then refuses the meal', { skip: !process.env.TEST_SQL_DATABASE_URL }, async t => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const sql = input => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { input, encoding: 'utf8', timeout: 10000 });
  const user = randomUUID(), post = randomUUID(), coffee = randomUUID(), milk = randomUUID(), app = `remove-${post.slice(0, 8)}`;
  t.after(() => sql(`delete from posts where id='${post}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`));
  sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','remove-${user.slice(0, 8)}');
insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now());
insert into post_items(id,post_id,name,source,portion_grams)values('${coffee}','${post}','Vietnamese drip coffee','model',100),('${milk}','${post}','sweetened condensed milk','model',30);`);
  // The other writer: it holds the meal's row, queued, until this test lets it commit.
  const writer = spawn('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { stdio: ['pipe', 'pipe', 'pipe'] });
  const writerDone = new Promise(resolve => writer.on('close', resolve));
  writer.stdin.write(`begin;update posts set status='queued' where id='${post}';select 'held';\n`);
  await new Promise((resolve, reject) => { writer.stdout.on('data', chunk => { if (String(chunk).includes('held')) resolve(); }); writer.on('close', () => reject(new Error('writer ended early'))); });
  const removal = spawn('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-v', `post=${post}`, '-v', `item=${milk}`, '-f', file], { env: { ...process.env, PGAPPNAME: app } });
  let output = '';
  removal.stdout.on('data', chunk => { output += chunk; });
  const removalDone = new Promise(resolve => removal.on('close', resolve));
  let waiting = false;
  for (let i = 0; i < 50 && !waiting; i += 1) {
    waiting = sql(`select count(*) from pg_stat_activity where application_name='${app}' and wait_event_type='Lock';`).trim() === '1';
    if (!waiting) await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(waiting, 'the removal waits on the meal row');
  writer.stdin.end(`insert into jobs(post_id,kind,priority,status)values('${post}','recompute',100,'queued');commit;\n`);
  await writerDone;
  assert.equal(await removalDone, 0);
  assert.equal(output.trim(), '', 'the removal queued nothing');
  assert.equal(sql(`select count(*) from post_items where post_id='${post}' and superseded_at is null;`).trim(), '2', 'both foods are still current');
  assert.equal(sql(`select count(*) from jobs where post_id='${post}';`).trim(), '1', 'only the other writer queued a job');
});
```


Named test: `tests/numbers-remove.test.mjs` (2 tests). The new one fails on main's `18-remove.sql` with "the removal queued nothing" (actual: one job line).

### PR 2 — branch `fix31/numbers-rules` — #990, #1021

Rule g1 asks for a plain coffee or tea. A coffee whose matched record holds milk is not plain, whatever its name says; 1c4f16bf's coffee is matched to USDA 171880, "Beverages, coffee, ready to drink, milk based, sweetened". The rule now reads the record's description, as rule i already does in 03. Two new read-only files serve section 8 and section 9.

File `scripts/numbers/03-suspicious.sql`.

Find:
```
    and not (name ~* '\miced\M' and name ~* '\mtea\M' and calories / portion_grams <= 0.40)
  union all
```
Replace:
```
    and not (name ~* '\miced\M' and name ~* '\mtea\M' and calories / portion_grams <= 0.40)
    -- #990: a coffee or tea matched to a record that holds milk (USDA 171880, "Beverages, coffee, ready to drink, milk
    -- based, sweetened") is not plain, whatever its name says.
    and coalesce(record_description, '') !~* '\mmilk\M'
  union all
```


File `scripts/numbers/04-summary.sql`.

Find:
```
    and not (name ~* '\miced\M' and name ~* '\mtea\M' and calories / portion_grams <= 0.40)
  union all
```
Replace:
```
    and not (name ~* '\miced\M' and name ~* '\mtea\M' and calories / portion_grams <= 0.40)
    -- #990: a coffee or tea matched to a record that holds milk (USDA 171880, "Beverages, coffee, ready to drink, milk
    -- based, sweetened") is not plain, whatever its name says.
    and coalesce(record_description, '') !~* '\mmilk\M'
  union all
```


File `scripts/numbers/14-rule-failures.sql`.

Find:
```
-- It repeats rules a1, a2, b, d, e, f and g1 of 03-suspicious.sql word for word (not c, g2, h or i),
```
Replace:
```
-- It repeats rules a1, a2, b, d, e, f and g1 of 03-suspicious.sql word for word (not c, g2, h or i), and 03's way of
-- finding each record's description (cache_foods, described0, described), which g1 reads,
```

Find:
```
         n.fibre_g, n.sugar_g, n.sodium_mg, n.food_category
```
Replace:
```
         n.fibre_g, n.sugar_g, n.sodium_mg, n.source_ref, n.food_category,
         coalesce(n.micronutrients, '[]'::jsonb) as micro
```

Find:
```
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
), flags as (
```
Replace:
```
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
), cache_foods as (
  -- One description per record, chosen the same way every run and by the rule of 06-seafood.sql:
  -- a detail entry ('fdc_cache detail') wins over a search entry ('fdc_cache search'); then the first description in text order.
  select distinct on (fdc_id) fdc_id, description from (
    select (f->>'fdcId') as fdc_id, f->>'description' as description, 'fdc_cache search' as found_in
    from public.fdc_cache c
    cross join lateral jsonb_array_elements(case when jsonb_typeof(coalesce(c.response->'payload'->'foods', c.response->'foods')) = 'array'
                                             then coalesce(c.response->'payload'->'foods', c.response->'foods') else '[]'::jsonb end) f
    union all
    select coalesce(c.response->'payload'->>'fdcId', c.response->>'fdcId'), coalesce(c.response->'payload'->>'description', c.response->>'description'), 'fdc_cache detail'
    from public.fdc_cache c where c.query like 'fdc-detail:%'
  ) d
  where fdc_id in (select source_ref from items where source_ref ~ '^[1-9][0-9]*$') and description is not null
  order by fdc_id, found_in, description
), described0 as (
  select it.*,
         coalesce((select m->'approximation'->>'basis' from jsonb_array_elements(case when jsonb_typeof(it.micro) = 'array' then it.micro else '[]'::jsonb end) m
                    where m->'approximation'->>'kind' = 'closest' limit 1), cf.description) as raw_description
  from items it left join cache_foods cf on cf.fdc_id = it.source_ref
), described as (
  select d0.*, case when raw_description like 'Combined %' then regexp_replace(raw_description, ' for .*$', '') else raw_description end as record_description
  from described0 d0
), flags as (
```

Find:
```
  select post_id, item_id, 'g1' from items
```
Replace:
```
  select post_id, item_id, 'g1' from described
```

Find:
```
    and not (name ~* '\miced\M' and name ~* '\mtea\M' and calories / portion_grams <= 0.40)
), failing as (
```
Replace:
```
    and not (name ~* '\miced\M' and name ~* '\mtea\M' and calories / portion_grams <= 0.40)
    -- #990: a coffee or tea matched to a record that holds milk (USDA 171880, "Beverages, coffee, ready to drink, milk
    -- based, sweetened") is not plain, whatever its name says.
    and coalesce(record_description, '') !~* '\mmilk\M'
), failing as (
```


File `scripts/numbers/README.md`.

Find:
```
17-census.sql is read-only too and takes no variable: one row per account with a ready meal (its first 8 characters), with its ready meals, copies, saved meals and saved meals whose meal is gone (#990).
```
Replace:
```
17-census.sql is read-only too and takes no variable: one row per account with a ready meal (its first 8 characters), with its ready meals, copies, saved meals and saved meals whose meal is gone (#990).

Rule g1 (plain coffee or tea above 0.25 kcal per gram) leaves out a coffee or tea whose matched record's description holds "milk" (#990), so 14 finds each record's description the way 03 does.

19-saved.sql is read-only and takes no variable: one row per saved meal and per copied meal, with its account and meal prefixes, its foods and calories against its source meal's current ones, and which of rules a2, d, e and f its saved foods fail (#990). It prints no name, caption or comment.

cards.mjs only reads: for each meal prefix, the calories its card shows, the calories its first model comment states and its day's total, computed and rounded by the app's own code (getDays, formatCalories), beside the stored sum of its foods (#1021). Run it with `node --import tsx scripts/numbers/cards.mjs --zone=<IANA zone> <prefix> ...` and NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY set. It prints prefixes, dates and numbers only.
```


New files (section 6): `scripts/numbers/19-saved.sql`, `scripts/numbers/cards.mjs`, `tests/numbers-rules.test.mjs`.

Named test: `tests/numbers-rules.test.mjs` (1 test). It fails on main's 03, 04 and 14 with "14 lists only the plain coffee". Also run `19-saved.sql` once on the stack with one saved meal and one copy you insert (delete them afterwards) and `cards.mjs` once on two meals you insert, and report that each printed its rows.

## 6. The new files

### `scripts/numbers/19-saved.sql`

```
-- #990: every saved meal and every copied meal, against the meal it came from. Read-only, one SELECT, no variables.
-- A saved meal keeps the foods and nutrition of its source meal as they were when it was saved (saved_meals.items);
-- a copy is a meal logged again from a saved meal or a meal (posts.source_post_id). The row says whether its calories
-- still match its source's current foods, and which of rules a2, d, e and f of 03-suspicious.sql its own foods fail.
-- Prefixes only: no name, caption or comment is printed.
with saved as (
  select 'saved' as kind, s.user_id, s.id, s.source_post_id,
         (select count(*) from jsonb_array_elements(s.items)) as foods,
         (select sum((e->'nutrition'->>'calories')::numeric) from jsonb_array_elements(s.items) e) as kcal,
         (select string_agg(distinct r, ',' order by r) from jsonb_array_elements(s.items) e
            cross join lateral (values
              (case when e->'nutrition'->>'calories' is null or e->'nutrition'->>'protein_g' is null
                      or e->'nutrition'->>'carbs_g' is null or e->'nutrition'->>'fat_g' is null then 'a2' end),
              (case when (e->>'portion_grams')::numeric > 0 and ((e->'nutrition'->>'calories')::numeric / (e->>'portion_grams')::numeric < 0
                      or (e->'nutrition'->>'calories')::numeric / (e->>'portion_grams')::numeric > 9) then 'd' end),
              (case when ((e->>'portion_grams') is null and not (e->'nutrition'->>'calories' is not null and e->>'portion_text' ~ '^[0-9]+([.][0-9]+)? ml$'))
                      or (e->>'portion_grams')::numeric < 5 or (e->>'portion_grams')::numeric > 1500 then 'e' end),
              (case when (e->'nutrition'->>'calories')::numeric < 0 or (e->'nutrition'->>'protein_g')::numeric < 0
                      or (e->'nutrition'->>'carbs_g')::numeric < 0 or (e->'nutrition'->>'fat_g')::numeric < 0 then 'f' end)) v(r)
            where r is not null) as rules
  from public.saved_meals s
), copies as (
  select 'copy' as kind, p.user_id, p.id, p.source_post_id,
         (select count(*) from public.post_items i where i.post_id = p.id and i.superseded_at is null) as foods,
         (select sum(n.calories) from public.post_items i join public.item_nutrition n on n.post_item_id = i.id
            where i.post_id = p.id and i.superseded_at is null) as kcal,
         null::text as rules
  from public.posts p where p.source_post_id is not null and p.status = 'ready' and p.deleted_at is null
), source as (
  select p.id, p.status, p.deleted_at is not null as deleted,
         (select count(*) from public.post_items i where i.post_id = p.id and i.superseded_at is null) as foods,
         (select sum(n.calories) from public.post_items i join public.item_nutrition n on n.post_item_id = i.id
            where i.post_id = p.id and i.superseded_at is null) as kcal
  from public.posts p where p.id in (select source_post_id from saved union select source_post_id from copies)
)
select x.kind, left(x.user_id::text, 8) as account, left(x.id::text, 8) as meal, left(x.source_post_id::text, 8) as source,
       x.foods, round(x.kcal, 1) as kcal, s.foods as source_foods, round(s.kcal, 1) as source_kcal,
       case when x.source_post_id is null then 'no source'
            when s.id is null then 'source gone'
            when s.deleted then 'source deleted'
            when s.status <> 'ready' then 'source ' || s.status
            when x.foods = s.foods and round(x.kcal, 1) is not distinct from round(s.kcal, 1) then 'matches source'
            else 'differs from source' end as against_source,
       coalesce(x.rules, '') as rules
from (select * from saved union all select * from copies) x left join source s on s.id = x.source_post_id
order by x.kind desc, account, meal;
```


### `scripts/numbers/cards.mjs`

```
// #1021, #990: for each meal, the calories its card shows, the calories its first model comment states, and its
// day's total, computed and rounded the way the app does (getDays, formatCalories), beside the stored sum of its
// current foods. It only reads. It prints meal prefixes, dates and numbers: no name, caption or comment text.
// Use: node --import tsx scripts/numbers/cards.mjs --zone=Asia/Jakarta <8-character prefix> [...]
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in the environment.
import { createClient } from '@supabase/supabase-js';
import { getDays, dateInZone, validZone } from '../../src/lib/posts/days.ts';
import { formatCalories } from '../../src/lib/nutrition/totals.ts';

const args = process.argv.slice(2);
const zoneArg = args.find(arg => arg.startsWith('--zone='));
const prefixes = args.filter(arg => !arg.startsWith('--'));
if (!zoneArg || !prefixes.length || prefixes.some(p => !/^[0-9a-f]{8}$/.test(p))) {
  console.error('Use: node --import tsx scripts/numbers/cards.mjs --zone=<IANA zone> <8-character prefix> [...]');
  process.exit(2);
}
const zone = validZone(zoneArg.slice('--zone='.length));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const read = result => { if (result.error) throw new Error('A read failed.'); return result.data; };

console.log('meal|day|card_kcal|first_comment_kcal|day_kcal|stored_kcal');
for (const prefix of prefixes) {
  const posts = read(await db.from('posts').select('id,user_id,eaten_at,status')
    .gte('id', `${prefix}-0000-0000-0000-000000000000`).lte('id', `${prefix}-ffff-ffff-ffff-ffffffffffff`).is('deleted_at', null));
  if (posts.length !== 1) { console.log(`${prefix}|${posts.length} meals match|||`); continue; }
  const [post] = posts;
  const day = dateInZone(post.eaten_at, zone);
  const [logged] = await getDays(db, post.user_id, zone, day, day);
  const card = logged?.posts.find(entry => entry.id === post.id);
  const [comment] = read(await db.from('post_comments').select('body').eq('post_id', post.id).eq('author', 'model')
    .is('reverted_at', null).order('created_at', { ascending: true }).limit(1));
  const stated = comment?.body.match(/(\d[\d,]*(?:\.\d+)?)\s*kcal/i)?.[1] ?? '';
  const items = read(await db.from('post_items').select('item_nutrition(calories)').eq('post_id', post.id).is('superseded_at', null));
  const stored = items.reduce((sum, item) => sum + Number([item.item_nutrition].flat()[0]?.calories ?? 0), 0);
  console.log([prefix, day, card ? formatCalories(card.totals.calories) : `not listed (${post.status})`, stated,
    logged ? formatCalories(logged.totals.calories) : '', Math.round(stored * 10) / 10].join('|'));
}
```


### `tests/numbers-rules.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// #990: rule g1 (plain coffee or tea above 0.25 kcal per gram) leaves out a coffee matched to a record that holds
// milk, in 03, 04 and 14 alike, and still flags a plain coffee.
const rules = name => fileURLToPath(new URL(`../scripts/numbers/${name}`, import.meta.url));
test('rule g1 leaves out a coffee matched to a milk record and keeps a plain one, in 03, 04 and 14', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const sql = input => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { input, encoding: 'utf8', timeout: 10000 });
  const run = (file, uid) => execFileSync('psql', ['-X', '-qAt', '-F', '|', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-v', `uid=${uid}`, '-f', rules(file)], { encoding: 'utf8', timeout: 10000 });
  const user = randomUUID(), milky = randomUUID(), plain = randomUUID(), milkyItem = randomUUID(), plainItem = randomUUID();
  const milkRecord = '990000171', plainRecord = '990002710';
  t.after(() => sql(`delete from posts where user_id='${user}';delete from profiles where id='${user}';delete from auth.users where id='${user}';
delete from fdc_cache where query in ('fdc-detail:${milkRecord}','fdc-detail:${plainRecord}');`));
  sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','rules-${user.slice(0, 8)}');
insert into posts(id,user_id,status,analysis_initialized_at)values('${milky}','${user}','ready',now()),('${plain}','${user}','ready',now());
insert into post_items(id,post_id,name,source,portion_grams)values('${milkyItem}','${milky}','Vietnamese iced coffee','model',100),('${plainItem}','${plain}','black coffee','model',100);
insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,source_ref)values('${milkyItem}',71,1.98,12.6,1.38,'${milkRecord}'),('${plainItem}',30,0.1,0,0,'${plainRecord}');
insert into fdc_cache(query,response)values
 ('fdc-detail:${milkRecord}','{"kind":"fdc-detail-v1","fdcId":${milkRecord},"payload":{"fdcId":${milkRecord},"description":"Beverages, coffee, ready to drink, milk based, sweetened"}}'),
 ('fdc-detail:${plainRecord}','{"kind":"fdc-detail-v1","fdcId":${plainRecord},"payload":{"fdcId":${plainRecord},"description":"Beverages, coffee, brewed, prepared with tap water"}}');`);
  const failing = run('14-rule-failures.sql', user).trim().split('\n').filter(Boolean).map(line => line.split('|').slice(0, 3).join('|'));
  assert.deepEqual(failing, [`${plain.slice(0, 8)}|1|g1`], '14 lists only the plain coffee');
  const suspicious = run('03-suspicious.sql', user).trim().split('\n').filter(line => line.includes('|g1 '));
  assert.deepEqual(suspicious.map(line => line.split('|')[0]), [plain.slice(0, 8)], '03 flags only the plain coffee');
  const summary = run('04-summary.sql', user).trim().split('\n').filter(line => line.startsWith('g1 '));
  assert.deepEqual(summary.map(line => line.split('|').slice(1, 3).join('|')), ['1|1'], '04 counts one item in one meal');
});
```


### 6.1 The check

- **K3, #1041 and #937.** Copy `/home/opc/.claude/plans/fleet31-k3.mjs` (check its sha256 above) outside Git. With the scratch branch's app built and started, run `MFA_TEST_DISPOSABLE=1 K3_OUT=<a private folder, mode 0700, with an empty private/ inside> timeout 600 node fleet31-k3.mjs K3 <scratch worktree> <its .env.test.fleet31> <the build marker in data-build>`. It signs in as local test user 1, holds the first upload's `POST /api/posts` response, waits for the new card with "Uploading photo…" (at most 15 seconds), starts the second upload while that card still shows it, releases the hold, and follows both meals until ready (at most 5 minutes). It records every response under `/posts/` and `/api/posts/` with its status, and for a 404 the cards and which one was uploading. It removes its two meals and their stored files. Run it once; if it fails, report its `firstError` and do not run it again. Report: `firstCardMs`, `secondStartedWhileFirstUploading`, `firstStillUploadingAfterSecondPost`, `bothReady`, `elapsedUntilBothReadyMs`, `responseCount`, `notFoundCount` (expected 0), any 404 with its 8-character path, time and uploading card, whether "The meal could not be saved" appeared (#571), and the cleanup rows. Its limits go in the report as the helper writes them: one held response, a generated photo through the `capture-files` event, the fake model.

## 7. The stop

Stop when both code PRs and the docs PR are open, each code PR reviewed or reported "written, not reviewed", and K3 is reported. Report to the PM, in one message:

1. Each PR: number, branch, final head (40 characters), tests and their counts, the red result on main, and the review's result.
2. The two suites' counts.
3. K3, with the numbers it asks for.
4. Anything void under section 2.
5. The merge order this plan expects: PR 1, PR 2, then the docs PR. Sections 8 and 9 need PR 2 on main; neither needs a new deployment.

Then wait for the PM's merge order. It names each PR and its full head SHA.

## 8. After the PM's merge order: #990

Run this only after every PR of the merge order has merged, from a fresh worktree of the new main. Keep every private file in a new ledger, `state/build/fleet31-postmerge/private/ledger`, mode 0700, files 0600. Print and commit meal and account prefixes only, never a caption, comment or photo. Reads use a read-only session (`PGOPTIONS='-c default_transaction_read_only=on'`). The restore rule holds throughout: a meal that loses any value it had is put back (`reanalyse.mjs` does this by itself), and so is a meal kept against the rule of S4.

- **R1, the list.** `14-rule-failures.sql` with the owner's id. Expected: 6fad4a16, a0e6b3bf and e7e1782c; 1c4f16bf no longer listed (PR 2). Any other meal: list it and leave it.
- **F1, the three that stay.** Record each with its reason, no write: 6fad4a16 "the salami's weight is not known; the bag's printed weight is needed from the owner (section 10)"; a0e6b3bf and e7e1782c "the owner gave 3 g in a comment; rule e's 5 g floor is a guess and the owner's figure stands".
- **O1, the other account.** `14-rule-failures.sql` with fe79cc4a's full id (from the census, in memory only). List each failing meal: prefix, rules, kcal, `can_reanalyse`.
- **O2.** The meals O1 shows with `can_reanalyse` true, at most 7: `timeout 600 node scripts/numbers/reanalyse.mjs run --mode=reanalyse --meals=<prefixes> --ledger=<new ledger> --max-meals=7 --wait-seconds=240`. Meals with `can_reanalyse` false are listed with the guard that refuses them (a person's comment, a leftovers photo, a copy, a sheet drink or a job). Then `14-rule-failures.sql` for fe79cc4a again.
- **O3, saved meals and copies.** `19-saved.sql`, read-only, once. Record each row. A saved meal or copy is the person's own saved selection, and no numbers tool writes one, so none is changed: one that "matches source" is recorded as checked; one that "differs from source" or fails a rule is listed with its numbers and the reason (for example, its source was re-analysed after it was saved).
- **S1, the sample's photos.** For each of the 20 prefixes in `fleet29-postmerge/private/ledger/sample-frame.txt`, download its photos (service key, read only) and its caption into `<new ledger>/sample/<prefix>/`. Write no number from the meal into that folder.
- **S2, the independent estimate, blind.** Before you read any stored number of these meals, for each meal look at its photos and caption and write one line to `<new ledger>/sample/estimates.jsonl`: `{"meal":"<prefix>","foods":[{"name":…,"grams":…,"fdcId":…,"kcal_per_100g":…}],"kcal":…,"at":"<time>"}`. Pick each food's grams from the photo and caption yourself, and its USDA record by your own FoodData Central search (`$FDC_API_KEY`, read-only). Do not use the app's matcher or its stored items. If your seat cannot view images, stop S2 and report it; S3 to S5 then do not run.
- **S3, the comparison.** `cards.mjs --zone=Asia/Jakarta` over the 20 prefixes; take `stored_kcal`. A meal agrees when |stored − estimate| ≤ 25% of the estimate.
- **S4, the meals that disagree,** at most 5, in frame order. For each: `timeout 600 node scripts/numbers/reanalyse.mjs run --mode=reanalyse --meals=<prefix> --ledger=<new ledger> --max-meals=1 --wait-seconds=240`. `12-reanalyse.sql`'s guards refuse a meal with a comment by the person, a leftovers photo, a copy, a sheet drink or a job; the tool then records it as skipped, and it is listed with that reason. Keep the new result only when the tool kept it and either its calories are within 25% of the estimate, or your look at the photo prefers its foods and portions (one sentence in the ledger: what is better). Otherwise put it back: `reanalyse.mjs restore --meal=<prefix> --ledger=<new ledger> --snapshot=last --wait-seconds=240`. A disagreeing meal the guards refuse is listed with its guard.
- **S5, the sample's result.** The number that agree out of 20. With 17 or more, the sample is the disposition for passing meals: unflagged meals are rarely wrong, and #990 needs no wider pass. With fewer, report the disagreeing meals with the step that went wrong for each (food named, record matched, weight, stored value), and run nothing more.
- **P1, the list and the usage.** `14-rule-failures.sql` for the owner and fe79cc4a, and `09-usage.sql` since O2 began.

Stop conditions: a command that exits 1; a restore that does not take; 40 minutes of waiting in all, counted from O2. A stop ends section 8; report what ran.

**What section 8 reports.** R1 and F1; O1 to O3, each meal with prefix, rules before, what ran, outcome, kcal before and after, rules after; S2's 20 estimates against S3's 20 stored totals (prefix, estimate, stored, agrees); S4's meals with their outcome and reason; S5's count; P1's usage. Then section 9's Q1 for every meal that changed.

## 9. The read-only production proof run (Backlog for GrokBot)

This writes nothing on production. The browser part signs in as test account 2 in fresh native Chromium with CDP at 390 by 844, DPR 3, with the read-only request guard of Fleet 30's `acceptance/read-only-chromium.mjs` (worker wakes and external POSTs blocked, service workers bypassed) and a fresh profile per check. A check that needs a tap that would save something is not in this run. The SQL part uses a read-only session. Print prefixes, sizes, times and counts; no caption, comment text or photo leaves the private folder. Each check's bound is 10 minutes. Record each as met, not met or not checked, with its numbers.

**How each GrokBot item can be read:**

| Item | Read here? | How, or why not |
|---|---|---|
| #323 | Browser half | B1. The server's checks need the server log; the coder gets 403 on Vercel runtime logs |
| #628 | No: needs writes | Its beer and post-close runs post on test account 2 |
| #615 | No: needs a write and a phone | Needs a beer post on purpose; the notification needs a phone |
| #684 | SQL half | Q6 reads the owner's two failed meals. Saving a leftovers photo needs a write; the owner's chip is on the owner's phone |
| #1021 | Yes | Q1 (stored and computed numbers). The owner's screens need the owner's sign-in |
| #988 | Yes | Q3 |
| #987 | Yes | Q4 |
| #972 | Partly | B10: Home's first-load JavaScript and whether the sheet's code loads on the first tap. Offline opening needs the service worker, which the guard bypasses |
| #970 | No: needs writes | Each refusal needs an added photo |
| #969 | No: needs a write | Needs an added-photo request that never answers |
| #120 | Yes | B7 |
| #973 | If one exists | B13: only if test account 2 has a failed meal with no photo |
| #968 | No: needs a write | Needs a meal that is updating |
| #456 | Yes | Q2 |
| #377 | Yes | Q3 |
| #222 | Yes | B2 |
| #512 | No: local only | Its done line is on the disposable stack with three seeded months; not a production check |
| #454 | Yes | B4 |
| #955 | Yes, approximately | B5. "Largest text size" is a phone setting; CDP's font sizes approximate it |
| #372 | Yes | B2 |
| #494 | Yes | B3 |
| #693 | Partly | B11: the mic shows in each field. Playing speech into it makes a model call that writes a usage count, so it is not read-only |
| #688 | Yes | B6 (the leftovers swipe only if test account 2 has a meal with a leftovers photo) |
| #695 | Partly | The redirect's cache header was met on Nov 15. A busy resizer cannot be made read-only |
| #575 | If one exists | B14: only if test account 2 has a ready meal with an unavailable value; the owner's needs the owner's sign-in |
| #452 | No: needs writes | Needs a barcode miss and a label photo |
| #570 | No: needs writes | Needs a leftovers photo saved |
| #449 | No: needs a write | Needs a new upload |
| #351 | Yes | B9: hold a tile, then close without saving |
| #936 | Test account half | B8. The owner's account needs the owner's sign-in |
| #938 | No: needs a write | Needs a failed added-photo upload |

**SQL, read-only:**

- **Q1, #1021 and #990.** `node --import tsx scripts/numbers/cards.mjs --zone=Asia/Jakarta f1439c72 e31fd9af 5711e19c 38de279e 509ef9bc f08e2e86 1c18b87e 1c4f16bf`, plus every meal section 8 changed. Met for a meal when its card and first-comment calories agree with its stored sum as rounded, and its day total is listed. A first comment written before a later re-match can state the old total; report it as such, not as a failure of the card.
- **Q2, #456.** For the owner's meals 8535b793, 8b728c7e and 8ab2eccb: each current food's name, its caffeine (micronutrient `1057`, basis `portion`), its alcohol (`1018`) and its caffeine intake rows (`intake_logs`, kind `caffeine`). Met when none of the three holds caffeine.
- **Q3, #377 and #988.** For the owner's meals whose current food names match `\m(cola|coke)\M`, and meal 4dfe4411: each food's name, `food_category`, caffeine (`1057`), calories and its caffeine intake rows. Met for #377 when each cola holds caffeine and has its intake row; for #988 when each counts as a drink (a drink intake row) even when `food_category` is NULL. For 4dfe4411 also report the calories (the backlog's "112 kcal is far too high for black coffee").
- **Q4, #987.** The owner's current foods whose names match `\m(coffee|espresso|americano|tea)\M` and whose micronutrients carry an approximation of kind `estimate`: name, calories, caffeine. Met when each has a caffeine value.
- **Q5, #523.** `14-rule-failures.sql` for the owner (P1's result serves), and a count of the owner's ready meals with any current food whose calories, protein, carbs or fat is NULL. Met when that count is 1 (6fad4a16).
- **Q6, #684.** For the owner's meals eaten within 15 minutes of 2026-11-06 07:35Z and of 2026-11-17 06:15Z: prefix, status, photo count, drink rows (`intake_logs`, all and `source = 'sheet'`), `post_photo_attachments` rows and how many have no `media_id`. It shows whether a known refusal (drinks, eight photos, not ready) explains the failure; the error the phone saw is not stored.

**Browser, read-only, test account 2:**

- **B1, #323.** A cold open of Home, then Days, then Profile, 15 seconds each: count the browser's requests to the Supabase `auth/v1/` endpoints.
- **B2, #222 and #372.** Three cold Home opens on the slow-network profile (section 2), cache disabled, fresh profile each: time from navigation to the first feed photo's load event, its bytes (`encodedDataLength`), its `cache-control`, its file name, its natural width against its rendered width × 3. Met for #222 when every time is 2 seconds or less; for #372 also when the width ratio is 2 or more (a photo captured before the sharper camera cannot meet it; say which it is).
- **B3, #494.** On the same profile, at 390 by 844 and at 1280 by 800: tap the newest ready meal and time to `[data-post-detail-ready]`; count requests; list any `0.feed.jpg` over 400 KB. Met when both open within 2 seconds and no such original downloads.
- **B4, #454.** Open Days: is today's cell inside the viewport at once; scroll up across the month boundary: do the week rows run on with no gap, and does each month's name mark its first week.
- **B5, #955.** Open a ready meal: the header's date line must not be cut (`scrollHeight` ≤ `clientHeight`, inside the header's box). Again after `Page.setFontSizes` with standard 24 and fixed 20, reloaded.
- **B6, #688.** On Home, scroll until the second page of meals loads, then 30 seconds more: count POST requests to `/`, and record any change of `scrollY` of more than 200 px that the helper did not make. If a meal with a leftovers photo is on the page, swipe its photos once and check that only that meal's photos move.
- **B7, #120.** Keep Home open and visible for 150 seconds with only finished meals: count refresh requests to `/` (an `RSC` header or `_rsc` parameter). Met when there is none.
- **B8, #936.** A cold Home open, 15 seconds: count `/api/feed?ids=` requests. Met when there is none.
- **B9, #351.** Open the drink sheet: count its tiles and record their order; hold the first tile 700 ms with touch events and record whether a size choice opens; close it with Escape or its close control, without choosing.
- **B10, #972.** On the cold Home open of B8: the total bytes of script responses. Then tap Post a meal: does a new script load only now (the capture sheet's)? Close the sheet without taking a photo.
- **B11, #687 and #693.** Profile shows the switch "Identify food with Muse Spark Open". A mic button shows in a meal's comment box, the new-post caption, the drink description and Search. Do not record.
- **B12, #689.** Test account 2's own avatar, if it has one: status and `cache-control` (expected 200, `private`). The owner's avatar address (its ids from read-only SQL), requested as test account 2: expected 404. On a ready meal of test account 2, the header shows its author's avatar and the servings control is not cut.
- **B13, #973.** Only if read-only SQL finds a failed meal of test account 2 with no photo: open it and record both sentences (the photo area's and the card's). Met when they are the same.
- **B14, #575.** Only if read-only SQL finds a ready meal of test account 2 with a NULL value: open it and record whether it names the food and says why in plain words.

**What section 9 reports.** One row per item of the table: met, not met or not checked, the numbers, and what it could not see. The PM moves each item.

## 10. For the owner (optional)

Written for the owner, in the style the owner asked for. Send it only if the PM chooses to:

"Your salami meal (6fad4a16) has no weight for the salami, so its calories are a guess. What weight is printed on the bag?"
