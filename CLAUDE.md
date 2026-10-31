# Agent rules — My Food AI

Hackathon project: My Food AI. PM contract: [docs/pm-contract.md](docs/pm-contract.md). Planner contract: [docs/planner-contract.md](docs/planner-contract.md). Backlog: [BACKLOG.md](BACKLOG.md). Review: [REVIEW_POLICY.md](REVIEW_POLICY.md), [docs/review.md](docs/review.md).

## Skills (Cursor / Claude)

| Skill | Path |
| --- | --- |
| PM handover | [skills/pm-handover/SKILL.md](skills/pm-handover/SKILL.md) |
| PPLX review | [skills/pplx-review/SKILL.md](skills/pplx-review/SKILL.md) |
| AGY review | [skills/agy-review/SKILL.md](skills/agy-review/SKILL.md) |
| Codex review | [skills/codex-review/SKILL.md](skills/codex-review/SKILL.md) |

Review tooling is ported from [naval-association-calgary](https://github.com/aibraincoach/naval-association-calgary) (PPLX runner, review policy shape) and burn-centre-translator / calgarysalutes-website (AGY delivery script, Firefox helper).

## Work

Branch from `origin/main`; never commit directly on `main`. One PR per change. Docs-only PRs (only `docs/`, `skills/`, and root `*.md` policy files) need no PPLX/AGY/Codex review.

Code PRs: PPLX first (`skills/pplx-review/SKILL.md`), AGY second, Codex third per `REVIEW_POLICY.md`. End coder runs with `scripts/cleanup.sh`.

Never commit secrets; use `.env.example` only. Prior Supabase wipe notes: [docs/database-before-wipe.md](docs/database-before-wipe.md).

## PM handover

Reconcile documents, commit on the document branch, then `skills/pm-handover/scripts/pack.sh`. The handover text is the reply; zip output goes under `uploads/` (gitignored). Dispatch shape and technical ownership follow the current PM and planner contracts linked above.

## Session summary

_Observed 2026-10-31 08:23:07 UTC (2026-10-31 02:23:07 MDT). This is reconciled handover memory, not an execution order._

- Product main and production: `34d905161cd129b30b86d305a91cedf8a183ca27`, deployment READY. All ten Run 4 implementation PRs #236–#245 merged in ascending order after exact-head authorization. Their final heads, merge commits and same-head Gemini receipts/dispositions are indexed in [docs/reviews/README.md](docs/reviews/README.md). All Run 3 changes remain on main. Production function duration is configured for 300 seconds.
- Migrations 0019/0020 were previously applied; Run 4 migrations 0021, 0023 and 0024 are now applied, each through psql in one transaction. Number 0022 was reserved but unused and is permanently retired; no missing SQL file is to be created. Future migration numbers start at 0025.
- Worker code fixes effective concurrency at 1. Its independent minute wake was activated at 08:06:22.337 UTC on Oct 31, then disabled at 08:13:02.599 UTC after four terminal failures. Twenty photo posts were created through the normal upload/completion path over 113.045 seconds, starting 08:06:23.001 UTC; the harness issued no manual tick or focus wake. At the final read, 08:21:56.989 UTC, after the 08:21:23 UTC fifteen-minute deadline, 0 were ready, 10 failed and 10 remained incomplete (2 processing, 8 queued). Errors included incomplete match decisions and incomplete Spark identify output. This FAILED the all-ready acceptance; it does not prove the worker stall fixed. The schedule remains registered but the configuration has zero origins, so network waking is disabled. [Detailed result](docs/load-test.md).
- The first production breakfast and curry re-logs after #236 failed with `Food match decision did not complete` after 3 attempts each, with zero persisted items and unavailable totals. Investigation found the matching decision's 256-token limit could be exhausted before its structured answer. Extra PR #246, head `144dbf336c7412618b72c2ff9a655f4278df04e3`, raises that limit to 2048; recorded-response replay passed in 3.15 seconds, its 16 targeted tests, TypeScript/lint and Vercel checks passed, and independent Gemini review found no real blocker after triage. It is OPEN and unmerged, awaiting separate exact-head owner authorization. This handover does not grant that authority. Breakfast/curry acceptance remains failed; #189/#226 have no owner acceptance. The load test additionally exposed Spark identify exhausting its 4096-token retry cap, producing incomplete or partial output. That separate failure is not fixed by #246 and no extra provider request or code change was made for its diagnosis.
- Final combined implementation verification: production build and 94 tests passed, with zero failures or skips. This does not establish food accuracy, physical-phone behavior or successful twenty-post production processing.
- The production admin browser check passed on the first configured test account at 390×844: the trace page rendered SAM, identify and FDC rows, HTTP 200, 134129 bytes. Its role was changed from user to admin for this check only, restored to user at 2026-10-31 07:49:16 UTC, and independently verified. After restoration the same request returned HTTP 404, 9 bytes and no trace. The designated owner account was not used. [Evidence on #67](https://github.com/aibraincoach/my-food-ai/issues/67#issuecomment-6540903163).
- Run 4 now publishes calculated nutrition summaries, known sums with named omissions and external/cache/reuse food provenance; upload drafts publish atomically only after required photo objects are verified. Local timestamps, caption-only edits, optimistic thumbs, terminating sign-out, request/response session-cookie propagation and bounded private media signing reuse are merged. Distinguish this implemented behavior from the uncompleted production acceptance below.
- Real-phone installed-session persistence (#221) and mobile-data first-photo time (#222) remain unproven. Media measurements demonstrated stable signed URLs and eliminated a repeated signing call inside a warm instance; they did not prove the two-second phone threshold. Real-phone camera and notification checks, the full ten-photo production evaluation, and two complete demo runs are not recorded.
- #212's deterministic barcode capture and pack-photo path already shipped, but the dedicated nutrition-label path and real-pack phone evidence remain incomplete. #214's hydration implementation includes food water through nutrient 1051 up to the drink's eaten-at time; no duplicate feature was built. Designer #219/#220 await frames. #218 stays blocked.
- The owner-supplied 09:45 MYT sectioned backlog is retained with its wording, issue numbers and order; dated status annotations distinguish completed history from open acceptance. #196 and #137 are closed. #189 remains open. Do not treat a historical backlog problem paragraph as proof that its code fix is still absent.
- This document branch and draft docs PR #235 remain unmerged. The owner authorized pushing the coherent backlog/handover documentation batch. The four PM Wall entries dated 2026-10-31 15:12–15:36 MYT are recorded verbatim; the PM contract now states whole-job authority and planner-evaluation ordering. A handover narrative belongs in the reply, never a tracked HANDOVER file.
- The PM's current dispatch rule: state the problem and why it matters in plain human language, without commands, branch names, step scaffolding or repeated contract rules. The coder owns implementation and sequence. A single dispatch carries all known work; no second dispatch goes to a working coder. A run's merge order follows the planner's evaluation.
- The open-model experiment is deferred until the owner's fleet work is done and is outside Run 4. No Modal or Fireworks credential was found in the earlier local/production name audit; the trial did not run and spent $0. `MODEL_API_BASE_URL` can change the endpoint, but model names are hardcoded and the ten-photo harness posts to `APP_URL` rather than selecting a model. A visual portion estimate is not a measurement.
- Runtime AI calls use Meta models only. USDA FoodData Central is a database, not an AI model. There is no text-to-speech implementation or third-party AI voice. The owner's Oct 29 rules-bot ruling supersedes the earlier allowance.
- Code freeze remains the end of Nov 3; submission is Nov 4 at 9 PM Eastern; the demo video must be under three minutes. No migration, deployment, review run, production write or customer contact is authorized merely by receiving this handover.

## Evidence links

- [Autonomous photo posting and readiness](https://github.com/aibraincoach/my-food-ai/issues/137#issuecomment-6522507311); [eaten-at check](https://github.com/aibraincoach/my-food-ai/issues/106#issuecomment-6522508021).
- [Post-three-hour photo recheck](https://github.com/aibraincoach/my-food-ai/pull/206#issuecomment-6527241469); [admin browser check and role restoration](https://github.com/aibraincoach/my-food-ai/issues/67#issuecomment-6527285363).
- [Breakfast result](https://github.com/aibraincoach/my-food-ai/issues/189#issuecomment-6522506987); [reopen #189](https://github.com/aibraincoach/my-food-ai/issues/189#issuecomment-6537239960); [close #196](https://github.com/aibraincoach/my-food-ai/issues/196#issuecomment-6537240249).
- #205: [Gemini receipt](https://github.com/aibraincoach/my-food-ai/pull/205#issuecomment-6521537794), [Codex receipt](https://github.com/aibraincoach/my-food-ai/pull/205#issuecomment-6521506078).
- #206: [Gemini receipt](https://github.com/aibraincoach/my-food-ai/pull/206#issuecomment-6521553743), [Codex receipt](https://github.com/aibraincoach/my-food-ai/pull/206#issuecomment-6521506368).
