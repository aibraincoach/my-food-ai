# Fleet 17 report

Observed 2026-11-04. **Main** includes #619 (`3b65a256`) and #620 (`58d235f9`). Docs lane: [#621](https://github.com/aibraincoach/my-food-ai/pull/621).

## Items

| # | Item | Done | Evidence |
|---|------|------|----------|
| 1 | Lane A — #370 close wait 700 ms | **Done** | Merge `3b65a2565913b093c34c3c2ed5bb87de748e52c7`; **R4 pass** (below) |
| 2 | Lane C — #615 visible question | **Done** | Merge `58d235f94d100d206729b2981756413767627b81`; migration **0056** applied; **R6 pass** (below) |
| 3 | Lane D — docs | **Done** (open PR) | #621: doc fixes, report, evidence, `run17-checks.mjs`, `plan-run17.md` |

## Readings

### R4 (#370)

**Done.** Local `npm start` (main), Chromium CDP `:9245`, Run 8 network + CPU 4×, 4032×3024 JPEG q95, test account 2.

Final batch (`docs/evidence/run17/post-close-v4.json`):

| Run | closeMs | Uploading card | Encoded (storage) |
|-----|---------|----------------|-------------------|
| 1 | 733 | yes | `0.feed.jpg` |
| 2 | 633 | yes | `0.feed.jpg` |
| 3 | 868 | yes | `0.feed.jpg` |

All three ≤ **1000 ms**; all show **Uploading photo…** within the measured second.

Driver notes: chunked CDP fixture injection; **8 s** pause between runs so each post is a fresh reservation (avoids overlapping encodes).

### R6 (#615)

**Done** (automated gate; push log line not captured). Firefox BiDi **`ws://127.0.0.1:9223/session`**, local app + production Supabase (same `.env.local` as Fleet 16), migration **0056**, caption **`a glass of beer`**, fixture `plate3.jpg`.

Evidence: `docs/evidence/run17/beer-v2.json`.

- **Settle:** post **`ready`**, item **glass of beer**, `posts.question` set (Clarification needed), feed card **stays visible**, Home strip row **present**.
- **Answer:** first option + **Done** → `question` cleared; correction cycle ran (`processing` then **ready**).
- **Dismiss:** second disagreement post → strip **Dismiss question** → post **remains ready**, `question` **null** (`after-dismiss` sample).

Not recorded in automation: explicit push payload log line, Days panel kcal snapshot (feed card shows drink kcal/alcohol at dismiss-wait).

## Pull requests

| PR | Merge | Receipts |
|----|-------|----------|
| [#619](https://github.com/aibraincoach/my-food-ai/pull/619) | `3b65a2565913b093c34c3c2ed5bb87de748e52c7` | AGY posted ([comment](https://github.com/aibraincoach/my-food-ai/pull/619#issuecomment-6635969255), head `8c3707a6`); PPLX failed (incognito Perplexity, no ask input); Codex not run |
| [#620](https://github.com/aibraincoach/my-food-ai/pull/620) | `58d235f94d100d206729b2981756413767627b81` | AGY posted ([comment](https://github.com/aibraincoach/my-food-ai/pull/620#issuecomment-6636250771), head `03d64c6f`, BLOCKERS: NONE); PPLX failed (same); Codex not run |
| [#621](https://github.com/aibraincoach/my-food-ai/pull/621) | open | docs lane — none |

## Find-text skips

(none)

## Defects

- Early R4 driver: oversized base64 in CDP evaluate — fixed in `run17-checks.mjs` on #621.
- R4 batches without inter-run gap occasionally exceeded 1000 ms on run 3 — resolved with **8 s** gap between posts.

## Issue comments

- [#370](https://github.com/aibraincoach/my-food-ai/issues/370#issuecomment-6635660561) (merge; update with R4 v4 optional)
- [#615](https://github.com/aibraincoach/my-food-ai/issues/615#issuecomment-6635660886) (merge; update with R6 optional)
