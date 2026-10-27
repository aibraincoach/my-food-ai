# Agent rules — My Food AI

Hackathon project (My Food AI → My Fitness AI after the event). PM contract: [docs/pm-contract.md](docs/pm-contract.md). Planner contract: [docs/planner-contract.md](docs/planner-contract.md). Backlog: [BACKLOG.md](BACKLOG.md). Review: [REVIEW_POLICY.md](REVIEW_POLICY.md), [docs/review.md](docs/review.md).

## Skills (Cursor / Claude)

| Skill | Path |
| --- | --- |
| PM handover | [skills/pm-handover/SKILL.md](skills/pm-handover/SKILL.md) |
| PPLX review | [skills/pplx-review/SKILL.md](skills/pplx-review/SKILL.md) |
| AGY review | [skills/agy-review/SKILL.md](skills/agy-review/SKILL.md) |
| Codex review | [skills/codex-review/SKILL.md](skills/codex-review/SKILL.md) |

Review tooling is ported from [naval-association-calgary](https://github.com/aibraincoach/naval-association-calgary) (PPLX runner, review policy shape) and burn-centre-translator / calgarysalutes-website (AGY delivery script, Firefox helper).

## Work

Branch from `origin/main`; never commit directly on `main`. One PR per change. Docs-only PRs (only `docs/`, `skills/`, and root `*.md` policy files) need no PPLX/AGY/Codex review.

Code PRs: PPLX first (`skills/pplx-review/SKILL.md`), AGY second, Codex third per `REVIEW_POLICY.md`. End coder runs with `scripts/cleanup.sh`.

Never commit secrets; use `.env.example` only. Prior Supabase wipe notes: [docs/database-before-wipe.md](docs/database-before-wipe.md).

## PM handover

Reconcile documents, commit on the document branch, then `skills/pm-handover/scripts/pack.sh`. The handover text is the reply; zip output goes under `uploads/` (gitignored).

## Session summary

_Update on handover._

- Date: 2026-10-26 (PM handover session 1, Cursor on oracle-arm)
- State: Greenfield after DB wipe (`f8f2d3d5eb517732fa0084c73c99e69629821b9c` on `origin/main`, observed 2026-10-27 01:03 UTC). Backlog empty until feature set agreed.
- Open: [PR #1](https://github.com/aibraincoach/my-food-ai/pull/1) `docs/fleet-initial` at `097e670257fbd9bd9cc613d7be49554a0a91039f` (MERGEABLE, docs-only). Commits: `5aab9d0` backlog, `d73518e` skills/tooling.
- Skills verified: `node --check tools/pplx-review.mjs`, `node tools/mem-guard.mjs 1`, `node scripts/review/agy-review.test.mjs` (5/5 pass, 2026-10-26 MDT).
- Next: owner agrees feature set → planner fills backlog; merge PR #1 when ordered; then application stack work.
