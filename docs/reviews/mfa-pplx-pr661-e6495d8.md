Head at submission: e6495d8c12ec7116dd7734effa3cd01fbba0d127
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 18.6s
Elapsed since tab open: 22.5s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/661

Answer
Links
Images
Share
11:14 AM

code review 
 aibraincoach/my-food-ai#661

Finished
8s

Pull request 
 aibraincoach/my-food-ai#661 (fix18: drain requires worker lease (F1/#640)) adds a lease-ownership check to /api/jobs/drain so the endpoint returns 409 Conflict when holder does not hold an unexpired worker_lease. The change is small (3 files, +29 lines) and already merged, but it has a few concurrency, clock-skew, and test-coverage gaps worth noting.

Strengths

Minimal, targeted diff: holdsActiveLease in src/lib/queue/lease.ts cleanly encapsulates the worker_lease lookup and reuses ioError for consistent Supabase error handling.

Explicit failure status: Returning 409 with "Not the lease holder." in src/app/api/jobs/drain/route.ts gives callers a clear, non-500 signal when the lease is missing or expired.

Risks and Issues

TOCTOU race condition: holdsActiveLease(admin, holder) runs as a separate read before runWorker(admin, holder, ...). A lease can expire or be acquired by another worker between the check and runWorker starting, so runWorker must still enforce lease ownership internally (e.g., via renewLease or atomic claim/update).

App-vs-DB clock skew: holdsActiveLease filters .gt("expires_at", new Date().toISOString()) using the application server's clock rather than PostgreSQL's now(). If acquireLease or renewLease sets expires_at using database time, even a small clock skew between the app server and Supabase can cause false positives or false negatives near expiration.

Static-only test: tests/drain-lease.test.mjs only reads the source files with readFileSync and matches regexes (holdsActiveLease, 409, Not the lease holder). It does not verify runtime behavior—such as returning 409 when holdsActiveLease is false, calling runWorker when true, or propagating 500 if holdsActiveLease throws.

Recommendations

Use database time for expiration: If worker_lease RPCs already exist, consider checking active lease ownership via an RPC that compares expires_at > now() in SQL, or ensure all lease timestamps are consistently generated from the same clock.

Add behavioral unit tests: Mock holdsActiveLease and runWorker in tests/drain-lease.test.mjs (or a dedicated route test) to assert the actual HTTP 409 response, that runWorker is skipped on false, and that runWorker is invoked on true.

Write an integration test for the lease check
How can we fix the TOCTOU race condition
Switch expires_at to use Postgres now()
Review the runWorker implementation
Show the full diff of the PR
Sources
⠧
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen