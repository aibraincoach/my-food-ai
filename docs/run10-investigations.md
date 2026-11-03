# Fleet 10 investigations — in progress

Read-only production measurements and designated test-account actions only. Unknown means unproven; local tests never substitute for production acceptance.

## 7a. Sign-in addresses (#368)

**Method** — Ran the exact auth.audit_log_entries query and curl-equivalent GET api.ipify.org at approximately 08:52 UTC. No production sign-up or live form probe was sent.

**Result**

| Measurement | Result |
| --- | --- |
| Audit rows returned | 0 |

**Answer** — Existing audit rows did not establish which address Supabase records for app sign-ins.

**Unknown** — Address-sharing hypothesis remains unproven; raw coder address and test identities stay private.

## 7b. Empty claims (#374)

**Method** — git log --format='%h %ad %s' --date=iso origin/main -- src/lib/queue src/lib/jobs src/app/api/jobs; gh issue view 222 --comments at 09:04 UTC; daily read-only log windows.

**Result**

| Measurement | Result |
| --- | --- |
| Daily windows requested | 7 |

**Answer** — The fixing commit is 1118e0f (#340). The originating commit/merge and first sustained one-per-second day are still being correlated.

**Unknown** — Several daily queries initially returned429 and remain under retry; no causal conclusion about #222.

## 7c. Storage egress (#375)

**Method** — Supabase Management /analytics/endpoints/logs, seven separate UTC daily windows. SQL uses log_attributes request.path, user_agent and reported content_length, grouping file kind/client. Initial seven-day request only returned the first day, verified by min/max timestamp.

**Result**

| Measurement | Result |
| --- | --- |
| Requested daily windows | 7 |

**Answer** — A full seven-day aggregate is not yet complete. Reported Content-Length is a lower bound, not billed Storage egress.

**Unknown** — Missing/zero lengths and user-agent classification cannot prove unique real users or complete billed bytes.

## 7d. Billed log ingestion (#373)

**Method** — Read-only Management project /usage request at approximately 08:55 UTC.

**Result**

| Measurement | Result |
| --- | --- |
| HTTP status | 404 |

**Answer** — The attempted endpoint did not expose billed log-ingestion bytes. Source row counts are not ingestion bytes.

**Unknown** — Supabase dashboard usage page source-byte figures remain unmeasured.

## 7e. Connections and memory (#373)

**Method** — psql "$SUPABASE_DB_URL" -c queries at 08:49:17 UTC: pg_stat_activity grouped by user/application/state; show shared_buffers; sum pg_shmem_allocations.

**Result**

| Measurement | Result |
| --- | --- |
| PostgREST idle connections | 17 |
| shared_buffers | 256 MB |
| Shared-memory allocations | 307 MB |

**Answer** — The observed connections include 17 idle PostgREST14.5 connections and separate Auth, Storage, Realtime, exporter, cron, pg_net and pooler sessions.

**Unknown** — Dashboard memory/connection values at the same time are absent, so the reported70% RAM cannot be attributed completely.

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

**Method** — Not yet completed. Local #400 test used disposable Supabase and removed its water row.

**Result**

| Measurement | Result |
| --- | --- |
| Local water-only reader regressions passed | 1 |

**Answer** — Local water-only day data/owner isolation is proven; the production six-part matrix remains open.

**Unknown** — Production #175/#224/#223/#29/#283/#23 checks, hint reset and exact test-post cleanup remain required.

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

