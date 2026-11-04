# Review (My Food AI)

## Owner scope and docs rule — November 4, 2026

The owner's current instruction merged old-fleet docs #545 only. New-fleet docs #558 stays open; no PM order or handover authorizes its merge. Match every PR to its own fleet/title and the owner's words. A docs merge requires the owner's explicit request. The successor handover belongs only in the reply, not in a tracked document; PMs write project documents only when the owner asks. These rules supersede conflicting older docs-merge/dispatch wording below.

Fleet 13's dispatched review exception accepted ChatGPT answers in PPLX and exact-head zero-blocker Muse reviews, and required supplementary coder review. That scoped exception is recorded in [the completed report](run13-report.md); it does not grant a standing exception for a future run. No new code/review order is outstanding. These documentation updates are pending in #558; the owner's session instructions apply now.

Historical Run 7 override, November 3, 2026 (Run 7 only): **Muse owns the code reviews.** Coders build, test, push and fix reported findings; they do not launch their own PPLX/AGY/Codex review runs. This supersedes the route order below for this run. Record the reviewed head and findings accurately; completed earlier receipts remain evidence only for the heads they actually cover. Merge authority remains the named-head order after evaluation.

The owner explicitly accepts Muse's `<!-- watch-review -->` comment reviews for this run, including their `WATCH VERDICT`, despite historical receipt disclaimers in the comments. Match the review's API `commit_id` to the current full PR head. A new head needs Muse's new exact-head review. These comments are reviews, never merge authorization.

Owner-authorized exception, 2026-10-29: Codex was explicitly requested as an additional reviewer on #205 and #206, including again after their real findings are fixed. This narrow instruction overrides the usual third-route/non-OpenAI restriction for those PRs only. First-reviewer receipts remain valid, but do not waive second-reviewer findings. No general waiver or merge authorization follows from it.

Authoritative route order and exemptions: `REVIEW_POLICY.md`. This page is the operator summary.

## Order

Perplexity (PPLX) first, AGY second, Codex third and only for non-OpenAI code when the first two routes are unavailable.

## Docs-only PRs

If every changed file is Markdown under `docs/`, `skills/`, or root policy docs (`BACKLOG.md`, `CLAUDE.md`, `REVIEW_POLICY.md`, `WALL_OF_STUPID.md`), no external review runs. Check links and facts; merge only when the owner explicitly orders that docs PR.

## PPLX on this box

See `docs/pplx-review-procedure.md` and `skills/pplx-review/SKILL.md`. Run `node tools/mem-guard.mjs` before batches. End every run with `scripts/cleanup.sh`.

## AGY

See `docs/agy-review-procedure.md` and `skills/agy-review/SKILL.md`. Offline check: `node scripts/review/agy-review.test.mjs`.

## Codex

See `docs/codex-review-procedure.md` and `skills/codex-review/SKILL.md`.

## Triage

Every review gets a separate triage comment and file. Mark each finding Real, Not real, or Cannot tell. Last line: `Real findings: <n>`.
