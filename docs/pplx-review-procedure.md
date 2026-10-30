# PPLX review procedure (My Food AI)

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

Choose **Gemini 3.8 Flash** in the picker. `MODEL NOT SELECTED` means open the dropdown, select Flash, reopen and confirm — not a quota error.

Type exactly: `code review https://github.com/aibraincoach/my-food-ai/pull/<N>` — no SHA, no extra instructions.

## Failure

Two failed headless-runner attempts do not make PPLX unavailable. Work through every PPLX route your harness has (cookie refresh, the owner's Chrome, the other OCI server; see PPLX routes in `REVIEW_POLICY.md`). Only when all of them have failed in one session, and the exact page text has been reported to the owner, use AGY (`docs/agy-review-procedure.md`), labelled as a fallback.

## Authenticated Firefox and live observation

Use the original authenticated Firefox on display :10 through BiDi. Never copy its profile or substitute a fresh browser, Playwright or Chromium for PPLX. Attach to its listener; if necessary restart the same profile with session restoration and BiDi enabled.

Inspect the page every second before and after submission. PPLX normally starts answering within two or three seconds. If the input or answer is absent, inspect the actual page, title, authentication and selected model immediately. A selector failure is an automation failure, not a PPLX response timeout or proof that PPLX is unavailable. Never spend 120 seconds blindly waiting for an input.
