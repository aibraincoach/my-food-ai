# My Food AI — build plan, Fleet 11 (the 23:00 WIB backlog: up to fourteen PRs, measurements, closures, one report)

You are the coder. Written Tue 2026-11-03 ~23:00 WIB (16:00 UTC), corrected by RT at ~23:10 WIB (his corrections are folded in below). All work is in `aibraincoach/my-food-ai`. Every time is WIB (UTC+7).

## Stops: zero

**Start:** at once, all lanes in the first 10 minutes.

**This plan is the merge order for its code PRs.** RT approved this rule for Fleet 11 on Nov 3 ~22:20 WIB, answering the planner: "Yes, plan is merge order". The coder merges each Fleet 11 code PR at the exact head the reviewer cleared with `BLOCKERS: NONE`, in ascending PR number. Nobody sends a further order. **Owner merge rule, Nov 3 (verbatim):** "If the code checks out and the review is fine with zero blockers, the thing gets merged. When the planner re-evaluates, if there are still problems or defects, it goes on the backlog." A defect found after a merge is filed as a backlog issue, not reverted.

**No freeze for Fleet 11.** RT ruled on Nov 3 ~22:20 WIB: "No freeze; build everything". Nothing is cut in advance and no item waits on a clock.

**Recording hold (RT, Nov 3 ~23:10 WIB).** Nothing merges and nothing is deployed while RT records the video. When RT says recording starts, hold every merge and every migration until he says it is over. Then resume item 16 where it stopped. Migrations 0046 and 0047 are applied to production **before** recording starts, and each is read back. Applying them early is safe: 0046 only adds a bucket that nothing calls until item 2 merges, and 0047 only widens two checks.

**Out of scope (RT, Nov 3 22:18 WIB):** the Interdit section (#114 Facebook production login, #115 dark mode, #218 hydration share) and #279 CAPTCHA, which is switched on only at public launch. Nothing in this plan touches CAPTCHA, the hCaptcha variables or Supabase Auth settings. Nothing sends sign-ups through the production form (RT withdrew that probe on Nov 3 ~15:15 WIB, and it stays withdrawn).

## Every backlog item, and what Fleet 11 does with it

The backlog is the PM's list stamped "Tuesday 2026-11-03 at 23:00 WIB" (RT's correction; the pasted copy read 22:10). Every item is here, once.

**What the right-hand column means:**
- **Code n**: built in plan item n.
- **Measure n**: a measurement or proof in item n, recorded in `docs/run11-report.md`, with no product code.
- **Close n**: closed in item 15 with the evidence named in item n.
- **RT**: only the owner can do it (listed at the end).

| Issue | Backlog item | Fleet 11 |
|---|---|---|
| #212 | Barcode and label untested on a phone | Code 4, Code 5; phone check RT |
| #285 | Half-eaten plate on a phone | RT |
| #318 | Read the README | RT, after item 3 merges |
| #26 | Video and submission | RT |
| #379 | Phone checks over mobile data | RT |
| #368 | Sign-ins may share one rate limit | Measure 13a (read-only) |
| #369 | Repo does not show Run 8; stale test claims | Code 3; Close 3 |
| #370 | Camera view stays open | Proven only in emulation (#409). Phone check added to #379, RT |
| #372 | Feed photos too large | Measure 13b; Close 13b |
| #373 | App reads more than it needs | Measure 13c |
| #374 | When the empty-claim loop started | Close 13d |
| #375 | Storage egress largest and uncut | Measure 13e |
| #222 | Feed fails to open; photos slow | Phone part RT (#379). Nothing else |
| #281 | Muse Spark Open | RT acceptance only |
| #306 | Every saving tap shows its result at once | Code 12; Close 12 |
| #307 | Food names before numbers | Code 1; Close 1 |
| #282 | Live app keeps working while judges use it | Measure 14; Close 14 |
| #287 | README shows the Meta models and evidence | Code 3; Close 3 |
| #60 | Start-here README; private-string search | Code 3 (search); owner's keep list RT |
| #322 | Tick cold start | Measure 13f; Close 13f (the phone post stays RT under #379) |
| #377 | Existing drink posts show no caffeine | Code 18 (the ten rows #401 left) |
| #462 | Desktop totals, narrow Home, capture sizes, attachment picker (open PR) | Measure 17 (Today column at 1100×800); fix PR if it overflows |
| #323 | One sign-in check per page | Measure 13g; Close 13g |
| #324 | Day totals once | Measure 13h; Close 13h |
| #294 | Words read naturally | RT rules on each term in `docs/run10-terms.md` |
| #193 | Screens against the designer's frames | Close 15 (phone fixed in Fleet 10, desktop by #460) |
| #217 | Smoothness audit | Measure 13i |
| #449 | Food names not shown on a new upload | Code 1 |
| — | Recording account hits the hourly model cap | Code 2 |
| #348 | Photographed drink card on production | RT (owner's three phones) |
| #351 | Drink tile sizes and order | RT (owner's three phones) |
| #450 | README test results wrong; lint fails | Code 3 |
| #451 | Every barcode scan "not in the database" | Code 4 |
| #452 | Visible nutrition label "not found" | Code 5 |
| #453 | Barcode prompt over the camera | Code 6 |
| #454 | Days not one continuous calendar | Code 7 |
| #455 | Swiped drink card shows a number | Code 8 |
| #456 | Rum cocktail logged with 15 mg caffeine | Code 9 |
| #457 | Alcoholic drink shows liquid, not alcohol | Code 10 |
| #458 | Caption box hidden behind the keyboard | Code 11 |
| #413 | Desktop rebuilt to frames 6a–6f | Merged as #460. Close 15 |
| #279 | CAPTCHA | Out of scope (RT) |
| #114, #115, #218 | Interdit | Out of scope |

## Facts checked by the planner (Tue 2026-11-03, 22:15–23:00 WIB)

**Repository state** (re-read at ~23:10 WIB; main moves, so **cut every lane from the current `origin/main` and re-read every file and line this plan names before editing it**. A find text that no longer occurs exactly once is a false fact: a legal halt for that step only)
- Main is `65ac905d95f71b3e9fa93de16ffcf67ef3614381`, after #461 (test and lint gates, `124a89b`) and #459 (backlog). Production is deployed at `65ac905`. Check: `git log -1 origin/main`.
- Open PRs:
  - #462 "Fix desktop totals, narrow Home and capture access", head `905b47414efd119ba27b22782af647aa2059619f`, in review. It touches `CaptureSheet.tsx`, `DesktopToday.tsx`, `DesktopDays.tsx`, `(tabs)/page.tsx`, `profile/page.tsx` and `globals.css`.
  - Draft docs #463 "prepare next fleet".
  - Docs #472, the backlog sync of 22:54 WIB.
  - Check: `gh pr list --state open`. Fleet 11 does not touch these PRs. Lanes that edit `CaptureSheet.tsx` merge main in after #462 lands.
- #461 already landed:
  - `npm test` (`scripts/test.mjs`), `npm run test:db`, `test:stack` and `test:app`;
  - both lint fixes (`PostHandle.tsx`, `PostMenu.tsx`);
  - the README tests section: test:db 32/0/0, `npm test` 567 passed / 0 failed / 6 skipped, lint 0 errors / 6 warnings;
  - `docs/testing.md`.
  - Check: `git show origin/main:README.md | sed -n '/^## Tests/,/^## Run it/p'`.
- The last migration is still `0045_drink_post_operations.sql`. **Fleet 11 adds 0046 (item 2) and 0047 (item 10).** Check: `git ls-tree --name-only origin/main supabase/migrations/ | tail -1`.
- The edit sites in items 1, 5 and 6 still occur at `65ac905`: `Feed.tsx:491` `missing=0;setFresh(card);`, and `CaptureSheet.tsx:272`, `:504` and `:549`.

**#449: new uploads drop the pending names**
- The worker writes `posts.pending_items` through `writePendingNames`/`writePendingKcal` (`src/lib/pipeline/pending-items.ts`). A trigger clears them at ready/failed/needs_input (`supabase/migrations/0033_pending_items.sql`).
- `getPostCard` (`src/lib/posts/feed.ts`) does not select `pending_items`.
- `RealtimePost.tsx:66-70` does a second read of `pending_items,fail_reason` while unsettled and sets `pendingItems`. `PostCard.tsx:61` renders it.
- A new upload renders `UploadHydratedCard` in `src/components/Feed.tsx`, and its `read()` calls only `getPostCard` and then `setFresh(card)`. Check: `sed -n 474,495p src/components/Feed.tsx`.

**Hourly cap**
- `capUser` (`src/lib/limits/user-cap.ts`) returns 429 "You have made a lot of requests this hour. Try again later."
- The limits are in SQL `user_hit` (`supabase/migrations/0035_user_call_caps.sql`), with `post` at 40. The table's `route` check lists `'label','transcribe','fdc_search','fdc_barcode','post','correct'`.
- `src/app/api/drinks/identify/route.ts` calls `capUser(user.id,'post')`, so it shares the 40/hour bucket with `api/posts` and `api/posts/food`.

**#450**
- `README.md:41` row reads `node --test tests/*.test.mjs` | "153 passed, 148 failed, 2 skipped. Known failures: …".
- `npx eslint --ignore-pattern 'uploads/**' .` gives 2 errors and 6 warnings:
  - `src/components/PostHandle.tsx:22` `react-hooks/set-state-in-effect`;
  - `src/components/PostMenu.tsx:22` `react-hooks/refs` (`savingRef.current` read in the Sheet's `onClose`).
- Plain `npm run lint` also lints the git-ignored `uploads/` scratch files.

**#451**
- The barcode lookup asks USDA FDC Branded only: `lookupBarcode` in `src/lib/fdc/barcode.ts`, called from `resolveProduct` in `src/lib/fdc/barcode-resolver.ts`. No Open Food Facts client exists. Check: `git grep -n openfoodfacts origin/main -- src` is empty.
- Open Food Facts has the owner's pack. `GET https://world.openfoodfacts.org/api/v2/product/7622300761363.json?fields=code,product_name,brands,quantity,serving_size,serving_quantity,nutriments` returned brand "Oreo", energy-kcal_100g 489, proteins_100g 5, carbohydrates_100g 70, fat_100g 21, sugars_100g 36, sodium_100g 0.4 (g). Checked 22:40 WIB with curl.
- `mergeProduct` in `barcode-product.ts` returns null when `base` is null and there is no own label correction.
- `barcodeNutrition` sets `source_ref` to `String(product.fdcId)` unless `source==='own'`.

**#452**
- The prompt `src/lib/prompts/spark/label.ts` reads "Read only the printed nutrition facts panel…". It names no language and no per-100 g layout.
- `CaptureSheet.tsx:269` sets `labelState` to `"missing"` when `is_label` is false or `serving`/`per_serving` is null.
- The catch at `:272` also sets `"missing"` on any server error, so a 502 shows "No nutrition label found".

**#453**
- `CaptureSheet.tsx:504` is `<p className="absolute bottom-full left-1/2 mb-6 w-[320px] -translate-x-1/2 text-center text-[15px] text-white">Point at the barcode. It reads on its own.</p>`.

**#454**
- The phone Days path is `DaysView.tsx` after its `if(desktop)return …<DesktopDays…/>` line.
- It orders months newest first (`Object.keys(months).sort().reverse()`) and renders one `MonthGrid` per month, each with its own heading and weekday row.
- It loads older months through the `tail` sentinel. No phone code scrolls to today.
- `MonthGrid` is also imported by `StoryPlayer`, `DesktopDays` and `GoToMonthSheet`, so item 7 adds a new phone-only component and leaves `MonthGrid` unchanged.

**#455, #456, #457**
- The swiped drink card is the `isDrink` branch of `src/components/ResultsCard.tsx` (big `amountMl` + "ml", then "N ml consumed today", "from drinks", "from food").
- Caffeine comes only from USDA nutrient 1057 on the matched food, or the cola fallback (32 mg per 330 ml):
  - analysis drinks: `drinksFromItems` in `src/lib/intake/drinks-from-items.ts`;
  - composer drinks: `identifyDrinks` in `src/lib/intake/identify-drinks.ts`;
  - composer publish SQL: `0040_composer_drinks.sql:70`, which makes `caffeine` when 1057 ≥ 1 mg.
- `summary-line.ts` (sheet-drink branch) appends the **day's** caffeine whenever the day total > 0, even when this drink has none.
- `intake_logs.kind` is checked `in ('water','caffeine')` (`0016_intake_logs.sql`). `sync_item_drinks` inserts `value->>'kind'` (`0029_drinks_from_items.sql`).
- Hydration (`src/lib/intake/hydration.ts`) sums every row's `ml` into `drinksMl`. The phone "Today" line is `IntakeSheet.tsx:103`: `` `Today: ${number(ml)} ml · ${number(caffeine)} mg caffeine` ``.
- Nothing reads USDA nutrient 1018 (alcohol). Check: `git grep -n 1018 origin/main -- src` is empty.

**#458**
- The composer wrapper (`CaptureSheet.tsx:473`) is sized to `window.visualViewport` (height and top).
- The phone `LightComposer` is a flex column: a header, then a scroll area holding the photo (single shot `h-[276px] w-[220px]`), the `textarea#capture-caption`, the "Another photo"/"Search foods" row and the option rows, then a footer with Post.
- Nothing scrolls the caption into view on focus.
- `src/app/layout.tsx` exports `viewport = { themeColor, viewportFit: "cover" }`.

**#306**
- Bookmark, card-menu Save meal and Edit caption already change at the tap: `save-optimistic.ts`, and `PostMenu.tsx` dispatches `post-caption` before `updateCaption`.
- Log again waits: `LogAgainSheet.tsx` awaits `uploadManager.postCopy`, which awaits `persist()` before it inserts the local card (`src/lib/posts/upload-manager.ts`).

**#282**
- `fdcFetch` (`src/lib/fdc/client.ts`) reads `Retry-After`. The worker requeues on `FdcRateLimited` through `requeue_rate_limited_job` (`0034_renew_lease.sql`) without spending an attempt, and `PostCard` shows "The food database was busy. Retrying automatically."
- A failed post shows `failure-message.ts` text and a "Try again" button that calls `POST /api/posts/[id]/retry`.

**#322**
- `src/lib/worker/handlers.ts` registers every job with `lazy(() => import(...))`. The tick route imports `runWorker`, which imports `handlers.ts`, not the job modules.

**Fleet 10 answers already posted** (latest issue comments, read 22:35 WIB):
- #368: login audit rows carry no IP.
- #374: the claim-and-fail pattern is present from #37 (`c8dd4ec`, Oct 27); Nov 2 is the first full day near one claim a second; it does not establish #222's cause.
- #375: breakdown by kind and client, with #439 cutting the strip photos by 87%.
- #373: ingestion bytes unavailable (Management usage 404, Studio 401); memory explained by page cache.
- #323 and #324: one browser Auth read and zero browser day reads per opening.
- #322: no cold-instance timing.

## Premises (unchecked; the report says which were false)

- **P1.** Open Food Facts returns a usable product for most Indonesian packs. Item 4's second pack tests it.
- **P2.** The 15 mg on the tiki cocktail came from a USDA match carrying nutrient 1057. Item 9 step 1 records the item's `source_ref` and micronutrients before changing anything. Item 9's code is the same whatever it shows.
- **P3.** The Goldfish label failed on `is_label:false` or a null `per_serving`, not on a server error. Item 5 step 1 records which. Item 5's code is the same whatever it shows.
- **P4.** The Supabase Management Logs API (used by Fleet 10 for #368/#374) can filter `auth_logs` and `edge_logs` for one minute. Items 13g/13h use it. Where it is refused, that section states the command, the refusal and the remaining unknown.
- **P5.** `card-data.ts` marks a post as a drink card when every item has an intake row. Item 10 step 6 verifies this before editing `ResultsCard`.

## Lanes

Up to fourteen worktrees under `../my-food-ai-wt/run11-<lane>`, each cut from the current `origin/main` at the moment the lane starts (`65ac905` at 23:10 WIB), all started in the first 10 minutes. Lane N starts only if item 17 finds an overflow. Lane C opens a PR only if the README changes. Nothing is stacked. **#462 also edits `CaptureSheet.tsx`.** Lanes E and F merge main in after #462 lands, and that refresh gets the reviewer's confirmation.

**Lanes that share a file:**
- C, D and K all edit `CaptureSheet.tsx`, each in a different region: D the label lines 262–272 and 549, F line 504, K the composer focus.
- I and J both edit `drinks-from-items.ts` and `identify-drinks.ts`.
- J and H both edit `ResultsCard.tsx`/`card-data.ts`.

The second of each group to merge brings main in by merge commit and resolves the conflict. A refresh with a code change gets the reviewer's confirmation (owner ruling, Nov 2 23:21).

| Lane | Item | Branch | Files it owns |
|---|---|---|---|
| A | 1 | `run11/upload-names` | `src/components/Feed.tsx` (`UploadHydratedCard` only), `src/lib/posts/feed.ts` (new `getPendingItems`) |
| B | 2 | `run11/drink-cap` | `supabase/migrations/0046_drink_identify_cap.sql` (+ rollback), `src/lib/limits/user-cap.ts`, `src/app/api/drinks/identify/route.ts`, `tests/db/user-cap.test.mjs` |
| C | 3 | `run11/readme-tests` | `README.md` (tests section and links only) |
| D | 4 | `run11/barcode-off` | `src/lib/fdc/open-food-facts.ts` (new), `src/lib/fdc/barcode-resolver.ts`, `src/lib/fdc/barcode-product.ts`, `tests/open-food-facts.test.mjs` (new) |
| E | 5 | `run11/label-any-language` | `src/lib/prompts/spark/label.ts`, `src/components/CaptureSheet.tsx` (lines 262–272, 549) |
| F | 6 | `run11/barcode-prompt` | `src/components/CaptureSheet.tsx` (line 504) |
| G | 7 | `run11/days-continuous` | `src/components/PhoneCalendar.tsx` (new), `src/components/DaysView.tsx` (phone path) |
| H | 8 | `run11/drink-card-glyphs` | `src/lib/intake/drink-glyph.ts` (new), `src/components/ResultsCard.tsx`, `src/lib/pipeline/card-data.ts`, `tests/drink-glyph.test.mjs` (new) |
| I | 9 | `run11/alcohol-caffeine` | `src/lib/intake/drinks-from-items.ts` (caffeine), `src/lib/intake/identify-drinks.ts` (caffeine), `src/lib/posts/summary-line.ts`, `tests/drinks-from-items.test.mjs` |
| J | 10 | `run11/alcohol` | `supabase/migrations/0047_alcohol_intake.sql` (+ rollback), `src/lib/intake/alcohol.ts` (new), `src/lib/intake/drinks-from-items.ts` (kind), `src/lib/intake/identify-drinks.ts` (skip), `src/lib/intake/hydration.ts`, `src/components/IntakeSheet.tsx` (Today line), post overlay and summary line, `tests/db/alcohol-intake.test.mjs` (new) |
| K | 11 | `run11/caption-keyboard` | `src/components/LightComposer.tsx` (phone branch) |
| L | 12 | `run11/log-again-instant` | `src/components/LogAgainSheet.tsx`, `src/lib/posts/upload-manager.ts` (`postCopy` only) |
| M | 18 | `run11/drink-gaps-377` | `scripts/backfill-item-drinks.ts` (run only, unless a real gap needs a code fix), `docs/run11-report.md` section 18 |
| N | 17 | `run11/fix-today-1100` (only if needed) | `src/components/DesktopToday.tsx` |

**Dependencies:**
- Item 10 depends on item 9's alcoholic test (`isAlcoholic` in `src/lib/intake/alcohol.ts`). Lane I creates `alcohol.ts` with `isAlcoholic` exactly as written in item 9; lane J adds to it. Whichever lands second merges main in.
- Item 8 reads the `alcohol` kind from item 10. Lane H builds against the type in item 10 step 1. If item 10 has not merged when H is ready, H merges main in after it.
- Nothing else depends on another item.

**Migrations:**
- Apply order: **0046** then **0047**, each to production immediately before its PR merges, verified by reading back the function or constraint definition.
- Each migration has a rollback file `supabase/rollbacks/<number>_<name>.down.sql`, as in 0038–0045.

## 0. Docs PR (first 5 minutes)

Cut `run11/docs` from `origin/main`. Commit this file unchanged as `docs/plan-run11.md`. Open "docs: Fleet 11 plan". The report `docs/run11-report.md` lands on this branch. This PR is not merged.

**Cleanup first:** `git worktree list`. Remove any leftover `../my-food-ai-wt/*` worktree whose branch is merged or deleted on the remote, before the first PR. Leave the untracked files in the main checkout (`docs/reviews/mfa-pplx-pr311-e7ece5c.md` and the stray `:first-child`, `div:first-child`, `{`) untouched.

## 1. A new upload shows its food names before its numbers (Lane A): #449, #307

**Service.** New `getPendingItems(db, id)` in `src/lib/posts/feed.ts` owns the read. `UploadHydratedCard` in `Feed.tsx` is the boundary. `RealtimePost.tsx` keeps its own read unchanged.

**Step 1.** Append to `src/lib/posts/feed.ts`:

```ts
// Progress names and the failure reason are read separately so the card read stays small.
export async function getPendingItems(db: SupabaseClient, id: string): Promise<{ pendingItems: ReturnType<typeof readPendingItems>; fail_reason: string | null }> {
  const { data } = await db.from('posts').select('pending_items,fail_reason').eq('id', id).abortSignal(AbortSignal.timeout(8000)).maybeSingle();
  return { pendingItems: readPendingItems(data?.pending_items), fail_reason: (data?.fail_reason as string | null) ?? null };
}
```

Add `import { readPendingItems } from '@/lib/pipeline/pending-items';` to the file's imports. If `SupabaseClient` is not yet imported, add `import type { SupabaseClient } from '@supabase/supabase-js';`.

**Step 2.** In `src/components/Feed.tsx`, inside `UploadHydratedCard`'s `read()`, replace

```ts
          missing=0;setFresh(card);
```

with

```ts
          missing=0;
          if(card.status!=='ready'&&card.status!=='needs_input'){
            const pending=await getPendingItems(db,id);
            if(!live)return;
            Object.assign(card,{pendingItems:pending.pendingItems,fail_reason:pending.fail_reason});
          }
          setFresh(card);
```

Add `getPendingItems` to the existing import from `@/lib/posts/feed` in `Feed.tsx`.

**No new test** (display). **Done** when the run-at-end check (item 16) records a genuine new upload on production showing food names in `[role=status][aria-label=Processing]` before any total. **Blast radius:** one extra small read per poll of an unsettled new upload. A failing read throws inside the existing `try`, so the last good card stays.

## 2. Photo drink checks get their own hourly bucket (Lane B): recording-account cap

**The fix.** Drink identification stops spending the 40/hour `post` bucket and gets its own `drink_identify` bucket of 120/hour. Every other limit stays.

**Service.** `capUser` in `src/lib/limits/user-cap.ts` owns the check. `api/drinks/identify/route.ts` is the boundary.

**Step 1.** New `supabase/migrations/0046_drink_identify_cap.sql`:

```sql
-- Photo drink checks get their own hourly bucket so a recording session's posts are not capped by them.
alter table public.user_call_hits drop constraint user_call_hits_route_check;
alter table public.user_call_hits add constraint user_call_hits_route_check
 check (route in ('label','transcribe','fdc_search','fdc_barcode','post','correct','drink_identify'));
create or replace function public.user_hit(p_user_id uuid,p_route text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_limit integer; v_hits integer;
begin
 v_limit := case p_route when 'label' then 30 when 'transcribe' then 60
  when 'fdc_search' then 300 when 'fdc_barcode' then 120
  when 'post' then 40 when 'correct' then 100 when 'drink_identify' then 120 end;
 if v_limit is null then raise exception 'Unknown call route' using errcode='22023';end if;
 insert into public.user_call_hits(user_id,route,hour,hits)
 values(p_user_id,p_route,date_trunc('hour',clock_timestamp()),1)
 on conflict(user_id,route,hour) do update set hits=public.user_call_hits.hits+1
 returning hits into v_hits;
 delete from public.user_call_hits where user_id=p_user_id and hour<clock_timestamp()-interval '1 day';
 return v_hits<=v_limit;
end $$;
revoke all on function public.user_hit(uuid,text) from public,anon,authenticated;
grant execute on function public.user_hit(uuid,text) to service_role;
```

Before writing it, confirm the constraint name: `select conname from pg_constraint where conrelid='public.user_call_hits'::regclass and contype='c';`. If the name differs, use the name it returns. A false name is a false fact (legal halt for this item only).

Rollback `supabase/rollbacks/0046_drink_identify_cap.down.sql`: delete the `drink_identify` rows, restore the 0035 check list and the 0035 function body verbatim.

**Step 2.** In `src/lib/limits/user-cap.ts`, replace

```ts
export type CapRoute = "label" | "transcribe" | "fdc_search" | "fdc_barcode" | "post" | "correct";
```

with

```ts
export type CapRoute = "label" | "transcribe" | "fdc_search" | "fdc_barcode" | "post" | "correct" | "drink_identify";
```

**Step 3.** In `src/app/api/drinks/identify/route.ts`, replace

```ts
 const capped=await capUser(user.id,'post');if(capped)return capped;
```

with

```ts
 const capped=await capUser(user.id,'drink_identify');if(capped)return capped;
```

**Test** (access/limits): in `tests/db/user-cap.test.mjs` add one case: 41 `drink_identify` hits for one user leave `post` at 0 and return true. The 121st `drink_identify` hit returns false.

**Done** when 0046 is applied and read back on production, and the item 16 recording-length session (eight photos, two with drinks, on test account 1 within one hour) shows no cap message. **Blast radius:** the call-cap table and function used by every capped route. A wrong function body would let every route through or block it, and the test covers both.

## 3. The README's tests match a fresh run at the head (Lane C): #450, #369, #287, #60

**Mostly done by #461 (RT, Nov 3 ~23:10 WIB).** The unit-test script, both lint fixes and the test results have landed. Do not redo them. Steps 1–3 and 5 of the original item are **deleted**. Item 3 is now:

1. **Fresh run.** On current `origin/main`, with no production credentials loaded, run `npm run test:db`, `npm test` and `npm run lint`. Record the head SHA and each count.
2. **README.** If any count differs from the README's tests table, change only those cells, and the measured-at text if it names a SHA, to the step 1 numbers and head. If all match, change nothing.
3. **Links and private strings.** As written below.
4. **Close** #450, #369 and #287 on that evidence (item 15). #287: check each part its body lists against the README, and add any missing part in this PR.

If nothing in README.md changes, this item opens no PR. Its evidence goes in the report.

**Links and private strings (step 3).**
- Check every relative link in `README.md` resolves on this branch: `grep -o '](\([^)h#][^)]*\)' README.md` and test each path exists.
- Fix any dead link to the current document on main.
- Run the private-string search Fleet 10 used: `git grep -n -i -E 'supabase\.co|vercel\.app|baseten|@gmail|@aibraintrust|sk-|eyJ' origin/main`.
- List every hit in the PR body. Remove nothing (owner rule, #60).

**No new test.** **Done** when the README's numbers match a fresh run at current main's head, lint reports 0 errors, and every README link resolves. **Blast radius:** README text only.

## 4. A barcode the USDA does not hold is looked up in Open Food Facts (Lane D): #451

**The fix.** When FDC has no product for the code, the resolver asks Open Food Facts (OFF) by GTIN and maps its per-100 g values to `BarcodeProduct`. FDC stays first. OFF needs no key. It asks for a descriptive User-Agent.

**Service.** New `src/lib/fdc/open-food-facts.ts` owns the OFF request and mapping. `resolveProduct` in `barcode-resolver.ts` is the boundary that orders FDC then OFF.

**Step 1.** New `src/lib/fdc/open-food-facts.ts`:

```ts
// Open Food Facts product lookup by barcode: https://openfoodfacts.github.io/openfoodfacts-server/api/
// Used only when USDA FDC has no product for the code. Values are per 100 g or 100 ml as printed.
import { recordCall } from "@/lib/trace/record";
import { gtinCandidates } from "@/lib/fdc/gtin";
import type { BarcodeProduct } from "./barcode-product";

const OFF_URL = "https://world.openfoodfacts.org/api/v2/product";
const FIELDS = "code,product_name,product_name_en,brands,quantity,serving_size,serving_quantity,nutriments";
const USER_AGENT = "MyFoodAI/1.0 (+https://github.com/aibraincoach/my-food-ai)";

const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null);

export function productFromOff(body: unknown, gtin: string): BarcodeProduct | null {
  const p = (body as { status?: unknown; product?: Record<string, unknown> })?.product;
  if (!p || (body as { status?: unknown }).status !== 1) return null;
  const n = (p.nutriments ?? {}) as Record<string, unknown>;
  const kcal = num(n["energy-kcal_100g"]) ?? (num(n["energy_100g"]) === null ? null : num(n["energy_100g"])! / 4.184);
  const per100g = {
    calories: kcal, protein_g: num(n.proteins_100g), carbs_g: num(n.carbohydrates_100g), fat_g: num(n.fat_100g),
    fibre_g: num(n.fiber_100g), sugar_g: num(n.sugars_100g), sodium_mg: num(n.sodium_100g) === null ? null : num(n.sodium_100g)! * 1000,
  };
  if (per100g.calories === null && per100g.protein_g === null && per100g.carbs_g === null && per100g.fat_g === null) return null;
  const name = String(p.product_name_en || p.product_name || "").trim();
  if (!name) return null;
  const quantity = typeof p.quantity === "string" ? p.quantity.trim() : "";
  const servingQty = num(p.serving_quantity);
  const basisUnit: "g" | "ml" = /\bm?l\b/i.test(quantity) && !/\bk?g\b/i.test(quantity) ? "ml" : "g";
  return {
    attribution: "off", fdcId: 0, gtin, name, brand: typeof p.brands === "string" && p.brands.trim() ? p.brands.split(",")[0].trim() : null,
    foodCategory: null, basisUnit,
    servingSize: servingQty, servingSizeUnit: servingQty === null ? null : basisUnit,
    servingText: typeof p.serving_size === "string" ? p.serving_size : null,
    packageWeight: quantity || null, micronutrients: [], per100g,
  };
}

export async function lookupOpenFoodFacts(raw: string): Promise<BarcodeProduct | null> {
  const candidates = gtinCandidates(raw);
  if (!candidates.length) return null;
  return recordCall("off", { query: `gtin:${candidates[0]}` }, async () => {
    for (const code of [...new Set(candidates.map(c => c.replace(/^0+(?=\d{8,13}$)/, "")))]) {
      const response = await fetch(`${OFF_URL}/${code}.json?fields=${FIELDS}`, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(8000), cache: "no-store" });
      if (response.status === 404) continue;
      if (!response.ok) return null;
      const product = productFromOff(await response.json(), candidates[0]);
      if (product) return product;
    }
    return null;
  }, (product) => ({ text: product }));
}
```

If `recordCall`'s first argument is a closed union that does not include `"off"`, add `"off"` to that union in `src/lib/trace/record.ts`, and to the `model_calls`/trace provider check if one exists (check with `git grep -n "'fdc'" supabase/migrations`). If adding it needs a migration, use `"fdc"` instead, with `{ event: "open_food_facts", query: … }`. That is the only allowed change to that call.

**Step 2.** `barcodeNutrition` must not write `source_ref "0"` for an OFF product. In `src/lib/fdc/barcode-product.ts`, replace

```ts
    source_ref: "source" in product && product.source === "own" ? `barcode:${product.gtin}` : String(product.fdcId),
```

with

```ts
    source_ref: "source" in product && product.source === "own" ? `barcode:${product.gtin}` : product.attribution === "off" ? `off:${product.gtin}` : String(product.fdcId),
```

**Step 3.** In `src/lib/fdc/barcode-resolver.ts`, replace

```ts
  try { base = await lookupBarcode(gtin); } catch(error) { if (!(own?.source === "label" && own.per_100)) throw error; }
```

with

```ts
  try { base = await lookupBarcode(gtin); } catch(error) { if (!(own?.source === "label" && own.per_100)) throw error; }
  // USDA FDC holds mostly US packs; Open Food Facts covers the rest. A failure here leaves the FDC answer.
  if (!base) { try { base = await lookupOpenFoodFacts(gtin); } catch { base = null; } }
```

and add `import { lookupOpenFoodFacts } from "./open-food-facts";`.

**Step 4. Test** (data rule: nutrition from an outside source). `tests/open-food-facts.test.mjs` (`node --import tsx --test`) feeds `productFromOff` the recorded Oreo body from Facts and checks:
- name "Oreo…" or the product name, brand "Oreo", calories 489, carbs 70, sodium_mg 400, basis g, attribution "off";
- `barcodeNutrition` of that product gives `source_ref` `off:7622300761363`;
- `{status:0}` gives null;
- a body with no energy and no macros gives null.

Save the recorded body as `tests/fixtures/off-7622300761363.json`.

**Step 5. Attribution (RT, Nov 3 ~23:10 WIB; the Open Database License requires it).**
- `productFromOff` sets a new optional `BarcodeProduct` field `attribution: "off"`. Add `attribution?: "off"` to the interface in `barcode-product.ts`, and keep it through `mergeProduct` (the spread already carries it).
- Every product card whose product came from OFF shows, under its nutrition, in `text-meta text-muted`: `Contains data from <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="underline">Open Food Facts</a>, available under the <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer" className="underline">Open Database License</a>.`
- That applies to the barcode result in `CaptureSheet.tsx` and to the posted product's post detail. Find the barcode result card with `git grep -n "barcodeState" src/components/CaptureSheet.tsx`.
- In the post detail, show the line when the item's `source_ref` starts with `off:` (step 2 writes `off:<gtin>` for OFF products).

- Check every reader of `source_ref` that parses it (`git grep -n "source_ref" src | grep -E "Number\(|startsWith|split"`). Each one that would treat `off:` as an FDC ID treats it as non-FDC, as it treats `barcode:`.
- **README.** Under the README's data-sources or credits text (find it with `grep -n -i "USDA\|FoodData" README.md`), add the sentence: `Packaged foods that USDA FoodData Central does not hold are looked up in Open Food Facts. Contains data from [Open Food Facts](https://world.openfoodfacts.org), available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/).` Add the same line to `THIRD_PARTY.md`.

**Done** when, on the preview:
- every OFF product card, in capture and in post detail, shows the attribution line with both links, and the README and `THIRD_PARTY.md` say the same;
- the Oreo code 7622300761363 gives a product card with name and nutrition;
- a second pack, OFF code 8992760221028 (record what it returns; if OFF has no entry, use the first Indonesian code from `https://world.openfoodfacts.org/country/indonesia.json` page 1 and name it), does too.

The report records that the lookup asked FDC first, FDC had no entry because its Branded data holds mostly US-registered products, and OFF answered. The owner's three-phone check is RT.

**Blast radius:**
- Every barcode miss now makes up to three OFF requests (≤8 s each). The capture sheet already shows its looking state.
- An OFF value is the pack's printed value as transcribed by OFF volunteers. The product card names the source by its existing database wording.

## 5. A nutrition label in any language is read (Lane E): #452

**Step 1. Record (P3).** On the preview as test account 1, read a nutrition-label photo in Indonesian through `POST /api/label/read`. Use the Commons image `https://commons.wikimedia.org/wiki/File:Informasi_Nilai_Gizi.jpg` or, if it does not exist, the first "Informasi Nilai Gizi" photo in Commons search, and name it. Paste the status and response body into the PR body. This changes nothing below.

**Step 2.** Replace the whole `labelPrompt` string in `src/lib/prompts/spark/label.ts` with:

```ts
export const labelPrompt = `Read only the printed nutrition table in the image. It may be in any language and any national layout, for example "Nutrition Facts" (US), "Informasi Nilai Gizi" (Indonesia), "Nutrition Information" or "Nährwerte" (per 100 g). A table counts as a label when it lists energy and at least one of protein, fat or carbohydrate with amounts. Never estimate or infer a value. Set is_label false only if no such table is readable. Use null for unreadable values. If the table states a serving size in g or ml ("Takaran saji", "Serving size", "Portion"), transcribe that amount and unit and the amounts per that serving ("per sajian", "per serving"). If the table states only per 100 g or per 100 ml, set serving to 100 with that unit and transcribe the per-100 amounts. Energy: use the kcal value ("kkal", "kcal", "Energi total", "Calories"); if only kJ is printed, divide by 4.184. Sodium ("Natrium") in mg; if only salt ("garam") in g is printed, multiply by 400 for mg. Fibre is "Serat pangan", sugar is "Gula", protein "Protein", fat "Lemak total", carbohydrate "Karbohidrat total". Do not copy daily percentages (%AKG, %DV). Return a product name only when printed. box is the table bounds as fractions of image width/height (x,y,w,h), or null. No advice or other text.`;
```

**Step 3.** A server failure must not read as "no label". In `src/components/CaptureSheet.tsx`, replace

```ts
    }catch(e){if(mountedRef.current){setLabelState("missing");setError(e instanceof Error?e.message:"The label could not be read.");}}
```

with

```ts
    }catch(e){if(mountedRef.current){setLabelState("failed");setError(e instanceof Error?e.message:"The label could not be read.");}}
```

Then in the label section (line ~549), replace

```tsx
labelState==="missing"?<><p className="text-body">No nutrition label found</p>
```

with

```tsx
labelState==="missing"||labelState==="failed"?<><p className="text-body">{labelState==="failed"?"The label could not be read. Try again.":"No nutrition label found"}</p>
```

Add `"failed"` to the `labelState` union type where it is declared.

**No new test** (prompt and wording). **Done** when the step 1 Indonesian photo gives a card with the label's printed numbers on the preview, and an English US "Nutrition Facts" photo still does (Commons `File:Nutrition_facts_label.svg` or the first US label photo in Commons). The owner's Goldfish pack on three phones is RT. **Blast radius:** every label read. The schema is unchanged. Per-100-only labels now read as a 100 g serving, which the existing "How much?" choices scale.

## 6. The barcode prompt is readable over any picture (Lane F): #453

In `src/components/CaptureSheet.tsx`, replace

```tsx
              <p className="absolute bottom-full left-1/2 mb-6 w-[320px] -translate-x-1/2 text-center text-[15px] text-white">Point at the barcode. It reads on its own.</p>
```

with

```tsx
              <p className="absolute bottom-full left-1/2 mb-6 w-max max-w-[320px] -translate-x-1/2 rounded-pill bg-overlay px-[14px] py-[6px] text-center text-[15px] text-surface">Point at the barcode. It reads on its own.</p>
```

`bg-overlay` and `text-surface` are the tokens the camera picker beside it already uses (`CaptureSheet.tsx:500`). **No test.** **Page look:** on the preview at 390×844, Barcode mode, pointed at a busy page (the Fleet 10 shelf photo on screen). List differences on the PR. **Done** when the prompt reads over the busy picture. **Blast radius:** one line.

## 7. Days on the phone is one continuous calendar (Lane G): #454

**The design.**
- One weekday header (S M T W T F S), sticky under the top bar.
- Under it, one `grid-cols-7` grid of every day from the first loaded month's 1st to the last day of today's month, oldest at the top and today's month at the bottom. Leading blanks appear only before the first loaded day.
- Weeks run on with no gap and no per-month heading. The 1st of each month shows the short month name before its number ("Nov 1"), in `font-semibold`.
- Each day cell keeps `MonthGrid`'s cell: same button, same `data-day`, same aria-label, kcal/drank text, today outline and disabled rules.
- Days opens with today in view.
- Scrolling to the top loads the next older month. The view does not jump: the new height is added to the scroll position in a layout effect, because iOS Safari has no scroll anchoring.
- The "N days posted" label and the unavailable-food disclosure are kept: they appear once, under the sticky header, for the month whose 1st is nearest the top of the view. Track it with an IntersectionObserver on each month's 1st cell.

**Service.** New `src/components/PhoneCalendar.tsx` owns the layout. It takes the same `months`, `today`, `selected`, `onDay` and `onMonth` (load older) that `DaysView` already holds. `DaysView`'s phone path is the boundary.

**Steps.**
1. Build `PhoneCalendar` as above. Copy the cell markup from `MonthGrid.tsx` lines 37–48 unchanged, except that the number span shows `${monthShort} 1` on day 1.
2. In `DaysView.tsx`'s phone return, replace the `(desktop?[...displayed].reverse():displayed).map(month => <MonthGrid …/>)` line and the `tail` sentinel div after it with `<PhoneCalendar months={months} today={today} selected={selected} onDay={…same handler…} onOlder={()=>loadMonth(shiftMonth(displayed.at(-1)??top,-1))} />`.
   - Use the same `onDay` arrow the MonthGrid line passed.
   - Use whatever function the existing `tail` IntersectionObserver calls to load an older month. Find it at `DaysView.tsx:149-165` and pass that same call.
   - Remove that observer effect only if `tail` has no other use.
3. On mount, `PhoneCalendar` calls `document.querySelector('[data-day="'+today+'"]')?.scrollIntoView({block:'center'})` once.
4. `scrollMonth` (deep link, Go to month) keeps working: each month's 1st cell gets `id="month-YYYY-MM"`, so the existing `scrollIntoView` lands on it.

**No new test** (layout). **Page look:** at 390×844 on the preview, test account 1 (posts in October and November):
- Days opens on today;
- scrolling up runs from November into October with unbroken weeks;
- "Oct 1" and "Nov 1" mark the starts;
- Go to month and a `/days/<date>` link still land.

List differences on the PR. **Done** when all four hold. The owner's three phones are RT. **Blast radius:** the phone Days screen only. Desktop Days (`DesktopDays`) and `MonthGrid`'s other users are untouched.

## 8. A drink's swiped card shows what the drink is (Lane H): #455

**The design.**
- The card leads with a picture of the drink's kind:
  - a coffee cup for coffee, espresso and tea, with its caffeine;
  - a water cup for water, one cup per 250 ml (`Math.max(1, Math.round(ml/250))`), so 500 ml shows two cups;
  - a cocktail glass for cocktails and spirits, and a wine glass for wine, each with its alcohol (item 10);
  - a pint glass for beer, with its alcohol;
  - a plain tumbler for every other drink (cola, juice, milk).
- Beside the picture: the drink's label, then one line:
  - coffee: "N mg caffeine";
  - water: "N ml";
  - alcohol: "N g alcohol · N.N standard drinks";
  - other: "N ml".
- The "consumed today" block below becomes "Today" with a row of small pictures, one per drink logged today in time order (water as cups per 250 ml), then the existing "N ml consumed today" line.
- The "from drinks/from food" split and the caffeine total stay as they are.

**Service.** New `src/lib/intake/drink-glyph.ts` owns the classification:

```ts
export type DrinkGlyph = 'coffee' | 'water' | 'cocktail' | 'wine' | 'beer' | 'tumbler';
export function drinkGlyph(label: string, kind: 'water' | 'caffeine' | 'alcohol', category?: string | null): DrinkGlyph {
  const name = label.toLowerCase(), cat = (category ?? '').toLowerCase();
  if (kind === 'alcohol') return /\bwine\b|champagne|prosecco/.test(name) || cat === 'wine' ? 'wine' : /\bbeer\b|lager|ale\b|stout|pilsner|bintang/.test(name) || cat === 'beer' ? 'beer' : 'cocktail';
  if (/coffee|espresso|latte|cappuccino|americano|\btea\b|matcha/.test(name)) return 'coffee';
  if (/^water\b/.test(name)) return 'water';
  return 'tumbler';
}
export const waterCups = (ml: number) => Math.max(1, Math.round(ml / 250));
```

`card-data.ts` (`cardDataFromRow`) adds `glyph` and `dayDrinks: { glyph: DrinkGlyph; ml: number }[]` to the card data, read from the same intake rows that feed `hydration`. `ResultsCard.tsx` is the boundary that draws them. Draw the six pictures as inline SVG, 1.5 px strokes in `tokens.colors.text` at the size of `text('display-card')`, because the card also renders to PNG and accepts inline SVG only.

**Step 0 (P5).** Read `cardDataFromRow` and confirm when `isDrink` is true. If a post whose every item has an intake row is not a drink card, make it one there. Note this in the PR.

**Test** (data rule). `tests/drink-glyph.test.mjs`: Coffee → coffee; "Water, glass" → water; caffeine "Tea" → coffee; alcohol "Lime and rum tiki cocktail" → cocktail; alcohol "Red wine" → wine; alcohol "Bintang" → beer; water "Coca-Cola" → tumbler; `waterCups(500)` = 2, `waterCups(100)` = 1.

**Done** when, on the preview, a coffee tile, a 500 ml water bottle (two cups), a photographed or typed cocktail and a typed "a glass of red wine" each show their own picture on the swiped card, and the Today row shows the same pictures. The owner's three phones are RT. **Blast radius:** the drink card on screen and in the shared PNG. Meal cards are unchanged.

## 9. A drink with no caffeine source logs no caffeine (Lane I): #456

**Step 1. Record (P2).** Read-only, with the service key: find the owner's tiki cocktail post (`post_items.name ilike '%tiki%'`), and record its item `source_ref`, `food_category`, the 1057 micronutrient and the `intake_logs` row. Paste them into the PR body. Paste no user ID.

**Step 2.** New `src/lib/intake/alcohol.ts` (lane J extends it):

```ts
import type { StoredNutrient } from '@/lib/nutrition/totals';
export const ALCOHOL_CATEGORIES = new Set(['alcoholic beverages', 'beer', 'wine', 'liquor and cocktails']);
const CAFFEINE_SOURCE = /\b(cola|coke|pepsi|coffee|espresso|tea|energy|red bull|kahl[uú]a|mocha)\b/i;
export function alcoholGrams(micronutrients: readonly StoredNutrient[] | undefined): number {
  const n = micronutrients?.find(m => m.nutrientId === 1018 && m.basis === 'portion');
  return n ? Math.max(0, Number(n.value) || 0) : 0;
}
export function isAlcoholic(item: { food_category?: string | null; micronutrients?: readonly StoredNutrient[] }): boolean {
  return ALCOHOL_CATEGORIES.has((item.food_category ?? '').trim().toLowerCase()) || alcoholGrams(item.micronutrients) >= 0.5;
}
// An alcoholic drink keeps USDA caffeine only when its own name names a caffeine source (rum and coke, espresso martini).
export function keepsCaffeine(item: { name: string; food_category?: string | null; micronutrients?: readonly StoredNutrient[] }): boolean {
  return !isAlcoholic(item) || CAFFEINE_SOURCE.test(item.name);
}
```

**Step 3.** In `drinks-from-items.ts` `drinksFromItems`, replace

```ts
    const nutrient = item.micronutrients?.find(n => n.nutrientId === 1057 && n.basis === 'portion');
```

with

```ts
    const nutrient = keepsCaffeine(item) ? item.micronutrients?.find(n => n.nutrientId === 1057 && n.basis === 'portion') : undefined;
```

and import `keepsCaffeine` from `./alcohol`.

**Step 4.** In `identify-drinks.ts`, after the line that builds `nutrition` and before `const caffeine=`, insert

```ts
  if(!keepsCaffeine({name:item.name,food_category:nutrition.food_category,micronutrients:nutrition.micronutrients}))nutrition.micronutrients=nutrition.micronutrients.filter(n=>n.nutrientId!==1057);
```

and import `keepsCaffeine` from `./alcohol`.

**Step 5. Display.** In `src/lib/posts/summary-line.ts`, the sheet-drink branch shows the day's caffeine only when this drink has caffeine. Replace

```ts
${(hydration?.caffeineMg ?? drink?.dayCaffeineMg ?? 0) > 0 ? ` · ${number(hydration?.caffeineMg ?? drink!.dayCaffeineMg!)} mg caffeine` : ''}
```

with

```ts
${drink?.caffeineMg && (hydration?.caffeineMg ?? drink?.dayCaffeineMg ?? 0) > 0 ? ` · ${number(hydration?.caffeineMg ?? drink!.dayCaffeineMg!)} mg caffeine today` : ''}
```

**Step 6. Repair.** After merge, run `scripts/backfill-item-drinks.ts` for the tiki post only (pass its post ID per the script's usage line), so its intake row is rebuilt without caffeine. Record before and after in the report.

**Test** (data rule). In `tests/drinks-from-items.test.mjs` (create if absent):
- an item "Lime and rum tiki cocktail", category "Liquor and cocktails", 1057 = 15 → caffeineMg 0, kind not `caffeine`;
- "Rum and coke", same category, 1057 = 20 → caffeineMg 20;
- "Coffee", 1057 = 95 → 95 (unchanged).

**Done** when the tiki post and a typed "a glass of red wine" show no caffeine on the card, and the day's caffeine total leaves them out, on production after the repair. **Blast radius:** caffeine on alcoholic drinks only. Non-alcoholic drinks are unchanged, and the test covers coffee.

## 10. An alcoholic drink shows its alcohol, not its liquid (Lane J): #457

**The rules.**
- An item is alcoholic by `isAlcoholic` (item 9).
- Its alcohol is USDA nutrient 1018 ("Alcohol, ethyl") for its consumed portion, in grams.
- One standard drink is **14 g** of alcohol (US NIAAA, matching the app's USDA source; listed for RT).
- An alcoholic item becomes an intake row of kind `alcohol`, with `amount` = grams rounded to whole grams (minimum 1) and `ml` = its volume.
- `alcohol` rows never add to water.
- An alcoholic item with no 1018 value logs `alcohol` with `amount` 1 and shows "alcohol unavailable". No value is invented.

**Step 1. Migration** `supabase/migrations/0047_alcohol_intake.sql`:

```sql
-- Alcohol is recorded in whole grams; its liquid is never counted as water.
alter table public.intake_logs drop constraint intake_logs_kind_check;
alter table public.intake_logs add constraint intake_logs_kind_check check (kind in ('water','caffeine','alcohol'));
alter table public.intake_logs drop constraint intake_amount_range;
alter table public.intake_logs add constraint intake_amount_range check (
 (kind='water' and amount between 1 and 5000) or (kind='caffeine' and amount between 1 and 1000) or (kind='alcohol' and amount between 1 and 500)
);
```

Confirm both constraint names first with `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.intake_logs'::regclass and contype='c';`. Use the names it returns. The composer and tile RPCs (`0037`, `0040`, `0045`) keep their own `water`/`caffeine` checks unchanged, because alcoholic drinks no longer take those paths (step 3).

Rollback: delete `kind='alcohol'` rows, then restore both 0016 constraints.

**Step 2. Types and rows.**
- `DrinkRow.kind` and `ItemDrink.kind` become `'water' | 'caffeine' | 'alcohol'`. `ItemDrink` gains `alcoholG: number`.
- In `drinksFromItems`, an alcoholic item returns `{ kind: 'alcohol', amount: Math.max(1, Math.round(alcoholGrams(item.micronutrients))), ml, label, caffeineMg, alcoholG: alcoholGrams(item.micronutrients) }`. Every other item gets `alcoholG: 0`.
- Add `alcoholGrams` to `src/lib/intake/alcohol.ts` (already in item 9's text).

**Step 3. Composer.** In `identify-drinks.ts`, right after `if(!plainWater&&!isDrinkItem(...))continue;`, insert

```ts
  if(!plainWater&&isAlcoholic({food_category:food?.foodCategory,micronutrients:scaleNutrition(food,item.portionGrams).micronutrients as StoredNutrient[]}))continue;
```

An alcoholic drink in a photo then posts as an ordinary item, and analysis gives it its `alcohol` row through `syncItemDrinks`.

**Step 4. Water.** In `hydration.ts`, every sum of drink `ml` skips `kind==='alcohol'` rows, and `itemWaterMl` returns 0 for an item where `isAlcoholic(item)` is true. `WaterItem` gains an optional `food_category`. Find every sum with `git grep -n "\.ml" src/lib/intake src/lib/posts src/components | grep -i -E "reduce|sum"`, and apply the same skip to each one that totals water.

**Step 5. Show it.**
- **Summary line** (`summary-line.ts`, item-drink branch). When any drink row is `alcohol`, the line becomes `Drank: ${g} g alcohol · ${(g/14).toFixed(1)} standard drinks · ${kcal} kcal`. With no 1018 value it reads `Drank: alcohol unavailable · ${kcal} kcal`.
- **Photo overlay.** The amount on the photo ("220 g") shows `${g} g alcohol` for an alcoholic item. Find it with `git grep -n "portion_grams\|grams)} g" src/components/Carousel.tsx src/components/PostCard.tsx`.
- **Today.** In `IntakeSheet.tsx`, the Today line becomes `` `Today: ${number(ml)} ml · ${number(caffeine)} mg caffeine${alcohol>0?` · ${number(alcohol)} g alcohol`:''}` ``, where `alcohol` sums today's `alcohol` rows' `amount`. Read it from the same rows as `ml`.

**Test** (data rule and migration). `tests/db/alcohol-intake.test.mjs` on the disposable stack:
- `sync_item_drinks` accepts an `alcohol` row (amount 16, ml 220) and rejects amount 600;
- the day's hydration `drinksMl` excludes it;
- `drinksFromItems` gives kind `alcohol` for "Bintang" (category Beer, 1018 = 13.9 g) with amount 14.

**Done** when 0047 is applied and read back on production, and on production a photographed cocktail and a typed "a can of Bintang beer":
- each show grams of alcohol and standard drinks on the post;
- each add nothing to the water total;
- the Today line in the intake sheet shows the day's alcohol.

The owner's three phones are RT. **Blast radius:**
- The `intake_logs` constraints, and every reader of `kind`. A reader that assumes two kinds would mislabel an alcohol row; step 4's grep and the test cover the water sums.
- Existing posts keep their rows until re-analysed. No backfill except the tiki repair in item 9.

## 11. The caption stays visible above the keyboard (Lane K): #458

**The fix.** While the phone composer's caption has focus and the keyboard is open, the photo area shrinks to a 72 px thumbnail row and the caption scrolls into view. The Post footer stays, because the wrapper already follows `visualViewport`.

**Service.** `LightComposer.tsx` (phone branch) owns it. The `visualViewport` tracking in `CaptureSheet.tsx` is the existing boundary and is unchanged.

**Steps.**
1. In `LightComposer`, add `const [typing,setTyping]=useState(false);`.
2. On the caption `textarea`, add:
   - `onFocus={()=>{setTyping(true);requestAnimationFrame(()=>caption.current?.scrollIntoView({block:'nearest'}));}}`;
   - `onBlur={()=>setTyping(false)}`.
3. When `typing` is true, render the photo block as one row of `size-[72px] rounded-thumb object-cover` thumbnails (all shots, horizontally scrollable) in place of the 276 px single photo, the 232 px carousel and the grid.
4. Also when `typing` is true, hide the leftovers switch block, the drinks card and the option rows below the "Another photo / Search foods" row. They return on blur.
5. Add `interactiveWidget: "resizes-content"` to the `viewport` export in `src/app/layout.tsx`. On Android Chrome the layout viewport then shrinks with the keyboard too; iOS ignores it.

**No test** (layout). **Page look** in Chrome device emulation, iPhone 12 Pro, with the on-screen keyboard simulated by shrinking the window height to 450 px while the caption has focus: the caption, its typed text and the Post button are visible and nothing overlaps. List differences on the PR. The real iPhone check is RT. **Done** when the emulated check passes on the preview. **Blast radius:** the phone composer while typing. Desktop composer and camera-mode caption are untouched.

## 12. Log again shows its post at the tap (Lane L): #306

**The fix.** Tapping Log again's post button closes the sheet and puts the local upload card at the top of the feed at once. The server save runs after. A failed save shows on that card with the existing upload failure state and its retry.

**Service.** `uploadManager.postCopy` (`src/lib/posts/upload-manager.ts`) owns the order. `LogAgainSheet.tsx` is the boundary.

**Steps.**
1. In `postCopy`, insert the local card (the same insert it does today after `persist()`) **before** awaiting `persist()`. On a `persist()` rejection, mark that card failed through the manager's existing failure path for uploads, and return without throwing.
2. In `LogAgainSheet.tsx`, call `onClose()` before `void uploadManager.postCopy(...)` and stop awaiting it.

**No new test** (UI order; the copy RPC and its tests are unchanged). **Measure** on the preview at 390×844, Chrome "Slow 4G", CPU 4×: tap to the sheet closing and to the card appearing, before (production) and after (preview), five taps each. Then repeat once with the network set Offline to see the failure state.

**Done** when every one of Bookmark, card-menu Save meal, Log again and Edit caption changes the screen before the server answers on Slow 4G, the saved state survives a reload, and a failed save is shown. Record each in the report's #306 table (the other three are already built; Facts). **Blast radius:** Log again only. The copy itself is the same RPC.

## 13. Measurements (no product code), in `docs/run11-report.md`

Each section states the command, the result, and the unknown that remains.

- **13a (#368).** Read-only. Query the Supabase Management Logs API `auth_logs` for the last 24 hours. Record whether any field carries a client or forwarded address, and whether sign-in rows from the app's server action share one address. **No sign-up or sign-in is sent through the production form** (RT, Nov 3 ~15:15 WIB). #368 stays open unless the logs answer it.
- **13b (#372).** Copy into `docs/media-loading.md` the bytes per feed photo before and after from Fleet 10 (#414, #439) with their evidence links. Close #372's docs part. Its "within two seconds on mobile data" and "look the same on a phone" parts are RT (#379), and #372 stays open for them.
- **13c (#373).** Retry the usage page once, through the Management API `GET /v1/projects/{ref}/usage` and the dashboard Usage page in the browser. Record what each gives for log-ingestion bytes. Memory is already explained (Fleet 10 7e). #373 closes only if the bytes are attributed.
- **13d (#374).** Its done condition is met by Fleet 10 7b: the start (#37 `c8dd4ec`, Oct 27, retained to #86 `7e73cd1`) and the merge are named, and the report states the loop is not shown to explain #222. Close in item 15 with that link.
- **13e (#375).** The breakdown by kind and client is Fleet 10 7c. Log-ingestion bytes are as 13c. Close #375 only if 13c measures them. Otherwise it stays open with that one gap.
- **13f (#322).** Cold tick before/after:
  - Push a throwaway branch `run11/tick-eager`, cut from main, whose `handlers.ts` imports every job module statically (the pre-#322 form). Leave main's lazy form as the after case.
  - Each fresh preview deployment's first request is a cold instance. For each deployment, record `curl -w '%{time_total}'` on `/api/jobs/tick` three times: the first, then two more 1 s apart.
  - Use the preview bypass Fleet 10 used, and revoke it afterwards.
  - Put the times in `docs/tick-cold.md`, then delete the throwaway branch and close its PR without merging (it is never reviewed).
  - The phone post through the worker is RT (#379).
- **13g (#323).** On the preview with a fresh test-account session, open Home once. Count `auth_logs` rows for `/user` in that minute and browser `/auth/v1/user` requests together. Repeat for Days and Profile. Then confirm an unsigned request with a forged `x-mfa-verified-user` header to `/profile` still returns 307. Close #323 when the total is one per page open.
- **13h (#324).** Same open. Count day-total reads across server (`edge_logs` for the day-total path in that minute) and browser together. Close #324 when it is one.
- **13i (#217).** Extend `docs/evidence/run10-taps-final` with the two missing columns for every control: pressed state at once (yes/no) and jump or flicker while loading (yes/no). Use Chrome emulation at 390×844 with CPU 4×, and a 240 fps performance trace per control. Every control slower than 100 ms to a visible change, without a pressed state, or that jumps: fix it in this item's own PR `run11/fix-217` if the fix is under 20 lines, otherwise file it as a new issue. The coder may file issues for #217 only. The owner's phone feel is RT (#303).

## 14. Refusals and USDA 429 shown and retried (#282)

On the disposable stack (`npm run test:db` harness, `tests/fake-meta`):
- **Meta refusal.** Drive one post with a Meta refusal. Record the post's `failed` state, the user text "The analysis service refused this request. Try again.", and that `POST /api/posts/[id]/retry` sends it to ready.
- **USDA 429.** Drive one with a USDA 429 carrying `Retry-After: 120`. Record that the job is requeued with `run_after` ≥ 120 s later, that no attempt is spent, and that the card says "The food database was busy. Retrying automatically."

If either test already exists (Fleet 10 7l), cite it by name and run it. Write a new one only where none exists. Close #282 with the run output. The Meta credits end date is RT (#303).

## 17. The desktop Today column at 1100×800 (#462's head; Lane N only if it overflows)

#462 covers the desktop totals, the narrow Home layout, the capture window sizes and the attachment picker. The Today column at 1100×800 is still unchecked (RT, Nov 3 ~23:10 WIB).

1. Check out #462's head (`gh pr view 462 --json headRefOid`; `905b47414efd119ba27b22782af647aa2059619f` at 23:10 WIB, so read it again). Run it locally with `npm run build && npm start`, or use its Vercel preview.
2. In Chrome at exactly 1100×800, sign in as test account 1 and open Home. Record:
   - whether `aside[aria-label="Today"]` lies fully inside the viewport (`getBoundingClientRect().right <= innerWidth`);
   - whether `document.documentElement.scrollWidth > innerWidth` (horizontal overflow);
   - whether any text in the column is clipped (`el.scrollWidth > el.clientWidth` for each child).
3. Report the three results, and the head checked, in the report and as a comment on #462. Do not push to #462's branch.
4. **If any of the three fails:**
   - cut `run11/fix-today-1100` from `origin/main` after #462 merges, or from main with #462's head merged in by merge commit if #462 has not merged when the fix is ready;
   - fix it in `DesktopToday.tsx` and, only if needed, the width rule for that column in `globals.css`;
   - open a new PR for review like any code PR;
   - the page look at 1100×800 and 1280×800 shows no overflow, and the phone layout is unchanged.
5. If all three pass, no PR is opened.

**Done** when the result is reported and, if it overflowed, the fix is merged. **Blast radius:** the desktop Today column only.

## 18. The ten drink rows #401 left (#377) (Lane M)

#377 is closed, but the ten item rows #401 left without item-linked intake were never classified (RT, Nov 3 ~23:10 WIB). Their post IDs are in #377's last comment (`gh issue view 377 --comments`).

1. **Read-only.** For each listed post, with the service key, record:
   - each current item's name, `food_category`, `portion_text`, the 1057 and 1051 micronutrients;
   - `isDrinkItem(item)` (from `drinks-from-items.ts`, run through `tsx`);
   - the post's `intake_logs` rows (`source`, `kind`, `ml`, `amount`).
   Paste no user ID in the report. Use post IDs only, as #377 already does.
2. **Classify** each row:
   - **false match**: not a drink (food, or a solid that shares a drink word), or a sheet/tile post whose intake is deliberately post-linked;
   - **real drink gap**: a drink with no intake, or with intake missing its caffeine.
3. **Fix each real gap.**
   - If `isDrinkItem` misclassifies it, correct the rule in `drinks-from-items.ts` with a test case for that name and category in `tests/drinks-from-items.test.mjs`, as its own PR `run11/drink-gaps-377`, reviewed like any code PR. After merge, run `scripts/backfill-item-drinks.ts` for those post IDs only.
   - If the rule is right and only the sync never ran, run the backfill for that post only.
4. Reopen #377 if any real gap is found. Close it again with the per-row table once every real gap shows its drink on the card and in the day's total on production.

**Done** when all ten rows are classified in the report with their evidence, and every real gap is fixed on production. **Blast radius:** a rule change in `isDrinkItem` affects every future analysis's drink records. The test pins the cases.

## 15. Closures

Each closure comment links its evidence by commit-pinned URL.
- **Close after their merge and production check:** #449, #307 (item 1), #450 and #369 (item 3), #287 (item 3: the README has every part #287 lists; check each against the issue body and fix any missing part in item 3's PR), #451 (item 4), #452 (item 5), #453 (item 6), #454 (item 7), #455 (item 8), #456 (item 9), #457 (item 10), #458 (item 11), #306 (item 12), #282 (item 14), #322 (13f), #323 (13g), #324 (13h), #374 (13d).
- **#377:** reopened and closed again by item 18 only.
- **Close as completed by #460:** #413, plus #360 and #363 (desktop differences superseded by frames 6a–6f, per the backlog's #413 text). Close #193: its phone differences were merged in Fleet 10 (7p) and its desktop differences were superseded by #460.
- **Leave open:** every RT item. #368, #372, #373 and #375 stay open where their section says so. Close nothing else. The phone-only acceptance in #449–#458 ("on the owner's three phones") is RT: close the issue on the emulated or production evidence and add a comment listing the phone check left for RT under #379.

## 16. Run-at-end: checks, reviews and merges

1. **Build first.** Every lane builds and opens its PR. Reviews run beside the build, in a sub-agent, and never block building.
2. **Review.**
   - The owner's review agent checks open PRs every two minutes. When a head is pushed, comment `Ready for review at <full SHA>`. Fix every blocker, push and comment again.
   - If no review appears within 20 minutes, run PPLX (`skills/pplx-review/SKILL.md`). If PPLX cannot run, run AGY (`skills/agy-review/SKILL.md`). If neither can run, that PR's review is a legal halt for that PR only.
   - Codex never reviews code written by an OpenAI model.
   - One reviewer per PR, one pass per head, to zero blockers. The same reviewer confirms fixes.
3. **Migrations.** Apply 0046 and 0047 to production as soon as each has passed its review, and in any case **before RT's recording starts**. Read each back. Order: 0046, then 0047.
4. **Recording hold.** When RT says recording starts, stop every merge, migration and deployment, including a refresh merge into a branch that would deploy a preview to production. Building, reviewing and preview deployments continue. Resume when RT says recording is over.
5. **Merge as each PR is ready.** A PR merges as soon as its head has clean checks and `BLOCKERS: NONE` on that exact SHA. When several are ready at once, they merge in ascending PR number. After each merge, bring main into every open Fleet 11 branch by merge commit.
6. **Production checks** after each merge, on the production deploy at 390×844, test account 1 or 2, each fixture deleted afterwards and cleanup counted:
   - item 1: a genuine new upload, recorded with the scoped observer Fleet 10 used;
   - item 2: the eight-photo session;
   - items 4–12: as each item's Done.
7. **Report.** `docs/run11-report.md` on `run11/docs` lists every item 0–18 as done or not done, with:
   - each PR, its reviewed head and merge commit;
   - each premise P1–P5, true or false;
   - each measurement;
   - each closure.
8. **Cleanup.**
   - Each worktree and local branch is removed once its PR is pushed.
   - Each remote branch is deleted after its merge.
   - The throwaway `run11/tick-eager` deployment branch is deleted.
   - Preview bypass tokens are revoked.
   - Local servers are stopped, and `scripts/cleanup.sh` is run.
   - At the end only the main checkout remains, with its untracked files as found, and nothing temporary is running.

---

## For RT (read from the bottom)

**Functionality this plan removes**
- None.

**Behaviour this plan changes (default the plan takes)**
- Barcode lookups now fall back to Open Food Facts when USDA has nothing. Default: on, FDC first. OFF values are volunteer-entered from the printed pack. Every OFF card, the README and `THIRD_PARTY.md` carry the ODbL attribution line.
- Photo drink checks use their own 120/hour bucket. Default: 120. The 40/hour post limit is unchanged.
- A label printed only per 100 g reads as a 100 g serving. Default: on.
- An alcoholic drink is shown as grams of alcohol and standard drinks, not its liquid, and adds nothing to water. Default: **one standard drink = 14 g of alcohol** (US NIAAA, matching the USDA data). Australia and the WHO use 10 g.
- An alcoholic drink keeps caffeine only when its name names a caffeine source (rum and coke, espresso martini). Default: on.
- An alcoholic drink in a photo is no longer offered as a composer drink card. It posts as a meal item and gets its alcohol from analysis.
- Days on the phone runs oldest at the top to today at the bottom, and opens on today. Default: that order.
- Log again closes its sheet at the tap. A failed save shows on the new card, not in the sheet.
- While typing a caption, the composer shrinks the photo to thumbnails.
- `npm run lint` ignores the git-ignored `uploads/` folder. A new `npm test` script runs the unit tests through `tsx`.

**Places where the design and the product's function disagree**
- #455 asks for "the day's drinks drawn as the same cups". The frames have no such row. Default: one row of small pictures under "Today".
- #457 asks Today to show the day's alcohol. The phone has no Today tile, so the line goes in the intake sheet's Today line. Default: there.
- "Standard drinks" is a unit, not a target. The plan shows no limit, ring or percentage beside it.

**Yours, outside this plan**
- Phone checks on your three phones: #212, #285, #379, #348, #351, and the phone parts of #449–#458 and #372.
- Add to #379: #370, the capture sheet closing within one second of the tap on mobile data. It was proven only in emulation.
- Say when recording starts and when it is over. Every merge, migration and deployment holds in between (item 16 step 4).
- Rule on each term in `docs/run10-terms.md` (#294).
- Read the README after item 3 merges (#318).
- Your keep list for the public repo (#60).
- Your phone feel for #217, and the Meta credits end date (#303).
- Switch Muse Spark Open on in Profile and log a meal (#281).
- The video and submission (#26).
- CAPTCHA (#279) at public launch.