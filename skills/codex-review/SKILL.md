---
name: codex-review
description: Run Codex CLI as the third code-review route when PPLX and AGY are unavailable. Read-only review from a clean clone; never on code written by OpenAI models.
---

# Codex review runner

Policy: `REVIEW_POLICY.md`. Procedure: `docs/codex-review-procedure.md`. Adapted from naval-association-calgary/docs/review.md (Codex section).

## When

Owner-authorized exception, 2026-10-29: Codex was explicitly requested as an additional reviewer on #205 and #206, including again after their real findings are fixed. This narrow instruction overrides the usual third-route/non-OpenAI restriction for those PRs only. First-reviewer receipts remain valid, but do not waive second-reviewer findings. No general waiver or merge authorization follows from it.

Outside the explicit owner-authorized exception above, only when every commit on the PR head was not written by OpenAI, and PPLX and AGY are both unavailable for that head.

## One PR

```bash
N=<PR number>
HEAD=$(gh pr view "$N" --json headRefOid -q .headRefOid)
D=$(mktemp -d)
git clone -q https://github.com/aibraincoach/my-food-ai "$D/repo"
(
  cd "$D/repo"
  git fetch -q origin "pull/$N/head"
  git checkout -q FETCH_HEAD
  test "$(git rev-parse HEAD)" = "$HEAD"
  codex exec -s read-only review --base origin/main -o "$D/out.txt"
)
```

Post `$D/out.txt` as a PR comment whose first line names the Codex model and head reviewed. Triage as in `docs/review.md`. Remove `$D` when done.

Codex never reviews code it (or another OpenAI model) wrote. End with `scripts/cleanup.sh`.
