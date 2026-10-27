---
name: agy-review
description: Run AGY (Antigravity CLI) as the second code-review route after PPLX, with enforced complete diff coverage via scripts/review/agy-review.mjs. Use when PPLX failed twice or Perplexity is unavailable.
---

# AGY review runner

Policy: `REVIEW_POLICY.md`. Procedure: `docs/agy-review-procedure.md`. Tooling lifted from burn-centre-translator / loadedbakedpotato (2026-10-06).

## One PR

```bash
bash scripts/run-agy-pr.sh <PR number>
```

Or from a checkout of the PR head:

```bash
BASE=$(git merge-base origin/main HEAD)
node scripts/review/agy-review.mjs --base "$BASE" --head "$(git rev-parse HEAD)" --pr <N> \
  --model gemini-3.8-flash-high --effort high --timeout 45m
```

Exit 0 is clean. Exit 3 is blockers found. Exit 2 (incomplete read) or 4 (AGY failed): retry once; a second 2 or 4 makes AGY unavailable — use Codex per policy. Receipt: `<git dir>/review-state/agy-<head7>/receipt.md`. Never ask AGY for a "security review"; it refuses.

## Verify the script offline

```bash
node scripts/review/agy-review.test.mjs
```

End the session with `scripts/cleanup.sh`.
