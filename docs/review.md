# Review (My Food AI)

## Fleet 14 owner override — November 4, 2026

For Fleet14, the owner accepts PPLX reviews even when Gemini requests silently route to ChatGPT6.1 and explicitly permits AGY in parallel for speed. The answer model is recorded separately from request preference. Exact reviewed feature heads, the main-only refresh mapping and counting receipts are in [the Fleet14 index](reviews/run14-review-index.md). Failed attempts and source-access failures do not count as approvals. Supplementary coder reviews are distinct from counting external reviews. This scoped instruction supersedes incompatible route-order/model restrictions below for Fleet14 only; it is not a future-run waiver. Docs PRs remain unmerged without the owner's explicit request.

Owner Fleet 15 override, November 4, 2026: AGY may be run when needed and its complete exact-head receipts count. PPLX may use ChatGPT, including GPT-6.1 Sol, under the owner's explicit quota override. Record the actual model and submit exactly `code review <PR URL>`; no extra instruction is submitted. This supersedes the older Muse-only route restriction and Gemini-only PPLX restriction for Fleet 15. Existing deviation and truncation labels remain part of the record; a finding is checked against source, and changed code needs a fresh receipt at its new head. Review clearance is not a merge order.

Fleet15 resource isolation: do not use or restart Fleet14's Firefox endpoint/profile. Use a separately owned browser on a different port. Do not close the owner's review tabs.

Owner Run 7 override, November 3, 2026: **Muse owns the code reviews.** Coders build, test, push and fix reported findings; they do not launch their own PPLX/AGY/Codex review runs. This supersedes the route order below for this run. Record the reviewed head and findings accurately; completed earlier receipts remain evidence only for the heads they actually cover. Merge authority remains the named-head order after evaluation.

The owner explicitly accepts Muse's `<!-- watch-review -->` comment reviews for this run, including their `WATCH VERDICT`, despite historical receipt disclaimers in the comments. Match the review's API `commit_id` to the current full PR head. A new head needs Muse's new exact-head review. These comments are reviews, never merge authorization.

Owner-authorized exception, 2026-10-29: Codex was explicitly requested as an additional reviewer on #205 and #206, including again after their real findings are fixed. This narrow instruction overrides the usual third-route/non-OpenAI restriction for those PRs only. First-reviewer receipts remain valid, but do not waive second-reviewer findings. No general waiver or merge authorization follows from it.

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
