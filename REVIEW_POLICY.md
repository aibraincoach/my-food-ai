# Review execution policy

## Owner scope and docs rule — November 4, 2026

The owner's current instruction merged old-fleet docs #545 only. New-fleet docs #558 stays open; no PM order or handover authorizes its merge. Match every PR to its own fleet/title and the owner's words. A docs merge requires the owner's explicit request. The successor handover belongs only in the reply, not in a tracked document; PMs write project documents only when the owner asks. These rules supersede conflicting older docs-merge/dispatch wording below.

Fleet 13's dispatched review exception accepted ChatGPT answers in PPLX and exact-head zero-blocker Muse reviews, and required supplementary coder review. That scoped exception is recorded in [the completed report](docs/run13-report.md); it does not grant a standing exception for a future run. No new code/review order is outstanding. These documentation updates are pending in #558; the owner's session instructions apply now.

Historical Run 7 override, November 3, 2026 (Run 7 only): **Muse owns the code reviews.** Coders build, test, push and fix reported findings; they do not launch their own PPLX/AGY/Codex review runs. This supersedes the route order below for this run. Record the reviewed head and findings accurately; completed earlier receipts remain evidence only for the heads they actually cover. Merge authority remains the named-head order after evaluation.

The owner explicitly accepts Muse's `<!-- watch-review -->` comment reviews for this run, including their `WATCH VERDICT`, despite historical receipt disclaimers in the comments. Match the review's API `commit_id` to the current full PR head. A new head needs Muse's new exact-head review. These comments are reviews, never merge authorization.

Owner-authorized exception, 2026-10-29: Codex was explicitly requested as an additional reviewer on #205 and #206, including again after their real findings are fixed. This narrow instruction overrides the usual third-route/non-OpenAI restriction for those PRs only. First-reviewer receipts remain valid, but do not waive second-reviewer findings. No general waiver or merge authorization follows from it.

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
   **Chrome model rule (observed 2026-11-03, PR #311).** The picker must be set to Gemini 3.8 Flash before submitting, and the model must be checked again on the thread after submission. On the Claude in Chrome route the box showed "Gemini 3.8 Flash" before submit, but the submitted thread's follow-up box read "GPT-6.1 Sol" on three submissions: Return key, submit arrow, and a follow-up in the same thread after reselecting Gemini. Possible cause not established. The on-screen label alone is not proof (see the runner's `model_preference` proof), but a thread that reads GPT-6.1 Sol after submission is an invalid attempt, as already ruled for #311 on `8f814f5`: do not post it as a review, stop the run, and move to route 1 (the runner, which proves `model_preference = gemini38flash`). Never post a Chrome review whose model was not confirmed as Gemini 3.8 Flash after submission.
4. **The other OCI server**: run the same runner from the other OCI server.

Runner exits 6 (head has no successful Vercel status), 7 (memory guard) and 8 (fresh claim or existing receipt for the head) are gates, not route failures. Resolve them (wait for Vercel, free memory, reuse or wait for the existing claim or receipt) and do not switch routes to get around them. Every route keeps the same gates: review only the current PR head, with a successful Vercel status, and with no fresh claim or receipt for it.

AGY and Codex are used only after every route your harness has has failed in one session. A Cloudflare page is a failed route, not a quota. Report its exact text to the owner in the same message.

Quota exhaustion stops that route; record the message and time. Move to the next route. No paid fallback on the same route.

## Authenticated Firefox and live observation

Use the original authenticated Firefox on display :10 through BiDi. Never copy its profile or substitute a fresh browser, Playwright or Chromium for PPLX. Attach to its listener; if necessary restart the same profile with session restoration and BiDi enabled.

Inspect the page every second before and after submission. PPLX normally starts answering within two or three seconds. If the input or answer is absent, inspect the actual page, title, authentication and selected model immediately. A selector failure is an automation failure, not a PPLX response timeout or proof that PPLX is unavailable. Never spend 120 seconds blindly waiting for an input.
