# Review execution policy

Effective 2026-10-26 for My Food AI. Adapted from naval-association-calgary and calgarysalutes-website.

## Routes, in order

1. **PPLX**: Gemini 3.8 Flash on Perplexity via `tools/pplx-review.mjs` (`skills/pplx-review/SKILL.md`, `docs/pplx-review-procedure.md`). Submission is exactly `code review <PR URL>`.
2. **AGY**: Antigravity CLI (`skills/agy-review/SKILL.md`, `docs/agy-review-procedure.md`, model from `config/agy-review-policy.json`). After two PPLX failures or when Perplexity is unavailable.
3. **Codex**: read-only `codex exec review` from a clean clone (`skills/codex-review/SKILL.md`, `docs/codex-review-procedure.md`). Only when PPLX and AGY are unavailable, and only if no commit on the head was written by OpenAI.

Never use a Claude model, a coding sub-agent, or the model that wrote the code as the reviewer.

## When

One independent review per code PR on its final head before merge. Reviews start when the PR is pushed; batch PPLX (one tab per PR, cap 29). **Docs-only PRs** (only `.md` files under `docs/`, `skills/`, or root `*.md` policy docs) get **no review** and no CI gate from this policy.

## Receipts

Captures and triage under `docs/reviews/`. Triage ends with `Real findings: <n>`. Real findings are fixed before merge.

## Quota

PPLX is first for every review. The owner states usage is unlimited. Any claim that PPLX is unavailable requires a live attempt in the same session, the exact error or page text, and a same-message report to the owner. Fallback tools are labelled.

Quota exhaustion stops that route; record the message and time. Move to the next route. No paid fallback on the same route.
