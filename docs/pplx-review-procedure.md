# PPLX review procedure (My Food AI)

Owner Fleet 15 override, November 4, 2026: AGY may be run when needed and its complete exact-head receipts count. PPLX may use ChatGPT, including GPT-6.1 Sol, under the owner's explicit quota override. Record the actual model and submit exactly `code review <PR URL>`; no extra instruction is submitted. This supersedes the older Muse-only route restriction and Gemini-only PPLX restriction for Fleet 15. Existing deviation and truncation labels remain part of the record; a finding is checked against source, and changed code needs a fresh receipt at its new head. Review clearance is not a merge order.

Fleet15 resource isolation: do not use or restart Fleet14's Firefox endpoint/profile. Use a separately owned browser on a different port. Do not close the owner's review tabs.

Policy: `REVIEW_POLICY.md`. Mechanics: `skills/pplx-review/SKILL.md`. Firefox BiDi runner ported from naval-association-calgary / calgarysalutes-website (2026-10-14).

## Prerequisites

- `node`, `firefox`, signed-in Perplexity profile at `/home/opc/.mozilla/firefox/w6ycu9xj.default-default` (override with `PPLX_SRC_PROFILE`)
- `gh` authenticated for `aibraincoach/my-food-ai`

## Batch run

```bash
export PPLX_TABS=<N>
eval "$(scripts/pplx-firefox.sh)"
node tools/pplx-review.mjs --tabs <N> https://github.com/aibraincoach/my-food-ai/pull/<n> ... --out docs/reviews
scripts/cleanup.sh
```

Single PR:

```bash
eval "$(scripts/pplx-firefox.sh)"
HEAD=$(gh pr view <N> --json headRefOid -q .headRefOid)
node tools/pplx-review.mjs "https://github.com/aibraincoach/my-food-ai/pull/<N>" "$HEAD" "docs/reviews/mfa-pplx-pr<N>-${HEAD:0:7}.md"
```

## Model and submission

Use the model on offer in the picker — never demand a model by name. Models change; the procedure follows what Perplexity offers. Record the picker selection before submitting. `MODEL NOT SELECTED` means open the dropdown, select the offered model, reopen and confirm — not a quota error. After the answer, the picker's selected model, the request proof and the answer footer must all name the same model; a mismatch across the three invalidates the attempt (see Observed model mismatch in Run 3).

Type exactly: `code review https://github.com/aibraincoach/my-food-ai/pull/<N>` — no SHA, no extra instructions.

## Failure

Two failed headless-runner attempts do not make PPLX unavailable. Work through every PPLX route your harness has (cookie refresh, the owner's Chrome, the other OCI server; see PPLX routes in `REVIEW_POLICY.md`). Only when all of them have failed in one session, and the exact page text has been reported to the owner, use AGY (`docs/agy-review-procedure.md`), labelled as a fallback.

## Authenticated Firefox and live observation

Use the original authenticated Firefox on display :10 through BiDi. Never copy its profile or substitute a fresh browser, Playwright or Chromium for PPLX. Attach to its listener; if necessary restart the same profile with session restoration and BiDi enabled.

Inspect the page every second before and after submission. PPLX normally starts answering within two or three seconds. If the input or answer is absent, inspect the actual page, title, authentication and selected model immediately. A selector failure is an automation failure, not a PPLX response timeout or proof that PPLX is unavailable. Never spend 120 seconds blindly waiting for an input.
## Observed model mismatch in Run 3

The submitted request's gemini38flash preference alone did not prove the answer's model: several completed answers identified GPT-6.1 Sol in the selected-model and footer text. Those attempts were rejected. Verify selected model, request proof and answer footer together; do not certify an ineligible answer. Observation timeouts do not prove a live thread stopped: retain the thread handle and inspect its actual completion before restarting. Label any eligible fallback accurately.
