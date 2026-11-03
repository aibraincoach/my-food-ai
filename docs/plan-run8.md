# My Food AI — build plan, Run 8 (database quota, sign-up protection, spending caps, the review findings)

You are the coder. Written Tue 2026-11-03 11:05 WIB (04:05 UTC) from the backlog on main (owner-supplied snapshot **10:42 WIB**, commit `784d4a8`). Code freeze is **23:59 WIB tonight**. Judging runs Nov 4–8. Every time is WIB (UTC+7). All work is in `aibraincoach/my-food-ai`.

## Before anything else: the hCaptcha site key

The owner's hCaptcha site key is in .env.local as NEXT_PUBLIC_HCAPTCHA_SITE_KEY; the secret is stored only in Supabase Auth.

Before item 0 commits this plan, replace everything from `<!-- KEYS-START -->` to `<!-- KEYS-END -->` inclusive with the single line `The owner's hCaptcha site key is in .env.local as NEXT_PUBLIC_HCAPTCHA_SITE_KEY; the secret is stored only in Supabase Auth.` That replacement is the only change item 0 makes to this file.

## Stops: zero

**This plan is the merge order for its eight code PRs** (owner, Nov 3 ~11:10 WIB, in reply to the planner: "authorize the coder to merge each of the 8 run-8 PRs in ascending number"). This overrides, for Run 8 only, the named-head rule in the coder annotation of `docs/planner-contract.md` and in `CLAUDE.md`. The coder merges each Run 8 code PR at the exact head the reviewer cleared with `BLOCKERS: NONE`, in ascending PR number, and runs Part 2 straight through. Nobody sends a further order. The plan runs from item 0 to item 10 without stopping.

**Deadline:** every code PR's head reviewed clean by **20:00 WIB**, merged and checked on production by **22:30 WIB**. A PR not clean by 20:00 is not merged and is reported not done. Nothing waits on it.

**The database is on Supabase Pro** (owner, Nov 3 morning; 250 GB egress included). Production probes are allowed at the sizes each item states.

## Items

| # | Backlog | Ships | Lane | Cut if late |
|---|---|---|---|---|
| 0 | — | This plan committed in a new docs PR | coder, first 5 minutes | never |
| 1 | Supabase egress and log usage (unnumbered) | Measured egress and log sources; feed photos kept by the phone; ticks only while work waits | A | never |
| 2 | #328 | Per-account hourly caps on every route that spends model, USDA or post credit | B | never |
| 3 | #279 | What stops a hammering script, reported; hCaptcha built but left off until the app goes public | C | never |
| 4 | #322, #329 | The tick route boots without the food pipeline; upload signing refuses bad shots | D | 4th |
| 5 | #327 | The Days page reads a month in a fixed number of queries | E | 3rd |
| 6 | #331, #330 | Health reports the database and the model path; Search, Days and Profile show a loading state at once | E | 2nd |
| 7 | #323, #324, #326, #222/#305 remainder | One sign-in check per page, today's totals once, subset fonts, the first photo under 2 s | F | 1st |
| 8 | — | Review lane | R | never |
| 9 | — | Part 1 report | coder | never |
| 10 | all | Part 2: migration, merges, production checks, straight after Part 1 | coder | — |

## Lanes

Seven agents at once, each in its own worktree under `../my-food-ai-wt/run8-<lane>`, each branch cut from `origin/main` (`58d127b` or later). All start in the first 10 minutes. Nothing is stacked.

| Lane | Branch | Files it owns (no other lane edits them) |
|---|---|---|
| A | `run8/egress` | `src/app/api/media/feed/[owner]/[post]/[media]/v1.webp/route.ts`, `src/components/QueueTicker.tsx`, `scripts/egress-report.mjs` (new), `docs/egress.md` (new) |
| B | `run8/spend-caps` | `supabase/migrations/0035_user_call_caps.sql` (new), `src/lib/limits/user-cap.ts` (new), `src/app/api/label/read/route.ts`, `src/app/api/transcribe/route.ts`, `src/app/api/fdc/search/route.ts`, `src/app/api/fdc/barcode/route.ts`, `src/app/api/barcode/[gtin]/route.ts`, `src/app/api/posts/route.ts`, `src/app/api/posts/food/route.ts`, `src/app/api/posts/[id]/{comments,items,retry,servings,media}/route.ts`, `tests/db/user-cap.test.mjs` (new) |
| C | `run8/signup-guard` | `src/lib/auth/actions.ts`, `src/components/HCaptcha.tsx` (new), `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx`, `scripts/lib/session.mjs`, `scripts/auth-hammer.mjs` (new), `docs/auth-protection.md` (new), `.env.example` |
| D | `run8/tick-lazy`, then `run8/upload-shots` | 4a: `src/lib/worker/handlers.ts`, `docs/tick-cold.md` (new). 4b: `src/app/api/media/sign-upload/route.ts`, `tests/sign-upload-shots.test.mjs` (new) |
| E | `run8/days-batch`, then `run8/health-loading` | 5: `src/lib/posts/days.ts` (`getDays` only), `tests/days-reader-queries.test.mjs` (new). 6: `src/app/api/health/route.ts`, `src/lib/health/probe.ts` (new), `tests/barcode-post.test.mjs` (health assertion only), `src/app/(tabs)/{search,days,profile}/loading.tsx` (new) |
| F | `run8/first-paint` | `src/middleware.ts`, `src/lib/auth/verified-user.ts` (new), `src/app/(tabs)/page.tsx`, the user read in `src/app/(tabs)/{search,days,profile}/page.tsx`, `src/components/Feed.tsx`, `src/assets/fonts/*.woff2`, `scripts/font-codepoints.mjs` (new), `docs/media-loading.md`, `tests/verified-user.test.mjs` (new) |
| R | sub-agent | none |

**Shared-file rule.** Lane E's item 5 edits only `getDays` in `days.ts`; Lane F does not touch `days.ts`. Lane F edits the user read in the three tab pages; Lane E only adds `loading.tsx` beside them. If GitHub reports a conflict, bring main in by merge commit. A refresh with no code change of its own merges without a new order; a refresh with a code change gets the same reviewer's confirmation first (owner ruling, Nov 2 23:21).

---

## Facts checked by the planner (with the check, Tue 2026-11-03)

- **Main and production** are `58d127b999163bfb8212fa8145482ae875ed2276` (merge of #308), deployment READY, `/api/health` 200. Check: `git log -1 origin/main`; Vercel `GET /v6/deployments?target=production&limit=1`; `curl -o /dev/null -w %{http_code}` at 03:59 UTC.
- **Run 7 is merged:** #309, #311, #312, #313, #314, #315 and docs #308, 03:39–03:51 UTC. #310 is closed unmerged (its files reached main through #311). **No PR is open.** Check: `gh pr list --state open` and `--state merged`.
- **Migrations 0032, 0033, 0034 are on main and applied:** `profiles.identify_provider` and `posts.pending_items` exist and `renew_worker_lease` exists. `user_hit` does not exist. Check: `psql "$SUPABASE_DB_URL"` on `information_schema.columns` and `pg_proc`, 04:00 UTC. **Run 8 has one migration: 0035 (item 2).**
- **Vercel env** has `IDENTIFY_OPEN_API_KEY`, `IDENTIFY_OPEN_BASE_URL` and `IDENTIFY_OPEN_MODEL` in production and preview, and no hCaptcha variable. Check: Vercel `GET /v9/projects/my-food-ai/env` (names only).
- **Production Auth** (Supabase Management API `GET /v1/projects/<ref>/config/auth`, 04:00 UTC, filtered): `security_captcha_enabled false`, `security_captcha_provider "hcaptcha"`, **`security_captcha_secret` is set**, `hook_before_user_created_enabled false`, `mailer_autoconfirm true` (sign-up sends no email), `rate_limit_verify 30`. **Owner ruling, 10:57 WIB: CAPTCHA stays off until the app goes public.** This run never changes any Auth setting.
- **The production host is `my-food-ai-ten.vercel.app`**, the project's only domain (Vercel `GET /v9/projects/my-food-ai/domains`; `APP_URL`).
- **Database plan** (owner, not checked by the planner): the project was upgraded to Supabase Pro this morning, which includes 250 GB of egress. Before the upgrade the usage page showed egress 8.66 GB and log ingestion 1.10 GB. The owner rewrote this backlog item for Pro in the Doc at 11:03 WIB; that revision is not on main. Item 1's goal is to find and cut what drives egress and log ingestion.
- **Likely egress and log sources on main:**
  - The feed photo route `src/app/api/media/feed/[owner]/[post]/[media]/v1.webp/route.ts` sends `Cache-Control: private, no-store` (line 5) and reads the original from Supabase Storage (lines 28, 41) on every request, so every photo view is Storage egress.
  - `src/components/QueueTicker.tsx` calls `/api/jobs/tick` on load, on every `focus` and every 60 s (`setInterval(tick,60000)`, line 21) for as long as any tab is open, whether or not work waits. Each tick is a database round trip and log lines.
  - `0024_worker_wake.sql:52` schedules `public.wake_due_worker()` every minute through `cron` and `net.http_get`.
- **Sign-up and sign-in** are server actions `signUp` and `signIn` in `src/lib/auth/actions.ts` calling `supabase.auth.signUp({email,password})` and `signInWithPassword({email,password})` with no CAPTCHA token. Both auth pages always render the grayed `FacebookButton` (#309 merged).
- **Cap pattern:** `public.agent_hit` in `0031_agent_tokens.sql:45` (security definer, per-minute bucket table, service role only), called from `authenticateBearer` in `src/lib/agents/tokens.ts:32`.
- **Spending routes with no cap:** `label/read` (one Meta call per hit through `readNutritionLabel`), `transcribe`, `fdc/search` (`searchFoods`), `fdc/barcode`, `barcode/[gtin]`, `posts` POST and `posts/food` POST (enqueue analysis), `posts/[id]/{comments,items,retry,servings,media}` (USDA, model or worker).
- **Tick imports:** `src/app/api/jobs/tick/route.ts` → `runWorker` in `src/lib/worker/drain.ts` → `jobHandlers` in `src/lib/worker/handlers.ts`, which statically imports all six job modules. `runJob(admin, job, handlers = jobHandlers)` lets tests pass their own table.
- **Upload signing:** the non-staged branch of `src/app/api/media/sign-upload/route.ts` writes `position`, `width` and `height` from the body into `post_media` unchecked. `validUploadShots` in `src/lib/posts/upload-draft.ts:5` already requires at most 8 shots, `position === index`, and integer sizes 1–4096. The app's only caller uses the staged branch (`src/lib/media/pack-photo-upload.ts:26`).
- **Days reader:** `getDays` (`src/lib/posts/days.ts:37`) loads each post's items and photo in batches of 8; `getMonthSummary` in the same file reads a month in one embedded query.
- **Health** returns only whether five variable names are set. `scripts/check.mjs:26` already calls `GET ${base}/models`. `tests/barcode-post.test.mjs` refers to `api/health`.
- **No `loading.tsx`** exists under `src/app`.
- **Home on main:** `src/middleware.ts:22` calls `getUser()`, then `homeReader` in `src/app/(tabs)/page.tsx:20–22` calls `getUser()` again. The fonts are four Manrope `.woff2` files of 30,648–31,228 bytes with `preload: false`. The last Run 7 cold first photo was 2,096.9 ms, and the middleware's early image `Link` header was absent from the Home response for an unexplained reason (`docs/run7-part1-report.md`).
- **No Content-Security-Policy** is set (`grep -rn Content-Security-Policy next.config.* src` is empty), so the hCaptcha script needs no header change.

## Premises (unchecked; verify before acting; the report says which were false)

- P1. The site key at the top is valid, and the owner's hCaptcha site lists `my-food-ai-ten.vercel.app`.
- P2. hCaptcha's public test site key `10000000-ffff-ffff-ffff-000000000001` renders a check that passes on any host. Previews and local runs use it.
- P4. With CAPTCHA on, `auth.admin.generateLink({type:"magiclink", email})` then `auth.verifyOtp({token_hash, type:"magiclink"})` still issues a session without a CAPTCHA token. (Built now, used only once CAPTCHA is turned on later.)
- P5. `GET https://api.meta.ai/v1/models` answers 200 with the key and spends no tokens.
- P6. `pip install --user fonttools brotli` gives a working `pyftsubset` on the OCI box.
- P7. The Supabase Management API answers log queries at `GET /v1/projects/<ref>/analytics/endpoints/logs.all?sql=…` with the existing `SUPABASE_ACCESS_TOKEN`.
- P8. Vercel's edge caches a response with `Cache-Control: public, s-maxage=…` from a route handler, and serves later hits without invoking the function.

## Run rules

- **Worktrees:** `git worktree prune` first; remove every leftover `run7-*` worktree (Run 7 is merged). Cut every branch from `origin/main`. Remove each worktree and local branch once its PR is pushed. `scripts/cleanup.sh` ends Part 1 and Part 2.
- **Checks per code PR on its final head:** `npx tsc --noEmit`, `npx eslint <changed files>`, `npm run build`, the header command of every test file it adds or touches, `npm run test:db` when it adds a migration, `node --test tests/wording.test.mjs` when it adds user-facing text. Paste each command with its exit code in the PR body.
- **Review lane R.** The owner runs a separate review agent that checks the open PRs every two minutes and posts its review on GitHub. When a code PR's head is pushed, comment `Ready for review at <full SHA>`. The coder launches no reviewer of its own. It reads the review agent's comments, fixes every blocker, pushes, and comments again with the new SHA. The same reviewer confirms. A PR merges only at a head that has a `BLOCKERS: NONE` review on that exact SHA. If no review of a head has appeared 60 minutes after the comment, run PPLX on it (`skills/pplx-review/SKILL.md`, `docs/pplx-review-procedure.md`). If PPLX cannot run either, that PR's review is a legal halt for that PR only. Captures go under `docs/reviews/` per `REVIEW_POLICY.md`. The docs PR gets no review.
- **Legal halts only:** a review tool unavailable when reached; a fact in this plan proves false; an operation would contact a customer or breach a prohibition. A halt stops only its own item; every other item continues.
- **Claims rule unchanged:** consumed, past tense; no target, goal, ring, percentage, or "left" for an amount.
- **No customer contact.** Production checks use the two test accounts and throwaway `run8-hammer-<random>@example.com` accounts that item 3 creates and deletes. `mailer_autoconfirm` is true, so those sign-ups send no email.
- **No production change in Part 1:** no migration or Vercel variable. Those are Part 2. **No Auth setting changes at any point in this run.**

---

## 0. The docs PR (first 5 minutes)

Cut `run8/docs` from `origin/main`. Commit this file as `docs/plan-run8.md`, unchanged except for the key-block replacement at the top, and open "docs: Run 8 plan". Before pushing, `git grep -n "276235c0"` on the branch must return nothing. The Part 1 report (item 9) and the final report land here. The docs PR is not one of the eight authorized merges; it stays open for the owner.

## 1. The database is over its free egress and log quota (Lane A, `run8/egress`)

**Step 1 — measure.** New `scripts/egress-report.mjs` (`node --env-file=.env.local scripts/egress-report.mjs`) queries the Management API logs (P7) for the last 24 hours and prints three tables into `docs/egress.md` under "Before":
- edge logs grouped by path prefix (`/storage/v1/object/…`, `/rest/v1/<table>`, `/rest/v1/rpc/<fn>`, `/auth/v1/…`, `/realtime/…`): request count and summed response bytes;
- the same grouped by user agent (Vercel functions, `pg_net`, browsers);
- log rows by source (edge, postgres, auth, realtime, storage).
If P7 is false, write "log API unavailable" and continue with steps 2–3; the halt covers only step 1.

**Step 2 — the feed photo is served from the edge.** In the feed photo route, keep the owner check. Change the success response's header to `Cache-Control: private, max-age=31536000, immutable` and add `ETag` set to the `post_media` id plus `v1`. Answer a request whose `If-None-Match` equals that ETag with 304 before reading Storage. Error responses keep `private, no-store`. (The image under a given media id never changes; a correction makes new media rows.) The browser and the service worker then keep each photo, and a revisit makes no Storage read.

**Step 3 — tick only while work waits.** In `QueueTicker.tsx`, keep the tick on load and on `focus`. Replace the fixed 60 s interval: after each tick, schedule the next one in 60 s only when the response's `queued + running > 0`; otherwise schedule nothing until the next `focus`, the next `post-created` window event, or an upload event the ticker already listens for. Leave the cron wake in 0024 as it is (it already wakes only for due work).

**Step 4 — after.** Signed in as the larger test account, open Home five times on production main and five times on a Vercel preview of the head, with the browser cache cleared before the first of each set. Record each opening's Supabase bytes from the browser's network panel and from the log query filtered to that window. Write "Before" and "After" in `docs/egress.md`.

**Done** when `docs/egress.md` names which requests dominate egress and log ingestion and shows one feed opening's egress before and after. **Blast radius:** a wrong ETag could show an old photo for a media id; ids are never reused. Fewer ticks could delay a stuck job's restart until the next focus; the cron wake still runs every minute.

## 2. #328 Per-account caps on the spending routes (Lane B, `run8/spend-caps`)

**`0035_user_call_caps.sql`:**
- Table `public.user_call_hits(user_id uuid not null references auth.users(id) on delete cascade, route text not null check (route in ('label','transcribe','fdc_search','fdc_barcode','post','correct')), hour timestamptz not null, hits integer not null default 0, primary key (user_id, route, hour))`. RLS on, no policy.
- Function `public.user_hit(p_user_id uuid, p_route text) returns boolean language plpgsql security definer set search_path=public,pg_temp`, in `agent_hit`'s shape. Limits per clock hour, fixed inside the function: `label 30`, `transcribe 60`, `fdc_search 300`, `fdc_barcode 120`, `post 40`, `correct 100`. An unknown route raises `22023`. It upserts the bucket `date_trunc('hour', clock_timestamp())`, deletes that user's rows older than one day, and returns `hits <= limit`.
- `revoke all on function public.user_hit(uuid,text) from public, anon, authenticated; grant execute on function public.user_hit(uuid,text) to service_role;`

**Service `src/lib/limits/user-cap.ts`:** `export type CapRoute = 'label'|'transcribe'|'fdc_search'|'fdc_barcode'|'post'|'correct'` and `export async function capUser(userId: string, route: CapRoute, db = createAdminClient()): Promise<NextResponse | null>`. It calls `user_hit`. On `false` it returns status 429, header `Retry-After` set to the seconds until the next clock hour, body `{error: "You have made a lot of requests this hour. Try again later."}`. On an RPC error it logs `user cap check failed <route>` and returns `null`, so the request goes ahead.

**Boundaries:** in each route, right after its existing sign-in check, add `const capped = await capUser(user.id, "<route>"); if (capped) return capped;`:
- `label/read` POST → `label`; `transcribe` POST → `transcribe`; `fdc/search` GET → `fdc_search`; `fdc/barcode` GET and `barcode/[gtin]` GET → `fdc_barcode`; `posts` POST and `posts/food` POST → `post`;
- every exported POST, PATCH and PUT handler in `posts/[id]/comments`, `items`, `retry`, `servings` and `media` → `correct`.

**Test `tests/db/user-cap.test.mjs`:** the 40th `post` hit is allowed and the 41st refused; another user's first hit is allowed; the `authenticated` role cannot execute `user_hit`; an unknown route raises.

**Done** when a loop on each route is refused after its cap (the test now, the production check in Part 2). **Blast radius:** a too-low cap refuses a judge's real use; the limits are about ten times one person's heavy hour.

## 3. #279 Sign-up and sign-in resist being hammered (Lane C, `run8/signup-guard`)

**Owner ruling, 10:57 WIB: CAPTCHA stays off until the app goes public.** This item therefore reports what stops a script today and builds the CAPTCHA path dormant. It turns on nothing: no Auth setting, no hook, no account cap, no production site key.

**Step 1 — observe.** New `scripts/auth-hammer.mjs` (`node --env-file=.env.local scripts/auth-hammer.mjs --signups <n> --signins <n>`). It calls Supabase Auth directly with the publishable key and no CAPTCHA token:
- sign-up: `POST /auth/v1/signup` with `run8-hammer-<random>@example.com`;
- sign-in: `POST /auth/v1/token?grant_type=password` with a wrong password for one throwaway account it creates first through `auth.admin.createUser`.
It never uses a test or demo account. It stops at the first refusal, prints each status and error code, and deletes every account it created with `auth.admin.deleteUser`. It runs only from the coder's machine; Supabase's limits are per IP address, so a refusal cannot lock out a judge or the owner's phone. Run `--signups 35 --signins 35` once, after every other production check in Part 2 (item 10 step 4), so a per-IP refusal does not block the coder's own scripted sign-ins mid-run. Write in `docs/auth-protection.md`:
- the Auth settings from the facts above;
- the request number of the first refusal for sign-up and for sign-in, with its status and error code, or "not refused within 35";
- every post a new account can make under item 2's caps (40 an hour);
- "CAPTCHA is built and off by the owner's ruling (10:57 WIB). To turn it on when the app goes public: set `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` in Vercel production, redeploy, then set `security_captcha_enabled true` in Supabase Auth. Never in the other order."

**Step 2 — the widget and the token, dormant.**
- New `src/components/HCaptcha.tsx` (client): loads `https://js.hcaptcha.com/1/api.js` once with `next/script` `strategy="afterInteractive"` and renders `<div className="h-captcha" data-sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY} />`, which adds an `h-captcha-response` field to its form. It renders nothing when the variable is empty, which it is in production for this run.
- In each auth page, add `<HCaptcha />` directly above the submit `Button`.
- In `actions.ts`, `signUp` and `signIn` read `formData.get("h-captcha-response")` and pass `options: { captchaToken }` when it is a non-empty string. When Supabase's error message mentions captcha, redirect back with `error=Complete the check and try again.`
- `scripts/lib/session.mjs` tries `signInWithPassword` first; on a captcha error it uses `auth.admin.generateLink({type:"magiclink", email})` then `verifyOtp({token_hash, type:"magiclink"})` (P4). Every script that signs in goes through this file.
- `.env.example` gains `NEXT_PUBLIC_HCAPTCHA_SITE_KEY=` (empty).
- One page look per auth page at 390×844 on a preview with the P2 test key; differences on the PR.

**Done** when `docs/auth-protection.md` holds the observations and the turn-on order, the widget shows on both preview pages with the test key, a preview sign-in with the test check solved succeeds, and production sign-in is unchanged (no widget, sign-in works). The backlog's "a hammering script is refused" stays open until the owner turns CAPTCHA on. **Blast radius:** none on production while the variable is empty; `captchaToken` is sent only when the form carries one.

## 4. #322 and #329 (Lane D)

**4a. The tick route boots without the food pipeline (`run8/tick-lazy`).** In `src/lib/worker/handlers.ts`, delete the six static job imports and build the table from lazy wrappers:

```ts
const lazy = (load: () => Promise<{ default: JobHandler }>): JobHandler =>
  async (admin, job) => (await load()).default(admin, job);
export const jobHandlers: JobHandlers = Object.freeze({
  analyze: lazy(() => import("@/lib/worker/jobs/analyze")),
  correct: lazy(() => import("@/lib/worker/jobs/correct")),
  recompute: lazy(() => import("@/lib/worker/jobs/recompute")),
  remainder: lazy(() => import("@/lib/worker/jobs/remainder")),
  card_backfill: lazy(() => import("@/lib/worker/jobs/card_backfill")),
  media_cleanup: lazy(() => import("@/lib/worker/jobs/media_cleanup")),
});
```

`runJob`, `drain.ts` and the tests' own tables stay unchanged. **Proof:** after `npm run build`, run `grep -c "pngjs\|web-push" .next/server/app/api/jobs/tick/route.js` on main and on the head, and paste both counts. **Times:** on a preview of the head, call `GET /api/jobs/tick` as the first request after deploy, then once after each of five 15-minute idle gaps. Record the times in `docs/tick-cold.md`, and the same six on production after merge (item 10). **Done** when the head's count is 0 and the times are in docs.

**4b. Upload signing refuses bad shots (`run8/upload-shots`, after 4a's PR is pushed).** In the non-staged branch of `sign-upload/route.ts`, replace `!Array.isArray(body.shots) || body.shots.length === 0` with `!validUploadShots(body.shots) || body.shots.length === 0` (import from `@/lib/posts/upload-draft`). The 400 body is `{error: "Each photo needs its position in order and a size from 1 to 4096 pixels."}`. **Test `tests/sign-upload-shots.test.mjs`:** `validUploadShots` refuses position −1, position 9999, width 0 and two shots at position 0, and accepts `[{position:0,width:1080,height:1080}]`. **Done** when each of those is refused.

## 5. #327 The Days page reads a month in a fixed number of queries (Lane E, `run8/days-batch`)

Rewrite `getDays` in `src/lib/posts/days.ts` to read the window's posts with embedded `post_media` and current items with nutrition in one select, in `getMonthSummary`'s embedded shape. Then sign every first-photo path with one `storage.from("media").createSignedUrls(paths, ttl)`. Remove the batches of 8. `LoggedDay[]` and every field stay the same. **Test `tests/days-reader-queries.test.mjs`:** a recording fake client sees the same number of `from`, `rpc` and `createSignedUrls` calls for 40 posts as for 2, and the same `LoggedDay[]` as the old reader for a fixed fixture. **Done** when the count does not grow with the month.

## 6. #331 and #330 (Lane E, `run8/health-loading`, after item 5's PR is pushed)

**Health.** New `src/lib/health/probe.ts`: `probeHealth()` returns `{database: {ok, ms}, model: {ok, ms}}`. Database: `createAdminClient().from("profiles").select("id", {head: true}).limit(1)` with a 3 s `AbortSignal.timeout`. Model: `GET ${META_API_BASE_URL}/models` with `MODEL_API_KEY` and a 3 s timeout (P5). Cache the result in module scope for 60 s, so a hammered endpoint makes at most one upstream call of each kind a minute per instance. The route returns `{config: <the existing five booleans>, database, model}` with 200 when both are ok and 503 otherwise, never an error text or a value. Update the health assertion in `tests/barcode-post.test.mjs` to the new shape. Test locally with `MODEL_API_BASE_URL=http://127.0.0.1:9`, which must give 503.

**Loading.** New `loading.tsx` in `src/app/(tabs)/search`, `days` and `profile`. Each renders the same header markup as its own `page.tsx` header (copied) and below it `<p role="status" className="px-screen-x text-detail text-muted">Loading…</p>`. **No `src/app/(tabs)/loading.tsx`**: it would replace Home's streamed cached feed. One page look per tab at 390×844 on a throttled preview; differences on the PR.

**Done** when health reports both checks and turns 503 when either fails, and each of the three tabs shows its loading state at the tap.

## 7. #323, #324, #326, #222/#305 remainder (Lane F, `run8/first-paint`)

First re-measure the cold and warm first photo with the method and profile in `docs/media-loading.md` on production main (five cold, five warm openings), and write "Run 8 before".

- **#323 one sign-in check.** New `src/lib/auth/verified-user.ts` exports `VERIFIED_USER_HEADER = "x-mfa-verified-user"` and `verifiedUserId(): Promise<string | null>`, which reads it from `headers()`. In `src/middleware.ts`, delete `VERIFIED_USER_HEADER` from the incoming request headers on every request, then set it to `user.id` when `getUser()` returned a user. It is set on the request headers that `sessionCookieBridge` passes to `NextResponse.next({request: {headers}})` (`src/lib/auth/session-cookies.ts:10`), never on the response. In `homeReader` (`(tabs)/page.tsx`) and the search, days and profile pages, use `verifiedUserId()` in place of `auth.getUser()`, and call `getUser()` only when it returns null. API routes are unchanged. **Test `tests/verified-user.test.mjs`:** a forged incoming header is removed when there is no user and replaced by the real id when there is.
- **#324 today's totals once.** `HomeDays` and `HomeFeed` share one request-scoped `cache()`d read of the five days' totals. `HomeFeed` passes them in `initialPage.days`. `Feed`'s first totals refresh requests only dates missing from `initialPage.days`. Record in docs that one Home open makes one `getDayTotals` call (server log line `feed read day-totals`).
- **#326 subset fonts.** New `scripts/font-codepoints.mjs` prints every code point above U+00FF in string literals and JSX text under `src/`. Subset each `Manrope-*.woff2` in place with `pyftsubset <file> --flavor=woff2 --layout-features='*' --output-file=<file> --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,<script output>"` (P6). Record each file's bytes before and after.
- **#222/#305 the early image `Link`.** `curl -sI` the preview's `/` with a test session cookie and record every response header. Find why `homePhotoPreload`'s `Link` does not arrive and make it arrive on the document response.
- **After:** five cold and five warm openings on a preview of the head, written as "Run 8 after". The production run is item 10.

**Done** when a page open makes one Auth call, a forged header cannot reach a protected page, today's totals are read once per Home open, the font sizes are in docs, and the cold first photo is under 2,000 ms on the same emulated profile. **Blast radius:** a header leak would let a request act as another user; the middleware deletes the incoming header unconditionally and the test guards it.

## 8. Review lane (R)

As in Run rules. One reviewer per head; the same reviewer confirms fixes.

## 9. Part 1 report (not a stop)

When every code PR is either clean or past the 20:00 deadline, post a comment on the docs PR: for items 0–8, done or not done; PR number, full head SHA, checks with exit codes, reviewer and verdict link; false premises; item 1's egress tables; item 4a's tick times; item 7's before and after. It ends with the merge list in ascending PR number, each with its cleared head SHA and migration. Then go straight to item 10.

## 10. Part 2 — merges and production checks (authorized by this plan; no further order)

1. **Vercel:** set `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` to the P2 test key in **preview only**. Production gets no hCaptcha variable (owner ruling, 10:57 WIB). No hCaptcha secret goes into Vercel.
2. **Migration:** apply `0035_user_call_caps.sql` with `psql "$SUPABASE_DB_URL" -f` just before item 2's PR merges. Show `\df public.user_hit` after it.
3. **Merge** the eight code PRs that are clean, in ascending PR number, each with `gh pr merge <n> --merge --match-head-commit <cleared SHA>`. Wait for each production deploy to be READY and `/api/health` to answer before the next merge. A PR GitHub reports as conflicting gets main by merge commit; a refresh with no code change of its own merges at once, and one with a code change gets the same reviewer's `BLOCKERS: NONE` on the new SHA first. A PR not clean is not merged.
4. **Production checks** after the last deploy, as the test accounts at 390×844, evidence on each issue (numbers and IDs, never the account):
   - Item 1: five Home openings' egress, against the "Before" figures.
   - #222: `scripts/feed-probe.mjs --runs 100 --user 1` against production, which must open 100/100, plus the first-card time.
   - #328: 31 `label/read` calls with an invalid `photo_path` body on a test account; call 31 returns 429. (An invalid path spends no model call.)
   - #322: six tick times.
   - #327: Days for the largest month opens and shows the same days and photos as before.
   - #331: `/api/health` shows both checks ok.
   - #330: each tab's loading state on a throttled open.
   - #323/#324/#326/#222: five cold and five warm openings, first photo under 2,000 ms.
   - #279: production sign-in works with no widget; then `scripts/auth-hammer.mjs --signups 35 --signins 35` last, as item 3 step 1 states.
5. **Defects:** one found before 23:59 is fixed from main in a new PR, reviewed to `BLOCKERS: NONE` and merged under this same authorization. After 23:59 it goes on the issue and nothing merges.
6. **Last:** post the final report on the docs PR (item 9's fields plus every production result), delete each merged remote branch, run `scripts/cleanup.sh`. The docs PR stays open. Only the main checkout remains.

## Blast radius

| Item | If it fails | Beyond itself |
|---|---|---|
| 1 | Egress and logs keep growing | Photo caching, tick cadence |
| 2 | No caps, or a judge refused | Six route families, one table, one function |
| 3 | No report; CAPTCHA path not ready for launch | Two auth pages (dormant widget), scripted sign-in helper |
| 4 | Tick boots slowly; bad sizes stored | Worker job loading, one legacy route |
| 5 | Days slow or wrong | Days stories |
| 6 | Health misreports; no loading state | Health body shape |
| 7 | Cold photo stays over 2 s | Middleware, Home, fonts |

## Backlog items not in this run, and why

| Items | Reason |
|---|---|
| #222, #304, #305, #281, #316, #306, #307, #139, #282, #287, #60 | Built and merged in Run 7. What remains is owner and production acceptance; item 7 carries #222/#305's last 0.1 s. |
| #212, #285, #318, #26 | The owner's tasks. |
| #289, #290, #291, #108 | The designer's frames. |
| #223 | A production check only. |
| #228, #272 | Need a read-and-report or a matching-policy change with a quality gate; not safe before recording. |
| #65, #66 | Test infrastructure with no judge-visible effect. |
| #294 | Needs the owner's ruling on each term. |
| #107, #175, #224, #215, #29, #283, #18, #20, #23 | Not on the quota, security or speed path; cut to protect the 20:00 deadline. |
| #2, #3, #11, #6, #193, #217 | Restyle passes across every screen; too large for the hours left. |
| #114, #115, #218 | Blocked. |

## Cleanup

Leftover worktrees removed before the first PR. Each worktree and local branch removed once its PR is pushed. Remote branches deleted after merge. Every throwaway `@example.com` account deleted by `auth-hammer.mjs` and counted in the report. `scripts/cleanup.sh` ends both parts. At the end only the main checkout remains and nothing temporary runs.

---

## For RT's eyes (last; read from the bottom)

1. **Zero stops.** By your authorization, the coder merges each of the eight Run 8 code PRs in ascending number at the head your review agent cleared, then checks production, with no further order. The docs PR stays open for you. Default: as stated.
2. **CAPTCHA stays off,** by your 10:57 ruling. The check is built but dormant: production has no site key, so sign-in looks and works exactly as now. There is no cap on new accounts, so no judge can be refused. `docs/auth-protection.md` gives the turn-on order for launch: site key in Vercel and redeploy first, then CAPTCHA on in Supabase, never the reverse. Default: off.
3. **#279's "a hammering script is refused" is not met tonight,** by that same ruling. The run reports what Supabase's per-IP limits refuse today. Default: reported, not enforced.
4. **Hourly caps per account:** 30 label reads, 60 transcriptions, 300 food searches, 120 barcode lookups, 40 new posts, 100 corrections, with "You have made a lot of requests this hour. Try again later." If the cap check itself fails, the request goes ahead. Default: these numbers, allow on failure.
5. **The app stops ticking the queue every minute when nothing is processing.** It ticks on open, on focus, after a post, and every minute only while work waits. Default: as stated.
6. **Feed photos are kept by the phone for a year** under their media id, so a revisit downloads nothing. Default: as stated.
7. **Health turns 503 when the database or the model does not answer.** Default: as stated.
8. **Search, Days and Profile show "Loading…" at the tap;** Home keeps its cached feed. Default: as stated.
9. **Supabase is on Pro,** so production probes run at normal size, including the 100-opening feed check for #222. Default: as stated.
10. **Reviews come from your review agent,** which checks every two minutes. The coder runs PPLX only when a head has had no review for 60 minutes. Default: as stated.