# AGY review (My Food AI)

Policy: `REVIEW_POLICY.md`. Skill: `skills/agy-review/SKILL.md`. Tooling from burn-centre-translator (`scripts/review/agy-review.mjs`).

AGY's shell tools clip long diff output; this repo delivers patches as on-disk parts for `view_file` only.

## Run for an open PR

```bash
bash scripts/run-agy-pr.sh <PR>
```

## Manual run on a checkout

```bash
BASE=$(git merge-base origin/main HEAD)
node scripts/review/agy-review.mjs --base "$BASE" --head "$(git rev-parse HEAD)" --pr <N> \
  --model gemini-3.8-flash-high --effort high --timeout 45m
```

Receipt: `receipt.md` in the fresh packet directory printed by the command (default: a unique `mfa-agy-<head7>-<uuid>` directory under the system temporary directory). An explicit `--out` must name a new directory with an existing parent. Existing packets, repository roots/ancestors, Git metadata and symlink paths are refused, including under `--dry-run`; the runner never deletes or overwrites a packet directory.

## Offline test

```bash
node scripts/review/agy-review.test.mjs
```
