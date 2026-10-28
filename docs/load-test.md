# Queue load test

Limits verified on 2026-10-28 (JST) from Meta Model API's **Pricing and rate limits**, section **Rate limits**, and USDA FoodData Central's **API Guide**, section **Rate Limits**.

| Service/model | Documented limit |
| --- | --- |
| Muse Spark 1.3, standard mode | 3,000 requests and 4,000,000 tokens per minute |
| SAM 3.1 | 3,000 requests per minute; no token limit |
| Muse Voice Transcribe 1.0 | 256 concurrent streams and 16,000 streams per hour |
| USDA FoodData Central | Default 1,000 requests per hour per IP address |

Meta applies these limits per team, separately for each model; file and realtime transcription share the stream allowance. These published limits do not guarantee measured application throughput.

Run `node --env-file=.env.local scripts/load-test.mjs` from the repository after installing dependencies, including Next's optional image-processing dependency. Required names: `APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`. `WORKER_CONCURRENCY` configures the deployed worker (1 to 4; anything else means 1); changing it only in the local test environment does not change the deployment. Set `DEPLOYED_WORKER_CONCURRENCY` to the value the deployment uses so the report records it; when unset the report says `unknown`.

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

The results above are from the one production run so far, with the test account. Observations that the table does not show:

- The runner's fifteen-minute window ended with 11 of 20 posts still queued. They were not slow: their analyze jobs were due, at attempt 0, with no worker lease held. The worker had stopped after about 330 seconds, and a manual `GET /api/jobs/tick` started it again. This is tracked as #177; until it is fixed the numbers above measure a run where nobody was ticking the queue, not the steady-state throughput.
- Both failed posts used `eval/photos/03.jpg` and failed with `spark: identify ended with status incomplete.` after three attempts.
- No 429 was observed from any service.
- The deployed worker concurrency was not read from the deployment, so the report says `unknown`; the demo setting stays at one.
