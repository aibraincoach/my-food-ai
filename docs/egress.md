# Database egress and log observations

## Fleet14 attribution — November 4, 2026

File/client-class response-byte tables and the memory/connection interpretation are in [run14-report.md](run14-report.md). User-agent automation classes include server runtimes serving real users; they are not a verified bot/human split. Response Content-Length is not billed egress or log-ingestion bytes. The first two hourly resource samples are available; the six-hour series is still active. #373/#375 remain open.

## Before

Window: 2026-11-02T04:15:17.615Z through 2026-11-03T04:15:17.615Z. Read-only aggregate logs. Response bytes are reported Content-Length, not billed egress; missing lengths are explicitly counted. Log row counts are not ingestion byte totals.

Legacy log API unavailable: the plan’s `logs.all` endpoint returned an error. The current `/logs` endpoint is used below when available.

### Edge requests by path prefix

| bytes_missing_or_zero | path_prefix | requests | response_bytes |
| --- | --- | --- | --- |
| 1065 | /storage/v1/object/… | 35048 | 2986275217 |
| 0 | /rest/v1/rpc/try_acquire_worker_lease | 70155 | 280959 |
| 63 | /rest/v1/profiles | 3237 | 127696 |
| 31734 | /rest/v1/posts | 33851 | 52081 |
| 6 | /rest/v1/rpc/renew_worker_lease | 5107 | 20404 |
| 6213 | /rest/v1/intake_logs | 8461 | 17818 |
| 495 | /rest/v1/saved_meals | 9094 | 17514 |
| 1 | /rest/v1/worker_lease | 130 | 11008 |
| 30976 | /rest/v1/rpc/feedback_revision | 31130 | 10982 |
| 15538 | /rest/v1/current_post_items | 15645 | 6968 |
| 945 | /rest/v1/post_feedback | 4217 | 6544 |
| 0 | /rest/v1/rpc/next_worker_wake | 183 | 5187 |
| 21 | /rest/v1/rpc/reserve_post_upload_with_leftovers | 92 | 4718 |
| 19444 | /rest/v1/post_media | 19719 | 4272 |
| 2518 | /rest/v1/jobs | 2641 | 3379 |
| 222 | /rest/v1/post_items | 289 | 2426 |
| 14 | /rest/v1/rpc/publish_results_card | 74 | 2135 |
| 144 | /rest/v1/post_comments | 252 | 1456 |
| 88 | /rest/v1/agent_tokens | 105 | 1126 |
| 8 | /rest/v1/rpc/append_post_comment | 23 | 1050 |
| 1 | /rest/v1/rpc/persist_correction | 23 | 1048 |
| 11 | /rest/v1/rpc/publish_uploaded_post | 37 | 988 |
| 0 | /rest/v1/rpc/dismiss_hint | 6 | 408 |
| 0 | /rest/v1/rpc/reserve_post_upload_with_options | 6 | 396 |
| 0 | /rest/v1/rpc/create_drink_post | 7 | 266 |
| 0 | /rest/v1/rpc/queue_post_remainder | 48 | 240 |
| 0 | /rest/v1/rpc/save_ready_meal | 60 | 240 |
| 231 | /rest/v1/fdc_cache | 333 | 204 |
| 6 | /rest/v1/rpc/search_own_posts | 8 | 192 |
| 0 | /rest/v1/rpc/complete_post_photo_attachment | 5 | 190 |
| 3 | /rest/v1/label_readings | 10 | 143 |
| 0 | /rest/v1/rpc/create_food_post | 3 | 114 |
| 12 | /rest/v1/push_subscriptions | 65 | 106 |
| 49 | /rest/v1/post_upload_drafts | 53 | 81 |
| 0 | /rest/v1/rpc/agent_log_meal | 2 | 76 |
| 0 | /rest/v1/rpc/post_work_matches | 15 | 75 |
| 706 | /rest/v1/model_calls | 733 | 54 |
| 12826 | /rest/v1/item_nutrition | 12832 | 48 |
| 0 | /rest/v1/rpc/barcode_shared_name | 10 | 40 |
| 0 | /rest/v1/rpc/agent_hit | 7 | 28 |
| 0 | /rest/v1/rpc/apply_post_remainder | 4 | 16 |
| 4 | other | 11 | 14 |
| 14 | /rest/v1/post_locations | 21 | 14 |
| 1 | /rest/v1/rpc/set_identify_provider | 3 | 12 |
| 12 | /rest/v1/agent_activity | 17 | 10 |
| 0 | /rest/v1/rpc/persist_removed_rebuild | 2 | 8 |
| 1 | /rest/v1/rpc/revert_correction | 3 | 8 |
| 0 | /rest/v1/rpc/mark_post_ready | 2 | 8 |
| 1 | /rest/v1/post_photo_attachments | 4 | 6 |
| 1 | /rest/v1/rpc/delete_post | 2 | 4 |
| 0 | /rest/v1/rpc/remove_post_media | 1 | 4 |
| 0 | /rest/v1/rpc/persist_photo_correction | 1 | 4 |
| 8 | /rest/v1/barcode_corrections | 10 | 4 |
| 348 | /realtime/… | 348 | 0 |
| 6 | /rest/v1/rpc/prepare_post_photo_attachment | 6 | 0 |
| 16 | /rest/v1/rpc/sync_item_drinks | 16 | 0 |
| 203 | /rest/v1/rpc/release_worker_lease | 203 | 0 |
| 26815 | /auth/v1/… | 26815 | 0 |
| 47 | /rest/v1/rpc/persist_owned_analysis | 47 | 0 |
| 74736 | /rest/v1/rpc/claim_owned_job | 74736 | 0 |
| 59 | /rest/v1/rpc/meal_prior_candidates | 59 | 0 |
| 12 | /rest/v1/events | 12 | 0 |
| 1 | /rest/v1/rpc/persist_identified_analysis | 1 | 0 |
| 74 | /rest/v1/rpc/results_card_snapshot | 74 | 0 |
| 74698 | /rest/v1/rpc/fail_job | 74698 | 0 |
| 2 | /rest/v1/rpc/write_pending_names | 2 | 0 |
| 1 | /rest/v1/rpc/write_pending_kcal | 1 | 0 |

### Edge requests by user agent class

| bytes_missing_or_zero | requests | response_bytes | user_agent |
| --- | --- | --- | --- |
| 82204 | 125834 | 2946487692 | browser |
| 211679 | 298467 | 40370350 | server runtime |
| 6537 | 6544 | 14 | other/absent |

### Log rows by source

| rows | source |
| --- | --- |
| 430845 | edge_logs |
| 29317 | storage_logs |
| 27107 | auth_logs |
| 24123 | pgbouncer_logs |
| 4668 | postgres_logs |
| 1883 | postgrest_logs |
| 1399 | supavisor_logs |
| 482 | auth_audit_logs |
| 372 | realtime_logs |

## What dominates this window

Storage has the largest measured Content-Length sum: 2,986,275,217 bytes across 35,048 requests. Browser-class agents account for 2,946,487,692 reported bytes. These are lower bounds: many compressed REST/auth responses do not log Content-Length. The browser network observations below show that REST reads also carry substantial bytes; a zero log sum does not mean no egress.

Edge requests dominate the row count (430,845). The same window includes 74,736 `claim_owned_job`, 74,698 `fail_job` and 70,155 `try_acquire_worker_lease` requests. Their number establishes queue-related log traffic, not the cause of any repeated job. A read-only current SQL snapshot found zero running or due queued jobs; two future cleanup jobs were queued at attempt zero. No worker or job was retried by this investigation. Source row counts cannot establish billed log-ingestion bytes.

The plan’s P7 was false: `logs.all` returned HTTP 410. The [Supabase migration notice](https://supabase.com/changelog/48235-migration-of-supabase-management-api-logs-all-analytics-endpoint-to-logs-endpoint) identifies `/logs` as the replacement. Actual queries use its observed `source` column and flattened attributes. Initial schema exploration briefly received HTTP429; the recorded aggregate queries subsequently succeeded.

## Before: actual production browser openings

Production revision: `58d127b999163bfb8212fa8145482ae875ed2276`. Designated larger test account: 147 posts, 20 rendered cards in each opening. Chromium at 390×844, Asia/Jakarta, unthrottled; browser cache cleared before opening 1 only. Each sample ends ten seconds after cards appeared. CDP `Network.loadingFinished.encodedDataLength` sums received wire bytes, including response headers; it is not billing usage. Requests still unfinished at the cutoff are omitted. Only Supabase-host browser traffic is in the Supabase column, so server-to-Supabase traffic is separate.

| Opening | Start UTC, Nov 3 | End UTC | Browser Supabase bytes | Same-origin feed-photo bytes | Other app bytes |
| --- | --- | --- | --- | --- | --- |
| 1 | 04:14:11.934 | 04:14:23.165 | 4367543 | 0 | 528354 |
| 2 | 04:14:23.189 | 04:14:34.039 | 4373262 | 0 | 50423 |
| 3 | 04:14:34.050 | 04:14:45.293 | 5518553 | 0 | 50478 |
| 4 | 04:14:45.298 | 04:14:56.082 | 5518552 | 0 | 50652 |
| 5 | 04:14:56.088 | 04:15:06.903 | 5515733 | 0 | 49862 |

In these recent caption-heavy feed openings, the optimized photo route was not requested in the first viewport. Repeated `/rest/v1/posts` responses around 383.6 KB dominate the browser traffic. This baseline cannot demonstrate a photo-cache saving by itself. Full sanitized per-request byte observations remain in ignored local receipts; no account IDs or session cookies are committed.

## Changes and After status

Successful first-photo responses now carry `private, max-age=31536000, immutable` and a quoted `<media-id>-v1` ETag. `Vary: Cookie` partitions HTTP-cache entries by the current session cookies, including on 304 responses. Authentication, owning-user comparison, RLS media/post lookup and safe storage path checks still run before a conditional 304; that response does not read Storage. All errors and fallback redirects retain `private, no-store`. This is **private browser caching**, not public Vercel edge caching: P8's public `s-maxage` premise is not used for private meal photos. The service worker retains its account/epoch-scoped Cache API checks. A browser regression exposed a second cache: a year-fresh HTTP response could survive logout even after Cache API clearing. Ineligible image clients now fetch with `cache: no-store`, forcing the origin ownership check; eligible sessions retain ordinary HTTP caching.

Queue ticks still run on mount and focus, and now wake after post creation and upload start/finish. Only a response reporting positive queued+running work schedules another tick after 60 seconds. Concurrent wake events coalesce, requests time out after ten seconds, and teardown removes listeners/timers. The database cron wake is unchanged.

Five preview After openings and log-window measurements are pending preview access. The preview remains protected, and no bypass or project setting was changed in Part 1. The production five-open After series is Part 2. No before/after reduction is claimed until those measurements exist.

## Log window matching the five Before openings

This window also includes concurrent project traffic; it is not isolated billing for this browser.

Window: 2026-11-03T04:14:11.934Z through 2026-11-03T04:15:06.903Z. Read-only aggregate logs. Response bytes are reported Content-Length, not billed egress; missing lengths are explicitly counted. Log row counts are not ingestion byte totals.

Legacy log API unavailable: the plan’s `logs.all` endpoint returned an error. The current `/logs` endpoint is used below when available.

### Edge requests by path prefix

| bytes_missing_or_zero | path_prefix | requests | response_bytes |
| --- | --- | --- | --- |
| 1 | /storage/v1/object/… | 72 | 1624499 |
| 1 | /rest/v1/profiles | 116 | 4880 |
| 0 | /rest/v1/rpc/renew_worker_lease | 404 | 1616 |
| 98 | /rest/v1/current_post_items | 103 | 480 |
| 20 | /rest/v1/post_feedback | 126 | 212 |
| 0 | /rest/v1/saved_meals | 52 | 104 |
| 0 | /rest/v1/rpc/try_acquire_worker_lease | 5 | 24 |
| 444 | /rest/v1/posts | 454 | 20 |
| 800 | /rest/v1/rpc/feedback_revision | 800 | 0 |
| 11 | /rest/v1/jobs | 11 | 0 |
| 5 | /realtime/… | 5 | 0 |
| 58 | /rest/v1/post_media | 58 | 0 |
| 405 | /rest/v1/rpc/claim_owned_job | 405 | 0 |
| 82 | /rest/v1/intake_logs | 82 | 0 |
| 410 | /auth/v1/… | 410 | 0 |
| 404 | /rest/v1/rpc/fail_job | 404 | 0 |

### Edge requests by user agent class

| bytes_missing_or_zero | requests | response_bytes | user_agent |
| --- | --- | --- | --- |
| 199 | 344 | 1157460 | browser |
| 2540 | 3163 | 474375 | server runtime |

### Log rows by source

| rows | source |
| --- | --- |
| 3507 | edge_logs |
| 406 | auth_logs |
| 63 | pgbouncer_logs |
| 61 | storage_logs |
| 12 | realtime_logs |
| 6 | postgres_logs |


The matched window includes 405 successful `claim_owned_job` responses (HTTP 200) and 404 successful `fail_job` responses (HTTP 204), all with the `node` agent. Current database snapshots show zero running/due jobs. This is a queue churn investigation lead, not proof of hundreds of real meal failures. It has been escalated separately; no job was manually retried or changed here.

## Verification

- `npx tsc --noEmit`: exit 0.
- `npx eslint src/components/QueueTicker.tsx 'src/app/api/media/feed/[owner]/[post]/[media]/v1.webp/route.ts' scripts/egress-report.mjs`: exit 0.
- `npm run build`: exit 0. The first attempt used a symlink outside Turbopack’s workspace root and failed package resolution; the passing rerun used a local dependency copy.
- `node --import tsx --test tests/feed-photo.test.mjs`: exit 0, 6/6 passed.
- Local VM regression: authorized matching ETag returns 304 with no Storage access; signed-out conditional request returns 401/no-store: passed.
- Local effect/timer regression: idle mount does not poll, work schedules 60 s, focus clears an idle timer, post/upload events wake, teardown removes listeners: passed.
- `node --check scripts/egress-report.mjs`, `git diff --check`: exit 0.

## Browser HTTP-cache privacy follow-up

The initial year-cache candidate reproduced a leak in an actual Chromium/local-app check: warm an authenticated private photo, send/acknowledge the worker’s clear-media transition, remove media Cache API/local storage entries and auth cookies, then fetch the same URL. The disabled worker’s network fallback returned the old HTTP-cached 200 and all 21,286 bytes. No production sign-out ran.

The fix sends ineligible media fetches with `cache: no-store`, covering logged-out, unbound and foreign-owner clients. A fresh actual-browser check, with the owning client explicitly bound before warming its eligible cache, returns 401/no-store/zero bytes after the same simulated logout. The normal authorized response remains private/immutable for a year. The service-worker regression suite now models a separate HTTP cache and proves logout cannot borrow its bytes; 20/20 tests pass. A separate unbound-client regression verifies no-store at that boundary.

`Vary: Cookie` additionally prevents an uncontrolled browser page from borrowing a photo cached under previous authentication cookies. This covers the boundary before a service worker controls the page. A cookie refresh can require another HTTP read, while the eligible account-scoped service-worker cache remains reusable.

Built-app browser verification also tested a page with no service worker: without `Vary: Cookie`, clearing authentication cookies still returned the cached 200/21,286-byte photo; with the partition header it returned 401/no-store/zero bytes. The final built-app controlled-worker case also returned 401/zero bytes. These tests change only isolated browser cookies/storage and never call production sign-out.

Final follow-up checks: `node --import tsx --test tests/feed-photo.test.mjs` exits 0, 7/7 tests; `node --test tests/sw-media-cache.test.mjs` exits 0, 20/20 tests. TypeScript, changed-file ESLint, `npm run build` and whitespace checks pass on the follow-up source. No production migration or environment setting changed.

## Follow-up: repeated day totals dominate actual browser egress

The five exact-A preview openings transferred 6,264,195 / 5,781,481 / 5,156,996 / 5,540,662 / 6,309,256 Supabase wire bytes (20 cards each, ten-second settle, browser cache cleared only before the first). These figures show **no reduction** against the earlier production five-open baseline. The private optimized photo route was not requested in this caption-heavy first viewport, so its cache header cannot explain a saving here. Across the five previews, `/rest/v1/posts` accounted for 24,626,684 browser bytes; Storage paths accounted for 4,264,680.

An additional diagnostic Home opening captured the PostgREST select text: 25 calls to the exact `getDayTotals` nested item/nutrition query transferred 4,219,412 bytes. Other post metadata selects transferred roughly 15 KB combined. `Feed.requestCard` called `refreshTotals` for each refreshed card; cards on the same day repeatedly fetched the entire day's nutrients.

The follow-up batches those requests by day before starting a read and permits only one read at a time. Events that arrive mid-read keep a per-day revision and queue one fresh follow-up; older results for changed days cannot overwrite them. Cancellation suppresses late results. Nutrition queries and legacy normalization remain unchanged: micronutrients are still needed to normalize older stored per-100g rows correctly.

Regression tests exercise twenty-card bursts, an edit arriving during a read, partial-day stale-response rejection, failure/retry and unmount cancellation. Actual combined-preview and post-merge production five-open measurements follow in the execution report; the byte reduction is not inferred from unit counts alone.

## Final production acceptance — Run 8

# Run 8 egress and log results

Production after PR #343: `6996817cec6aaf865357e9fee6550abf27cdfd0f`.

## Five-opening comparisons

| Opening | Original production bytes | Initial cache preview bytes | Coalescer preview bytes | Final production bytes | Final day-total queries |
| --- | --- | --- | --- | --- | --- |
| 1 | 4,367,543 | 6,264,195 | 1,224,054 | 531,829 | 2 |
| 2 | 4,373,262 | 5,781,481 | 1,321,313 | 535,913 | 1 |
| 3 | 5,518,553 | 5,156,996 | 1,122,930 | 529,103 | 1 |
| 4 | 5,518,552 | 5,540,662 | 1,121,509 | 537,279 | 1 |
| 5 | 5,515,733 | 6,309,256 | 1,122,856 | 480,426 | 1 |

Mean direct browser Supabase traffic fell from **5,058,728.6 bytes to 522,910 bytes**, 89.7% below the original baseline. The initial cache preview averaged 5,810,518 bytes and showed no reduction; that failed result remains in the table. The coalescer preview averaged 1,182,532.4 bytes.

Every series used the same designated larger account, 20 rendered cards, 390×844 viewport, unthrottled network, cache cleared only before opening 1, and a ten-second settle after cards appeared. CDP encodedDataLength includes response headers. These are observed browser transfers, not billed egress; server-to-Supabase traffic is separate. The caption-heavy first viewport did not request the optimized first-photo route, so the reduction is not attributed to its cache header.

A diagnostic identified the actual repeated query: getDayTotals fetched nested nutrition/micronutrients 25 times, transferring 4,219,412 bytes in one opening. A second diagnostic on all-nine-PR production `3e4f23b`, immediately before #343, still made 28 such reads / 5,370,521 bytes and transferred 5,660,156 bytes overall. Final production made only 1–2 reads / about 383.6 KB per opening. PR #343 coalesces refreshed days without dropping nutrition fields or changing legacy calorie normalization.

## Queue and log observations

| RPC | Original 54.969 s window | Fixed preview 55.343 s window | Final production 55.488 s window |
| --- | --- | --- | --- |
| claim_owned_job | 405 | 6 | 0 |
| fail_job | 404 | 0 | 0 |
| renew_worker_lease | 404 | 0 | 0 |
| try_acquire_worker_lease | 5 | 6 | 0 |
| release_worker_lease | 0 | 6 | 0 |

Windows, November 3 UTC:

- Original: 04:14:11.934–04:15:06.903.
- Fixed preview: 04:48:16.242–04:49:11.585.
- Final production: 04:54:49.186–04:55:44.674.

The original hundreds of claim/fail pairs occurred with no running or due jobs. The fixed preview still had the two future cleanup jobs pending, yet showed six empty-queue checks and no fail/renewal loop. Those jobs' single real attempts completed at 04:52; the final production window afterward had an empty queue. This distinction avoids attributing the entire final-zero count to code alone. PR #340's regression independently proves null-composite normalization. Window counts include concurrent project activity and are not isolated billing measurements.

Final matching log totals were 2,206 edge rows, 389 Auth rows, 67 Storage rows, 57 pooler rows, two AuthAudit rows and two Postgres rows. Logged Content-Length sums were 1,106,586 browser-class bytes and 457,194 server-runtime bytes. Many compressed REST responses lack Content-Length; those sums are lower bounds and cannot replace the actual browser transfer measurements or quantify billed log-ingestion bytes.

The 24-hour Before tables identify Storage as the largest reported byte source (2,986,275,217 bytes / 35,048 requests), and edge requests as the largest log-row source (430,845 rows). The legacy logs.all API returned HTTP 410; the replacement /logs API supplied the reported aggregate tables.

## Connection ownership

A read-only snapshot observed 45 connections including the monitor: 15 idle PostgREST, 11 idle Storage, seven idle unlabelled connections (three Auth service and four other system/service roles), plus Realtime pools/replication, exporter, cron and pg_net. The only active SQL client was the monitor. Most connections were service pools waiting for client input. This does not establish a leak or explain the earlier 70% RAM reading.

## Receipt locations

Private raw observations and sanitized tables are retained under uploads/run8-egress. Relevant files: browser-before.json, browser-preview-after.json, browser-totals-preview.json, browser-allnine-before.json, browser-production-after.json; log-before-window.md, log-preview-window.md, log-totals-preview-window.md, log-production-after-window.md; connections.txt and queue-after.txt. Session cookies and bypass tokens are not included in these committed summaries. All browser contexts owned by this lane are closed; no local server or worktree remains.

Source: production `6996817cec6aaf865357e9fee6550abf27cdfd0f`. The [final execution report](run8-final-report.md) and [sanitized raw receipt](evidence/run8-production/receipt.md) record the deployment and other acceptance gates.
