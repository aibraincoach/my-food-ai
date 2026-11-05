# Fleet 18 remediation — final report (stop 2026-11-05 01:00 UTC)

**I did not complete my plan.**

Production alias: `https://my-food-ai-ten.vercel.app`. Deployment checked at **`d399a286`** (merge #666; includes merged fix18 through #674 in history). Vercel production check: **success**.

## Merge outcome (14 fix PRs #661–#674)

| State | PRs |
| --- | --- |
| **Merged (9)** | #661, #662, #663, #664, #665, #666, #669, #673, #674 |
| **Open (5)** | #667, #668, #670, #671, #672 |

Migrations **0060**, **0061**, **0062** verified on production database (function bodies and `posts_servings_check`; `today_summary` null semantics match 0062).

## Open PRs — live bugs left on production

| PR | Live bug |
| --- | --- |
| **#667** | Bookmark on failed posts can hang; unsave on saved failed post can mark failed instead of unsaving. |
| **#668** | Open-cover retry lacks timers; expired signed photo links in session cache → 403 until session ends. |
| **#670** | “Fruit cocktail” / shrimp cocktail counted as alcohol; “topped with cheese” (non-protein) can reject valid USDA records. |
| **#671** | Photo-lost upload chip: retake path can leave failed upload stuck / drafts resurrect. |
| **#672** | Post headers can show viewer not author; avatar route may cache signed URLs with public immutable cache. |

Per stop-time rule, these five are **not merged** in this window; each is one fix + one exact-head PPLX (or policy fallback) from merge-ready.

## Read-only production checks (post–#674 deployment)

| Check | Result | Notes |
| --- | --- | --- |
| **`/api/jobs/drain` without lease → 409** | **Pass** | `GET …/drain?holder=fake-holder-id` → `Not the lease holder.` HTTP 409. |
| **Feed overload 302 uses `private, no-store`** | **Pass (code on main)** | `feed-photo-response.ts` at `d399a286`: 302 spreads `headers` with `Cache-Control: private, no-store`. Not re-probed with an authenticated overload redirect in this window. |
| **`today_summary` null semantics (0062)** | **Pass** | DB function body uses per-macro `count(*) filter … = 0 then null`. |
| **Servings floor 0.1 (0061)** | **Pass** | `posts_servings_check`: `servings >= 0.1`. |
| **Label `portion_unit` accepts `serving` (0060)** | **Pass** | `create_food_post` definition includes `'serving'` in allowed units. |
| **0062 migration applied** | **Pass** | Inferred from `today_summary` definition (not from a migrations table row; no `schema_migrations` relation in this DB). |
| **Data pass (recompute jobs / item 14)** | **Not done** | Zero rows in `public.jobs` with `created_at >= 2026-11-05 00:00 UTC`; no `recompute-ids.json` or batch run. Skipped per planner when <5 minutes remained before stop. |
| **Production proof matrix (item 15, account 2, #471 guard)** | **Not done** | Not started in this window. |
| **Close issues / BACKLOG reconciliation beyond owner snapshot** | **Not done** | Backlog on docs PR #675 is owner verbatim 07:40 WIB (stale on merge counts by design). |

## PPLX at current heads (local captures, not all on PR branches)

- **#667**, **#668**, **#670**, **#671**, **#672**: captures exist under `docs/reviews/` at current heads; findings are **P2-only** on #672 at `97d0a9d` (no P1 after `getUser()` fix). Triage/post to GitHub not completed in this window.

## Docs PRs

- **#675** (`fix18/docs-remediation`): backlog + Fleet 18 evidence only; **not merged** without owner order. PM contract / Wall split to **#676**.
- **#676** (`docs/pm-authority-wall-20261105`): Wall 07:42 / 07:45 + PM authority; **not merged** without owner order.

## Planner note (process)

Review waivers and merge-with-open-P2 calls are **PM decisions**, stated in writing — not owner polls mid-run.
