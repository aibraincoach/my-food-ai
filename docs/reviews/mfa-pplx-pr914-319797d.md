Reviewer: Gemini 4 Hydrogen via Perplexity (PPLX); version reviewed: 319797d4797c7db8ed046c9a4c6ffc8459d5dc0b
Head reviewed: 319797d4797c7db8ed046c9a4c6ffc8459d5dc0b
Model proof: model_preference = gemini4hydrogen; picker = Gemini 4 Hydrogen; completed answer footer = Gemini 4 Hydrogen
Thread: https://www.perplexity.ai/session/bacc3fc2-139a-4b2b-a390-4983982d4fec
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/914
Completion re-inspected: 2026-11-15T13:58:33.542583+00:00; answer Copy/Helpful controls present; Stop response absent.
Evidence note: complete recapture of the same live thread supersedes the runner's earlier truncated capture; no resubmission.

Answer
Links
Images
Share
6:52 AM

code review 
 aibraincoach/my-food-ai#914

Finished
8s

 aibraincoach/my-food-ai#914 (fix: Fleet 21 lease-heartbeat (plan PR 7)) reduces the worker lease TTL from 300 s to 60 s and adds a 20 s heartbeat interval in runWorker so a killed worker frees the queue within a minute instead of stalling it. The implementation is minimal, clean, and ready to merge once the planned tests and disposable-stack verification pass.

Summary of Changes

Lease constants (src/lib/queue/lease.ts): Exports LEASE_TTL_SECONDS = 60 and LEASE_HEARTBEAT_MS = 20_000.

Tick route (src/app/api/jobs/tick/route.ts): Passes LEASE_TTL_SECONDS into queueTick(admin, holder, LEASE_TTL_SECONDS).

Worker heartbeat (src/lib/worker/drain.ts): Starts a setInterval calling renewLease(admin, holder, LEASE_TTL_SECONDS) every 20 s, passes LEASE_TTL_SECONDS to the post-job renewLease call, and clears the interval in finally before releaseLease.

Review Findings

Correctness and lifecycle: Clearing heartbeat inside finally before releaseLease prevents interval leaks and avoids renewing a lease after the worker exits. Swallowing heartbeat errors with .catch(() => {}) is appropriate here since transient failures are tolerated up to 3 missed beats (60 s), and runWorker should not crash mid-job on a single renewal hiccup.

Race / overlap behavior: If renewLease is in flight when clearInterval(heartbeat) runs and releaseLease executes immediately after, a slow renewLease could theoretically land after releaseLease (depending on whether renew_worker_lease checks that the holder still owns an active lease). This is low risk if renew_worker_lease is guarded by holder and released_at IS NULL, which is worth confirming if not already enforced in 0034_renew_lease.sql.

Test and verification status: As noted in the PR description, npm test and the disposable-stack kill -9 timing measurement are still pending.

Verdict

Approve (pending CI / disposable-stack check) — no code changes required. Run npm test and record the kill -9 recovery time on the PR before merging.

Show me the renew_worker_lease SQL migration
Check if the integration tests cover this PR
Draft a comment for the PR approval
Write the unit test for worker recovery
Check the remaining plan PRs in this series
⠼
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen
