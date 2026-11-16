# What a GET to the tick route can do

Written Nov 16 2026 from the code on main (`5aaded91`).

**Answer: yes.** A GET to `/api/jobs/tick` may take the worker lease and start a drain. It does so whenever a job is queued or running and no live lease is held. The route's own comment calls it a "public, idempotent tick". It is the wake, by design, not a read.

| State when the GET arrives | What the GET does |
|---|---|
| No job queued and none running | Three count-only reads. Nothing is written. |
| A job queued or running, and another holder's lease is live | The same reads and one lease attempt that changes nothing. |
| A job queued or running, and no live lease | Takes the lease (the lease function first marks abandoned jobs for recovery), then starts `/api/jobs/drain` for that holder after it answers. The drain runs the worker: job claims, model calls, lease renewals, release. |

Code: `src/app/api/jobs/tick/route.ts`, `src/lib/queue/tick.ts`, `src/lib/queue/lease.ts`, `try_acquire_worker_lease` in `supabase/migrations/0007b_comment_corrections.sql`.

**Who calls it.** Every caller but one wants the wake and ignores the answer: the routes that queue work (new meal, comment, correction, items, photos, servings, retry, discard), the agent kickoff, the drain route when it finishes, the meal detail after a correction, and the database's once-a-minute wake (`net.http_get`, migration `0024`). Only `QueueTicker.tsx` (app open, tab focus, upload events) uses both the wake and the three numbers.

**The drain route** needs the `holder` value of the live lease: 400 without one, 409 when it does not hold the lease. It has no other secret.

**There is no read-only way** to get the three numbers today.

**What "a GET changes nothing" would cost.** The wake moves to POST: the tick route, `tick.ts`, `QueueTicker.tsx`, `OutlineOverlay.tsx`, the drain route, the agent kickoff, eight route files (twelve call sites), a migration that changes the database wake to `net.http_post`, three test files and five scripts.

**What #322 needs instead.** #322 assumed the route only reads. To time a cold start without starting work, call it when no job is queued or running: then it writes nothing.
