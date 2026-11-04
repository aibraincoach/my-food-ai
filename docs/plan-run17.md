# Fleet 17 plan

Written 2026-11-04, revised 22:58 WIB (15:58 UTC) against `origin/main` `3677332317058a742284fba99fa806f074529632`. Execution baseline in this repo was later `origin/main` through Fleet 16 docs merge `09362a774c4de79b20907a12f3f294b0de193b15`.

**Objective:** the capture sheet closes at the tap (#370) and a posted beer stays posted (#615).

**Lanes:** A `run17/post-close` (700 ms persist cap), C `run17/visible-question` (`posts.question`, visible clarification), D `run17/docs` (this file, doc corrections, report). Readings R4 (post-close, 4032×3024 CDP) and R6 (beer caption, Firefox BiDi) via `scripts/run17-checks.mjs`.

**Stop rule:** report every numbered item done or not done; no in-fleet fixes after the last item; defects one line to PM; reviews after merge.

The authoritative verbatim dispatch (find-texts, facts F1–F6, section 0 table, lane boundaries, readings spec, cleanup) is the owner prompt stamped 2026-11-04 22:58 WIB. This file records that dispatch identity; implementation evidence is in [run17-report.md](./run17-report.md).
