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

Two failed PPLX attempts on the same head → AGY (`docs/agy-review-procedure.md`).
