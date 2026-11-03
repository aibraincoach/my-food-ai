# PR #315 attribution and rollout QA

Source QA: [owner runner report](https://github.com/aibraincoach/my-food-ai/pull/315#issuecomment-6592974283), reviewed head `1b1eff3b2d7670701e2c5622c790efd88e5de748`. This is source triage, not a replacement for the owner's current external-review process.

1. New trace identity columns can suppress all traces before migration 0032 — **Real, fixed.** On only a missing `model`/`host` column error (`PGRST204`/`42703` naming that column), the writer retries the legacy payload under the same three-second deadline. Unrelated schema and storage errors are not silently downgraded. The actual pre-0032 local PostgREST gate proves one normal Meta trace persists and removes its exact fixture afterward.
2. The latest successful-looking trace can relabel an older committed meal after an invalid or uncommitted retry — **Real, fixed.** Meta status/refusal/parser validation now occurs inside the trace boundary, just as on the open path. More strongly, the model identity travels with the validated named analysis and commits through a service-only, job-fenced RPC in the same transaction as initial items. Server-managed post identity fields drive detail attribution. Existing initialization replays preserve their committed identity, and failed nutrition/persistence or later successful-but-uncommitted requests cannot change it. User insert/update/RPC spoofing and cross-owner reads are covered by SQL tests.

The request transport and eleven-case trial inputs are unchanged. Final real Meta identify/reference gates are rerun on the new source commit; combined local end-to-end acceptance verifies fresh committed model identity and the owner detail line. All production migrations, writes and deployments remain outside Part 1.

Real findings: 2 (fixed)
