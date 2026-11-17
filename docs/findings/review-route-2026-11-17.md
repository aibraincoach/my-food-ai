# The PPLX review route: how a review runs, and every way it has failed (#929)

Written 2026-11-17 for Fleet 27. The runner on main before Fleet 27 (`tools/pplx-review.mjs`, blob `0c0b7bd0`) required one fixed model, Gemini 3.8 Flash. The runner that wrote Fleet 24's and Fleet 25's receipts was a newer copy kept outside main (blob `11379e8a`, branch `docs/muse-readiness-pm-pack`), which takes the model Perplexity offers. Fleet 27 brings that copy to main and fixes the two failures below that it still had.

**Maintainer:** the build seat (`build.builder`). It runs the runner on every fleet and sees a failure first. A failure goes to the PM as one line, and the planner plans the fix.

## Ways a review is run today

| Route | What runs | Where it is written down |
|---|---|---|
| 1. PPLX headless runner | `scripts/pplx-firefox.sh` starts the signed-in Firefox; `tools/pplx-review.mjs` submits `code review <PR URL>` over WebDriver BiDi, waits for the answer and posts the receipt | `REVIEW_POLICY.md` "PPLX routes" 1, `skills/pplx-review/SKILL.md` |
| 2. PPLX cookie refresh | A visible Firefox on the same profile, for the owner to pass a Cloudflare check; then route 1 again | `REVIEW_POLICY.md` "PPLX routes" 2 |
| 3. PPLX in the owner's Chrome | The same submission through the Claude in Chrome tools, receipt posted by hand (Claude harness only) | `REVIEW_POLICY.md` "PPLX routes" 3 |
| 4. PPLX from the other server | Route 1 on the other OCI server | `REVIEW_POLICY.md` "PPLX routes" 4 |
| AGY | Antigravity CLI review, after every PPLX route has failed in one session | `skills/agy-review/SKILL.md` |
| Codex | Read-only `codex exec review` from a clean clone, when PPLX and AGY are unavailable and no OpenAI model wrote the head | `skills/codex-review/SKILL.md` |

## Failures on record

| When | PR, head | What happened | Cause | Step it broke | Fixed by |
|---|---|---|---|---|---|
| 2026-11-03 | #310 `2d4142b`; #311 `8f814f5` (twice); #312 `9e5877b` | The request asked for Gemini 3.8 Flash; the answer's follow-up box named GPT-6.1 Sol | Model change: Perplexity answered with another model | Model proof: the runner checked only the request, not the answer | Fleet 27: the answer's model must agree with the request, or the run exits 4 |
| 2026-11-03 | #311 `e7ece5c` | No input box found within 5.6 s | Page change or a lapsed sign-in | Submission | Not a runner fix: route 2 (cookie refresh) applies |
| 2026-11-05 | #670 `9c37722` | Posting the "Review in progress" claim failed with a GitHub GraphQL error | GitHub outage, not Perplexity | Claim | Not a runner fix: run again |
| 2026-11-05 | #677 | "Head moved since it was read" | The PR changed during the run; the capture's recorded head (`c4f468bc8e2f…`, 39 characters) is not a valid commit id | Head check | Working as designed: run again on the new head |
| 2026-11-16 | Fleet 24, #975 and #978 | Tab-open deadline in a five-tab batch | Load: five tabs at once | Opening the tab | Smaller batches (the next batch of three finished) |
| 2026-11-16 | Fleet 24, #976, #979, #980 | Early captures of answers still being written | The answer looked finished before it was; cause not proven | Waiting for the answer | Not fixed: the complete answers were read again from the same threads. Recorded as an open finding |
| 2026-11-16 | Fleet 24, #979 | Input failure before submission | Page state; cause not proven | Submission | Run again; it submitted on the next batch |
| 2026-11-16 | Fleet 25, #993 `0580522`, #994 `9eea9f5` | Exit 4 "wrong model" although the request and the answer both named Gemini 4 Hydrogen | Page change: the picker button's label read only "Model" | Reading the selected model before submission | Fleet 27: the runner reads the button's visible text, and a picker that names no model is left as it is, with the model taken from the request |

## What the runner now proves for each run

- **The request:** the `model_preference` Perplexity received (as before).
- **The picker:** the model's name from the button's label or its visible text, or "generic" with the model taken from the request.
- **The answer:** the model named in the follow-up box under the answer. It must agree with the request, or the run exits 4 and posts nothing.

Each receipt carries all three lines. No model name is fixed in the code. `PPLX_MODEL` still pins one when the owner names it.
