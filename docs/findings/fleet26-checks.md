# Fleet 26 local checks — 2026-11-17

Local disposable stack only: application 60760, PostgreSQL 55499, native Firefox at 390 × 844, local test account 2. No production access, customer contact, screenshots or real model-provider calls. Scripted model replies establish application behavior, not food-estimate accuracy.

K1–K5 used PR #1004 at `e13b720f63e43cc9422e4a712d254ab104927a0c`. Its served marker `local-1794916453737` matched emitted build HTML. Markers are artifact identifiers, not commit hashes; unchanged source/head bindings were retained separately. The prescribed 75-day seed ran once. F1/F4 settled in 2.49/2.81 seconds with one card row each; F1 met its 60-second limit.

Main-only baseline at `a5ad12ee646be9d48fd0d498836b4da13c93e27b`: application 723 tests, 717 passed, zero failed, six skipped in 442.982 seconds; database 48/48 passed in 117.261 seconds. Both exited 0 within their separate 600-second caps. No per-branch full suite ran or is claimed. Builds generated 44/44 pages and fresh BUILD_ID files, then exited 1 with the plan-documented `SecurityFatalError`; no dependency upgrade was made.

The later scoped PM instruction authorized the bounded main baselines, K5 observations and operator integration waits. It explicitly directed treating owner ruling 2 as confirmation for those waits; the ruling itself is standing authorization, not quoted necessity wording. Production section 9 and migration 0065 remain deferred to an exact-head merge order.

## K1 — held meal opens (#703)

PARTIALLY CHECKED. On the corrected instrument pass, “Couldn't open this meal.” appeared after each 12-second hold. One request was held at the first error. Releasing the requests opened the meal with no error overlay left over it.

The final Back action in that sequence was not completed because the driver looked for a button while the current control is a link labelled “Back to Feed”. A separate normal-detail readback clicked that link and returned Home. That does not prove the final Back action inside the original held-request sequence; no further hold/retry repetition was performed.

The initial generic-control failure and the corrected partial receipt are retained separately. These lookup failures do not establish a product failure. Evidence: `local-checks.json`, `local-checks-corrected.json`, `K1-back-readback.json` in the builder's Fleet 26 verification artifacts.

## K2 — lost added-photo recovery (#708)

MET in the local check. Before the reload, the chip read “Added photo” and “Not saved · Try again”, with Remove and View. After deleting only the prescribed drafts and reloading, it read “This photo was not kept. Take it again.”, with Remove and View.

The retake action opened the camera UI, verified against the actual “Take a photo” control. Intents after the tap: 0. The chip was gone after the second reload. This checks the local recovery UI, not a physical phone's camera hardware.

The first camera probe used stale control labels and is invalid for that result. The corrected pass used the same F1 fixture and preserved both receipts; no product code or new repository test was added to repair the probe.

## K3 — unavailable fibre detail (#523)

MET for the prescribed local case. The fixture's fibre values were set to NULL once. The general sentence beginning “Known nutrition shown. Nutrition unavailable:” was absent. Expanding the existing nutrition control produced:

> Fibre · unavailable: Yorkshire pudding, sliced roast beef, stuffing, brown gravy — unavailable

The initial case-sensitive/exact-label probe did not reach that row. The successful result is the subsequent read-only expanded-DOM receipt, without repeating the SQL mutation. Evidence: `K3-expanded-readback.json`.

## K4 — beer clarification (#615)

NOT DONE in full. The prescribed command `node scripts/run17-checks.mjs --mode=beer` used the plan's local URL/BiDi settings and exited 1 after 23.604 seconds. First error: `Error: Strip row missing`. Its samples and dismissal counts are absent; its exact strip-text lookup could not establish the intended current row. No script edit or repeated beer run was performed.

Fixture mode set/reset both returned HTTP 200, including the reset in cleanup. The command's one created post was removed by its cleanup. The requested app-log phrase “needs a reply” appeared 0 times; that is a log count, not proof of notification delivery or failure. The later Days read happened after the script removed the beer, so it cannot prove the beer's pre-cleanup calories.

Feed retention, the visible question, X dismissal without reload, and beer inclusion in the day's total therefore remain NOT CHECKED. Evidence: `K4.json`, with the original command/error receipt retained.

## K5 — sign-in reads beside browser requests (#323)

MEASURED, not fixed. The accepted collection used a fresh owned PR1 profile, verified account/build, no old tabs, and an active-context-only browser network filter. Each page navigation was followed by the prescribed 10-second wait. The matching log ranges include navigation as well, spanning 11.199–11.414 seconds.

| Page | Local Auth `/user` | Page requests | RSC requests | `/api/` requests | Other requests | Range seconds |
|---|---:|---:|---:|---:|---:|---:|
| Home | 19 | 1 | 18 | 0 | 60 | 11.248 |
| Days | 10 | 1 | 8 | 1 | 38 | 11.199 |
| Profile | 20 | 1 | 19 | 0 | 46 | 11.414 |

No other Auth path was returned in these bounded ranges. Counts align with page/RSC/API totals, but no request-correlated server spans establish causality. The one-call-per-page-open acceptance is not established by these results. These are local observations, not production sign-in measurements.

The earlier 17/11/17 collection was contaminated by old owned tabs left open when the helper ended its sessions. It is INVALID for isolated page-open claims and is retained as `K5-CONTAMINATED.json`. A bounded readback of the same original timestamps corrected stdout/stderr capture but did not cure that contamination. Only the fresh-profile replacement above is acceptance evidence; there was no third collection.

All underlying receipts, original instrument failures, corrected observations and cleanup evidence remain in the builder's Fleet 26 shared verification artifacts. No result from a wrong app, stale label, contaminated context set or partial probe is silently counted as a pass.
