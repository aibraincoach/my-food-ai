# My Food AI — build plan, Run 7 (the feed that fails to open, open weights, the grayed Facebook button, "Feels fast", worker safety, the judges' README)

You are the coder. Written Tue 2026-11-03 07:30 WIB (00:30 UTC) from the PM's backlog as last edited **07:10 WIB Nov 3**. Code freeze is **23:59 WIB tonight**. Every time is WIB (UTC+7). All work is in `aibraincoach/my-food-ai`. The planner session was opened on `aibraincoach/aibraintrust-io`; nothing is written there.

## Stops: exactly one

**Part 1** (items 0–8) builds every PR, reviews each to `BLOCKERS: NONE`, and posts the head SHAs. It runs to the end with no stop. **The one stop is the merge gate.** `docs/pm-contract.md` and the coder annotation in `docs/planner-contract.md` require a merge order that names one PR and its full head SHA, sent after the planner's evaluation. So Part 1 ends with the report in item 8. **Part 2** (item 9: migrations, merges, production checks) runs when that order arrives. Its steps are fixed here so the order only has to add the SHAs.

**Deadline inside Part 1:** every code PR's head is reviewed clean by **19:00 WIB**. That leaves five hours for the planner's evaluation, the order, the merges and the production checks before 23:59. A PR whose review is not clean by 19:00 is reported as not ready. Nothing waits on it.

## Items (top of plan, build priority)

| # | Backlog | Ships | Lane | Cut if late |
|---|---|---|---|---|
| 0 | — | This plan committed in a new docs PR | coder, first 5 minutes | never |
| 1 | #222, #304, #305 | The feed opens every time; batched reads, a smaller first page, the first photo first, photos and the last feed kept on the phone | A1 + A2 | never |
| 2 | #281 (#288) | Muse Spark Open on Baseten as a real per-account switch on main, model ID logged, eleven-case trial in docs | B | never |
| 3 | Facebook item (unnumbered) | Facebook button grayed out and inert on sign-in and sign-up | C1 | never |
| 4 | #306 (#215 check) | Bookmark, Log again, Edit caption and Delete change at the tap | C1 | 3rd |
| 5 | #307 | Food names on the card before its numbers | D | 2nd |
| 6 | #139, #282 | Lease renewal really renews; USDA 429 waits as asked; clear, retryable failure messages | C2 | 1st |
| 7 | #287, #60 (README part) | README for judges | docs PR, written after items 1–6 have heads | never |
| 8 | — | Part 1 report | coder | never |
| 9 | all | Part 2: migrations, merges, production checks, on the PM's order | coder | — |

## Lanes (parallel agents, named)

Run **seven agents at once**: six build lanes and one review lane, each a separate Codex session or sub-agent in its own worktree and branch. Start all six build lanes in the first 10 minutes. Item 1 is split into two lanes so the feed fix itself runs in parallel. Lane A1 is the server and data half. Lane A2 is the phone half and produces new files only, which A1 calls.

| Lane | Branch / worktree | Items, in order | Files it owns (no other lane edits them) |
|---|---|---|---|
| A1 | `run7/feed-open` in `../my-food-ai-wt/run7-a1` | 1, steps 1–4 and 7 | `src/lib/posts/feed.ts`, `src/lib/posts/days.ts` (`getDayTotals` window only), `src/lib/intake/hydration.ts` (`hydrationTimeline` loop hoist only), `src/lib/nutrition/totals.ts` (new batch function only), `src/app/api/feed/route.ts`, `src/components/Feed.tsx`, `src/app/(tabs)/page.tsx`, `src/app/(tabs)/error.tsx` (new), `scripts/feed-probe.mjs` (new), `docs/media-loading.md` |
| A2 | `run7/feed-phone` in `../my-food-ai-wt/run7-a2` | 1, steps 5–6 | `src/lib/posts/feed-cache.ts` (new), `src/components/useCachedFeed.ts` (new), `src/components/Carousel.tsx`, `public/sw.js`, `src/components/SignOutButton.tsx` |
| B | `run7/open-weights` in `../my-food-ai-wt/run7-b` | 2 | `src/lib/meta/client.ts`, `src/lib/meta/open-weights.ts` (new), `src/lib/meta/spark.ts`, `src/lib/pipeline/analyze.ts` (provider pass-through only), `src/lib/trace/record.ts`, `src/lib/posts/items.ts` (`getPostDetail` only), the post-detail analysis block, `src/app/(tabs)/profile/page.tsx`, `src/app/api/profile/identify-provider/route.ts` (new), `supabase/migrations/0032_identify_provider.sql`, `scripts/open-weights-trial.mjs`, `docs/open-weights.md`, `.env.example` |
| C1 | `run7/facebook-grayed`, then `run7/instant-taps`, each its own worktree and PR | 3, 4 | 3: `FacebookButton.tsx`, both `(auth)` pages. 4: `PostActions.tsx`, `SavedMealListeners.tsx`, `LogAgainSheet.tsx`, `PostMenu.tsx` (caption save only), `PostCaption.tsx`, `DeletePostSheet.tsx` |
| C2 | `run7/worker-safety` in `../my-food-ai-wt/run7-c2` | 6 | `src/lib/queue/lease.ts`, `src/lib/fdc/client.ts`, the worker requeue in `src/lib/worker/`, `PostCard.tsx` (failed branch only), `supabase/migrations/0034_renew_lease.sql` |
| D | `run7/names-first` in `../my-food-ai-wt/run7-d` | 5 | `src/lib/pipeline/pending-items.ts` (new), `src/lib/pipeline/persist.ts`, `PostCard.tsx` (`StatusLine` only), `RealtimePost.tsx`, `supabase/migrations/0033_pending_items.sql` |
| R | sub-agent | review of each code PR as its head is pushed | none |

**A1/A2 contract.** A2 exports `useCachedFeed(userId: string | null): {cached: FeedPost[] | null; save(posts: FeedPost[]): void}` from `src/components/useCachedFeed.ts`, built on `feed-cache.ts`. A1's `Feed.tsx` imports it and does three things: renders `cached` until the fresh page arrives, calls `save` after each fresh first page, and passes `priority={index === 0}` to `Carousel`. A2 adds that prop. A1 writes against these exact names from the start, so neither lane waits for the other. Whichever PR merges second brings main in by merge commit.

**Shared-file contract.** Lane A1 owns `Feed.tsx` and `feed.ts`. Lane C1 item 4's delete restore needs one listener in `Feed.tsx`. Lane C1 dispatches `post-restore {id, post}` and Lane A1 adds the listener, which re-inserts the given post at its `eaten_at` position. Lane D needs `pending_items` in the feed select. Lane A1 adds `pending_items` to the `posts` select in `getFeed` and to `FeedPost`, guarded so a missing column (before 0033 is applied) is not selected. Use `select(...)` without it and read `pending_items` only from `RealtimePost`'s own row read. **Decision:** Lane D reads `pending_items` in `RealtimePost.tsx`'s per-card read, and Lane A1 does not touch it. Lane B and Lane D both touch `analyze.ts`/`persist.ts` at different functions: B changes only `analyzePost`'s call to `identifyMeal`, and D changes only `persistAnalysis` plus one call after `identifyMeal`. If GitHub reports a conflict, bring main in by merge commit. A refresh that has no code change of its own merges without a new order (owner, Nov 2 23:21).

---

## Facts checked by the planner (with the check)

- **Main** is `26242040e5b657e2fec20eb4af4efb682fc94a3c` (#302 merged 2026-11-02 17:12:40Z). `git fetch --depth=50 origin main` at 00:21 UTC Nov 3 showed no later commit, and the GitHub commit search for commits after 20:00Z returned nothing.
- **No PR is open.** GitHub search `repo:aibraincoach/my-food-ai is:pr` (00:25 UTC) lists #302, #295 and #301 closed at 17:17Z. #295 merged as `d559ce0` at 17:12:14Z. There is no `run7/*` branch on origin.
- `ls supabase/migrations`: last is `0031_agent_tokens.sql`. **Next numbers: 0032 (item 2), 0033 (item 5), 0034 (item 6).**
- **The backlog's #222 text (07:10 WIB), verbatim:** "On Nov 3 the coder opened the feed on production at 2624204 a hundred times under control: 3 showed server errors (digest 3642131196) and 15 more had no feed after 45 seconds, all on the larger feed, and the last 12 openings all failed. The owner's blank open on Nov 2 at about 17:00 WIB came before Run 6 merged, so Run 6 did not start it. The runtime logs still return 403 for the coder. Done when the feed opens every time in a hundred controlled openings on the largest test account, the first photo of the feed shows within two seconds on a phone over mobile data, the feed shows something within two seconds of opening the app, and the sizes and times before and after are in docs."
- **The feed path on main.** `src/components/Feed.tsx` is client-side and calls `supabase.auth.getUser()` and then `getFeed`. Each post goes through `src/lib/posts/feed.ts` `toFeedPost` (line 92), which runs in sequence: `feedback_revision` RPC, a `post_media` select, one `createSignedUrl` per slide, `getCurrentItems`, a `saved_meals` select, and `feedback_revision` again. `getFeed` maps 20 posts (`FEED_PAGE_SIZE`), then hydration and day totals. That is roughly 6 × 20 + slides + 2 requests from the phone to Supabase for one open. `src/app/(tabs)/page.tsx` server-renders `HomeDays` (`getLoggedDates`/`getDayTotals`). There is no `error.tsx` anywhere under `src/app`. A Next.js digest such as 3642131196 is what a server component throw shows without one.
- `public/sw.js`: cache `my-food-ai-shell-v1`, network-first for navigations only, no `activate`, no image caching. Feed `<img>` (`Carousel.tsx:21`) has no `loading`, `decoding` or `fetchpriority`.
- **Open weights.** `src/lib/meta/client.ts:20` has one base URL and key for SAM, Spark and transcription. Spark calls `POST /responses` through `createResponse`. `src/lib/meta/spark.ts:108-164` `identifyItems` sends `model "muse-spark-1.3"`, `reasoning {effort:"low"}`, `instructions`, `input` (`input_text` + `input_image` data URLs), strict `json_schema` named `identify`, and `max_output_tokens 8192`. Its only caller is `identifyMeal` (`src/lib/pipeline/analyze.ts:143`). `model_calls` has no model or host column (`src/lib/trace/record.ts`).
- Baseten facts from public pages, not tested with a key: base URL `https://inference.baseten.co/v1`, OpenAI-compatible, `/v1/chat/completions`; model ID `meta-models/muse-spark-open-1026` (the backlog and several hackathon repos); a public repo quotes $1.25/M input and $4.25/M output tokens; hackathon repos quote the guide saying the bonus is verified by the inference partner; the Muse licence asks for a visible "Built with Muse Spark Open".
- **Facebook.** `src/components/FacebookButton.tsx` calls `signInWithOAuth({provider:"facebook"})`. Both auth pages render it only when `NEXT_PUBLIC_FACEBOOK_LOGIN === "1"`.
- **Taps.** `SavedMealListeners.tsx`'s Save meal handler re-reads `/api/saved`, then POSTs or DELETEs, then re-reads and calls `router.refresh()` before the icon changes. Log again opens its sheet only after a GET. `ThumbsFeedback.tsx` is already optimistic (`feedback-optimistic.ts`).
- **Pipeline.** `persistAnalysis` writes items and nutrition in one RPC at the end, and posts go `queued` → `ready`.
- **Lease.** `src/lib/queue/lease.ts:23` `renewLease` just calls `try_acquire_worker_lease` (0001 line 143, redefined 0007b line 113).

## Premises (unchecked; verify before acting; the report says which were false)

- P1. The Baseten key is in the sole local credential store on the OCI box. The owner says he gave it to the coder. It never enters the repo, an issue, a PR or a log.
- P2. Baseten serves `/v1/chat/completions` for this model. Image input, `response_format: json_schema` and `/v1/responses` are unknown. Item 2 probes them.
- P3. Muse Spark Open always reasons (backlog). Reasoning comes back as `message.reasoning_content` or inside `<think>…</think>`, and the output cap includes it.
- P4. `storage.from("media").createSignedUrls(paths, ttl)` exists in the installed `@supabase/supabase-js`.
- P5. A merge to `main` deploys production through Vercel's Git integration. The Vercel token in `.env.local` can set env vars.
- P6. **The coder may hold an unpushed `feed.ts` change made at about 07:04 WIB.** It is not on GitHub (facts above). If it exists, it is Lane A1's starting point (item 1 step 1). If not, Lane A1 starts from main.
- P7. The "last 12 failed" pattern (failures cluster at the end of a run) suggests a rate limit or exhausted resource under many requests per open, such as Supabase Storage signing, Auth `getUser`, or PostgREST. This is a hypothesis. Item 1 step 2 tests it.

## Run rules

- **Worktrees.** `git worktree prune` first and remove any leftover `run6` worktree. Every branch is cut from `origin/main`, and nothing is stacked. Remove each worktree and local branch once its PR is pushed. Delete each remote branch after its merge (Part 2). `scripts/cleanup.sh` runs last.
- **Checks per code PR on its final head:** `npx tsc --noEmit`, `npm run lint`, `npm run build`, the header command of every test file the PR adds or touches, `npm run test:db` when it adds a migration, and `tests/wording.test.mjs` when it adds user-facing text. Item 2 also runs `scripts/real-identify-smoke.mjs --real-meta` because it changes the model client. Paste each command with its exit code in the PR body.
- **Review lane R.** One external reviewer per code PR, started the moment its head is pushed, never blocking a build lane. You are Codex, so Codex is ineligible. Route: PPLX (`skills/pplx-review`, `docs/pplx-review-procedure.md`, all four routes), then AGY (`bash scripts/run-agy-pr.sh <PR>`). If neither runs, that PR's review is the first legal halt for that PR only; retry once when the next PR's review starts. Run to `BLOCKERS: NONE`; the same reviewer confirms fixes. Captures and triage go under `docs/reviews/` per `REVIEW_POLICY.md`. The docs PR gets no review.
- **Legal halts only:** a review tool unavailable when reached; a fact in this plan proves false; an operation would contact a customer or breach a prohibition. A halt stops only its own item.
- **Claims rule unchanged:** consumed, past tense; no target, goal, ring, percentage, or "left" for an amount.
- **No customer contact.** Production checks use the two test accounts only.
- **New environment variables, item 2 only:** `IDENTIFY_OPEN_API_KEY`, `IDENTIFY_OPEN_BASE_URL`, `IDENTIFY_OPEN_MODEL`. Add the names empty to `.env.example`. Values are set in Vercel production and preview in Part 2.

---

## 0. The docs PR (first 5 minutes)

Cut `run7/docs` from `origin/main`. Commit this file unchanged as `docs/plan-run7.md` and open the PR "docs: Run 7 plan". This is the one open docs PR. No other docs PR is open (fact above). Item 7's README lands on this same branch. It merges last, in Part 2.

## 1. #222, #304, #305 The feed opens every time and opens fast (Lanes A1 and A2: steps 1–4 and 7 on `run7/feed-open`, steps 5–6 on `run7/feed-phone`)

**Step 1 — start point.** If P6's local 07:04 `feed.ts` change exists, commit it as the first commit on this branch with its own message, and note in the PR body what it changed. Then continue. If it does not exist, start from main.

**Step 2 — find the failure (no stop; about 45 minutes, capped).** The runtime logs return 403, so measure from outside.
- New script `scripts/feed-probe.mjs`, run as `node --import tsx --env-file=.env.local scripts/feed-probe.mjs --runs 100 --user 1`. It signs in as the test account with the most posts (`scripts/lib/session.mjs`; read both accounts' post counts first and use the larger).
- Each run calls the same code path the browser runs (`getUser` then `getFeed(…, zone)`) against production Supabase. It wraps every sub-call (each RPC, each select, each `createSignedUrl`, hydration, day totals) in a timer that records name, ms, HTTP status and error text.
- The script prints a table:
  - per sub-call: count, p50, p95, max, failures by status;
  - per run: total ms and the first failing sub-call;
  - the run number where failures start.
- It also fetches `GET /` on production with the session cookie 100 times and records status and whether the body contains a digest.
- Write the table as the "Before" section of `docs/media-loading.md`.
- If the first failing sub-call is one family (for example `createSignedUrl` 429/400, or Auth 429), name it in the PR body as the cause. If none dominates, write "cause not isolated" and proceed. Steps 3–5 cut every request family whatever the cause.

**What the Nov 3 code investigation established** (supplied by the owner, read-only, logs 403, so code evidence only):
- An opening runs two independent reads. The server's `HomeDays()` (`page.tsx:13`) is the only path that can produce a digest, so the 3 digest-3642131196 opens threw there. The client's `load()` (`Feed.tsx:169`) calls `getFeed` directly; staying on "Loading feed…" past 45 s means its promise never settled (hung requests), which matches the 15 no-feed opens.
- `toFeedPost` issues about 7 sequential reads per post, with `feedback_revision` read twice, across 20 posts in one `Promise.all` (`feed.ts:156`). That is about 120–160 concurrent requests from one browser over roughly 6 connections per host. On top of that, `hydrationTimeline` (`hydration.ts:56`) re-scans per local day and `getDayTotals` (`days.ts:131`) scans the day window.
- **The growth mechanism:** `refreshTotals` (`Feed.tsx:65`) collects every loaded date, and `getDayTotals` builds one window from the earliest to the latest (`days.ts:135`). So each card event re-scans the whole loaded span in 1000-row pages.
- `getPostHydrationData`'s `missing` branch is dead on the feed path. `sw.js` cannot delay feed data. No statement-timeout evidence exists in the repo. Per-query plans are index-backed, so **request count and window span are the shown problem.**

**Step 3 — collapse the reads (service, `feed.ts`), in this order:**
- **3a.** **Move the first load behind `/api/feed`.** `Feed.tsx`'s `load()` calls `fetch('/api/feed?limit=6&tz=…')` with `AbortSignal.timeout(15000)` instead of `getFeed` in the browser. `src/app/api/feed/route.ts` exports `maxDuration = 20`. A hang becomes an error with Try again and a server log line `feed read <stage> <ms>` for each stage, so the next diagnosis has timings.
- **3b.** **One embedded query per page.** `getFeed` selects `posts` with embedded `post_media(id,storage_path,kind,not_eaten,position)`, `current_post_items(…, item_nutrition(…))` and `saved_meals!source_post_id(id)`, in the same embedded pattern `getDayTotals`/`getMonthSummary` already use (`days.ts`). It is one PostgREST request for the page. Map the rows with `getCurrentItems`'s row mapping, factored into an exported `mapCurrentItems(rows)` in `totals.ts`. The `post_items` ancestor read that `getCurrentItems` sometimes does stays, batched once per page for only the posts that need it.
- **3c.** **Read `feedback_revision` once per ready post**, and drop the second read. If the embedded read and the revision disagree in a later card event, the existing per-card `RealtimePost` re-read corrects it.

**Step 3 continued — batch what remains** with `toFeedPosts(supabase, rows, zone)`:
- one `post_media` select `.in("post_id", ids)`;
- one `createSignedUrls` call over every slide path (P4; if it is absent, `Promise.all` over the existing `feedCopyUrl`, which uses its five-minute cache);
- one `current_post_items` read for all ready ids, through a new `getCurrentItemsForPosts(supabase, ids): Promise<Map<string, CurrentItem[]>>` in `src/lib/nutrition/totals.ts` that uses `getCurrentItems`'s row mapping;
- one `saved_meals` select `.in("source_post_id", ids)`;
- the `feedback_revision` before/after pairs, all in one `Promise.all`, keeping the same per-post comparison.

Every sub-read gets an 8-second `AbortSignal.timeout`. A failure of the media, saved, revision or hydration read degrades only that field: no photo URL, `saved_meal_id null`, no fingerprint, no hydration. The feed still renders. Only the `posts` select failing fails the feed.

`getFeed(…, limit = FEED_PAGE_SIZE)` gains a limit. `/api/feed` accepts `limit` from 1 to 20. `Feed.tsx`'s first load asks for **6**, and later pages ask for 20. Add `limit` and degraded-read cases to `tests/feed-pagination.test.mjs` and keep `tests/feed-nutrition.test.mjs` passing.

**Step 3d — bound the growth.**
- `refreshTotals` in `Feed.tsx` passes only the days touched by the event (the card's own day, plus its old day when `eaten_at` moved) instead of every loaded date.
- `getDayTotals` takes a list of days and queries each requested day's window, or one window when the days are contiguous. It never spans the gaps between them.
- `hydrationTimeline` hoists its posts, intake-links, items and nutrition reads out of the per-day loop: one read each over the requested days, grouped in memory.
- Add a case to `tests/days-range.test.mjs`: two requested days a month apart read two windows, not the month.

**Step 4 — the page never shows a digest (boundary).**
- New `src/app/(tabs)/error.tsx` (client component, Next's `error`/`reset` props). It shows the 3a title bar and "The feed could not be loaded." with a "Try again" ink pill that calls `reset()`. It shows no digest.
- In `src/app/(tabs)/page.tsx`, wrap `HomeDays`'s and `NeedsInputStrip`'s data reads in try/catch: on error, `HomeDays` renders the empty seven-day row and the strip renders nothing. A failed day-total read must never take down Home.

**Step 5 — open on the last feed (#304), Lane A2.**
- New `src/lib/posts/feed-cache.ts` (client): `readFeedCache(userId)` and `writeFeedCache(userId, {posts, savedAt})` in `localStorage` key `mfa-feed:<userId>`, first page only, every access in try/catch. `clearFeedCache()` removes all `mfa-feed:` keys.
- `Feed.tsx` first load:
  - Get the user id from `supabase.auth.getSession()`, which is local and needs no network. Render the cached posts at once.
  - Then run `getUser()` and `getFeed(…, 6)`. Replace posts by id and prepend new ones. Keep each card's mounted `<img>` when its id persists, so nothing jumps.
  - Write the fresh page back to the cache. A cached signed URL that fails to load is replaced by the fresh one.
- `SignOutButton.tsx` calls `clearFeedCache()` and posts `{type:"clear-media"}` to the service worker before signing out. Signed-in HTML is still never cached.

**Step 6 — first photo first, photos kept (#305), Lane A2.**
- `Carousel.tsx` gains a `priority?: boolean` prop. The first card's first slide gets `fetchPriority="high" loading="eager" decoding="async"`, and every other image gets `loading="lazy" decoding="async"`. All get `width={1080} height={1080}`. `Feed.tsx` passes `priority` to index 0.
- `public/sw.js`:
  - Rename the cache to `my-food-ai-shell-v2` and call `self.skipWaiting()` in install.
  - Add an `activate` handler that deletes caches other than `my-food-ai-shell-v2` and `mfa-media-v1`, then calls `clients.claim()`.
  - New fetch branch: a `GET` whose path contains `/storage/v1/object/sign/media/` and ends in `.feed.jpg` is served cache-first from `mfa-media-v1`, keyed by origin plus path without the query string. On a miss it fetches, stores a 200, and trims to the newest 300 entries. Card PNGs are not cached, because a correction regenerates them.
  - A `message` handler for `{type:"clear-media"}` deletes `mfa-media-v1`.

**Step 7 — after numbers.** Re-run `feed-probe.mjs --runs 100` on a Vercel preview of the head, against the production database, and add the "After" table to `docs/media-loading.md`. Measure the first decoded feed image in Chrome emulation at 390×844 (1.6 Mbit/s down, 750 kbit/s up, 150 ms latency), cold and warm, signed in with `scripts/browser-session.mjs`. Also measure the time to the first card on a second open. Record bytes and times.

**Done (Part 1)** when the preview's 100 runs all open, the first card shows within two seconds on the emulated profile, a second open shows the cached feed at once, and the tables are in docs. The 100-on-production run is Part 2. The phone over mobile data is the owner's (#285).
- **Blast radius:** a wrong batch mapping puts items on the wrong card (the tests guard it). A broken service worker branch is retired by its cache rename. The stale feed cache is cleared on sign-out, so no other account's feed shows.
- **Service:** `toFeedPosts`, `getCurrentItemsForPosts`, `feed-cache.ts`. **Boundary:** `Feed.tsx`, `/api/feed`, `error.tsx`, `page.tsx`, `sw.js`.

## 2. #281 Muse Spark Open identifies the food through Baseten (Lane B, branch `run7/open-weights`)

**Goal.** A real, switchable path on main runs identify-and-portions on Muse Spark Open through Baseten. SAM 3.1 and transcription stay on the Meta API. The USDA lookup is unchanged. Every identify call's model ID is stored and shown. The eleven-case trial is in docs for at most $5. Production behaviour changes only for an account that turns the switch on, so "changes nothing in production" holds for everyone else.

**Step 1 — probe (no stop).** Put the P1 key in `.env.local` as `IDENTIFY_OPEN_API_KEY` and run three `curl` calls. Paste the status and response shape (never the key) into the PR body:
1. `GET https://inference.baseten.co/v1/models`. Use the listed ID containing `muse-spark-open` as `IDENTIFY_OPEN_MODEL`, preferring `meta-models/muse-spark-open-1026` when listed.
2. `POST /v1/chat/completions` with a text part and an `image_url` part (eval photo 01 as a data URL), `response_format: {type:"json_schema", json_schema:{name:"probe", strict:true, schema:{type:"object", properties:{food:{type:"string"}}, required:["food"], additionalProperties:false}}}`, and `max_tokens 4096`.
3. The same request in Responses format to `POST /v1/responses`.

Decisions:
- **Transport:** chat completions. Use Responses (and reuse `readResponseOutput`) only if call 2 fails and call 3 succeeds.
- **Structured output:** if `json_schema` is refused, use `response_format {type:"json_object"}` and append `Return only one JSON object that matches this JSON Schema:\n` + `JSON.stringify(identifySchema)` to the instructions. `parseIdentifiedMeal` still validates.
- **Images:** if they are refused, the open path serves caption-only identify, and photos stay on Meta. Record this in the PR, the docs and the Profile line.
- **401/403:** the second legal halt for item 2 only. Write it on #288 without the key. Every other lane continues.

**Step 2 — adapter (service), `src/lib/meta/open-weights.ts`:**
- `openWeightsConfigured()` is true when `IDENTIFY_OPEN_API_KEY` is set.
- `openIdentifyModel()` returns `IDENTIFY_OPEN_MODEL || "meta-models/muse-spark-open-1026"`.
- `openBaseUrl()` returns `IDENTIFY_OPEN_BASE_URL || "https://inference.baseten.co/v1"`.
- `createOpenResponse(body)` converts the Responses-shaped body that `identifyItems` builds:
  - `instructions` becomes a `system` message;
  - `input_text` becomes `{type:"text"}`;
  - `input_image` becomes `{type:"image_url", image_url:{url}}`;
  - `text.format` becomes `response_format` (or the fallback);
  - `max_tokens` is 16384, because reasoning counts against it;
  - `reasoning` is dropped;
  - `model` is `openIdentifyModel()`.
- Factor `metaFetch`'s retry loop into `fetchWithRetry(url, init, timeoutMs, key)` in `client.ts`, used by both, with the same 429/5xx rules, `IDENTIFY_TIMEOUT_MS` and `workerDeadlineSignal`.
- Map the reply back to `ResponseOutput`:
  - `finish_reason stop` becomes `completed`, and `length` becomes `incomplete`;
  - `outputText` is the outermost `{…}` of `content` after removing any `<think>…</think>`;
  - `refusal` is set from `message.refusal`;
  - `usage` is mapped from `prompt_tokens`/`completion_tokens`.
- Wrap the call in `recordCall("spark_identify", …, {model, host:"baseten"})`.

**Step 3 — switch (boundary).**
- `0032_identify_provider.sql`:
  - `alter table public.profiles add column identify_provider text not null default 'meta' check (identify_provider in ('meta','open'));`
  - an owner update policy limited to that column, with the 0030 `only_*_changes` trigger pattern;
  - `alter table public.model_calls add column model text, add column host text;`
- `recordCall` gains an optional fifth argument `{model, host}`, defaulting to `{model: body.model ?? null, host: "meta"}`. Every existing caller is unchanged.
- `identifyItems` gains a final parameter `provider: "meta" | "open" = "meta"`. `analyzePost` reads the owner's `identify_provider` with the service client and passes it through `identifyMeal`.
- **Fallback:** any open-path error, refusal or validation failure is recorded with its error, logs `open identify failed; using Meta`, and re-runs on Meta. A post never fails because of Baseten.
- **Visible model:** `getPostDetail` reads the post's latest `spark_identify` row with `error is null`. The analysis block shows a 12 px muted line under the totals: `Identified by Muse Spark Open (<model id>) · Built with Muse Spark Open`, or `Identified by Muse Spark 1.3`.
- **Profile row,** under the Connect-an-agent row, shown only when `openWeightsConfigured()`:
  - label `Identify food with Muse Spark Open`;
  - sub-line `Meta's open-weight model, served by Baseten. Built with Muse Spark Open.`, plus ` Used for meals logged without a photo.` when images were refused;
  - a switch that PATCHes the new `/api/profile/identify-provider` (cookie session, body `{provider}`).

**Step 4 — trial.** `node --import tsx --env-file=.env.local scripts/open-weights-trial.mjs`:
- For the ten `eval/photos` and the caption `I ate half the rice`, run SAM once on Meta, then `identifyItems` with `"meta"` and with `"open"` on the same regions, then resolve both through the existing FDC path.
- Record per case: items, grams, kcal, unavailable foods, seconds, tokens and model ID. Score names against `eval/expected.json` with `scripts/eval.mjs`'s scorer.
- Stop before a call that would take open spend past $5.00, at the public prices above or the Baseten console's prices if shown.
- Write `docs/open-weights.md`: the switch, the env names (never values), probe results, the table, the cost, and the limits (eleven cases, one run each, estimates).
- Loosen `real-identify-smoke.mjs`'s and `tests/fake-meta/server.mjs`'s model and origin guards only as far as the new test needs.

**Tests** (`tests/open-identify.test.mjs`):
- request mapping;
- `<think>` stripped;
- `length` mapped to incomplete;
- fallback to Meta on a 500 from a local `http` server;
- `identify_provider` defaults to `meta`;
- user 2 cannot update user 1's column (`tests/db` helpers);
- the 0032 SQL text.

**Done (Part 1)** when the trial table is in docs and the test passes. The owner seeing it on production is Part 2.
- **Blast radius:** the fallback keeps posts on Meta, and accounts with the switch off are untouched.

## 3. The Facebook button is grayed out and does nothing (Lane C1, branch `run7/facebook-grayed`)

`FacebookButton.tsx`:
- Remove the `createClient` import and `onClick`.
- Render `<Button variant="secondary" disabled aria-disabled="true" className="… opacity-50 cursor-not-allowed">` with the "f" mark and `Continue with Facebook`.
- Under it, add one 13 px muted line: `Facebook sign-in is coming soon.`

Both auth pages always render it. Delete the `FACEBOOK_LOGIN` constant and the conditional. Leave `auth/callback` and the Supabase provider untouched. No test is needed (layout). One page look at 390×844 per page, with differences listed on the PR.

**Done** when both pages show the grayed button, a tap sends no request, and no error shows.

## 4. #306 Every tap that saves shows its result at once (Lane C1, branch `run7/instant-taps`)

- **Bookmark:**
  - `PostActions.tsx` keeps a local `saved` state seeded from `post.saved_meal_id`, flips it at the tap, and dispatches `save-meal {postId, savedMealId}`.
  - The `save` handler in `SavedMealListeners.tsx` DELETEs `savedMealId` when present and POSTs when absent, with no first list read.
  - On failure it dispatches `save-meal-failed {postId}`. `PostActions` reverts, and the existing error toast shows.
- **Log again:** the `log-again` event carries the card's caption, items and first slide URL. `again` opens `LogAgainSheet` at once with them and `loading: true`, then fills in the GET's answer. Post stays disabled until the GET returns.
- **Edit caption:** `PostMenu.tsx`'s save dispatches `post-caption {id, caption}` before the PATCH. `PostCaption.tsx` shows the text at once and reverts with the error line on failure.
- **Delete:** `DeletePostSheet.tsx` dispatches `post-deleted {id}` before the DELETE and closes. On failure it dispatches `post-restore {id, post}` with the toast `The post could not be deleted.` Lane A1's listener re-inserts the post.
- **Test:** `tests/save-optimistic.test.mjs` covers the bookmark state machine (tap, fail, revert), in the pattern of `feedback-optimistic.test.mjs`.
- **Done** when each of the four changes the screen before the server answers on the slow profile, the saved state survives a reload, and a failed save is shown.

## 5. #307 Food names before numbers (Lane D, branch `run7/names-first`)

- **`0033_pending_items.sql`:** `alter table public.posts add column pending_items jsonb;` Only the service role writes it, and no update policy is added.
- **`src/lib/pipeline/pending-items.ts`:** `writePendingNames(admin, postId, names)` and `writePendingKcal(admin, postId, index, kcal)`, one write per food.
  - Call the first right after `identifyMeal` returns in the analyze job, with region and caption-only names in order.
  - Call the second in `persistAnalysis` as each item's FDC resolution settles.
  - `markReady` and the failed and needs-input paths set `pending_items = null`.
- **`RealtimePost.tsx`** reads `pending_items` in its per-card row read. `PostCard.tsx` `StatusLine` keeps "Processing, traffic X". When names exist, it replaces the shimmer bars with one row per food: the name (15) and its `<kcal> kcal` (13 muted) or a short shimmer. No total shows until ready.
- **Test** (`tests/pending-items.test.mjs`): the 0033 SQL, ready clears the column, and a second user cannot read it (posts RLS unchanged).
- **Done** when a post on a preview shows names before totals and no total before all foods are calculated.

## 6. #139 and #282 Worker safety (Lane C2, branch `run7/worker-safety`)

- **#139:**
  - `0034_renew_lease.sql` adds `public.renew_worker_lease(p_holder text, ttl_seconds int) returns boolean`. It extends the lease row held by `p_holder` to `now() + ttl_seconds` (column names read from 0007b line 113) and returns false when none matched.
  - `renewLease` calls it and throws `ioError` on false.
  - `tests/db/lease-renew.test.mjs`: acquire with ttl 2, renew with ttl 10, wait 3 s; another holder's acquire returns false.
- **#282:**
  - `src/lib/fdc/client.ts`: on 429, read `Retry-After` (seconds or date). At 60 s or less, wait once inside the call and retry. Above that, throw `FdcRateLimited` with the seconds. The worker requeues the job at `now() + seconds` instead of its 30/60 s ladder.
  - The failed-post card shows `The food database was busy. Try again in a minute.` for a USDA failure, or `The analysis service refused this request. Try again.` for a Meta refusal. This comes from the worker's stored failure reason, or a new `posts.failure_reason text` in 0034 when none is stored.
  - Test: `tests/fdc-retry-after.test.mjs`, where a local server answers 429 `Retry-After: 2` and then 200.
- **Done** when both tests pass and a USDA 429 waits as asked.

## 7. #287 and #60 README for judges (docs PR `run7/docs`, after items 1–6 have heads)

Rewrite `README.md` in start-here form. Every claim links to its evidence. It carries no host names, account IDs, billing or personal data.
1. **What it does.** Log a meal by photo, caption or voice and see what was consumed. It records only, and gives no advice, targets or health claims.
2. **Meta models.**
   - SAM 3.1 for segmentation (`src/lib/meta/sam.ts`).
   - Muse Spark 1.3 for identify, portions, corrections, labels and matching (`src/lib/meta/spark.ts`).
   - Muse Voice Transcribe 1.0 (`src/lib/meta/transcribe.ts`).
   - Muse Spark Open on Baseten, the switchable identify path (`src/lib/meta/open-weights.ts`, `docs/open-weights.md`), with "Built with Muse Spark Open".
   - Model IDs are in `model_calls.model`.
3. **Reproduce the open-weights path:** set the three env names and turn on the Profile switch.
4. **Evidence:** this run's test commands and counts, `docs/eval.md`, `docs/production-performance.md`, `docs/media-loading.md`, `docs/agents.md`, and the item history that keeps every correction.
5. **Local start:** the existing steps.

Remove no working files. The #60 keep-list is the owner's (#303).

## 8. Part 1 report (end of Part 1)

Post it as a comment on the docs PR and as the reply. For items 0–7 it gives:
- done or not done;
- PR number, full head SHA, checks with exit codes, reviewer and verdict link;
- false premises;
- item 1's before/after tables and named cause;
- item 2's probe results and trial cost.

It ends with the merge list in ascending PR number, each with its head SHA and migration. Run `scripts/cleanup.sh`. This is the one stop.

## 9. Part 2 — on the PM's merge order (fixed now)

1. **Migrations** with `psql "$SUPABASE_DB_URL" -f`, each just before its PR merges: 0032 for item 2, 0033 for item 5, 0034 for item 6. None depends on another. Show `\d profiles`, `\d posts` and the function after each.
2. **Vercel env vars** before item 2 merges: `IDENTIFY_OPEN_API_KEY`, `IDENTIFY_OPEN_MODEL` and `IDENTIFY_OPEN_BASE_URL`, set in production and preview.
3. **Merge** in ascending PR number with `--match-head-commit <ordered SHA>`, as merge commits. A PR GitHub reports as conflicting is brought up from main by merge commit. A refresh with no code change of its own merges without a new order. A refresh with a code change gets the same reviewer's confirmation first.
4. **Production checks** after each deploy, as the test accounts at 390×844. Evidence lines (numbers and IDs, never the account) go on each issue:
   - #222: `feed-probe.mjs --runs 100` against production, which must be 100/100, plus the first-card time.
   - #304/#305: cached open and second-visit photos.
   - #281: switch on, a caption-only "I ate half the rice" and one eval photo post, the detail line showing the open model ID, then switch off.
   - The Facebook button on both pages.
   - #306 and #215: the four taps and the thumbs.
   - #307: names before totals.
   - #139/#282: test outputs.
5. **Defects:** one found before 23:59 is fixed from main in a PR and reviewed. After 23:59 it goes on the issue and nothing is merged.
6. **Last:** the docs PR merges last, `scripts/cleanup.sh` runs, and only the main checkout remains.

## Blast radius

| Item | If it fails | Beyond itself |
|---|---|---|
| 1 | The feed still fails to open on the larger account | Feed read shape, service worker caches, `localStorage` per user |
| 2 | No bonus path; Meta unchanged | Two `model_calls` columns, one `profiles` column, three env vars |
| 3 | Button hidden or live | Two auth pages |
| 4 | Taps wait | Window events |
| 5 | Shimmer until ready | One worker-written column |
| 6 | Lease and USDA unchanged | Worker requeue timing |

## Backlog items not in this run, and why

| Items | Reason |
|---|---|
| #288, #285, #26, #303 | The owner's own tasks; no code. |
| #289, #290, #291 | The designer's frames; no reply yet. |
| #292, #212, #274, #275, #227, #169, #168 | Built and merged in Run 6. What remains is the owner's phone or production checks, not code. |
| #189, #226, #230 | Waiting on the owner's acceptance of totals; no code change identified. |
| #273 | Defects fixed in Run 5; the original zero does not reproduce; waits on the owner. |
| #272 | Needs a matching-policy change plus a new food-quality and load gate, which the remaining hours cannot carry safely before recording. The owner can keep the affected foods out of the demo. |
| #228 | Needs a read-and-report first; lower demo risk than items 1–6. Next run. |
| #65, #66 | Test-infrastructure items with no visible effect for judges. #66's settings already sit explicitly in `client.ts` (fact above). Next run. |
| #223 | Edit caption already exists in `PostMenu.tsx` (agent read of main). Only the owner's production check remains; item 4 makes it instant. |
| #294 | Needs the owner's ruling on each term before code. |
| #192 | Run 6's #299 evidence showed the photo loads once on production. Owner check. |
| #107, #175, #224, #283, #18, #20, #29, #23 | Each is small but none is on the demo's failure path. Cut to protect the 19:00 review deadline. Next run. |
| #216, #221, #22, #108 | Need a real phone or a real second device to observe first. The owner's #280 checklist. |
| #2, #3, #11, #6, #193, #217 | Restyle and page-look passes across every screen, too large for the hours left. #217 also needs the owner's phone list. |
| #279 | Needs the Supabase dashboard's Auth settings read and a hammering script against production Auth. That risks locking out the demo accounts the day before recording. Next run. |
| #114, #115, #218 | Blocked (Meta app review; scope; claims rule). |

## Cleanup

Leftover worktrees are removed before the first PR. Each worktree and local branch is removed once its PR is pushed. Remote branches are deleted after merge. Trial outputs outside the repo are deleted. `scripts/cleanup.sh` ends Part 1 and Part 2. At the end only the main checkout remains, and nothing temporary is running.

---

## For RT's eyes (last; read from the bottom)

1. **One stop.** The plan builds and reviews everything, then waits once for the PM's merge order naming each SHA, because the contract requires it. Default: heads reviewed by 19:00 WIB.
2. **The feed opens on what the phone saw last** and refreshes behind it. It is erased on sign-out. Default: kept.
3. **The first feed load is 6 posts,** and more load on scroll. Default: 6.
4. **When a part of a card fails to load** (photo, bookmark state, water line), the card shows without it instead of the whole feed failing. Default: degrade.
5. **Home shows "The feed could not be loaded." with Try again** instead of an error code. Default: as stated.
6. **Open weights are per account and off by default.** A Profile switch sends that account's identify step to Muse Spark Open on Baseten. Default: off; turn it on for the recording account to show it.
7. **If Baseten fails mid-post, Muse Spark 1.3 takes over,** and the detail line names the model used. Default: fall back.
8. **If Muse Spark Open will not take photos,** the switch covers caption-only meals and says so. Default: as stated.
9. **"Built with Muse Spark Open" shows** on the Profile row and on posts it identified, as its licence asks. Default: shown.
10. **Trial spend is capped at $5.** Default: stop at $5.
11. **The Facebook button is grayed out for everyone,** with "Facebook sign-in is coming soon." The flag no longer hides it. Default: as stated.
12. **Taps change at once and undo on failure.** A failed delete brings the card back with a message. Default: as stated.
13. **Cut order if late:** worker safety first, then names-first, then instant taps. The feed fix, open weights, Facebook and the README are never cut.