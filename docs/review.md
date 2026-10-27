# Review (My Food AI)

Authoritative route order and exemptions: `REVIEW_POLICY.md`. This page is the operator summary.

## Order

Perplexity (PPLX) first, AGY second, Codex third and only for non-OpenAI code when the first two routes are unavailable.

## Docs-only PRs

If every changed file is Markdown under `docs/`, `skills/`, or root policy docs (`BACKLOG.md`, `CLAUDE.md`, `REVIEW_POLICY.md`, `WALL_OF_STUPID.md`), no external review runs. Check links and facts; merge when the PM orders it.

## PPLX on this box

See `docs/pplx-review-procedure.md` and `skills/pplx-review/SKILL.md`. Run `node tools/mem-guard.mjs` before batches. End every run with `scripts/cleanup.sh`.

## AGY

See `docs/agy-review-procedure.md` and `skills/agy-review/SKILL.md`. Offline check: `node scripts/review/agy-review.test.mjs`.

## Codex

See `docs/codex-review-procedure.md` and `skills/codex-review/SKILL.md`.

## Triage

Every review gets a separate triage comment and file. Mark each finding Real, Not real, or Cannot tell. Last line: `Real findings: <n>`.
