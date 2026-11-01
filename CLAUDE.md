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

_Current backlog update: the owner supplied the Sunday Nov 1, 09:38 WIB PM backlog for a new docs PR. [BACKLOG.md](BACKLOG.md) now follows that supplied order and wording. The prior reconciled backlog, including production status annotations, is preserved in [the 09:11 snapshot](docs/history/2026-11-01-backlog-before-0938.md). The runtime evidence below remains historical evidence; its #235-only execution order is superseded by this docs request. Round 3 frames now guide #219/#220; desktop, agent-connection and upload-progress frames remain designer dependencies. This documentation update does not change GitHub issue states or establish acceptance._

_Observed 2026-11-01T02:11:31+00:00. Main and the production alias were independently re-read for the owner's #235-only merge order. This is documentation state, not an additional execution order._

- Main and production at this reconciliation baseline are `c392a30ae170ec4f7a7cc48e5b8ff9b1d4d597a5`, READY, with a 300-second function duration. This documentation merge will advance main; the baseline SHA identifies the verified runtime rather than predicting this PR's merge SHA. Run 3, #236–#249 and #250–#257 are merged. Preserve all later code, receipts and production evidence when integrating the old docs branch.
- #250/#253 repaired compatible prepared-food retrieval, #251 versioned prior-meal confirmation/copy provenance, #254 whole-dish component coverage, #255 correction source-index safety, and #256 latency/visible-component handling. #252 and #257 published evaluation, acceptance, rehearsal and performance evidence. See [review index](docs/reviews/README.md).
- Worker concurrency is one; #256 resolves up to four foods within a meal, requests low reasoning effort, starts identify at its full 8192-token ceiling, loads each original once and uploads selected masks only. The minute wake remains enabled. No new twenty-post run was performed after that speed change. The edb56d42 twenty-post pass and its 607.12/1205.55-second median/maximum remain historical burst evidence, not current single-meal timings.
- Fresh before/after production observations on the #256 runtime reduced active breakfast/curry/busy-photo time from 43.706/49.456/115.739 to 16.497/19.539/25.188 seconds. All finished on attempt one with no error, and all five/three/nine foods had nutrition. Breakfast retained identical references and 272.8 kcal; curry retained references but different estimated portions gave 1229.5 kcal; busy photo retained the same nine references and 1323.4 kcal. Portions and generic proxies remain estimates, and owner acceptance for #189/#226/#230 is absent. [Complete timing and quality report](docs/production-performance.md).
- #67 remains OPEN in GitHub, but the old copied-provenance gap is now exercised in production: two reused items retained nutrition, source lineage and matching version, with two explicit reuse trace records. This did not pretend that network lookups ran. [Copied-path proof](https://github.com/aibraincoach/my-food-ai/issues/67#issuecomment-6547442271). The earlier admin browser/role-restoration and actual non-admin HTTP404 proofs remain valid historical evidence; they were not rerun by this docs merge.
- The ten-photo production evaluation is recorded. Its unchanged name scorer reports 12 found, 3 missed and 14 invented; those are not a hallucination count. Direct visual review found one confirmed incomplete item (photo05 omitted cheese), a separate original Caesar nutrition-reference failure and uncertain fine species/ingredients. Fresh follow-up repairs and their limits are in [docs/eval.md](docs/eval.md).
- Two historical functional demonstration sequences are recorded in [docs/demo.md](docs/demo.md). The shortest fully verified uncut screen rehearsal took 51.287 seconds, showing fresh analysis, SAM detail, both correction versions together, a genuine new question and Days. It used helper sign-in and gallery capture with a five-second introduction allowance; it has no audio and does not prove physical-camera or owner-phone timing. Rejected partial candidates are labelled. [Rehearsal evidence](docs/demo-rehearsal.md).
- The closed-issue audit is complete: #24/#106/#109/#13/#14/#15 and the actual Feed condition of #11 have supporting production evidence. Unfamiliar-user discovery (#107), installed-iPhone fit (#108), actual background push (#22) and the differently worded Home-frame claim under #11 remain unproven. [Audit](docs/closed-issue-acceptance.md). The backlog preserves those distinctions and retains GitHub-OPEN work even when implementation evidence exists; no issue is closed by this documentation update.
- Physical-phone installed-session persistence (#221), mobile-data first photo (#222), background push (#22), iPhone fit (#108) and actual camera remain unproven. Use the ordered [phone checklist](docs/phone-acceptance.md), not emulation, to close them. #212 still needs the nutrition-label path/phone proof; #214 already includes food water through nutrient1051. Designer #219/#220 await frames; #218 stays blocked.
- Migrations0019/0020 and authorized0021/0023/0024 were applied previously. Number0022 is permanently retired; the next unused number is0025. This order applies no migration, makes no application code change, creates no new PR and merges #235 only. The owner's current order supersedes the older #235 hold.
- The Wall's owner-supplied rows and PM contract changes remain intact. The PM states the plain problem and its effect; the coder owns implementation and sequence. Preserve all known work in one dispatch and do not send another while it is in flight. The complete superseded cutoff and its receipt links remain in [the historical snapshot](docs/history/2026-10-31-pm-snapshot.md).
- Runtime models remain Meta only; USDA FoodData Central is a database, not a model. There is no text-to-speech or third-party AI voice. The open-model experiment remains deferred, with missing Modal credentials in the earlier audit. No account identifiers or credential values are published. Code freeze is the end of Nov3; submission is Nov4 at21:00 EST (Nov5 at09:00 WIB). The final narrated submission video is still the owner's task.
