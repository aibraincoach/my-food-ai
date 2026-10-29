# Agent rules — My Food AI

Hackathon project (My Food AI → My Fitness AI after the event). PM contract: [docs/pm-contract.md](docs/pm-contract.md). Planner contract: [docs/planner-contract.md](docs/planner-contract.md). Backlog: [BACKLOG.md](BACKLOG.md). Review: [REVIEW_POLICY.md](REVIEW_POLICY.md), [docs/review.md](docs/review.md).

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

Reconcile documents, commit on the document branch, then `skills/pm-handover/scripts/pack.sh`. The handover text is the reply; zip output goes under `uploads/` (gitignored). Every prompt for any agent is delivered whole inside a single code block, with framing outside it.

## Session summary

_Updated 2026-10-29 00:08 UTC (2026-10-28 18:08 MDT), handover for the incoming PM; the successor PM was replaced the same day. Observed `origin/main` at `1014586` (PR #179 merge)._

- Merged since the last handover: #94 push (0012), #150 backlog label, #151 photo race, #152 eaten-at (0015), #154 Details control, #157 safe areas, #159 day marker, #160 job registry, #161 water and caffeine intake (0016), #165 barcode, #176 Wall entry 7, #178 load test record, #179 servings and units (0017). Closed: #24, #94, #106 to #112, #137, #170.
- Open: [PR #183](https://github.com/aibraincoach/my-food-ai/pull/183) Search foods (#171), head `e94644a`, Vercel passing; PPLX ran once on that head with only P2/P3 notes and no receipt comment yet; it carries migration 0018 (`create_food_post`), applied immediately before merge. [PR #1](https://github.com/aibraincoach/my-food-ai/pull/1) `docs/fleet-initial` stays open, never merged.
- Production load test (2026-10-28, `b025d13`): 7 ready, 2 failed, 11 still queued at 15 minutes because the worker's re-tick chain stopped; tracked as #177 (backlog). Details in `docs/load-test.md`.
- Order of work left (owner's order, issues exist for all): #171 (PR #183), saved meals and Log again (#172), desktop layout (#168), agent surface (#169), add photo (#173), delete post (#174), intake-only days (#175), then #177, #139, the eval and the frame comparison in `BACKLOG.md`.
- Tracked findings (label `tracked-finding`, not in `BACKLOG.md`): #145 to #149, #162 to #167, #180 to #182 and earlier waivers; real defects affecting use are labelled `backlog`.
- Tooling notes: PPLX runs through `tools/pplx-review.mjs` (model proof line `model_preference = gemini38flash`); the runner is flaky, retry with a fresh Firefox. Full suite: `ALLOW_SHARED_DB_TESTS=1 node --import tsx --env-file=.env.local --test --test-concurrency=1 tests/*.test.mjs tests/db/*.test.mjs` (224 pass on `feat-171`). After a merge that adds a dependency run `npm ci` in the main checkout (done for `@zxing/library`).
- Not verified on a device: the barcode scanner, the intake control, the servings stepper and the Search foods panel.
