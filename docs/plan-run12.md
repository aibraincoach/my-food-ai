# My Food AI — build plan, Fleet 12 (the 10:14 WIB Engineering backlog)

You are the coder. Written Wed 2026-11-04, from 10:32 WIB, by the planner, against the PM's backlog stamped "Wednesday 2026-11-04 at 10:14 WIB". Main's `BACKLOG.md` is still the 22:54 copy, so the PM's text is the reference. All work is in `aibraincoach/my-food-ai`. Every time is WIB (UTC+7).

## Context

The owner asked for every Engineering-backlog item to be investigated and planned so that it is fixed and the app looks right. The In Flight section is empty. #279 (CAPTCHA) and the Interdit section are out of scope. The planner read every item's code on main `6fd863e` and checked GitHub. The plan follows `docs/planner-contract.md` and the Ponytail method (github.com/DietrichGebert/ponytail, `skills/ponytail`): the smallest change that fully solves each defect, fixed once at its root, with no new layers, options or dependencies. Where Ponytail and the contract differ on tests, the contract wins: new tests only for migrations and data rules.

## How this run behaves

- **Stops: zero.** All lanes start in the first 15 minutes. The run builds, reviews, merges, checks, reports, cleans up and ends.
- **No stop time.** The fleet ends when its items end. The backlog's #26 holds a 17:00 WIB ceiling. It is a ceiling, not a runtime: at 17:00, anything unmerged stays unmerged, and the report is written.
- **No loops, no polling, no idle waits.** Never wait for a quiet window, a quota, a reviewer or a clock. A step that cannot proceed is recorded "not done", with the exact reason, and the run moves on.
- **Build only what this plan lists.** Do not look for other things to change. Anything else noticed goes into the report as one line, unfixed.
- **Get out of the way when done.** When item 30 ends, every worktree, server, browser window and lane is released.

**Merge authority.** The owner approved this plan as the merge order for its **code** PRs (Wed 2026-11-04 ~10:00 WIB, "Same as Fleet 11"). Each code PR merges at the exact head that holds a counting review receipt, with green checks, in ascending PR number. Owner merge rule, Nov 3 (verbatim): "If the code checks out and the review is fine with zero blockers, the thing gets merged. When the planner re-evaluates, if there are still problems or defects, it goes on the backlog." A defect found after a merge goes on the backlog, and the merge is not reverted. **Docs PRs are not covered.** They merge only on the named-head order in the PM's dispatch.

**What counts as a review receipt, and nothing else does:**
- **AGY** (`skills/agy-review/SKILL.md`): a receipt for the exact full head SHA whose text includes `Completeness check: PASS` and zero blockers.
- **PPLX** (`skills/pplx-review/SKILL.md`, runner `tools/pplx-review.mjs`): a receipt for the exact full head SHA whose text includes `Model proof: model_preference = gemini38flash` and zero blockers. A thread without that line does not count, and a Claude in Chrome submission does not count.
- Muse's `<!-- watch-review -->` comments are information, not merge authorization. Fix the real defects they raise.

**PPLX behaviour is opaque.** It sometimes answers on another model without saying why, and nobody knows the cause. Infer nothing about quotas. Per review: one PPLX run through the runner. If the receipt lacks the model-proof line, run AGY once on that head. If AGY cannot run either, that PR's review is a legal halt for that PR only, and every other PR continues. Codex never reviews code written by an OpenAI model. One reviewer per PR, one pass per head. Fix the blockers, then the same reviewer confirms once.

**Recording hold.** When the owner says recording starts, stop every merge, migration and refresh merge that would deploy, until the owner says it is over. Migrations 0048 and 0049 are applied and read back before recording.

**Out of scope:** #279, #114, #115 and #218. Nothing touches CAPTCHA, the hCaptcha variables or Supabase Auth settings. **Nothing sends a sign-up or a sign-in to production, through the forms or otherwise.** That probe was withdrawn on Nov 3 ~15:15 WIB, and it stays withdrawn.

## Every Engineering-backlog item, and what Fleet 12 does with it

GitHub states were checked Wed 2026-11-04 ~10:30 WIB (`gh issue view <n> --json state`). "Code n" means built in item n. "Measure n" means a measurement in item 27, with no product code. "Owner" means only the owner can do it (listed at the end).

| Backlog item | GitHub | Fleet 12 |
|---|---|---|
| #494 Detail takes 14 s | OPEN | Code 10, Measure 27a. Stays open: its done condition is the owner's iPhone |
| #473 Today column at 1100 px | OPEN | Code 1. Close with Fleet 11's geometry (`docs/evidence/run11-today/geometry.json`: right edge 1068 ≤ 1100, no overflow) |
| #368 Shared sign-in rate limit | OPEN | Nothing. Its probe is withdrawn (owner) |
| #369, #374, #306, #307, #282, #287, #193, #413 | CLOSED | Nothing to build |
| #60 Start-here README | CLOSED | The keep list is the owner's |
| #372 Feed photos too large | OPEN | Fleet 11 cut the strip bytes 497,591 → 63,720 (`docs/media-loading.md`). The phone check is the owner's. Comment |
| #373, #375 Database reads, Storage egress | OPEN | Measure 27c |
| #322 Tick cold start | OPEN | Code 21, Measure 27d (passive) |
| #377 Old drink posts | OPEN | Done in code by #484. Acceptance is on non-test accounts (owner) |
| #323 Sign-in twice | OPEN | Code 10 (detail uses the verified header), Measure 27e |
| #324 Day totals twice | OPEN | Measure 27e |
| #217 Smoothness audit | OPEN | Table extended by Fleet 11 and #491. The phone feel is the owner's. Comment |
| #471 Recording cap | OPEN | Code 19 |
| #452 Label not found | OPEN | Code 14. The phone check is the owner's |
| #449, #451, #453–#458 | CLOSED | Defects in their merged code: Codes 13, 15, 16, 17, 18 |
| #468 Thousands separator | OPEN | Code 1 |
| #469, #470 Desktop Add photo | OPEN | Code 2, check 28 |
| #370 Camera view | CLOSED | Code 3. Comment |
| #222 Feed fails; photos slow | OPEN | Codes 4, 5, 9, 11, 12. The phone check is the owner's |
| #281 Muse Spark Open | OPEN | Codes 6 and 10 (fallback notice). The owner's acceptance remains |
| #294 Words | CLOSED | Code 7 (the owner's ruling). Comment |
| #348, #351 Drink card and tiles | CLOSED | Code 8. The phone check is the owner's |
| #495, #496, #497 Detail skeleton, double read, original photo | OPEN | Code 10 |
| #498 Feed reads once per meal | OPEN | Code 9 |
| #499 `instant` flag | OPEN | False premise (facts). Comment, leave open |
| Failure reason blanked; failed pending read; backdated post | — | Code 13 |
| Portion size with per-100 values | — | Code 14 |
| OFF liquids as grams | — | Code 15 |
| Caption loses the selected photo | — | Code 16 |
| Calendar summary, jump and retry loop | — | Code 17 |
| Alcohol caffeine (two cases); alcohol over 500 g | — | Code 18 |
| Saved meals Log now offline | — | Code 20 |
| Log again double tap | — | Code 22 |
| Cached card images expire | — | Code 12 |
| Home reads the first page twice | — | Code 11 |
| Nothing says Muse Spark Open failed | — | Code 10 |

**The owner's ruling on #294 (Wed 2026-11-04 ~10:00 WIB):** keep "Consumed", "Log again", "Saved meals", "What did you eat?", "No food found", and the Days, Today, Yesterday and weekday names. "Leftovers · not eaten" becomes "Leftovers". "Clarification needed" is shown as "A question about this meal" (display only; the model's stored value is unchanged). "Additional food" has 0 uses.

## Facts checked by the planner (Wed 2026-11-04, 09:30–10:40 WIB)

**Main moves. Cut every lane from the current `origin/main` and re-read every named file before editing.** Every find text in items 1–22 was counted on `6fd863e` with an exact substring count:

`python3 -c "import subprocess,sys; print(subprocess.run(['git','show','origin/main:'+sys.argv[1]],capture_output=True,text=True).stdout.count(sys.argv[2]))" <path> '<text>'`

Multi-line find texts were counted the same way, with real newlines. Each occurs exactly once. The coder re-counts each one the same way before editing. A count other than 1 is a false fact: that is a legal halt for that step only, and every other step continues.

- Main is `6fd863e3348dfad7b6ddb16d6216a5006e82f8bf`. The only open PR is docs #474. The last migration is `0047_alcohol_intake.sql`, so Fleet 12 adds **0048** and **0049**. Rollbacks are `supabase/rollbacks/<n>_<name>.down.sql`. Next.js is 16.4.3, and `next.config.ts` sets `cacheComponents: true` and `partialPrefetching: true`.
- `createClient(signal?: AbortSignal)` in `src/lib/supabase/server.ts` accepts an abort signal (read at line 4).
- `getFeed`'s options are `{ summaries?: boolean; knownDays?: readonly string[]; onFirstPhoto?: … }` (`feed.ts:284`).
- `PhoneCalendar.tsx` already uses `tokens.spacing['top-h']` and imports `useRef`.
- `Feed`'s props are `initialPage`, `initialUserId`, `initialZone` and `fallbackOnly` (`Feed.tsx:46`). `HomeFeed` passes `initialPage`, `initialUserId` and `initialZone` (`page.tsx:117`).
- **#499's premise is false.** Under `cacheComponents`, Next reads `export const instant` as a route-segment config (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md`). `false` says that a navigation into that segment may block. Fleet 12 keeps it.
- **Detail (#494–#497).**
  - Neither `posts/[id]/page.tsx` nor Home's `detail=` has Suspense.
  - `PostDetail` makes a network `auth.getUser()` call, although the middleware already set the header that `verifiedUserId()` reads. Its client has no timeout.
  - It runs `getPostDetail` and `getPostCard` in parallel. These are two chains of 10–13 sequential reads that both read the post, the items, the media and the hydration: about 25–30 Supabase calls per open.
  - The image is a fresh signed URL of the original on every render. The feed copy (`smallFeedPhotoUrl(owner, post, media): string | null`) is ≤512 px, webp, and cached as immutable. Boxes and masks use the database `width/height`.
- **Feed (#498).** `toFeedPosts` calls `feedback_revision` once per ready post, before and after the items: 40 of about 50 requests on a 20-post page. The function (0007c) is `security invoker`, granted to `authenticated,service_role`.
- **Home double read.** The server renders with `{summaries: false, …}`, then `load()` always calls `readPage(null,6)` → `/api/feed`.
- **Indexes.** `post_media` has only partial `post_id` indexes, and `post_comments` has none.
- **Errors.** `(tabs)/error.tsx` uses `reset`, which does not re-fetch (`catchError.md:135`). No root `error.tsx` or `not-found.tsx` exists.
- **Cache.** An empty `cachePosts` is saved. Card slides are signed for 3,600 s, while the cache keeps posts 24 h.
- **The once-a-minute database wake keeps the tick route warm**, so a quiet window for a cold-start probe never occurs. The Wall also struck idle waits (Nov 3 11:33).
- **Drinks, composer, calendar, Saved meals, Log again, tick route:** the code each item changes is quoted in that item.

## Premises (unchecked; the report says which were false)

- **P1.** Production has no plain `post_id` index on either table (item 5 checks first).
- **P2.** A tile-count read answers well under 1.5 s (item 8).
- **P3.** With Suspense and `partialPrefetching`, the detail skeleton shows within one second of a tap (item 27a).
- **P4.** Server-rendering the first page with summaries adds under 500 ms to the feed's server render (item 27a).

## Lanes

Each lane gets one worktree under `../my-food-ai-wt/run12-<lane>`, cut from the current `origin/main`. Nothing is stacked, and there are no dependencies.

| Lane | Item | Branch | Service (the how) · boundary (the caller) |
|---|---|---|---|
| A | 1 | `run12/number-format` | `formatCalories`/`formatNutrition` (`totals.ts`) · components |
| B | 2 | `run12/desktop-attach` | `CaptureSheet` `addFiles` · `open-entry` |
| C | 3 | `run12/post-durable` | `UploadManager.persist` · Post tap |
| D | 4 | `run12/feed-recovery` | Next error boundary · App Router |
| E | 5 | `run12/feed-indexes` | Postgres indexes · `toFeedPosts` |
| F | 6 | `run12/open-timeout` | `fetchWithRetry` · `createOpenResponse` |
| G | 8 | `run12/drink-sheets` | `useComposerDrinks`, `IntakeSheet` · composer, drink entry |
| H | 7 | `run12/terms` | `comment-label.ts` · components |
| I | 9 | `run12/revision-batch` | SQL `feedback_revisions` · `toFeedPosts` |
| J | 10 | `run12/detail-open` | `getPostDetail` · `PostDetail` |
| K | 11 | `run12/home-one-read` | `getFeed` · `Feed.load` |
| L | 12 | `run12/card-cache-expiry` | `readFeedCache` · `useCachedFeed` |
| M | 13 | `run12/upload-card` | `getPendingItems` · `UploadHydratedCard` |
| N | 14 | `run12/label-per-100` | label prompt · `/api/label/read` |
| O | 15 | `run12/off-liquids` | OFF mapper · barcode resolver |
| P | 16 | `run12/composer-photo` | `LightComposer` · capture sheet |
| Q | 17 | `run12/phone-calendar` | `PhoneCalendar` · `DaysView` |
| R | 18 | `run12/drink-rules` | `alcohol.ts`, `drinks-from-items.ts` · `sync_item_drinks` |
| S | 19 | `run12/drink-cap` | `capUser` · drink identify route |
| T | 20 | `run12/saved-offline` | `uploadManager.postCopy` · Saved meals |
| U | 21 | `run12/tick-cold` | tick route · cron, app opens |
| V | 22 | `run12/log-again-once` | `uploadManager.postCopy` · Log again |

**Shared files.** The second lane to merge brings main in by merge commit and keeps both changes. A refresh with a code change gets the same reviewer's confirmation (owner ruling, Nov 2 23:21).
- `Feed.tsx`: D, K, M
- `(tabs)/page.tsx`: D, J, K
- `feed.ts`: I, J
- `OutlineOverlay.tsx`: H, J
- `CaptureSheet.tsx`: B, H
- `card-data.ts` and `remainder.ts`: A, H

**Migrations:** 0048, then 0049. Each is applied to production after its review passes and before its PR merges. Read each back.

## 0. Docs PR

1. `git worktree list`. Remove any leftover `../my-food-ai-wt/*` worktree whose branch is merged or deleted. Leave untracked files in the main checkout untouched.
2. Cut `run12/docs`. Commit this file unchanged as `docs/plan-run12.md`, and create `docs/run12-report.md` with `# Fleet 12 execution report` and one line per item 0–30 reading `not done`.
3. In `docs/run10-terms.md`, replace `Recommended is intentionally empty for RT.` with `Recommended is intentionally empty for RT. **Owner ruling, 2026-11-04 ~10:00 WIB (through the Fleet 12 planner):** keep Consumed, Log again, Saved meals, What did you eat?, No food found, Days, Today, Yesterday and the weekday names. "Leftovers · not eaten" becomes "Leftovers". "Clarification needed" is shown as "A question about this meal" (display only; the stored model value is unchanged). "Additional food" has no uses. Built in Fleet 12 item 7.` The find text is that file's existing wording.
4. Open "docs: Fleet 12 plan and report". It merges only when the PM's dispatch names its head. Later report updates go on the same branch.

## 1. One number format everywhere (Lane A): #468, #473

**Problem.** The same total reads "2,118" on desktop Today and "2118" on its feed card. The formatter groups digits only when a caller passes a locale.

1. In `src/lib/nutrition/totals.ts`:
   - Replace `return amount === null ? "—" : String(Math.round(amount));` with `return amount === null ? "—" : Math.round(amount).toLocaleString("en-US");`.
   - Replace `export function formatCalories(value: Numeric, locale?: string): string {` with `export function formatCalories(value: Numeric): string {`.
   - Replace `return locale ? Math.round(amount).toLocaleString(locale) : String(Math.round(amount));` with `return Math.round(amount).toLocaleString("en-US");`.
2. Remove the locale argument from each call:
   - `DeletePostSheet.tsx`: `formatCalories(calories,'en-US')` → `formatCalories(calories)`
   - `DesktopDays.tsx`: `formatCalories(active.totals.calories,"en")` → `formatCalories(active.totals.calories)`, and `formatCalories(post.totals.calories,"en")` → `formatCalories(post.totals.calories)`
   - `DesktopToday.tsx`: `formatCalories(day.totals.calories,"en")` → `formatCalories(day.totals.calories)`, and `formatCalories(post.totals.calories,"en")` → `formatCalories(post.totals.calories)`
   - `MonthGrid.tsx`: `formatCalories(value,"en")` → `formatCalories(value)`
   - `remainder.ts`: `formatCalories(omitted,'en-US')` → `formatCalories(omitted)`, and `formatCalories(kcal,'en-US')` → `formatCalories(kcal)`

   Then `git grep -n -E "formatCalories\([^()]*,\s*['\"]" -- src` prints nothing.
3. Raw roundings:
   - `ResultsCard.tsx`: `${drink.caffeineMg} mg caffeine` → `${formatNutrition(drink.caffeineMg)} mg caffeine`, and `${Math.round(card.amountMl??0)} ml` → `${formatNutrition(card.amountMl??0)} ml`.
   - `card-data.ts`:
     - `${Math.round(alcoholG)} g alcohol` → `${formatNutrition(alcoholG)} g alcohol`
     - `${Math.round(drink?.caffeineMg??0)} mg caffeine` → `${formatNutrition(drink?.caffeineMg??0)} mg caffeine`
     - `${Math.round(drink?.ml??0)} ml` → `${formatNutrition(drink?.ml??0)} ml`
     - `${Math.round(drink.caffeineMg)} mg caffeine` → `${formatNutrition(drink.caffeineMg)} mg caffeine`
   - `PostCard.tsx`: `{item.kcal>0&&item.kcal<1?'<1':Math.round(item.kcal)}` → `{formatCalories(item.kcal)}`.
   - `DayHeader.tsx`: `Math.round(total.kcal).toLocaleString('en-US')` → `formatCalories(total.kcal)`, and `Math.round(total.kcal).toLocaleString("en-US")` → `formatCalories(total.kcal)`.
   - `DayRings.tsx`: `Math.round(total.kcal).toLocaleString('en-US')` → `formatCalories(total.kcal)`, and `${Math.round(total.kcal)} kcal consumed` → `${formatCalories(total.kcal)} kcal consumed`.
   - Add the needed names to each file's import from `@/lib/nutrition/totals`, or add `import { formatCalories } from "@/lib/nutrition/totals";` where none exists (`DayHeader.tsx`, `DayRings.tsx`).
4. #473: in `DesktopToday.tsx`, replace `hidden w-[280px] shrink-0 self-start` with `hidden self-start`.
5. In `tests/unknown-meal-totals.test.mjs`, insert after the line beginning `assert.equal(formatCalories(0),'0');`: `assert.equal(formatCalories(34811),'34,811');assert.equal(formatCalories(2118.4),'2,118');`.
6. Run `npm test`. Change only expected strings that now carry a comma, never inputs, and list them in the PR body.

**Blast radius.** Display text everywhere that shows numbers of 1,000 or more. New stored replies and new card PNGs carry the comma. Stored rows and old PNGs are unchanged. **Done:** check 28 shows commas on a ≥1,000-kcal card, its detail, desktop Today and Days, and the phone day header. `npm test` passes.

## 2. Desktop Add photo fits and offers a file (Lane B): #469, #470

In `src/components/CaptureSheet.tsx`:
1. Replace `forPost?"desktop:!h-[400px]"` with `forPost?"desktop:!h-[min(400px,calc(100dvh-300px))]"`. 300 = window margin 48 + header 56 + Leftovers row 68 + shutter row 104 + 24 spare.
2. Replace `) : <Icon name="camera" />}` with `) : desktop&&forPost ? null : <Icon name="camera" />}`.
3. Replace `{desktop&&cameraUnavailable&&<button type="button" onClick={()=>setCameraAttempt(value=>value+1)} className="absolute rounded-field border border-white/40 px-5 py-3 text-[14px] text-white">Allow camera</button>}` with:
   ```tsx
   {desktop&&(cameraUnavailable||forPost&&!stream&&!latest)&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
             {forPost&&!stream&&!latest&&<><p className="text-[14px] font-semibold">Drop a photo here</p><p className="text-[13px] text-white/70">or paste one with ⌘V</p><button type="button" disabled={posting} onClick={()=>galleryRef.current?.click()} className="h-[42px] rounded-field bg-white px-[18px] text-[14px] font-semibold text-text disabled:opacity-50">Choose a file</button></>}
             {cameraUnavailable&&<button type="button" onClick={()=>setCameraAttempt(value=>value+1)} className="rounded-field border border-white/40 px-5 py-3 text-[14px] text-white">Allow camera</button>}
           </div>}
   ```

**Blast radius.** Desktop Add photo only (`desktop&&forPost`). Phone capture and desktop New post are unchanged. **Done:** check 28.

## 3. A tapped Post survives closing the tab (Lane C): #370

In `src/lib/posts/upload-manager.ts`, replace `entry.data.posted = true; this.notify(entry, 'upload-started'); void this.run(entry); }` with `entry.data.posted = true; void this.persist(entry); this.notify(entry, 'upload-started'); void this.run(entry); }`.

**Blast radius.** One more IndexedDB write per Post tap. A failed write behaves as before. **Done:** on a local production build at 390×844 with Fast 4G, post four photos, close the tab within 2 s, and reopen it. The post publishes, and no draft returns. Delete the post.

## 4. Errors recover and the feed is never falsely empty (Lane D): #222

1. Replace the whole of `src/app/(tabs)/error.tsx` with:
   ```tsx
   "use client";
   // retry() re-fetches the server render; reset() would only re-show the cached error.
   export default function TabsError({retry}: {error: unknown; retry: () => void}) {
     return <main className="flex flex-1 flex-col">
       <header className="flex h-top-safe items-center bg-surface px-inset"><h1 className="text-title">My Food AI</h1></header>
       <div className="px-screen-x py-sheet-top"><p role="alert" className="text-detail text-muted">This page could not be loaded.</p>
         <button type="button" onClick={() => retry()} className="mt-sheet-top min-h-tap rounded-full bg-text px-inset text-surface">Try again</button>
       </div>
     </main>;
   }
   ```
2. Create `src/app/error.tsx`:
   ```tsx
   "use client";
   import Link from "next/link";
   export default function AppError({retry}: {error: unknown; retry: () => void}) {
     return <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
       <header className="flex h-top-safe items-center px-inset"><h1 className="text-title">My Food AI</h1></header>
       <div className="px-screen-x py-sheet-top"><p role="alert" className="text-detail text-muted">This page could not be loaded.</p>
         <div className="mt-sheet-top flex items-center gap-4"><button type="button" onClick={() => retry()} className="min-h-tap rounded-full bg-text px-inset text-surface">Try again</button><Link href="/" className="min-h-tap content-center text-detail">Back to the feed</Link></div>
       </div>
     </main>;
   }
   ```
3. Create `src/app/not-found.tsx`:
   ```tsx
   import Link from "next/link";
   export default function NotFound() {
     return <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
       <header className="flex h-top-safe items-center px-inset"><h1 className="text-title">My Food AI</h1></header>
       <div className="px-screen-x py-sheet-top"><p className="text-detail text-muted">This page does not exist.</p>
         <Link href="/" className="mt-sheet-top inline-flex min-h-tap items-center rounded-full bg-text px-inset text-surface">Back to the feed</Link>
       </div>
     </main>;
   }
   ```
4. `Feed.tsx`: replace `cacheRef.current.save(cachePosts); cacheDirty = false;` with `if (cachePosts.length || !posts.length) cacheRef.current.save(cachePosts); cacheDirty = false;`.
5. `Feed.tsx`: replace `if (visibleState.kind === "error") return <div>{localCards}` with `if (visibleState.kind === "error") return <div data-feed-error>{localCards}`.
6. `(tabs)/page.tsx`: replace `[data-home-feed]:has([data-server-feed-ready], [data-feed-client-ready], [data-cached-feed-ready]) [data-fast-feed-seed] { display: none; }` with `[data-home-feed]:has([data-server-feed-ready], [data-feed-client-ready], [data-cached-feed-ready], [data-feed-error]) [data-fast-feed-seed] { display: none; }`.

**Blast radius.** The error and 404 screens (the admin pages' hidden 404 now shows this page, which names nothing about admin), and the Home cache rule. Normal rendering is unchanged. **Done**, on a local production build:
- (a) A temporary uncommitted `throw new Error('probe')` in `(tabs)/days/page.tsx` shows the styled page, and after removing it Try again renders Days.
- (b) The same works in `posts/[id]/page.tsx`.
- (c) `/days/2099-01-01` shows "This page does not exist.".
- (d) Offline after the seed paints, the error shows without "Loading meal details…".

No probe remains in `git status`.

## 5. Media and comments are read by an index (Lane E): #222

1. **Read-only, production** (Management API SQL, as in Fleet 10): `select tablename, indexname, indexdef from pg_indexes where schemaname='public' and tablename in ('post_media','post_comments') order by 1,2;`, plus `explain (analyze, buffers) select id from public.post_media where post_id = any(array(select id from public.posts order by created_at desc limit 6));` and the same for `post_comments`. If a non-partial btree index led by `post_id` already exists on a table, remove that table's line from the migration and the test (P1 false).
2. `supabase/migrations/0048_feed_post_indexes.sql`:
   ```sql
   -- Feed reads filter media and comments by post; neither table had a plain index on post_id.
   create index if not exists post_media_post_id_idx on public.post_media(post_id);
   create index if not exists post_comments_post_id_idx on public.post_comments(post_id);
   ```
3. `supabase/rollbacks/0048_feed_post_indexes.down.sql`:
   ```sql
   drop index if exists public.post_comments_post_id_idx;
   drop index if exists public.post_media_post_id_idx;
   ```
4. `tests/db/feed-indexes.test.mjs`:
   ```js
   // TEST_SQL_DATABASE_URL=... node --test tests/db/feed-indexes.test.mjs
   import test from 'node:test';
   import assert from 'node:assert/strict';
   import {execFileSync} from 'node:child_process';
   test('feed reads of media and comments by post have an index',()=>{
    const url=process.env.TEST_SQL_DATABASE_URL;assert.ok(url,'Set TEST_SQL_DATABASE_URL to the isolated migrated local database.');
    const out=execFileSync('psql',[url,'-v','ON_ERROR_STOP=1','-Atc',"select indexname from pg_indexes where schemaname='public' and indexname in ('post_media_post_id_idx','post_comments_post_id_idx') order by 1"],{encoding:'utf8'});
    assert.deepEqual(out.trim().split('\n'),['post_comments_post_id_idx','post_media_post_id_idx']);
   });
   ```
5. Run `npm run test:db` on the disposable stack (`docs/testing.md`). Apply to production, read it back, re-run both `explain` queries, and record before and after.

**Blast radius.** Two small indexes: negligibly slower inserts, faster feed reads. **Done:** applied and read back, and the test passes.

## 6. A hanging Baseten call cannot use up the post's time (Lane F): #281

1. In `src/lib/meta/client.ts`, replace `export async function fetchWithRetry(url: string, init: RequestInit, timeoutMs: number, key: string): Promise<Response> {` with `export async function fetchWithRetry(url: string, init: RequestInit, timeoutMs: number, key: string, retries = MAX_RETRIES): Promise<Response> {`. Inside that function only, replace each of its four `MAX_RETRIES` with `retries`.
2. In `src/lib/meta/open-weights.ts`, add below the imports:
   ```ts
   // shortcut: one 75 s try and then Meta; the slowest trial call took 50.5 s (docs/open-weights.md). Raise it if Baseten's normal latency grows.
   const OPEN_IDENTIFY_TIMEOUT_MS = 75_000;
   ```
   Replace `IDENTIFY_TIMEOUT_MS,key);` with `OPEN_IDENTIFY_TIMEOUT_MS,key,0);`, and remove `IDENTIFY_TIMEOUT_MS` from its `./client` import.

**Blast radius.** The open path only. Worst case is 75 s plus the slowest Meta call (96.6 s), about 172 s, inside the 270 s job window. Meta's timeout and retries are unchanged. **Done:** on the disposable stack with the fake Meta server and `IDENTIFY_OPEN_BASE_URL=http://127.0.0.1:9911/v1` served by `node -e "require('http').createServer(()=>{}).listen(9911)"`, a caption-only post with the switch on becomes ready through Meta. Its Baseten `model_calls` row errors after about 75 s, with one attempt only. `tests/open-identify.test.mjs` passes.

## 7. "Leftovers" and "A question about this meal" (Lane H): #294

1. First:
   - `aria-label="Add a photo of Leftovers · not eaten"` → `aria-label="Add a photo of the leftovers"` (2 occurrences, `Carousel.tsx` and `UploadingPost.tsx`)
   - `Removed the Leftovers · not eaten photo.` → `Removed the leftovers photo.`
   - `Only photos after the first can be marked Leftovers · not eaten.` → `Only photos after the first can be marked as leftovers.`
   - in `comment-label.ts`, `'$1$2Leftovers · not eaten:'` → `'$1$2Leftovers:'`, keeping the regex.
2. Replace every remaining `Leftovers · not eaten` in `src/` with `Leftovers`, until `git grep -n -F "Leftovers · not eaten" -- src` prints nothing.
3. `NeedsInputStrip.tsx`: `{post.needs_input.short}` → `{post.needs_input.short==="Clarification needed"?"A question about this meal":post.needs_input.short}`.
4. `OutlineOverlay.tsx`: `"Clarification needed" : "Processing` → `"A question about this meal" : "Processing`.
5. Tests:
   - `comment-label.test.mjs`: each expected `'Leftovers · not eaten: …'` → `'Leftovers: …'`, keeping the stored-text inputs.
   - `multiple-leftovers.test.mjs`: `checkWording('Leftovers · not eaten')` → `checkWording('Leftovers')`, keeping the SQL inputs.
   - `not-eaten.test.mjs`: `'Leftovers · not eaten: 100 g · 500 kcal'` → `'Leftovers: 100 g · 500 kcal'`.
   - Run `npm test`.

**Blast radius.** Labels, badges, card footers and new worker replies. Stored comments display through `comment-label.ts`, and old card PNGs keep the old words. **Done:** check 28, and `npm test` passes.

## 8. Drink sheets: a failed check is said, and tiles stay still (Lane G): #348, #351

1. `ComposerDrinks.tsx`: replace `error:ready&&error.identity===identity?error.message:''` with `error:error.identity===identity?error.message:''`.
2. `IntakeSheet.tsx`:
   - Replace `  const [tileCounts, setTileCounts] = useState<number[]>(DRINK_TILES.map(() => 0));` with that line followed by a new line `  const [countsReady, setCountsReady] = useState(false);`.
   - Replace `void fetch("/api/intake/tile-counts", {signal: controller.signal}).then(async response => {` with `void fetch("/api/intake/tile-counts", {signal: AbortSignal.any([controller.signal, AbortSignal.timeout(1500)])}).then(async response => {`.
   - Replace the two-line text `setUsualMl(data.usualMl);\n    }).catch(() => {});` with `setUsualMl(data.usualMl);\n    }).catch(() => {}).finally(() => { if (!controller.signal.aborted) setCountsReady(true); });`.
   - Replace `<div className="grid grid-cols-3 gap-2">{tileOrder.map(` with ``<div className={`grid grid-cols-3 gap-2 ${countsReady?'':'invisible'}`} aria-busy={!countsReady}>{tileOrder.map(``.

**Blast radius.** The composer shows one more line on a failed drink check. On the first drink-sheet open, the tiles appear once their order is known, at most 1.5 s. Posting is unchanged. **Done:** (a) locally, a drink check returning 503 shows "Drinks could not be checked. You can still post the photo."; (b) check 28.

## 9. The feed reads revisions in one call per stage (Lane I): #498

1. `supabase/migrations/0049_feedback_revisions.sql`:
   ```sql
   -- One call returns many posts' revisions; it wraps feedback_revision so fingerprints stay byte-identical.
   create function public.feedback_revisions(p_post_ids uuid[]) returns table(post_id uuid, revision jsonb)
   language sql stable security invoker set search_path=public,pg_temp as $$
     select p.id, public.feedback_revision(p.id) from public.posts p where p.id = any(p_post_ids)
   $$;
   revoke all on function public.feedback_revisions(uuid[]) from public,anon;
   grant execute on function public.feedback_revisions(uuid[]) to authenticated,service_role;
   ```
2. `supabase/rollbacks/0049_feedback_revisions.down.sql`: `drop function if exists public.feedback_revisions(uuid[]);`
3. In `feed.ts`, replace `const revisions = () => Promise.all(ready.map(row => optionalRead('revision', () => latestRevision(db, row.id), null)));` with:
   ```ts
   const revisions = () => optionalRead('revision', async () => {
     if (!ready.length) return ready.map(() => null);
     const {data, error} = await db.rpc('feedback_revisions', {p_post_ids: ready.map(row => row.id)}).abortSignal(AbortSignal.timeout(8000));
     if (error) throw new Error('Analysis revisions could not be read.');
     const byId = new Map((data as {post_id: string; revision: {modelCommentId: string|null; fingerprint: string}|null}[]).map(entry => [entry.post_id, entry.revision]));
     return ready.map(row => byId.get(row.id) ?? null);
   }, ready.map(() => null));
   ```
4. Create `tests/db/feedback-revisions.test.mjs`:
   ```js
   // TEST_SQL_DATABASE_URL=... node --test tests/db/feedback-revisions.test.mjs
   import test from 'node:test';
   import assert from 'node:assert/strict';
   import {execFileSync} from 'node:child_process';
   test('feedback_revisions returns exactly feedback_revision for each post',()=>{
    const url=process.env.TEST_SQL_DATABASE_URL;assert.ok(url,'Set TEST_SQL_DATABASE_URL to the isolated migrated local database.');
    const sql=text=>execFileSync('psql',[url,'-v','ON_ERROR_STOP=1','-Atc',text],{encoding:'utf8'}).trim();
    const id=sql("select id from public.posts order by created_at desc limit 1");
    assert.ok(id,'The migrated local database needs one post.');
    assert.equal(sql(`select revision::text from public.feedback_revisions(array['${id}'::uuid])`),sql(`select public.feedback_revision('${id}'::uuid)::text`));
   });
   ```
5. Apply to production, and read it back with `select proname from pg_proc where proname='feedback_revisions';`.

**Blast radius.** Feed reads. If the RPC fails, `optionalRead` falls back to nulls, as a failed single read does today. Row-level security applies through security invoker. **Done:** applied, the test passes, and Measure 27a counts the requests before and after.

## 10. A meal's detail shows at once, reads each thing once, and says when Muse Spark Open failed (Lane J): #494–#497, #323, #281

1. Create `src/components/PostDetailSkeleton.tsx`:
   ```tsx
   import {Shimmer} from '@/components/ui/Shimmer';
   export default function PostDetailSkeleton() {
     return <div role="status" aria-label="Loading meal" className="flex flex-col gap-3 pb-6">
       <div className="aspect-square w-full bg-card"/>
       <div className="flex flex-col gap-3 px-inset"><Shimmer width="70%"/><Shimmer width="45%"/><Shimmer width="60%"/></div>
     </div>;
   }
   ```
2. `src/app/posts/[id]/page.tsx`:
   - Replace `import PostDetail from '@/components/PostDetail';` with `import PostDetail from '@/components/PostDetail';\nimport PostDetailSkeleton from '@/components/PostDetailSkeleton';\nimport {Suspense} from 'react';`.
   - Replace `<PostDetail id={id}/>` with `<Suspense key={id} fallback={<PostDetailSkeleton/>}><PostDetail id={id}/></Suspense>`.
   - Keep `export const instant=false;`.
3. `src/app/(tabs)/page.tsx`:
   - Replace `import PostDetail from '@/components/PostDetail';` with `import PostDetail from '@/components/PostDetail';\nimport PostDetailSkeleton from '@/components/PostDetailSkeleton';`.
   - Replace `detail={post?<PostDetail id={post} desktopModal/>:undefined}` with `detail={post?<Suspense key={post} fallback={<PostDetailSkeleton/>}><PostDetail id={post} desktopModal/></Suspense>:undefined}`. `Suspense` is already imported there.
4. `src/lib/posts/feed.ts`:
   - Replace `interface PostRow {` with `export interface PostRow {`.
   - Replace `async function latestRevision(` with `export async function latestRevision(`.
   - Replace this six-line text:
     ```ts
     async function toFeedPost(
       supabase: SupabaseClient,
       row: PostRow,
       zone?: string
     ): Promise<FeedPost> {
       const revisionBefore=row.status==="ready"?await latestRevision(supabase,row.id):null;
     ```
     with:
     ```ts
     export async function toFeedPost(
       supabase: SupabaseClient,
       row: PostRow,
       zone?: string,
       known?: {items: FeedItem[]; revisionBefore: Awaited<ReturnType<typeof latestRevision>>}
     ): Promise<FeedPost> {
       const revisionBefore=known?known.revisionBefore:row.status==="ready"?await latestRevision(supabase,row.id):null;
     ```
   - Replace `  const items: FeedItem[] = row.status === "ready" ? await getCurrentItems(supabase, row.id) : [];` with `  const items: FeedItem[] = row.status === "ready" ? known?.items ?? await getCurrentItems(supabase, row.id) : [];`.
5. In `src/lib/posts/items.ts`:
   - Add these imports below the existing ones:
     ```ts
     import { latestRevision, toFeedPost, type PostRow as FeedRow } from "@/lib/posts/feed";
     import { smallFeedPhotoUrl } from "@/lib/posts/feed-photo-url";
     import { createAdminClient } from "@/lib/supabase/admin";
     ```
   - Replace `export type DetailPhoto = { url: string; width: number; height: number };` with `export type DetailPhoto = { url: string; previewUrl?: string; width: number; height: number };`.
   - Replace the whole function from `export async function getPostDetail(supabase: SupabaseClient, postId: string, zone = "UTC") {` through its closing line `}` (the function that ends with `cardData: cardDataFromRow({ ...post, items, ...hydrated }) };`) with:
     ```ts
     export async function getPostDetail(supabase: SupabaseClient, postId: string, zone = "UTC") {
       const baseFields = "id,user_id,caption,eaten_at,status,analysis_initialized_at,servings,source_post_id,created_at,fail_reason,agent_token_id,agent_tokens(name),needs_input";
       type PostRow = FeedRow & {analysis_initialized_at:string|null;servings:number;source_post_id:string|null;needs_input:unknown;identify_model?:string|null;identify_host?:string|null};
       const read = (identity:boolean) => supabase.from("posts").select(identity?`${baseFields},identify_model,identify_host`:baseFields).is("deleted_at", null).eq("id",postId).maybeSingle<PostRow>();
       let result=await read(true);
       if(result.error&&["PGRST204","42703"].includes(result.error.code)&&/identify_(?:model|host)/.test(result.error.message))result=await read(false);
       const {data:post,error}=result;
       if (error) throw new Error("Meal could not be loaded.");
       if (!post) return null;
       // The card's revision fence must be read before the items it guards.
       const revisionBefore = post.status === "ready" ? await latestRevision(supabase, postId) : null;
       const [current, { data: media, error: mediaError }] = await Promise.all([
         getCurrentItems(supabase, postId),
         supabase.from("post_media").select("id,storage_path,width,height").eq("kind", "photo").eq("post_id", postId).order("position").limit(1).maybeSingle(),
       ]);
       if (mediaError) throw new Error("Meal photo could not be loaded.");
       const [signed, items] = await Promise.all([
         media ? supabase.storage.from("media").createSignedUrl(media.storage_path, 3600) : Promise.resolve(null),
         Promise.all(current.map(async (item): Promise<DetailItem> => {
           let maskUrl: string | null = null;
           if (item.mask_path) {
             const mask = await supabase.storage.from("media").createSignedUrl(item.mask_path, 3600);
             maskUrl = mask.data?.signedUrl ?? null;
           }
           return { ...item, box: itemBox(item.box), maskUrl };
         })),
       ]);
       let photo: DetailPhoto | null = null;
       if (media) {
         if (!signed || signed.error || !signed.data) throw new Error("Meal photo could not be opened.");
         photo = { url: signed.data.signedUrl, previewUrl: smallFeedPhotoUrl(post.user_id, postId, media.id) ?? undefined, width: media.width || 1, height: media.height || 1 };
       }
       const hydrated = (await getPostHydrationData(supabase, post.user_id, [{ id: postId, eaten_at: post.eaten_at, items }], zone))[postId];
       // Identity belongs to the same atomic initial-analysis commit as these
       // items. Newer successful or failed attempts that never persisted cannot
       // relabel the meal. Raw attempt traces remain admin-only.
       const identification=post.identify_model&&post.identify_host
         ? {model:post.identify_model,host:post.identify_host} : null;
       // shortcut: a failed Baseten trace for this post means Muse Spark Open was requested; a later failed retry can also set it.
       const {data:openFailure}=identification?.host==='meta'?await createAdminClient().from('model_calls').select('id').eq('post_id',postId).eq('host','baseten').eq('kind','spark_identify').not('error','is',null).limit(1).maybeSingle():{data:null};
       const card = post.needs_input == null || post.status === "failed"
         ? { ...(await toFeedPost(supabase, post, zone, { items: current, revisionBefore })), ...hydrated } : null;
       return { post, photo, items, identification: identification ?? null, openFallback: Boolean(openFailure), card, isDrink: hydrated.kind === "drink" && hydrated.drinkSource !== "item", ...hydrated,
         cardData: cardDataFromRow({ ...post, items, ...hydrated }) };
     }
     ```
     Ownership is already proven, because the post was read through the user's own client before the admin read. The card rule is the one `getPostCard` applies through `VISIBLE_MEAL_FILTER` (`needs_input.is.null,status.eq.failed`).
6. `src/components/PostDetail.tsx`:
   - Replace `const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect('/sign-in');` with `const supabase=await createClient(AbortSignal.timeout(8000));const userId=await verifiedUserId()??(await supabase.auth.getUser()).data.user?.id;if(!userId)redirect('/sign-in');`.
   - Add `import {verifiedUserId} from '@/lib/auth/verified-user';` after `import {createClient} from '@/lib/supabase/server';`.
   - Replace `const [detail,card]=await Promise.all([getPostDetail(supabase,id,zone),getPostCard(supabase,id,zone)]);if(!detail)notFound();` with `const detail=await getPostDetail(supabase,id,zone);if(!detail)notFound();const card=detail.card;`.
   - Delete the line `import {getPostCard} from '@/lib/posts/feed';`.
   - Replace `` `Identified by Muse Spark Open (${detail.identification.model}) · Built with Muse Spark Open`:'Identified by Muse Spark 1.3' `` with `` `Identified by Muse Spark Open (${detail.identification.model}) · Built with Muse Spark Open`:detail.openFallback?'Muse Spark Open was unavailable · Identified by Muse Spark 1.3':'Identified by Muse Spark 1.3' ``.
   - If `npx tsc --noEmit` reports another use of `user` in this file, change it to `userId`.
7. `src/components/OutlineOverlay.tsx`:
   - Insert directly above the line `function Mask({ url, photo, color, frame, fallback }: {`:
     ```tsx
     function DetailImage({ photo, alt }: { photo: DetailPhoto; alt: string }) {
       const [src, setSrc] = useState(photo.previewUrl ?? photo.url);
       useEffect(() => {
         if (!photo.previewUrl) return;
         let live = true; const image = new Image();
         image.onload = () => { if (live) setSrc(photo.url); };
         image.src = photo.url;
         return () => { live = false; };
       }, [photo.url, photo.previewUrl]);
       // eslint-disable-next-line @next/next/no-img-element
       return <img src={src} crossOrigin="anonymous" alt={alt} draggable={false} className="h-full w-full object-cover" />;
     }

     ```
   - Replace `<img src={photo.url} alt={caption || "Meal photo"} draggable={false} className="h-full w-full object-cover" />` with `<DetailImage photo={photo} alt={caption || "Meal photo"} />`.

**Blast radius.** The meal detail page and the desktop dialog. `getPostCard` keeps serving realtime and polling unchanged. The detail's card is built by the same `toFeedPost`, so its shape is identical. Detail opens of Meta-identified posts make one more admin read. If this fails, the detail shows the error boundary of item 4 instead of hanging. **Done:** Measure 27a, plus `npm test`, `npx tsc --noEmit` and `npm run build` pass. #494 stays open for the owner's iPhone.

## 11. Home reads its first page once (Lane K): #222

1. In `(tabs)/page.tsx`:
   - Replace `        getFeed(db, user.id, null, zone, 6, {summaries: false, onFirstPhoto:` with `        getFeed(db, user.id, null, zone, 6, {knownDays: Array.from({length: 5}, (_, index) => shiftDay(dateInZone(new Date(), zone), -index)), onFirstPhoto:`.
   - Replace `      page.days = days;` with `      page.days = [...days, ...page.days];`.

   `shiftDay` and `dateInZone` are already imported there (line 19).
2. In `Feed.tsx`:
   - Replace `    let loaded = Boolean(initialPage);` with `    let loaded = Boolean(initialPage);\n    let usedServerPage = false;`.
   - Replace the two-line text `        const page = await readPage(null,6);\n        if(!live||loadGeneration!==generation)return;` with `        const page = !usedServerPage && initialPage && initialZone === zone ? (usedServerPage = true, initialPage) : await readPage(null,6);\n        if(!live||loadGeneration!==generation)return;`.

**Blast radius.** Home only. The server render now waits for the first six posts' hydration (P4), while the first photo is still seeded separately. A later `load()` (focus, discovery, retry) fetches `/api/feed` as before, and a zone mismatch fetches as before. **Done:** Measure 27a shows one first-page read per Home open.

## 12. Cached card images never show broken (Lane L)

In `src/lib/posts/feed-cache.ts`:
1. Insert directly above the line `// Local storage can be disabled, full, stale or corrupt. None may stop Home.`:
   ```ts
   // Signed card URLs last an hour (feed.ts) but the cache lasts a day; drop slides whose token has expired.
   function withLiveSlides(post: FeedPost, savedAt: number, now: number): FeedPost {
     const slides = post.slides.filter(slide => {
       if (!slide.url.includes("/storage/v1/object/sign/")) return true;
       try {
         const token = new URL(slide.url).searchParams.get("token") ?? "";
         const exp = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).exp;
         return typeof exp === "number" ? exp * 1000 > now + 120_000 : now - savedAt < 50 * 60_000;
       } catch { return now - savedAt < 50 * 60_000; }
     });
     return slides.length === post.slides.length ? post : { ...post, slides, photoUrl: slides[0]?.url ?? null };
   }

   ```
2. Replace `    if (prior?.raw !== raw) snapshots.set(userId, { raw, value });` with `    if (prior?.raw !== raw) { value.posts = value.posts.map(post => withLiveSlides(post, value.savedAt, now)); snapshots.set(userId, { raw, value }); }`. Filtering happens once per raw value, so `useSyncExternalStore` keeps a stable reference.

**Blast radius.** The cached feed shown before the fresh read. A dropped card slide reappears when the fresh read lands, and photos are untouched. **Done:** on a local build, a cache injected through DevTools localStorage with an expired card token opens with no broken image, and the fresh read restores the card.

## 13. A new upload's card keeps its reason, keeps updating, and sits in its own day (Lane M)

In `Feed.tsx`:
1. Replace the three-line text
   ```ts
               const pending=await getPendingItems(db,id);
               if(!live)return;
               Object.assign(card,{pendingItems:pending.pendingItems,fail_reason:pending.fail_reason});
   ```
   with
   ```ts
               const pending=await getPendingItems(db,id).catch(()=>null);
               if(!live)return;
               if(pending)Object.assign(card,{pendingItems:pending.pendingItems,fail_reason:pending.fail_reason??card.fail_reason});
   ```
2. Replace `  const uploadDays=new Set<string>();` with `  const uploadDays=new Set<string>();\n  const localDay=uploads.map(upload=>dateInZone((visibleState.kind==='ready'?visibleState.posts.find(post=>post.id===upload.postId)?.eaten_at:undefined)??upload.eatenAt,renderZone));`.
3. Replace the three-line text
   ```tsx
       {localCards}
       {days.map(day => <section key={day} aria-label={day} className="relative pb-card-gap">
         {!uploadDays.has(day)&&<DayHeader day={day} zone={zone} empty={!groups.has(day)} total={totals.get(day)} />}
   ```
   with
   ```tsx
       {localCards.filter((_,index)=>!days.includes(localDay[index]))}
       {days.map(day => <section key={day} aria-label={day} className="relative pb-card-gap">
         {!uploadDays.has(day)&&<DayHeader day={day} zone={zone} empty={!groups.has(day)} total={totals.get(day)} />}
         {localCards.filter((_,index)=>localDay[index]===day)}
   ```

**Blast radius.** Upload cards on Home. The early-return states (loading, error, empty) keep `{localCards}` unchanged. An upload whose day lies outside the listed days still renders above them, as today. **Done**, locally:
- (a) A failed upload keeps its reason when the pending read returns no row.
- (b) With `getPendingItems` made to throw (temporary, uncommitted), the card still turns ready.
- (c) A photo posted with yesterday's time shows under yesterday's header while it uploads.

## 14. A label with a portion size but per-100 values logs per 100 (Lane N): #452

In `src/lib/prompts/spark/label.ts`, replace `If the table states only per 100 g or per 100 ml, set serving to 100 with that unit and transcribe the per-100 amounts.` with `If the table states only per 100 g or per 100 ml, set serving to 100 with that unit and transcribe the per-100 amounts. If a serving size is printed but the amounts are given only per 100 g or per 100 ml, ignore the serving size: set serving to 100 with that unit and transcribe the per-100 amounts. Never relabel per-100 amounts as per serving. If both columns are printed, use the per-serving column.` If `tests/fake-meta/fixtures/spark-label.json` contains the old sentence, replace it there the same way.

**Blast radius.** Label reads only. Per-serving labels are unchanged by the added rule. **Done:** the real label gate (`docs/testing.md`) reads a label of this layout ("Portion 30 g", "per 100 g 480 kcal") as serving 100 g and 480 kcal, and #478's English and Indonesian fixtures still read correctly. Results go in the report.

## 15. OFF liquids map to millilitres (Lane O)

In `src/lib/fdc/open-food-facts.ts`, replace `/\bm?l\b/i.test(quantity) && !/\bk?g\b/i.test(quantity)` with `/(?:\d|\b)\s*[mcd]?l\b/i.test(quantity) && !/(?:\d|\b)\s*k?g\b/i.test(quantity)`. In `tests/open-food-facts.test.mjs`, add one test, through the exported mapper that contains that line, asserting that "500ml", "1L", "330mL", "500 ml" and "33cl" map to `ml`, and "200g" and "1 kg" to `g`.

**Blast radius.** OFF barcode products whose quantity names a liquid unit. Products in grams are unchanged. **Done:** the test passes.

## 16. The selected photo survives typing a caption (Lane P)

In `LightComposer.tsx`:
- Replace the two-line text ` useEffect(()=>{\n  const observed=observedPhoto.current;` with ` useEffect(()=>{\n  if(typing){observedPhoto.current={index:-1,count:-1};return;}\n  const observed=observedPhoto.current;`.
- Replace ` },[p.index,p.shots.length]);` with ` },[p.index,p.shots.length,typing]);`.

**Blast radius.** The phone composer's two-photo carousel. **Done:** locally at 390×844, select photo 2 of 2, focus the caption and leave it: photo 2 is still shown, and the Leftovers switch applies to it.

## 17. The phone calendar names the right month, stays still and does not loop (Lane Q)

In `PhoneCalendar.tsx`:
1. Replace the two-line text `   setVisible(nearest.month);\n  });` with ``   setVisible(nearest.month);\n  },{rootMargin:`-${tokens.spacing['top-h']+60}px 0px 0px 0px`});``.
2. Replace `window.scrollTo({top:old.top+(document.documentElement.scrollHeight-old.height),behavior:'instant'});` with `window.scrollTo({top:window.scrollY+(document.documentElement.scrollHeight-old.height),behavior:'instant'});`.
3. Replace `  if(!onOlder||!sentinel.current)return;` with `  if(!onOlder||!sentinel.current)return;\n  const older=olderRef;`, replace `onOlder();` with `older.current?.();`, and replace ` },[key,onOlder]);` with ` },[key,Boolean(onOlder)]);`.
4. Insert directly above the line ` const first=ordered[0]?new Date(ordered[0]+'-01T12:00:00Z'):null;`: ` const olderRef=useRef(onOlder);\n useEffect(()=>{olderRef.current=onOlder;});`. Hooks run unconditionally, so place it with the other hooks above any early return. If that line sits after an early return, insert it directly after the line ` const [visible,setVisible]=useState(today.slice(0,7));` instead.

**Blast radius.** The phone Days calendar only. Desktop Days does not use `PhoneCalendar`. **Done:** locally at 390×844:
- The summary names November once November's first row passes under the header.
- Scrolling while an older month loads keeps the view still.
- With month requests blocked in DevTools, a failed load makes one request until Try again is tapped. Record the count.

## 18. Drink rules (Lane R): follow-ups to #456 and #457

1. `alcohol.ts`:
   - Replace `const CAFFEINE_SOURCE = /\b(cola|coke|pepsi|coffee|espresso|tea|energy|red bull|kahl[uú]a|mocha)\b/i;` with `const CAFFEINE_SOURCE = /\b(coca[- ]?cola|cola|coke|pepsi|coffee|espresso|tea|energy|red bull|kahl[uú]a|mocha)\b/i;\nconst NO_CAFFEINE = /\b(herbal|rooibos|chamomile|camomile|peppermint|hibiscus|decaf(?:feinated)?|caffeine[- ]free)\b/i;`.
   - Replace `  return !isAlcoholic(item) || CAFFEINE_SOURCE.test(item.name);` with `  return !isAlcoholic(item) || (CAFFEINE_SOURCE.test(item.name) && !NO_CAFFEINE.test(item.name));`.
2. `drinks-from-items.ts`:
   - Replace the two-line text
     ```ts
         const nutrient = keepsCaffeine(item) ? item.micronutrients?.find(n => n.nutrientId === 1057 && n.basis === 'portion') : undefined;
         const fallback = !nutrient && /\b(coca[- ]?cola|coke|cola|pepsi)\b/i.test(item.name) ? 32 * ml / 330 : 0;
     ```
     with
     ```ts
         const measured = item.micronutrients?.find(n => n.nutrientId === 1057 && n.basis === 'portion');
         const nutrient = keepsCaffeine(item) ? measured : undefined;
         const fallback = !measured && keepsCaffeine(item) && /\b(coca[- ]?cola|coke|cola|pepsi)\b/i.test(item.name) ? 32 * ml / 330 : 0;
     ```
   - Replace `amount:Math.max(1,Math.round(alcoholGrams(item.micronutrients)))` with `amount:Math.min(500,Math.max(1,Math.round(alcoholGrams(item.micronutrients))))`.
3. In `tests/drinks-from-items.test.mjs`, add one test covering:
   - an alcoholic "herbal tea cocktail" with a measured 1057 of 20 mg → caffeine 0;
   - an alcoholic "rum and cocacola" with a measured 1057 of 0 → caffeine 0;
   - an alcoholic item with 630 g of 1018 → `amount` 500 and `alcoholG` 630.

**Blast radius.** New and re-analysed drink intake rows. Stored rows are unchanged. A non-alcoholic drink without a measured value keeps the cola estimate. **Done:** the test passes.

## 19. Photo drink checks count against the cap only when they call the model (Lane S): #471

In `src/app/api/drinks/identify/route.ts`, delete the line ` const capped=await capUser(user.id,'drink_identify');if(capped)return capped;`. Then replace the line ` if(claimError)return NextResponse.json({error:claimError.code==='23505'?'This photo has already been checked.':'Drinks could not be checked. You can still post the photo.'},{status:claimError.code==='23505'?409:503});` with that same line followed by a new line ` const capped=await capUser(user.id,'drink_identify');if(capped){await admin.from('composer_drink_readings').delete().eq('id',claimed.id);return capped;}`.

**Blast radius.** The drink identify route. A request that finds a pending or failed claim no longer costs a cap hit, and the cap still guards every model call. **Done:** `tests/db/user-cap.test.mjs` passes, and check 28 runs an eight-photo session with no cap message.

## 20. Log now offline stays in the app (Lane T)

In `SavedMealListeners.tsx`:
- Replace `import {useRouter} from 'next/navigation';` with `import {usePathname,useRouter} from 'next/navigation';`.
- Replace ` const router=useRouter();` with ` const router=useRouter();const pathname=usePathname();`.
- Replace `setOpen(false);router.push('/');}` with `setOpen(false);if(pathname!=='/')router.push('/');}`.

**Blast radius.** Saved meals' Log now only. From other pages it still navigates to the feed. **Done:** locally, Log now on Home while offline keeps the app on screen and shows the copy's failed card.

## 21. The tick route says when it starts cold (Lane U): #322

In `src/app/api/jobs/tick/route.ts`:
- Replace the two-line text `export async function GET(request: Request) {\n  let admin;` with `const bootAt = Date.now();\nlet served = false;\n\nexport async function GET(request: Request) {\n  const cold = !served; served = true;\n  if (cold) console.info("tick cold", Date.now() - bootAt);\n  const headers = {"x-tick-cold": cold ? "1" : "0"};\n  let admin;`.
- Replace `{ status: 503 }` with `{ status: 503, headers }`, and `{ status: 500 }` with `{ status: 500, headers }`.
- Replace the two-line text `      traffic: status.traffic,\n    });` with `      traffic: status.traffic,\n    }, { headers });`.

**Blast radius.** One response header and one log line per new function instance. The tick's behaviour is unchanged. **Done:** Measure 27d.

## 22. Log again posts once on a double tap (Lane V)

In `LogAgainSheet.tsx`:
- Replace `async function post(){if(!target||target.loading||lock.current)return;` with `async function post(){if(!target||target.loading||lock.current||sent.current===target)return;sent.current=target;`.
- Insert directly above the line ` const close=()=>{if(!lock.current){setError('');setMode('now');setTime('');setDate('');onClose();}};` the line ` const sent=useRef<LogTarget|null>(null);`.

`useRef` is already imported.

**Blast radius.** The Log again sheet. A new target, such as reopening the sheet, posts normally. **Done:** locally with Fast 4G, a rapid double tap creates one post. Delete it.

## 23–26. Not used.

## 27. Measurements, in `docs/run12-report.md`

- **27a (#494, #496–#498, item 11).** Before and after items 9, 10 and 11 merge, on production as test account 1, at 390×844 with Fast 4G and CPU 4×, and at 1280×800. Record for three detail opens: tap → skeleton → usable detail, the Supabase request count and the bytes downloaded. Record also the request count of a cold 20-post feed in a fresh profile, the first-page reads per Home open, and the time to the first server card (P4). The report states where the seconds go, and that emulation does not reproduce the owner's 14 s on an iPhone over XL Axiata.
- **27c (#373, #375).** In a **new, separate Chrome window** opened for this step through the Claude in Chrome tools, never in an existing window or tab, read the Supabase dashboard Usage page read-only. Record log-ingestion bytes and Storage egress by source as shown, then close that window. If the tools are unavailable, record "not done" with the exact reason.
- **27d (#322), passive only.** No quiet window and no waiting. Record every `x-tick-cold` value seen on tick responses during the production checks of item 28, and any `tick cold` log line the coder can read. If runtime logs refuse access, record the refusal.
- **27e (#323, #324).** For one navigation each of Home (phone), Home (desktop) and a detail open, by test account 2 only, filter the Management `auth_logs` and `edge_logs` to that user's id for that minute. Count the `/auth/v1/user` calls and every read returning today's totals.

## 28. Production checks, after each merge

Run as test account 1 or 2. Delete every test post afterwards and count the cleanup. Results are text; no image is stored.
- **#469/#470:** Home at 1024×700, 1100×800, 1366×650 and 1280×800 gives `document.documentElement.scrollWidth > innerWidth` false. New post and Add photo at 1024×700 and 1366×650, with the camera denied for Add photo: the hint shows, "Choose a file" opens the chooser, one photo attaches, and the shutter row is fully visible.
- **#468:** on a ≥1,000-kcal day (log a saved meal twice if needed), the feed card summary, the detail, desktop Today and Days, and the phone day header.
- **#294:** the composer Leftovers row, a leftovers badge, the Add photo title with Leftovers on, and a needs-input strip.
- **#351:** the first open's tiles appear once and in order, with the time (P2).
- **#471:** an eight-photo composer session with no cap message.

## 29. Closures

Each comment links its evidence by commit-pinned URL.
- **Close after merge and checks:** #468, #469, #470, #473, #495, #496, #497, #498, #471.
- **Comment, do not reopen:** #370, #294, #348, #351, #449, #451, #454, #456, #457, each linking its follow-up item and naming any phone check left for the owner under #379.
- **Comment, leave open:**
  - #494, #222, #281, #452, #372, #217, #377 and #368 (the remaining parts are the owner's);
  - #322, #323, #324, #373 and #375 (close only if item 27 meets the done condition);
  - #499 (the false-premise fact, with the docs path).

## 30. Run-at-end

1. Every lane builds and opens its PR with `npm run build`, `npm run lint` and the lane's tests passing. Reviews run in a sub-agent beside the build.
2. Reviews follow the receipt rule above.
3. **Page look:** each PR that changes a page gets one look at the built page against the frames (6a–6f desktop, phone frames) before merge, with the differences listed on the PR. This covers items 1, 2, 4, 7, 8, 10, 13, 16 and 17.
4. **Migrations:** 0048, then 0049, applied and read back, before recording.
5. **Merges:** each code PR merges when its head has a counting receipt and green checks, in ascending PR number when several are ready. After each merge, bring main into the open Fleet 12 branches by merge commit. Nothing merges during the recording hold or after 17:00.
6. **Report** (`docs/run12-report.md` on `run12/docs`): items 0–30 as done or not done, each PR with its reviewed head, receipt kind and merge commit, P1–P4, each measurement, each closure, and the one-line list of anything noticed and left unfixed.
7. **Cleanup and exit:**
   - Remove each worktree and local branch once its PR is pushed, and delete each remote branch after its merge.
   - Stop local servers, the item 6 test server and the disposable stack. Close the separate Chrome window, and run `scripts/cleanup.sh`.
   - Only the main checkout remains, with its untracked files as found.
   - The run ends.

---

## For the owner (read from the bottom)

**Functionality this plan removes**
- None.

**Behaviour this plan changes (default the plan takes)**
- Every number of 1,000 or more shows a comma ("34,811").
- "Leftovers · not eaten" reads "Leftovers", and "Clarification needed" reads "A question about this meal", as ruled. Old card images keep the old words.
- Tapping a meal shows a grey photo block and three shimmer lines at once. The detail then shows the feed's small photo first and swaps in the full photo when it has loaded.
- Home's server render includes the first six posts' drink and hydration details, so the browser stops reading the page twice (P4 records the cost).
- With Muse Spark Open on, Baseten gets one 75-second try before Meta answers. The detail then says "Muse Spark Open was unavailable · Identified by Muse Spark 1.3".
- Error pages say "This page could not be loaded.", and Try again really retries. Unknown addresses show "This page does not exist.".
- On the first drink-sheet open, the tiles stay hidden up to 1.5 s until their order is known.
- A failed drink check says so in the composer.
- Alcoholic drinks named herbal, rooibos, chamomile, peppermint, hibiscus, decaf or caffeine-free log no caffeine. A measured caffeine value, zero included, is never replaced by an estimate. Stored alcohol intake is capped at 500 g, while the card shows the true grams.
- Photo drink checks count against the hourly cap only when they call the model.
- Log now from the feed no longer navigates away offline.
- Desktop Add photo with no camera says "Drop a photo here / or paste one with ⌘V / Choose a file", using the ⌘ wording New post already uses, on Windows too.

**Places where the design and the product's function disagree**
- The frames have no detail skeleton, no Add photo empty state, and no error or 404 screen. Default: the existing shimmer, the New post drop-zone words and the existing error style.
- #324 asks for today's totals once per Home open. On desktop, the Today column reads today's posts through `/api/days`, which also returns that day's totals. Default: kept. 27e records the count, and #324 stays open.
- #499 asks to delete `export const instant = false`, but Next reads it. Default: kept.

**Yours, outside this plan**
- Phone checks under #379: the detail within two seconds over mobile data (#494), the sheet closing within one second (#370), the feed and first photo (#222, #372), the drink card and tiles (#348, #351), and the label (#452).
- Acceptance of the old drink cards on the real owners' accounts (#377), and the phone feel for #217.
- #368 needs its withdrawn probe or another method.
- Switch Muse Spark Open on in Profile, log a meal, and see its line (#281).
- Say when recording starts and when it is over.
- CAPTCHA (#279) at public launch.