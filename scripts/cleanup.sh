#!/usr/bin/env bash
# End-of-run cleanup: mfa-pplx Firefox processes and profiles, and worktrees whose commits are verified merged into origin/main.
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

fail_cleanup() { echo "Cleanup stopped: $*" >&2; exit 1; }
cd "$MAIN" || exit 1
git fetch origin main --quiet || fail_cleanup "could not refresh origin/main"
worktrees="$(git worktree list --porcelain -z | base64 -w0)" || fail_cleanup "could not list worktrees"
while IFS= read -r -d '' record; do
  [[ "$record" == 'worktree '* ]] || continue
  wt="${record#worktree }"
  base="$(basename "$wt")"
  [[ "$base" == my-food-ai-* ]] || continue
  [[ "$wt" != "$MAIN" ]] || continue
  branch="$(git -C "$wt" rev-parse --abbrev-ref HEAD)" || fail_cleanup "could not identify branch for $wt"
  [[ -n "$branch" && "$branch" != "HEAD" ]] || continue
  if git merge-base --is-ancestor "$branch" origin/main; then
    :
  else
    status=$?
    [[ "$status" == 1 ]] || fail_cleanup "could not verify merge for $branch"
    echo "skip unmerged worktree $wt ($branch)"
    continue
  fi
  dirty="$(git -C "$wt" status --porcelain)" || fail_cleanup "could not inspect $wt"
  if [[ -n "$dirty" ]]; then
    echo "skip dirty worktree $wt ($branch)"
    continue
  fi
  git fetch --no-tags origin "refs/heads/$branch" || fail_cleanup "could not fetch remote branch $branch"
  remote_tip="$(git rev-parse --verify FETCH_HEAD)" || fail_cleanup "could not identify remote branch $branch"
  git merge-base --is-ancestor "$remote_tip" origin/main || fail_cleanup "remote branch $branch is not merged into origin/main"
  git worktree remove "$wt" || fail_cleanup "could not remove worktree $wt"
  git branch -D "$branch" || fail_cleanup "could not remove local branch $branch"
  git push --force-with-lease="refs/heads/$branch:$remote_tip" origin ":refs/heads/$branch" || fail_cleanup "could not remove remote branch $branch"
done < <(printf '%s' "$worktrees" | base64 -d)
git worktree prune || fail_cleanup "could not prune worktrees"

echo "=== firefox (mfa-pplx) processes ==="
pgrep -af 'firefox.*mfa-pplx-profile' || echo "none"
echo "=== mfa-pplx profiles ==="
ls -d /tmp/mfa-pplx-profile-* 2>/dev/null || echo "none"
echo "=== git worktree list ==="
git worktree list
