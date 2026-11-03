# Fleet 10 investigations — in progress

Read-only production measurements and designated test-account actions only. Unknown means unproven; local tests never substitute for production acceptance.

## 7a. Sign-in addresses (#368)

**Method** — Ran the requested `auth.audit_log_entries` query and GET `https://api.ipify.org` at approximately08:52 UTC; no production sign-up or live form probe. At10:51–10:52 UTC queried the Management Logs API with explicit columns `timestamp,event_message,log_attributes`, each source separately, last24h. Follow-up filter: `log_attributes['path'] like '%token%' or log_attributes['path'] like '%verify%' or log_attributes['auth_audit_event.action']='login'`. Raw identifiers and addresses remain private.

**Result**

| Measurement | Result |
| --- | --- |
| Requested SQL audit rows | 0 |
| Latest Auth API log rows | 30; all GET /,8 distinct remote addresses |
| Filtered token/verify Auth API rows | 0 |
| Filtered audit login rows | 30, spanning10:38:59–10:52:16 UTC |
| Address fields on those audit login rows | 0 |
| Logs API status | 200; explicit-column queries accepted |

**Answer** — Existing audit login records are readable but omit the address, and the API samples are root requests rather than sign-ins. Neither proves whether app sign-ins share a Vercel address.

**Unknown** — The address-sharing/rate-limit hypothesis remains unproven. The available existing records cannot be correlated to sign-in IPs; no live form probe was added to fill that gap.

## 7b. Empty claims (#374)

**Method** — At09:04 UTC ran `git log --format='%h %ad %s' --date=iso origin/main -- src/lib/queue src/lib/jobs src/app/api/jobs`, `git show c8dd4ec:src/lib/queue/claim.ts`, `git show 7e73cd1 -- src/lib/queue/claim.ts`, `git show 1118e0f -- src/lib/queue/claim.ts`, `gh issue view222 --comments`, and GitHub commit→PR lookups. Management Logs API queried seven adjacent daily windows spanning2026-10-27T08:58:50.308Z–2026-11-03T08:58:50.308Z with SQL `select toDate(timestamp) as day,count(*) as calls from logs where source='edge_logs' and log_attributes['request.path'] like '%/rpc/claim_owned_job%' group by day order by day`. A single seven-day request truncates to its first24h; initial429 queries were retried sequentially until every daily query returned200.

**Result**

| UTC date | claim_owned_job calls in observed window |
| --- | ---: |
| 2026-10-28 | 7731 |
| 2026-10-29 | 2417 |
| 2026-10-30 | 9773 |
| 2026-10-31 | 6909 |
| 2026-11-01 | 43325 |
| 2026-11-02 | 66933 |
| 2026-11-03 | 24089 |

**Answer** — The truthy empty-composite handling is already in `c8dd4ec`, merged in #37 onOct27 at06:10:10 UTC; `7e73cd1`, merged in #86 onOct28 at08:19:23, changes the RPC name to claim_owned_job while retaining the same missing-ID check. #340 (`1118e0f`) fixes that check. Nov2 is the first fully observed UTC day near one call per second (66,933/86,400 ≈0.775/s); #222 reports failures fromOct29 andNov2, within the observed period, but daily traffic does not establish causality.

**Unknown** — The original claim_job traffic before the retained window is not measured by this RPC-name query. Exact first sustained one-per-second onset and why any particular feed request failed remain unproven. #222 was createdOct30 but describes anOct29 report; its datedNov2 observations precede the Run8 fix. Do not equate temporal overlap with diagnosis.

## 7c. Storage egress (#375)

**Method** — Read-only Management Logs API, the same seven daily windows as7b, completed by09:20 UTC. Query groups request.path into feed copy/card/original and user_agent into automation (headless/node/undici/curl/python) or browser; sums `toUInt64OrZero(log_attributes['response.headers.content_length'])` and counts zero/missing lengths. SQL window min/max timestamps were inspected. Initial429s were retried, all seven final queries200. No raw object paths or account addresses are published here.

**Result**

| File kind | Client class | Requests | Reported bytes | Missing/zero lengths |
| --- | --- | ---: | ---: | ---: |
| card | automation | 8596 | 108881189 | 1011 |
| card | browser | 1891 | 43678883 | 35 |
| feed copy | automation | 20134 | 2379064156 | 1027 |
| feed copy | browser | 4283 | 387772572 | 37 |
| original | automation | 47666 | 4296289493 | 299 |
| original | browser | 788 | 162825965 | 8 |

**Answer** — Browser-class feed copies are the largest browser-class source:387,772,572 reported bytes over seven days (55,396,082 bytes/day averaged across this window). Automation originals are larger overall at4,296,289,493 bytes. This changes the interpretation: automated acceptance/fixture activity is a major measured Storage source. The session-refresh cache change is #391; new feed/photo timing remains to be measured after it reaches production.

**Unknown** — User-agent classification is not identity and cannot prove that every browser-class request is a real user. Content-Length is a lower bound, not billed egress, and this week includes older code. Current-deploy savings cannot be inferred from the seven-day aggregate; no unconditional new compression is justified from this table alone.

## 7d. Billed log ingestion (#373)

**Method** — Read-only Management project `/usage` request at08:55 UTC; inspected the official Studio `org-usage-query.ts` and tried its organization usage route at10:46 UTC using the available Management token. Checked [Supabase Logs Ingest documentation](https://supabase.com/docs/guides/platform/manage-your-usage/logs-ingest), updated October29.

**Result**

| Measurement | Result |
| --- | --- |
| Management project /usage | 404 |
| Management organization /usage | 404 |
| Studio platform organization /usage | 401, Unsupported access token |
| Current published billing status | Not yet billed; grace period through the start of2027 |

**Answer** — The premise of current billed log-ingestion cost is false under the published grace period. Usage is measured by ingested bytes across services; source row counts do not establish those bytes. The available token cannot read the Studio usage endpoint.

**Unknown** — Current-cycle ingested bytes and their service breakdown remain unavailable. No source-byte or bill estimate is substituted for them.

## 7e. Connections and memory (#373)

**Method** — Read-only SQL at08:49:17 UTC: `pg_stat_activity` grouped by user/application/state, `show shared_buffers`, and `sum(pg_shmem_allocations)`. At10:45:59 UTC successfully scraped the [official Metrics API](https://supabase.com/docs/guides/observability/metrics/vendor-agnostic) (HTTP200); raw output remains private. Memory percentage below uses `(MemTotal-MemAvailable)/MemTotal`, not virtual memory or summed backend RSS.

**Result**

| Measurement | Result |
| --- | --- |
| PostgREST idle connections (08:49) | 17 |
| shared_buffers | 256 MB |
| Shared-memory allocations | 307 MB |
| Node MemTotal / MemAvailable (10:45) | 950,153,216 / 260,251,648 bytes |
| Used via available-memory calculation | 689,901,568 bytes;72.61% |
| Page cache / buffers | 252,702,720 / 3,842,048 bytes |
| Swap total / free | 1,073,737,728 / 763,342,848 bytes |
| Pooler waiting / active server connections | 0 / 0 at the scrape |

**Answer** — The approximately70% memory observation is reproducible by an available-memory calculation. The SQL sessions include PostgREST, Auth, Storage, Realtime, exporter, cron, pg_net and pooler services; idle sessions do not establish active-query load. Shared buffers, other shared allocations, the OS and service processes all contribute. The measured cache is substantial and cannot simply be treated as permanently unavailable memory.

**Unknown** — These snapshots do not attribute every byte to a process or prove a leak, and SQL and metrics snapshots were taken at different times. Exporter `process_resident_memory_bytes` is not the sum of all Postgres backend memory; it is not used as such. No configuration reduction is justified solely by these readings.

## 7f. Published summaries (#228)

**Method** — Read src/lib/pipeline/wording.ts:10–12 on current main.

**Result**

| Measurement | Result |
| --- | --- |
| safeSummary return expressions | 1 |

**Answer** — safeSummary ignores model text and returns plainConsumed(totals). A model900/actual600 discrepancy publishes600.

**Unknown** — No separate production model mismatch was injected; the formatting boundary is direct code evidence.

## 7g. Capture timing (#370)

**Method** — Chromium390×844 CPU4× simulated camera with recurring canvas video frames; production before and exact preview after #386; barcode fixture uses actual decode. Detailed private timing receipts uploads/run10-capture/.

**Result**

| Measurement | Result |
| --- | --- |
| After camera encode samples | 2154.1 ms; 1877 ms |

**Answer** — The camera encode outside addFiles dominates shutter timing. Composer state now precedes barcode work and a barcode photo still opens the scanned-product result.

**Unknown** — 300 ms shutter acceptance not met. Photo/barcode/food-search tap-to-close Fast4G tables and upload bytes still pending.

## 7h. Feed opening (#222/#372/#322/#323/#324)

**Method** — Not yet completed on the final production revision; prior Run8 tables remain historical.

**Result**

| Measurement | Result |
| --- | --- |
| New ten-opening series completed | 0 |

**Answer** — No new cold-open or cold-tick acceptance is claimed.

**Unknown** — Final READY-deploy cold/warm tick, first-card/photo bytes, server calls, auth/day-read counts and ten cold opens remain required.

## 7i. Last feed (#304)

**Method** — Built #397 static shell and ran existing worker privacy suite.

**Result**

| Measurement | Result |
| --- | --- |
| Worker tests passed | 20 |
| Failed/skipped | 0 |

**Answer** — Build and worker checks support implementation; they do not establish installed-app timing.

**Unknown** — Actual Slow4G installed browser, sign-out and second-account page looks/timing remain required.

## 7j. Drink backfill (#377)

**Method** — Exact ready-current-item name anti-join at08:49:17; npx tsx --env-file=.env.local scripts/backfill-item-drinks.ts, followed by the same count query at09:00:32.

**Result**

| Measurement | Result |
| --- | --- |
| Before unmatched item rows | 25 |
| Distinct posts synchronized | 24 |
| Remaining unmatched item rows | 10 |

**Answer** — The script synchronized sequentially and lists every remaining post with an explicit unresolved-match error. Remaining names include steak/chocolate, legacy Coffee tiles and Pepsi Zero; do not infer caffeine by name.

**Unknown** — Broad anti-join is not a drink classifier. Current classification and existing atomic tile rows require per-post interpretation; no guessed nutrients were added.

## 7k. Tap/smoothness audit (#306/#217)

**Method** — Not yet measured across all seven screens.

**Result**

| Measurement | Result |
| --- | --- |
| Complete control inventories measured | 0 |

**Answer** — No blanket immediate-feedback or smoothness acceptance is claimed.

**Unknown** — Per-control first visible change, pressed state, flicker and repeated-save behavior remain required.

## 7l. Refusals (#282)

**Method** — Initial source read of src/lib/meta/client.ts retryable/fetchWithRetry, src/lib/fdc/client.ts fdcRetryAfter/retry path, src/components/PostCard.tsx failure/retry UI.

**Result**

| Measurement | Result |
| --- | --- |
| Complete production refusal acceptance sequences | 0 |

**Answer** — The code has bounded retries and a Try again control for failed meals; final detailed line citations and current offline regression execution remain to be recorded.

**Unknown** — No production refusal was induced; do not claim production refusal acceptance from source alone.

## 7m. Secondary-account checks

**Method** — Designated test account2 on production at10:14–10:17 and10:26–10:28 UTC, before final Fleet10 deployment. Chromium390×844, CPU4×, actual DevTools Fast4G165ms/1,012,500 B/s down/168,750 B/s up. Explicit Asia/Tokyo timezone verified separately from geolocation. Real spaghetti fixture; synthetic camera used only for controls/hints. Stored instants, current item amounts and actual downloaded PNG rasters were inspected.

**Result**

| Check | Actual observation | Answer / remaining work |
|---|---|---|
| #175 Water tile | Water glass posted201, Edit time moved it to an otherwise empty Oct22. Days enabled that date, accessible label “2026-10-22, 1 post, 0 kcal”. | Exact plan date-visibility case passes. Dialog body was sampled before it appeared; no claim about its water total from that sample. Final runner now waits for the dialog. |
| #175 stronger standalone intake | Owner-scoped250ml water row on otherwise emptyOct19, no post. Days button disabled, no drank label. | Baseline failure of standalone intake handling before#400; distinct from Water tile, which creates a post. |
| #224 Tokyo clocks | Caption meal eaten_at08:57Z: feed/card/detail/Days5:57PM. Model comment created10:27:17Z: thread7:27PM. Each observed clock matched its own stored instant inTokyo. | Pass for these actual surfaces/instants. Initial run sampled clocks before hydration; that empty sample was a driver issue, not evidence of a clock defect. |
| #223 edited caption | PATCH200; reload; exact edited caption visible on feed, detail, actual meal slide inDays andSearch. | Pass. Initial falseDays result inspected the summary slide; follow-up selected the meal. |
| #29 caption-only | Actual CONSUMED129kcal card visible. | Pass. |
| #29 photo/carousel/correction | Real photo ready; carousel contained photo, live314kcal results card and add-leftovers slide. Real touch gesture changed scroll position. “I ate half the spaghetti.” correction changed current item200g→100g and downloadedPNG314→157kcal. | Card update verified from actual changed raster, not stable mediaID. Swipe overshot the card to the add slide; final driver will target one slide precisely. |
| #283 PNG | Actual signedStorage downloads were1080×1080. One-photo PNG55,276B, corrected55,408B, leftovers51,251B. Food/water/leftovers footer clipped horizontally beyond canvas in all three. | Real failure#421, fixPR#422. Before/after actual ImageResponse PNG and raster regression supplied. Final production download still required afterdeploy. |
| #23 capture/thread/thumbs | Each first appeared inviewport, dismissal persisted, revisits0. | Pass for these three. |
| #23 modes | Current deployed “Swipe to scan a barcode” tip appeared. Got it hid it, DBseenkeys never gainedmodes; revisitcount1. | Real failure#423. Migration0013 rejects modes;0042fixPR pending. Oldcopy mismatch initially hid this from driver. |


**Answer** — Caption propagation, tested clocks, results cards and three hint dismissals passed these baseline observations. Standalone intake dates, PNG clipping and modes-hint persistence exposed concrete defects addressed by #400, #422 and #425. The same spaghetti image marked as leftovers exercises footer mechanics only; it does not establish portion-estimation accuracy.

**Unknown** — Final production repeat after all fixes remains required. Initial premature hydration reads and a Days summary-slide selection were driver errors; corrected observations above supersede them. Both runs removed only their tracked fixture posts/media/intake, restored prior preferences/hints, and verified cleanup with no issues. Private receipts are retained under ignored `uploads/run10-coffee-acceptance/`.

## 7n. Real matcher (#272)

**Method** — #394 offline third-search regression passed; paid five-by-two real matcher run not yet performed.

**Result**

| Measurement | Result |
| --- | --- |
| Third-search regression passed | 1 |

**Answer** — The bounded third search is built. No real reference resolution is inferred from the stub.

**Unknown** — UnderUS$1 real API choices/reasons and both designated-account production meals remain required.

## 7o. Terms (#294)

**Method** — #398 replaces the exact old leftovers label throughout current src files and runs wording tests. Full requested term listing pending.

**Result**

| Measurement | Result |
| --- | --- |
| Wording tests passed | 2 |
| Failed/skipped | 0 |

**Answer** — The instructed leftovers label change is built; other term recommendations remain with RT.

**Unknown** — The requested file/line term inventory and empty Recommended column still need publication.

## 7p. Visual reconciliation (#193/#353–#367)

**Method** — gh issue list --state all --limit200 --json number,title,body,state and git show origin/run9/docs:docs/design/visual-pass.md at approximately09:00 UTC.

**Result**

| Measurement | Result |
| --- | --- |
| Visual issues initially open | 15 |

**Answer** — The full visual backlog remains in scope; Fleet9 partial observations are not acceptance for Fleet10.

**Unknown** — Per-issue current rendered comparison, separate fix PR and before/after page look remain required.

