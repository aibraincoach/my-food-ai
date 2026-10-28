# Review execution policy

Effective 2026-10-26 for My Food AI. Adapted from naval-association-calgary and calgarysalutes-website.

## Routes, in order

1. **PPLX**: Gemini 3.8 Flash on Perplexity via `tools/pplx-review.mjs` (`skills/pplx-review/SKILL.md`, `docs/pplx-review-procedure.md`). Submission is exactly `code review <PR URL>`.
2. **AGY**: Antigravity CLI (`skills/agy-review/SKILL.md`, `docs/agy-review-procedure.md`, model from `config/agy-review-policy.json`). Only after every PPLX route available to the current harness has failed in one session (see PPLX routes under Quota).
3. **Codex**: read-only `codex exec review` from a clean clone (`skills/codex-review/SKILL.md`, `docs/codex-review-procedure.md`). Only when PPLX and AGY are unavailable, and only if no commit on the head was written by OpenAI.

Never use a Claude model, a coding sub-agent, or the model that wrote the code as the reviewer.

## When

One independent review per code PR on its final head before merge. Reviews start when the PR is pushed; batch PPLX (one tab per PR, cap 29). **Docs-only PRs** (only `.md` files under `docs/`, `skills/`, or root `*.md` policy docs) get **no review** and no CI gate from this policy.

## Receipts

Captures and triage under `docs/reviews/`. Triage ends with `Real findings: <n>`. Real findings are fixed before merge.

## Quota

PPLX is first for every review. The owner states usage is unlimited. Any claim that PPLX is unavailable requires a live attempt in the same session, the exact error or page text, and a same-message report to the owner. Fallback tools are labelled.

### PPLX routes

There are four ways to reach PPLX. Try every route your harness has, in this order, in the same session, before any claim that PPLX is unavailable:

1. **Headless runner**: `scripts/pplx-firefox.sh` and `tools/pplx-review.mjs` (`skills/pplx-review/SKILL.md`).
2. **Cookie refresh**: if the runner meets Cloudflare ("Just a moment...") or never shows `#ask-input`, the signed-in profile's `cf_clearance` has gone stale. Open a visible Firefox on that profile on the owner's display (`DISPLAY=:10`), let the owner pass the check, then run route 1 again.
3. **The owner's Chrome** (only agents on the Claude harness, which has the Claude in Chrome tools; Codex, Muse, Cursor Agent and Kimi do not and use routes 1, 2 and 4): submit exactly `code review <PR URL>` on Gemini 3.8 Flash in the owner's signed-in Chrome through the Claude in Chrome tools, read the answer, and post the receipt with the thread link.
4. **The other OCI server**: run the same runner from the other OCI server.

AGY and Codex are used only after every route your harness has has failed in one session. A Cloudflare page is a failed route, not a quota. Report its exact text to the owner in the same message.

Quota exhaustion stops that route; record the message and time. Move to the next route. No paid fallback on the same route.
