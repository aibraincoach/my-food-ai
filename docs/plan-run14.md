# Fleet 14 plan: every pasted item, built or accounted for

> Owner closeout, November4: stop waiting for collection and package now with **three of seven**. Item6.2’s hourly loop is cancelled. Nothing in this plan authorizes a long run; AGENTS.md requires both written confirmations, and the planner contract’s “Nothing without a use” applies.

> Owner amendment — November 4, 2026, 16:14–16:15 WIB: the protection-bypass secret is permanent reviewer/coder access. Retain it; it is never revoked or removed. This explicit owner ruling supersedes the original secret-removal instructions, including cleanup and the defaults below.

Written 2026-11-04 against `origin/main` `299f13a49af5320cb81d4cdf4e9de14263214a96` (Fleet 13 code #546/#547/#548/#549/#556 merged, docs #545 merged; migrations 0050 and 0051 applied), following `docs/planner-contract.md`. The Nov 4 reconciliation records production READY at that main (`dpl_2CxQa5FWdy2GPTuZ2cqTZxcVm9nD`); `/api/health` answered 200 this session. The owner pasted 37 backlog items in three blocks, supplied the Round 7 design (`My_Food_AI_app_design_4.zip`: frames `#7`, `#7a`, `#7b`, two audit PNGs), and ruled during planning that **a blank nutrition value is worse than a bad estimate**. This plan builds everything in the paste that is not already built, adds the model-made estimate that ruling requires, measures everything the paste asks to measure, and accounts for every item in section 0.

**Stops: zero. No legal halts. No waiting.** One prompt to the end. Where a find-text does not occur exactly once, the coder re-reads the current file and applies the same change to the current text; it never stops. No item asks the owner anything.

**How the fleet runs.** All eight lanes start at the same time, one coder subagent per lane in its own worktree cut from the current `origin/main`; nothing stacks. Reviews run beside each build and never block it. Measurements (lane F) run against production as soon as the measuring scripts exist, and again after the merges where the item says so. Merges come last, in ascending PR number (owner's rule), each at the exact head that holds a counting review with green checks. Migration 0052 is applied to production after its review passes and before its PR merges, then read back (the same order Fleets 12 and 13 used). A defect found after a merge goes on the backlog; the merge is not reverted. The owner's recording hold (no merge or migration between a recording-start notice and submission) is a standing rule the coder reads, not a stop in this plan: none has been received.

**Production sign-in is authorized for measurement.** Fleet 12 skipped every production measurement because it treated sign-in as forbidden. For this run the coder signs in to production as designated test account 2 through `scripts/lib/session.mjs` (password sign-in, the path `scripts/feed-probe.mjs` and `scripts/browser-session.mjs` use), creates the test posts the measurements name, and deletes every one of them with their storage objects before the report. Never the owner's account, never the demo account.

## 0. The whole pasted list, item by item

Why this is being done a third time, from the records: Fleet 12 (`docs/plan-run12.md`) built code for 22 items; its report (`docs/run12-report.md`) marks the measurement items 27–30 "not done" (no production session, no Chrome tools, a timed-out Vercel log read) and calls most PRs "open" although all of them merged after the report. Fleet 13 (`docs/plan-run13.md`) built five new defects and mapped every pasted item to "Fleet 12 item n", which built and measured nothing further. So the code mostly exists; what was never done is the measuring, the production checks, the Round 7 design work (filed Nov 4, after both fleets) and the estimate the owner has now ruled on. This plan does those.

| Item | What the paste asks | Built so far (all merged) | Still missing | This plan |
|---|---|---|---|---|
| #471 recording cap | No cap message in a recording-length session, or the cap raised | #477 isolated drink checks from the post cap; #540 counts drink checks only when the model runs. Caps are hard-coded in SQL (`0046`: post 40/h, drink_identify 120/h, label 30/h, correct 100/h per account) | Proof on production that a session of several photos stays under the cap | Item 6.3 runs 12 photo posts on production and records per-route counts and headroom. The cap is not raised: at 40 posts per hour it is above any recording, and raising it needs a migration the measurement does not justify |
| #512 phone calendar | Summary names the month nearest the top; no jump when an older month loads | #539. Fleet 12 measured the older-month anchor delta at 0 | The sticky summary shows "N days posted", not a month name (Fleet 12 item 17 said so and stopped) | Item 1.3 adds the month name; item 6.7 checks the October/November boundary at 390×844 |
| #294 wording | Terms reviewed, owner rules, wording changed everywhere | `docs/run10-terms.md` inventory; owner ruled Nov 4; #538 applied "Leftovers" and the question label | A check that no old string remains in the UI | Item 6.9 greps main and lists remaining occurrences; closes if none in UI strings |
| #322 tick cold | Cold start timed on production before and after; a phone post completes | #334 lazy loading; #536 `x-tick-cold` header. No value ever read | The timing | Item 6.1: before (eager preview deployment behind a bypass secret) and after (production, first call after each deploy) |
| #323 sign-in twice | One sign-in call per page open across server and browser | Middleware verifies once and sets a header; pages use it; browser shares one `/auth/v1/user` per document; forged header refused | Browser still makes one Auth call per document, one per feed photo request, one per `FirstRunHint` server action, one per `/api/feed` read. Never counted per navigation | Item 5 cuts all four; item 6.6 counts per navigation |
| #494 detail 14 s | Detail within 2 s on the owner's phone; report where the seconds go | #541 skeleton, feed-webp preview, one media read, 8 s deadlines. Fleet 12 local: skeleton 369 ms, usable 1,302 ms | Nothing shows in the same paint as the tap; production timing by phase never recorded | Item 3 (7b first frame); item 6.5 records the phases on production at 390×844, CPU 4×, Fast 3G |
| #373 database reads | Log-ingestion bytes attributed; Micro RAM explained | Run 8 cut feed reads 89.7% | Both measurements | Item 6.2 (memory and pool metrics from the Management API, checked this session; log-ingestion bytes have no API, dashboard only) |
| #375 storage egress | Egress by file kind and client; log bytes; largest real-user source cut or shown small | `docs/egress.md` by user agent only | The breakdown | Item 6.2 |
| #324 day totals twice | Today's totals queried once across server and browser | Run 8 shared server read; #528 reuses the server page. Desktop `DesktopToday` still fetches `/api/days` on every open | The desktop fetch; the per-navigation count | Item 5.3 derives Today from the page already read; item 6.6 counts |
| #370 camera stays open | Sheet closes within 1 s; post at top in processing state; failed upload shown | #505 closes at the tap; #487/#534 local card with failure reasons | Posted flag not acknowledged before close (#543); the owner's phone timing | Item 4.2; owner's phone (#379) |
| #222 feed slow | Feed and first photo within 2 s on the owner's phone | Run 8 cold-open fixes; #502/#503/#506/#528/#529 | The owner's phone | Owner only; items 5 and 6 reduce what the open does |
| #348 / #351 drink card and tiles | Right card and tile order on production, on the owner's phones | #527 | A production check (Fleet 12 could not sign in) | Item 6.7; then the owner's phones |
| #520 first page twice | One first-page read per Home open; counts in docs | #528 (matching owner and zone reuse the server page; `tests/feed-cache-lifecycle.test.mjs:157`) | The count in docs; the first-ever visit (no zone cookie) still reads twice | Item 6.6 counts and records both cases |
| #368 shared rate limit | Which IP Supabase counts; a refusal from one machine does not block another | Nothing (the Run 8 hammer went straight to Supabase) | The probe through the app's form | Section 7: a self-contained prompt for an outside bot, run asynchronously, plus a cleanup script. Not a lane |
| #372 photo size | Bytes before/after in docs; first photo in 2 s on mobile data; same look | Feed route resizes to 512 px WebP q62 with `immutable` cache (`docs/media-loading.md`: 87.19% fewer bytes) | The owner's phone | Owner only (#379). Item 6.6 records the current byte count beside the old 152,193 |
| #377 old drink caffeine | Existing photographed drink posts show their caffeine | Fleet 13 read production: both "Coca-Cola, can" posts have intake rows | Visual check on the owner's account | Item 6.8 repeats the read-back; the card look is the owner's (his posts) |
| #217 smoothness audit | Table of every control with four findings; dead ones fixed or filed | #491 pointer feedback; Round 7 table predicted from code for 16 controls | The measured table; Days, Search, Profile, capture modes, drink sheet | Items 2 and 6.4 |
| #449 names before numbers | Names show while numbers are worked out, on the owner's phones | #476, #534 | Production check; owner's phones | Item 6.7; owner |
| #453 barcode prompt | Readable over any camera picture, on the owner's phones | #479 | Owner's phones | Item 6.7 confirms the prompt's own background on production; owner |
| #454 continuous calendar | Unbroken weeks, month marks, opens on today, on the owner's phones | #482, #539 | Owner's phones | Item 6.7; owner |
| #455 drink pictures | Coffee/water/cocktail/wine pictures on the swiped card | #485 (Fleet 11 session evidence) | Owner's phones | Owner only |
| #456 cocktail caffeine | No caffeine on a cocktail or wine | #481, #533 (Fleet 11 evidence on the tiki cocktail) | Owner's phones | Owner only |
| #457 alcohol shown | Alcohol grams and standard drinks; not in water; Today shows alcohol | #486, #493, #533 (Fleet 11 evidence) | Owner's phones | Owner only |
| #499 instant flag | No page exports the flag nothing reads | Fleet 12 said the premise is false | Evidence | Item 4.4: Next 16.4.3 parses `instant` (`node_modules/next/dist/build/segment-config/app/app-segment-config.js:152`). Close with that evidence; keep the exports |
| #542 Space on buttons | Buttons keep native Space; shortcut only outside controls | Nothing (found after #504) | The fix | Item 4.1 |
| #543 posted flag | Flag acknowledged before the sheet closes; slow and failed writes checked | Nothing (found after #505) | The fix | Item 4.2 |
| #544 open-model budget | Both format attempts share one 75 s deadline | Nothing (found after #507) | The fix | Item 4.3 |
| #550 desktop feed width | Centred 500 px feed with Today, checked live at 1280×800 | 6a code on main (`page.tsx:125`, `globals.css:40`) | Production shows a full-width post and no Today column; the cause | Item 1.2 (cause F2, reproduction first, fix, below-1148 rule); item 6.10 checks production at 1100/1280/1440 |
| #551 stray note | No day-level note or "*", phone and desktop | Nothing | The fix | Item 1.1 |
| #552 24 px buttons | 44 px tap areas and every state per 7a | Nothing | The fix | Item 2 |
| #553 thumbs states | Pressed at once, different when off, thumbs down opens at once | Nothing | The fix | Item 2 |
| #554 tap shows nothing | A visible change at once for photo, more, Details, Comment, Post; no jump | #541 skeleton (waits for the server) | The 7b frame | Item 3 |
| #555 unaudited screens | Days, Search, Profile, capture modes in the control table | Nothing | The rows | Item 6.4 |
| #523 (ruling) model estimate | Not in the paste's text; the owner ruled during planning that a blank value is worse than a bad estimate | #549 closest generic USDA record, labelled, with migration 0051 | A food with no close USDA record still shows "unavailable" | Item 8 (lane H): the model estimates per-100 g nutrition, labelled "model estimate", with migration 0052 |

## Facts (checked this session; the coder does not re-check facts, only the find-texts)

- **F1 (#551).** `src/components/DayHeader.tsx:28` prints `* Known nutrition shown. Nutrition unavailable: …` under every day with an unavailable food; lines 21 (desktop rule) and 26 (phone header) append `*` to the day total; `MonthGrid.tsx:46` and `PhoneCalendar.tsx:74` append `*` to calendar cells, and their disclosures at `MonthGrid.tsx:31` / `PhoneCalendar.tsx:60` start with `* `. On desktop the phone header is `desktop:hidden` but the note is not, so it floats above the first post (the owner's screenshot, `audit/prod-desktop-feed.png`, shows exactly this). Each post's summary line names unavailable food (`src/lib/posts/summary-line.ts:41`) and `DesktopToday.tsx:19` names today's. No test asserts the note.
- **F2 (#550 cause).** Main cannot produce a full-width Home: `page.tsx:125` sets `desktop:w-[500px]`, `globals.css:40` caps the workspace at `min(844px, 100vw − 304px)`, `DesktopToday` renders at `desktop:` (1024 px). Production serves main. What main *can* produce is the owner's screenshot through the service worker: `public/sw.js:263-275` races the network against a 1.5 s timer for navigations to `/` and, for a signed-in user with an active media session, serves the cached `/shell` page when the network has not answered first. `/shell` is `src/app/shell/page.tsx` → `ShellHome.tsx:31-36`: `TabsLayout` (240 px sidebar) plus a bare `<main>` with `<Feed/>`, no `DesktopWorkspace`, no 500 px column, no `DesktopToday`. The feed then fills the ~1,025 px column, matching the ~985 px post in the screenshot. The middleware calls Auth before `/` can answer (`middleware.ts:24`), so a cold function or a slow link exceeds 1.5 s. The real response is discarded and the shell stays until a reload. (A headless reproduction was attempted this session; it stalled on CDP session plumbing before loading the page, so the reproduction is the coder's first step in item 1.2.)
- **F3 (#552/#553).** `PostActions.tsx:23-27`: every control is `h-6` (24 px) with `gap-[18px]`, no padding, so the hit area is the glyph. `ThumbsFeedback.tsx:25`: thumbs are `disabled={busy||!modelCommentId||!fingerprint}`, the verdict class is a no-op (`'text-text':'text-text'`), and a disabled button is skipped by the global pressed state (`ServiceWorkerRegistration.tsx:9` skips `:disabled`), so a tap on a saving or not-yet-available thumb shows nothing. Line 22 navigates on thumbs down only after the save resolves. Bookmark (`PostActions.tsx:27`) is `disabled={bookmark.pending}`. `tokens.colors.faint` is `#B4AFA7`.
- **F4 (#554).** `src/app/posts/[id]/page.tsx` awaits `params` at the top, has no `loading.tsx`, and its Suspense fallback `PostDetailSkeleton` is a generic square plus three shimmer lines that appears only when the server's first chunk arrives. `PostDetail.tsx:16-19` awaits Auth and `getPostDetail` before any post-specific pixel. `DetailImage` (`OutlineOverlay.tsx:30-41`, now `object-contain` after #556) starts from the feed webp (`previewUrl`), a cache hit, but only once the server payload has arrived. After #556 the phone detail frame is the whole photo: `aspectRatio: width / height`, `maxHeight: 80dvh`. On desktop, `DesktopWorkspace.tsx:67` shows "Loading post…" until the new server props arrive; `profile/page.tsx:35` and `search/page.tsx:4` have no Suspense at all and import no `Suspense`. A photo tap uses `router.push` from `DoubleTap.tsx:16/18`, which the desktop workspace's anchor-only click interception (`DesktopWorkspace.tsx:50-56`) does not catch, so on desktop a photo tap leaves the modal flow. The feed holds every card's `FeedPost` (id, caption, slides with the webp URL, items, `modelCommentId`, `analysisFingerprint`, `saved_meal_id`; no `handle` field) in memory; nothing hands it to the detail.
- **F5 (#542).** `CaptureSheet.tsx:446`: the window `keydown` handler skips `input,textarea,select,[contenteditable="true"]` only, then `preventDefault()` and `takePhoto()`.
- **F6 (#543).** `upload-manager.ts:198-199`: `post(id)` sets `posted=true`, calls `void this.persist(entry)` and returns; `CaptureSheet.tsx:413` calls `uploadManager.post(id);onClose();` synchronously inside an `async` function (line 404). `persist` (127-128) returns the chained `store.put` promise. `upload-store.ts` wraps each IndexedDB request in a promise that rejects on `request.onerror`, `tx.onerror` and `tx.onabort`, so a failed write rejects. `post(` is called only from `CaptureSheet.tsx:413`; `tests/upload-guard.test.mjs` builds `new UploadManager(store, …)` with a stubbed store and already calls `manager.post(id)`.
- **F7 (#544).** `open-weights.ts:34-39`: `send(jsonObject)` calls `fetchWithRetry(…, OPEN_IDENTIFY_TIMEOUT_MS, key, 0)`; `fetchWithRetry` (`client.ts:98-102`) builds a fresh `AbortSignal.timeout` per attempt and folds `init.signal` in through `workerDeadlineSignal` (`budget.ts:14-20`), throwing when the caller signal aborts. A 400/422 format rejection at second 74 followed by a hanging `send(true)` takes ~150 s. `tests/open-identify.test.mjs` drives `identifyItems` against a local HTTP server with `IDENTIFY_OPEN_BASE_URL`.
- **F8 (#323).** Per Home open: middleware `getUser` (`middleware.ts:24`); pages read the header and fall back to `getUser` only without it; the browser's `shareVerifiedBrowserUser` (`browser-user.ts:28-46`) makes one `/auth/v1/user` per document; the feed photo route calls `db.auth.getUser()` per request including 304s (`v1.webp/route.ts:18`); `getHintState` (`hints.ts:11`) calls `getUser` once per mounted `FirstRunHint`, one per non-drink card; `/api/feed/route.ts:15` calls `getUser` inside a `Promise.race` per read. The matcher covers `/`, `/search`, `/days`, `/profile`, `/posts`, `/admin`, so server actions POSTed to those paths carry the verified header. `sessionCookieBridge` re-applies only cookies recorded through its `setAll` on later response rebuilds. `tests/feed-photo.test.mjs:15-20` compiles the real photo route and stubs `getSession()` to a session without `user` while counting `getUser` calls; `tests/verified-user.test.mjs:32` is the forged-header test.
- **F9 (#324).** `homeDayTotals` is request-cached and awaited by `HomeDays` and `HomeFeed` (`page.tsx:39-48`, 63, 109). On phone the browser reads totals only for days missing from the page and on events (Fleet 11: 0 per open). On desktop `DesktopToday.tsx:11` fetches `/api/days?date=today` on mount and on four events. `getFeed` orders posts by `eaten_at` descending then `id` descending (`feed.ts:299-300`), so once the first page holds a post eaten before today, every post eaten today is on it. `sumNutrition` (`totals.ts:63`) builds `MealTotals` from items; `emptyIntake` is at `intake.ts:32`.
- **F10 (#322).** `src/app/api/jobs/tick/route.ts:13-19` sets `x-tick-cold` to `1` on the first request of a function instance; no script reads it. A fresh deployment is a fresh instance, so the first tick call after a deployment is cold by construction. The Vercel deployments API works with `VERCEL_TOKEN` (checked). The project has Vercel Authentication on all deployments except custom domains (`GET /v9/projects/my-food-ai`: `ssoProtection.deploymentType = all_except_custom_domains`, `protectionBypass` empty, checked), so a preview URL refuses scripts until a Protection Bypass for Automation secret exists. The API for that is `PATCH /v1/projects/{idOrName}/protection-bypass` with body `{"generate":{"note":"…"}}` (response `protectionBypass` keyed by the new secret); requests then send header `x-vercel-protection-bypass: <secret>` (Vercel docs, read this session).
- **F11 (#471).** Cap counters: `src/lib/limits/user-cap.ts` → RPC `user_hit(p_user_id,p_route)`; limits in `supabase/migrations/0046_drink_identify_cap.sql`, per account, per route, per hour bucket.
- **F12 (#499).** `node_modules/next/dist/build/segment-config/app/app-segment-config.js:152` has `case 'instant':` (Next 16.4.3): the flag is a segment config Next parses.
- **F13 (design).** Round 7 (`uploads/design-round7/My Food AI.dc.html`, section `#7`): hit list, a 16-row control table, seven remedies, `7a` five action-row states (44×44 tap areas around unmoved 24 px icons; pressed = 55% dim at pointer-down for every control including one that is saving; chosen = filled at once, saving silently, extra taps dropped; failed = reverts with "Feedback could not be saved. Try again." under the row; not available yet = both thumbs faded, other controls work), `7b` first frame (post header, caption, the feed's photo copy, shimmering item rows; on desktop inside the post window; applies to photo, more, Details, Comment).
- **F14 (#373/#375 data sources).** The Supabase Management API (`SUPABASE_ACCESS_TOKEN`, checked this session) offers `/v1/projects/{ref}/analytics/endpoints/usage.api-counts?interval=1day` (works), `usage.api-requests-count`, and `/v1/projects/{ref}/analytics/endpoints/metrics`, which returns Prometheus text including `node_memory_*` gauges and `pgbouncer_pools_*` for the database. No endpoint reports log-ingestion bytes; that number exists only on the dashboard's Usage page.
- **F15 (estimate, lane H).** On main after #549: `resolveFoodMatch` (`match.ts:86-95`) returns `result.food` when the strict matcher succeeds or `approximate` is off or `baseFood` is null, else `closestGenericFood` (`approximate.ts`), which returns null when no generic record is found or the model rejects every candidate. `FdcFood.approximation` is typed `{kind: "closest"; basis: string}` (`client.ts:93`). `scaleNutrition` (`nutrients.ts:120`) always sets `sourceRef = String(food.fdcId)` and copies the approximation tag into every micronutrient entry; `gramBasis` is true for any non-Branded `dataType`; `hasNutrition` needs one of 1008/2047/2048/1003/1004/1005. `foodApproximation` (`approximation-metadata.ts:4-12`) accepts only `kind==='closest'` and needs a non-empty `source_ref`; `approximationLabels` returns `{name,basis}`. `plainConsumed` (`wording.ts:4-8`) writes ` Nutrition for X is taken from the closest USDA record, Y.`; `recompute.ts:114` hard-codes the same sentence; `persist.ts:123` guards the legacy fallback on that marker. Migration 0051's two RPCs rewrite the first model comment only when `position(' is taken from the closest USDA record, ' …)>0` (four places). `source_ref` is `text` with no cast anywhere in SQL; non-numeric refs (`off:`, `barcode:`, `label`) already exist. Readers of a non-numeric ref: `portion.ts:39-43` re-fetches USDA by `Number(source_ref)` and throws for a non-id; `items.ts:77-78` yields `foodId=null` → `UNIT_UNAVAILABLE` (clean); `prior-nutrition.ts:25-28` rejects approximations and non-integer refs (clean, re-resolved on re-analysis); `match.ts:98` and `photo-drinks.ts:21` coerce to null/0 (clean). `checkWording` bans "target", "left", "remaining", "goal", "plan", "should" and similar; "estimate" is allowed. `scripts/real-food-match-smoke.mjs` passes an item when `food.description` contains the required words and fails an `unavailable:true` fixture (ceramic plate) if any food comes back.
- **F16.** The checkout `run13/docs` (docs PR #558, open) is docs-only commits past main; Fleet 14 works only in worktrees and never touches it.

## Premises (unchecked; the report states which were false)

- **P1.** The service worker's shell is the cause of the owner's full-width desktop feed (F2). Item 1.2 reproduces it before relying on it; the structural fix ships either way.
- **P4.** The project-scoped `VERCEL_TOKEN` may create a Protection Bypass secret (F10). The check is the action itself (item 6.1 step 2); a 403 ends only the "before" half of that measurement.

P2, P3 and P5 from the draft were checked this session and are now facts F9, F14 and F6.

## Dependencies and shared files

Every PR branches from the then-current `origin/main`; nothing is stacked. Lanes A and C both change `src/app/(tabs)/page.tsx:125` (A replaces the layout wrapper around the `<main>`, C replaces the `fallback` inside `detail=`): whichever merges second brings main in and re-applies its own substring to the merged line. Lane E changes `page.tsx` `HomeFeed`/`HomeToday` and imports (different lines). Lane H changes `match.ts`, `nutrients.ts`, `approximation-metadata.ts`, `wording.ts`, `recompute.ts`, `persist.ts`, `portion.ts`, `client.ts`, which no other lane touches. Lane D changes `CaptureSheet.tsx` lines 413 and 446 only. No lane touches `OutlineOverlay.tsx`.

## Review (owner ruling, current: speed over ceremony)

What counts as a review: PPLX on ChatGPT (`tools/pplx-review.mjs`, `skills/pplx-review/SKILL.md`), or a Muse zero-blocker review on the exact head. The coder also runs its own review subagent beside each build and fixes what it finds. Per PR: one review pass on the head, fix the blockers, move on at zero. If one reviewer cannot run, use the other; nothing waits.

## Lanes (each in its own worktree under `../my-food-ai-wt/run14-<lane>`, all started together)

| Lane | Item | Branch | Service that owns the how (inputs → outputs) · boundary that calls it |
|---|---|---|---|
| A | 1 | `run14/desktop-shell` | `DesktopHomeFrame` (children, today, shell flag → the 6a column layout) · `page.tsx` Home and `ShellHome` |
| B | 2 | `run14/action-row` | the global pressed-state service (`ServiceWorkerRegistration` pointer listener + `[data-tap-pressed]` CSS) consumed by `PostActions`/`ThumbsFeedback`, which stop disabling live controls · every card and the detail |
| C | 3 | `run14/tap-frame` | `open-frame.ts` registry (FeedPost → remembered; id → FeedPost or null) and `PostOpenFrame` (id → the 7b frame) · `posts/[id]` loading and page, `DesktopWorkspace`, `DoubleTap` |
| D | 4 | `run14/capture-fixes` | `uploadManager.post` (id → durable:boolean), `createOpenResponse` (one deadline) · `CaptureSheet` |
| E | 5 | `run14/auth-once` | `verified-cookie.ts` (user id → cookie spec; cookie string → user id), `today-view.ts` (first page, zone → TodayView or null) · middleware, `browser-user.ts`, `HomeToday`, `DesktopToday`, media route, `hints.ts` |
| F | 6 | `run14/measure` | scripts (`tick-cold-probe.mjs`, `egress-report.mjs` extensions, control-table driver) · docs |
| G | 7 | `run14/docs` | the #368 prompt, cleanup script, report |
| H | 8 | `run14/food-estimate` | `estimate.ts` (name, caption → FdcFood-shaped estimate or null) · `resolveFoodMatch` |

## 1. Desktop feed as 6a draws it, and no stray note (Lane A): #550, #551, #512

### 1.1 Delete the day-level note and the "*" (#551)

1. `src/components/DayHeader.tsx`:
   - Replace `` kcal${total.missing?.length?'*':''}`:''}</span></div> `` with `` kcal`:''}</span></div> `` (the desktop rule, line 21).
   - Replace `` kcal${total.missing?.length?"*":""}` : ""}</span> `` with `` kcal` : ""}</span> `` (the phone header, line 26).
   - Delete the whole line `    {total?.missing?.length ? <p className="px-inset py-grid text-meta text-muted">* Known nutrition shown. Nutrition unavailable: {[...new Set(total.missing)].join(", ")}</p> : null}`.
2. `src/components/MonthGrid.tsx`: replace `${formatDayKcal(day.kcal)}${day.missing?.length?"*":""}` with `${formatDayKcal(day.kcal)}`; replace `<summary className="cursor-pointer">* Known nutrition shown · Unavailable foods</summary>` with `<summary className="cursor-pointer">Known nutrition shown · Unavailable foods</summary>`.
3. `src/components/PhoneCalendar.tsx`: replace `${formatDayKcal(day.kcal)}${day.missing?.length?'*':''}` with `${formatDayKcal(day.kcal)}`; replace `<summary className="cursor-pointer">* Known nutrition shown · Unavailable foods</summary>` with `<summary className="cursor-pointer">Known nutrition shown · Unavailable foods</summary>`.
4. `npx tsc --noEmit`; `git grep -n '\*' -- src/components/DayHeader.tsx` must show no remaining asterisk literal. The calendar disclosures stay (Days has no per-post line to name the food); only their asterisk goes.

### 1.2 One desktop Home frame, used by Home and by the shell (#550)

Observe first (P1), on production, in native Chromium through CDP (no Playwright), signed in as test account 2 at 1280×800: load `/` once so the service worker installs and the media session is active; attach to the worker target and set `Network.emulateNetworkConditions` with 2,500 ms latency on both the page and the worker; navigate to `/` again. Record whether the document contains `[data-shell]`, the `main` width and whether `aside[aria-label="Today"]` exists; then the same at 0 ms latency. Both results go in `docs/run14-report.md` beside the owner's screenshot facts. Then, regardless of the observation:

1. Create `src/components/DesktopHomeFrame.tsx` (no hooks; usable from server and client files):
   ```tsx
   import type {ReactNode} from 'react';
   // The 6a desktop column: a 500 px feed beside the Today column, centred by
   // the workspace around it. Home and the offline shell share it so the shell
   // can never show a different desktop layout than Home.
   export default function DesktopHomeFrame({children,today,shell=false}:{children:ReactNode;today?:ReactNode;shell?:boolean}) {
    return <div className="desktop-home-layout desktop:flex desktop:items-start"><main className="flex flex-1 flex-col desktop:w-[500px] desktop:min-w-0 desktop:flex-none" data-shell={shell?'':undefined}>{children}</main>{today}</div>;
   }
   ```
2. `src/app/(tabs)/page.tsx`: add `import DesktopHomeFrame from '@/components/DesktopHomeFrame';` after the `DesktopWorkspace` import; replace `><div className="desktop-home-layout desktop:flex desktop:items-start"><main className="flex flex-1 flex-col desktop:w-[500px] desktop:min-w-0 desktop:flex-none"><CleanFreshMarker />` with `><DesktopHomeFrame today={<Suspense fallback={null}><HomeToday/></Suspense>}><CleanFreshMarker />`; replace `  </main><Suspense fallback={null}><HomeToday/></Suspense></div></DesktopWorkspace>;` with `  </DesktopHomeFrame></DesktopWorkspace>;`.
3. `src/components/ShellHome.tsx`:
   - Replace `import {useEffect,useState,useSyncExternalStore} from 'react';` with `import {useEffect,useState,useSyncExternalStore,type CSSProperties} from 'react';\nimport DesktopHomeFrame from '@/components/DesktopHomeFrame';\nimport DesktopToday from '@/components/DesktopToday';\nimport {useDesktop} from '@/lib/ui/use-desktop';`.
   - Replace ` const zone=useDeviceTimeZone();` with ` const zone=useDeviceTimeZone();\n const desktop=useDesktop();\n // Desktop has no shell in the design (6a). When the service worker served\n // this page instead of Home, leave for the network page once; `_` tells\n // the worker not to serve the shell again for that request.\n useEffect(()=>{if(!desktop||!navigator.onLine)return;const url=new URL(window.location.href);if(url.searchParams.has('_'))return;url.searchParams.set('_',String(Date.now()));window.location.replace(url.toString());},[desktop]);`.
   - Replace ` return <main className="flex flex-1 flex-col" data-shell>` with ` return <div className="desktop:flex desktop:justify-center desktop:gap-6 desktop:py-6"><div className="min-w-0 desktop:shrink-0" style={{'--workspace-width':'844px'} as CSSProperties} data-desktop-workspace><DesktopHomeFrame shell today={<DesktopToday zone={zone||undefined}/>}>`; replace `  <div data-home-feed><Feed/></div>\n </main>;` with `  <div data-home-feed><Feed/></div>\n </DesktopHomeFrame></div></div>;`.
   - `data-shell` stays on the `main` (`PostReadinessListener.tsx:15` looks for it); the shell uses no `useSearchParams`, so `/shell` still prerenders.
4. `src/app/globals.css`: after `@media (min-width:1148px) { .desktop-home-layout { gap:64px; } }` add
   ```css
   /* Round 7 remedy 2: below 1148 px the Today column hides and the 500 px feed stays centred. */
   @media (min-width:1024px) and (max-width:1147px) { .desktop-home-layout { justify-content:center; } .desktop-home-layout > aside[aria-label="Today"] { display:none !important; } }
   ```
5. `npm run build` must prerender `/shell`.

### 1.3 The phone calendar's summary names the month (#512)

`src/components/PhoneCalendar.tsx`: replace `import {formatDayKcal,postedLabel} from './MonthGrid';` with `import {formatDayKcal,monthName,postedLabel} from './MonthGrid';` (`monthName` is exported at `MonthGrid.tsx:8`); replace `<p className="px-screen-x text-meta text-muted" aria-live="polite">{postedLabel(current?.posted??0)}</p>` with `<p className="px-screen-x text-meta text-muted" aria-live="polite">{monthName(visible,true)} · {postedLabel(current?.posted??0)}</p>`.

**Blast radius.** The feed's day header and desktop rule, calendar cells and disclosures, Home's desktop wrapper, the `/shell` page on every width, desktop windows between 1024 and 1147 px, the phone calendar summary. If P1 is false the shell still matches 6a and the report says what was observed instead. **Done:** `npm test`, `npm run build`; item 6.10 at 1100, 1280 and 1440 on the preview and on production after merge; `/shell` viewed at 1280 shows the 500 px column with Today; the calendar summary reads "November 2026 · N days posted" and changes to October when October's first cell is nearest the top.

## 2. The action row per 7a (Lane B): #552, #553, #217 first case

1. `src/components/PostActions.tsx`:
   - Replace `<Link href={`/posts/${postId}?reply=1`} aria-label="Comment or correct" className="flex h-6 items-center active:opacity-50">` with `<Link href={`/posts/${postId}?reply=1`} aria-label="Comment or correct" className="-m-[10px] flex size-11 items-center justify-center">`.
   - Replace `<button type="button" aria-label="Log again" className="flex h-6 items-center active:opacity-50" onClick=` with `<button type="button" aria-label="Log again" className="-m-[10px] flex size-11 items-center justify-center" onClick=`.
   - Replace `className="flex h-6 items-center text-detail text-muted active:opacity-50">Details ›</Link>` with `className="-my-[10px] flex h-11 items-center text-detail text-muted">Details ›</Link>`.
   - Replace `aria-pressed={visibleSaved} disabled={bookmark.pending} className="ml-auto flex h-6 items-center active:opacity-50" onClick={save}>` with `aria-pressed={visibleSaved} className="-my-[10px] -mr-[10px] ml-auto flex size-11 items-center justify-center" onClick={save}>` (`save` already drops a tap while pending, line 17).
   - The negative margins keep each control's layout footprint at 24 px, so the row height, the `gap-[18px]` spacing and the dot-position maths (lines 18-20) are unchanged; the 44×44 boxes of neighbours overlap by 2 px, where the later sibling wins. The pressed state is the global `[data-tap-pressed]` dim (`globals.css:106`), which now reaches every control because none is disabled; the `active:opacity-50` classes go so a press is not dimmed twice.
2. `src/components/ThumbsFeedback.tsx`:
   - Replace `if((event as CustomEvent).detail?.postId===postId&&revisionRef.current===revision)setError({revision,message:'Feedback could not be saved.'});` with `if((event as CustomEvent).detail?.postId===postId&&revisionRef.current===revision)setError({revision,message:'Feedback could not be saved. Try again.'});`.
   - Replace (lines 22-23; both lines are indented two spaces in the file)
     ```ts
       try{const current=await saveFeedbackOptimistically({previous:verdict,next:value,save:()=>sendFeedback(postId,value,modelCommentId,fingerprint),isCurrent,select:setVerdict});if(current&&value==='down')router.push(`/posts/${postId}?reply=1`);}
       catch{if(isCurrent())setError({revision:displayedRevision,message:'Feedback could not be saved.'});}finally{if(isCurrent()){saving.current=null;setBusyRevision(null);}}
     ```
     with
     ```ts
       // 7a: thumbs down opens the reply box at once; the vote saves behind it.
       if(value==='down')router.push(`/posts/${postId}?reply=1`);
       try{await saveFeedbackOptimistically({previous:verdict,next:value,save:()=>sendFeedback(postId,value,modelCommentId,fingerprint),isCurrent,select:setVerdict});}
       catch{if(isCurrent())setError({revision:displayedRevision,message:'Feedback could not be saved. Try again.'});else window.dispatchEvent(new CustomEvent('feedback-error',{detail:{postId}}));}finally{if(isCurrent()){saving.current=null;setBusyRevision(null);}}
     ```
     (After navigation this component is gone; the detail's own `ThumbsFeedback` listens for `feedback-error` at line 17 and shows the message there.)
   - Replace `disabled={busy||!modelCommentId||!fingerprint} aria-label={value==='up'?'Accept analysis':'Correct analysis'} aria-pressed={verdict===value} className={`flex ${compact?"h-6":"h-tap"} items-center justify-center ${verdict===value?'text-text':'text-text'}`}` with `disabled={!modelCommentId||!fingerprint} aria-label={value==='up'?'Accept analysis':'Correct analysis'} aria-pressed={verdict===value} className={`flex items-center justify-center ${compact?"-m-[10px] size-11":"h-tap"} ${modelCommentId&&fingerprint?'text-text':'text-faint'}`}`.
   - `busy` still guards `vote` through `saving.current`, so extra taps while saving are dropped quietly (7a "chosen · saving in background"); the button is no longer disabled, so the pressed dim shows. Before the analysis exists both thumbs are `text-faint` and disabled, so they neither dim nor act (7a "not available yet"). A failed save reverts (`feedback-optimistic.ts:17`) and shows the new message.
3. `npx tsc --noEmit` must report `busy` still used; `npm run lint`.

**Blast radius.** Every feed card's action row and the detail's. Thumbs down now leaves the feed before the save resolves; a failed save shows on the detail page instead of the card. **Done:** page look of the five 7a states at 390×844 on a local production build (rest with the 44 px boxes measured via `getBoundingClientRect`, pressed via a held pointer, chosen, failed via a blocked `/api` route, processing on a queued post); item 6.4 measures the row.

## 3. The first frame of a meal, in the same paint as the tap (Lane C): #554, #494, #495, #497

1. Create `src/lib/posts/open-frame.ts`:
   ```ts
   import type { FeedPost } from "./feed";
   // The feed's last copy of each card, so a meal's first frame (design 7b)
   // paints from memory in the tick of the tap. Memory only; nothing persists.
   const posts = new Map<string, FeedPost>();
   export function rememberPost(post: FeedPost): void { posts.set(post.id, post); }
   export function recallPost(id: string): FeedPost | null { return posts.get(id) ?? null; }
   ```
2. `src/components/PostCard.tsx`: add `import { rememberPost } from '@/lib/posts/open-frame';` below the existing `from "react"` import (line 8, which already imports `useEffect`); after `  const handle=usePostHandle(record.handle);` add `  useEffect(()=>{rememberPost(post);},[post]);`.
3. Create `src/components/PostPageShell.tsx` (no hooks):
   ```tsx
   import Link from 'next/link';
   import type {ReactNode} from 'react';
   import Sidebar from '@/components/Sidebar';
   import {font} from '@/lib/theme/font';
   import {Icon} from '@/components/ui/Icon';
   // The post page's frame, shared by the page and its loading state so the
   // header never moves between the two.
   export default function PostPageShell({children}:{children:ReactNode}) {
    return <><Sidebar/><main className={`${font.className} mx-auto min-h-dvh w-full max-w-phone bg-surface pb-[calc(100px+env(safe-area-inset-bottom))] text-text desktop:ml-[calc(232px_+_(100%_-_232px_-_640px)/2)] desktop:max-w-[640px]`}>
     <header className="flex h-top-safe items-center justify-between px-inset"><Link href="/" className="flex h-tap w-[60px] items-center text-body" aria-label="Back to Feed"><Icon name="back" size={22}/>Feed</Link><h1 className="text-body font-semibold">Post</h1><span className="w-[60px]"/></header>
     {children}
    </main></>;
   }
   ```
4. Create `src/components/PostOpenFrame.tsx`:
   ```tsx
   'use client';
   import {useLayoutEffect,useRef,useState} from 'react';
   import {recallPost} from '@/lib/posts/open-frame';
   import type {FeedPost} from '@/lib/posts/feed';
   import PostDetailSkeleton from '@/components/PostDetailSkeleton';
   import PostActions from '@/components/PostActions';
   import PostCaption from '@/components/PostCaption';
   import {usePostHandle} from '@/components/PostHandle';
   import {Shimmer} from '@/components/ui/Shimmer';

   // Design 7b: the frame that shows in the same paint as the tap. It uses the
   // feed's copy of the post, so nothing downloads again; the item rows shimmer
   // until the detail replaces this frame without moving the photo.
   export default function PostOpenFrame({id,desktopModal=false}:{id:string;desktopModal?:boolean}) {
    const post=recallPost(id);
    if(!post)return <PostDetailSkeleton/>;
    return desktopModal?<DesktopFrame post={post}/>:<PhoneFrame post={post}/>;
   }

   function Header({post,height}:{post:FeedPost;height:string}) {
    const handle=usePostHandle((post as {handle?:string}).handle);
    return <div className={`flex ${height} items-center gap-[10px] px-inset`}><span className="flex size-8 shrink-0 items-center justify-center rounded-circle bg-text text-avatar text-surface">{handle.slice(0,1).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-handle">{handle}</span></div>;
   }

   function Photo({post,square}:{post:FeedPost;square:boolean}) {
    const url=post.slides.find(slide=>slide.kind!=='card')?.url??post.photoUrl;
    const image=useRef<HTMLImageElement>(null);
    const [ratio,setRatio]=useState<string|null>(null);
    // The feed webp is already in the browser cache, so its natural size is
    // known at once; the detail frame uses the same ratio, so nothing moves.
    useLayoutEffect(()=>{const element=image.current;if(!element)return;const read=()=>{if(element.naturalWidth&&element.naturalHeight)setRatio(`${element.naturalWidth} / ${element.naturalHeight}`);};if(element.complete)read();else element.addEventListener('load',read,{once:true});return()=>element.removeEventListener('load',read);},[url]);
    if(!url)return <div className="aspect-square w-full bg-card"/>;
    // eslint-disable-next-line @next/next/no-img-element
    return <div className="relative w-full overflow-hidden bg-card" style={square?{aspectRatio:'1 / 1'}:{aspectRatio:ratio??'1 / 1',maxHeight:'80dvh'}}><img ref={image} src={url} crossOrigin="anonymous" alt={post.caption||'Meal photo'} draggable={false} className={`h-full w-full ${square?'object-cover':'object-contain'}`}/></div>;
   }

   function Rows() {
    return <div className="flex flex-col gap-3 px-inset pt-3" role="status" aria-label="Loading meal"><Shimmer width="70%"/><Shimmer width="45%"/><Shimmer width="60%"/></div>;
   }

   function PhoneFrame({post}:{post:FeedPost}) {
    const handle=usePostHandle((post as {handle?:string}).handle);
    return <div className="flex flex-col pb-6" data-post-open-frame>
     <Header post={post} height="h-[52px]"/>
     <Photo post={post} square={false}/>
     <PostActions detail post={post} postId={post.id} modelCommentId={post.modelCommentId??null} fingerprint={post.analysisFingerprint??null} saved={Boolean(post.saved_meal_id)}/>
     <div className="px-inset"><PostCaption postId={post.id} handle={handle} caption={post.caption}/></div>
     <Rows/>
    </div>;
   }

   function DesktopFrame({post}:{post:FeedPost}) {
    const handle=usePostHandle((post as {handle?:string}).handle);
    return <div className="desktop-post-content" data-post-open-frame>
     <Photo post={post} square/>
     <div className="desktop-post-record"><Header post={post} height="h-14"/><div className="desktop-post-scroll"><div className="px-inset"><PostCaption postId={post.id} handle={handle} caption={post.caption}/></div><Rows/></div></div>
    </div>;
   }
   ```
   The desktop classes are the ones `OutlineOverlay` uses (`globals.css:55-59`); the phone photo frame is the whole-photo rule of #556.
5. Create `src/app/posts/[id]/loading.tsx`:
   ```tsx
   'use client';
   import {useParams} from 'next/navigation';
   import PostOpenFrame from '@/components/PostOpenFrame';
   import PostPageShell from '@/components/PostPageShell';
   // Shown by the router in the tick of the navigation, before the server answers.
   export default function Loading() { const {id}=useParams<{id:string}>(); return <PostPageShell><PostOpenFrame id={id}/></PostPageShell>; }
   ```
6. `src/app/posts/[id]/page.tsx`: replace the whole file with
   ```tsx
   import PostDetail from '@/components/PostDetail';
   import PostOpenFrame from '@/components/PostOpenFrame';
   import PostPageShell from '@/components/PostPageShell';
   import {Suspense} from 'react';
   import NavigationControls from '@/components/NavigationControls';
   export const instant=false;
   export default async function PostPage({params}:{params:Promise<{id:string}>}) {
    const {id}=await params;
    return <PostPageShell><Suspense key={id} fallback={<PostOpenFrame id={id}/>}><PostDetail id={id}/></Suspense><NavigationControls/></PostPageShell>;
   }
   ```
7. Desktop windows:
   - `src/app/(tabs)/page.tsx`: replace `import PostDetailSkeleton from '@/components/PostDetailSkeleton';` with `import PostOpenFrame from '@/components/PostOpenFrame';` and `fallback={<PostDetailSkeleton/>}` with `fallback={<PostOpenFrame id={post} desktopModal/>}`.
   - `src/app/(tabs)/profile/page.tsx` and `src/app/(tabs)/search/page.tsx` (neither imports `Suspense`; both imports are new in both files): replace `detail={post?<PostDetail id={post} desktopModal/>:undefined}` with `detail={post?<Suspense key={post} fallback={<PostOpenFrame id={post} desktopModal/>}><PostDetail id={post} desktopModal/></Suspense>:undefined}` and add `import {Suspense} from 'react';` and `import PostOpenFrame from '@/components/PostOpenFrame';`.
   - `src/components/DesktopWorkspace.tsx`:
     - Add `import PostOpenFrame from '@/components/PostOpenFrame';` after the `scroll-lock` import.
     - Replace `  const [focused,setFocused]=useState<string|null>(selected);` with `  const [focused,setFocused]=useState<string|null>(selected);\n  // The window opens in the tick of the click with the 7b frame; the server's\n  // detail replaces it when the navigation lands.\n  const [pending,setPending]=useState<string|null>(null);const shown=selected??pending;\n  useEffect(()=>{setPending(null);},[selected]);`.
     - Replace `const open=useCallback((id:string|null)=>{if(!id)dialog.current?.close();` with `const open=useCallback((id:string|null)=>{setPending(id);if(!id)dialog.current?.close();`.
     - Replace `useEffect(()=>{if(!selected||!desktop)return;const element=dialog.current;element?.showModal();const release=lockBodyScroll();return()=>{element?.close();release();};},[selected,desktop]);` with `useEffect(()=>{if(!shown||!desktop)return;const element=dialog.current;element?.showModal();const release=lockBodyScroll();return()=>{element?.close();release();};},[shown,desktop]);`.
     - After that line add `  useEffect(()=>{const handler=(event:Event)=>{const id=(event as CustomEvent<{id?:string}>).detail?.id;if(id){setFocused(id);open(id);}};window.addEventListener('open-post',handler);return()=>window.removeEventListener('open-post',handler);},[open]);`.
     - Replace `{selected&&desktop&&<dialog` with `{shown&&desktop&&<dialog`.
     - Replace `{detail??<p role="status" className="p-4 text-muted">Loading post…</p>}` with `{detail??<PostOpenFrame id={shown} desktopModal/>}`.
   - `src/components/DoubleTap.tsx`: after the `Icon` import add
     ```ts
     // On desktop the feed opens a meal in its window (DesktopWorkspace); a photo
     // tap joins that path instead of leaving for the full page.
     const openTarget=(router:ReturnType<typeof useRouter>,target:string)=>{const id=target.match(/^\/posts\/([0-9a-f-]{36})/i)?.[1];if(id&&matchMedia('(min-width:1024px)').matches&&document.querySelector('[data-desktop-workspace]')){window.dispatchEvent(new CustomEvent('open-post',{detail:{id}}));return;}router.push(target);};
     ```
     and replace both occurrences of `open:(target:string)=>router.push(target)` (lines 16 and 18) with `open:(target:string)=>openTarget(router,target)`.
8. `npx tsc --noEmit`, `npm run lint`, `npm run build` (the `[id]` segment must list `loading.tsx`).

**Blast radius.** Every way into a meal on phone and desktop. If `recallPost` misses (hard reload, deep link, Search/Profile cards that are not `PostCard`), the old skeleton shows, as today. **Done (page look):** on a local production build at 390×844 with CPU 4× and Fast 3G, tapping the photo, "more", Details and Comment each paint the frame in the same frame as the tap (a `MutationObserver` records the first mutation under 50 ms after `pointerup`), and the detail replaces it with the photo's top edge within 1 px of where it was; at 1280×800 the window opens at once with the frame; a photo click on desktop opens the window, not the page; item 6.5 repeats the timing on production.

## 4. Capture and model defects found after Fleet 12 (Lane D): #542, #543, #544, #499

### 4.1 Space on a focused button activates the button (#542)
`src/components/CaptureSheet.tsx`: replace `(event.target as HTMLElement)?.closest('input,textarea,select,[contenteditable="true"]'))return;event.preventDefault();void takePhoto();` with `(event.target as HTMLElement)?.closest('input,textarea,select,button,a[href],summary,[contenteditable="true"]'))return;event.preventDefault();void takePhoto();`. The shutter is itself a button: Space on it now runs its native click, which calls `takePhoto` once instead of twice.

### 4.2 The posted flag is acknowledged before the sheet closes (#543)
1. `src/lib/posts/upload-manager.ts`: replace
   ```ts
       post(id: string) { const entry = this.entries.get(id); if (!entry || entry.deleted)
           return; entry.data.posted = true; void this.persist(entry); this.notify(entry, 'upload-started'); void this.run(entry); }
   ```
   with
   ```ts
       /** Resolves once the posted flag is in IndexedDB (true) or that write failed (false). The upload runs either way. */
       async post(id: string): Promise<boolean> { const entry = this.entries.get(id); if (!entry || entry.deleted)
           return false; entry.data.posted = true; const durable = this.persist(entry); this.notify(entry, 'upload-started'); void this.run(entry); try { await durable; return true; } catch { return false; } }
   ```
2. `src/components/CaptureSheet.tsx`: replace `operationRef.current=id;setOperationId(id);uploadManager.post(id);onClose();router.refresh();` with `operationRef.current=id;setOperationId(id);await uploadManager.post(id);onClose();router.refresh();` (`posting` stays true until the flag is written, so the Post button shows its saving state for that time).
3. Test (data durability): in `tests/upload-guard.test.mjs`, whose `harness()` builds `new UploadManager(store, makeDraft, delay, foodRequest)` with a stubbed store and already calls `manager.post(id)` (lines 18, 22, 42), add two cases: a store whose `put` resolves after 50 ms makes `post()` resolve `true` only after that put has settled, with `run` started; a store whose `put` rejects makes `post()` resolve `false` with `run` still started.

### 4.3 One 75-second deadline across both format attempts (#544)
1. `src/lib/meta/open-weights.ts`: replace `const OPEN_IDENTIFY_TIMEOUT_MS = 75_000;` with `const OPEN_IDENTIFY_TIMEOUT_MS = Number(process.env.IDENTIFY_OPEN_TIMEOUT_MS) || 75_000;`; replace
   ```ts
     const send=(jsonObject:boolean)=>fetchWithRetry(`${openBaseUrl()}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(openRequest(body,jsonObject))},OPEN_IDENTIFY_TIMEOUT_MS,key,0);
   ```
   with
   ```ts
     // One deadline for both format attempts: a late format rejection cannot restart the budget.
     const deadline=AbortSignal.timeout(OPEN_IDENTIFY_TIMEOUT_MS);
     const send=(jsonObject:boolean)=>fetchWithRetry(`${openBaseUrl()}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(openRequest(body,jsonObject)),signal:deadline},OPEN_IDENTIFY_TIMEOUT_MS,key,0);
   ```
2. `tests/open-identify.test.mjs`: add a test that sets `process.env.IDENTIFY_OPEN_TIMEOUT_MS='600'` before importing, runs a local server that answers the first request after 300 ms with status 400 and body `{"error":{"message":"response_format is not supported"}}` and never answers the second, and asserts that `identifyItems(...,'open')` returns the Meta result (the stubbed `fetch` for port 1 as in the existing test) in under 900 ms by `performance.now()`. Restore the variable after the test.
3. `.env.example`: add `IDENTIFY_OPEN_TIMEOUT_MS=` with the comment `# Optional. Total milliseconds for one open-model identify, both format attempts together. Default 75000.`

### 4.4 #499 closes on evidence, no code change
Comment on #499: Next `16.4.3` parses `instant` as a segment config (`node_modules/next/dist/build/segment-config/app/app-segment-config.js`, `case 'instant':`), so the audit's premise is false; the exports stay. Close it.

**Blast radius.** Desktop capture keys; the capture sheet's close (the IndexedDB write is local, milliseconds); open-model identify time budget only. **Done:** `npm test` with the new cases passing; the Space check on both buttons with the fake camera flag on a local build.

## 5. One sign-in call and one day-totals read per page open (Lane E): #323, #324, #520

### 5.1 The verified-user cookie service
1. Create `src/lib/auth/verified-cookie.ts`:
   ```ts
   // The server verified the user with Auth on a page response and tells the
   // browser so through this cookie; the browser then makes no Auth request of
   // its own. Data access never relies on it: every read runs under row-level
   // security with the real session. Shared by the middleware and the browser.
   export const VERIFIED_USER_COOKIE = "mfa-verified-user";
   const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
   export function verifiedUserCookie(userId: string | null, secure: boolean): { name: string; value: string; options: { path: string; sameSite: "lax"; secure: boolean; httpOnly: boolean; maxAge: number } } {
     return { name: VERIFIED_USER_COOKIE, value: userId ?? "", options: { path: "/", sameSite: "lax", secure, httpOnly: false, maxAge: userId ? 3600 : 0 } };
   }
   export function readVerifiedUserCookie(cookieHeader: string): string | null {
     const value = cookieHeader.split("; ").find(pair => pair.startsWith(`${VERIFIED_USER_COOKIE}=`))?.slice(VERIFIED_USER_COOKIE.length + 1) ?? null;
     return value && UUID.test(value) ? value : null;
   }
   ```
2. `src/middleware.ts`: add `import { verifiedUserCookie } from "@/lib/auth/verified-cookie";` after the `verified-user-header` import; replace
   ```ts
     if (user) {
       request.headers.set(VERIFIED_USER_HEADER, user.id);
       session.refreshRequestHeaders();
     }
   ```
   with
   ```ts
     if (user) {
       request.headers.set(VERIFIED_USER_HEADER, user.id);
       session.refreshRequestHeaders();
     }
     // Recorded through the bridge so it survives its later response rebuilds.
     session.cookies.setAll([verifiedUserCookie(user?.id ?? null, request.nextUrl.protocol === "https:")]);
   ```
3. `src/lib/auth/browser-user.ts`: add `import {readVerifiedUserCookie} from './verified-cookie';` after the type import; replace
   ```ts
    const reader=createVerifiedUserReader(async()=>{
     // The token is only an invalidation key. Authorization/user data always
     // comes from the real getUser request below, not this local session.
     const {data:{session}}=await auth.getSession();
     if(sessionToken===undefined)sessionToken=session?.access_token??null;
     return original();
    });
   ```
   with
   ```ts
    const reader=createVerifiedUserReader(async()=>{
     // The token is only an invalidation key. The identity comes from the
     // server's verified-user cookie when it names this session's user;
     // otherwise from the real getUser request. Data access relies on neither.
     const {data:{session}}=await auth.getSession();
     if(sessionToken===undefined)sessionToken=session?.access_token??null;
     const verified=typeof document==='undefined'?null:readVerifiedUserCookie(document.cookie);
     if(session&&verified===session.user.id)return {data:{user:session.user},error:null} as unknown as T;
     return original();
    });
   ```
4. `src/lib/profile/hints.ts`: add `import { verifiedUserId } from "@/lib/auth/verified-user";`; replace `  const { data: { user } } = await client.auth.getUser();\n  if (!user) return null;` (in `getHintState`) with `  const verified = await verifiedUserId();\n  if (!verified) console.info("auth verify hint");\n  const user = verified ? { id: verified } : (await client.auth.getUser()).data.user;\n  if (!user) return null;`.
5. `src/app/api/media/feed/[owner]/[post]/[media]/v1.webp/route.ts`: replace
   ```ts
     const {data: {user}, error: authError} = await db.auth.getUser();
     if (authError || !user) return fail(401);
     if (owner !== user.id) return fail(404);
   ```
   with
   ```ts
     // The cookie session names the owner without an Auth round trip per photo.
     // The post_media read below runs under row-level security with the real
     // session, so a forged or expired session gets no row (404), never bytes.
     const {data: {session}} = await db.auth.getSession();
     if (!session?.user) return fail(401);
     if (owner !== session.user.id) return fail(404);
   ```
6. Counting lines kept for item 6.6: `src/middleware.ts`: after `  } = await supabase.auth.getUser();` add `  console.info(`auth verify middleware ${request.nextUrl.pathname}`);`. `src/app/(tabs)/page.tsx`: replace `  const user = verified ? {id: verified} : (await db.auth.getUser()).data.user;` with `  if (!verified) console.info("auth verify page /");\n  const user = verified ? {id: verified} : (await db.auth.getUser()).data.user;`. `src/app/api/feed/route.ts`: directly after the whole line `  try { auth = await Promise.race([db.auth.getUser(), …]); }` (line 15) add `  console.info("auth verify api/feed");`.
7. Tests (access): `tests/feed-photo.test.mjs` stubs `getSession()` to `{session:{access_token:'offline-token'}}` with no `user` (line 20) and counts `getUser` calls; change the stub to `{session:{access_token:'offline-token',user:{id:<the owner id the test already uses>}}}`, change its `getUser` count assertions to zero, and add: a session whose `user.id` differs from `owner` gets 404 with no body; no session gets 401. Add `tests/verified-cookie.test.mjs`: `readVerifiedUserCookie` returns the id for a well-formed cookie among others, null for a malformed value and for no cookie; `verifiedUserCookie(null, true).options.maxAge` is 0. The forged-header case in `tests/verified-user.test.mjs:32` stays.

### 5.2 (#324) Today from the page already read
1. Create `src/lib/posts/today-view.ts`:
   ```ts
   import { dateInZone } from "./days";
   import { sumNutrition, type MealTotals } from "@/lib/nutrition/totals";
   import { emptyIntake } from "@/lib/intake/intake";
   import type { FeedPost } from "./feed";
   export interface TodayView { date: string; posts: { id: string; caption: string; eatenAt: string; photoUrl: string | null; items: { name: string }[]; totals: { calories: number | null } }[]; totals: MealTotals; intake: { water: number; caffeine: number } }
   // Today's column from the feed's first page, so Home does not query today's
   // totals a second time. Null when today's posts may run past the page: the
   // page is ordered by eaten_at descending, so a post eaten before today, or
   // no next page, proves the page holds every post eaten today.
   export function todayFromPage(page: { posts: FeedPost[]; nextCursor: string | null }, zone: string, now = new Date()): TodayView | null {
     const today = dateInZone(now, zone);
     const complete = page.nextCursor === null || page.posts.some(post => dateInZone(post.eaten_at, zone) < today);
     if (!complete) return null;
     const todays = page.posts.filter(post => dateInZone(post.eaten_at, zone) === today);
     return { date: today, posts: todays.map(post => ({ id: post.id, caption: post.caption, eatenAt: post.eaten_at, photoUrl: post.photoUrl, items: post.items.map(item => ({ name: item.name })), totals: sumNutrition(post.items) })), totals: sumNutrition(todays.flatMap(post => post.items)), intake: emptyIntake() };
   }
   ```
2. `src/app/(tabs)/page.tsx`:
   - Replace `import { dateInZone, getDayTotals, getLoggedDates, shiftDay, validZone } from "@/lib/posts/days";` with `import { dateInZone, getDayTotals, getLoggedDates, shiftDay, validZone } from "@/lib/posts/days";\nimport { todayFromPage } from "@/lib/posts/today-view";`.
   - Replace the `HomeFeed` function from `async function HomeFeed() {` through its closing `}` (lines 97-119) with
     ```tsx
     // One request-scoped read of the first page, shared by the feed and the Today column.
     const homeSeed = cache(async () => {
       const {db,user} = await homeReader();
       if (!user) return undefined;
       const zone = validZone((await cookies()).get('time-zone')?.value);
       const [page, days] = await Promise.all([
         getFeed(db, user.id, null, zone, 6, {knownDays: Array.from({length: 5}, (_, index) => shiftDay(dateInZone(new Date(), zone), -index)), onFirstPhoto: url => preload(url, {as:'image',fetchPriority:'high',crossOrigin:'anonymous'})}),
         homeDayTotals().catch(() => []),
       ]);
       page.days = [...days, ...page.days];
       return {page, userId: user.id, zone};
     });

     // Stream real first-card markup before downloading and hydrating the client
     // bundle. Optional day/hydration summaries are filled by the HTTP revalidation.
     async function HomeFeed() {
       await connection();
       let initialPage: Awaited<ReturnType<typeof getFeed>> | undefined;
       let initialUserId: string | undefined;
       let initialZone = "UTC";
       try {
         const seed = await homeDeadline(homeSeed());
         initialPage = seed?.page;
         initialUserId = seed?.userId;
         initialZone = seed?.zone ?? "UTC";
       } catch { /* The client boundary can retry while the shell stays visible. */ }
       return <div data-server-feed-ready={initialPage ? true : undefined}><Feed key={initialUserId ?? 'anonymous'} initialPage={initialPage} initialUserId={initialUserId} initialZone={initialZone} /></div>;
     }
     ```
   - Replace `async function HomeToday(){await connection();const zone=(await cookies()).get('time-zone')?.value;return <DesktopToday zone={zone}/>;}` with
     ```tsx
     // Today's column from the page already read; the column fetches only when
     // today's posts may run past the first page, or after a post changes.
     async function HomeToday(){await connection();const cookieZone=(await cookies()).get('time-zone')?.value;let initial;try{const seed=await homeDeadline(homeSeed());initial=seed?todayFromPage(seed.page,seed.zone)??undefined:undefined;}catch{/* The column fetches on the client as before. */}return <DesktopToday zone={cookieZone} initial={initial}/>;}
     ```
3. `src/components/DesktopToday.tsx`:
   - Replace `import {dateInZone,validZone,type LoggedDay} from '@/lib/posts/days';` with `import {dateInZone,validZone} from '@/lib/posts/days';\nimport type {TodayView} from '@/lib/posts/today-view';`.
   - Replace `export default function DesktopToday({zone:configuredZone}:{zone?:string}){\n const desktop=useDesktop();const [day,setDay]=useState<LoggedDay|null>(null);` with `export default function DesktopToday({zone:configuredZone,initial}:{zone?:string;initial?:TodayView}){\n const desktop=useDesktop();const [day,setDay]=useState<TodayView|null>(initial??null);`.
   - Replace `load();for(const name of ['post-settled','post-deleted','post-restore','intake-changed'])window.addEventListener(name,load);` with `if(!initial)load();for(const name of ['post-settled','post-deleted','post-restore','intake-changed'])window.addEventListener(name,load);` and `},[desktop,zone]);` with `},[desktop,zone,initial]);`.
   - `LoggedDay` satisfies `TodayView` structurally, so the `/api/days` response still sets state unchanged.
4. Test (data rule): `tests/today-view.test.mjs`: with three posts (two today, one yesterday) and `nextCursor` set, `todayFromPage` returns two posts and totals equal to `sumNutrition` of their items; with every post today and a `nextCursor`, it returns null; with every post today and `nextCursor: null`, it returns them.
5. `npx tsc --noEmit`, `npm test` (`tests/desktop-review.test.mjs` renders `DesktopToday`; adapt only its import if the type name matters).

**Blast radius.** Every signed-in page open (browser identity path), every feed photo request (an expired session yields 404 instead of 401; `public/sw.js` has no 401 handling), the thumbs hint action, desktop Today. If the cookie is absent the browser falls back to today's network call; if `homeSeed` fails, Today fetches as today. **Done:** the tests pass; item 6.6 shows, for one Home open as test account 2 on production, 0 browser `/auth/v1/user` requests, 0 `/api/days` requests, 0 `/api/feed` requests (zone cookie present) and, on the local production build, exactly one `auth verify` line; an unsigned request to `/` and `/posts/<id>` still redirects to `/sign-in`.

## 6. Measurements and production checks (Lane F): everything the paste asks to measure

All in native Chromium through CDP (the `scripts/browser-session.mjs` cookie pattern; never Playwright), signed in as designated test account 2, at 390×844 with `Emulation.setCPUThrottlingRate(4)` unless stated. No image is stored; every number goes in `docs/run14-report.md` as text tables. Every post created is deleted with its storage objects and verified absent before the report.

### 6.1 Tick cold start, before and after (#322)
1. **After (lazy, production):** write `scripts/tick-cold-probe.mjs` (`node --env-file=.env.local scripts/tick-cold-probe.mjs --wait-for-deploy [--url <base>] [--bypass <secret>]`): polls `GET https://api.vercel.com/v6/deployments?target=production&limit=1` with `VERCEL_TOKEN` every 5 s until a new `uid` is READY (or, with `--url`, polls `GET /v6/deployments?limit=1` for that branch's newest preview), then at once calls `GET <base>/api/jobs/tick` three times 1 s apart, printing `x-tick-cold`, status and total time for each. Run it around each Fleet 14 PR merge, so at least five cold samples (`x-tick-cold: 1`) and ten warm ones are recorded.
2. **Before (eager, preview):** `PATCH https://api.vercel.com/v1/projects/my-food-ai/protection-bypass` with `{"generate":{"note":"fleet14 tick probe"}}` (P4; a 403 ends this half with the response recorded). Branch `probe/tick-eager` from main; `git log --oneline -- src/app/api/jobs/tick/route.ts src/lib/worker/handlers.ts` names the #334 commit; `git show` it and reverse its lazy loading on this branch only (static imports of the job modules). Push, open a draft PR titled `probe: eager tick, never merge`, wait for its preview READY, run the probe with `--url <preview> --bypass <secret>` (header `x-vercel-protection-bypass`) three times with a forced redeploy each (`git commit --allow-empty`), record, close the PR unmerged, and delete the branch. Retain the protection-bypass secret permanently for reviewer/coder access; it is never revoked or removed (owner, November 4, 16:14–16:15 WIB).
3. Write both sets into `docs/tick-cold.md` with the deployment ids.

### 6.2 Database reads, Storage egress, RAM and connections (#373, #375)
1. Extend `scripts/egress-report.mjs` with two more aggregate queries over the same Management API log source it already uses: (a) Storage requests and bytes by path class, the classes being the feed photo path (`feedPhotoPath` in `src/lib/posts/feed-photo.ts`), card images and originals (the coder reads the three path shapes from `feed-photo.ts` and the `src/lib/pipeline/` card writers and names them in the script header); (b) the same by client class: automation (`HeadlessChrome`, `node`, `undici`, `curl`) against real browsers (`Mobile Safari`, `Chrome Mobile`, desktop `Chrome`/`Safari`/`Firefox`). Run it for the 24 h window `docs/egress.md` used and for the latest 24 h; append both tables to `docs/egress.md`.
2. Memory and pools (F14), owner closeout: deliver the existing snapshot and readings labelled **three of seven** in the report. The six-hour hourly loop is cancelled and the collector is stopped; it fed no shipping or owner decision. Do not start another observation window or hold delivery for it. Retain the already-recorded connection/cache explanation as evidence, without claiming a six-hour trend.
3. Log-ingestion bytes: the API has no endpoint for them (F14); the report says so and names the dashboard Usage page as the only source.
4. Report the largest real-user Storage source by bytes; if it is the feed photo route, state that #372's resize already serves it; if it is originals or cards, file one backlog item naming the client and size.

### 6.3 A recording-length session stays under the cap (#471)
Run 12 sequential photo posts on production as test account 2 through `scripts/load-test.mjs` (read its flags in its header; its existing fixture photos; concurrency 1), with the real pipeline. After each post, read-only, count that account's hour-bucket rows per route from the table the `user_hit` function writes (named in `supabase/migrations/0046_drink_identify_cap.sql`). Record per-route counts after 12 posts against the limits (post 40, drink_identify 120, fdc_search 300, label 30, correct 100) and the headroom in photos per hour. Delete the 12 posts and their storage objects. Note in the report that the recording account must not be used by any script on the day of recording.

### 6.4 The control table, measured (#217, #555)
Inject once per page: a `pointerdown` listener recording `performance.now()`, a `MutationObserver` on `document.body` recording the first mutation after it, a `PerformanceObserver` for `layout-shift` entries in the 2 s after, and a read of `[data-tap-pressed]` 16 ms after `pointerdown`. Dispatch each tap with `Input.dispatchTouchEvent` at the control's centre, then a second tap 150 ms later. Rows: the 16 of Round 7 section 2 (Home), the detail's row, the capture sheet (Text, Photo with the fake camera flag, Barcode), the drink sheet, Days (cells, month navigation, a day's panel), Search (field, results), Profile (grid, Connect an agent, Sign out, model setting). Columns: control, hit area (`getBoundingClientRect` width×height), pressed (yes/no), time to visible change (ms), jump or flicker (cumulative layout shift), double tap result, verdict. A control over 100 ms to a visible change, without a pressed state, or that acts twice is fixed in this run when the fix is under ten lines (in lane B or C, noted in the PR) and otherwise filed with a new issue number. Table into `docs/run14-report.md`.

### 6.5 Where the detail's seconds go (#494, #495, #497)
On production at 390×844, CPU 4×, `Network.emulateNetworkConditions` Fast 3G (1.6 Mbps down, 150 ms RTT): from a settled Home, tap a card's photo and record from the `pointerup`: (a) the 7b frame visible (`[data-post-open-frame]` in the DOM), (b) the navigation request's TTFB and full RSC time, (c) the detail's items rendered (first `[aria-label^="Edit "]` or the nutrition summary), (d) the original photo's bytes and time. Three trials, three posts, plus the same at 1280×800 for the modal. Before: `docs/detail-open-audit.md` (0.931–3.440 s content, 142,087 B original). State plainly what remains unexplained against the owner's 14 s.

### 6.6 Counts tied to one navigation (#323, #324, #520, #372)
On production as test account 2, one cold tab with the zone cookie present: record every request of one Home open from `Page.navigate` to network idle: count `/auth/v1/user`, `/api/feed`, `/api/days`, server-action POSTs, feed photo requests, and the first feed photo's bytes (for #372, beside the old 152,193). Repeat with the `time-zone` cookie deleted (the first-ever-visit case) and record the second `/api/feed` read and `router.refresh`. Repeat for Days and Profile. Server side: on a local production build (`npm run build && npm run start` against the disposable stack, `docs/testing.md`), open the same pages once and count the `auth verify` and `feed read day-totals` lines in stdout. Table before (Fleet 11 `run11-report.md` 13g/13h: browser auth 1 per page) and after.

### 6.7 Production checks at 390×844 that Fleet 12 could not do (#348, #351, #449, #453, #454, #512)
As test account 2 on production after the lanes merge: post the cola fixture (`tests/fixtures`, the one Fleet 9 used) → the card's second slide is the drink card with the right drink and caffeine (#348); open the drink sheet → tile sizes and order match the Round 5 frames by `getBoundingClientRect` (#351); upload a meal photo → food names appear while the numbers shimmer (#449); Barcode mode with the fake camera → the prompt element has a non-transparent background colour (#453); Days → opens with today's cell in view, weeks run unbroken across the October/November boundary, the sticky summary reads the month nearest the top on both sides of the boundary (#454, #512). Delete the two posts. These do not replace the owner's phones (#379).

### 6.8 Old drink caffeine (#377)
Read-only: repeat Fleet 13's query for the two "Coca-Cola, can" posts' intake rows and the day totals they contribute; record the ids' first eight characters and the caffeine mg. The card look on the owner's account is his.

### 6.9 Wording (#294)
`git grep -n -e "Leftovers · not eaten" -e "leftovers (not eaten)" -e "Clarification needed" -e "Additional food" origin/main -- src`. List every hit with whether it is UI text or a stored-value/regex path (`comment-label.ts`, the API error in `posts/route.ts`). If no UI text remains, #294 closes in item 9.

### 6.10 The desktop page look (#550, #551, 6a)
On the lane A preview (through the permanently retained bypass secret from 6.1) and again on production after merge, at 1100, 1280 and 1440 wide: `main` width (500), Today present (1280, 1440) or absent (1100), the feed centred (left offset equal on both sides within 2 px), no element containing "Known nutrition shown" above the first post. List differences against 6a in the PR.

## 7. The #368 probe, for an outside bot (Lane G writes it; nobody waits on it)

Write `docs/prompts/openclaw-368.md` with exactly the text below, and `scripts/cleanup-368-accounts.mjs` (`node --env-file=.env.local scripts/cleanup-368-accounts.mjs`): with the admin client, page through `auth.admin.listUsers`, delete every user whose email starts with `clearchoice+mfa368-` (the `profiles` row first if the schema does not cascade; the coder reads `0001_init.sql`), print the count. The owner runs it, or asks a coder to, after the bot reports.

```markdown
# Rate-limit probe for the My Food AI sign-up form (issue #368)

You are testing one thing: when many sign-ups go through the app's own sign-up form, does the authentication service count them against the app server's address (so everybody would be locked out together) or against your address (so only you would be locked out)? You need two devices on two different internet connections. Nothing else is required. You will not need to read any code.

## What the app is
- Web app: https://my-food-ai-ten.vercel.app
- Sign-up page: https://my-food-ai-ten.vercel.app/sign-up — three fields: Email, Handle, Password; one button "Sign up".
- Sign-in page: https://my-food-ai-ten.vercel.app/sign-in — Email, Password; button "Sign in".
- The form is sent to the app's server (Vercel), which forwards it to the authentication service (Supabase). Supabase limits sign-ups and sign-ins per source address; in an earlier direct test it refused at the 31st request. We do not know whether it sees Vercel's address or yours. That is the question.
- A refused request shows an error line under the form (and the page address gains `?error=...`). A successful sign-up opens the app's feed (page title "My Food AI", a "New post" button). There is no e-mail confirmation step.

## Accounts you may use
- Only addresses of this exact shape: `clearchoice+mfa368-YYYYMMDD-NN@gmail.com`, where YYYYMMDD is today's date and NN is 01, 02, … 40. Example: `clearchoice+mfa368-20261105-07@gmail.com`. You have access to that inbox; no mail is expected.
- Handle: `mfa368-NN` (same NN). Password: one password you choose, 12+ characters, the same for every account; keep it in your report.
- Never use any other address, never sign in to an account you did not create here, never post, upload, comment or delete anything in the app. We delete these accounts afterwards from the list in your report.

## Device A (a computer on one connection; use a fresh private window for every attempt)
1. Note the time. Open the sign-up page in a private window. Fill `…-01@gmail.com`, handle `mfa368-01`, the password. Click Sign up. Record: attempt number, clock time to the second, the outcome (feed opened / error text exactly as shown / page did not load). Close the private window.
2. Repeat for NN = 02 through 35, one after another without pausing, each in a new private window. Stop early only if ten attempts in a row show the same error.
3. Record the first attempt that was refused (its number, time and exact text) and whether later attempts were refused too. If none of 35 was refused, say so.

## Device B (a phone on mobile data, Wi-Fi OFF, within 5 minutes of the last Device A attempt)
4. On the phone, open the sign-in page in a private window and sign in as `…-01@gmail.com` with the password (account 01 was created in step 1). Record the time, and the outcome exactly (feed opened, or the error text).
5. Still on the phone, open the sign-up page and create `…-36@gmail.com` with handle `mfa368-36`. Record the outcome exactly.
6. Back on Device A (same connection as before), in a new private window, try to sign in as `…-01@gmail.com`. Record the outcome.

## What the results mean (write the matching line in your report)
- Device A was refused at some point, and Device B could sign in and sign up: Supabase counts your address, not the server's. One abuser locks out only themselves.
- Device A was refused, and Device B was also refused on both tries: Supabase counts the server's address. One abuser can lock out everybody. This is the serious outcome.
- Device A was never refused in 35 attempts: the limit was not reached through the app; say so, with the times.

## Report (plain text, in this order)
1. The date, the two devices and how each was connected (home Wi-Fi, office, mobile network name).
2. A table of every attempt: number, time, device, action (sign-up or sign-in), address used, outcome text.
3. The first refusal on Device A (number, time, text) or "none in 35".
4. The Device B outcomes (steps 4 and 5) and the Device A sign-in afterwards (step 6).
5. The one matching line from "What the results mean".
6. The full list of addresses you created, so they can be deleted.
Do not retry anything after a refusal except as the steps say; the limit resets by itself within an hour. Do not run this more than once per day.
```

## 8. A model-made estimate when no USDA record is close (Lane H): #523, owner ruling

**Owner ruling (Nov 4, during planning):** a blank value is worse than a bad estimate. After the strict matcher and the closest-record step both fail, the model estimates the food's typical nutrition, labelled as an estimate. A non-food (a plate, a napkin) still stays unavailable, which the ceramic-plate smoke fixture checks.

1. `src/lib/fdc/client.ts`: replace `  approximation?: {kind: "closest"; basis: string};` with `  approximation?: {kind: "closest" | "estimate"; basis: string};`.
2. Create `src/lib/fdc/estimate.ts`:
   ```ts
   import type { FdcFood } from "./client";
   import { createResponse, MetaApiError } from "@/lib/meta/client";
   import { recordCall } from "@/lib/trace/record";

   // Owner ruling (Nov 4): a blank value is worse than a bad estimate. When no
   // USDA record is close, the model estimates typical per-100 g nutrition for
   // the food, labelled as an estimate. Non-foods are refused and stay unavailable.
   const OUTPUT_TOKENS = [2048, 4096] as const;
   const ESTIMATE_INSTRUCTIONS = `No USDA record matches this food. Estimate its typical nutrition per 100 g as eaten: calories (kcal), protein, carbohydrate, fat, fibre and sugar in grams, sodium in milligrams. Base the estimate on the closest common foods and preparation and name them in basis, in a few words (for example "fried wheat pasta snack, seasoned"). If the item is not a food or drink (a plate, a napkin, a hand), set food to false and every number to null.`;
   const SCHEMA = { type: "object", additionalProperties: false, properties: { food: { type: "boolean" }, basis: { type: "string" }, calories: { type: ["number", "null"] }, protein_g: { type: ["number", "null"] }, carbs_g: { type: ["number", "null"] }, fat_g: { type: ["number", "null"] }, fibre_g: { type: ["number", "null"] }, sugar_g: { type: ["number", "null"] }, sodium_mg: { type: ["number", "null"] } }, required: ["food", "basis", "calories", "protein_g", "carbs_g", "fat_g", "fibre_g", "sugar_g", "sodium_mg"] };
   type Estimate = { food: boolean; basis: string; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null; fibre_g: number | null; sugar_g: number | null; sodium_mg: number | null };
   const nutrient = (nutrientId: number, nutrientName: string, unitName: string, value: number | null) => value === null ? [] : [{ nutrientId, nutrientName, unitName, value }];
   const within = (value: number | null, max: number) => value === null || (Number.isFinite(value) && value >= 0 && value <= max);

   export async function estimateFood(name: string, caption: string, signal?: AbortSignal): Promise<FdcFood | null> {
     return recordCall("fdc", { event: "food_estimate", name }, async () => {
       let result: Awaited<ReturnType<typeof createResponse>> | undefined;
       for (const maxOutputTokens of OUTPUT_TOKENS) {
         if (signal?.aborted) throw new MetaApiError(503, "Food resolution budget was exhausted.");
         result = await createResponse({ model: "muse-spark-1.3", reasoning: { effort: "low" }, instructions: ESTIMATE_INSTRUCTIONS,
           input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify({ name, caption }) }] }],
           text: { format: { type: "json_schema", name: "nutrition_estimate", strict: true, schema: SCHEMA } },
           max_output_tokens: maxOutputTokens }, { signal });
         if (result.status !== "incomplete" || result.refusal) break;
       }
       if (!result || result.status !== "completed" || !result.outputText || result.refusal) throw new MetaApiError(502, "Nutrition estimate did not complete.");
       let parsed: Estimate;
       try { parsed = JSON.parse(result.outputText) as Estimate; } catch { throw new MetaApiError(502, "Nutrition estimate was invalid."); }
       if (typeof parsed !== "object" || parsed === null || typeof parsed.food !== "boolean" || typeof parsed.basis !== "string") throw new MetaApiError(502, "Nutrition estimate was invalid.");
       if (!parsed.food || parsed.calories === null || !parsed.basis.trim()) return null;
       if (![within(parsed.calories, 900), within(parsed.protein_g, 100), within(parsed.carbs_g, 100), within(parsed.fat_g, 100), within(parsed.fibre_g, 100), within(parsed.sugar_g, 100), within(parsed.sodium_mg, 40000)].every(Boolean)) throw new MetaApiError(502, "Nutrition estimate was out of range.");
       const basis = parsed.basis.trim();
       return {
         fdcId: 0, description: `Model estimate: ${basis}`, dataType: "Estimate",
         foodNutrients: [...nutrient(1008, "Energy", "KCAL", parsed.calories), ...nutrient(1003, "Protein", "G", parsed.protein_g), ...nutrient(1005, "Carbohydrate, by difference", "G", parsed.carbs_g), ...nutrient(1004, "Total lipid (fat)", "G", parsed.fat_g), ...nutrient(1079, "Fiber, total dietary", "G", parsed.fibre_g), ...nutrient(2000, "Sugars, total including NLEA", "G", parsed.sugar_g), ...nutrient(1093, "Sodium, Na", "MG", parsed.sodium_mg)],
         approximation: { kind: "estimate", basis },
       };
     }, food => ({ text: { source: food ? "estimate" : "unavailable", basis: food?.approximation?.basis ?? null }, fdcId: null }));
   }
   ```
   `gramBasis` is true for the non-Branded `dataType`, `hasNutrition` sees 1008/1003/1004/1005, and `createResponse` records the model call as `spark_identify` (the same as `closest_food` today), so no new `CallKind` or migration for `model_calls` is needed.
3. `src/lib/fdc/nutrients.ts`: replace `  const sourceRef = String(food.fdcId);` with `  // An estimate has no USDA id; its ref names the basis so no reader fetches a record for it.\n  const sourceRef = food.approximation?.kind === "estimate" ? `estimate:${food.approximation.basis}` : String(food.fdcId);`.
4. `src/lib/fdc/match.ts`: add `import { estimateFood } from "./estimate";` below the `./approximate` import; replace
   ```ts
       if(result.food||!options.approximate||!result.baseFood)return result.food;
       return await closestGenericFood(admin,name,caption,result.baseFood,signal);
   ```
   with
   ```ts
       if(result.food||!options.approximate)return result.food;
       const closest=result.baseFood?await closestGenericFood(admin,name,caption,result.baseFood,signal):null;
       return closest??await estimateFood(name,caption,signal);
   ```
5. `src/lib/fdc/approximation-metadata.ts`: replace `export function foodApproximation(row:NutritionSource):{kind:'closest';basis:string}|null{` with `export function foodApproximation(row:NutritionSource):{kind:'closest'|'estimate';basis:string}|null{`; replace `  if(value&&typeof value==='object'&&value.kind==='closest'&&typeof value.basis==='string'&&value.basis.trim()&&value.sourceRef===row.source_ref)return{kind:'closest',basis:value.basis};` with `  if(value&&typeof value==='object'&&(value.kind==='closest'||value.kind==='estimate')&&typeof value.basis==='string'&&value.basis.trim()&&value.sourceRef===row.source_ref)return{kind:value.kind,basis:value.basis};`; replace `export function approximationLabels(items:readonly (NutritionSource & {name:string})[]):{name:string;basis:string}[]{` with `export function approximationLabels(items:readonly (NutritionSource & {name:string})[]):{name:string;basis:string;kind:'closest'|'estimate'}[]{`; replace `  seen.add(key);return[{name:item.name,basis:approximation.basis}];` with `  seen.add(key);return[{name:item.name,basis:approximation.basis,kind:approximation.kind}];`. (`prior-nutrition.ts:25` keeps rejecting every approximation, so an estimated food is re-resolved on each re-analysis.)
6. `src/lib/nutrition/portion.ts`: replace `   if(nutrition.source_ref && (toNumber(prior.portion_grams)<=0 || !hasAmounts)) {` with `   // Only a real USDA id can be fetched again; an estimate rescales from its stored values.\n   if(nutrition.source_ref && Number.isSafeInteger(Number(nutrition.source_ref)) && Number(nutrition.source_ref)>0 && (toNumber(prior.portion_grams)<=0 || !hasAmounts)) {`.
7. `src/lib/pipeline/wording.ts`: replace `export function plainConsumed(totals: ConsumedTotals, approximations: {name:string;basis:string}[] = []): string {` with `export function plainConsumed(totals: ConsumedTotals, approximations: {name:string;basis:string;kind?:'closest'|'estimate'}[] = []): string {`; replace `${approximations.map(a=>` Nutrition for ${a.name} is taken from the closest USDA record, ${a.basis}.`).join("")}` with `${approximations.map(a=>a.kind==='estimate'?` Nutrition for ${a.name} is a model estimate, ${a.basis}.`:` Nutrition for ${a.name} is taken from the closest USDA record, ${a.basis}.`).join("")}`; replace `export async function safeSummary(_text: string, totals: ConsumedTotals, approximations: {name:string;basis:string}[] = []): Promise<string> {` with `export async function safeSummary(_text: string, totals: ConsumedTotals, approximations: {name:string;basis:string;kind?:'closest'|'estimate'}[] = []): Promise<string> {`.
8. `src/lib/worker/jobs/recompute.ts`: replace `` ...labels.map(label=>`Nutrition for ${label.name} is taken from the closest USDA record, ${label.basis}`)].join('. '); `` with `` ...labels.map(label=>label.kind==='estimate'?`Nutrition for ${label.name} is a model estimate, ${label.basis}`:`Nutrition for ${label.name} is taken from the closest USDA record, ${label.basis}`)].join('. '); ``.
9. `src/lib/pipeline/persist.ts`: replace `    if(!previous?.body?.includes(' is taken from the closest USDA record, ')){` with `    if(!previous?.body?.includes(' is taken from the closest USDA record, ')&&!previous?.body?.includes(' is a model estimate, ')){`.
10. Migration `supabase/migrations/0052_estimate_summary.sql`: the complete text of `0051_approximation_summary.sql` with its leading comment changed to `-- Re-analysis and recompute refresh the first model comment for closest-record and model-estimate disclosures alike.` and each of its four `position(' is taken from the closest USDA record, ' in X)>0` replaced by `(position(' is taken from the closest USDA record, ' in X)>0 or position(' is a model estimate, ' in X)>0)` and the one `position(' is taken from the closest USDA record, ' in p_summary)=0` replaced by `position(' is taken from the closest USDA record, ' in p_summary)=0 and position(' is a model estimate, ' in p_summary)=0`. Rollback `supabase/rollbacks/0052_estimate_summary.down.sql`: the complete text of `0051_approximation_summary.sql` unchanged (it re-creates both functions with the old markers). Test `tests/db/estimate-summary.test.mjs`: a copy of `tests/db/approximation-summary.test.mjs` reading 0052 and its rollback, with `label` = `'Nutrition for kerupuk is a model estimate, fried cassava cracker.'`, item name `kerupuk`, `source_ref` `'estimate:fried cassava cracker'` and the same assertions.
11. `tests/food-estimate.test.mjs` (data rule; the pattern of `tests/open-identify.test.mjs`: `globalThis.fetch` stubbed for the Meta responses URL returning `{status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(payload)}]}],usage:{input_tokens:1,output_tokens:1}}` and `https://trace.invalid` for traces): `food:false` → `estimateFood` returns null; a food payload → `scaleNutrition(food, 50).calories` is half the per-100 value, `sourceRef` starts with `estimate:`, `foodApproximation` of the resulting row returns `{kind:'estimate', basis}`, and `plainConsumed` with its label contains `is a model estimate`; a payload with `calories: 5000` → throws `MetaApiError` 502.
12. `scripts/fixtures/food-matching.json`: append `{"name":"cendol","caption":"Indonesian iced dessert drink with pandan jelly, coconut milk and palm sugar","requires":[["cendol","pandan","coconut","jelly","dessert","palm"]],"rejects":[]}`; run `scripts/real-food-match-smoke.mjs` with the real providers and record which step answered for it (`model_calls` source `selected`, `closest` or `estimate`). The ceramic plate fixture must still return unavailable.
13. Apply 0052 to the disposable stack (`npm run test:db`), then to production after its review and before its PR merges; read back that both functions exist and only `service_role` can execute them.

**Blast radius.** Every new or re-analysed food that neither USDA step can serve now carries model numbers, labelled in the meal's first comment ("Nutrition for X is a model estimate, …"), counted in day totals. A wrong estimate shows wrong numbers for that food, named as an estimate. Non-foods stay unavailable. Cup/piece edits on an estimated item return `UNIT_UNAVAILABLE` (no USDA portions), as for label-sourced items. Cost: one model call per such food. **Done:** the three new tests and `npm test` pass; the smoke records the cendol result and the plate still unavailable; 0052 applied and read back on production; a disposable-stack re-analysis of a food with no USDA record (the smoke's own fixture) shows numbers and the estimate sentence.

## 9. Closures, the report, docs

- Close after the merge and the stated check: #551, #552, #553, #542, #543, #544 (tests and page looks), #499 (evidence, item 4.4), #294 (item 6.9, if no UI text remains), #520 (item 6.6 count recorded), #512 (item 6.7).
- Comment with commit-pinned evidence and leave open for the owner's phones or window: #550 (until the owner's window shows 6a), #554, #494, #322 (phone post), #323 and #324 (close if item 6.6 shows the counts at one; otherwise comment the counts), #348, #351, #449, #453, #454, #217 (table posted; dead ones fixed or filed), #555 (rows posted), #471 (headroom posted), #373/#375 (attribution posted), #377, #370, #372, #222, #523 (estimate shipped; the owner's macaroni look remains his).
- #368: comment the prompt's path and that the probe runs outside the fleet.
- `docs/run14-report.md`: items 1–8 done or not done; each PR with its reviewed head, receipt kind and merge commit; P1 and P4 outcomes; the control table; the counts tables; the tick table; the egress and metrics tables; one line per thing noticed and left unfixed; **every backlog issue this run created** (or "none created"). `docs/plan-run14.md` holds this plan unchanged. Docs-only changes go on `run14/docs` and need no review.

## Cleanup and exit

Remove each worktree and local branch once its PR is pushed; delete each remote branch after its merge (and `probe/tick-eager` after its PR is closed); retain the protection-bypass secret permanently; delete every production test post the measurements created, and verify absent; stop local servers and the disposable stack; run `scripts/cleanup.sh`; only the main checkout and the untouched `run13/docs` checkout remain. The run ends.

---

## For the owner (read from the bottom)

**Functionality this plan removes**
- The "* Known nutrition shown…" line under a day in the feed, and the "*" on day totals and calendar cells. The food is still named on each post's own line and in Today; Days keeps its disclosure without the asterisk.
- The "Loading post…" text and the grey square skeleton: replaced by the 7b frame whenever the meal came from the feed.
- Disabled thumbs while a vote saves: the vote saves in the background and extra taps are dropped quietly (7a).
- "Nutrition unavailable" for a real food that USDA does not hold: it now gets a labelled model estimate (your ruling). A non-food still says unavailable.

**Behaviour this plan changes (the default the plan takes)**
- On desktop, if the service worker ever serves the app shell, the page leaves for the real Home once (`?_=…` on the address). On phones the shell stays as it was.
- Below 1148 px wide the Today column hides and the 500 px feed stays centred (the designer's remedy).
- Thumbs down opens the reply box immediately; a save that then fails is reported on the meal page.
- The Post button in the capture sheet waits for the local save acknowledgement (milliseconds) before the sheet closes.
- The browser no longer asks the authentication service who you are on each page; the server tells it through a cookie it set after verifying you. Feed photos are checked by the database's row security instead of a separate authentication call per photo; an expired session gets "not found" instead of "unauthorized" for a photo.
- Today on desktop is drawn from the page the server already read; it refreshes from the server after a post settles or is deleted.
- The open model's two format attempts share one 75-second budget (configurable by `IDENTIFY_OPEN_TIMEOUT_MS`).
- Production measurements sign in as designated test account 2, create a few posts and delete them; one Vercel bypass secret is created for the preview probe and retained permanently for reviewer/coder access, never revoked or removed.
- The recording cap is measured, not raised: at 40 posts per hour per account it is above any recording session, and the measured headroom goes in the report. The limits stay as they are.

**Places where the design and the product's function disagree**
- 7a draws unavailable thumbs at `#C9C5BD`; the nearest token is `faint` (`#B4AFA7`). Default: the token.
- 7a gives each control a 44×44 tap area with the 18 px spacing kept; neighbouring tap areas overlap by 2 px. Default: accepted, the later control wins the overlap.
- The calendar disclosure on Days stays while the feed note goes; the backlog item spoke of the feed only. Default: keep the disclosure.
- The estimate's label lives in the meal's first comment and the trace, like the closest-record label, not as a column in the nutrition table. Default: the comment, through migration 0052's marker.
- #368 is answered by an outside bot through the real form with your plus-addresses, not by the fleet. Default: the prompt in section 7; the cleanup script removes the accounts afterwards.

**Yours, outside this plan**
- The three-phone checks (#379) for #348, #351, #449, #453, #454, #455, #456, #457, #512, #370, #372, #222, #494, #322's phone post, and the macaroni re-analysis look for #523.
- Give the #368 prompt to the bot of your choice, then run the cleanup script or ask a coder to.
- Say when recording starts and ends (the hold stops merges and migrations).
