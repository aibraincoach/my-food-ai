# Fleet 18 remediation — final report

**I did not complete my plan.**

Production alias: `https://my-food-ai-ten.vercel.app`.

## Stop snapshot (2026-11-05 01:00 UTC)

At the planned stop, **`d399a286`** was production-ready (9/14 fix PRs merged). Read-only DB/route checks below were run against that deployment. **Data pass** and **production proof matrix** were **not done**.

## Owner override (after 01:00 UTC)

The owner overrode exact-head external review for the remaining five PRs (out of time). All merged to **`main`** by **2026-11-05 00:58:53Z**:

| PR | Merge |
| --- | --- |
| #667 | `e333685` |
| #668 | `1ab1025` |
| #670 | `47f92b9` |
| #671 | `d54a9ed` |
| #672 | `5be9625` (`d50bdf79` on branch; conflict resolve in `PostDetailHeader.tsx`) |

**Current `main`:** **`5be9625f`** — **14/14** fix PRs #661–#674 merged. PPLX receipts at pre-merge heads were not re-run or triaged on GitHub before these merges.

The bugs listed for the five open PRs at stop are **addressed in code on main**; production proof that each fix behaves on the live app was **not done** in this window.

## Read-only production checks (at stop, deployment through #674 / `d399a286`)

| Check | Result | Notes |
| --- | --- | --- |
| **`/api/jobs/drain` without lease → 409** | **Pass** | `GET …/drain?holder=fake-holder-id` → HTTP 409. |
| **Feed overload 302 uses `private, no-store`** | **Pass (code on main)** | Verified in `feed-photo-response.ts` at stop head; no authenticated overload curl. |
| **`today_summary` null semantics (0062)** | **Pass** | DB function body. |
| **Servings floor 0.1 (0061)** | **Pass** | `posts_servings_check`. |
| **Label `portion_unit` accepts `serving` (0060)** | **Pass** | `create_food_post`. |
| **Data pass (recompute / item 14)** | **Not done** | No `recompute-ids.json`; no recompute batch since 00:00 UTC. |
| **Production proof matrix (item 15, account 2, #471)** | **Not done** | Not started. |
| **Issue close / backlog live sync** | **Not done** | Backlog on #675 is owner verbatim 07:40 WIB. |

Re-run drain / DB checks against **`5be9625f`** after Vercel production is READY if you need post-override confirmation.

## Docs PRs (not merged without owner order)

- **#675** — backlog + Fleet 18 evidence.
- **#676** — Wall 07:42 / 07:45 + PM authority (split from #675).

## Process

Review waivers are PM decisions, stated in writing. The owner may override review/merge policy by explicit order (as for the final five PRs).
