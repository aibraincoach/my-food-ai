# Fleet 17 report

Observed 2026-11-04 (session ending before 01:30 WIB target). Baseline was `origin/main` at `09362a774c4de79b20907a12f3f294b0de193b15`; merges landed on main at `58d235f94d100d206729b2981756413767627b81` (#620).

## Items

| # | Item | Done | Evidence |
|---|------|------|----------|
| 1 | Lane A — #370 close wait 700 ms | **Done** (code + merge) | PR [#619](https://github.com/aibraincoach/my-food-ai/pull/619) head `8c3707a6`, merge `3b65a2565913b093c34c3c2ed5bb87de748e52c7` |
| 2 | Lane C — #615 visible question | **Done** (code + merge + migration) | PR [#620](https://github.com/aibraincoach/my-food-ai/pull/620) head `03d64c6f`, merge `58d235f94d100d206729b2981756413767627b81`; `0056_visible_question.sql` applied; `posts.question` column verified |
| 3 | Lane D — docs | **Partial** | `open-weights.md` and `media-loading.md` corrected on `run17/docs`; `plan-run17.md` + this report on docs branch; docs PR not merged per plan |

## Readings

| Reading | Done | Notes |
|---------|------|-------|
| R4 (#370) | **Not done** | `scripts/run17-checks.mjs --mode=post-close` against local `npm start` + Chromium CDP 9245 exited with browser `Uncaught` before three runs recorded |
| R6 (#615) | **Not done** | Not run (requires lane C build + Firefox BiDi + worker; migration applied) |

## Pull requests

| PR | Branch | Merge commit | Vercel | Receipts |
|----|--------|--------------|--------|----------|
| #619 | `run17/post-close` | `3b65a2565913b093c34c3c2ed5bb87de748e52c7` | Green at merge | PPLX/AGY/Codex not collected this session |
| #620 | `run17/visible-question` | `58d235f94d100d206729b2981756413767627b81` | Green at merge | PPLX/AGY/Codex not collected this session |

## Find-text skips

| File | Reason |
|------|--------|
| (none) | All plan find-texts matched on current main before edits |

## Defects noticed

- R4 driver failed locally (`Uncaught` in browser automation); reported on #370 issue comment, not fixed in-fleet.

## GitHub issue comments

- [#370](https://github.com/aibraincoach/my-food-ai/issues/370#issuecomment-6635660561) — merge + R4 status
- [#615](https://github.com/aibraincoach/my-food-ai/issues/615#issuecomment-6635660886) — merge + migration + R6 status
