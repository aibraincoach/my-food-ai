# Finding: local shared-secret sessions made one sign-in call per server request (#323)

Fleet 28, 2026-11-17. This preserves Fleet 26's corrected local K5 counts and the planner's source explanation. It makes no fresh production measurement and changes no code or setting.

**Dispatch override:** the Fleet 28 PM dispatch explicitly states that production already signs with ES256, based on the provided Fleet 22/24 readings. It forbids JWT signing or project-setting changes. The copied plan remains unchanged as a historical planning artifact, but its assumption that production uses the local shared secret and its migration/rotation recommendation are superseded here. Do not change the existing production key on the strength of this finding.

## What was measured

Fleet 26's accepted K5 runs used a fresh local profile per page and counted a navigation plus a ten-second wait. The server-side `/auth/v1/user` counts and browser page/RSC/API totals were:

| Page | `/user` calls | Page | RSC | API | Page + RSC + API |
|---|---:|---:|---:|---:|---:|
| Home | 19 | 1 | 18 | 0 | 19 |
| Days | 10 | 1 | 8 | 1 | 10 |
| Profile | 20 | 1 | 19 | 0 | 20 |

The browser itself made no sign-in call in that accepted reading. The server counts equal the matched page/RSC/API totals; no request-correlated server spans were retained, so equality is not a distributed per-request trace. The earlier 17/11/17 windows were contaminated by old tabs and remain invalid. These are retained local results, not a new Fleet 28 run or a production sign-in rate.

Source: Fleet 26's `stop-report.md`, accepted K5 paragraph, and its retained verification/K5.json. The complete navigation/wait spans were about 11.2–11.4 seconds, not ten-second load timings.

## Why the local stack makes these calls

`src/middleware.ts` calls `supabase.auth.getClaims()` once on each request it matches under `/`, `/search`, `/days`, `/profile`, `/posts` and `/admin`. In the planner-read `@supabase/auth-js` 2.118.0, a shared-secret/HS token, or a token without the asymmetric key information needed for local verification, falls back to `getUser`, which calls `/auth/v1/user`. The disposable stack signs with `GOTRUE_JWT_SECRET` in `scripts/test-stack.mjs`.

This source mechanism explains why the local result can show one sign-in-service call per matched request. RSC prefetches contribute requests as well as the top-level page. It does not establish the same mechanism or count for production.

## Production disposition

The dispatch's provided production reading is ES256, not the local shared-secret configuration. Valid asymmetric sessions with a key id can be verified using the public signing key; fetching/caching those keys is separate from a `/user` call. Route handlers that explicitly call `getUser` (for example the added-media route) can still make their own call, and session refresh/error paths have their own behavior.

No JWT secret migration, rotation, project-setting change or new production read was performed or recommended by this task. Turning off link prefetching was not implemented either; that has a meal-open tradeoff outside this finding. The original plan's “What would fix it” action is not an applicable production repair under the current dispatch.

## Not established

A current production request count, production per-request Auth trace, any change in production sign-in traffic, and an end-to-end phone/session result were not measured in Fleet 28. Prior supplied algorithm evidence and this explicit dispatch override are identified as such rather than presented as a fresh token inspection. Local HS counts cannot be relabelled a production defect or used to justify changing an already-ES256 key.
