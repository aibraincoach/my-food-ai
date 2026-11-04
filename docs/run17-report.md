# Fleet 17 report

Observed 2026-11-04. Code merges on `main` through `3a181ad2` (#619 `3b65a256`, #620 `58d235f9`, docs lane [#621](https://github.com/aibraincoach/my-food-ai/pull/621) open).

## Items

| # | Item | Done | Evidence |
|---|------|------|----------|
| 1 | Lane A — #370 close wait 700 ms | **Done** (code + merge) | PR [#619](https://github.com/aibraincoach/my-food-ai/pull/619) merge `3b65a2565913b093c34c3c2ed5bb87de748e52c7` |
| 2 | Lane C — #615 visible question | **Done** (code + merge + migration) | PR [#620](https://github.com/aibraincoach/my-food-ai/pull/620) merge `58d235f94d100d206729b2981756413767627b81`; `0056_visible_question.sql` applied; `posts.question` verified |
| 3 | Lane D — docs | **Partial** | Doc corrections + this report on `run17/docs` ([#621](https://github.com/aibraincoach/my-food-ai/pull/621)); `plan-run17.md` is a dispatch pointer, not a full verbatim paste |

## Readings

| Reading | Done | Notes |
|---------|------|-------|
| R4 (#370) | **Not done** (strict gate) | After chunked CDP fixture injection fix: local `npm start` + Chromium CDP 9245, 4032×3024 JPEG. Batch 1 closeMs: **679, 632, 1338** ms (`uploading: true` all). Batch 2: **694, 687, 1077** ms. Gate requires all three ≤1000 ms; one run per batch exceeded. Encoded object sizes not captured at +500 ms (storage still empty in ledger window). |
| R6 (#615) | **Not done** | No Firefox BiDi listener on `19515` (or `9223`); beer mode not executed. Migration applied before intended R6. |

## Pull requests

| PR | Branch | Merge commit | Vercel | Receipts |
|----|--------|--------------|--------|----------|
| #619 | `run17/post-close` | `3b65a2565913b093c34c3c2ed5bb87de748e52c7` | Green at merge | PPLX/AGY/Codex not collected |
| #620 | `run17/visible-question` | `58d235f94d100d206729b2981756413767627b81` | Green at merge | PPLX/AGY/Codex not collected |
| #621 | `run17/docs` | (open) | — | Docs lane: no external review |

## Find-text skips

| File | Reason |
|------|--------|
| (none) | All plan find-texts matched on baseline before edits |

## Defects noticed

- R4 driver initially failed on oversized base64 in CDP `evaluate` (`Uncaught`); fixed on docs branch via chunked injection (not on `main` until #621 or follow-up).
- R4 third-run close latency occasionally **>1000 ms** (likely `resolveOwner()` before the 700 ms persist race); not changed in-fleet (Lane A already merged).

## GitHub issue comments

- [#370](https://github.com/aibraincoach/my-food-ai/issues/370#issuecomment-6635660561)
- [#615](https://github.com/aibraincoach/my-food-ai/issues/615#issuecomment-6635660886)
