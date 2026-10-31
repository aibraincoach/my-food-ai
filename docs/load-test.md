# Queue load test

Limits verified on 2026-10-28 (JST) from Meta Model API's **Pricing and rate limits**, section **Rate limits**, and USDA FoodData Central's **API Guide**, section **Rate Limits**.

| Service/model | Documented limit |
| --- | --- |
| Muse Spark 1.3, standard mode | 3,000 requests and 4,000,000 tokens per minute |
| SAM 3.1 | 3,000 requests per minute; no token limit |
| Muse Voice Transcribe 1.0 | 256 concurrent streams and 16,000 streams per hour |
| USDA FoodData Central | Default 1,000 requests per hour per IP address |

Meta applies these limits per team, separately for each model; file and realtime transcription share the stream allowance. These published limits do not guarantee measured application throughput.

Run `node --env-file=.env.local scripts/load-test.mjs` from the repository after installing dependencies, including Next's optional image-processing dependency. Required names: `APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`. Run 4 fixes effective worker concurrency at 1, including when a legacy `WORKER_CONCURRENCY` setting requests more lanes; changing a local variable does not change the deployment. Set `DEPLOYED_WORKER_CONCURRENCY` to the value the deployment uses so the report records it; when unset the report says `unknown`.

The runner signs in as the ordinary test account using the installed SSR library's cookie encoding, schedules twenty requests six seconds apart, rotates the three existing fixture plates, and uploads original/feed JPEGs through the same application routes as the client. It observes post state every two seconds for at most fifteen minutes. Latency starts before post creation and ends at the first observed ready state, so it includes uploads and up to one polling interval. Job errors containing 429 are retained while polling because a successful retry clears the stored error. Private post identifiers are written only to a temporary local report, not this document.

The existing fixtures include empty plates; this run measures transport and queue behavior, not food-recognition accuracy. Fixture licences are recorded in `scripts/fixtures/ATTRIBUTION.md`.

<!-- load-test-results:start -->
Run started: 2026-10-28T23:16:41.017Z.

Twenty posts were scheduled across 114 seconds. Observed creation starts: 20 of 20; last start at 114.00 seconds (scheduling drift 0.00 seconds); maximum start lateness 0.00 seconds; smallest gap between starts 6.00 seconds. Starts were on the six-second pace inside the two-minute window. 20 post rows were created.
Ready: 7; failed requests/posts: 2; incomplete at observation deadline: 11.
Median time to ready: 57.36 seconds. Maximum: 329.86 seconds.

| Post | Fixture | Creation started (s) | Result | Observed ready (s) |
| --- | --- | ---: | --- | ---: |
| 1 | eval/photos/01.jpg | 0.00 | ready | 12.65 |
| 2 | eval/photos/02.jpg | 6.00 | ready | 14.96 |
| 3 | eval/photos/03.jpg | 12.00 | failed | — |
| 4 | eval/photos/01.jpg | 18.00 | ready | 57.12 |
| 5 | eval/photos/02.jpg | 24.00 | ready | 57.36 |
| 6 | eval/photos/03.jpg | 30.00 | failed | — |
| 7 | eval/photos/01.jpg | 36.00 | ready | 187.09 |
| 8 | eval/photos/02.jpg | 42.00 | ready | 233.43 |
| 9 | eval/photos/03.jpg | 48.00 | ready | 329.86 |
| 10 | eval/photos/01.jpg | 54.00 | queued | — |
| 11 | eval/photos/02.jpg | 60.00 | queued | — |
| 12 | eval/photos/03.jpg | 66.00 | queued | — |
| 13 | eval/photos/01.jpg | 72.00 | queued | — |
| 14 | eval/photos/02.jpg | 78.00 | queued | — |
| 15 | eval/photos/03.jpg | 84.00 | queued | — |
| 16 | eval/photos/01.jpg | 90.00 | queued | — |
| 17 | eval/photos/02.jpg | 96.00 | queued | — |
| 18 | eval/photos/03.jpg | 102.00 | queued | — |
| 19 | eval/photos/01.jpg | 108.00 | queued | — |
| 20 | eval/photos/02.jpg | 114.00 | queued | — |

Observed job errors containing 429:

None observed.

Worker concurrency (operator-reported via DEPLOYED_WORKER_CONCURRENCY, not read from the deployment): **unknown**. This report does not justify increasing it; confirm the deployed setting before comparing timings across runs.

This run did not complete successfully for every post. The unresolved outcomes above remain part of the result.
<!-- load-test-results:end -->

Authentication reuses `scripts/lib/session.mjs`. When available, `eval/photos/01.jpg` to `03.jpg` replace the older plate fixtures.

## Run of 2026-10-28 against production (b025d13)

The results above are the historical Oct 28 production run with the test account. Observations that the table does not show:

- The runner's fifteen-minute window ended with 11 of 20 posts still queued. They were not slow: their analyze jobs were due, at attempt 0, with no worker lease held. The worker had stopped after about 330 seconds, and a manual `GET /api/jobs/tick` started it again. This is tracked as #177; until it is fixed the numbers above measure a run where nobody was ticking the queue, not the steady-state throughput.
- Both failed posts used `eval/photos/03.jpg` and failed with `spark: identify ended with status incomplete.` after three attempts.
- No 429 was observed from any service.
- The deployed worker concurrency was not read from the deployment, so the report says `unknown`; the demo setting stays at one.

## Run 4 production test — 2026-10-31

Main and production: `34d905161cd129b30b86d305a91cedf8a183ca27`, READY, with a 300-second function duration and effective worker concurrency 1. Migration 0024 was applied in one transaction. The wake was activated at 08:06:22.337 UTC. The test began at 08:06:23.001 UTC and created twenty photo posts through the normal upload/completion path over 113.045 seconds. The harness issued no manual tick or browser-focus wake.

At 08:12:25 UTC, four posts had terminal failures. The wake configuration was removed at 08:13:02.599 UTC as ordered and verified empty; the minute schedule remains registered but cannot send HTTP without its configured origin. The fifteen-minute deadline was 08:21:23.001 UTC. The run report was written at 08:21:24.114 UTC and froze the post statuses below. A summary exported at 08:21:56.989 UTC reused that report; its export time is not a new post-status observation.

| Frozen fifteen-minute run result | Posts |
| --- | ---: |
| Ready | 0 |
| Failed | 10 |
| Processing | 2 |
| Queued | 8 |

**Failed:** the criterion required all twenty ready. No successful queue drain, worker-stall resolution or throughput is claimed. Initial minute SQL checks succeeded at 08:07, 08:08 and 08:09 while the lease was held; this does not independently demonstrate recovery from a lost worker. The wake remains disabled with zero configured origins.

Two distinct model failures were observed. Photos 01 and 02 completed identification but failed on the match decision's 256-token cap. At that first-run cutoff, reviewed PR #246 proposed raising the matcher cap to 2048 and was still unmerged. It and the later #247–#249 follow-ups have since merged; that recovery is separate from this failed run. Photo 03 sometimes exhausted identification's 2048-token initial limit and 4096-token retry, returning incomplete or partial JSON. That second defect is not fixed by #246. This diagnosis used recorded traces, without another model request. Neither the full ten-photo accuracy evaluation nor a clean rate-limit result is inferred from this run.

The separate breakfast and curry re-logs also failed after three attempts each, with no persisted items and unavailable totals. Owner food acceptance remains absent. The Oct 28 table above is retained as historical evidence. Private identifiers and signed URLs are kept out of this document.

## Successful final-head production run — 2026-10-31 16:06 UTC

Production drain PASS on `edb56d42c8a2b1dad12434a9ae4b46f6820e7a32` (READY, 300-second function duration). #239 supplies the durable scheduled wake; #246–#249 fixed the live token/capacity failures exposed by the earlier run.


Run started: 2026-10-31T16:06:24.425Z.

Twenty posts were scheduled across 114 seconds. Observed creation starts: 20 of 20; last start at 114.00 seconds (scheduling drift 0.00 seconds); maximum start lateness 0.00 seconds; smallest gap between starts 6.00 seconds. Starts were on the six-second pace inside the two-minute window. 20 post rows were created. Actual first-to-last post-row creation span: **113.119 seconds**.
Ready: 20; failed requests/posts: 0; incomplete at observation deadline: 0.
Median time to ready: 607.12 seconds. Maximum: 1205.55 seconds.

| Post | Fixture | Creation started (s) | Result | Observed ready (s) |
| --- | --- | ---: | --- | ---: |
| 1 | eval/photos/01.jpg | 0.00 | ready | 25.38 |
| 2 | eval/photos/02.jpg | 6.00 | ready | 46.46 |
| 3 | eval/photos/03.jpg | 12.00 | ready | 231.28 |
| 4 | eval/photos/01.jpg | 18.00 | ready | 252.15 |
| 5 | eval/photos/02.jpg | 24.00 | ready | 262.67 |
| 6 | eval/photos/03.jpg | 30.00 | ready | 391.57 |
| 7 | eval/photos/01.jpg | 36.00 | ready | 414.39 |
| 8 | eval/photos/02.jpg | 42.00 | ready | 433.12 |
| 9 | eval/photos/03.jpg | 48.00 | ready | 592.43 |
| 10 | eval/photos/01.jpg | 54.00 | ready | 600.86 |
| 11 | eval/photos/02.jpg | 60.00 | ready | 613.38 |
| 12 | eval/photos/03.jpg | 66.00 | ready | 758.00 |
| 13 | eval/photos/01.jpg | 72.00 | ready | 822.08 |
| 14 | eval/photos/02.jpg | 78.00 | ready | 830.49 |
| 15 | eval/photos/03.jpg | 84.00 | ready | 960.93 |
| 16 | eval/photos/01.jpg | 90.00 | ready | 984.30 |
| 17 | eval/photos/02.jpg | 96.00 | ready | 1009.32 |
| 18 | eval/photos/03.jpg | 102.00 | ready | 1174.31 |
| 19 | eval/photos/01.jpg | 108.00 | ready | 1192.96 |
| 20 | eval/photos/02.jpg | 114.00 | ready | 1205.55 |

Observed job errors containing 429:

None observed.

Verified production worker concurrency: **1** (no production WORKER_CONCURRENCY override; deployed code defaults to 1).


All twenty analysis jobs were independently re-read after completion: finished, attempts = 1, error = null. No manual tick or application browser/focus wake was used.

The minutely scheduled wake was exercised on healthy work: eight queued/no active analysis after 16:20:11 UTC; cron fired at 16:21:00.096 UTC, pg_net returned HTTP 200 at 16:21:00.153 with {"queued":8,"running":0,"traffic":"low"}; post13 was claimed at 16:21:00.876895 and finished at 16:21:17.957. No separate controlled probe was needed or executed. The configured wake remains ON after the pass.

The first fixture03 post reached ready in one attempt with 14 items and 14 resolution outcomes. Runtime completion does not establish food-match quality: many items remain nutrition-unavailable. The breakfast and curry quality results are recorded on #189; their acceptance issues remain open.

No 429 was observed in job errors. SDK-internal successful retries are not separately instrumented by this observation. The old failed run remains historical evidence and is not counted as a successful drain.

Issue #177 was closed on this result: [production proof and closure](https://github.com/aibraincoach/my-food-ai/issues/177#issuecomment-6546095477). The private post identifiers remain in local evidence, not this document.
