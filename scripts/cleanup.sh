#!/usr/bin/env bash
# End-of-run cleanup: mfa-pplx Firefox processes and profiles, and worktrees whose PR is merged or closed.
# Run from any checkout: scripts/cleanup.sh. Paste its output in the handoff.
set -uo pipefail
MAIN="$(cd "$(dirname "$0")/.." && pwd)"

kill_matching() {
  local pattern="$1"
  pgrep -af "$pattern" 2>/dev/null | while read -r line; do
    if echo "$line" | grep -qE 'agent|cursor-agent|claude'; then
      continue
    fi
    pid="${line%% *}"
    kill "$pid" 2>/dev/null || true
  done
}

kill_matching 'firefox.*mfa-pplx-profile'

for d in /tmp/mfa-pplx-profile-*; do
  [[ -e "$d" ]] || continue
  owner="$(stat -c '%U' "$d" 2>/dev/null || echo "")"
  [[ "$owner" == "$(whoami)" ]] || continue
  rm -rf "$d" 2>/dev/null || true
done

cd "$MAIN" || exit 1
git fetch origin main --quiet 2>/dev/null || true
pr_state_for_branch() {
  local branch="$1"
  gh pr list --state all --head "$branch" --json state -q '.[0].state' 2>/dev/null || echo ""
}
for wt in $(git worktree list --porcelain | awk '/^worktree / {print $2}'); do
  base="$(basename "$wt")"
  [[ "$base" == my-food-ai-* ]] || continue
  [[ "$wt" != "$MAIN" ]] || continue
  branch="$(git -C "$wt" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
  [[ -n "$branch" && "$branch" != "HEAD" ]] || continue
  pr_state="$(pr_state_for_branch "$branch")"
  merged_into_main=false
  if git branch --merged origin/main --list "$branch" | grep -q .; then
    merged_into_main=true
  fi
  if [[ "$pr_state" == "MERGED" || "$pr_state" == "CLOSED" || "$merged_into_main" == true ]]; then
    if [ -n "$(git -C "$wt" status --porcelain 2>/dev/null)" ]; then
      echo "skip dirty worktree $wt ($branch)"
      continue
    fi
    git worktree remove "$wt" 2>/dev/null || true
    git branch -D "$branch" 2>/dev/null || true
    git push origin --delete "$branch" 2>/dev/null || true
  fi
done
git worktree prune 2>/dev/null || true

echo "=== firefox (mfa-pplx) processes ==="
pgrep -af 'firefox.*mfa-pplx-profile' || echo "none"
echo "=== mfa-pplx profiles ==="
ls -d /tmp/mfa-pplx-profile-* 2>/dev/null || echo "none"
echo "=== git worktree list ==="
git worktree list
