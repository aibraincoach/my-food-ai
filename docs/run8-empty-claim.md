# Run 8 empty job claim defect

The egress investigation recorded 405 `claim_owned_job` and 404 `fail_job` requests in a 55-second production baseline window. A read-only queue snapshot found no running or due jobs. These counts establish churn; they do not alone establish every cause.

The SQL `claim_post_job` returns NULL when no candidate is due; its `claim_owned_job` wrapper returns the composite `jobs` type. On the disposable Run 8 PostgreSQL/Auth/REST stack, with **zero due jobs**, the actual service-role Supabase RPC returned HTTP 200, no error, and:

```json
{"id":null,"post_id":null,"kind":null,"priority":null,"status":null,"attempts":null,"created_at":null,"started_at":null,"finished_at":null,"error":null,"run_after":null,"payload":null}
```

That object is truthy. The former TypeScript claim reader returned it as a job; drain dispatched its null kind, called `fail_job(null)`, reported one processed job, renewed the lease and repeated until its 60-second budget expired. This matches the observed request pattern. No production claim RPC was invoked directly for diagnosis.

The claim reader now returns null unless the response is an object with an id. Regression coverage passes the actual empty-composite shape through `drainOnce` and `runWorker`, verifies a single claim, no failure or renewal, normal release/next-wake checks, and preservation of a real job's identity.

This is a newly discovered Run 8 defect fix under the plan's defect authorization, separate from the eight planned feature PRs. Production reduction remains to be measured after deployment; local reproduction and tests do not establish the size of that reduction.
