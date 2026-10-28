---
name: pplx-review
description: Run the PPLX code review (Gemini 3.8 Flash on Perplexity, Firefox headless BiDi) on one or many GitHub PRs at once, with the memory guard, the 29-tab cap, PR receipt comments and cleanup. Use for every code PR the moment it is pushed; batch all open PRs in one run.
---

# PPLX review runner

Policy lives in `REVIEW_POLICY.md` and `docs/pplx-review-procedure.md`. Ported from naval-association-calgary / calgarysalutes-website (2026-10-14). This skill is the mechanics.

1. Start Firefox once per batch (copies the signed-in profile, picks a free port, runs the memory guard for `PPLX_TABS` tabs):
   ```bash
   export PPLX_TABS=<number of PRs>
   eval "$(scripts/pplx-firefox.sh)"
   ```
2. Run every PR in one batch, one tab per PR, never one at a time. The cap is `PPLX_MAX_TABS` (29). Captures land in `docs/reviews/` as `mfa-pplx-pr<N>-<head7>.md`:
   ```bash
   node tools/pplx-review.mjs --tabs <N> <PR URL> <PR URL> ... --out docs/reviews
   ```
   One PR: `node tools/pplx-review.mjs <PR URL> <head sha> docs/reviews/mfa-pplx-pr<N>-<head7>.md`.
3. Exit codes: 0 complete; 2 timeout or error; 3 "Searching the web" (wrong submission, post as found, labelled deviation); 4 wrong model; 5 model not selectable; 6 head has no successful deployment status when the runner gates on it; 7 memory guard refused; 8 already claimed or reviewed on this head. Anything but 0 is a failed attempt, not a review. A failed attempt is not yet a reason to leave PPLX: work through every PPLX route your harness has (see PPLX routes in `REVIEW_POLICY.md`) and report the exact page text to the owner; only then use AGY, labelled as a fallback.
4. The runner posts `Review in progress: PPLX ...` before opening the tab and the receipt comment on success.
5. Triage every finding against source. Post one comment whose first line names the triage reviewer and head, one line per finding marked Real, Not real or Cannot tell, last line `Real findings: <n>`. Save the same text as `docs/reviews/mfa-pplx-pr<N>-<head7>-triage.md`. Real findings are fixed on the PR in the same session and the same reviewer runs again on the new head.
6. Commit the capture and triage files on the PR branch.
7. End every run with `scripts/cleanup.sh` and paste its output in the handoff.

Before any other heavy process (npx, builds, more tabs): `node tools/mem-guard.mjs <tabs>`.
