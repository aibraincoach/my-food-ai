# Codex review (My Food AI)

Owner-authorized exception, 2026-10-29: Codex was explicitly requested as an additional reviewer on #205 and #206, including again after their real findings are fixed. This narrow instruction overrides the usual third-route/non-OpenAI restriction for those PRs only. First-reviewer receipts remain valid, but do not waive second-reviewer findings. No general waiver or merge authorization follows from it.

Policy: `REVIEW_POLICY.md`. Skill: `skills/codex-review/SKILL.md`. Adapted from naval-association-calgary `docs/review.md`.

Outside the explicit owner-authorized exception above, use only when PPLX and AGY are unavailable and no commit on the PR head was authored by OpenAI.

```bash
N=<PR>
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
gh pr comment "$N" --body-file "$D/out.txt"
rm -rf "$D"
```

Triage per `docs/review.md`.
