# Run 8 exact-head owner review receipts

Captured through GitHub pull-request review API. Each API `commit_id` matches its listed current head. These are the owner-operated external watch reviewer’s verdicts; merge authority is the Run 8 plan plus later owner overrides.

## PR #334

Head: `b8fd31bb7fffc7bb47c8f435794126b33486c8e9`. [Review](https://github.com/aibraincoach/my-food-ai/pull/334#pullrequestreview-5747250164).

<!-- watch-review -->
Watch review of head b8fd31bb7fffc7bb47c8f435794126b33486c8e9:

Scope check (per plan-run8 expectation: tick boots with only queue code, job modules dynamically imported keyed by kind, registry test enforces its own job table):
- src/lib/worker/handlers.ts: all six kinds preserved in the frozen table (analyze, correct, recompute, remainder, card_backfill, media_cleanup); static imports replaced by six fixed-literal dynamic imports behind a `lazy` wrapper. Matches the expected scope.
- tests/job-registry.test.mjs: registry test updated to assert exactly six fixed literal module paths and that drain.ts contains no dynamic import; unknown/inherited-kind rejection, frozen-table, jobs-folder-coverage, and test-supplied-table assertions retained. Matches the expected scope.
- docs/tick-cold.md (new): measurement notes; explicitly states the bundled-entrypoint grep count (0 on both sides) does not establish dependency loading and that the local tsx checkpoint is not a cold Vercel invocation. No inflated claim.
- No user-facing strings changed; claims rule N/A, nothing to flag.

Findings:
- src/lib/worker/handlers.ts:8 — `lazy` wrapper has no import-failure-specific handling; a failed dynamic import rejects into `runJob`'s caller and is handled by the existing `drainOnce` catch (fail_job RPC path). Behavior change vs static-import boot failure is absorbed by existing retry/failure semantics. Advisory only, not a blocker.
- src/lib/worker/handlers.ts:11 — `Object.freeze` on the table retained; key set unchanged, so no dropped kind (enqueue sites cover analyze/correct/recompute/card_backfill/remainder via enqueue.ts plus media_cleanup via staged-photo.ts; all six remain registered).
- tests/job-registry.test.mjs:31 — new assertion pins the six literal paths and keeps drain.ts free of dynamic import, so a seventh caller-selected path cannot slip in silently.
- No secrets, credentials, or account identifiers in the diff. No scope creep beyond the perf change plus its doc/test.

WATCH VERDICT: BLOCKERS: NONE

This is a continuous-watch review, not the repo-policy review-lane receipt and not a merge authorization.


## PR #335

Head: `5f0ea74cc024c6ee376790e003b409a8a69d99a2`. [Review](https://github.com/aibraincoach/my-food-ai/pull/335#pullrequestreview-5747307452).

<!-- watch-review -->
Watch review of head 5f0ea74cc024c6ee376790e003b409a8a69d99a2:

Scope check: HTTP-cache privacy follow-up for the private photo route (Run 8 egress lane). Route adds `Vary: Cookie` to the year-fresh private/immutable 200 and (critically) to the 304 path, which revalidates ownership (auth + RLS select, zero Storage/fetch) before answering. SW fetches ineligible clients with `cache: no-store` after a second eligibility check at fetch time. Docs record the reproduced leak (HTTP-cached 200 surviving Cache API clearing + cookie removal) and the verified fix (401/zero bytes post-logout, Vary-partitioned browser cache, SW suite modeling a separate HTTP cache). Tests: ETag revalidation with ownership + Vary pinned, signed-out 401/no-store, SW logout suite 20/20, feed-photo 7/7.

Findings (all read): the leak analysis is correct — private+immutable without Vary is keyed by URL alone, so logout could not evict it; the fix closes both caches (HTTP via Vary+no-store, Cache API via existing fences). Revalidation cost on cookie rotation is one cheap auth+select round trip, no Storage — stated in the docs. No new user strings, no secrets, no scope creep; test-only plus two-line source delta.

WATCH VERDICT: BLOCKERS: NONE

This is a continuous-watch review, not the repo-policy review-lane receipt and not a merge authorization.


## PR #336

Head: `3ae247c9e7a9430970e53004235988673fe1bd7c`. [Review](https://github.com/aibraincoach/my-food-ai/pull/336#pullrequestreview-5747253352).

<!-- watch-review -->
Watch review of head 3ae247c9e7a9430970e53004235988673fe1bd7c:

Scope check: diff matches plan-run8 lane C (dormant hCaptcha prep + Auth protection observation). Files: `.env.example`, `docs/auth-protection.md` (new), `scripts/auth-hammer.mjs` (new), `scripts/lib/session.mjs`, `scripts/feed-probe.mjs`, `scripts/seed-week.mjs`, `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx`, `src/components/HCaptcha.tsx` (new), `src/lib/auth/actions.ts`. The feed-probe/seed-week edits are mechanical refactors onto the shared sign-in helper, in-scope.

Findings:
- Dormant confirmed, no new blocking: `src/components/HCaptcha.tsx:42` returns null when `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` is empty, rendering no widget and loading no SDK script. `src/lib/auth/actions.ts:16-17,52-53` pass `captchaToken` only when the form supplies a nonempty `h-captcha-response`. With CAPTCHA off server-side, sign-up/sign-in proceed exactly as before.
- No secrets committed: `.env.example` adds only the variable name with an empty value; all scripts reference secret env names (`SUPABASE_SECRET_KEY`, `SUPABASE_ACCESS_TOKEN`) without values. Observation doc records only filtered config/presence, never values.
- No scope creep: hammer script has auto-confirm guard (`scripts/auth-hammer.mjs:17`), random-namespace fixtures with `finally` reconciliation/cleanup, and caps probes at 35. Test-session fallback (`scripts/lib/session.mjs`) is restricted to the two configured test accounts and sends no email.
- Nits (non-blocking): `actions.ts` `error?.message.toLowerCase()` assumes `message` is defined when `error` exists (true for Supabase AuthError in practice); the `mfa`-prefixed global names in `HCaptcha.tsx` are odd but harmless.

WATCH VERDICT: BLOCKERS: NONE

This is a continuous-watch review, not the repo-policy review-lane receipt and not a merge authorization.


## PR #337

Head: `6542ef8dbd0f7536e12434d92173e7b14dbaad31`. [Review](https://github.com/aibraincoach/my-food-ai/pull/337#pullrequestreview-5747256521).

<!-- watch-review -->
Watch review of head 6542ef8dbd0f7536e12434d92173e7b14dbaad31:

Scope check (issue #329 per plan-run8): reject negative positions, zero sizes, duplicate positions on the sign-upload route.
- Negative positions: covered. `validUploadShots` in `src/lib/posts/upload-draft.ts:7` requires `shot.position === index`, so any negative position fails. Test `tests/sign-upload-shots.test.mjs:8` asserts `position:-1` is rejected.
- Zero sizes: covered. Same line requires integer width/height in 1..4096. Test asserts `width:0` rejected.
- Duplicate positions: covered. Positional-identity rule (`position === index`) makes duplicates impossible (second item at index 1 with position 0 fails). Test asserts `[{position:0,...},{position:0,...}]` rejected.
- Error code: 400 with a plain-language message (`src/app/api/media/sign-upload/route.ts` per diff, "Each photo needs its position in order and a size from 1 to 4096 pixels."). Sensible; auth (401) and missing-post (404) paths untouched.
- Legitimate uploads unaffected: position 0 accepted (test asserts single shot at position 0 valid); boundary size 1/4096 allowed by the `1..4096` range check. Normal ordered shots (0,1,2...) pass the identity rule.

Findings:
- No secrets, no scope creep: diff touches only `src/app/api/media/sign-upload/route.ts` (validation gate) plus new `tests/sign-upload-shots.test.mjs`. No other route behavior changed.
- Minor note (non-blocking): the empty-array case relies on the explicit `body.shots.length === 0` check in the route because `validUploadShots([])` returns true (vacuous `every`); the route does include that check, so behavior is correct.
- Minor note (non-blocking): boundary size 1 and 4096 are allowed by code but only 1080 is exercised as a passing case in the test; no failure implied.

WATCH VERDICT: BLOCKERS: NONE

This is a continuous-watch review, not the repo-policy review-lane receipt and not a merge authorization.


## PR #338

Head: `2f27b38bf45270e425a37d2b099dfb0e7a51ae08`. [Review](https://github.com/aibraincoach/my-food-ai/pull/338#pullrequestreview-5747304548).

<!-- watch-review -->
Watch review of head 2f27b38bf45270e425a37d2b099dfb0e7a51ae08:

Scope check: test-plus-triage delta since reviewed head 68b11a8 — `docs/reviews/run8-days-68b11a8-triage.md` disputes both blockers from my earlier review with a disposable live-PostgREST check and deep-equal proof; `tests/days-reader-queries.test.mjs` gains two regressions (caption-only retention with no signing call; NULL-calorie parity with the legacy reader).

Findings — correction of my own earlier verdict, verified against the code: (1) The photo-less exclusion claim was wrong. PostgREST embedded filters do not inner-join by default (that requires `!inner`); the coder's live check retained a caption-only meal with `photoUrl: null`, deep-equal. I asserted join semantics from memory without checking the docs. Retracted. (2) The NULL-calorie claim was wrong for the NULL case: `getCurrentItems` returns explicit NULL unchanged (`!== undefined` guard, totals.ts:222) and its ancestor lookup never replaces NULL; `mapCurrentItems` matches exactly, and the new regression pins parity. The proportional fallback only fires when the property is `undefined` (pre-migration schema without the column). Residual non-blocking note: the new embedded read has no 42703 fallback for a missing column where the old `getCurrentItems` path did — safe only because the triage declares Run 8 post-migration (0028–0034 applied); a pre-migration database would fail the whole Days read instead of degrading.

WATCH VERDICT: BLOCKERS: NONE

This is a continuous-watch review, not the repo-policy review-lane receipt and not a merge authorization.


## PR #339

Head: `91b09132cf664eb73c4e99f0fd4a9ccf9f3a3fdf`. [Review](https://github.com/aibraincoach/my-food-ai/pull/339#pullrequestreview-5747263811).

<!-- watch-review -->
Watch review of head `91b09132cf664eb73c4e99f0fd4a9ccf9f3a3fdf`:

Scope check: matches plan-run8 lane B / issue #328. New `user_hit` RPC + `user_call_hits` table (migration 0035), new `capUser` helper, one-line cap gate on 12 spending routes (label reader, transcription, FDC search/barcode, post creation x2, six `correct`-bucket post sub-routes), plus `tests/db/user-cap.test.mjs`. No product-logic changes beyond the gates.

Findings:
- Per-account isolation holds: PK is `(user_id, route, hour)` (`supabase/migrations/0035_user_call_caps.sql:8`), keyed by the session `user.id` after the 401 check on every route, and the DB test asserts cross-account/route isolation plus per-boundary refusal (`tests/db/user-cap.test.mjs:92-98`).
- No agent-token bypass of the capped routes: all 12 gates call `capUser(user.id, ...)` from cookie-session auth (`createClient().auth.getUser()`); bearer agent tokens are not accepted on these routes. The separate agent-meals path (`src/app/api/agent/meals/route.ts:5`) keeps its own per-token `agent_hit` 60-call limit (`src/lib/agents/tokens.ts:32-46`), fail-closed (503 on check error), so it is rate-limited independently rather than uncapped. Not a blocker.
- Legitimate use unaffected: caps are 30/60/300/120/40/100 per clock hour (`supabase/migrations/0035_user_call_caps.sql:18-19`), sane for a food-logging app; refusal is a clean 429 with `Retry-After` to the next hour boundary and `Cache-Control: private, no-store` (`src/lib/limits/user-cap.ts:10-14`), no hang, generic message leaking no diagnostics.
- Fail-open on counter outage is an explicit owner choice, documented in code (`src/lib/limits/user-cap.ts:5`).
- RLS posture is correct: table locked from public/anon/authenticated, `SECURITY DEFINER` with fixed `search_path`, execute granted to `service_role` only (`supabase/migrations/0035_user_call_caps.sql:10,13,28-29`); test asserts authenticated execution fails (`tests/db/user-cap.test.mjs:110-112`).
- No secrets, no scope creep. Notes (non-blocking): hits are counted before input validation, so malformed requests burn budget (intentional per the route test at `tests/db/user-cap.test.mjs:339`); stale-bucket cleanup only deletes the calling user's own rows older than a day (`supabase/migrations/0035_user_call_caps.sql:25`), so inactive accounts' rows linger (tiny, one row per route-hour ever used). Plan lane B also named `src/app/api/barcode/[gtin]/route.ts`, which does not exist at this head (only the correction route, which is capped) — no gap.

WATCH VERDICT: BLOCKERS: NONE

This is a continuous-watch review, not the repo-policy review-lane receipt and not a merge authorization.


## PR #340

Head: `1118e0fc1d0af4866b4b7714c427e5fdd5b696de`. [Review](https://github.com/aibraincoach/my-food-ai/pull/340#pullrequestreview-5747260011).

<!-- watch-review -->
Watch review of head 1118e0fc1d0af4866b4b7714c427e5fdd5b696de:

Scope check: PR matches the expected run8 scope — worker stops on empty composite claims instead of spinning. Three files: `src/lib/queue/claim.ts` (the fix), `tests/empty-job-claim.test.mjs` (regression test), `docs/run8-empty-claim.md` (defect note). No scope creep beyond the fix + test + doc.

Findings:
- `src/lib/queue/claim.ts:24-27` — guard `if (!data || typeof data !== "object" || !data.id) return null;` correctly converts the all-null composite object (truthy, all fields null) into a null claim. Handles null, non-object, and id-less shapes; real jobs with an id pass through unchanged. Correct.
- Terminal state (`src/lib/worker/drain.ts:21-23,62-67`, unchanged caller): null claim makes `drainOnce` return `{processed: 0}` with no `fail_job` call, and `runWorker` breaks the loop on `processed === 0`, releases the lease in `finally`, then checks `next_worker_wake`. No lost work (nothing was claimed), no silent failure (RPC errors still throw via `ioError`). Clean terminal state confirmed.
- No infinite-loop path remains: the old spin (truthy null-kind job -> `fail_job(null)` -> `processed: 1` -> renew + repeat to the 60 s budget) is cut at the claim reader, which is the single choke point for all lanes. The time-budget break remains as backstop.
- Retryable requeue preserved: `FdcRateLimited` requeue and `fail_job`/`isRetriable` paths in `drain.ts` are untouched; the change only affects the no-job case.
- Test (`tests/empty-job-claim.test.mjs:8-19`) uses a strict mock that throws on any unexpected RPC and asserts exactly `['claim_owned_job']` for `drainOnce` and `['claim_owned_job','release_worker_lease','next_worker_wake']` for `runWorker` — proves no failure/renewal call. Second test covers null passthrough and real-job identity. Adequate.
- No secrets, no dependency or migration changes.

WATCH VERDICT: BLOCKERS: NONE

This is a continuous-watch review, not the repo-policy review-lane receipt and not a merge authorization.


## PR #341

Head: `f7805939ff91c606fdc7f3132d5fa11497d099ed`. [Review](https://github.com/aibraincoach/my-food-ai/pull/341#pullrequestreview-5747301941).

<!-- watch-review -->
Watch review of head f7805939ff91c606fdc7f3132d5fa11497d099ed:

Scope check: docs-plus-test-mock delta since reviewed head d6d77d3 — `docs/media-loading.md` gains the built-app HTTP verification paragraph (one Home document GET 200 with photo Link, exactly one outbound `/auth/v1/user`, exactly one server day-totals read, identity absent from browser response headers, forged identity redirected 307); `feed-cache-lifecycle` test mocks the new `verifiedUserId` import so the suite covers the header path.

Findings: no product source, no migrations, no secrets (timings, counts, status codes only). The paragraph keeps the established hedging (preview measurements pending, no cold-photo pass claimed, phone/100-open gates separate). The mock returns a fixed owner id consistent with the test's existing stubbed user — no behavior change to the suite's assertions.

WATCH VERDICT: BLOCKERS: NONE

This is a continuous-watch review, not the repo-policy review-lane receipt and not a merge authorization.


## PR #342

Head: `4c3b827d9d4d73b9328d091d9b8b716b45d1dd1d`. [Review](https://github.com/aibraincoach/my-food-ai/pull/342#pullrequestreview-5747290978).

<!-- watch-review -->
Watch review of head 4c3b827d9d4d73b9328d091d9b8b716b45d1dd1d:

Scope check: health probe + tab loading states (#330, #331). New `src/lib/health/probe.ts` (60s TTL with in-flight dedup, 3s per-check timeouts, boolean-only results); `/api/health` adds `database`/`model` with 503-on-failure and no-store, keeping config names boolean-only. New `loading.tsx` skeletons with `role=status` "Loading…" for Days/Profile/Search. New `health-probe.test.mjs` (dedup/expiry, no-diagnostics assertion); barcode test updated to the nested health shape.

Findings (all read): model check is a cheap `GET /models` transport probe server-side only — key never leaves the server, no token spend, at most one call per 60s per instance; failures expose booleans and timings only (test asserts no leak of endpoint/key text). Public reachability disclosure is the item's stated purpose. Loading text is claims-clean. SignOutButton renders live inside Profile's loading state — harmless (sign-out works regardless). No scope creep, no secrets.

WATCH VERDICT: BLOCKERS: NONE

This is a continuous-watch review, not the repo-policy review-lane receipt and not a merge authorization.

