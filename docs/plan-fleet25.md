# Fleet 25 plan

Planner: Fable 5.2, planner seat. Nov 16 2026 (WIB). All code read on `origin/main` = `2e4d0d39` (merge of #965) on Nov 16.
On Nov 16 the planner applied the wording edits of PR 1 to a scratch copy of main outside the repository and ran there `npx tsc --noEmit`, `npx eslint` and the nine test files about days. Every SQL text in PR 2 was run on a throwaway local database made from the repository's migrations, through the real worker code with scripted model and USDA answers. AGY decided the Days words in two runs on Nov 16. The results are in the Facts table. The planner ran nothing on production and wrote nothing to the repository or to GitHub.

**Stops: one.** One dispatch, one prompt. The run builds, reviews, tests, looks, and makes the read-only study on production without stopping. It then stops once, before the merges: the coder posts each PR number with its full head SHA and waits for the PM's merge order naming them. **Nothing is written on production before that order.** After the order the run merges, re-analyses the four meals, verifies them, and goes to its end without another stop.

**Halts.** The only legal halts are: a review tool is unavailable when the review is reached; a fact this plan states turns out false; an operation would contact a customer or breach an explicit prohibition. A halt stops only its own item. Every independent item continues.

**When done, stop.** Done means every numbered item in Part 1 is reported done or not done. After that the coder opens no new PR, makes no new reading and re-analyses no further meal. A defect found during the run goes to the PM for the backlog and is not fixed in this run.

**Authority (the owner's rulings of Nov 16 2026).** The team may make model calls and change My Food's numbers, including re-analysing the owner's own meals on production, without asking. Wording is the team's decision, and AGY decides where a model's judgment is needed. This plan asks the owner nothing.

**Runs beside Fleet 24.** Fleet 24's eight code PRs are open (#974 to #981). This plan edits none of their files and plans none of their items. It uses its own test stack, ports, browser port and scratch directory.

**Size.** The Engineering backlog (the owner's Doc as the PM's copy held it on Nov 16, 22:36 WIB) holds 49 items. The PM chose six for this plan: #294, #377, #456, #694, #285 and #617. All six are worked: 1 by a build with exact text (#294), 3 by a read-only study with exact queries (#694, #285, #617), 2 by a re-analysis on production with exact steps (#377, #456). The other **43** are in Part 2 with their reasons. Part 3 is the design for revisiting every stored number, with the issue titles the PM is asked to have numbered.

---

# Part 1: the dispatch (6 items)

In this plan, `<main>` means the main checkout, `/home/opc/Projects/my-food-ai`; `<w>` means `/tmp/mfa-f25/main`, a worktree of `origin/main` that step 5a makes and step 8 removes; `<n>` means `/tmp/mfa-f25/numbers`, a worktree of PR 2's branch that step 6 makes and step 8 removes. `<private>` means `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/fleet25/private`, a folder outside the repository for files that hold full ids, storage paths or photos. Nothing in `<private>` is committed, pasted into a PR or quoted in a report.

## Files Fleet 24 holds (not edited by this plan)

`src/components/NeedsInputStrip.tsx`, `src/components/Thread.tsx`, `src/components/OutlineOverlay.tsx`, `src/components/PostDetailHeader.tsx`, `src/lib/posts/open-post.ts`, `src/components/PostOpenTransition.tsx`, `src/lib/posts/days.ts`, `src/lib/intake/intake.ts`, `src/lib/intake/hydration.ts`, `src/lib/queue/tick.ts`, `tests/worker-recovery-wake.test.mjs`, `tests/home-days-agreement.test.mjs`, `tests/fixtures/local-gateway.mjs`, `tests/db/today-summary.test.mjs`, `supabase/migrations/0064_drop_today_summary.sql`, `docs/plan-fleet24.md`, `docs/findings/performance-audit-2026-11-16.md`.

## How it runs

1. **Cleanup first.** Run `git worktree list`. Leave every worktree Fleet 24's run made. Remove only a leftover of this plan (a path under `/tmp/mfa-f25`). Do not commit, stash or discard the uncommitted change in `<main>`.
2. **Build.** Each PR below in its own fresh worktree branched from `origin/main`. Nothing is stacked. No PR depends on another. No two touch the same file. There are 2 code PRs and one docs PR.
3. After each push: open the PR, then remove that worktree and delete its local branch.
4. **Reviews** run in a sub-agent beside the build, never before it. One external reviewer per PR: **PPLX** (`skills/pplx-review/SKILL.md`), one pass per head, run to zero blockers; PPLX then confirms the fixes only. If PPLX cannot run for a PR, use AGY (`skills/agy-review/SKILL.md`) for that PR. Codex does not review these PRs, because the code is written by an OpenAI model. If neither can run, that PR halts and the others continue. The docs PR is reviewed the same way.
5. **PR 1's tests and look.**
   a. Once: `mkdir -p /tmp/mfa-f25 && git -C <main> worktree add --detach /tmp/mfa-f25/main origin/main`. In `<w>`: `npm ci`, then `TEST_PORT_BASE=60560 TEST_PG_PORT=55479 TEST_STACK_DIR=/tmp/mfa-f25/stack TEST_ENV_FILE=.env.test.fleet25 npm run test:stack`. The ports differ from Fleet 24's, so both stacks can run at once; this run's app answers at `http://127.0.0.1:60560`.
   b. In a temporary worktree of PR 1's branch: `npm ci`, `npm run lint`, `npx tsc --noEmit`, `TEST_ENV_FILE=/tmp/mfa-f25/main/.env.test.fleet25 npm run test:app -- build`, then `MFA_TEST_DISPOSABLE=1 node --env-file=/tmp/mfa-f25/main/.env.test.fleet25 --import ./tests/fixtures/local-providers.mjs --import tsx --test --test-concurrency=1 tests/day-rings-updates.test.mjs tests/days-range.test.mjs tests/days-reader-queries.test.mjs tests/days-summary.test.mjs tests/day-total-changes.test.mjs tests/day-totals-refresh.test.mjs tests/history-budget.test.mjs tests/home-day-totals.test.mjs tests/today-view.test.mjs tests/wording-inventory.test.mjs`, then `node scripts/wording-inventory.mjs --check`. A pass is: no lint error that main does not report, a clean type check, a build, every named test passing, and the check not saying "stale". The whole suite is not run for a change of words; main's own suite result is taken from Fleet 24's report for the same commit of main, or run once in `<w>` if that report has none.
   c. The look (PR 1's section), on PR 1's build, in the browser of section "The browser".
6. **The study on production (read-only).** Make `<n>`: `git -C <main> fetch origin fix25/numbers-sql && git -C <main> worktree add --detach /tmp/mfa-f25/numbers origin/fix25/numbers-sql`. Run the readings S1 to S9 of section "The study". Write the finding file and commit it to the docs PR.
7. **The one stop.** Post one comment on each PR: its number, its full head SHA, its review result, its test result and its look result. Send the PM the study's finding. Wait for the PM's merge order.
8. **After the order.** Merge in ascending PR number, each only at the head SHA the order names. This plan has no migration. Delete each remote branch after its merge. The docs PR is not merged unless the order names it. Then carry out section "Re-analysing the four meals", steps W1 to W9, and write its results in the final report. Then the end state: stop the browser and remove its profile and driver; in `<w>`, `TEST_PORT_BASE=60560 TEST_PG_PORT=55479 TEST_STACK_DIR=/tmp/mfa-f25/stack TEST_ENV_FILE=.env.test.fleet25 npm run test:stack -- down`; `git -C <main> worktree remove --force /tmp/mfa-f25/main` and the same for `/tmp/mfa-f25/numbers`; `rm -rf /tmp/mfa-f25`. Delete the downloaded photos under `<private>/photos`. Keep `<private>/snapshot-four-meals.jsonl` until the PM says the four meals are accepted: it is the only way back. `podman ps` shows no container whose name ends in `-60560`; Fleet 24's worktrees, stack and browser are untouched.
9. **Final report:** the 6 item numbers, each done or not done; the study's counts; for each of the four meals what was done, the numbers before and after, the model calls and tokens used; every defect found, one line each, for the PM.
10. **New tests: none.** PR 1 changes words and one existing test's expected word. PR 2 adds query files that were run on a migrated database (fact below).

## Facts (planner checked on Nov 16 2026; the coder does not re-check)

| Fact | Check |
|---|---|
| `origin/main` is `2e4d0d39`. Open PRs: #682 and Fleet 24's #974 to #981. | `git log origin/main -1`; `gh pr list --state open`, 16:15 UTC |
| Every "Find" text of PR 1 occurs exactly once in its file on `origin/main`. | a script counted each with Python's `str.count` on a copy made by `git archive origin/main` |
| With PR 1's edits applied, `npx tsc --noEmit` reports nothing, `npx eslint` reports the same 3 errors and 14 warnings as main, and the nine days test files with `wording-inventory` pass 40 of 40. `tests/day-rings-updates.test.mjs` fails without its one-word change, because it expects "no posts". An apostrophe written plainly in "Today's meals" adds a lint error; the edit writes it as `&apos;`. | run on scratch copies |
| **AGY's decision on the Days words** (model `gemini-3.8-flash-high`, high effort, two runs, conversations `74f532b7` and `95aa2130`). Kept: "Days", "Selected day", "Choose a day", "Open the day ›", "not finished", "Close month list", "Previous month", "Next month", "Loading month…", "Loading months…", "Loading day…", "Photograph a meal today", "Consumed on Saturday". Changed: a logged entry is a "meal", not a "post", in every Days wording; "Go to" becomes "Go to month"; "Loading posted months…" becomes "Loading months…"; "No posts" becomes "No meals"; "Posted today" becomes "Today's meals"; "No posts today" becomes "No meals today"; "No days posted", "1 day posted", "12 days posted" become "No days logged", "1 day logged", "12 days logged"; "drank" under a calendar day becomes "Drank". | the two answers, kept by the planner; the prompts gave each term's place and meaning and the standing wording rules |
| How the planner applied two of AGY's answers. "Drank" is capitalised where it stands alone under a day; inside the screen-reader sentence ("…, 4 meals, drank, …") it stays lower case. The screen-reader end of a day circle's label, "no posts", becomes "no meals". | `src/components/MonthGrid.tsx` lines 42, 46; `PhoneCalendar.tsx` lines 90, 94; `DayRings.tsx` line 66 |
| **A meal that already has numbers is not changed by a plain re-run.** An `analyze` job on an analysed meal only marks it ready. A plain `recompute` re-matches only foods with a missing value. A full re-analysis from the photo, or a forced re-match, needs the operator SQL of PR 2 first. | `src/lib/worker/jobs/analyze.ts` line 20; `src/lib/worker/jobs/recompute.ts` lines 33–42 |
| The operator SQL of PR 2 was run end to end on a throwaway local database through the real worker. Drink sync: 3 jobs finished, stale `caffeine` rows became `alcohol` rows, no model call. Forced re-match: old rows kept as superseded, four foods re-resolved, a barcode meal kept its numbers. Full re-analysis: old rows kept as superseded, a new food list written, the meal ready, the card redrawn; a copied meal and a meal with a leftovers photo queued nothing. Restore: the old foods current again with their numbers. | the planner's investigator, on a stack made from the repository's migrations with scripted model answers, Nov 16 |
| Each study query (PR 2's files 02 to 07) is one SELECT and ran in a read-only session on that database: on a seeded account and on an empty one. Every rule of file 03 fired at least once on seeded data. The snapshot (file 08) and the usage query (file 09) ran too. | the same run: file 02, 13 rows; 03, 18; 04, 12; 05, 2; 06, 3; 07, 4; 08, 4 lines; 09, 17 rows |
| Files 03 and 04 carry the same rules twice, because each file must be one SELECT that runs in a read-only session, where no view or temporary table can be made. A change to a rule is made in both. | PostgreSQL refuses `CREATE` in a read-only transaction |
| What is kept when a meal is re-analysed with PR 2's files: every old food row and its numbers stay in the table, marked superseded. What is replaced: the drink records of the meal's foods, the card image, and the outline files (same addresses). The only way back is file 13 with the snapshot. | migrations `0007`, `0029`; `src/lib/pipeline/analyze.ts` lines 113, 271 |
| A re-analysis makes these model calls: one region call for each eaten photo, one identify call, then for each food up to three searches each with one decision, and when nothing matches one closest-record decision and one or two estimate calls. Four foods are resolved at a time. The worker runs one job at a time. USDA allows 1,000 requests an hour. The per-user hourly caps apply to requests from the app, not to jobs an operator queues. | `src/lib/pipeline/analyze.ts`; `src/lib/fdc/match.ts` lines 63–109; `src/lib/worker/concurrency.ts`; `src/lib/fdc/client.ts` line 6; `src/lib/limits/user-cap.ts` |
| Every finished job sends the meal's owner a push notification, except a drink sync. | `src/lib/pipeline/persist.ts` lines 166–180; `src/lib/worker/jobs/recompute.ts` lines 16–21 |
| Why the Oct 29 coffee shows no caffeine: a food counts as a drink by its USDA category, or, with no category, only by an exact plain name such as "black coffee" or "coffee". Caffeine is read only from the matched record's caffeine value. A model estimate holds seven values and never caffeine. The coffee is stored with no category, no caffeine and 111.6 kcal for 180 g, so it needs a new match to a USDA coffee record. | `src/lib/intake/drinks-from-items.ts` lines 13, 31–48; `src/lib/fdc/estimate.ts` line 37; Fleet 22's read R2 |
| Why the three cocktails show caffeine: their stored drink records are kind `caffeine`, written before the rule that drops caffeine from a drink with no caffeine source. A drink sync rewrites them with no model call. A cocktail whose matched record has no category is not counted as a drink at all, and its record is removed. | `src/lib/intake/alcohol.ts` lines 6–28; `drinks-from-items.ts` lines 31–51 |
| A single-photo meal can copy its foods and numbers from an earlier meal of the same person that scores as the same meal. A re-analysed meal can therefore take numbers from a similar meal that was not re-analysed. | `src/lib/pipeline/prior.ts` lines 9–60 |
| The matched USDA record's description is not stored on a food. The queries read it from the label of a closest match, or from the app's USDA cache when the record is still cached. | `src/lib/fdc/nutrients.ts` lines 144–155; table `public.fdc_cache` |
| No script in the repository can re-estimate a stored photo without writing to the database. | `scripts/real-identify-smoke.mjs` reads only one fixed photo; `scripts/eval.mjs` posts through the app |
| The browser and how it is driven are in `docs/plan-fleet21.md` on main, section "The browser". | the file on `origin/main` |

**Premises (unchecked; the coder verifies before relying on them):**
- A second test stack on ports 60560 and 55479 starts beside Fleet 24's.
- `.env.local` holds `SUPABASE_DB_URL`, `APP_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`. The planner did not open that file.
- The id prefix `4dfe4411` matches exactly one meal on production. File 01 shows it; if it prints anything but 1 meal and 1 account, the study and the re-analysis halt.
- A photo is downloaded with `curl -s -H "Authorization: Bearer $SUPABASE_SECRET_KEY" -H "apikey: $SUPABASE_SECRET_KEY" "$NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/media/<storage path>"`. The planner did not run it.
- Production's database holds every migration through `0063` (the queries use `photo_secret`, `question` and `source_post_id`).
- The restore for a re-analysis that ended as failed (step W8) was written from reading and not run.
- The app's USDA cache on production is small enough for files 03, 04 and 06 to finish; each reads the whole cache once.

---

## PR 1: branch `fix25/days-words` (#294)
**Service and boundary:** the Days screens and the two Home pieces that name a day's meals.
**Blast radius:** words only, on Days, the day view, the month list, a day's heading on Home, and the desktop Today column. If it fails, a label reads wrong.
**What it does:** applies AGY's decision (fact above). "post" becomes "meal" in the Days words; five phrases change; the rest stay.
**Look:** at 390 wide and at 1280 wide, signed in as local test user 2, with the seed of 75 meals from `docs/plan-fleet21.md` (section "The seed") and one photo meal made as its fixture F1. Open Days, open a day, open the month list, and open Home. Expected, read from the page's text: "Go to month" as the list's title; "N days logged" beside a month; "N meals" in a day's line; "No meals" beside an empty day on Home; "Today's meals" at 1280; and none of "posts", "Posted today", "days posted" or "Go to" alone.

File `src/components/DaysView.tsx`.
Find:
```
{active.posts.length===1?'post':'posts'}
```
Replace:
```
{active.posts.length===1?'meal':'meals'}
```
File `src/components/DesktopDays.tsx`.
Find:
```
{active.posts.length===1?'post':'posts'}
```
Replace:
```
{active.posts.length===1?'meal':'meals'}
```
File `src/components/StoryPlayer.tsx`.
Find:
```
{day.posts.length===1?'post':'posts'}
```
Replace:
```
{day.posts.length===1?'meal':'meals'}
```
File `src/components/MonthGrid.tsx`.
Find:
```
${day.posts === 1 ? "post" : "posts"}
```
Replace:
```
${day.posts === 1 ? "meal" : "meals"}
```
Find:
```
return count === 0 ? "No days posted" : `${count} ${count === 1 ? "day" : "days"} posted`;
```
Replace:
```
return count === 0 ? "No days logged" : `${count} ${count === 1 ? "day" : "days"} logged`;
```
Find:
```
day?.intake ? "drank" : ""}</span>
```
Replace:
```
day?.intake ? "Drank" : ""}</span>
```
File `src/components/PhoneCalendar.tsx`.
Find:
```
${day.posts===1?'post':'posts'}
```
Replace:
```
${day.posts===1?'meal':'meals'}
```
Find:
```
day?.intake?'drank':''}</span>
```
Replace:
```
day?.intake?'Drank':''}</span>
```
File `src/components/DayHeader.tsx`.
Find:
```
{empty?'No posts':total?.ready
```
Replace:
```
{empty?'No meals':total?.ready
```
Find:
```
{empty ? "No posts" : total?.ready
```
Replace:
```
{empty ? "No meals" : total?.ready
```
File `src/components/DesktopToday.tsx`.
Find:
```
font-semibold">Posted today</h3>
```
Replace:
```
font-semibold">Today&apos;s meals</h3>
```
Find:
```
text-muted">No posts today</p>
```
Replace:
```
text-muted">No meals today</p>
```
File `src/components/GoToMonthSheet.tsx`.
Find:
```
label="Go to">
```
Replace:
```
label="Go to month">
```
Find:
```
className="text-sheet-head">Go to</h2>
```
Replace:
```
className="text-sheet-head">Go to month</h2>
```
Find:
```
Loading posted months…</p>
```
Replace:
```
Loading months…</p>
```
File `src/components/DayRings.tsx`.
Find:
```
kcal consumed`):'no posts'}`;
```
Replace:
```
kcal consumed`):'no meals'}`;
```
File `tests/day-rings-updates.test.mjs`.
Find:
```
assert.match(h.render(),/no posts/);
```
Replace:
```
assert.match(h.render(),/no meals/);
```
Then, in PR 1's worktree, run `node scripts/wording-inventory.mjs` and commit the changed `docs/wording/inventory.md`.
Done when: the named tests pass, the inventory check passes, and the look reads as expected. With this the item's list is reviewed, each term is decided, and the words are changed where they appear; the PM closes #294 on the merge.

## PR 2: branch `fix25/numbers-sql` (#694; the queries and steps #285, #617, #377 and #456 use)
**Service:** the database. **Boundary:** an operator with the database address, at a terminal. No product code and no page.
**Blast radius:** thirteen new files under `scripts/numbers/`. Nothing runs them by itself. Files 02 to 09 only read. Files 10 to 13 write, and are run only in section "Re-analysing the four meals".
**What it does:** puts in the repository the queries that find suspicious numbers and the statements that re-analyse one meal and put it back.

New folder `scripts/numbers/` with these files, each with exactly this text.

File `scripts/numbers/README.md`:
```
# Numbers: study and re-analysis

Read-only queries that look for stored nutrition numbers that cannot be right, and operator statements that re-analyse one meal and put it back. Each file says what it needs. Written for Fleet 25 (docs/plan-fleet25.md), where every file was run on a database made from this repository's migrations.

Read-only files (02 to 09) are run with a read-only session:
PGOPTIONS='-c default_transaction_read_only=on' psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -v uid=<account id> -f scripts/numbers/<file>

Files 10 to 13 write. They keep every old row, marked superseded. Take the snapshot (08) first: it is the only way back.

Files 03 and 04 hold the same rules. Each must be one SELECT so that it runs in a read-only session. Change a rule in both.
```
File `scripts/numbers/01-owner-check.sql` (prints a count and an 8-character prefix; it must show 1 meal and 1 account):
```
select count(*) as matching_posts, count(distinct user_id) as accounts, left(min(user_id::text), 8) as uid_prefix
from public.posts where left(id::text, 8) = '4dfe4411';
```
File `scripts/numbers/02-inventory.sql` (needs `uid`; where each food's numbers come from):
```
with items as (
  select p.id as post_id, p.source_post_id, i.id as item_id, i.source as item_source, i.gtin,
         n.post_item_id is not null as has_row, n.calories, n.protein_g, n.carbs_g, n.fat_g, n.source_ref,
         coalesce(n.micronutrients, '[]'::jsonb) as micro
  from public.posts p
  join public.post_items i on i.post_id = p.id and i.superseded_at is null
  left join public.item_nutrition n on n.post_item_id = i.id
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
), labelled as (
  select *,
    case
      when not has_row then '9 no nutrition row'
      when source_ref like 'unavailable:%' then '5 unavailable (' || split_part(source_ref, ':', 2) || ')'
      when source_ref is null and (calories is null or protein_g is null or carbs_g is null or fat_g is null) then '5 unavailable (no reason stored)'
      when source_ref like 'estimate:%' or micro @> '[{"approximation":{"kind":"estimate"}}]' then '4 model estimate'
      when source_ref = '0' and micro @> '[{"approximation":{"kind":"closest"}}]' then '3 rice-and-protein blend'
      when source_ref ~ '^[0-9]+$' and micro @> '[{"approximation":{"kind":"closest"}}]' then '2 closest USDA record'
      when source_ref like 'barcode:%' then '6 barcode (own product record)'
      when source_ref like 'off:%' then '6 barcode (Open Food Facts)'
      when source_ref = 'label' or source_ref like 'label:%' then '6 nutrition label'
      when source_ref like 'user:photo-drink:%' then '6 drink photo reading'
      when source_ref ~ '^[1-9][0-9]*$' and gtin is not null then '6 barcode (USDA branded record)'
      when source_ref ~ '^[1-9][0-9]*$' then '1 matched USDA record'
      else '8 other (' || coalesce(left(source_ref, 20), 'null source_ref, numbers present') || ')'
    end as label
  from items
), posts as (
  select p.id, p.source_post_id, exists (select 1 from public.post_items i where i.post_id = p.id and i.superseded_at is null) as has_items
  from public.posts p where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
)
select section, label, n from (
  select 1 as ord, 'posts' as section, 'ready posts' as label, count(*) as n from posts
  union all select 2, 'posts', 'ready posts with no current item', count(*) from posts where not has_items
  union all select 3, 'posts', 'ready posts copied from an earlier meal (source_post_id set)', count(*) from posts where source_post_id is not null
  union all select 4, 'posts', 'posts in another state: ' || p.status, count(*) from public.posts p
            where p.user_id = :'uid'::uuid and p.deleted_at is null and p.status <> 'ready' group by p.status
  union all select 5, 'items', 'current items on ready posts', count(*) from labelled
  union all select 6, 'items', 'current items entered or edited by the user (source = user)', count(*) from labelled where item_source = 'user'
  union all select 7, 'items', 'current items on copied posts (numbers copied from an earlier meal)', count(*) from labelled where source_post_id is not null
  union all select 8, 'source', label, count(*) from labelled group by label
) s
order by ord, label;
```
File `scripts/numbers/03-suspicious.sql` (needs `uid`; one row for each suspicious food, with the rule that caught it):
```
with items as (
  select p.id as post_id, i.id as item_id, i.name, i.portion_grams,
         n.post_item_id is not null as has_row, n.calories, n.protein_g, n.carbs_g, n.fat_g,
         n.fibre_g, n.sugar_g, n.sodium_mg, n.source_ref, n.food_category,
         coalesce(n.micronutrients, '[]'::jsonb) as micro,
         (select max((m->>'value')::numeric) from jsonb_array_elements(case when jsonb_typeof(n.micronutrients) = 'array' then n.micronutrients else '[]'::jsonb end) m
           where m->>'nutrientId' = '1018' and m->>'basis' = 'portion') as alcohol_g,
         (select max((m->>'value')::numeric) from jsonb_array_elements(case when jsonb_typeof(n.micronutrients) = 'array' then n.micronutrients else '[]'::jsonb end) m
           where m->>'nutrientId' = '1057' and m->>'basis' = 'portion') as caffeine_mg,
         (select max(l.amount) from public.intake_logs l where l.post_item_id = i.id and l.kind = 'caffeine') as intake_caffeine_mg
  from public.posts p
  join public.post_items i on i.post_id = p.id and i.superseded_at is null
  left join public.item_nutrition n on n.post_item_id = i.id
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
), cache_foods as (
  select distinct on (fdc_id) fdc_id, description from (
    select (f->>'fdcId') as fdc_id, f->>'description' as description
    from public.fdc_cache c
    cross join lateral jsonb_array_elements(case when jsonb_typeof(coalesce(c.response->'payload'->'foods', c.response->'foods')) = 'array'
                                             then coalesce(c.response->'payload'->'foods', c.response->'foods') else '[]'::jsonb end) f
    union all
    select coalesce(c.response->'payload'->>'fdcId', c.response->>'fdcId'), coalesce(c.response->'payload'->>'description', c.response->>'description')
    from public.fdc_cache c where c.query like 'fdc-detail:%'
  ) d
  where fdc_id in (select source_ref from items where source_ref ~ '^[1-9][0-9]*$') and description is not null
  order by fdc_id
), described0 as (
  select it.*,
         coalesce((select m->'approximation'->>'basis' from jsonb_array_elements(case when jsonb_typeof(it.micro) = 'array' then it.micro else '[]'::jsonb end) m
                    where m->'approximation'->>'kind' = 'closest' limit 1), cf.description) as raw_description
  from items it left join cache_foods cf on cf.fdc_id = it.source_ref
), described as (
  select d0.*, case when raw_description like 'Combined %' then regexp_replace(raw_description, ' for .*$', '') else raw_description end as record_description
  from described0 d0
), flags as (
  select post_id, item_id, name, portion_grams, calories, 'a1 no nutrition row' as reason, null::text as detail from described where not has_row
  union all
  select post_id, item_id, name, portion_grams, calories, 'a2 calories, protein, carbs or fat is NULL',
         concat_ws(' ', case when calories is null then 'kcal' end, case when protein_g is null then 'protein' end,
                   case when carbs_g is null then 'carbs' end, case when fat_g is null then 'fat' end, '| source_ref:', coalesce(left(source_ref, 60), 'NULL'))
  from described where has_row and (calories is null or protein_g is null or carbs_g is null or fat_g is null)
  union all
  select post_id, item_id, name, portion_grams, calories, 'b zero calories or all macros zero on more than 20 g',
         'kcal ' || calories || ', p/c/f ' || protein_g || '/' || carbs_g || '/' || fat_g
  from described
  where portion_grams > 20 and (calories = 0 or (protein_g = 0 and carbs_g = 0 and fat_g = 0))
    and not (name ~* '\m(water|tea|coffee|espresso|americano|diet|zero)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|mocha|bubble|boba)\M')
  union all
  select post_id, item_id, name, portion_grams, calories, 'c energy differs from 4p+4c+9f+7alc by more than 25% and 40 kcal',
         'from macros ' || round(4 * protein_g + 4 * carbs_g + 9 * fat_g + 7 * coalesce(alcohol_g, 0), 1) || ' kcal (alcohol grams stored: ' || coalesce(round(alcohol_g, 1)::text, 'none') || ')'
  from described
  where calories is not null and protein_g is not null and carbs_g is not null and fat_g is not null
    and abs(calories - (4 * protein_g + 4 * carbs_g + 9 * fat_g + 7 * coalesce(alcohol_g, 0))) > 0.25 * calories
    and abs(calories - (4 * protein_g + 4 * carbs_g + 9 * fat_g + 7 * coalesce(alcohol_g, 0))) > 40
  union all
  select post_id, item_id, name, portion_grams, calories, 'd energy density outside 0 to 9 kcal per gram',
         round(calories / portion_grams, 2) || ' kcal/g'
  from described where portion_grams > 0 and calories is not null and (calories / portion_grams < 0 or calories / portion_grams > 9)
  union all
  select post_id, item_id, name, portion_grams, calories, 'e portion NULL, under 5 g or over 1500 g', coalesce(portion_grams::text, 'NULL') || ' g'
  from described where portion_grams is null or portion_grams < 5 or portion_grams > 1500
  union all
  select post_id, item_id, name, portion_grams, calories, 'f negative value',
         concat_ws(' ', case when calories < 0 then 'kcal ' || calories end, case when protein_g < 0 then 'protein ' || protein_g end,
                   case when carbs_g < 0 then 'carbs ' || carbs_g end, case when fat_g < 0 then 'fat ' || fat_g end,
                   case when fibre_g < 0 then 'fibre ' || fibre_g end, case when sugar_g < 0 then 'sugar ' || sugar_g end,
                   case when sodium_mg < 0 then 'sodium ' || sodium_mg end)
  from described where calories < 0 or protein_g < 0 or carbs_g < 0 or fat_g < 0 or fibre_g < 0 or sugar_g < 0 or sodium_mg < 0
  union all
  select post_id, item_id, name, portion_grams, calories, 'g1 plain coffee or tea above 0.25 kcal per gram',
         round(calories / portion_grams, 2) || ' kcal/g, category ' || coalesce(food_category, 'NULL')
  from described
  where name ~* '\m(coffee|espresso|americano|tea)\M' and name !~* '\m(milk|latte|cappuccino|sugar|mocha)\M'
    and portion_grams > 0 and calories / portion_grams > 0.25
  union all
  select post_id, item_id, name, portion_grams, calories, 'g2 caffeine stored on a name with no caffeine source',
         'nutrient ' || coalesce(round(caffeine_mg, 1)::text, '-') || ' mg, intake row ' || coalesce(intake_caffeine_mg::text, '-') || ' mg, category ' || coalesce(food_category, 'NULL')
  from described
  where (caffeine_mg > 0 or intake_caffeine_mg > 0)
    and name !~* '\m(coffee|tea|cola|coke|energy|mate|chocolate|cocoa|espresso|americano|latte|cappuccino|macchiato|mocha|matcha|pepsi|kopi|teh|guarana)\M'
  union all
  select post_id, item_id, name, portion_grams, calories, 'i matched record shares no word with the item name', left(record_description, 80)
  from described
  where record_description is not null
    and not exists (
      select 1 from regexp_split_to_table(lower(name), '[^a-z]+') w(word)
      where length(word) >= 4
        and regexp_replace(word, '(es|s)$', '') in (select regexp_replace(d, '(es|s)$', '') from regexp_split_to_table(lower(record_description), '[^a-z]+') x(d) where length(d) >= 4))
  union all
  select post_id, null, '(whole meal, ' || count(*) || ' items)', sum(portion_grams), sum(calories), 'h meal total under 30 or over 2500 kcal',
         count(*) filter (where calories is null) || ' item(s) without calories'
  from described group by post_id
  having coalesce(sum(calories), 0) < 30 or sum(calories) > 2500
)
select left(post_id::text, 8) as post, left(item_id::text, 8) as item, left(name, 40) as name,
       round(portion_grams, 1) as grams, round(calories, 1) as kcal, reason, detail
from flags
order by reason, post, name;
```
File `scripts/numbers/04-summary.sql` (needs `uid`; for each rule, how many foods and meals):
```
with items as (
  select p.id as post_id, i.id as item_id, i.name, i.portion_grams,
         n.post_item_id is not null as has_row, n.calories, n.protein_g, n.carbs_g, n.fat_g,
         n.fibre_g, n.sugar_g, n.sodium_mg, n.source_ref, n.food_category,
         coalesce(n.micronutrients, '[]'::jsonb) as micro,
         (select max((m->>'value')::numeric) from jsonb_array_elements(case when jsonb_typeof(n.micronutrients) = 'array' then n.micronutrients else '[]'::jsonb end) m
           where m->>'nutrientId' = '1018' and m->>'basis' = 'portion') as alcohol_g,
         (select max((m->>'value')::numeric) from jsonb_array_elements(case when jsonb_typeof(n.micronutrients) = 'array' then n.micronutrients else '[]'::jsonb end) m
           where m->>'nutrientId' = '1057' and m->>'basis' = 'portion') as caffeine_mg,
         (select max(l.amount) from public.intake_logs l where l.post_item_id = i.id and l.kind = 'caffeine') as intake_caffeine_mg
  from public.posts p
  join public.post_items i on i.post_id = p.id and i.superseded_at is null
  left join public.item_nutrition n on n.post_item_id = i.id
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
), cache_foods as (
  select distinct on (fdc_id) fdc_id, description from (
    select (f->>'fdcId') as fdc_id, f->>'description' as description
    from public.fdc_cache c
    cross join lateral jsonb_array_elements(case when jsonb_typeof(coalesce(c.response->'payload'->'foods', c.response->'foods')) = 'array'
                                             then coalesce(c.response->'payload'->'foods', c.response->'foods') else '[]'::jsonb end) f
    union all
    select coalesce(c.response->'payload'->>'fdcId', c.response->>'fdcId'), coalesce(c.response->'payload'->>'description', c.response->>'description')
    from public.fdc_cache c where c.query like 'fdc-detail:%'
  ) d
  where fdc_id in (select source_ref from items where source_ref ~ '^[1-9][0-9]*$') and description is not null
  order by fdc_id
), described0 as (
  select it.*,
         coalesce((select m->'approximation'->>'basis' from jsonb_array_elements(case when jsonb_typeof(it.micro) = 'array' then it.micro else '[]'::jsonb end) m
                    where m->'approximation'->>'kind' = 'closest' limit 1), cf.description) as raw_description
  from items it left join cache_foods cf on cf.fdc_id = it.source_ref
), described as (
  select d0.*, case when raw_description like 'Combined %' then regexp_replace(raw_description, ' for .*$', '') else raw_description end as record_description
  from described0 d0
), flags as (
  select post_id, item_id, name, portion_grams, calories, 'a1 no nutrition row' as reason, null::text as detail from described where not has_row
  union all
  select post_id, item_id, name, portion_grams, calories, 'a2 calories, protein, carbs or fat is NULL',
         concat_ws(' ', case when calories is null then 'kcal' end, case when protein_g is null then 'protein' end,
                   case when carbs_g is null then 'carbs' end, case when fat_g is null then 'fat' end, '| source_ref:', coalesce(left(source_ref, 60), 'NULL'))
  from described where has_row and (calories is null or protein_g is null or carbs_g is null or fat_g is null)
  union all
  select post_id, item_id, name, portion_grams, calories, 'b zero calories or all macros zero on more than 20 g',
         'kcal ' || calories || ', p/c/f ' || protein_g || '/' || carbs_g || '/' || fat_g
  from described
  where portion_grams > 20 and (calories = 0 or (protein_g = 0 and carbs_g = 0 and fat_g = 0))
    and not (name ~* '\m(water|tea|coffee|espresso|americano|diet|zero)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|mocha|bubble|boba)\M')
  union all
  select post_id, item_id, name, portion_grams, calories, 'c energy differs from 4p+4c+9f+7alc by more than 25% and 40 kcal',
         'from macros ' || round(4 * protein_g + 4 * carbs_g + 9 * fat_g + 7 * coalesce(alcohol_g, 0), 1) || ' kcal (alcohol grams stored: ' || coalesce(round(alcohol_g, 1)::text, 'none') || ')'
  from described
  where calories is not null and protein_g is not null and carbs_g is not null and fat_g is not null
    and abs(calories - (4 * protein_g + 4 * carbs_g + 9 * fat_g + 7 * coalesce(alcohol_g, 0))) > 0.25 * calories
    and abs(calories - (4 * protein_g + 4 * carbs_g + 9 * fat_g + 7 * coalesce(alcohol_g, 0))) > 40
  union all
  select post_id, item_id, name, portion_grams, calories, 'd energy density outside 0 to 9 kcal per gram',
         round(calories / portion_grams, 2) || ' kcal/g'
  from described where portion_grams > 0 and calories is not null and (calories / portion_grams < 0 or calories / portion_grams > 9)
  union all
  select post_id, item_id, name, portion_grams, calories, 'e portion NULL, under 5 g or over 1500 g', coalesce(portion_grams::text, 'NULL') || ' g'
  from described where portion_grams is null or portion_grams < 5 or portion_grams > 1500
  union all
  select post_id, item_id, name, portion_grams, calories, 'f negative value',
         concat_ws(' ', case when calories < 0 then 'kcal ' || calories end, case when protein_g < 0 then 'protein ' || protein_g end,
                   case when carbs_g < 0 then 'carbs ' || carbs_g end, case when fat_g < 0 then 'fat ' || fat_g end,
                   case when fibre_g < 0 then 'fibre ' || fibre_g end, case when sugar_g < 0 then 'sugar ' || sugar_g end,
                   case when sodium_mg < 0 then 'sodium ' || sodium_mg end)
  from described where calories < 0 or protein_g < 0 or carbs_g < 0 or fat_g < 0 or fibre_g < 0 or sugar_g < 0 or sodium_mg < 0
  union all
  select post_id, item_id, name, portion_grams, calories, 'g1 plain coffee or tea above 0.25 kcal per gram',
         round(calories / portion_grams, 2) || ' kcal/g, category ' || coalesce(food_category, 'NULL')
  from described
  where name ~* '\m(coffee|espresso|americano|tea)\M' and name !~* '\m(milk|latte|cappuccino|sugar|mocha)\M'
    and portion_grams > 0 and calories / portion_grams > 0.25
  union all
  select post_id, item_id, name, portion_grams, calories, 'g2 caffeine stored on a name with no caffeine source',
         'nutrient ' || coalesce(round(caffeine_mg, 1)::text, '-') || ' mg, intake row ' || coalesce(intake_caffeine_mg::text, '-') || ' mg, category ' || coalesce(food_category, 'NULL')
  from described
  where (caffeine_mg > 0 or intake_caffeine_mg > 0)
    and name !~* '\m(coffee|tea|cola|coke|energy|mate|chocolate|cocoa|espresso|americano|latte|cappuccino|macchiato|mocha|matcha|pepsi|kopi|teh|guarana)\M'
  union all
  select post_id, item_id, name, portion_grams, calories, 'i matched record shares no word with the item name', left(record_description, 80)
  from described
  where record_description is not null
    and not exists (
      select 1 from regexp_split_to_table(lower(name), '[^a-z]+') w(word)
      where length(word) >= 4
        and regexp_replace(word, '(es|s)$', '') in (select regexp_replace(d, '(es|s)$', '') from regexp_split_to_table(lower(record_description), '[^a-z]+') x(d) where length(d) >= 4))
  union all
  select post_id, null, '(whole meal, ' || count(*) || ' items)', sum(portion_grams), sum(calories), 'h meal total under 30 or over 2500 kcal',
         count(*) filter (where calories is null) || ' item(s) without calories'
  from described group by post_id
  having coalesce(sum(calories), 0) < 30 or sum(calories) > 2500
), scope as (
  select count(distinct post_id) as posts, count(*) as items from items
)
select reason, items, posts, pct_of_ready_posts_with_items from (
  select 1 as ord, reason, count(item_id) as items, count(distinct post_id) as posts,
         round(100.0 * count(distinct post_id) / nullif((select posts from scope), 0), 1) as pct_of_ready_posts_with_items
  from flags group by reason
  union all
  select 2, 'ANY REASON (distinct items, distinct posts)', count(distinct item_id), count(distinct post_id),
         round(100.0 * count(distinct post_id) / nullif((select posts from scope), 0), 1)
  from flags
  union all
  select 3, 'ALL ready posts with items / current items (denominator)', (select items from scope), (select posts from scope), 100.0
) s
order by ord, posts desc, items desc, reason;
```
File `scripts/numbers/05-leftovers.sql` (needs `uid`; every meal with a not-eaten amount):
```
with items as (
  select p.id as post_id, i.id as item_id, i.name, i.created_at, i.portion_grams as eaten_g, n.calories as eaten_kcal,
         i.not_eaten_grams as not_eaten_g, i.not_eaten_calories as not_eaten_kcal,
         (select count(*) from public.post_media m where m.post_id = p.id and m.kind = 'photo' and m.not_eaten) as not_eaten_photos
  from public.posts p
  join public.post_items i on i.post_id = p.id and i.superseded_at is null
  left join public.item_nutrition n on n.post_item_id = i.id
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
), meals as (
  select post_id from items group by post_id, not_eaten_photos
  having count(*) filter (where not_eaten_g is not null) > 0 or not_eaten_photos > 0
), rated as (
  select it.*,
         case when coalesce(it.eaten_g, 0) + coalesce(it.not_eaten_g, 0) > 0 then it.not_eaten_g / (coalesce(it.eaten_g, 0) + it.not_eaten_g) end as ratio_g,
         case when coalesce(it.eaten_kcal, 0) + coalesce(it.not_eaten_kcal, 0) > 0 then it.not_eaten_kcal / (coalesce(it.eaten_kcal, 0) + it.not_eaten_kcal) end as ratio_kcal
  from items it join meals m on m.post_id = it.post_id
)
select left(post_id::text, 8) as post, left(item_id::text, 8) as item, left(name, 40) as name,
       round(eaten_g, 1) as eaten_g, not_eaten_g, round(eaten_kcal, 1) as eaten_kcal, round(not_eaten_kcal, 1) as not_eaten_kcal,
       round(ratio_g, 3) as not_eaten_ratio_g, round(ratio_kcal, 3) as not_eaten_ratio_kcal, not_eaten_photos,
       nullif(concat_ws('; ',
         case when not_eaten_g is null then 'no deduction stored on this item' end,
         case when not_eaten_g > 0 and not_eaten_kcal is null then 'not-eaten calories NULL' end,
         case when ratio_g < 0 or ratio_g > 1 or ratio_kcal < 0 or ratio_kcal > 1 then 'ratio outside 0..1' end,
         case when abs(ratio_g - ratio_kcal) > 0.1 then 'calorie ratio differs from gram ratio' end,
         case when not_eaten_g > 0 and eaten_kcal is null then 'eaten calories NULL' end,
         case when not_eaten_photos = 0 then 'deduction without a not-eaten photo' end), '') as flag
from rated
order by post, created_at, item;
```
File `scripts/numbers/06-seafood.sql` (needs `uid`; seafood names beside their matched record):
```
with items as (
  select p.id as post_id, p.eaten_at, i.id as item_id, i.name, i.portion_grams, n.calories, n.source_ref, n.food_category,
         coalesce(n.micronutrients, '[]'::jsonb) as micro
  from public.posts p
  join public.post_items i on i.post_id = p.id and i.superseded_at is null
  left join public.item_nutrition n on n.post_item_id = i.id
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
    and i.name ~* '\m(squid|ika|calamari|octopus|tako|takoyaki|eels?|unagi|mackerel|saba|salmon|tuna|shrimps?|ebi)\M'
), cache_foods as (
  select distinct on (fdc_id) fdc_id, description, found_in from (
    select (f->>'fdcId') as fdc_id, f->>'description' as description, 'fdc_cache search' as found_in
    from public.fdc_cache c
    cross join lateral jsonb_array_elements(case when jsonb_typeof(coalesce(c.response->'payload'->'foods', c.response->'foods')) = 'array'
                                             then coalesce(c.response->'payload'->'foods', c.response->'foods') else '[]'::jsonb end) f
    union all
    select coalesce(c.response->'payload'->>'fdcId', c.response->>'fdcId'), coalesce(c.response->'payload'->>'description', c.response->>'description'), 'fdc_cache detail'
    from public.fdc_cache c where c.query like 'fdc-detail:%'
  ) d
  where fdc_id in (select source_ref from items where source_ref ~ '^[1-9][0-9]*$') and description is not null
  order by fdc_id, found_in
)
select left(it.post_id::text, 8) as post, to_char(it.eaten_at at time zone 'UTC', 'YYYY-MM-DD') as eaten_utc, left(it.item_id::text, 8) as item,
       left(it.name, 40) as name, round(it.portion_grams, 1) as grams, round(it.calories, 1) as kcal,
       case when it.source_ref like 'estimate:%' then 'model estimate'
            when it.source_ref like 'unavailable:%' then 'unavailable'
            when it.source_ref = '0' then 'rice-and-protein blend'
            when it.micro @> '[{"approximation":{"kind":"closest"}}]' then 'closest USDA record'
            when it.source_ref ~ '^[1-9][0-9]*$' then 'matched USDA record'
            else coalesce(split_part(it.source_ref, ':', 1), 'none') end as source,
       case when it.source_ref ~ '^[0-9]+$' then it.source_ref end as fdc_id,
       left(coalesce(
         (select m->'approximation'->>'basis' from jsonb_array_elements(case when jsonb_typeof(it.micro) = 'array' then it.micro else '[]'::jsonb end) m
           where m->'approximation'->>'basis' is not null limit 1),
         cf.description,
         case when it.source_ref like 'unavailable:%' then split_part(it.source_ref, ':', 2) end), 90) as record_description,
       case when it.micro @> '[{"approximation":{}}]' then 'item_nutrition.micronutrients approximation.basis' else cf.found_in end as description_from,
       it.food_category
from items it left join cache_foods cf on cf.fdc_id = it.source_ref
order by it.eaten_at, post, name;
```
File `scripts/numbers/07-four-meals.sql` (the four meals of #377 and #456, before and after):
```
select left(p.id::text, 8) as post, p.status,
       (select count(*) from public.post_items s where s.post_id = p.id and s.superseded_at is not null) as superseded_rows,
       left(i.id::text, 8) as item, left(i.name, 40) as name, round(i.portion_grams, 1) as grams, i.portion_text,
       n.food_category as category, round(n.calories, 1) as kcal, round(n.protein_g, 1) as protein_g, round(n.carbs_g, 1) as carbs_g, round(n.fat_g, 1) as fat_g,
       left(n.source_ref, 40) as source_ref,
       (select round(max((m->>'value')::numeric), 1) from jsonb_array_elements(case when jsonb_typeof(n.micronutrients) = 'array' then n.micronutrients else '[]'::jsonb end) m
         where m->>'nutrientId' = '1057') as caffeine_mg_stored,
       (select round(max((m->>'value')::numeric), 1) from jsonb_array_elements(case when jsonb_typeof(n.micronutrients) = 'array' then n.micronutrients else '[]'::jsonb end) m
         where m->>'nutrientId' = '1018') as alcohol_g_stored,
       (select string_agg(l.kind || ' ' || l.amount || coalesce(' (' || l.ml || ' ml)', ''), ', ' order by l.kind)
          from public.intake_logs l where l.post_item_id = i.id) as item_intake_rows,
       (select string_agg(l.kind || ' ' || l.amount || coalesce(' (' || l.ml || ' ml)', '') || ' [' || l.source || ']', ', ' order by l.kind)
          from public.intake_logs l where l.post_id = p.id and l.post_item_id is null) as post_intake_rows
from public.posts p
left join public.post_items i on i.post_id = p.id and i.superseded_at is null
left join public.item_nutrition n on n.post_item_id = i.id
where left(p.id::text, 8) in ('4dfe4411', '8535b793', '8b728c7e', '8ab2eccb')
order by post, i.created_at, item;
```
File `scripts/numbers/08-snapshot.sql` (needs `prefixes`, a comma-separated list of 8-character meal id prefixes; one JSON line for each meal; the output holds full ids and goes to a private file):
```
select jsonb_build_object(
  'post', to_jsonb(p) - 'search_tsv',
  'items', (select coalesce(jsonb_agg(to_jsonb(i) || jsonb_build_object('nutrition', to_jsonb(n)) order by i.created_at, i.id), '[]'::jsonb)
            from public.post_items i left join public.item_nutrition n on n.post_item_id = i.id where i.post_id = p.id),
  'intake_logs', (select coalesce(jsonb_agg(to_jsonb(l) order by l.created_at, l.id), '[]'::jsonb) from public.intake_logs l where l.post_id = p.id),
  'comments', (select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at, c.id), '[]'::jsonb) from public.post_comments c where c.post_id = p.id),
  'media', (select coalesce(jsonb_agg(to_jsonb(m) - 'photo_secret' order by m.position, m.id), '[]'::jsonb) from public.post_media m where m.post_id = p.id),
  'saved_meals', (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) from public.saved_meals s where s.source_post_id = p.id),
  'jobs', (select coalesce(jsonb_agg(to_jsonb(j) order by j.created_at), '[]'::jsonb) from public.jobs j where j.post_id = p.id))
from public.posts p
where left(p.id::text, 8) = any(string_to_array(:'prefixes', ','))
order by p.id;
```
File `scripts/numbers/09-usage.sql` (needs `prefixes` and `since`; model calls and tokens for each meal):
```
select left(c.post_id::text, 8) as post, c.kind, coalesce(c.model, '-') as model,
       case when c.kind = 'fdc' then coalesce(substring(c.request_text from '"event":"([a-z_]+)"'), 'usda ' || coalesce(substring(c.request_text from '"source":"([a-z_]+)"'), '?'))
            else coalesce(substring(c.request_text from '"format":\{"type":"json_schema","name":"([a-z_]+)"'), '-') end as step,
       count(*) as calls, count(*) filter (where c.error is not null) as errors,
       sum(c.input_tokens) as input_tokens, sum(c.output_tokens) as output_tokens, sum(c.duration_ms) as duration_ms,
       min(c.started_at) as first_call, max(c.started_at) as last_call
from public.model_calls c
where left(c.post_id::text, 8) = any(string_to_array(:'prefixes', ','))
  and c.started_at >= :'since'::timestamptz
group by 1, 2, 3, 4
order by post, min(c.started_at);
```
File `scripts/numbers/10-drink-sync.sql` (writes; rewrites the drink records of the three cocktails; no model call, no notification):
```
insert into public.jobs (post_id, kind, priority, status, payload)
select p.id, 'recompute', 200, 'queued', '{"reason":"drink_sync"}'::jsonb
from public.posts p
where left(p.id::text, 8) in ('8535b793', '8b728c7e', '8ab2eccb')
  and p.status = 'ready' and p.deleted_at is null
  and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
returning left(id::text, 8) as job, left(post_id::text, 8) as post, kind, payload;
```
File `scripts/numbers/11-rematch.sql` (writes; needs `post`, a full meal id; keeps the foods and portions and matches each to a record again):
```
begin;
with old as (
  update public.post_items i set superseded_at = now()
  where i.post_id = :'post'::uuid and i.superseded_at is null
    and exists (select 1 from public.posts p where p.id = i.post_id and p.status = 'ready' and p.deleted_at is null)
    and not exists (select 1 from public.jobs j where j.post_id = i.post_id and j.status in ('queued', 'running'))
  returning i.*
)
insert into public.post_items (post_id, name, portion_text, portion_grams, box, mask_path, confidence, source, gtin,
                               not_eaten_grams, count_text, not_eaten_count_text, not_eaten_calories, supersedes)
select o.post_id, o.name, o.portion_text, o.portion_grams, o.box, o.mask_path, o.confidence, o.source, o.gtin,
       o.not_eaten_grams, o.count_text, o.not_eaten_count_text, o.not_eaten_calories,
       case when n.source_ref ~ '^(barcode:|off:|label|user:)' or o.gtin is not null then o.id end
from old o left join public.item_nutrition n on n.post_item_id = o.id;
update public.posts set status = 'queued', fail_reason = null
where id = :'post'::uuid and status = 'ready'
  and exists (select 1 from public.post_items i where i.post_id = :'post'::uuid and i.superseded_at is null);
insert into public.jobs (post_id, kind, priority, status, payload)
select p.id, 'recompute', 200, 'queued', '{"operator":"rematch"}'::jsonb
from public.posts p where p.id = :'post'::uuid and p.status = 'queued'
  and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'));
commit;
```
File `scripts/numbers/12-reanalyse.sql` (writes; needs `post`, a full meal id; re-analyses the meal from its photo; does nothing for a copied meal, a meal with a leftovers photo, a meal with a comment from its owner, a meal with a drink added from the drink sheet, or a meal with a job in flight):
```
begin;
update public.post_items i set superseded_at = now()
where i.post_id = :'post'::uuid and i.superseded_at is null
  and exists (select 1 from public.posts p where p.id = i.post_id and p.status = 'ready' and p.deleted_at is null
              and p.analysis_initialized_at is not null and p.source_post_id is null)
  and exists (select 1 from public.post_media m where m.post_id = i.post_id and m.kind = 'photo' and not m.not_eaten)
  and not exists (select 1 from public.post_media m where m.post_id = i.post_id and m.kind = 'photo' and m.not_eaten)
  and not exists (select 1 from public.post_comments c where c.post_id = i.post_id and c.author = 'user' and c.reverted_at is null)
  and not exists (select 1 from public.intake_logs l where l.post_id = i.post_id and l.source = 'sheet')
  and not exists (select 1 from public.jobs j where j.post_id = i.post_id and j.status in ('queued', 'running'));
update public.posts p set analysis_initialized_at = null, status = 'queued', fail_reason = null, question = null
where p.id = :'post'::uuid and p.status = 'ready' and p.deleted_at is null and p.analysis_initialized_at is not null
  and not exists (select 1 from public.post_items i where i.post_id = p.id and i.superseded_at is null)
  and exists (select 1 from public.post_items i where i.post_id = p.id and i.superseded_at >= now());
insert into public.jobs (post_id, kind, priority, status, payload)
select p.id, 'analyze', 200, 'queued', '{"operator":"reanalysis"}'::jsonb
from public.posts p
where p.id = :'post'::uuid and p.status = 'queued' and p.analysis_initialized_at is null
  and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
returning left(id::text, 8) as job, left(post_id::text, 8) as post, kind, priority;
commit;
```
File `scripts/numbers/13-restore.sql` (writes; needs `post`, `old_ids`, `summary_comment_id` and `old_summary`, all from the snapshot; makes the old foods current again):
```
begin;
update public.post_items set superseded_at = now()
where post_id = :'post'::uuid and superseded_at is null and not (id = any(:'old_ids'::uuid[]))
  and not exists (select 1 from public.jobs j where j.post_id = :'post'::uuid and j.status in ('queued', 'running'));
update public.post_items set superseded_at = null
where post_id = :'post'::uuid and id = any(:'old_ids'::uuid[])
  and not exists (select 1 from public.post_items c where c.post_id = :'post'::uuid and c.superseded_at is null and not (c.id = any(:'old_ids'::uuid[])));
update public.post_comments set body = :'old_summary'
where id = :'summary_comment_id'::uuid and post_id = :'post'::uuid and author = 'model';
insert into public.jobs (post_id, kind, priority, status, payload)
select p.id, 'recompute', 200, 'queued', '{"reason":"drink_sync","operator":"restore"}'::jsonb
from public.posts p where p.id = :'post'::uuid and p.status = 'ready'
  and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
returning left(id::text, 8) as job, kind, payload;
commit;
```
**Tests to run:** none in the suite. In PR 2's worktree, with this run's stack up: `psql "$(grep ^SUPABASE_DB_URL= /tmp/mfa-f25/main/.env.test.fleet25 | cut -d= -f2-)" -X -v ON_ERROR_STOP=1 -v uid=00000000-0000-0000-0000-000000000000 -f scripts/numbers/<file>` for files 02 to 06, each under `PGOPTIONS='-c default_transaction_read_only=on'`. Each must run without error (an unknown account gives empty or zero rows).
Done when: the thirteen files are in the PR with these texts and the five runs succeed.

## Docs PR: branch `docs/fleet25` (#694, #285, #617: the finding)
**Blast radius:** two new files. Reviewed by PPLX. Not merged unless the PM's order names it.
Commit this plan unchanged as `docs/plan-fleet25.md`. Create `docs/findings/nutrition-numbers-study-2026-11-16.md` with the headings given in section "The study" and what each reading found. Ids in it are 8 characters. It names no person and holds no address, token, photo or storage path.

---

## The browser
As the section "The browser" of `docs/plan-fleet21.md` on main says, with these changes: the app is at `http://127.0.0.1:60560`; read `/tmp/mfa-f21` as `/tmp/mfa-f25` and `.env.test.fleet21` as `/tmp/mfa-f25/main/.env.test.fleet25`; start Firefox with `--remote-debugging-port=9315` and the profile `/tmp/mfa-f25/firefox`.

## The study (#694, #285, #617): read-only on production
Run in `<n>` after `set -a; . <main>/.env.local; set +a`. Every command reads. Every `psql` call carries `PGOPTIONS='-c default_transaction_read_only=on'`, so a statement that writes is refused by the database. The account is found without printing it: `ACCOUNT=$(psql "$SUPABASE_DB_URL" -X -Atc "select user_id from public.posts where left(id::text,8)='4dfe4411'")`. The variable is never echoed. In the table, `Q` stands for `PGOPTIONS='-c default_transaction_read_only=on' psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -v uid="$ACCOUNT"`.
**Blast radius:** none; reads only. The photos of step S7 are the owner's and stay in `<private>/photos` until step 8 deletes them.
**Expected cost:** nine queries and at most 120 photo downloads. No model call.

| Reading | Command | Record in the finding |
|---|---|---|
| S1 | `Q -f scripts/numbers/01-owner-check.sql` | The count of meals and of accounts. Anything but 1 and 1 halts the study. |
| S2 | `Q -f scripts/numbers/02-inventory.sql` | Section "1. What is stored": the table as printed. |
| S3 | `Q -f scripts/numbers/04-summary.sql` | Section "2. How many meals show a number that cannot be right, and why": the table as printed, ranked. |
| S4 | `Q -A -F $'\t' -f scripts/numbers/03-suspicious.sql -o <private>/suspicious.tsv` | Section "3. The suspicious foods": for each rule, its ten rows with the largest calories, copied from the file (ids are already 8 characters there). The whole file stays private. |
| S5 | `Q -f scripts/numbers/05-leftovers.sql` | Section "4. Leftovers (#285)": the table as printed. |
| S6 | `Q -f scripts/numbers/06-seafood.sql` | Section "5. Seafood matches (#617)": the table as printed, and for each row one word, `right` or `wrong`, by this rule: wrong when the record names a different animal than the food's name. |
| S7 | Choose the meals to look at: every meal in S5's table; the 40 meals with the most rules in `suspicious.tsv` (ties broken by larger calories); and 20 control meals from `Q -At <<< "select left(id::text,8) from public.posts where user_id=:'uid' and status='ready' and deleted_at is null order by md5(id::text) limit 40"`, taking the first 20 that are not already chosen (the query is given on standard input because `psql -c` does not fill in variables). For each chosen meal, list its photos with `Q -Atc "select m.storage_path, m.not_eaten from public.post_media m join public.posts p on p.id=m.post_id where left(p.id::text,8)='<prefix>' and m.kind='photo' order by m.position"`, and download each into `<private>/photos/<prefix>/` (premise above). Read the meal's current foods from `suspicious.tsv` or with file 07's shape. Look at each photo and judge by the rubric under this table. | Section "6. What the photos show": one row for each meal looked at: its 8-character id, its group (leftovers, flagged, control), and one verdict for each of the four questions of the rubric. No photo and no storage path. |
| S8 | From S7's rows, count. | Section "7. The causes, ranked": for each cause (the food identified, the record matched, the weight estimated, the stored value, the not-eaten step) the number of meals it explains among the flagged meals and among the controls. The share of control meals with any wrong verdict is the best measure of how many unflagged meals are also wrong. |
| S9 | `Q -f scripts/numbers/07-four-meals.sql` | Section "8. The four meals before re-analysis": the table as printed. |

**The rubric for S7.** For each meal, answer four questions, each `right`, `wrong` or `cannot tell`:
1. **The food identified.** Wrong when a food in the list is not in the photo, or a food that fills more than a quarter of the plate is missing from the list.
2. **The record matched.** Wrong when the record's description (from `suspicious.tsv` or S6) is a different food than the name, or a raw food for a cooked one, or a dry weight for a prepared one.
3. **The weight estimated.** Wrong when the stored grams are less than half or more than double what the photo shows, judged against the plate, a hand or cutlery in the picture.
4. **The stored value.** Wrong when the food and the grams are right and the calories still fall outside half to double the usual value for that food and weight.
For a leftovers meal, add a fifth: **the not-eaten step**. Wrong when the share of each food still on the plate in the leftovers photo differs from the stored share by more than 0.25.

The finding ends with a section "9. What this means for revisiting every number": the counts above set against Part 3 of this plan, in five sentences at most, and the list of causes that need their own backlog item, one line each, for the PM to file.

## Re-analysing the four meals (#377, #456): writes on production, after the merge order only
The four meals are the owner's: the Oct 29 black coffee (id starting `4dfe4411`) and three rum cocktails (`8535b793`, `8b728c7e`, `8ab2eccb`). Run in `<n>` after `set -a; . <main>/.env.local; set +a`. In this section, `P` stands for `psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1`, and `FULL <prefix>` stands for the meal's full id read into a shell variable with `P -Atc "select id from public.posts where left(id::text,8)='<prefix>'"` and never printed.
**Blast radius:** four meals of one account. Their foods, numbers, drink records, card images and outlines can change. The owner's phone can show a notification for each meal that is re-matched or re-analysed. Day totals for Oct 29 and the cocktails' days change with them.
**Expected cost:** the drink sync makes no model call. A re-match makes one to five model calls for each food. A full re-analysis makes two calls plus the same for each food. For four small meals that is at most about 60 model calls in all. Step W7 reads the real number.
**How to undo:** step W8, from the snapshot of step W1.

| Step | What | Command | Record |
|---|---|---|---|
| W1 | Snapshot the four meals, before anything is written. | `mkdir -p <private> && PGOPTIONS='-c default_transaction_read_only=on' psql "$SUPABASE_DB_URL" -X -At -v ON_ERROR_STOP=1 -v prefixes=4dfe4411,8535b793,8b728c7e,8ab2eccb -f scripts/numbers/08-snapshot.sql -o <private>/snapshot-four-meals.jsonl`, then `wc -l <private>/snapshot-four-meals.jsonl` | The line count: it must be 4. If it is not, stop this section and report. Note the time; it is `since` for step W7. |
| W2 | The numbers before. | `P -f scripts/numbers/07-four-meals.sql` | The table. |
| W3 | Rewrite the three cocktails' drink records. | `P -f scripts/numbers/10-drink-sync.sql`, then `curl -s "$APP_URL/api/jobs/tick"`. Wait until `P -Atc "select count(*) from public.jobs j join public.posts p on p.id=j.post_id where left(p.id::text,8) in ('8535b793','8b728c7e','8ab2eccb') and j.status in ('queued','running')"` prints 0, reading every 15 seconds for up to 5 minutes and calling the tick again each minute. | The rows the insert returned, and the table of file 07 again. |
| W4 | Judge each cocktail from that table. | A cocktail is **right** when its drink rows hold an `alcohol` row and no `caffeine` row. It is **still wrong** when a `caffeine` row remains, or when it has no drink row at all (its record has no category). | For each cocktail: right or still wrong, and why. |
| W5 | Re-analyse the coffee, and each cocktail that is still wrong, one meal at a time. | For one meal: `P -v post="$(FULL <prefix>)" -f scripts/numbers/12-reanalyse.sql`. When it returns a row, call the tick and wait as in W3 until the meal's `status` in file 07's table is `ready` or `failed` (up to 10 minutes). When it returns no row, the meal is one the full re-analysis leaves alone (file 12's guards): run `P -v post="$(FULL <prefix>)" -f scripts/numbers/11-rematch.sql` in its place, then the tick and the same wait. Start the next meal only when this one is `ready`. | For each meal: which file ran, whether a row came back, and the final status. |
| W6 | The numbers after, and the verdicts. | `P -f scripts/numbers/07-four-meals.sql` | The table. **The coffee is right** when its category is not empty, its calories are at most 0.05 kcal for each gram (9 kcal for 180 g), and its stored caffeine or its drink row shows caffeine above 0. **A cocktail is right** by W4's rule. |
| W7 | The cost. | `PGOPTIONS='-c default_transaction_read_only=on' psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -v prefixes=4dfe4411,8535b793,8b728c7e,8ab2eccb -v since='<the time of W1>' -f scripts/numbers/09-usage.sql` | The table: calls, tokens and seconds for each meal and step. The average for one meal is the pilot figure Part 3 uses. |
| W8 | Put back a meal that came out worse. | A meal came out **worse** when its status is `failed`, or it has no current food, or (the coffee) its calories for each gram are higher than before. For such a meal read from its line of the snapshot: the ids of the foods whose `superseded_at` was empty (`old_ids`, written `{id,id}`), and the id and the text of its first comment whose `author` is `model` (`summary_comment_id`, `old_summary`). When the status is `failed`, first run `P -v post="$(FULL <prefix>)" <<< "update public.posts set status='ready', fail_reason=null, analysis_initialized_at=coalesce(analysis_initialized_at, now()) where id=:'post'::uuid and status='failed'"` (premise above). Then `P -v post="$(FULL <prefix>)" -v old_ids='<list>' -v summary_comment_id=<id> -v old_summary='<text>' -f scripts/numbers/13-restore.sql`, the tick, and the wait. | For each meal put back: why, and file 07's table for it afterwards. A meal that is neither right nor worse is left as re-analysed and reported as not fixed, with its matched record. |
| W9 | What the owner sees. | None by the coder: the app is opened on the owner's account only by GrokBot. | One line for the PM: ask GrokBot to open the four meals and Days for Oct 29 and for the cocktails' days on production, and read the caffeine on each card, under "Show all" and in the day's total. |

A step that fails stops this section for that meal only; the other meals continue. Nothing here is retried more than the table says.

---

# Part 2: not dispatched (43 items): each one's reason

| Items | Reason |
|---|---|
| #753, #944, #945, #946, #947, #948, #949, #955, #322, #323, #454, #512, #523, #615, #703, #708, #222 (17) | In Fleet 24's dispatch now. Planning them twice would put two fleets on one file. |
| #937, #571, #683 (3) | Nothing left to build; the PM closes or GrokBot repeats the check (Fleet 24 plan, Part 2). |
| #628, #690, #698 (3) | #628's PR #918 was closed without merging and the PM holds its file. #690 and #698 merged with PR #922; the PM closes them. |
| #715, #925 (2) | Both turn on PR #682, still open. |
| #929 (1) | The review runner in use is not the one in the repository. The coder says where it lives and commits it. |
| #699 (1) | The owner's other repositories are private, and reading them is not an engineering decision. Written for the owner in "For RT". |
| #212, #594, #579 (3) | A real phone: a packaged product, the share sheet, the camera. |
| #279, #368 (2) | Turning CAPTCHA on, and hammering sign-up on production, can lock people out of the live app. They wait for the app to go public and for a quiet time the PM sets. |
| #373, #375 (2) | Billed log bytes and memory are on the Supabase usage page, which the coder cannot open. Fleet 23's log report and Fleet 24's audit give the bytes by file kind. |
| #60, #687 (2) | Which host names stay in the public repository, and the hackathon portal, are the owner's. |
| #689, #659, #578 (3) | The PM's to settle: the order naming seven merged heads; #659 closes when Fleet 24's three merge; #578's remaining findings to file. |
| #684 (1) | The chip's place needs the designer. The cause of the owner's failed upload can now be read (the ruling allows it), but the row to read is the failed upload's, and nobody has its meal id; the PM adds it to a later fleet with the day and time from the owner's screenshot. |
| #552, #553, #217 (3) | Looks under a slowed processor, which the fleet's Firefox cannot do. GrokBot, or a later fleet that first proves the installed Chromium works. |

Count: 17 + 3 + 3 + 2 + 1 + 1 + 3 + 2 + 2 + 2 + 3 + 1 + 3 = 43.

---

# Part 3: revisiting every stored number (the design; this fleet is its first step)

The owner considers every number wrong. Nobody has measured how many are. Re-analysing every meal blind would spend model calls on meals that are right, could replace a right number with a wrong one, and would leave no record of which is which. So the work goes in four steps, and each step's result sets the size of the next.

**How a wrong number is found: three tests.**
1. **Against itself and against meal size** (no model call). The rules of file 03: a missing value, a zero, calories that disagree with the protein, carbs, fat and alcohol stored beside them, more than 9 kcal for each gram, a portion under 5 g or over 1,500 g, a negative value, a coffee with the calories of a dessert, caffeine on a drink with no caffeine source, a meal under 30 or over 2,500 kcal.
2. **Against the matched record** (no model call). The record's description beside the food's name (rule i of file 03, and file 06).
3. **Against an independent estimate** (model calls). Re-analysing a meal is a second estimate of the same photo. A meal whose total moves by more than 25% between the stored and the new estimate is one where at least one of the two is wrong, and it is looked at. A meal that stays within 25% is taken as stable.

**How a wrong number is fixed.** Through the worker, with PR 2's statements: a forced re-match when the food and the portion are right and the record is wrong; a full re-analysis from the photo otherwise. Old rows are kept, so every meal can be put back.

**How the cost is bounded.** One meal at a time, behind people's own work (priority 200). At most 40 meals an hour, which keeps under USDA's 1,000 requests an hour. A batch stops after two failures in a row, or when one meal in ten has failed. Each batch has a ceiling of meals and of model calls, set from the pilot figure of step W7. Meals the rules pass and the photo check passes are not touched.

**The four steps.**

| Step | Fleet | What | It needs |
|---|---|---|---|
| 1. Measure | 25 (this plan) | The study: how many meals fail a rule, why, and how many unflagged meals are also wrong (the 20 controls). The four-meal re-analysis is the pilot: it proves the statements on production and gives the cost of one meal. | Nothing more. |
| 2. Make it safe to repeat | 26 | Fix what makes a re-analysed meal wrong again (titles 2 to 6 below), and build one operator command that takes a list of meals and does for each what this plan does by hand: snapshot, re-analyse, wait, compare old with new, write a ledger line, stop at the ceilings, and put a meal back on request (title 1). | The issue numbers below. |
| 3. Fix the flagged meals | 27 | Run the command over the meals that fail a rule, worst first. Afterwards run file 04 again: the count of flagged meals must fall. Meals whose total moved by more than 25% go to a photo check with the rubric. | Step 2 merged; the ceilings from the pilot. |
| 4. The rest | 28 | The meals that passed every rule, in batches, kept only where the new total is within 25% of the old or the photo check prefers the new; then the other accounts, and saved meals and copies. | Step 3's result. If the controls of step 1 show that unflagged meals are rarely wrong, this step shrinks to a sample. |

**How each step is verified.** By numbers, not by opinion: file 04 before and after (flagged meals must fall); the ledger's old and new totals; the photo check on every meal that moved by more than 25% and on a fixed sample of those that did not; GrokBot's reading of the same meals in the app.

**Issue titles the PM is asked to have numbered** (the planner files nothing):
1. Re-analysing a stored meal needs hand-run SQL: there is no command that does it safely for a list of meals.
2. A re-analysed meal can copy its numbers from an earlier meal that is still wrong.
3. After a meal is re-analysed, its first comment and its saved-meal copy can keep the old numbers.
4. Removing a correction or a leftovers photo after a re-analysis rebuilds the meal from the old numbers.
5. An estimated coffee or tea never stores caffeine, because a model estimate holds no caffeine value.
6. A drink whose matched record has no category is not counted as a drink.
7. Revisit the stored numbers: re-analyse the meals that fail a rule.
8. Revisit the stored numbers: the meals that pass every rule, the other accounts, and saved meals.
Titles 2 to 4 are read from the code and not yet seen on production; the study and the pilot say which are real.

---

## For RT (read from here)

- **The run stops once,** before the merges. Nothing is changed on the live app before the PM's order.
- **All six chosen items are worked.** The other 43 each have a reason.
- **Your four meals are re-analysed** (the Oct 29 black coffee and the three rum cocktails), after the PM's order, so their caffeine is stored correctly. Every old number is kept and each meal can be put back. Your phone may show a notification for each meal as it finishes. Expected cost: at most about 60 model calls.
- **Your meals are studied, read-only.** The study counts how many meals show a number that cannot be right and ranks the causes. It also looks at the photos of every leftovers meal, the 40 most suspicious meals and 20 ordinary ones, and says which step went wrong: the food, the matched record, the weight, the stored value, or the leftovers step. The photos are read on the server, kept out of the repository and deleted at the end.
- **The Days words are decided, by AGY.** A logged entry is a "meal", not a "post". "Go to" becomes "Go to month". "No posts" becomes "No meals". "Posted today" becomes "Today's meals". "12 days posted" becomes "12 days logged". "Days", "Selected day", "Choose a day", "Open the day", "not finished", "Previous month", "Next month" and "Photograph a meal today" stay.
- **Revisiting every number is planned in four steps,** and this fleet is the first: measure, make re-analysis safe to repeat, fix the meals that fail a rule, then the rest. The reason for the order: nobody knows yet how many numbers are wrong, and re-analysing blind could replace a right number with a wrong one. Each later step is sized by the one before.
- **Two causes are already known from the code.** A coffee whose numbers came from a model estimate can never show caffeine. A drink whose matched record has no category is not counted as a drink. Both are on the list for the PM to file.
- **Known risk of a re-analysis:** a meal can take its numbers from a similar earlier meal that has not been re-analysed. The pilot shows whether that happens.
- **Nothing in this plan waits on you.**
- **One thing only you can give, when you choose to.** Item #699 asks how this project's review and merge process compares with your other recent projects. Those projects' code is private to you. To compare them, the team needs you to say which projects to read and to let an agent open them. If you say yes and name them, a coder lists each project's practice beside this one's. If you say nothing, the comparison stays undone and nothing else is held up.
