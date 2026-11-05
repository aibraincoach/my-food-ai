# Fleet 18 remediation — closing run final report

2026-11-05T01:11:32Z

**I did not complete my plan.**

Production deployment (last merge): **`02eed560`** (`#678` fix18/post-merge at **`f6100790`**). Alias: `https://my-food-ai-ten.vercel.app`.

## Data pass (item 14)

| Metric | Value |
| --- | --- |
| Posts in `recompute-ids.json` | 41 |
| New `recompute` jobs inserted (Step 1 SQL) | 0 (jobs already queued/running) |
| Canary `15d6204e` | Finished ~01:03 UTC; 16 items with macros (owner fact) |
| Job status @ ~01:17 UTC (latest job per post) | finished **1**, running **1**, queued **39** |
| Posts still with any missing macro among ready items | **39** |
| Tick | `GET /api/jobs/tick` called once per plan (+ extra ticks while draining) |

## Post-merge review (unreviewed merges)

| PR / head | PPLX verdict | Disposition |
| --- | --- | --- |
| **#677** `c4f468bc` | Changes requested (3× P2) | **#678** `f6100790` merged on main |
| **#678** `f6100790` | PPLX not completed at deployed head (runner blocked on pending Vercel during first attempt) | Manual triage: author/handle, upload remove rollback, save-meal-blocked, avatar `fail()` cache addressed in #678 |
| **#672** `d50bdf79` | Changes requested (avatar cache, author, seeded avatar) | Avatar cache **fixed in #678** `route.ts`; author **fixed in #678**; seeded avatar update **open live bug** |
| **#670** `9c37722` | Changes requested (2× P2 alcohol regex) | **Fixed in #677** `alcohol.ts` simplification; `tests/alcohol-name.test.mjs` pass on main |
| **#667** `30db5ad` | Changes requested (bookmark failure feedback) | **Fixed in #678** `PostActions.tsx` (`save-meal-blocked`) |
| **#668** `0e23d13` | Changes requested (2× P2 `OutlineOverlay` cache) | **Open live bug** (TTL while mounted / stale signed URL recovery) |
| **#671** `4b94c18` | Changes requested (UploadChip remove order) | **Fixed in #677+#678** (camera-first + store rollback) |

## Production proof (account 2, no browser)

| Check | Result |
| --- | --- |
| Production commit | **Pass** — `02eed560` on main, health 200 |
| Avatar: no cookie → 401 | **Pass** — valid UUID path, `Cache-Control: private, no-store` |
| Avatar: account 2 own image → 200 + private | **Not done** — test account 2 has no `avatar_media_id` |
| Drain fake holder → 409 | **Pass** |
| Queued recompute job → finished | **Partial** — worker draining; aggregate `finished` jobs >1; 39 posts still queued |
| `tests/alcohol-name.test.mjs` | **Pass** |
| DB `today_summary(text)` null rule | **Pass** — `count(*) filter (where … is not null) = 0 then null` |
| DB servings check ≥ 0.1 | **Pass** |
| DB label `serving` in create functions | **Pass** — `create_food_post`, `create_food_post_without_gtin` |
| Macaroni `86634d46` read-only macros | **Fail** — calories/protein/carbs/fat still null (recompute pending) |
| Post page contains `expiresAt` | **Pass** — account 2 post `d37b129e…` |
| Bookmark / upload chip / open-cover retry | **Not proven in production**; PPLX at merged heads: changes requested (#667/#671/#668) except where fixed in #678 |

## Backlog / issues (Step 4)

| Item | Action |
| --- | --- |
| Backlog drain (#640), servings (#643), Today loop (#638), avatar (#647) sections | **Removed** from `BACKLOG.md` after production/DB proof |
| **#452** (label DB serving) | **Closed** with DB evidence (0060/0061/0062 applied) |
| **#523** (macaroni unavailable) | **Left open** — macros still null after recompute queue |
| **#675**, **#676** | **Merged** per owner order |

## New defects found (not worked on)

- Third fleet wave of merges without clean exact-head PPLX (**#677** zero review; **#667/#668/#671** at “changes requested”; **#672** at unreviewed `d50bdf79`).
- **`OutlineOverlay`** signed-URL cache findings (#668) still open on main after #678.
- **#677** accidentally committed many `docs/reviews/mfa-pplx-pr*.md` artifacts (process hygiene).
- **Recompute backlog**: 39/41 posts still missing macros; worker lease healthy but drain slower than closing window.
