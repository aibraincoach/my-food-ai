# Fleet 19 final execution report

**Observed 2026-11-05.** **Main before this docs merge:** `ada164d7` (includes code merges **#651–#655**, **#653**, and early docs **#656** with backlog snapshot plus `docs/evidence/run19/ten-photos.json`). **This report and the failed 3c receipts ship in docs PR [#660](https://github.com/aibraincoach/my-food-ai/pull/660).**

Fleet 19 product code is **complete on main**. Four plan items are **closed with evidence**. Item **3** is **not done**: script fixes merged (**#651**), fake push row delete demonstrated in partial runs, but **3c browser proof never passed** on this host (tooling/environment, not an open code lane).

**External review:** No PPLX, AGY, or Codex receipts were posted on the merged Fleet 19 code PRs during this run.

## Results by item

| Item | Issue | Result | Evidence |
| --- | --- | --- | --- |
| 1 | #626 atomic question save | **Done** | **#654** merged (`4d4c62af`). Migration **0059** `persist_analysis_with_question`. DB test on disposable stack. Issue **closed**. |
| 2 | #627 dismiss JSON errors | **Done** | **#655** merged (`5a85ceb6`). Route test on disposable stack. Issue **closed**. |
| 3 | #628 `run17-checks.mjs` | **Partial** | **#651** merged (`f8f7f998`): exit 1 on failure, scoped dismiss, push fixture cleanup in `finally`. **3b:** production fake push row removed in earlier runs. **3c:** **not proven** — see below. Issue **open**. |
| 4 | #471 post cap once per meal | **Done** | **#652** merged (`75fd0cf6`). Production `scripts/run19-ten-photos.mjs` on `https://my-food-ai-ten.vercel.app`: `docs/evidence/run19/ten-photos.json` **`pass: true`**. Issue **closed**. |
| 5 | #624 corrected Fleet 17 report | **Done** | **#653** merged (`e6183b9f`). Issue **closed**. |

## Item 3c — failed proof (tooling)

Commands (from `scripts/run17-checks.mjs` header):

- **post-close:** Chromium CDP `http://127.0.0.1:9245`, app URL local or production.
- **beer:** Firefox BiDi `ws://127.0.0.1:19515/session` (or dedicated port), app URL local or production.

| Mode | Representative failure | Receipt |
| --- | --- | --- |
| post-close | `Page.navigate timeout` (headless Chromium on this ARM host; localhost and production HTTPS) | `docs/evidence/run19/post-close.json`, exit files |
| beer (local `:3000`) | `/api/health` stayed **503** (`database.ok: false` in Next probe); BiDi `Control missing` or tap `Expected "x" to be a finite number … "-0"` | `docs/evidence/run19/beer.json`, `beer.exit` |
| beer (production alias) | Post created; never `receipt.pass`; errors include **Strip row missing**, **never settled with a question**, BiDi session limits on shared `:9223` | Same evidence dir; GitHub [#628](https://github.com/aibraincoach/my-food-ai/issues/628) comments |

No run recorded **`dismissCalls`** or **`receipt.pass: true`** for beer. Post-close never recorded three passing close timings.

## New defects filed (not Fleet 19 scope)

These were filed during Fleet 19 reconciliation; they remain backlog work:

| Issue | Summary |
| --- | --- |
| [#657](https://github.com/aibraincoach/my-food-ai/issues/657) | README still says unmatched foods are unavailable; app estimates after #588. |
| [#658](https://github.com/aibraincoach/my-food-ai/issues/658) | Single-tap meal open waits up to 320 ms (`SINGLE_TAP_WAIT_MS`). |
| [#659](https://github.com/aibraincoach/my-food-ai/issues/659) | Fleet 18 review findings not fully checked on main. |

## Executed merge list (code)

| PR | Title | Merge commit |
| --- | --- | --- |
| #651 | run17-checks exit code and cleanup (#628) | `f8f7f99803f3d4fe4b04c774399ffbefebbb8dd6` |
| #652 | post cap counts meals not requests (#471) | `75fd0cf62af741aa65e45d3692909ff43c124184` |
| #654 | atomic question save (#626) | `4d4c62af7f32f00c3b85340fedace1d309b54cc7` |
| #655 | JSON errors on question dismiss (#627) | `5a85ceb64c088b31f41083fb1c6d35a65a2cb6e9` |
| #653 | correct Fleet 17 report (#624) | `e6183b9f9bd9002fd952d645da666bf3cac4858c` |

**Note:** Docs **#656** (backlog snapshot + ten-photo JSON on main) merged before the owner’s intended “docs last” order; failed 3c JSON remained on **#660** until this merge.

## Cleanup

End of run: Fleet 19 browsers and local test app stopped; disposable stack `uploads/test-stack-run19` brought down; **`run19-3c` worktree removed**; `scripts/cleanup.sh` run (mfa-pplx Firefox untouched; Fleet 18 review worktrees preserved).

## Next fleet (not dispatched — backlog / planner)

Do **not** treat the following as authorized work from this report alone:

1. Fix BiDi tap **`-0`** coordinate bug in `run17-checks.mjs` (and any shared tap helper).
2. Make the beer **answer** step wait for the Home **strip row** before clicking (match current `NeedsInputStrip` copy/structure).
3. Re-run **3c** on a **stable browser setup** (dedicated Firefox BiDi port, CDP that navigates HTTP(S), or owner-approved host); then close **#628** with green receipts.
4. File and clean **Fleet 17 leftover posts** on designated test account 2 (posts created by failed or partial `run17-checks` / Fleet 17 proof attempts that were not fully deleted) as its **own backlog item**, separate from #628 script fixes.
