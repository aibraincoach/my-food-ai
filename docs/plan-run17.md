# Fleet 17 plan

Written 2026-11-04, revised 22:58 WIB (15:58 UTC) against `origin/main` `3677332317058a742284fba99fa806f074529632` (Fleet 16 #605–#614 and #616 merged; migrations through 0055 on main; next free number 0056). **Every find-text below was checked against `36773323` with `git show` at 22:58 WIB and occurs exactly once.** Open PRs are docs only (#604, #600, #577, #558); nothing here waits on them or touches them.

**Stops: zero.** Stop time: 01:30 WIB, November 5. One prompt to the end. **If a find-text does not match exactly once on `36773323`, the coder skips that edit, reports it in the final report, and does not rewrite it.** No item asks the owner anything.

**When done, stop (the coder rule, five parts).** (1) The fleet ends when every numbered item below is reported done or not done. (2) No new work goes inside it: no new PR, no new reading, no new fix after the last item. (3) A defect found at any point is reported to the PM at once. (4) A review finding outside the PR's own diff goes to the backlog. (5) The fix for any new defect runs in a new fleet.

**Merges and reviews (owner rule, November 4, 22:20 WIB).** A PR merges at a green head after the coder's hand review of its diff; external reviews after the fact (PPLX, AGY, Muse, Codex where they answer). Docs lane gets none.

**Production sign-in** authorized for section 4 readings: designated test account 2 through `scripts/lib/session.mjs`.

## 0. Nine pasted items (summary)

| Item | This plan |
|------|-----------|
| #601 measure detail photo | Nothing (#611 merged) |
| #370 camera stays open | **Lane A** 700 ms cap; **R4** |
| #222 feed / first photo 2 s | Nothing (PM helper) |
| #281 Muse Spark Open | **Lane D** stale Part 2 line |
| #372 feed photo bytes | **Lane D** stale no-store line |
| #455–#457 drinks | Nothing |
| #615 beer vanished | **Lane C** visible question; **R6** |

## Lanes

| Lane | Branch | Boundary |
|------|--------|----------|
| A | `run17/post-close` | `uploadManager.post` · `CaptureSheet.post` |
| C | `run17/visible-question` | `persistAnalysis` · analyze, push, strip, routes, prompt |
| D | `run17/docs` | report, two doc corrections |

## 1. Lane A — #370

`src/lib/posts/upload-manager.ts`: `CLOSE_WAIT_MS = 700`; `Promise.race([this.persist(entry), setTimeout 700ms])` on post acknowledgement path. Tests: `tsc`, `lint`, upload tests. **Done:** R4.

## 2. Lane C — #615

Migration `0056_visible_question.sql` (`posts.question jsonb`). Persist visible clarification with named items; push gate for `ready` + `question`; strip dismiss route; comment clears question; identify prompt names stated food. Tests per plan list + `npm run build`. **Done:** R6.

## 3. Lane D

- This file.
- `docs/open-weights.md` and `docs/media-loading.md` find-text replacements.
- `docs/run17-report.md`: items 1–3, PRs, receipts, readings, skips, defects.

## 4. Readings

`scripts/run17-checks.mjs`: `--mode=post-close` (Chromium CDP, 4032×3024, three runs, close ≤1000 ms) and `--mode=beer` (Firefox BiDi, caption `a glass of beer`, settle / answer / dismiss). Test account 2; ledger cleanup.

## 5. Closures

Comment #370 (R4 + merge) and #615 (R6 + merge). No docs PR merge required by this plan.

Execution evidence: [run17-report.md](./run17-report.md). Facts F1–F6 and full find-text blocks are in the owner dispatch revision 22:58 WIB against `36773323` (repository implementation matches merged heads #619/#620).
