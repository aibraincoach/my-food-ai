Triage reviewer: coder; external reviewer Gemini 3.8 Flash through PPLX; head 00645cedf94cb93d03312defe626a02746d676e3.

1. Not real — database/app clock skew in lease renewal. Both the ownership-expiry predicate and the new expiry are evaluated by PostgreSQL's clock. The worker renews after each completed job rather than comparing a returned absolute database expiry against a local wall clock. No app/database epoch comparison was introduced.
2. Not real — serialization exception in rate-limit requeue. The post-before-job lock order and post-ID recheck match existing fail_job semantics. A changed post/job relationship raises40001, rolls back that RPC transaction and reaches the route's normal error reporting; it cannot commit a partial queue/post transition. The isolated SQL test also proves a superseded job cannot revive itself over new work.
3. Not real — syntactically unbounded retry loop. Every first non429 response returns. A first429 with a known short delay waits once; attempt1 throws FdcRateLimited before any further wait. Local HTTP tests prove exactly two calls for repeated429. Rewriting the loop guard is optional style.
4. Real — missing/malformed Retry-After fell through to the finite failed-attempt ladder. Fixed: every429 without a valid hint now throws FdcRateLimited with a conservative60-second durable default, without a60-second in-process wait. Known seconds/date hints retain their exact provider deadline. The new local HTTP regression proves both absent and malformed hints defer with only one request.
5. Not real — Meta diagnostic masking consistency. This change maps MetaApiError to fixed meta-prefixed public classification and recognizes fdcprefixed failures. Unrecognized errors retain the existing generic failure text; raw diagnostics never become displayed copy. The review supplied no other provider shape that is newly exposed or loses its retry classification.

The sole real finding is fixed on the follow-up source head; exact-head Gemini confirmation is requested after checks and push.

Real findings: 0
