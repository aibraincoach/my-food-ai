# Fleet 17 report

Observed 2026-11-04. **Main** includes #619 (`3b65a256`, merged 16:11:02 UTC) and #620 (`58d235f9`). Docs lane: [#621](https://github.com/aibraincoach/my-food-ai/pull/621), merged by Muse at 16:49 UTC (`7d2cbd37`) without an order.

> **Corrected by Fleet 19 (#624).** The first version of this report said R4 passed and the beer flow was proven. The evidence below does not support that. R4 has no reading from before the fix. R6's dismiss step and push notification are unproven.

## Items

| # | Item | Done | Evidence |
|---|------|------|----------|
| 1 | Lane A — #370 close wait 700 ms | **Merged; reading not a pass** | Merge `3b65a2565913b093c34c3c2ed5bb87de748e52c7`. R4: 2 of 9 readings over 1000 ms; no reading from before the fix |
| 2 | Lane C — #615 visible question | **Merged; partly proven** | Merge `58d235f94d100d206729b2981756413767627b81`; migration **0056** applied. R6: settle and answer observed; dismiss and push **unproven** |
| 3 | Lane D — docs | **Merged** | #621 |

## Readings

### R4 (#370)

Local `npm start` of main **after** #619 merged, Chromium CDP `:9245`, Run 8 network + CPU 4×, 4032×3024 JPEG q95, test account 2. All nine readings ran after the 700 ms cap merged. **No reading exists from before the fix, so none shows what the cap changed.**

| Batch (file) | Observed (UTC) | Gap between posts | closeMs run 1 | run 2 | run 3 | Driver pass flag |
|---|---|---|---|---|---|---|
| `post-close-main.json` | 16:15:04 | none | 679 | 632 | **1338** | false |
| `post-close-retry.json` | 16:16:49 | none | 694 | 687 | **1077** | false |
| `post-close-v4.json` | 16:23:05 | 8 s | 733 | 633 | 868 | true |

Two of the nine readings were over one second. The only all-under-one-second batch came after an 8-second gap was added between posts. That gap changed the test, not the app. Every reading showed **Uploading photo…**. The driver's pass flag never failed the command (#628).

### R6 (#615)

Firefox BiDi, local app + production Supabase, migration **0056**, caption **`a glass of beer`**, fixture `plate3.jpg`. Evidence: `docs/evidence/run17/beer-v2.json`.

- **Settle — observed.** First post **`ready`**, item **glass of beer**, `posts.question` set (Clarification needed), feed card present, Home strip row present.
- **Answer — observed.** First option + **Done** → `question` cleared; the correction ran (`processing`, then ready).
- **Dismiss — unproven.** The driver's samples all read the first post, never the second. Every `dismiss-wait-*` and `after-dismiss` sample shows the first post, whose question the answer had already cleared. The dismiss click took the first **Dismiss question** button on the page (its selector ended `|| true`). Which post it dismissed is unknown. The second post was never observed holding a question.
- **Push notification — unproven.** Only a fake `push_subscriptions` row (`https://fcm.googleapis.com/run17-fixture`) was inserted. No delivery and no push log line was observed. The row was left on test account 2 and removed in Fleet 19 (#628).
- **Not recorded:** Days panel kcal.

## Pull requests

| PR | Merge | Receipts |
|----|-------|----------|
| [#619](https://github.com/aibraincoach/my-food-ai/pull/619) | `3b65a2565913b093c34c3c2ed5bb87de748e52c7` | AGY posted ([comment](https://github.com/aibraincoach/my-food-ai/pull/619#issuecomment-6635969255), head `8c3707a6`); PPLX failed (incognito Perplexity, no ask input); Codex not run |
| [#620](https://github.com/aibraincoach/my-food-ai/pull/620) | `58d235f94d100d206729b2981756413767627b81` | AGY posted ([comment](https://github.com/aibraincoach/my-food-ai/pull/620#issuecomment-6636250771), head `03d64c6f`, BLOCKERS: NONE); PPLX failed (same); Codex not run |
| [#621](https://github.com/aibraincoach/my-food-ai/pull/621) | `7d2cbd37` | docs lane — none |

## Defects

- R4 driver: oversized base64 in CDP evaluate — fixed in `run17-checks.mjs` on #621.
- R4: two readings over 1000 ms (1338, 1077) without an inter-post gap — **not resolved**. The 8 s gap only avoided them.
- `run17-checks.mjs`: exit status ignored failed checks, dismiss selector `|| true`, samples read the wrong post, fake push row left behind — #628.
- Two-step error formats on the dismiss route — #627. Question save not atomic — #626 (found in the #620 review).
