# Fleet 15 plan: the November 4 afternoon paste, the Round 7 design (zip 5) and the 26-finding audit

Written 2026-11-04 (observed 10:05–10:40 UTC) against `origin/main` `a24587a1ec3b57a7b2bdfb5f69cce4e0e73602db` (Fleet 14 #559–#566 merged; migration 0052 applied), following `docs/planner-contract.md`. **This checkout (`run13/docs`) is behind main for `src/`; every find-text below was read from `origin/main` and counted there this session (section "Find-texts" below), and every worktree is cut from `origin/main`.** Revision 2: the seven review findings on the first draft are fixed; each fix is named in "What changed in revision 2" at the end.

## 0. What you requested and what this plan does with it

You pasted 19 items in three blocks, then the designer's zip 5 (Round 7 frames 7c, 7d, 7e) and the PM's 26-finding audit table.

| Item | State checked today (`gh issue view`, 2026-11-04) | What this plan does |
|---|---|---|
| #579 blurry 480×640 photos | OPEN; your 15:56 ruling: fixed today (the GitHub body still says "blocked as polish"; your paste is newer and wins) | **Built, lane A.** Camera asks for 1920×1440; two sharper feed copies (2x, 3x) from the original; bytes before/after measured and written |
| #578 two upload paths, DRY audit | OPEN; audit text now supplied by you (26 findings) | **Rank 1 built, lane B.** The other 25: your ruling, with my recommendation per finding at the bottom of this file. The PM files what you accept |
| #567 admin counts | OPEN | **Built, lane E**, plus the one-row role update you chose |
| #568 judges page | OPEN | **Built, lane F**: "How My Food AI works" under Profile, two-account access test |
| #569 day rings cut off | OPEN; designer 7c/7d supplied | **Built, lane C** per 7c/7d and the designer's class list |
| #570 leftovers photo slow | OPEN | **Built, lane B** (same code path as a new post; sheet closes once the file is durable). The 24.9 s queue wait is finding 11, your ruling |
| #571 second post breaks "The meal could not be saved." | OPEN | **Lane B**: the one code source of that toast is fixed (Save meal on a not-ready post); the two-post overlap is observed and recorded; any other failing request is filed as its own issue |
| #572 fallback never runs after one search | OPEN | **Built, lane G**, with the regression test |
| #573 label on every nutrient entry | OPEN | **Built, lane G**, migration 0053 for the 4 production rows |
| #557 incomplete saved label hides outage | OPEN | **Built, lane H**, with both regression cases |
| #574 calendar 5 posts vs summary 4 | OPEN; cause found today (F2) | **Built, lane D**: both count ready posts; unfinished posts named separately |
| #575 unavailable without a reason | OPEN | **Built, lane G**: the reason is stored with the item and shown on the meal and in its first comment |
| #370 camera stays open | **CLOSED** 2026-11-03 (#505; #543 fixed in Fleet 14 #563) | Nothing to build. Your phone timing stays under #379 |
| #222 feed slow | OPEN (backlog label) | Nothing new to build; lane A re-measures the first photo's bytes because #579 changes them. Your phone over mobile data remains the done condition |
| #372 feed photo bytes | OPEN | Same as #222: bytes before/after go in docs again (lane A changes them); your phone remains |
| #455 drink pictures | **CLOSED** 2026-11-04 (#485, PNG receipts) | Nothing to build; your three phones (#379) |
| #456 cocktail caffeine | **CLOSED** 2026-11-04 (#481/#486, tiki repair receipt) | Nothing to build; your three phones |
| #457 alcohol shown | **CLOSED** 2026-11-04 (#486/#493, production receipt) | Nothing to build; your three phones |
| #576 New post window scrolls 18 px | OPEN; designer 7e supplied | **Built, lane I** per 7e, meeting the backlog's 454 px / 472 px camera numbers |

The PM's note "Drop the first paragraph of that order; the other two items still stand" is a PM-to-you note about a coder order; nothing in it changes this plan.

**Stops: zero. No legal halts. No waiting.** One prompt to the end. No item asks the owner anything; nothing waits on a notice of any kind.

**Another fleet is running.** Fleet 14's tail (hourly resource series to 13:40 UTC, control-table rows, docs PR #577 on `run14/docs`) is still finishing. Its code is merged; its remaining work is docs and measurements. This fleet never touches `run14/*` or `run13/docs` worktrees or branches, writes its own docs on `run15/docs`, and brings main into each lane before merge. If Fleet 14 files new issues before this run ends, they are not in this plan.

**How the fleet runs.** All nine code lanes start together, one coder subagent per lane in its own worktree cut from the current `origin/main`; nothing stacks. Reviews run beside each build and never block it. Merges come last, in ascending PR number, each at the exact head that holds a counting review with green checks. Migration 0053 is applied to production after its review passes and before its PR merges, then read back. The role update (lane E) is one production SQL statement, run after its PR merges, read back. A defect found after a merge goes on the backlog; the merge is not reverted.

**Production sign-in is authorized for measurement**, as Fleet 14: designated test account 2 through `scripts/lib/session.mjs`, never the owner's or demo account; every test post deleted with its storage objects and verified absent before the report. Previews are reached with the Fleet 14 Vercel Protection Bypass secret kept in the private ignored file named in `docs/run14-report.md` (branch `run14/docs`). **That secret is permanent fleet test access: never revoke or regenerate it.**

**Browser work.** Fleet 14 reported native Chromium page and network commands hanging repeatedly on this host; its production checks therefore ran in **native Firefox over WebDriver BiDi** (`scripts/run14-production-checks.mjs`, endpoint `ws://127.0.0.1:19424/session`, helpers `navigate`, `tap`, `fill`, `evaluate`, `until`; receipt line "Firefox native BiDi, 390x844, no CPU throttle available"). Every browser check in this plan uses that same script's helpers (copied into a `scripts/run15-*.mjs` driver with the same `--bidi=` argument) in Firefox, **unthrottled**, and every timing is labelled unthrottled in the report. Server-side durations come from `jobs` and `model_calls` rows, which do not depend on the browser. No Playwright; no image is stored.

**Review (owner ruling, current).** PPLX on ChatGPT (`tools/pplx-review.mjs`, `skills/pplx-review/SKILL.md`) or a Muse zero-blocker review on the exact head counts; AGY may run in parallel. The coder also runs its own review subagent beside each build. Per PR: one pass on the head, fix the blockers, move on at zero. If one reviewer cannot run, use the other; nothing waits.

**Find-texts.** Every find-text in sections A–I was counted on `origin/main` `a24587a1` this session with a script over `git show origin/main:<file>` and occurs exactly once, except these, which are intended: `MAX_FEED_SOURCE_BYTES` in `feed-photo.ts` occurs three times and A.4 names the two to change by their surrounding text; `if (!(own?.source === "label" && own.per_100)) throw error;` occurs twice in `barcode-resolver.ts` and H.2 replaces both; `.desktop-shutter-row { height:104px !important; }` occurs twice in `globals.css` and I.1 replaces both. Fleet 14's remaining work is docs only, so these counts hold until the worktrees are cut.

## Facts (checked this session; the coder does not re-check facts, only the find-texts)

Production queries were read-only (`psql "$SUPABASE_DB_URL"` with `PGOPTIONS='-c default_transaction_read_only=on'`).

- **F1.** `origin/main` is `a24587a1`. Open PRs: #577 (draft, `run14/docs`, head `3eef4ec9`), #558 (`run13/docs`). Worktrees `../my-food-ai-wt/run14-*` exist and belong to Fleet 14; leave them.
- **F2 (#574 cause).** `getMonthSummary` (`src/lib/posts/days.ts:205-248`) counts every post in `LOGGED_STATUSES` (`ready, queued, processing, needs_input`) as `day.posts`; `getDays` (`days.ts:37-107`) selects `.eq("status","ready")` only, and the day summary prints `active.posts.length` (`DaysView.tsx:195`, `DesktopDays.tsx:18`). Production, user `98f58d0a…` (a designated test account), 2026-10-31 in `America/Edmonton`: 4 ready + 1 `needs_input` = calendar 5, summary 4. Home's `getDayTotals` is a third variant (`status='ready'` and `needs_input is null`); it is not part of #574 and stays. `LoggedDay` objects are built in exactly three places (`days.ts:67`, `src/app/api/days/route.ts:21`, `src/components/DaysScreen.tsx:25`) and `MonthDay` objects in two (`days.ts:219`, `days.ts:243`); `today-view.ts` declares its own `TodayView` type. `tests/days-summary.test.mjs:33-34` already asserts the month query's `in status [ready, queued, processing, needs_input]` filter; `tests/days-reader-queries.test.mjs` and `tests/days-range.test.mjs` assert no status filter.
- **F3 (#572).** `model_calls`, kind `fdc`, event `food_resolution`, last 14 days: selected 301/74/1 after 1/2/3 searches; unavailable 12/106/3 after 1/2/3 searches. The 12 one-search failures include five "pickled ginger" with reason "All candidates are Branded PICKLED GINGER…". In `matchFood` (`src/lib/fdc/match.ts:59-84`) `baseQuery` is set only from the first decision's `query_food`; when the decision has `query:null, query_food:null`, `next` is null and the function returns after one search with `baseFood:null`. On main `resolveFoodMatch` (`match.ts:87-97`) then skips `closestGenericFood` and goes straight to `estimateFood`. `foodSearchQuery(name)` (`match.ts:25-27`) is the cleaned bare name, held in the local `query`.
- **F4 (#573).** `scaleNutrition` (`src/lib/fdc/nutrients.ts:120-128`) copies `approximation` (with `sourceRef`, and `per100` for estimates) into every micronutrient entry. Production: 4 `item_nutrition` rows carry the tag, on 260 entries, 50,510 bytes of micronutrients text for those four rows; 0 estimate rows yet. Readers: `foodApproximation` finds the first tagged entry; `storedEstimateFood` reads `entry.approximation.per100` per entry (`src/lib/fdc/approximation-metadata.ts`); `rescaleStoredAmounts` (`totals.ts:187-193`) spreads each entry, so extra keys survive rescaling; the 0051/0052 SQL functions compare comment text and `source_ref` only, never the tag.
- **F5 (#575).** 94 current items created in the last 14 days have null calories; 0 created after #561 deployed (08:31 UTC). The reason lives only in `model_calls.response_text` (admin-only RLS). `scaleNutrition(null, …)` writes `source_ref: null`. Non-numeric `source_ref` values already exist (`off:`, `label`, `estimate:`) and every reader handles them (Fleet 14 F15; `portion.ts:48` requires a safe integer; `items.ts` yields `UNIT_UNAVAILABLE`; `prior-nutrition.ts` rejects them). `estimateFood` returns null only for a non-food, null calories or an empty basis (`estimate.ts:30`). `closestGenericFood` (`approximate.ts:33-44`) computes a reason but returns only the food. `NutritionTable.tsx:14-17` and `wording.ts:7` print "Nutrition unavailable: name" with no reason. `safeSummary(` is called in exactly three places: `persist.ts:101`, `correct.ts:59`, `recompute.ts:60`. `CURRENT_NUTRITION_COLUMNS` (`totals.ts:244`) selects `source_ref`, `CURRENT_ITEM_COLUMNS` (`totals.ts:243`) selects `id` and `name`, and `NutritionTable.tsx` already reads `item.source_ref`. Caption-only posts are analysed into items without a region (`src/lib/pipeline/analyze.ts:135-180`).
- **F6 (#567).** `/admin` is `src/app/admin/page.tsx`: `notFound()` unless `profiles.role === 'admin'`; the middleware does the same (`adminRequestAllowed`). `getQueueStats` (`src/lib/admin/stats.ts`) reads jobs and recent posts only. Production counts now: 4 users (4 profiles, 1 admin), 194 posts, 3,389 model calls, 119 with an error, 30 job errors. `profiles_owner_update` has `with check (role = 'user')`, so only the service role can promote.
- **F7 (#579).** `src/lib/media/camera.ts:30`: `getUserMedia({ video: { facingMode: mode }, audio: false })`, no size; `CaptureSheet.tsx:169` desktop device path likewise. `grabFrame` draws the native frame, JPEG q0.95; `reencode.ts` then writes the original (≤4096 long side, q0.85) and a `.feed.jpg` (≤1080). The feed route (`…/v1.webp/route.ts`) reads the `.feed.jpg`, resizes to fit 512×512 at q62 (`feed-photo.ts:38-48`, 50 KB cap), `Cache-Control: private, max-age=31536000, immutable`, ETag `"${media}-v1"`. `public/sw.js:181` matches only `/v1\.webp$`; `tests/sw-media-cache.test.mjs:40` lists `/v2.webp` among invalid URLs (it stays invalid under the new pattern). `Carousel.tsx:108` and `page.tsx:92` render `<img width={1080} height={1080}>` with no `srcset`. `PostOpenFrame.tsx:26-34` and `OutlineOverlay.tsx:40` (`DetailImage`) start from the v1 copy (`items.ts:137 previewUrl`) and the detail swaps to the signed original; `OutlineOverlay.tsx:162` renders desktop extra slides from the slide URL. `post_media` has `width` and `height` columns. `validUploadShots` allows 1–4096 px. `tests/camera-flip.test.mjs:14` reads only `constraints.video.facingMode`, so added size constraints do not touch it. `tests/home-photo-preload.test.mjs:21` asserts the exact Link header string.
- **F8 (#570, finding 1).** `CaptureSheet.tsx:292-305` `attachFile` awaits `PackPhotoUpload.prepare` (encode, `POST /api/media/sign-upload {staged:true}` which first awaits a cleanup-job insert, then PUT original, PUT feed copy one after the other) and `POST /api/posts/{id}/media` (prepare RPC, two Storage copies, complete RPC) before `onClose()`. A new post: `uploadManager.stage(...)`, `await uploadManager.post(id)` (IndexedDB write only), `onClose()` (`CaptureSheet.tsx:413-414`). `UploadManager.process()` (`upload-manager.ts:310-395`) retries three times and dispatches `post-created`; `submitCopy` (284-292) is the model for a new request kind; `postCopy` ends with the unique line `if(entry.deleted||entry.data.ownerId!==this.ownerId)throw new Error('Sign-in changed. Your copy is kept for its original account.');`. `PackPhotoUpload` (`pack-photo-upload.ts`) takes `(encode, request, now, verify)`.
- **F9 (#571).** The toast "The meal could not be saved." with a Dismiss button over the feed is rendered only by `SavedMealListeners.tsx:29` (`DeletePostSheet` has the same box with other text). It shows after a `save-meal` event (bookmark `PostActions.tsx:17`, card menu `PostCard.tsx:86`, detail menu) when `POST /api/saved` answers 400 (`src/app/api/saved/route.ts:6`), which happens when `save_meal_from_post` raises `'Meal not found' 42501` for a post whose status is not `ready` (`0026_saved_meals.sql:18-19`). The bookmark is live on a processing card (`PostCard.tsx:91` only dims a card whose own upload is in flight; `PostActions` has no ready gate). The composer's "Save as meal" switch is server-side (`0026:110`, runs at ready) and never dispatches `save-meal`. `FeedPost` has `status` (`feed.ts:38-70`). Whether your screenshot came from that path is a premise (P3).
- **F10 (#569).** `DayRings.tsx` draws five fixed columns `w-[66px]` with `gap-[14px]` inside `overflow-hidden`; `page.tsx:53-71` reads `getLoggedDates(…, shiftDay(today,-4), today)` and `homeDayTotals()` (5 days); the feed's `feed-day-totals` event refreshes the five; `ShellHome.tsx:34` mounts the same component with empty data; `BottomBar.tsx:27-29` makes Home a plain `<Link>`; `tests/day-rings-updates.test.mjs` mounts the component in a `vm` with a one-slot `useState` and no `useRef`. `/api/days?month=YYYY-MM` returns `MonthSummary` (`days: MonthDay[]` with `day, kcal, posts, ready`) and `getEarliestPostDate` exists (`days.ts:196`). `src/lib/theme/tokens.css:130` declares `--spacing-inset: 16px`; `px-inset` is already used on this component, so Tailwind 4 emits `scroll-pl-inset` from the same token.
- **F11 (#576).** `globals.css` inside `@media (min-width: 1024px)`: the window `width:960px; max-width:960px; height:620px`; `[aria-label="Capture content"] { width:600px; height:620px; …}`; the viewfinder `height:450px !important`; `.desktop-mode-strip { padding-top:10px; height:66px; }`; the shutter row `height:104px !important` twice (lines 50 and 77) (450+66+104 = 620). `ModeStrip.tsx` renders a 44 px (`h-11`) control. `CaptureSheet.tsx:496` also carries `desktop:h-[450px]`; `LightComposer.tsx:54` carries `h-[620px]`. A `(max-height:667px)` block lets `.desktop-capture` scroll. The backlog's done condition for #576 names a 454 px camera at 1366×650 and 472 px at 1024×700, which is 602−148 and 620−148: the designer's 7e sizes are a 52 px mode strip and a 96 px shutter row (148), not the built 66+104 (170).
- **F12 (#557).** `barcode-resolver.ts` swallows a provider error when `own?.source === "label" && own.per_100` (twice); `mergeProduct` (`barcode-product.ts:94`) needs `own.per_100 && own.name && own.serving_unit`. `name` and `serving_unit` are nullable in `0025`. `tests/open-food-facts.test.mjs:24-41` shows the fetch-stub pattern for provider outages.
- **F13 (#568).** No page lists the models; `README.md:7-14` holds the table. Profile is `src/app/(tabs)/profile/page.tsx`; `profile/deleted/page.tsx` is the pattern for a sub-page. RLS: `posts_owner_*` (0036), `post_media_owner_all` (0001), `profiles_owner_*` (0014), `intake_owner_*` (0016), `saved_meals_owner` (0026), storage `media_owner_*` by folder (0001:191-202). `tests/db/rls.test.mjs` already signs in two test users and checks posts, post_media, post_items, post_comments, post_locations, jobs. Signed photo URLs last 3600 s; the feed route answers 404 for another owner (`tests/feed-photo.test.mjs`). No test scans page text for wording: `tests/wording.test.mjs` exercises `checkWording` and `plainConsumed` only, and `tests/clarification-wording.test.mjs` exercises `readNeedsInput`; `checkWording` guards model summaries, not pages. The README already carries the sentence "sets no targets" on main.
- **F14 (design, zip 5 `My Food AI.dc.html`, section 7).** 7c/7d: rings are 62 px columns with 10 px gaps from the 16 px inset; five whole rings and the edge of a sixth; scroll-snap, start-aligned; the feed never moves with the row; tap a ring with posts opens that day; grey rings have no posts and cannot be tapped; first load 30 days, 30 more within 5 rings of the end, ending at the first post; Home tapped on Home scrolls the row back to Today. Designer's class list for `DayRings.tsx`: `overflow-x-auto, snap-x snap-mandatory, scroll-pl-inset, no visible scrollbar, overscroll-x-contain; columns w-[62px] shrink-0 snap-start, gap-[10px]`. 7e: window `h-[min(620px,calc(100dvh-48px))] w-[min(960px,calc(100vw-48px))]`; viewfinder drops `desktop:h-[450px]` for `flex-1 min-h-[240px]`; "the mode strip (52 px with its margin) and the shutter row (96 px) keep their sizes"; the composer uses the same height rule; 1366×650 gives a 602 px window and a 454 px camera, 1024×700 gives 620/472. `github.md` in the zip confirms the sync date 2026-11-04T08:50:30Z.
- **F15.** #370 closed 2026-11-03 (#505; the posted-flag gap became #543, fixed by #563). #455/#456/#457 closed 2026-11-04 with PNG, tiki-repair and production receipts. #372's resize route is live (`docs/media-loading.md`: 87.19% fewer bytes).
- **F16.** `.env.local` holds `SUPABASE_DB_URL`, `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`, `TEST_USER_EMAIL/PASSWORD`, `FDC_API_KEY`; `psql` is installed. `tests/db/helpers.mjs` needs `TEST_USER2_EMAIL/PASSWORD` for the two-user test (P2). `scripts/run14-production-checks.mjs` requires `TEST_USER2_EMAIL` and signs in as account 2.
- **F17 (bypass secret in the Fleet 14 docs; re-read at 10:52 UTC).** `origin/run14/docs` head `3bb83ed8` ("docs: tabulate the three observed hourly memory samples"). `git show origin/run14/docs:docs/plan-run14.md | grep -n -i revok` returns exactly three lines, every one a retain statement: line 3 (the owner amendment of 16:14–16:15 WIB: "Retain it; it is never revoked or removed. This explicit owner ruling supersedes the original secret-removal instructions, including cleanup and the defaults below"); line 500, item 6.1 step 2, whose last sentence now reads "Retain the protection-bypass secret permanently for reviewer/coder access; it is never revoked or removed (owner, November 4, 16:14–16:15 WIB)" (the earlier "revoke the secret with …" sentence was struck by the Fleet 14 coder's later commit, between my first read at head `3eef4ec9` and this one); and line 680 ("retained permanently for reviewer/coder access"). The "Cleanup and exit" section (line 660) reads "retain the protection-bypass secret permanently". A search for an instruction to revoke (`revoke the`, `"revoke"`, `revoke it`) returns nothing. `docs/run14-report.md` lines 34 and 105 state the secret is never revoked and no revocation was performed. The strike the owner ordered is already committed on `run14/docs` at `3bb83ed8`; this plan changes nothing there and lane J leaves that branch alone.

## Premises (unchecked; the report states which were false)

- **P1.** Your three phones answer `getUserMedia` with ideal 1920×1440 by at least 1280×960. Observed after deploy from `post_media.width/height` of your new posts (read-only), not by the coder's phone.
- **P2.** The disposable stack has a second test user for `tests/db/rls.test.mjs`; if not, the coder creates it with `scripts/create-test-user.mjs` (local stack only, never production).
- **P3.** The toast in your 14:19 screenshot came from Save meal on a not-ready post (F9). Lane B.3 records which requests fail when two posts overlap.
- **P4.** Sharp decodes a 4096×4096 JPEG within the 3 s route timeout on the Vercel function (limit 16.8 M pixels). Lane A's test and the production byte check prove it. If it is false, the route redirects to the signed original (A.5), so the photo still shows; the cost is bytes, not a blank image.
- **P5 (unchecked estimates, measured by A.10).** A 1920×1440 camera JPEG at q0.85 is in the order of hundreds of kilobytes, and a 1560 px WebP at q68 in the order of one to two hundred kilobytes; feed egress rises by the ratio the measurement shows. No number from P5 is a fact until A.10 writes the table.

## Lanes (each in its own worktree under `../my-food-ai-wt/run15-<lane>`, all started together)

| Lane | Items | Branch | Service that owns the how (inputs → outputs) · boundary that calls it |
|---|---|---|---|
| A | #579, #372/#222 bytes, finding 4 partly | `run15/photo-sharp` | `feed-photo.ts` (`resizeSharpPhoto(source, box)`), `feed-photo-url.ts` (`feedPhotoSrcSet`) · the `[variant]` route, `Carousel`, `PostOpenFrame`, `DetailImage`, Home SSR img, Link preload |
| B | #570, #571, finding 1 | `run15/attach-upload` | `UploadManager.postAttachment` / `submitAttachment` (file + post → durable entry → attached media) · `CaptureSheet.attachFile`, `UploadChip`, `Feed`; `savePost` error code · `/api/saved`, `PostActions` |
| C | #569 | `run15/day-rings` | `DayRings` (30 logged dates, 6 totals, earliest → scrolling row; `/api/days?month=` for older rings) · Home `HomeDays`, `BottomBar` |
| D | #574 | `run15/day-counts` | `getDays`/`getMonthSummary` (`pending` count) · `/api/days`, `DaysView`, `DesktopDays`, `PhoneCalendar`, `MonthGrid` |
| E | #567 | `run15/admin-counts` | `getQueueStats` (`app` counts) · `/admin` page |
| F | #568 | `run15/judges-page` | static page `profile/about` · Profile link; `tests/db/rls.test.mjs` |
| G | #572, #573, #575, migration 0053 | `run15/nutrition-reasons` | `matchFood` (bare name), `scaleNutrition` (one tag; unavailable ref), `unavailable.ts` (ref → sentence) · `resolveFoodMatchDetailed` callers, `NutritionTable`, `plainConsumed` |
| H | #557 | `run15/barcode-complete` | `completeLabelCorrection(own)` · `resolveProduct` |
| I | #576 | `run15/capture-height` | CSS in `globals.css`, `CaptureSheet` viewfinder class, `LightComposer` height |
| J | docs | `run15/docs` | this plan, `docs/run15-report.md`, bytes table in `docs/media-loading.md` |

**Shared files.** `CaptureSheet.tsx`: lane A changes line 169 (device constraint), lane B changes `attachFile` (lines 292-305) and lane I changes the viewfinder class on line 496; whichever merges later brings main in by merge commit. `page.tsx` `(tabs)`: lane A changes the SSR `<img>`/`preload` lines 87-92 and 102, lane C changes `homeDayTotals`/`HomeDays` lines 49-71; different lines, same rule. `days.ts`: lane D only. `PostActions.tsx`: lane B only. `nutrients.ts`, `approximation-metadata.ts`, `match.ts`, `approximate.ts`, `estimate.ts`, `persist.ts`, `correct.ts`, `recompute.ts`, `wording.ts`, `NutritionTable.tsx`: lane G only. `globals.css`: lane I only. `feed-photo.ts`, `feed-photo-url.ts`, `sw.js`, `Carousel.tsx`, `PostOpenFrame.tsx`, `OutlineOverlay.tsx`, `home-photo-preload.ts`: lane A only. `barcode-*.ts`: lane H only.

## A. Sharp photos on a 3x phone (#579; re-measures #372/#222 bytes)

Your choice: 3x sharp (camera up to 1920×1440; feed copies at 1040 px and 1560 px boxes by screen density).

1. `src/lib/media/camera.ts`: replace `const open = (mode: Facing) => navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });` with `// Ask for a 4:3 frame near 1920×1440; the phone gives the nearest size it has (a bare facingMode request gave 480×640, issue #579).\n  const open = (mode: Facing) => navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });`.
2. `src/components/CaptureSheet.tsx`: replace `navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:deviceId}},audio:false})` with `navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:deviceId},width:{ideal:1920},height:{ideal:1440}},audio:false})`.
3. No test changes for the constraints (F7: `tests/camera-flip.test.mjs` reads `facingMode` only; `tests/camera-frame.test.mjs` drives a 1920×1080 video).
4. `src/lib/posts/feed-photo.ts`:
   - Replace `export const MAX_FEED_SOURCE_BYTES = 4 * 1024 * 1024;` with `export const MAX_FEED_SOURCE_BYTES = 4 * 1024 * 1024;\n// The sharper copies read the original (up to 4096 px on the long side). This ceiling is a chosen limit, not a measured size; a larger object falls back to the signed original.\nexport const MAX_ORIGINAL_SOURCE_BYTES = 8 * 1024 * 1024;\n// Fit-inside boxes for the sharper copies: 1040 for 2x screens, 1560 for 3x (a 390 px card × density × 4/3 for a portrait photo).\nexport const SHARP_FEED_BOXES = {'v2-1040.webp': 1040, 'v2-1560.webp': 1560} as const;\nexport type SharpVariant = keyof typeof SHARP_FEED_BOXES;`.
   - Replace `export async function readFeedSource(response: Response): Promise<Buffer> {` with `export async function readFeedSource(response: Response, limit = MAX_FEED_SOURCE_BYTES): Promise<Buffer> {`; replace `  if (length > MAX_FEED_SOURCE_BYTES) { await response.body.cancel(); throw new Error('Source too large'); }` with `  if (length > limit) { await response.body.cancel(); throw new Error('Source too large'); }`; replace `      if (bytes > MAX_FEED_SOURCE_BYTES) throw new Error('Source too large');` with `      if (bytes > limit) throw new Error('Source too large');`.
   - After the closing `}` of `resizeFeedPhoto` (the file's last line) append:
     ```ts
     // One sharper WebP from the original. No small-byte cap: the caller chose the box.
     export async function resizeSharpPhoto(source: Buffer, box: number): Promise<Buffer> {
       const output = await sharp(source, {limitInputPixels: 16_777_216, failOn: 'error'})
         .timeout({seconds: 3}).rotate().resize({width: box, height: box, fit: 'inside', withoutEnlargement: true})
         .webp({quality: 68, effort: 3}).toBuffer();
       if (output.length > 600_000) throw new Error('Sharp copy too large');
       return output;
     }
     ```
5. Create `src/app/api/media/feed/[owner]/[post]/[media]/[variant]/route.ts` with exactly this text (Next serves the static sibling `v1.webp` first, so v1 is untouched):
   ```ts
   import {createClient} from '@/lib/supabase/server';
   import {readFeedSource, reserveFeedPhoto, resizeSharpPhoto, MAX_ORIGINAL_SOURCE_BYTES, SHARP_FEED_BOXES, type SharpVariant} from '@/lib/posts/feed-photo';

   // Sharper feed copies (2x, 3x) made from the original and cached a year under
   // their own identity; the v1 route stays for 1x screens and old caches.
   const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
   const headers = {'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'};
   const fail = (status: number) => new Response(null, {status, headers});

   export async function GET(request: Request, context: {params: Promise<{owner: string; post: string; media: string; variant: string}>}) {
     try { return await readPhoto(request, context); }
     catch { return fail(503); }
   }

   async function readPhoto(request: Request, context: {params: Promise<{owner: string; post: string; media: string; variant: string}>}) {
     const {owner, post, media, variant} = await context.params;
     if (![owner, post, media].every(value => UUID.test(value)) || new URL(request.url).search) return fail(404);
     const box = SHARP_FEED_BOXES[variant as SharpVariant];
     if (!box) return fail(404);
     const signal = AbortSignal.any([request.signal, AbortSignal.timeout(6000)]);
     const db = await createClient(signal);
     // Identity from the cookie avoids a network Auth call per photo. The next
     // lookup and original object fetch still enforce real session RLS.
     const {data: {session}} = await db.auth.getSession();
     if (!session?.user) return fail(401);
     if (owner !== session.user.id) return fail(404);
     const {data, error} = await db.from('post_media').select('storage_path,kind').eq('id', media).eq('post_id', post).maybeSingle();
     if (error || !data || data.kind !== 'photo') return fail(404);
     if (typeof data.storage_path !== 'string' || !data.storage_path.startsWith(`${owner}/${post}/`) || !/\.jpg$/.test(data.storage_path)) return fail(404);
     const cacheHeaders = {...headers, 'Cache-Control': 'private, max-age=31536000, immutable', ETag: `"${media}-${variant}"`};
     if (request.headers.get('if-none-match') === cacheHeaders.ETag) {
       return new Response(null, {status: 304, headers: cacheHeaders});
     }
     // Only called after the owning user's RLS lookup, including on overload/failure.
     const original = async () => {
       try {
         const result = await db.storage.from('media').createSignedUrl(data.storage_path, 60);
         if (result.error || !result.data?.signedUrl) return fail(502);
         const target = new URL(result.data.signedUrl);
         if (target.origin !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin) return fail(502);
         return new Response(null, {status: 302, headers: {...headers, Location: target.href}});
       } catch { return fail(502); }
     };
     const release = reserveFeedPhoto();
     if (!release) return original();
     try {
       if (!session.access_token) return fail(401);
       const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
       const sourceUrl = new URL(`/storage/v1/object/authenticated/media/${data.storage_path.split('/').map(encodeURIComponent).join('/')}`, base.origin);
       const response = await fetch(sourceUrl, {headers: {Authorization: `Bearer ${session.access_token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!}, signal, cache: 'no-store', redirect: 'error'});
       const source = await readFeedSource(response, MAX_ORIGINAL_SOURCE_BYTES);
       try {
         const output = await resizeSharpPhoto(source, box);
         if (signal.aborted) return fail(503);
         return new Response(new Uint8Array(output), {headers: {...cacheHeaders, 'Content-Type': 'image/webp'}});
       } catch {
         // A failed or slow resize must still show a photo: a browser does not fall
         // back from a failed srcset candidate to src, so the answer is a redirect
         // to the signed original, the same fallback the v1 route uses on overload.
         return original();
       }
     } catch { return original(); }
     finally { release(); }
   }
   ```
   Every path after the ownership check answers with image bytes or a 302 to a 60 s signed URL of the original: resize failure, resize timeout, source download failure (`readFeedSource` throws into the outer catch) and transform overload all reach `original()`. The signed-original path is already what the legacy feed renders through the same `<img crossOrigin="anonymous">` (`feed.ts:144` and `:222`, `feedCopyUrl`), and the v1 route's 302 fallback is asserted in `tests/feed-photo.test.mjs` ("download failure redirects only after ownership lookup"). The 302 is not cached (`private, no-store` headers on it), so the next request tries the resize again. P4's failure therefore costs a full original download for that photo, never a broken image.
6. `src/lib/posts/feed-photo-url.ts`: append
   ```ts
   // The v1 URL is the identity; the sharper copies hang off it so the browser
   // picks one by screen density and never downloads two.
   export function feedPhotoSrcSet(url: string | null | undefined): string | undefined {
     if (!url || !url.endsWith('/v1.webp')) return undefined;
     const base = url.slice(0, -'/v1.webp'.length);
     return `${base}/v2-1040.webp 2x, ${base}/v2-1560.webp 3x`;
   }
   ```
7. Renderers (each file gains `import {feedPhotoSrcSet} from '@/lib/posts/feed-photo-url';` as its last import line). A second safety layer: every client image drops its `srcset` on the first `error` event, so the browser then loads `src` (the v1 copy). The server fallback in A.5 is the layer the plan relies on; this one is checked in A.12.
   - `src/components/Carousel.tsx`: replace `return <img ref={image} src={priority||nearViewport?active:undefined} crossOrigin="anonymous" width={1080} height={1080}` with `return <img ref={image} src={priority||nearViewport?active:undefined} srcSet={(priority||nearViewport)&&sharp?feedPhotoSrcSet(active):undefined} crossOrigin="anonymous" width={1080} height={1080}`; replace `  onError={()=>setRead({path:imageIdentity(active),url:active,failed:true})}` with `  onError={()=>{if(sharp){setSharp(false);return;}setRead({path:imageIdentity(active),url:active,failed:true});}}`; replace ` const [nearViewport,setNearViewport]=useState(false);` with ` const [nearViewport,setNearViewport]=useState(false);\n // Drops the sharper candidates after one failed load, so src (the v1 copy) is tried next.\n const [sharp,setSharp]=useState(true);`.
   - `src/app/(tabs)/page.tsx`: replace `if(first.photoUrl)preload(first.photoUrl,{as:'image',fetchPriority:'high',crossOrigin:'anonymous'});` with `if(first.photoUrl)preload(first.photoUrl,{as:'image',fetchPriority:'high',crossOrigin:'anonymous',imageSrcSet:feedPhotoSrcSet(first.photoUrl)});`; replace `<img crossOrigin="anonymous" src={first.photoUrl} width={1080} height={1080}` with `<img crossOrigin="anonymous" src={first.photoUrl} srcSet={feedPhotoSrcSet(first.photoUrl)} width={1080} height={1080}`; replace `onFirstPhoto:url=>preload(url,{as:'image',fetchPriority:'high',crossOrigin:'anonymous'})` with `onFirstPhoto:url=>preload(url,{as:'image',fetchPriority:'high',crossOrigin:'anonymous',imageSrcSet:feedPhotoSrcSet(url)})`. (This server-rendered image has no handler; the hydrated `MealPhoto` replaces it, and the server fallback covers it meanwhile.)
   - `src/components/PostOpenFrame.tsx`: replace `<img ref={image} src={url} crossOrigin="anonymous"` with `<img ref={image} src={url} srcSet={sharp?feedPhotoSrcSet(url):undefined} onError={()=>setSharp(false)} crossOrigin="anonymous"`; replace ` const [ratio,setRatio]=useState<string|null>(null);` with ` const [ratio,setRatio]=useState<string|null>(null);\n const [sharp,setSharp]=useState(true);`.
   - `src/components/OutlineOverlay.tsx`: replace `  const [src, setSrc] = useState(photo.previewUrl ?? photo.url);` with `  const [src, setSrc] = useState(photo.previewUrl ?? photo.url);\n  const [sharp, setSharp] = useState(true);`; replace `  return <img src={src} crossOrigin="anonymous" alt={alt} draggable={false} className="h-full w-full object-contain" />;` with `  return <img src={src} srcSet={sharp&&src===photo.previewUrl?feedPhotoSrcSet(src):undefined} onError={()=>setSharp(false)} crossOrigin="anonymous" alt={alt} draggable={false} className="h-full w-full object-contain" />;`; replace `<img src={slides[slide].url} alt={`Meal photo ${slide+1}`} className="size-full object-contain"/>` with `<img src={slides[slide].url} srcSet={feedPhotoSrcSet(slides[slide].url)} onError={event=>{event.currentTarget.removeAttribute('srcset');}} alt={`Meal photo ${slide+1}`} className="size-full object-contain"/>` (this slide element is not stateful; removing the attribute makes the browser load `src`). (`DetailImage` already imports `useState`; its `const [src, setSrc]` line is at `OutlineOverlay.tsx:31`.)
   - `src/lib/posts/home-photo-preload.ts`: replace `import { smallFeedPhotoUrl } from './feed-photo-url';` with `import { feedPhotoSrcSet, smallFeedPhotoUrl } from './feed-photo-url';` and replace `` return url ? `<${url}>; rel=preload; as=image; fetchpriority=high; crossorigin=anonymous` : null; `` with `` return url ? `<${url}>; rel=preload; as=image; fetchpriority=high; crossorigin=anonymous; imagesrcset="${feedPhotoSrcSet(url)}"` : null; ``. In `tests/home-photo-preload.test.mjs` replace `` rel=preload; as=image; fetchpriority=high; crossorigin=anonymous`); `` with `` rel=preload; as=image; fetchpriority=high; crossorigin=anonymous; imagesrcset="${feedPhotoSrcSet(smallFeedPhotoUrl(owner,post,media))}"`); `` and add `feedPhotoSrcSet` to that test's import from `../src/lib/posts/feed-photo-url.ts`.
8. `public/sw.js`: replace `const resized = url.pathname.match(/^\/api\/media\/feed\/([^/]+)\/([^/]+)\/([^/]+)\/v1\.webp$/);` with `const resized = url.pathname.match(/^\/api\/media\/feed\/([^/]+)\/([^/]+)\/([^/]+)\/(?:v1|v2-1040|v2-1560)\.webp$/);`. `tests/sw-media-cache.test.mjs`: after the line that declares `const resized=` add `const sharp3x=resized.replace('/v1.webp','/v2-1560.webp');` and, in the test that asserts `resized` is owned media, assert the same for `sharp3x` (the coder copies that assertion line once with `sharp3x`); the existing `resized.replace('/v1.webp','/v2.webp')` stays in the invalid list and still fails the new pattern.
9. Tests (access and data), `tests/feed-photo.test.mjs`: add a second loader `sharpRoute()` that compiles `../src/app/api/media/feed/[owner]/[post]/[media]/[variant]/route.ts` the way `route()` compiles v1 (same `require` stubs; `@/lib/posts/feed-photo` is passed through with `resizeSharpPhoto` replaceable by a `transform` option the way `resizeFeedPhoto` is) and takes `variant` in its params. Cases: (a) `v2-1560.webp` with a 1920×1440 JPEG from `sharp({create:{width:1920,height:1440,channels:3,background:'#a44c32'}}).jpeg().toBuffer()` answers 200, `content-type image/webp`, `cache-control private, max-age=31536000, immutable`, ETag `"${media}-v2-1560"`, metadata width 1560 and height 1170, and the stub saw `url.pathname === /storage/v1/object/authenticated/media/${owner}/${post}/0.jpg`; (b) `v2-999.webp` answers 404 with `calls.fetch === 0`; (c) `{user:null}` → 401 and `{user:{id:post}}` → 404, both with no fetch; (d) `feedPhotoSrcSet('/api/media/feed/a/b/c/v1.webp') === '/api/media/feed/a/b/c/v2-1040.webp 2x, /api/media/feed/a/b/c/v2-1560.webp 3x'` and `feedPhotoSrcSet('https://x/y.jpg') === undefined`; (e) a `transform` that throws answers 302 with `location` matching `/^https:\/\/storage\.example\//`, `cache-control private, no-store` and `calls.sign === 1` (the resize-failure fallback); (f) a `sourceFetch` that throws answers 302 the same way; (g) a `transform` that rejects after 10 ms while the request's own signal is aborted answers 302 as well. No case leaves the route answering 503 after a successful ownership lookup.
10. **Bytes before and after (the issue's "observe first").** Before: your Beef noodle post as the coder measured it on `a24587a` (original 480×640, 126,407 B; feed WebP 22,118 B) is the "before" row. After, on production as test account 2 through `scripts/run15-production-checks.mjs` (a copy of `scripts/run14-production-checks.mjs` whose `photoPost` posts `scripts/fixtures/plate3.jpg` resized to 1920×1440 by `sharp` in the script): wait for ready, then record from `storage.objects` (read-only SQL: `select name, (metadata->>'size')::int from storage.objects where bucket_id='media' and name like '<uid>/<post>/%'`) the original and `.feed.jpg` sizes, and with the account-2 cookie (`scripts/lib/session.mjs`) the status, content-type and byte length of `v1.webp`, `v2-1040.webp` and `v2-1560.webp` for that post's first media id. Table into `docs/run15-report.md` and appended to `docs/media-loading.md` under a dated heading. Delete the post and verify absent.
11. The camera resolution on your phones: after merge, the coder reads (read-only) `select width,height,created_at from post_media where post_id in (select id from posts where user_id=<your meal account id from E.4> and created_at>'<merge time>')` and records it in the report whenever you have posted; if you have not posted by the report's cutoff, the report says so.
12. Page look for the failure path (Firefox BiDi driver on the local production build against the disposable stack; `browsingContext.setViewport` with `devicePixelRatio: 3` so the 3x candidate is the one chosen): (1) on Home, the first card's `img.currentSrc` ends with `/v2-1560.webp` and `naturalWidth > 512`; (2) server fallback: stop the transform by setting the post's first `.jpg` object in local Storage to a non-JPEG byte string (admin client `upload` with `upsert: true` of the bytes `not a jpeg`), reload Home, and confirm the same image's `currentSrc` still ends with `/v2-1560.webp`, `naturalWidth > 0` and the network log shows the 302 to the signed original (the route answered a redirect, not a 503); restore the object from the fixture; (3) client fallback: in the page, set a card image's `srcset` attribute to a v2 URL whose media id belongs to a different post (the route answers 404, which is not an image) and confirm that the `error` event fires, `MealPhoto` re-renders without `srcset`, and `currentSrc` then ends with `/v1.webp` with `naturalWidth > 0`. Results, with the observed `currentSrc` values, go in the report. If (3) shows no `error` event in Firefox, the report says so and the server fallback (2) is the one the plan rests on.

**Blast radius.** Every phone upload and every feed photo on a 2x or 3x screen is larger than today; how much is P5 until A.10 measures it. Storage egress for the feed rises by the same measured ratio (#375 stays open; Fleet 14's egress script measures it when it next runs). Old posts stay 480×640. The v1 copy, Days thumbnails, saved-meal thumbnails and the detail's signed original are unchanged. If a phone ignores the ideal size, the plan still works at whatever size it gives (P1). A failed or slow resize (P4) costs that photo a full original download through the redirect, never a blank card. **Done:** tests pass, including the three fallback cases; A.12's three observations are recorded; the production byte table is written; the detail's first frame uses the same `srcset` so the 7b "nothing downloads again" promise holds; your phones (#379) remain the done condition for the look and the 2 s first photo.

## B. One upload path for a leftovers photo; the toast that stops a post (#570, #571, finding 1)

### B.1 The attachment goes through the upload manager and the sheet closes at once
1. `src/lib/posts/upload-store.ts`: replace `    copy?: CopyRequest;` with `    copy?: CopyRequest;\n    // A photo added to an existing meal (leftovers or another angle); runs in the background like a new post.\n    attachment?: {postId: string; notEaten: boolean};`.
2. `src/lib/posts/upload-manager.ts`:
   - Replace `import { PhotoUploadError, type UploadError } from '@/lib/media/put-with-progress';` with `import { PhotoUploadError, type UploadError } from '@/lib/media/put-with-progress';\nimport { PackPhotoUpload } from '@/lib/media/pack-photo-upload';\nimport { reencodeShot } from '@/lib/media/reencode';`.
   - Replace `    text?: boolean;` with `    text?: boolean;\n    attachment?: {postId: string; notEaten: boolean};`.
   - Replace `    writing: Promise<unknown>;` with `    writing: Promise<unknown>;\n    attachmentUpload?: PackPhotoUpload;`.
   - Replace `private readOwner: () => Promise<string | null> = async () => (await createClient().auth.getUser()).data.user?.id ?? null) { }` with `private readOwner: () => Promise<string | null> = async () => (await createClient().auth.getUser()).data.user?.id ?? null, private encodeShot = reencodeShot) { }`.
   - Replace `...(d.drink?{drinkTile:true}:{}),` with `...(d.drink?{drinkTile:true}:{}), ...(d.attachment?{attachment:d.attachment}:{}),`.
   - Replace `        if(entry.deleted||entry.data.ownerId!==this.ownerId)throw new Error('Sign-in changed. Your copy is kept for its original account.');\n        void this.run(entry);return id;\n    }` with
     ```ts
             if(entry.deleted||entry.data.ownerId!==this.ownerId)throw new Error('Sign-in changed. Your copy is kept for its original account.');
             void this.run(entry);return id;
         }
         /** A photo for an existing meal. Resolves once the file is durable on this device;
          * encoding, signing, both uploads and the attachment then run in the background. */
         async postAttachment(file: File, attachment: {postId: string; notEaten: boolean}): Promise<string> {
             if(!this.ownerId){const {data:{user}}=await createClient().auth.getUser();if(!user)throw new Error('Sign in to keep this photo.');this.ownerId=user.id;}
             const now=Date.now(),id=crypto.randomUUID();
             const entry=this.make({operationId:id,ownerId:this.ownerId,createdAt:now,reservedAt:now,caption:attachment.notEaten?'Leftovers':'Added photo',eatenAt:null,location:null,options:{},files:[file],snapshot:null,posted:true,attachment:{...attachment},state:'uploading',sent:0,total:file.size});
             this.entries.set(id,entry);
             this.notify(entry,'upload-started');
             try{await this.persist(entry);}catch{entry.data.state='failed';entry.data.message='The photo could not be kept on this phone. Try again.';this.notify(entry,'upload-failed');return id;}
             if(entry.deleted||entry.data.ownerId!==this.ownerId)throw new Error('Sign-in changed. Your photo is kept for its original account.');
             void this.run(entry);return id;
         }
         private async submitAttachment(entry:Entry):Promise<{postId:string}> {
             const d=entry.data,attachment=d.attachment!;
             entry.attachmentUpload??=new PackPhotoUpload(this.encodeShot,this.foodRequest);
             const photo=await entry.attachmentUpload.prepare(d.files[0]);
             const response=await this.foodRequest(`/api/posts/${attachment.postId}/media`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({photo,not_eaten:attachment.notEaten})});
             const result=await response.json().catch(()=>null) as {post_id?:string;error?:string}|null;
             if(!response.ok||!result?.post_id){d.message=typeof result?.error==='string'?result.error.slice(0,200):'The photo could not be attached. Your photo is kept.';throw new Error(d.message);}
             return {postId:result.post_id};
         }
     ```
   - Replace `if (d.files.length&&!d.photoDrinks&&!(d.food&&'photo' in d.food))` with `if (d.files.length&&!d.attachment&&!d.photoDrinks&&!(d.food&&'photo' in d.food))`.
   - Replace `const result = d.copy?await this.submitCopy(entry):d.food ? await this.submitFood(entry)` with `const result = d.attachment?await this.submitAttachment(entry):d.copy?await this.submitCopy(entry):d.food ? await this.submitFood(entry)`.
   - The finish path is unchanged: `post-created` fires with the attached post's id, which is what `attachFile` dispatched before.
3. `src/components/CaptureSheet.tsx`: delete the line `  const attachmentUpload=useRef<PackPhotoUpload|null>(null);` and replace `    try{\n      attachmentUpload.current??=new PackPhotoUpload();\n      const photo=await attachmentUpload.current.prepare(file);\n      const response=await fetch(`/api/posts/${forPost}/media`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({photo,not_eaten:attachmentIsLeftovers})});\n      const result=await response.json();if(!response.ok)throw Error(result.error??"The photo could not be attached. Your photo was kept; try again.");\n      window.dispatchEvent(new CustomEvent("post-created",{detail:{id:forPost}}));\n      onClose();router.refresh();return true;` with
   ```ts
       try{
         // The photo is kept on this device first; upload and attachment run in the background, the same path as a new post.
         await uploadManager.postAttachment(file,{postId:forPost,notEaten:attachmentIsLeftovers});
         onClose();router.refresh();return true;
   ```
   (`PackPhotoUpload` stays imported for `labelUploadRef`; `useRef` stays imported for the other refs.)
4. `src/components/Feed.tsx`: replace `const uploads=useUploads().filter(upload=>upload.posted);` with `const uploads=useUploads().filter(upload=>upload.posted&&!upload.attachment);` and replace `uploadManager.list().filter(upload=>upload.posted).map(upload=>dateInZone(upload.eatenAt,zone))` with `uploadManager.list().filter(upload=>upload.posted&&!upload.attachment).map(upload=>dateInZone(upload.eatenAt,zone))` (an attachment is not a new card).
5. `src/components/UploadChip.tsx`:
   - Replace `const pathname=usePathname(),router=useRouter(),uploads=useUploads().filter(upload=>upload.posted&&!upload.postId);` with `const pathname=usePathname(),router=useRouter(),all=useUploads().filter(upload=>upload.posted&&!upload.postId);\n // On Home a new post shows as its own card, so the chip carries only attachments there.\n const uploads=pathname==='/'&&!sidebar?all.filter(upload=>upload.attachment):all;`.
   - Replace `if(!uploads.length||(!inSidebar&&pathname==='/'))return null;` with `if(!uploads.length||(!inSidebar&&pathname==='/'&&!uploads.some(upload=>upload.attachment)))return null;`.
   - Replace `(upload.text?'Posting caption…':'Uploading photo…')` with `(upload.text?'Posting caption…':upload.attachment?(upload.attachment.notEaten?'Adding leftovers photo…':'Adding photo…'):'Uploading photo…')`.
   - Replace `const view=()=>{router.push('/');` with `const view=()=>{if(upload.attachment){router.push(`/posts/${upload.attachment.postId}`);return;}router.push('/');`.
6. Tests (data durability), `tests/upload-guard.test.mjs`. Add, after the existing `harness` function, `function attachHarness(media){const rows=new Map();const store={all:async()=>[...rows.values()],put:async row=>{await pause();rows.set(row.operationId,structuredClone(row));},remove:async id=>{rows.delete(id);},clear:async()=>rows.clear()};const calls=[];const request=async(url,init)=>{const path=typeof url==='string'?url:url.url;calls.push(path);if(path.endsWith('/api/media/sign-upload'))return new Response(JSON.stringify({uploads:[{position:0,originalPath:'owner/stage/0.jpg',feedPath:'owner/stage/0.feed.jpg',originalSignedUrl:'https://storage.invalid/o',feedSignedUrl:'https://storage.invalid/f'}]}),{status:200});if(path.startsWith('https://storage.invalid/'))return new Response(null,{status:200});if(path.endsWith('/media'))return media(init);throw Error('unexpected '+path);};const encode=async()=>({original:new Blob(['o']),feed:new Blob(['f']),phash:'1',width:10,height:10});const manager=new UploadManager(store,()=>({setProgress(){},restore(){},snapshot:async()=>null,stage:async()=>{},submit:async()=>{throw Error('attachments never submit a draft')}}),async()=>{},request,async()=>'owner',encode);return{manager,store,rows,calls};}` and three tests:
   - `'an attachment is durable before the sheet may close, then uploads and attaches in the background'`: `media` answers `new Response(JSON.stringify({post_id:'post-1'}),{status:201})`; `await manager.initialize('owner')`; `const id=await manager.postAttachment(file,{postId:'post-1',notEaten:true});` then assert `rows.get(id).posted===true`, `rows.get(id).attachment.notEaten===true`, and `calls.filter(c=>c.endsWith('/media')).length===0` at that moment; then `await until(()=>manager.list()[0]?.postId==='post-1')`; assert `calls` contains the sign-upload call, both storage PUTs and the media call in that order, and `(await store.all()).length===0`.
   - `'a failed attachment keeps the photo and retries from the chip'`: `media` answers `new Response(JSON.stringify({error:'The photo could not be attached.'}),{status:503})` until a flag flips; `postAttachment`, `await until(()=>manager.list()[0]?.state==='failed')`; assert `manager.list()[0].message==='The photo could not be attached.'` and `.attachment.postId==='post-1'`; flip the flag to answer 201 `{post_id:'post-1'}`; `manager.retry(id)`; `await until(()=>manager.list()[0]?.postId==='post-1')`.
   - `'an attachment is not a feed card'`: after `postAttachment`, `manager.list()[0].attachment` is set and `manager.list()[0].kind===undefined`.

### B.2 Save meal cannot be pressed on a meal that is not ready, and the server says why (#571's known source)
1. `src/components/PostActions.tsx`: replace `  const save=()=>{if(bookmarkRef.current.pending)return;` with `  // A meal saves only once it is ready (save_meal_from_post refuses earlier); until then the control is faded and inert, like the thumbs (7a).\n  const ready=!post||post.status==='ready';\n  const save=()=>{if(!ready||bookmarkRef.current.pending)return;` and replace `className="-my-[10px] -mr-[10px] ml-auto flex size-11 items-center justify-center" onClick={save}>` with `disabled={!ready} className={`-my-[10px] -mr-[10px] ml-auto flex size-11 items-center justify-center ${ready?'text-text':'text-faint'}`} onClick={save}>`.
2. `src/lib/posts/saved.ts`: replace `if(error||typeof data!=='string')throw new Error('The meal could not be saved.');` with `if(error||typeof data!=='string')throw Object.assign(new Error(error?.code==='42501'?'This meal is still being analysed. Save it once its nutrition shows.':'The meal could not be saved.'),{code:error?.code});`.
3. `src/app/api/saved/route.ts`: replace `catch{return NextResponse.json({error:'The meal could not be saved.'},{status:400});}` with `catch(e){const code=(e as {code?:string})?.code;return NextResponse.json({error:e instanceof Error?e.message:'The meal could not be saved.'},{status:code==='42501'?409:400});}`.
4. `tests/db/saved-meal-not-ready.test.mjs` (access rule; pattern of `tests/db/approximation-summary.test.mjs`, SQL in a rolled-back transaction): insert a user and profile, a `processing` post with one `post_items` row, then `set local role authenticated; select set_config('request.jwt.claims', json_build_object('sub',<user id>)::text, true);` and assert `select save_meal_from_post(<post>,'x')` raises `sqlstate '42501'`; `reset role; update posts set status='ready' where id=<post>;` then under the same claims assert it returns a uuid; rollback.

### B.3 Observe the two-post overlap (the issue's "observe first")
On production as test account 2 through the Firefox BiDi driver (copy of `scripts/run14-production-checks.mjs`, `--bidi=ws://127.0.0.1:19424/session`), at 390×844, unthrottled: install a `fetch` wrapper in the page that records every request with status 400 or above (the way that script's `photoPost` already wraps `window.fetch` to collect post ids); post fixture photo 1 through the camera entry; two seconds later open the camera again and post fixture photo 2; record every failing request and every console error from the first tap until both posts are ready, every toast text that appears (`[role="alert"]` text), and whether a second Post press was needed. Then, on the first post while it is still processing, tap its bookmark once: before this lane deploys that reproduces the `/api/saved` 400 and the toast; after, the control is inert and nothing is sent. Put both timelines in `docs/run15-report.md`. A failing request other than `/api/saved` is not fixed in this lane: the coder files it as its own GitHub issue with the timeline (title, the request, the status, the toast text) and lists the number in the report. Delete both posts and verify absent.

### B.4 Time the leftovers photo (the #570 "observe first")
Same driver, same account, unthrottled: from the Post tap to the sheet closing and to the leftovers slide appearing on the card, for a regular post and for a leftovers photo, before (production at `a24587a1`) and after (production after this lane merges); plus the server durations from the rows: `jobs.started_at - created_at` (queue wait) and `finished_at - started_at` for each post's analyze job, and the `prepare_post_photo_attachment` to `complete_post_photo_attachment` span from `model_calls`/`post_media.created_at`. Table in the report, labelled unthrottled. Your 11 s on your phone stays yours to re-time.

**Blast radius.** Every "Add photo"/Leftovers attachment: it now survives reloads and retries from the upload chip; a failure shows on the chip, not in the sheet. The bookmark on a processing card is inert until ready. `/api/saved` answers 409 with a plain message for a not-ready meal instead of 400 with a generic one. **Done:** the three new manager tests and the DB test pass; `npm test`; the before/after timing table and the overlap timelines are in the report; the sheet closes within one second of the tap for a leftovers photo in the unthrottled measurement.

## C. Day rings scroll back in time (#569, design 7c/7d)

1. `src/app/(tabs)/page.tsx`:
   - Replace `return await homeDeadline(getDayTotals(db, user.id, zone, Array.from({length: 5}, (_, index) => shiftDay(today, -index))));` with `return await homeDeadline(getDayTotals(db, user.id, zone, Array.from({length: 6}, (_, index) => shiftDay(today, -index))));` (the sixth ring peeks at the edge, 7c).
   - Replace `import { dateInZone, getDayTotals, getLoggedDates, shiftDay, validZone } from "@/lib/posts/days";` with `import { dateInZone, getDayTotals, getEarliestPostDate, getLoggedDates, shiftDay, validZone } from "@/lib/posts/days";`.
   - Replace `  let ownerId: string | null = null;` with `  let ownerId: string | null = null;\n  let earliest: string | null = null;`; replace `    [days, totals, ownerId] = await homeDeadline((async () => {` with `    [days, totals, ownerId, earliest] = await homeDeadline((async () => {`; replace
     ```ts
           const [logged,readTotals] = user ? await Promise.all([
             getLoggedDates(supabase, user.id, zone, shiftDay(today, -4), today),
             homeDayTotals(),
           ]) : [[], []] as [{date: string}[], import('@/lib/posts/days').FeedDayTotal[]];
           return [logged,readTotals,user?.id??null] as [{date:string}[],import('@/lib/posts/days').FeedDayTotal[],string|null];
     ```
     with
     ```ts
           const [logged,readTotals,first] = user ? await Promise.all([
             getLoggedDates(supabase, user.id, zone, shiftDay(today, -29), today),
             homeDayTotals(),
             getEarliestPostDate(supabase, user.id, zone).catch(() => null),
           ]) : [[], [], null] as [{date: string}[], import('@/lib/posts/days').FeedDayTotal[], string | null];
           return [logged,readTotals,user?.id??null,first] as [{date:string}[],import('@/lib/posts/days').FeedDayTotal[],string|null,string|null];
     ```
   - Replace `return <DayRings ownerId={ownerId} days={days} totals={totals} today={today} zone={zone} zoneKnown={Boolean(cookieZone)} />;` with `return <DayRings ownerId={ownerId} days={days} totals={totals} today={today} zone={zone} zoneKnown={Boolean(cookieZone)} earliest={earliest} />;`.
2. Replace the whole of `src/components/DayRings.tsx` with:
   ```tsx
   'use client';
   import { formatCalories } from "@/lib/nutrition/totals";
   import {useCallback,useEffect,useRef,useState} from 'react';
   import Link from 'next/link';
   import {useRouter} from 'next/navigation';
   import {shiftDay,withZone,type FeedDayTotal,type MonthDay} from '@/lib/posts/days';
   import {bubbleLinkClass} from '@/lib/posts/bubble';
   import {Icon} from '@/components/ui/Icon';
   // Design 7c/7d: Today first, older days to the right; the row scrolls back in
   // time one ring at a time and never moves the feed. The first 30 days are
   // drawn at once; 30 more load within five rings of the end, ending at the
   // first post. The server supplies the first six totals; older rings read the
   // month summaries only after the row is first scrolled.
   const FIRST_LOAD=30,LOAD_MORE=30,NEAR_END=5,RING_STEP=72;
   function daysBetween(from:string,to:string){return Math.round((Date.parse(`${to}T12:00:00Z`)-Date.parse(`${from}T12:00:00Z`))/86_400_000);}
   export default function DayRings({days,totals,today,zone,zoneKnown,ownerId,earliest=null,pending=false}:{pending?:boolean;ownerId?:string|null;days:{date:string}[];totals:FeedDayTotal[];today:string;zone:string;zoneKnown:boolean;earliest?:string|null}) {
    const router=useRouter();
    const [snapshot,setSnapshot]=useState({seed:totals,days:totals,ready:!pending});
    const [count,setCount]=useState(FIRST_LOAD);
    const [touched,setTouched]=useState(false);
    const [loaded,setLoaded]=useState<Record<string,MonthDay>>({});
    const months=useRef(new Set<string>());
    const row=useRef<HTMLElement>(null);
    const currentTotals=snapshot.seed===totals?snapshot.days:totals;
    const waiting=pending&&!snapshot.ready;
    // The row always holds the first 30 days; past them it ends at the first post.
    const span=earliest?Math.max(FIRST_LOAD,daysBetween(earliest,today)+1):Number.MAX_SAFE_INTEGER;
    const limit=Math.min(count,span);
    useEffect(()=>{
     const receive=(event:Event)=>{const detail=(event as CustomEvent<{userId:string;days:FeedDayTotal[];fresh?:boolean}>).detail;
      if(ownerId&&detail?.userId===ownerId&&Array.isArray(detail.days)&&detail.fresh!==false)setSnapshot({seed:totals,days:detail.days,ready:true});
     };
     window.addEventListener('feed-day-totals',receive);
     window.dispatchEvent(new CustomEvent('feed-day-totals-request'));
     return()=>window.removeEventListener('feed-day-totals',receive);
    },[ownerId,totals]);
    useEffect(()=>{if(pending&&!zoneKnown)return;const local=Intl.DateTimeFormat().resolvedOptions().timeZone;if(local&&local!==zone){document.cookie=`time-zone=${encodeURIComponent(local)}; Path=/; SameSite=Lax; Max-Age=31536000`;router.refresh();}},[router,zone,pending,zoneKnown]);
    // Home tapped while on Home returns the row to Today (7d).
    useEffect(()=>{const reset=()=>row.current?.scrollTo({left:0,behavior:'smooth'});window.addEventListener('home-reset',reset);return()=>window.removeEventListener('home-reset',reset);},[]);
    const loadMonth=useCallback(async(month:string)=>{
     if(months.current.has(month))return;months.current.add(month);
     try{const response=await fetch(`/api/days?month=${month}${zoneKnown?`&tz=${encodeURIComponent(zone)}`:''}`,{credentials:'same-origin'});if(!response.ok)throw new Error('month');const summary=await response.json() as {days:MonthDay[]};setLoaded(previous=>{const next={...previous};for(const day of summary.days)next[day.day]=day;return next;});}
     catch{months.current.delete(month);}
    },[zone,zoneKnown]);
    useEffect(()=>{
     if(!touched||!ownerId)return;
     const first=shiftDay(today,-(limit-1));const wanted=new Set<string>();
     for(let month=first.slice(0,7);month<=today.slice(0,7);month=shiftDay(`${month}-28`,7).slice(0,7))wanted.add(month);
     for(const month of wanted)void loadMonth(month);
    },[touched,ownerId,limit,today,loadMonth]);
    const onScroll=()=>{const element=row.current;if(!element)return;if(!touched)setTouched(true);if(element.scrollLeft+element.clientWidth>=element.scrollWidth-NEAR_END*RING_STEP&&limit<span)setCount(value=>Math.min(value+LOAD_MORE,span));};
    const todayAction=()=>window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera'}}));
    return <nav ref={row} aria-label="Days" onScroll={onScroll} onPointerDown={()=>{if(!touched)setTouched(true);}} className="desktop:hidden flex gap-[10px] overflow-x-auto snap-x snap-mandatory scroll-pl-inset overscroll-x-contain px-inset pt-[2px] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
     {Array.from({length:limit},(_,index)=>{
      const day=shiftDay(today,-index),month=loaded[day];
      const total=currentTotals.find(entry=>entry.day===day)??(month?{day,kcal:month.kcal,ready:month.ready,missing:month.missing}:undefined);
      const hasDay=total?total.ready:month?month.posts>0:days.some(entry=>entry.date===day);
      const parts=new Intl.DateTimeFormat('en-US',{weekday:'short',day:'numeric',timeZone:'UTC'}).formatToParts(new Date(`${day}T12:00:00Z`));
      const label=waiting?(index===0?'Today':'—'):index===0?'Today':`${parts.find(part=>part.type==='weekday')?.value} ${parts.find(part=>part.type==='day')?.value}`;
      const content=<><span className={`relative flex size-[56px] items-center justify-center rounded-circle border-2 p-[3px] ${index===0||hasDay?'border-text':'border-ring'}`}>
       <span className={`flex size-full items-center justify-center rounded-circle text-meta font-medium tabular-nums ${index===0||hasDay?'bg-card':''}`}>{total?.ready&&total.kcal!==null?formatCalories(total.kcal):''}</span>
       {index===0&&<span className="absolute -right-[3px] -bottom-[3px] flex size-[22px] items-center justify-center rounded-circle border-2 border-surface bg-text text-surface"><Icon name="plus" size={12} strokeWidth={3}/></span>}
      </span><span className={`text-label ${index===0?'text-text':bubbleLinkClass(hasDay)}`}>{label}</span></>;
      const dayLabel=`${label}, ${waiting?'updating':hasDay?(total?.kcal==null?'nutrition unavailable':`${formatCalories(total.kcal)} kcal consumed`):'no posts'}`;
      const className='flex w-[62px] shrink-0 snap-start flex-col items-center gap-[5px]';
      return index===0?<button key={day} type="button" aria-label="Photograph a meal today" onClick={todayAction} className={className}>{content}</button>:hasDay?<Link key={day} aria-label={dayLabel} href={withZone(`/days/${day}`,zone,zoneKnown)} className={className}>{content}</Link>:<span key={day} aria-label={dayLabel} className={className}>{content}</span>;
     })}
    </nav>;
   }
   ```
   `MonthDay` is exported from `days.ts`; `scroll-pl-inset` comes from the `--spacing-inset` token (F10).
3. `src/components/BottomBar.tsx`: replace `return <Link key={slot.href} href={slot.href} onClick={dismissSheets} aria-label={slot.label}` with `return <Link key={slot.href} href={slot.href} onClick={()=>{dismissSheets();if(slot.href==='/'&&pathname==='/'){window.dispatchEvent(new Event('home-reset'));window.scrollTo({top:0,behavior:'smooth'});}}} aria-label={slot.label}`.
4. `tests/day-rings-updates.test.mjs` (harness only, so the three existing data tests keep running; no layout assertion is added): replace `if(name==='react')return{useState:initial=>{state??=initial;return[state,value=>{state=value;}];},useEffect:run=>effects.push(run)};` with `if(name==='react')return{useState:initial=>{const slot=cursor++;if(!(slot in slots))slots[slot]=initial;return[slots[slot],value=>{slots[slot]=typeof value==='function'?value(slots[slot]):value;}];},useEffect:run=>effects.push(run),useRef:initial=>({current:initial}),useCallback:fn=>fn};`; replace `const events=new EventTarget(),effects=[],exports={},jsx=(type,props)=>({type,props});let state,tree;` with `const events=new EventTarget(),effects=[],exports={},jsx=(type,props)=>({type,props}),slots=[];let cursor=0,tree;`; replace `const render=next=>{tree=exports.default(next??props);return JSON.stringify(tree);};` with `const render=next=>{cursor=0;tree=exports.default(next??props);return JSON.stringify(tree);};`; in the `vm.runInNewContext` context object add `fetch:async()=>{throw Error('no network in test');},` after `document:{cookie:''},`. The three existing assertions (`600 kcal consumed`, `no posts`, `updating`, `"children":"0"`) are unchanged.
5. Page look (contract "The page look"; Firefox BiDi driver, no images stored): on a local production build at 390×844 and on the preview: five whole rings and the sixth partly visible (`getBoundingClientRect()` of the sixth ring's left edge is below `innerWidth`, its right edge beyond it); a swipe stops on a ring (`scrollLeft` a multiple of 72 within 2 px after `scrollBy({left:100})` settles); the feed's first card's `getBoundingClientRect().top` is unchanged after the row scrolls; after scrolling to the end the row grows to 60 rings when the account has posts older than 30 days (test account 2 does: its first post is on 2026-10-31); the last ring is whole; dispatching `home-reset` returns `scrollLeft` to 0. Differences from 7c/7d listed on the PR. Then the same on production after merge.

**Blast radius.** Home's day strip on every phone, `ShellHome`, the Home tab's tap. One more light query per Home open (`getEarliestPostDate`, `limit 1`) and 30 days of logged dates instead of 5 (ids only). Month summaries are read only after the row is touched. **Done:** `npm test`; the page look list; your three phones (#379) for the final word.

## D. The calendar and the day summary count the same posts (#574)

1. `src/lib/posts/days.ts`:
   - Replace `export interface LoggedDay { date: string; posts: DayPost[]; totals: MealTotals; intake: IntakeTotals }` with `// pending: meals of that day still being analysed or waiting for a reply; they are listed nowhere yet and are counted apart.\nexport interface LoggedDay { date: string; posts: DayPost[]; totals: MealTotals; intake: IntakeTotals; pending: number }`.
   - Replace `.select(`id,caption,eaten_at,post_media(storage_path,position),current_post_items(` with `.select(`id,caption,eaten_at,status,post_media(storage_path,position),current_post_items(`; replace `.eq("user_id", userId).eq("status", "ready").gte("eaten_at", lower).lt("eaten_at", upper)` with `.eq("user_id", userId).in("status", LOGGED_STATUSES).gte("eaten_at", lower).lt("eaten_at", upper)`; replace `      if (date < from || date > through) continue;\n      // Use the shared current-item mapper` with `      if (date < from || date > through) continue;\n      if (row.status !== "ready") { const day = groups.get(date); if (day) day.pending++; else groups.set(date, { date, posts: [], totals: sumNutrition([]), intake: emptyIntake(), pending: 1 }); continue; }\n      // Use the shared current-item mapper`; replace `else groups.set(date, { date, posts: [post], totals: post.totals, intake: emptyIntake() });` with `else groups.set(date, { date, posts: [post], totals: post.totals, intake: emptyIntake(), pending: 0 });`; replace `else groups.set(date, {date, posts: [], totals: sumNutrition([]), intake: totals});` with `else groups.set(date, {date, posts: [], totals: sumNutrition([]), intake: totals, pending: 0});`. (`LOGGED_STATUSES` is declared later in the file and read at call time.)
   - Replace `export interface MonthDay { intake?: boolean; day: string; kcal: number | null; posts: number; ready: boolean; missing?:string[]; known?:number }` with `export interface MonthDay { intake?: boolean; day: string; kcal: number | null; posts: number; pending: number; ready: boolean; missing?:string[]; known?:number }`.
   - Replace `const day = groups.get(date) ?? { day: date, kcal: 0, posts: 0, ready: false, missing:[],known:0 };\n      day.posts++;` with `const day = groups.get(date) ?? { day: date, kcal: 0, posts: 0, pending: 0, ready: false, missing:[],known:0 };\n      if (row.status === "ready") day.posts++; else day.pending++;`; replace `groups.set(date, {day: date, kcal: null, posts: 0, ready: false, missing: [], known: 0, intake: true});` with `groups.set(date, {day: date, kcal: null, posts: 0, pending: 0, ready: false, missing: [], known: 0, intake: true});`.
2. `src/app/api/days/route.ts` and `src/components/DaysScreen.tsx`: in each, replace `{ date, posts: [], totals: sumNutrition([]), intake: emptyIntake() }` with `{ date, posts: [], totals: sumNutrition([]), intake: emptyIntake(), pending: 0 }`. These five places (F2) are every constructor of the two types; `TodayView` in `today-view.ts` is a separate type and does not change.
3. Labels: `src/components/PhoneCalendar.tsx`, replace `aria-label={`${date}${day?`, ${day.posts} ${day.posts===1?'post':'posts'}${day.intake?', drank':''}` with `aria-label={`${date}${day?`, ${day.posts} ${day.posts===1?'post':'posts'}${day.pending?`, ${day.pending} not finished`:''}${day.intake?', drank':''}`. `src/components/MonthGrid.tsx`, replace `aria-label={`${date}${day ? `, ${day.posts} ${day.posts === 1 ? "post" : "posts"}${day.intake ? ", drank" : ""}` with `aria-label={`${date}${day ? `, ${day.posts} ${day.posts === 1 ? "post" : "posts"}${day.pending ? `, ${day.pending} not finished` : ""}${day.intake ? ", drank" : ""}`.
4. Summaries: in `src/components/DaysView.tsx` and `src/components/DesktopDays.tsx` replace `{active.posts.length} {active.posts.length===1?'post':'posts'}</p>` with `{active.posts.length} {active.posts.length===1?'post':'posts'}{active.pending?` · ${active.pending} not finished`:''}</p>` (one occurrence in each file).
5. Tests (data rule): `tests/days-summary.test.mjs` already asserts the month query's status filter (F2); add one case to it: with one `ready` post holding a 100 kcal item and one `needs_input` post on the same local day, `getMonthSummary` yields that day with `posts 1, pending 1, kcal 100`, and `getDays` for that day yields `posts.length 1, pending 1`. The other two days tests assert no status filter and need no change.
6. Production check after merge, as test account 2 (the account in F2 is a designated test account; the coder confirms it is account 2 from `TEST_USER2_EMAIL` before relying on it, else uses the day F2's query shows for account 2): `/api/days?date=2026-10-31&tz=America/Edmonton` answers `posts.length 4, pending 1`, and `/api/days?month=2026-10&tz=America/Edmonton` holds `2026-10-31` with `posts 4, pending 1`; the Days page label reads "2026-10-31, 4 posts, 1 not finished, 1,842 kcal" and the summary "Consumed: 1,842 kcal · 4 posts · 1 not finished". Record in the report.

**Blast radius.** Days (phone and desktop) labels and summaries; the `/api/days` payloads gain a field; Home's rings and totals are untouched. Agents reading `/api/days` see an extra field. **Done:** tests pass; the production readback matches; #574 closes.

## E. Counts for the owner on /admin (#567)

1. `src/lib/admin/stats.ts`: replace `  const [depth, oldest, failures, errors, posts] = await Promise.all([` with `  const [depth, oldest, failures, errors, posts, users, postCount, postsDay, calls, callsDay, failedCalls, failedCallsDay] = await Promise.all([`; replace `    admin.from("posts").select("id,created_at").is("deleted_at", null).order("created_at", { ascending: false }).order("id").limit(20),` with
   ```ts
       admin.from("posts").select("id,created_at").is("deleted_at", null).order("created_at", { ascending: false }).order("id").limit(20),
       // App-wide counts only: no handle, caption, photo or address leaves the database here.
       admin.from("profiles").select("id", { count: "exact", head: true }),
       admin.from("posts").select("id", { count: "exact", head: true }).is("deleted_at", null),
       admin.from("posts").select("id", { count: "exact", head: true }).is("deleted_at", null).gte("created_at", dayAgo.toISOString()),
       admin.from("model_calls").select("id", { count: "exact", head: true }),
       admin.from("model_calls").select("id", { count: "exact", head: true }).gte("started_at", dayAgo.toISOString()),
       admin.from("model_calls").select("id", { count: "exact", head: true }).not("error", "is", null),
       admin.from("model_calls").select("id", { count: "exact", head: true }).not("error", "is", null).gte("started_at", dayAgo.toISOString()),
   ```
   replace `  if ([depth, oldest, failures, errors, posts].some((result) => result.error)) throw new Error("Queue statistics could not be read.");` with `  if ([depth, oldest, failures, errors, posts, users, postCount, postsDay, calls, callsDay, failedCalls, failedCallsDay].some((result) => result.error)) throw new Error("Queue statistics could not be read.");`; replace `    posts: posts.data ?? [],\n  };` with `    posts: posts.data ?? [],\n    app: { users: users.count ?? 0, posts: postCount.count ?? 0, postsDay: postsDay.count ?? 0, modelCalls: calls.count ?? 0, modelCallsDay: callsDay.count ?? 0, failedCalls: failedCalls.count ?? 0, failedCallsDay: failedCallsDay.count ?? 0 },\n  };`.
2. `src/app/admin/page.tsx`: replace `    <h1 className="mb-card-gap text-title">Queue</h1>` with
   ```tsx
       <h1 className="mb-card-gap text-title">Admin</h1>
       <h2 className="mb-sheet-top text-sheet-title">App</h2>
       <table className="mb-card-gap w-full tabular-nums"><thead><tr className="text-left"><th scope="col">Count</th><th scope="col" className="text-right">All time</th><th scope="col" className="text-right">Last 24 h</th></tr></thead>
         <tbody>
           <tr className="h-table-row border-b border-hairline"><td>Accounts</td><td className="text-right">{stats.app.users}</td><td className="text-right">—</td></tr>
           <tr className="h-table-row border-b border-hairline"><td>Meals posted</td><td className="text-right">{stats.app.posts}</td><td className="text-right">{stats.app.postsDay}</td></tr>
           <tr className="h-table-row border-b border-hairline"><td>Model calls</td><td className="text-right">{stats.app.modelCalls}</td><td className="text-right">{stats.app.modelCallsDay}</td></tr>
           <tr className="h-table-row border-b border-hairline"><td>Failed model calls</td><td className="text-right">{stats.app.failedCalls}</td><td className="text-right">{stats.app.failedCallsDay}</td></tr>
         </tbody>
       </table>
       <h2 className="mb-sheet-top text-sheet-title">Queue</h2>
   ```
3. Nothing changes in the role check, the middleware or the "Not found" answer: they are the design (#567's "Not found" was a non-admin account).
4. Your account becomes admin (your choice). After this lane's PR merges, the coder runs on production, in one transaction with a read-back: `select user_id from posts where caption ilike 'beef noodle%' and deleted_at is null order by created_at desc limit 1;` names your meal account (the post measured in #579); then `update public.profiles set role='admin' where id='<that id>' and role='user' returning id, role;` (exactly one row), and records the first eight characters of the id in `docs/run15-report.md`. No email or handle goes into any document. This is a one-row data update, not a migration.
5. Checks: local production build against the disposable stack with a profile set to `admin`: `/admin` shows the App table with counts equal to `select count(*)` of the same tables; a `user` profile gets Not found (`tests/admin-access.test.mjs` already covers the refusal; it keeps passing). On production: as test account 2 (`user`), `/admin` answers 404 with "Not found"; the admin look on your account is yours.

**Blast radius.** The admin page only (seven more count queries per open, service role, no per-user content). Your account gains admin: it can open `/admin` and the per-post model traces (`/admin/posts/<id>`), and `profiles_owner_update` keeps you from changing the role back from the app. **Done:** local counts match; production 404 for a non-admin; the role read back; #567 stays open with the evidence until you have seen the page.

## F. "How My Food AI works" for a judge (#568)

Your choice: models plus the judge's own meals, reached from Profile.

1. Create `src/app/(tabs)/profile/about/page.tsx` (server component, the `profile/deleted` pattern; under `/profile` so the middleware's verified-user path covers it):
   ```tsx
   import {connection} from 'next/server';
   import {redirect} from 'next/navigation';
   import Link from 'next/link';
   import {createClient} from '@/lib/supabase/server';
   import {verifiedUserId} from '@/lib/auth/verified-user';
   // A judge's page: what the app does, which models run, and where the judge's
   // own meals are. It names no other account's data; every read in the app runs
   // under row-level security, so an account sees its own meals only.
   const MODELS=[
    {name:'SAM 3.1',id:'sam-3.1',job:'Outlines each food in a meal photo.'},
    {name:'Muse Spark 1.3',id:'muse-spark-1.3',job:'Names the foods and their portions, reads nutrition labels, interprets corrections and picks the matching USDA reference.'},
    {name:'Muse Voice Transcribe 1.0',id:'muse-voice-transcribe-1.0',job:'Turns a spoken correction into text for you to confirm.'},
    {name:'Muse Spark Open (Meta open weights on Baseten)',id:'meta-models/muse-spark-open-1026',job:'An optional path for naming foods and portions, switched on under Profile. SAM and transcription stay on the Meta API.'},
   ];
   export default async function AboutPage(){
    await connection();const db=await createClient();const verified=await verifiedUserId();const user=verified?{id:verified}:(await db.auth.getUser()).data.user;if(!user)redirect('/sign-in');
    return <main className="mx-auto w-full max-w-phone px-inset py-6 text-text">
     <Link href="/profile" className="inline-flex min-h-tap items-center text-detail">‹ Profile</Link>
     <h1 className="text-title">How My Food AI works</h1>
     <p className="mt-3 text-detail text-muted">Photograph a meal, write a caption, or say what changed, and see what was consumed. The app records what was eaten. It gives no advice, sets no targets and makes no health claims.</p>
     <h2 className="mt-6 text-sheet-title">What happens to a photo</h2>
     <ol className="mt-2 list-decimal space-y-2 pl-5 text-detail">
      <li>The photo is uploaded and the meal appears in your feed at once, marked as being analysed.</li>
      <li>SAM 3.1 outlines each food in the photo.</li>
      <li>Muse Spark 1.3 names each food and estimates its portion.</li>
      <li>USDA FoodData Central supplies the nutrition for each named food. When no exact record exists, the closest generic USDA record is used and named, and when none is close, Muse Spark estimates typical nutrition and the meal says so.</li>
      <li>The meal shows every food, its portion and the nutrition consumed. Tap a food to correct it, or write or say a correction such as “I ate half the rice”; the earlier version is kept.</li>
      <li>A photo of the leftovers, marked as not eaten, takes the uneaten part out of the record.</li>
     </ol>
     <h2 className="mt-6 text-sheet-title">Models in use</h2>
     <ul className="mt-2 space-y-3 text-detail">{MODELS.map(model=><li key={model.id}><span className="font-semibold">{model.name}</span> <span className="text-muted">({model.id})</span><br/>{model.job}</li>)}</ul>
     <p className="mt-3 text-detail text-muted">Every model call is recorded with the model that answered. USDA FoodData Central and Open Food Facts are databases, not models.</p>
     <h2 className="mt-6 text-sheet-title">Your data</h2>
     <p className="mt-2 text-detail">Your meals, photos, comments and drinks are visible to your account only. Nobody else’s meals appear anywhere in the app.</p>
     <div className="mt-6 flex flex-col gap-2"><Link href="/profile" className="flex min-h-tap items-center text-body font-semibold">Your meals ›</Link><Link href="/" className="flex min-h-tap items-center text-body font-semibold">Photograph a meal ›</Link></div>
    </main>;
   }
   ```
   The text is final: no test scans page text and `checkWording` guards model summaries only (F13); "sets no targets" is the README's own sentence.
2. `src/app/(tabs)/profile/page.tsx`: replace `      <Link href="/profile/deleted" className="flex min-h-tap items-center px-screen-x text-detail desktop:px-0">Recently deleted</Link>` with `      <Link href="/profile/about" className="flex min-h-tap items-center px-screen-x text-detail desktop:px-0">How My Food AI works</Link>\n      <Link href="/profile/deleted" className="flex min-h-tap items-center px-screen-x text-detail desktop:px-0">Recently deleted</Link>`.
3. `README.md`: directly after the paragraph beginning `**Demo.** A photo becomes an outlined, calculated meal;` add a blank line and `**In the app.** Profile › How My Food AI works lists the models and the steps; a judge's account sees its own meals only.`
4. Access test (sign-in and access rule), `tests/db/rls.test.mjs`: append
   ```js
   test('second user cannot read another user’s profile, drinks, saved meals or photo objects', async () => {
     const first = await user(1), second = await user(2), db = admin();
     let post, intake, saved;
     try {
       post = checked(await db.from('posts').insert({user_id:first.user.id,caption:'Access test 2'}).select('id').single());
       intake = checked(await db.from('intake_logs').insert({user_id:first.user.id,kind:'water',amount:250}).select('id').single());
       saved = checked(await db.from('saved_meals').insert({user_id:first.user.id,name:'Access test',items:[]}).select('id').single());
       assert.equal(checked(await first.client.from('profiles').select('handle').eq('id',first.user.id)).length, 1, 'owner reads own profile');
       assert.deepEqual(checked(await second.client.from('profiles').select('handle').eq('id',first.user.id)), [], 'profiles');
       assert.equal(checked(await first.client.from('intake_logs').select('id').eq('id',intake.id)).length, 1);
       assert.deepEqual(checked(await second.client.from('intake_logs').select('id').eq('id',intake.id)), [], 'intake_logs');
       assert.equal(checked(await first.client.from('saved_meals').select('id').eq('id',saved.id)).length, 1);
       assert.deepEqual(checked(await second.client.from('saved_meals').select('id').eq('id',saved.id)), [], 'saved_meals');
       const signed = await second.client.storage.from('media').createSignedUrl(`${first.user.id}/${post.id}/0.jpg`, 60);
       assert.ok(signed.error || !signed.data?.signedUrl, 'another owner’s folder cannot be signed');
     } finally {
       if (saved) checked(await db.from('saved_meals').delete().eq('id',saved.id));
       if (intake) checked(await db.from('intake_logs').delete().eq('id',intake.id));
       if (post) checked(await db.from('posts').delete().eq('id',post.id));
       await first.client.auth.signOut({scope:'local'}); await second.client.auth.signOut({scope:'local'});
     }
   });
   ```
   (P2 for the second user on the disposable stack.)
5. Production check (two accounts), with the account-2 cookie from `scripts/lib/session.mjs` and plain `fetch`: `GET /posts/<a post id of test account 1, read-only from the database>` answers a non-200 or a redirect; `GET /api/media/feed/<account-1 id>/<post>/<media>/v1.webp` answers 404; `GET /api/days?date=<a day of account 1's posts>` returns only account 2's posts; `GET /profile/about` answers 200 for account 2. Record in the report.

**Blast radius.** One new page, one Profile link, one README line, one test. Nothing else. **Done:** the page renders for a fresh account with no posts; the test passes; the production check is recorded; a judge's look is yours.

## G. Fallback after one search, the label once, and the reason for "unavailable" (#572, #573, #575; migration 0053)

### G.1 The bare name is searched when the first decision names no base food (#572)
1. `src/lib/fdc/match.ts`, in `matchFood`: replace `if(food)return {food,reason:decision.reason,searches:attempt+1,baseFood:baseQuery};` with `if(food)return {food,reason:decision.reason,searches:attempt+1,baseFood:baseQuery??query};` and replace `if(attempt===2||!next)return {food:null,reason:decision.reason,searches:attempt+1,baseFood:baseQuery};` with `// With no base food named, the cleaned item name itself is the bare food for the closest-record step (issue #572).\n    if(attempt===2||!next)return {food:null,reason:decision.reason,searches:attempt+1,baseFood:baseQuery??query};`. `resolveFoodMatchDetailed` (G.3) then runs `closestGenericFood` with it.
2. `tests/fdc-reference-search.test.mjs`: append `test('a first decision that names no base food still yields the bare name for the closest-record step', async()=>{const queries=[];const result=await matchFood('Pickled ginger','Load test 18',{search:async query=>{queries.push(query);return []},choose:async()=>({id:null,query:null,query_food:null,reason:'All candidates are Branded'})});assert.deepEqual(queries,['Pickled ginger']);assert.equal(result.food,null);assert.equal(result.searches,1);assert.equal(result.baseFood,'Pickled ginger');});`.

### G.2 The approximation label is stored once per food (#573)
1. `src/lib/fdc/nutrients.ts`: replace
   ```ts
     const micronutrients = food.foodNutrients.map((nutrient) => ({
       ...nutrient, value: factor === null ? null : nutrient.value * factor,
       basis: "portion" as const,
       ...(food.approximation?{approximation:{...food.approximation,sourceRef,...(food.approximation.kind==="estimate"?{per100:nutrient.value}:{})}}:{}),
     }));
   ```
   with
   ```ts
     // The provenance label is written once, on the first entry (issue #573). An
     // estimate keeps its per-100 g value on every entry: that is data, not a label.
     const micronutrients = food.foodNutrients.map((nutrient, index) => ({
       ...nutrient, value: factor === null ? null : nutrient.value * factor,
       basis: "portion" as const,
       ...(food.approximation && index === 0 ? {approximation:{...food.approximation,sourceRef}} : {}),
       ...(food.approximation?.kind === "estimate" ? {per100: nutrient.value} : {}),
     }));
   ```
2. `src/lib/fdc/approximation-metadata.ts`, in `storedEstimateFood`: replace `  const tag=entry.approximation,value=tag?.per100;\n  if(tag?.kind!=='estimate'||tag.sourceRef!==row.source_ref||tag.basis!==approximation.basis||typeof value!=='number'||!Number.isFinite(value)||value<0)return[];` with `  // New rows keep per100 on the entry; rows written before migration 0053 keep it inside the first-entry tag.\n  const value=typeof entry.per100==='number'?entry.per100:entry.approximation?.per100;\n  if(typeof value!=='number'||!Number.isFinite(value)||value<0)return[];`. `foodApproximation` is unchanged (it already takes the first tagged entry).
3. Migration `supabase/migrations/0053_approximation_once.sql`:
   ```sql
   -- #573: keep the closest-record / estimate label once per food, on the first nutrient entry.
   -- Estimate per-100 g values move from the tag to each entry's own per100 key.
   update public.item_nutrition n set micronutrients=(
     select jsonb_agg(
       case
         when e ? 'approximation' and ord=1 then (e - 'approximation')
           || jsonb_build_object('approximation',(e->'approximation') - 'per100')
           || (case when (e->'approximation') ? 'per100' then jsonb_build_object('per100',e->'approximation'->'per100') else '{}'::jsonb end)
         when e ? 'approximation' then (e - 'approximation')
           || (case when (e->'approximation') ? 'per100' then jsonb_build_object('per100',e->'approximation'->'per100') else '{}'::jsonb end)
         else e end order by ord)
     from jsonb_array_elements(n.micronutrients) with ordinality as t(e,ord))
   where n.micronutrients @> '[{"approximation":{}}]'::jsonb;
   ```
   Rollback `supabase/rollbacks/0053_approximation_once.down.sql`:
   ```sql
   -- Re-tags every entry from the first entry's label; per100 returns into the tag.
   update public.item_nutrition n set micronutrients=(
     select jsonb_agg((e - 'per100') || jsonb_build_object('approximation', l.tag || (case when e ? 'per100' then jsonb_build_object('per100',e->'per100') else '{}'::jsonb end)) order by ord)
     from jsonb_array_elements(n.micronutrients) with ordinality as t(e,ord),
     lateral (select (select x->'approximation' from jsonb_array_elements(n.micronutrients) x where x ? 'approximation' limit 1) as tag) l)
   where n.micronutrients @> '[{"approximation":{}}]'::jsonb;
   ```
4. `tests/db/approximation-once.test.mjs` (migration test; pattern of `tests/db/approximation-summary.test.mjs`): in a rolled-back transaction insert a user, post, item and an `item_nutrition` row whose `micronutrients` holds three entries, each tagged `{"kind":"estimate","basis":"b","sourceRef":"estimate:b","per100":<10,20,30>}` with `source_ref 'estimate:b'`; run the migration; assert exactly one entry has `approximation`, it has no `per100`, and `per100` is 10/20/30 on the entries; run the rollback; assert all three carry the tag with `per100` again. A second row with `closest` tags on two entries ends with one tag and no `per100`.
5. `tests/food-estimate.test.mjs`: in the "model estimate scales…" case add `assert.equal(n.micronutrients.filter(e=>e.approximation).length,1);assert.ok(n.micronutrients.every(e=>typeof e.per100==='number'));` after `assert.match(n.sourceRef,/^estimate:/);`.
6. Apply 0053 to the disposable stack (`npm run test:db`), then to production after the lane's review and before its merge; read back `select count(*) from item_nutrition n where (select count(*) from jsonb_array_elements(n.micronutrients) e where e ? 'approximation')>1` = 0 and the four rows' first entries still carry `kind`, `basis`, `sourceRef`. Record both in the report.

### G.3 A meal says which food is unavailable and why (#575)
1. Create `src/lib/fdc/unavailable.ts`:
   ```ts
   // Why a food has no nutrition, kept on the item's source_ref as
   // "unavailable:<code>:<detail>" so every copy and reader carries it, and
   // turned into plain words for the meal page and its first comment.
   export type UnavailableCode = 'not_food' | 'no_match' | 'no_estimate';
   export interface UnavailableReason { code: UnavailableCode; detail: string }
   export const UNAVAILABLE_PREFIX = 'unavailable:';
   export function unavailableRef(reason: UnavailableReason): string {
     return `${UNAVAILABLE_PREFIX}${reason.code}:${reason.detail.replace(/\s+/g, ' ').trim().slice(0, 200)}`;
   }
   export function parseUnavailable(sourceRef: unknown): UnavailableReason | null {
     if (typeof sourceRef !== 'string' || !sourceRef.startsWith(UNAVAILABLE_PREFIX)) return null;
     const rest = sourceRef.slice(UNAVAILABLE_PREFIX.length);
     const colon = rest.indexOf(':');
     const code = (colon < 0 ? rest : rest.slice(0, colon)) as UnavailableCode;
     if (!['not_food', 'no_match', 'no_estimate'].includes(code)) return null;
     return { code, detail: colon < 0 ? '' : rest.slice(colon + 1) };
   }
   // The sentence a reader sees. The model's own words follow in quotes when asked for.
   export function unavailableSentence(name: string, sourceRef: unknown, withDetail = true): string | null {
     const reason = parseUnavailable(sourceRef);
     if (!reason) return null;
     const lead = reason.code === 'not_food' ? `The model did not treat “${name}” as a food, so no nutrition was estimated.`
       : reason.code === 'no_estimate' ? `No USDA record matched “${name}” and the model gave no usable estimate.`
       : `No USDA record matched “${name}”.`;
     return withDetail && reason.detail ? `${lead} The matcher said: “${reason.detail}”` : lead;
   }
   ```
2. `src/lib/fdc/approximate.ts`: replace `export async function closestGenericFood(admin: SupabaseClient, name: string, caption: string, baseFood: string, signal?: AbortSignal): Promise<FdcFood | null> {` with `export async function closestGenericFood(admin: SupabaseClient, name: string, caption: string, baseFood: string, signal?: AbortSignal): Promise<{food: FdcFood | null; reason: string}> {` and replace `  return result.food;` with `  return result;`.
3. `src/lib/fdc/estimate.ts`: replace `    if (!parsed.food || parsed.calories === null || !parsed.basis.trim()) return null;` with `    if (!parsed.food) return null;\n    // A food answer without usable numbers is a provider failure the caller can name, not a non-food.\n    if (parsed.calories === null || !parsed.basis.trim()) throw Object.assign(new MetaApiError(502, "Nutrition estimate had no usable numbers."), {noEstimate: true});`. `tests/food-estimate.test.mjs`: append `test('a food answer without numbers is a 502 marked noEstimate',async()=>withPayload({...valid,calories:null},async()=>{await assert.rejects(()=>estimateFood('kerupuk',''),error=>error.status===502&&error.noEstimate===true);}));`.
4. `src/lib/fdc/match.ts`:
   - After the line `import { estimateFood } from "./estimate";` add `import { type UnavailableReason } from "./unavailable";`.
   - Replace the whole `resolveFoodMatch` function (from `export async function resolveFoodMatch(` through its closing `}` and the blank line after it) with:
     ```ts
     // The food, or why there is none: the reason travels with the item (issue #575).
     export async function resolveFoodMatchDetailed(admin:SupabaseClient,name:string,caption="",signal:AbortSignal=nutritionResolutionBudget(),options:{approximate?:boolean}={}):Promise<{food:FdcFood|null;unavailable:UnavailableReason|null}>{
       try {
         const result=await recordCall("fdc",{event:"food_resolution",name,matcherVersion:FOOD_MATCH_VERSION},()=>matchFood(name,caption,{search:query=>searchFoods(admin,query,signal),choose:(item,context,foods,retry,query,remaining)=>choose(item,context,foods,retry,signal,query,remaining)},signal),r=>({text:{source:r.food?"selected":"unavailable",reason:r.reason,searches:r.searches},fdcId:r.food?.fdcId??null}));
         if(result.food)return {food:result.food,unavailable:null};
         if(!options.approximate)return {food:null,unavailable:{code:'no_match',detail:result.reason}};
         const closest=result.baseFood?await closestGenericFood(admin,name,caption,result.baseFood,signal):{food:null,reason:result.reason};
         if(closest.food)return {food:closest.food,unavailable:null};
         let estimate:FdcFood|null=null;
         try{estimate=await estimateFood(name,caption,signal);}
         catch(error){if(!(error as {noEstimate?:boolean})?.noEstimate)throw error;return {food:null,unavailable:{code:'no_estimate',detail:closest.reason}};}
         if(estimate)return {food:estimate,unavailable:null};
         // estimateFood returns null only for a non-food; the closest step's reason is the last word on the match.
         return {food:null,unavailable:{code:'not_food',detail:closest.reason}};
       } catch(error) {
         if(signal.aborted)throw new MetaApiError(503,"Food resolution budget was exhausted.");
         throw error;
       }
     }
     export async function resolveFoodMatch(admin:SupabaseClient,name:string,caption="",signal:AbortSignal=nutritionResolutionBudget(),options:{approximate?:boolean}={}):Promise<FdcFood|null>{
       return (await resolveFoodMatchDetailed(admin,name,caption,signal,options)).food;
     }

     ```
5. `src/lib/fdc/nutrients.ts`: replace `export function scaleNutrition(\n  food: FdcFood | null,\n  portionGrams: number | null\n): ScaledNutrition {\n  if (!food) {` with `export function scaleNutrition(\n  food: FdcFood | null,\n  portionGrams: number | null,\n  unavailable: UnavailableReason | null = null\n): ScaledNutrition {\n  if (!food) {`; replace `      sourceRef: null,` with `      // The reason rides on source_ref so copies and readers keep it (issue #575); readers treat any non-numeric ref as "no USDA id".\n      sourceRef: unavailable ? unavailableRef(unavailable) : null,`; add `import { unavailableRef, type UnavailableReason } from "./unavailable";` as the file's last import line.
6. Callers (each file's import of `resolveFoodMatch` from `@/lib/fdc/match` becomes `resolveFoodMatchDetailed`; `npx tsc --noEmit` must report no unused import):
   - `src/lib/pipeline/persist.ts`: replace `const food=copied?null:await resolveFoodMatch(admin,row.name,context.caption??"",signal,{approximate:true});\n    const scaled = scaleNutrition(food, row.portionGrams);` with `const match=copied?{food:null,unavailable:null}:await resolveFoodMatchDetailed(admin,row.name,context.caption??"",signal,{approximate:true});\n    const scaled = scaleNutrition(match.food, row.portionGrams, match.unavailable);`.
   - `src/lib/worker/jobs/correct.ts`: replace `   const food=await resolveFoodMatch(admin,item.name,context.caption??'',signal,{approximate:true});\n   const n=scaleNutrition(food,item.portion_grams);` with `   const match=await resolveFoodMatchDetailed(admin,item.name,context.caption??'',signal,{approximate:true});\n   const n=scaleNutrition(match.food,item.portion_grams,match.unavailable);`.
   - `src/lib/worker/jobs/recompute.ts`: replace `      const food = await resolveFoodMatch(admin,item.name,context.caption??"",signal,{approximate:true});\n      const n = scaleNutrition(food, item.portion_grams == null ? null : toNumber(item.portion_grams));` with `      const match = await resolveFoodMatchDetailed(admin,item.name,context.caption??"",signal,{approximate:true});\n      const n = scaleNutrition(match.food, item.portion_grams == null ? null : toNumber(item.portion_grams), match.unavailable);`.
   - `src/lib/intake/identify-drinks.ts` keeps `resolveFoodMatch` (drinks stay as they are).
7. The first comment, `src/lib/pipeline/wording.ts`: add `import { unavailableSentence } from "@/lib/fdc/unavailable";` as the file's last import line; replace `export function plainConsumed(totals: ConsumedTotals, approximations: {name:string;basis:string;kind?:'closest'|'estimate'}[] = []): string {` with `export function plainConsumed(totals: ConsumedTotals, approximations: {name:string;basis:string;kind?:'closest'|'estimate'}[] = [], unavailable: {name:string;sourceRef:unknown}[] = []): string {`; replace `${missing.length?` Nutrition unavailable: ${missing.join(", ")}.`:""}` with `${missing.length?` Nutrition unavailable: ${missing.join(", ")}.`:""}${unavailable.map(u=>unavailableSentence(u.name,u.sourceRef,false)).filter(Boolean).map(s=>` ${s}`).join("")}` (fixed sentences only; the model's words stay off the comment so `checkWording` sees no model text); replace `export async function safeSummary(_text: string, totals: ConsumedTotals, approximations: {name:string;basis:string;kind?:'closest'|'estimate'}[] = []): Promise<string> {\n  return plainConsumed(totals, approximations);` with `export async function safeSummary(_text: string, totals: ConsumedTotals, approximations: {name:string;basis:string;kind?:'closest'|'estimate'}[] = [], unavailable: {name:string;sourceRef:unknown}[] = []): Promise<string> {\n  return plainConsumed(totals, approximations, unavailable);`. The three call sites (F5):
   - `persist.ts`: replace `const summary = await safeSummary(named.summary, totals, approximations);` with `const summary = await safeSummary(named.summary, totals, approximations, items.map(item=>({name:item.name,sourceRef:item.nutrition.source_ref})));`.
   - `correct.ts`: replace `const reply=await safeSummary(correctionReply(items,rows,totals),totals,approximations);` with `const reply=await safeSummary(correctionReply(items,rows,totals),totals,approximations,rows.map(row=>({name:row.name,sourceRef:row.nutrition.source_ref})));`.
   - `recompute.ts`: replace `const body=await safeSummary('',sumNutrition(current),labels);` with `const body=await safeSummary('',sumNutrition(current),labels,current.map(item=>({name:item.name,sourceRef:item.source_ref})));`.
8. The meal page, `src/components/NutritionTable.tsx`: add `import { unavailableSentence } from "@/lib/fdc/unavailable";` after the `nutritionTableRows` import line; replace `    {unavailableFoods(totals,NUTRIENT_KEYS).length ? <p className="text-meta text-muted">Known nutrition shown. Nutrition unavailable: {unavailableFoods(totals,NUTRIENT_KEYS).join(", ")}</p> : null}` with `    {unavailableFoods(totals,NUTRIENT_KEYS).length ? <p className="text-meta text-muted">Known nutrition shown. Nutrition unavailable: {unavailableFoods(totals,NUTRIENT_KEYS).join(", ")}</p> : null}\n    {items.map(item=>{const why=unavailableSentence(item.name,item.source_ref);return why?<p key={item.id} className="text-meta text-muted">{why}</p>:null;})}` (`CurrentItem` carries `id`, `name` and `source_ref`, F5).
9. Test (data rule), `tests/unavailable-reason.test.mjs`: `scaleNutrition(null,50,{code:'not_food',detail:'A ceramic plate.'}).sourceRef==='unavailable:not_food:A ceramic plate.'`; `parseUnavailable(thatRef)` deep-equals `{code:'not_food',detail:'A ceramic plate.'}`; `parseUnavailable('2708357')`, `parseUnavailable('estimate:x')` and `parseUnavailable('unavailable:bogus:x')` are null; `unavailableRef({code:'no_match',detail:'  a   b  '+'x'.repeat(300)})` has the detail collapsed to one space and cut to 200 characters. No sentence text is asserted.
10. Production and stack checks after merge, both always run and both recorded: (a) disposable stack with real Meta and empty USDA transport, the Fleet 14 pattern (`docs/evidence/run14/estimate-reanalysis.json`): re-analyse a post whose item is the `scripts/fixtures/food-matching.json` entry marked `unavailable:true` (the ceramic plate) and read back its `item_nutrition.source_ref` (expected to start with `unavailable:not_food:`) and its first model comment (expected to contain "did not treat “ceramic plate” as a food"); (b) on production as test account 2, post a caption-only meal "a ceramic plate, nothing on it" (text entry; caption-only posts are analysed into items, F5), wait until the post is `ready` or `needs_input`, record its status, each current item's `name` and `source_ref` (read-only), the nutrition-table text and the first comment's text as they stand, then delete the post and verify absent. The report prints both results as observed; #575 closes on (a) and (b)'s recorded sentence when (b) produced an unavailable item, and on (a) alone otherwise, with (b)'s outcome stated.

**Blast radius.** Every analysed, corrected or recomputed food: a food with no base food named now goes through the closest-record step (one more USDA search and one model call for those ~10% cases); new tagged rows are smaller; an unavailable food carries a reason in `source_ref` (copies keep it; every reader already treats a non-numeric ref as "no USDA id"); the meal's first comment and the nutrition table gain a sentence. Old unavailable rows (94 in 14 days) keep `source_ref null` and show no reason until re-analysed. A model estimate answer with no numbers now surfaces as `no_estimate` instead of a silent "unavailable". **Done:** all new tests and `npm test`; 0053 applied and read back; the two checks recorded; #572 and #573 close; #575 closes as stated in G.3.10.

## H. An incomplete saved label cannot hide a provider outage (#557)

1. `src/lib/fdc/barcode-product.ts`: replace `export type ResolvedProduct = BarcodeProduct & { source: "database" | "own" | "shared"; originalName?: string };` with
   ```ts
   export type ResolvedProduct = BarcodeProduct & { source: "database" | "own" | "shared"; originalName?: string };

   // A label correction stands in for a provider only when it can make a card on its own (the same fields mergeProduct needs).
   export function completeLabelCorrection(own: BarcodeCorrection | null | undefined): boolean {
     return Boolean(own && own.source === "label" && own.per_100 && own.name && own.serving_unit);
   }
   ```
2. `src/lib/fdc/barcode-resolver.ts`: in the import line that names `mergeProduct` from `./barcode-product`, add `completeLabelCorrection` to the imported names; replace both occurrences of `if (!(own?.source === "label" && own.per_100)) throw error;` with `if (!completeLabelCorrection(own)) throw error;`.
3. Tests, `tests/barcode-corrections.test.mjs`: append `test('a label correction stands in for a provider only when complete',()=>{const full={source:'label',per_100:{calories:100},name:'X',serving_unit:'g'};assert.equal(completeLabelCorrection(full),true);assert.equal(completeLabelCorrection({...full,name:null}),false);assert.equal(completeLabelCorrection({...full,serving_unit:null}),false);assert.equal(completeLabelCorrection({...full,source:'user'}),false);assert.equal(completeLabelCorrection(null),false);});` and add `completeLabelCorrection` to that file's import from `../src/lib/fdc/barcode-product.ts`. New `tests/barcode-resolver-outage.test.mjs` (fetch-stub pattern of `tests/open-food-facts.test.mjs:24-41`; set `process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://127.0.0.1:54321'`, `process.env.SUPABASE_SECRET_KEY ||= 'offline'`, `process.env.FDC_API_KEY ||= 'offline'` before importing `resolveProduct` from `../src/lib/fdc/barcode-resolver.ts`): the stub returns `Response.json(ownRow)` for a URL whose pathname ends with `/rest/v1/barcode_corrections`, `Response.json(null)` for one ending with `/rest/v1/rpc/barcode_shared_name`, and `new Response(null,{status:500})` for every other URL (USDA and Open Food Facts); with `ownRow = {source:'label',per_100:{calories:100},name:null,serving_unit:'g'}` assert `await assert.rejects(()=>resolveProduct('7622300761363','user-1'))`; with `name:'Oreo'` assert the result's `name==='Oreo'` and `source==='own'`.

**Blast radius.** Barcode scans with a saved label correction that lacks a name or unit during a provider outage now say "temporarily unavailable" instead of "not in the database"; everything else unchanged. **Done:** tests pass; #557 closes.

## I. The New post window never scrolls at 1366×650 or 1024×700, and the camera measures 454 px / 472 px (#576, design 7e)

The backlog's done condition names the camera heights 454 px and 472 px; the designer's arithmetic reaches them with a 52 px mode strip and a 96 px shutter row (F11). This lane sets those two sizes so the done condition is met as written.

1. `src/app/globals.css` (inside `@media (min-width: 1024px)`):
   - Replace ` .desktop-capture-inner:not(.desktop-camera-inner), .desktop-camera-inner[data-round6-capture] { width:960px; max-width:960px; height:620px; border-radius:10px; overflow:hidden; }` with ` /* 7e: the window follows the screen; the camera takes what is left, never under 240 px. */\n .desktop-capture-inner:not(.desktop-camera-inner), .desktop-camera-inner[data-round6-capture] { width:min(960px,calc(100vw - 48px)); max-width:960px; height:min(620px,calc(100dvh - 48px)); border-radius:10px; overflow:hidden; }`.
   - Replace ` .desktop-camera-inner[data-round6-capture] [aria-label="Capture content"] { width:600px; height:620px; background:var(--color-camera); color:var(--color-surface); overflow-y:auto; }` with ` .desktop-camera-inner[data-round6-capture] [aria-label="Capture content"] { width:600px; height:100%; display:flex; flex-direction:column; background:var(--color-camera); color:var(--color-surface); overflow:hidden; }`.
   - Replace ` .desktop-camera-inner[data-round6-capture] [aria-label="Capture content"] > .desktop-viewfinder { margin:0; height:450px !important; border-radius:0; width:600px; }` with ` .desktop-camera-inner[data-round6-capture] [aria-label="Capture content"] > .desktop-viewfinder { margin:0; flex:1 1 auto !important; min-height:240px; height:auto !important; border-radius:0; width:600px; }`.
   - Replace ` .desktop-mode-strip { padding-top:10px; height:66px; flex-shrink:0; }` with ` .desktop-mode-strip { padding-top:8px; height:52px; flex-shrink:0; }` (the 44 px strip control sits in a 52 px row, 7e).
   - Replace both occurrences of `.desktop-shutter-row { height:104px !important; }` with `.desktop-shutter-row { height:96px !important; }` (the 64 px shutter sits in a 96 px row, 7e).
2. `src/components/CaptureSheet.tsx`: replace `"desktop:h-[450px]"} desktop:rounded-card`} style={{ height: labelState==="read"?300:tokens.capture.previewHeight, marginTop: tokens.capture.previewTop }}>` with `"desktop:h-auto desktop:min-h-[240px] desktop:flex-1 desktop:shrink"} desktop:rounded-card`} style={{ height: labelState==="read"?300:tokens.capture.previewHeight, marginTop: tokens.capture.previewTop }}>` (the CSS `!important` rules above win on desktop; phones keep the inline height).
3. `src/components/LightComposer.tsx`: replace `className="desktop-composer grid h-[620px] grid-cols-[minmax(0,600px)_360px] bg-surface text-text"` with `className="desktop-composer grid h-[min(620px,calc(100dvh-48px))] grid-cols-[minmax(0,600px)_360px] bg-surface text-text"`.
4. Page look (Firefox BiDi driver with `browsingContext.setViewport` at 1366×650 and 1024×700, the fake camera flag): `document.scrollingElement.scrollHeight <= innerHeight`; the window's `getBoundingClientRect().height` 602 / 620; the `.desktop-viewfinder` height 454 / 472 (±2 px); the shutter row's bottom edge inside the viewport; `[aria-label="Capture content"].scrollHeight <= clientHeight`; the composer after a photo at the same two sizes shows no vertical scroll. Local production build first, production after merge. Differences from 7e on the PR.

**Blast radius.** The desktop New post window and the composer that follows it; the mode strip and shutter row are 14 px and 8 px shorter on desktop; phones untouched (the rules sit under `min-width:1024px`). **Done:** the two sizes pass on production with the camera at 454/472; #576 closes.

## J. Docs (lane J; docs-only, no review)

`docs/plan-run15.md` holds this plan unchanged. `docs/run15-report.md`: items A–I done or not done; each PR with its reviewed head, receipt kind and merge commit; P1–P5 outcomes; the bytes table (A.10), the leftovers and overlap timelines (B.3, B.4) labelled unthrottled, the rings page-look list (C.5), the #574 readback (D.6), the role update receipt (E.4), the two-account check (F.5), the 0053 readback and the two unavailable checks (G), the 1366/1024 numbers (I.4); one line per thing noticed and left unfixed; **every backlog issue this run created** (or "none created"). The bytes table is also appended to `docs/media-loading.md`. Nothing is written to `BACKLOG.md` (the PM's), `run14/docs` or `run13/docs` (the Fleet 14 docs already carry the owner's bypass-secret amendment, F17). The docs PR is not merged by this plan.

## Closures and comments (after the merge and the stated check)

- Close: #574 (D.6), #576 (I.4), #557 (H tests), #572 (G.1 test and a production `model_calls` row showing `food_approximation` after a one-search `food_resolution`), #573 (0053 read back), #575 (as G.3.10 states).
- Comment with commit-pinned evidence, leave open: #579 and #372/#222 (bytes table; your phones), #570 (timing table; your phones), #571 (overlap timelines and any issue filed from them; your phone), #569 (page look; your phones), #567 (counts live; your look after the role update), #568 (page live; your judges), #578 (rank 1 built; the other 25 await your ruling, below).
- #370, #455, #456, #457: closed already; no comment needed.

## Cleanup and exit

Remove each `run15-*` worktree and local branch once its PR is pushed; delete each remote `run15/*` code branch after its merge; delete every production test post and its storage objects and verify absent; stop local servers and the disposable stack; run `scripts/cleanup.sh`; leave the Fleet 14 worktrees, `run13/docs` and the pre-existing untracked `docs/reviews/mfa-pplx-pr311-e7ece5c.md` as found; never touch the Vercel bypass secret. The run ends.

## What changed in revision 2 (the seven review findings)

1. Coder choices removed: A.7 gives the exact `DetailImage` and desktop-slide lines; C.2 relies on the `--spacing-inset` token (F10) with no fallback; D.2 names the five constructors (F2) with no compiler-driven step; D.5 names the test and the case (F2); F.1's text is final (F13: no page-text test); G.3.7 gives all three `safeSummary` call sites (F5); G.3.8 relies on `CURRENT_NUTRITION_COLUMNS` (F5); G.3.10 runs both checks always and records both; B.3 files any other failing request as an issue instead of an unnamed fix; the "re-read the file" sentence is replaced by the counted find-texts (section "Find-texts"); the `postAttachment` insertion anchor is the unique `postCopy` line.
2. The unmeasured byte and egress numbers are now premise P5, measured by A.10; the owner list repeats none of them.
3. The recording-hold paragraph and the owner-list line asking for recording notices are gone; no stop remains.
4. C.4 adds no ring-count assertion (harness only); G.3.9 asserts no sentence text (data round-trip only).
5. Every browser check names the Fleet 14 Firefox BiDi driver and is labelled unthrottled; server durations come from rows.
6. F17 records that `run14/docs` already carries the owner's amendment and the "retain permanently" cleanup line; nothing is left to strike.
7. Lane I sets the 7e mode-strip and shutter-row sizes so the camera measures 454 px and 472 px, meeting the backlog's done condition as written.

## What changed in revision 3 (the two findings left open after revision 2)

1. F17 is re-read at the current `run14/docs` head `3bb83ed8`: the revoke sentence in item 6.1 step 2 has been struck by the Fleet 14 coder's later commit and replaced with a retain statement; the three remaining "revok" lines are all retain statements, and no instruction to revoke exists on that branch. The strike the owner ordered is already committed; nothing is left for this plan to strike, and that is now shown line by line rather than asserted.
2. The A.4 code comment no longer states "about 8 MB at most"; the ceiling is described as a chosen limit, not a measured size.

## What changed in revision 4 (the srcset failure path)

The first drafts claimed that on a failed sharper copy "the browser keeps the v1 copy it already has". No basis was given, and none exists: a browser does not fall back from a failed `srcset` candidate to `src`. Revision 4 does not rely on any browser behaviour. The sharper route now answers every post-ownership failure (resize error, resize timeout, source download failure, overload) with a 302 to the signed original, the fallback the v1 route already has and `tests/feed-photo.test.mjs` already asserts (A.5, with three new test cases in A.9). As a second layer each client image drops its `srcset` after one `error` event (A.7). A.12 observes both layers on the local build at device pixel ratio 3 and records what Firefox does; the plan rests on the server layer either way. P4's consequence is restated: a slow decode costs bytes, not a blank photo.

---

## For the owner (read from the bottom)

**Functionality this plan removes**
- Saving a meal (bookmark) while it is still being analysed: the control is faded and inert until the meal is ready, because the database refuses the save before that anyway (that refusal is the toast in your 14:19 screenshot, as far as the code shows).
- The leftovers sheet no longer waits for the upload: it closes as soon as the photo is kept on the phone, and the photo attaches in the background with "Adding leftovers photo…" in the upload chip; a failure shows there with Try again.

**Behaviour this plan changes (the default the plan takes)**
- The camera asks phones for 1920×1440. Uploads and the feed's sharper copies are larger than today by an amount A.10 measures (P5); old photos stay as they are. Storage egress rises by the measured ratio; #375 is not touched here.
- Day rings: 30 days at rest, scrolling, five whole and a sixth peeking (7c); grey rings cannot be tapped; Home tapped on Home snaps the row back to Today and the feed to the top.
- Days: the calendar and the day panel both count ready meals; meals still being analysed or waiting for your reply are counted separately as "N not finished" in both places.
- Your meal account becomes admin (one production row). /admin shows app-wide counts above the queue.
- A food with no USDA match now says why on the meal page (with the matcher's own words) and in the meal's first comment (plain sentence only). Older unavailable items show nothing until re-analysed.
- The approximation label is written once per food; four old rows are rewritten by migration 0053.
- The desktop New post window shrinks with the screen; its mode strip and shutter row take the 7e sizes (52 px and 96 px) so the camera is 454 px at 1366×650 and 472 px at 1024×700, as the backlog says.

**Places where the design and the product's function disagree**
- 7c says the sixth ring "peeks"; on the server I read six days of totals so the peeking ring has its number at rest. Older rings get numbers only after you first move the row (one month-summary read then, not on every Home open). Default: taken.
- 7e says the mode strip and shutter row "keep their sizes" and also gives 52 px and 96 px; the built sizes were 66 px and 104 px (Round 6). The backlog's done condition (454/472) only holds with 52/96. Default: 52/96, so the done condition is met; the strip and row are 14 px and 8 px shorter on desktop.
- The v2 photo route duplicates most of the v1 route file instead of sharing a helper, so the v1 route and its access tests stay byte-identical. Default: duplication accepted; finding 4 (one photo under several identities) is yours to rule on.
- #574 could have been solved by showing the mismatch's cause instead; I made both numbers count the same thing. Default: same count, separate "not finished".

**The 26 findings: my recommendation, for your ruling (the PM files what you accept)**

| # | Recommendation | Why |
|--:|---|---|
| 1 | Built here (lane B) | #570 |
| 2 | Accept | Seven refreshes per completion is the biggest remaining phone cost; large but real |
| 3 | Accept | A trace failure must never fail the detail; medium |
| 4 | Accept, after #579 settles | Lane A adds two more identities on purpose; collapse the signed-JPEG and original paths later |
| 5 | Accept | Nutrition read twice on hydration; large, pure waste |
| 6 | Accept | Cards refreshing on mount after a server seed; medium, visible flicker |
| 7 | Accept | Three reads for one photo; medium |
| 8 | Accept, after #579 | Cache the sharper copies in Storage once made instead of re-running Sharp cold |
| 9 | Accept | Publication tied to optional card rendering; large but it is the "camera stays open" family |
| 10 | Defer | Copy repair only; rare path |
| 11 | Accept | The 24.9 s queue wait behind #570's slow result; large |
| 12 | Accept | Drinks detected twice per meal; large |
| 13 | Defer | Barcode/search preview vs publish; medium, rare |
| 14 | Accept | Photo reloaded in prior matching; small |
| 15 | Defer | Multi-photo serial segmentation; medium, uncommon |
| 16 | Accept | Serial drink nutrition; small |
| 17 | Accept | FDC cache misses not deduplicated; medium |
| 18 | Defer | Model selection repeat on cached candidates; needs measurement first |
| 19 | Accept | Tracing awaits an insert on every return path with a 3 s timeout; medium, on the hot path |
| 20 | Accept | Whole-record IndexedDB rewrites; medium |
| 21 | Accept | Stage and post sign the same upload twice; medium |
| 22 | Defer | Days refresh owners; large, Days is not on the critical path |
| 23 | Defer | Profile/Saved full-collection assembly; medium |
| 24 | Accept | A 6 s second search on a literal miss; small |
| 25 | Accept | Repeated queue wakeups and counts; small |
| 26 | Accept | Profile handle read three times; small |

**Yours, outside this plan**
- Rule on the 26 (table above); the PM files each accepted one with a blast radius.
- After lane A deploys: post from each of the three phones; the coder reads the stored sizes (A.11). Your look at the feed and detail, and the 2 s first photo over mobile data, stay with you (#379).
- Open /admin from your meal account after the role update (E.4).
- Have a judge, or you as a fresh account, open Profile › How My Food AI works.