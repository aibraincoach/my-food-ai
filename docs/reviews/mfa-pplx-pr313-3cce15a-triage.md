Triage reviewer: coder; head 3cce15a5002c3fd394c05f954bf4fd19d3720653, Gemini 3.8 Flash via PPLX.

1. Not real blocker — indices are stable within one ordered identification result, and only each slot’s kcal changes. Added post/name/index keys to make snapshot identity explicit.
2. Not real — PostgreSQL UPDATE acquires the row lock and reevaluates jsonb_set against the current row. Added an actual two-connection concurrent-update test; both independent values survive.
3. Not real blocker — the separate pending-items read is the dispatched pre-migration-compatible contract. It is limited to unsettled/failed cards, aborted after 8 seconds; no ready-card progress query runs.
4. Not real — display filtering happens only after the server has updated the original JSON array index. It does not remap stored indices or associate an item’s calories with another food.
5. Real — NULL/NULL allowed a service invocation without a live job id. Both write RPCs now require a non-null id matching active_job_id. An isolated SQL regression proves a NULL job cannot write.
6. Not real blocker — structural intersections add optional transport data without hiding incompatible required fields. Formatting follows surrounding repository code.

Real findings: 1; fixed, with two SQL tests passing including concurrency, NULL fence, service-only writes, terminal clearing and owner isolation. Same-reviewer confirmation follows.
