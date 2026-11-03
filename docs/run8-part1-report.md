# Run 8 Part 1 report

All eight planned code PRs and the additional worker-defect PR have **BLOCKERS: NONE on their exact current heads** from the owner’s external reviewer. [Captured API receipts](reviews/run8-watch-receipts.md). This report is not a stop: proceed directly to the plan-authorized Part 2. The docs PR stays open.

## Items 0–8

| Item | State and evidence |
| --- | --- |
| 0 | Plan preserved with only its instructed key-block replacement in docs PR #333. Owner Wall entries and the one-second tick override are recorded separately. |
| 1 | #335 built: private year-long photo cache, authenticated ETag/304, Vary Cookie, no-store for ineligible worker clients, and work-only polling. Actual browser simulated logout now returns 401/zero bytes both with and without worker control; old candidate returned cached private bytes. Baseline egress measured; preview/production After remain Part 2. |
| 2 | #339 built: migration 0035, six clock-hour caps, twelve actual spending-handler boundaries. Local database suite 20/20 with no skips; actual local HTTP routes reject their next capped call. Production cap acceptance remains Part 2. |
| 3 | #336 built dormant: widget/token/error path, safe session helper, throwaway-only hammer script. Both local test-key auth layouts and navigation checked. CAPTCHA remains OFF; preview sign-in, unchanged production sign-in and final hammer run remain Part 2. |
| 4a | #334 lazy registry built. Local original registry imported 22 pngjs and seven web-push modules; new registry imports zero. The planned bundled-entrypoint grep is zero on BOTH builds and is not proof by itself. Preview/production six-call timings remain Part 2, with **one-second gaps** per later owner order. |
| 4b | #337 built: rejects invalid legacy shot ordering/dimensions; staged flow retained. |
| 5 | #338 built: embedded month reads and one batch signing call. Two and forty meals have the same request count. Real local PostgREST retained a photo-less ready meal; original/new day results match by deep equality. Both initial reviewer findings were disproved with evidence and regressions; same reviewer confirmed the new head. |
| 6 | #342 built: health dependency probes/cache and tab loading boundaries. Built local health is 200 for working dependencies and 503 for a refused model endpoint. Throttled preview/production page looks remain Part 2. |
| 7 | #341 built: one verified Auth call, shared day totals, subset fonts. Local runtime proves exactly one /auth/v1/user request and one day-totals log per Home document; forged unsigned identity redirects to sign-in. Five cold baseline photos all miss 2 s; preview/production After remain Part 2. |
| 8 | Owner external reviewer cleared all nine exact heads. No coder-launched reviewer. |

Additional defect #340: real local REST returns an all-null composite for no due job. The old worker treated it as a job, failed and renewed repeatedly. The fix stops after one empty claim. Eight worker regressions pass. [Diagnosis](https://github.com/aibraincoach/my-food-ai/pull/340).

## Checks and exit codes

Every PR passed TypeScript, changed-file ESLint and production build with exit 0. #334 worker tests 10 passed; #335 photo tests 7 and service-worker cache tests 20; #337 upload tests 1 and wording tests 2; #338 focused Days tests 11; #339 cap tests 3, full DB suite 20 with no skips, wording tests 2; #340 worker tests 8; #341 focused tests 21 and broader feed/cache/image tests 27; #342 health tests 2 and wording tests 2. #336 TypeScript/lint/build/wording plus isolated hammer/session checks passed. Exact commands are in the individual PR bodies and local receipts.

The full touched `tests/barcode-post.test.mjs` command for #342 exited **1**, with two passes and two USDA403 failures under the disposable stack's fake FDC key. Original main's same test file reproduces two passes/two failures on that stack. The changed health-shape/ownership case passes. Storage/realtime HTTP are not provisioned locally. This is not represented as a passing complete barcode suite. No production Auth setting, schema or Vercel variable changed during Part 1.

## Egress Before

[Full tables on #335](https://github.com/aibraincoach/my-food-ai/blob/run8/egress/docs/egress.md). Twenty-four-hour aggregate reported Content-Length lower bounds: Storage **2,986,275,217 bytes / 35,048 requests**, browser-class agents **2,946,487,692 bytes**. Missing lengths prevent interpreting these as complete billed egress. Edge logs dominate at **430,845 rows**; row counts are not ingestion bytes. Queue traffic includes 74,736 claims and 74,698 failures. In a 55-second opening window, 405 claims and 404 failures motivated the separately reproduced empty-composite defect.

| Production opening | Browser Supabase bytes |
| --- | ---: |
| 1 | 4,367,543 |
| 2 | 4,373,262 |
| 3 | 5,518,553 |
| 4 | 5,518,552 |
| 5 | 5,515,733 |

Larger account, 147 posts, 20 cards, unthrottled, cache cleared before first opening, ten-second settle. Recent caption-heavy cards made no first-viewport photo-route request. Repeated approximately 383.6 KB post responses dominate this sample, so it cannot prove photo-cache savings. Server-to-Supabase bytes are separate.

## First-photo Before and fonts

Second test account has a real photograph in the newest card; the larger account's newest card is caption-only. Chromium 390×844, 1.6 Mbit/s down, 0.75 Mbit/s up, 150 ms latency, fresh context per cold/warm pair; CDP read guard blocks tick/non-read calls. After must use the same conditions.

| Pair | Cold card ms | Cold photo ms | Warm card ms | Warm photo ms |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1542.7 | 2244.3 | 556.9 | 556.9 |
| 2 | 1070.1 | 2107.0 | 566.2 | 566.3 |
| 3 | 1115.5 | 2138.7 | 503.3 | 503.4 |
| 4 | 1335.2 | 2037.8 | 425.4 | 441.9 |
| 5 | 1114.6 | 2098.8 | 474.1 | 492.1 |

All documents 200 with the image Link; warm photos transfer zero bytes. Fonts shrink **124,212 → 55,728 bytes** with 226 retained available codepoints and unchanged advances. These are emulated browser observations, not phone acceptance.

## False or corrected premises

- Legacy Supabase logs.all endpoint returns 410; current /logs works with its observed source/flattened schema. Initial exploration briefly rate-limited; aggregate queries succeeded.
- Planned barcode GET route does not exist. The actual barcode correction PUT is capped; other listed spending routes are covered.
- Fonts were already WOFF2 (~124 KB total), not four 97 KB TrueType files. pip was absent; ensurepip then FontTools/Brotli worked.
- Missing first-photo Link does not reproduce on the current photo-first account. No Link is correct for the larger account's caption-only newest card. Historical absence is not retroactively explained by that newer post.
- Days Auth lives in DaysScreen; Search has no redundant server getUser. Cookie forwarding and feed API/getFeed options also required narrow related changes to actually satisfy verified identity and totals deduplication.
- The plan's prefix grep matches its own preserved instruction. Full site key is absent from tracked files; the secret is never read or handled.
- Protected previews require access, and setting a public preview key requires redeployment because Next embeds it at build. Test-key verification needs a matching test secret when CAPTCHA is enabled; production stays off and its secret is unchanged. P4 under CAPTCHA-on remains unverified, with mocked fallback coverage only.
- The owner replaced fifteen-minute tick idle gaps with **one-second gaps**. No old idle-gap schedule was launched; rapid calls will not be described as cold-start proof.

## Authorized ascending merge list

| PR | Cleared full head | Migration |
| --- | --- | --- |
| #334 | `b8fd31bb7fffc7bb47c8f435794126b33486c8e9` | none |
| #335 | `5f0ea74cc024c6ee376790e003b409a8a69d99a2` | none |
| #336 | `3ae247c9e7a9430970e53004235988673fe1bd7c` | none |
| #337 | `6542ef8dbd0f7536e12434d92173e7b14dbaad31` | none |
| #338 | `2f27b38bf45270e425a37d2b099dfb0e7a51ae08` | none |
| #339 | `91b09132cf664eb73c4e99f0fd4a9ccf9f3a3fdf` | 0035_user_call_caps.sql immediately before merge |
| #340 | `1118e0fc1d0af4866b4b7714c427e5fdd5b696de` | none |
| #341 | `f7805939ff91c606fdc7f3132d5fa11497d099ed` | none |
| #342 | `4c3b827d9d4d73b9328d091d9b8b716b45d1dd1d` | none |
