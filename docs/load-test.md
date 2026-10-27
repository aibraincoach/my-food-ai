# Queue load test

Limits verified on 2026-10-28 (JST) from Meta Model API's **Pricing and rate limits**, section **Rate limits**, and USDA FoodData Central's **API Guide**, section **Rate Limits**.

| Service/model | Documented limit |
| --- | --- |
| Muse Spark 1.3, standard mode | 3,000 requests and 4,000,000 tokens per minute |
| SAM 3.1 | 3,000 requests per minute; no token limit |
| Muse Voice Transcribe 1.0 | 256 concurrent streams and 16,000 streams per hour |
| USDA FoodData Central | Default 1,000 requests per hour per IP address |

Meta applies these limits per team, separately for each model; file and realtime transcription share the stream allowance. These published limits do not guarantee measured application throughput.

Run `node --env-file=.env.local scripts/load-test.mjs` from the repository after installing dependencies, including Next's optional image-processing dependency. Required names: `APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`. `WORKER_CONCURRENCY` configures the deployed worker; changing it only in the local test environment does not change the deployment.

The runner signs in as the ordinary test account using the installed SSR library's cookie encoding, schedules twenty requests six seconds apart, rotates the three existing fixture plates, and uploads original/feed JPEGs through the same application routes as the client. It observes post state every two seconds for at most fifteen minutes. Latency starts before post creation and ends at the first observed ready state, so it includes uploads and up to one polling interval. Job errors containing 429 are retained while polling because a successful retry clears the stored error. Private post identifiers are written only to a temporary local report, not this document.

The existing fixtures include empty plates; this run measures transport and queue behavior, not food-recognition accuracy. Fixture licences are recorded in `scripts/fixtures/ATTRIBUTION.md`.

<!-- load-test-results:start -->
Not run yet. No latency, throughput or successful-completion claim is made.

Demo worker concurrency: **1**, the default. Keep it at one until a completed production run supplies evidence to change it.
<!-- load-test-results:end -->

Production execution is deferred until after the merge phase. Authentication reuses `scripts/lib/session.mjs`. When available, `eval/photos/01.jpg` to `03.jpg` replace the older plate fixtures.
