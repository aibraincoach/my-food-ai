# Codex review (My Food AI)

Policy: `REVIEW_POLICY.md`. Skill: `skills/codex-review/SKILL.md`. Adapted from naval-association-calgary `docs/review.md`.

Use only when PPLX and AGY are unavailable and no commit on the PR head was authored by OpenAI.

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
