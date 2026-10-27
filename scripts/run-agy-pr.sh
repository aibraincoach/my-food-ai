#!/usr/bin/env bash
# Run one AGY pass for a my-food-ai PR (docs/agy-review-procedure.md).
set -euo pipefail

PR="${1:?PR number required}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODEL="${AGY_MODEL:-gemini-3.8-flash-high}"
TIMEOUT="${AGY_TIMEOUT:-45m}"

cd "$REPO_ROOT"
git fetch origin --quiet
git fetch origin "pull/$PR/head" --quiet
HEAD=$(gh pr view "$PR" --json headRefOid --jq .headRefOid)
BASE=$(gh pr view "$PR" --json baseRefOid --jq .baseRefOid)
MERGE_BASE=$(git merge-base "$BASE" "$HEAD")

echo "PR #$PR head=$HEAD base=$BASE merge-base=$MERGE_BASE model=$MODEL"

set +e
node scripts/review/agy-review.mjs \
  --base "$MERGE_BASE" \
  --head "$HEAD" \
  --pr "$PR" \
  --model "$MODEL" \
  --effort high \
  --timeout "$TIMEOUT"
STATUS=$?
set -e

OUT="$(git rev-parse --absolute-git-dir)/review-state/agy-${HEAD:0:7}/receipt.md"
if [[ -f "$OUT" ]]; then
  gh pr comment "$PR" --body-file "$OUT"
  echo "COMMENTED on PR #$PR from $OUT (agy-review exit $STATUS)"
else
  echo "No receipt at $OUT (agy-review exit $STATUS)" >&2
fi
exit "$STATUS"
