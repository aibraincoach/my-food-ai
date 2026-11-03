# Review (My Food AI)

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

## Explicit owner exception — November 3, 2026

The owner explicitly requested AGY review of docs PR #463. AGY Gemini 3.8 Flash High reviewed exact head `dec5f82c35c36d74874a74698d60d6fb90ffae92`, complete coverage 4/4 paths and parts, BLOCKERS: NONE, receipt https://github.com/aibraincoach/my-food-ai/pull/463#issuecomment-6608958569. The earlier 4dec1ed run was cancelled after the head moved and is not a valid final-head receipt. This exception does not authorize unrelated coder-launched reviews or merges. #463 subsequently merged under a separate explicit exact-head order; upcoming-fleet docs #474 must remain open.
