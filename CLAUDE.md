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

Reconcile documents, commit on the document branch, then `skills/pm-handover/scripts/pack.sh`. The handover text is the reply; zip output goes under `uploads/` (gitignored). Every prompt for any agent is delivered whole inside a single code block, with framing outside it.

## Session summary

_Observed 2026-10-31 01:52:50 UTC (2026-10-30 19:52:50 MDT). The owner fired the PM and requested a reconciled handover. These are observations and owner decisions, not a new execution order._

- Observed product main: `728fa23cdc75544d2b3b886abb9c1e6d4ff67e9c`; production serves that same commit, READY. Run 3 is merged and live, including #201, #205 and #206. Migrations 0019 and 0020 were applied; a fresh read confirmed the intake post/ml/label fields and photo-bearing create_food_post signature.
- GitHub has no open PRs at this cutoff. #194 was closed without merging its script change; docs-only #233 replaced its backlog index. #234 merged the three PM Wall rows dated 2026-10-31 09:45 MYT. #199, #207, #209, #231 and preservation #232 are merged. GitHub automatically marked #184 merged when #232 incorporated its branch history; its local branch was deleted.
- #205 final head ae1b2a4d062c5751ba8464a761fcb25b3a3359ae and #206 final head d7e5d9341a4a315d22a41c6dfaf92d08e1297331 each have same-head Gemini and owner-authorized Codex receipts reading BLOCKERS: NONE. Earlier findings and old-head receipts are historical; they are not outstanding merge holds.
- Oct 30 production checks passed for #185, #186, #187, #188, #191 and #106. #196 is closed on autonomous helper sign-in and posting evidence; #137 is closed on the three-photo check. No customer identity is needed for the next PM.
- The three test photo posts were rechecked after three hours: each had its photo media row, original and feed storage objects returning HTTP 200, and a decoded production feed photo at 390x844. Staged-pack cleanup does not cover ordinary capture uploads; claimed pack stages are protected by post_media references and the publish/cleanup lock.
- The admin trace browser check passed at 390x844 on the first configured test account after a temporary role change. Its original user role was immediately restored and independently verified. The designated owner account was not used. Non-admin database isolation passed; the page's HTTP 200/not-found defect remains #229.
- The trace-gap read found three meal items but one external FDC request. Eggs and bread used older cache entries; parsley caused the recorded request. Cache hits return before recordCall, and copied nutrition can bypass a lookup. No trace fix was authorized or made.
- #189 is reopened. The Oct 30 breakfast re-log failed: toast matched dried persimmons, salad matched a fast-food side salad and coffee had null nutrition. #230 records the concrete case; #226 covers matching and #225 preserves known totals when one item is unknown. Owner acceptance has not occurred.
- The owner-supplied sectioned backlog replaces the temporary flat index for this packet. It keeps the supplied issue numbers and order, corrects the three former #28 screen references to #3/#11/#6, and reconciles completed sign-in and trace observations. Completed checks retained in the supplied list are context, not fresh implementation instructions.
- Current PM correction, 2026-10-31 09:45 MYT: an order is only the problem in plain human language and why it matters. No numbered execution steps, extra scope, commands, branch names, sequences, constraints or done-condition scaffolding. The coder chooses how to fix it. Contract rules are not repeated in orders. One dispatch in flight still applies; it does not mean spoon-feeding small orders.
- Owner deadlines: code freeze at the end of Nov 3; submission Nov 4 at 9 PM Eastern; demo video under three minutes.
- Run 4 has not been executed by this handover. The previous owner request sent planning scope to the planner: food matching and known totals first, upload integrity, calculated summaries, trace status, worker drain at concurrency 1, time zones/caption editing, responsive thumbs/sign-out, session persistence and image loading. Designer #219/#220 need frames; #212/#214 need a read against shipped code before more build work. A planning request is not a live code or merge order.
- The open-model experiment is deferred until the owner's fleet work is done and is outside Run 4. No Modal or Fireworks credential was found locally or in production; the trial did not run and spent $0. MODEL_API_BASE_URL can change the shared endpoint, but model names are hardcoded and the ten-photo harness posts to APP_URL rather than selecting a model. Do not call a visual gram estimate a measurement.
- Runtime model calls are Meta only. USDA FoodData Central is a database, not an AI model. There is no text-to-speech implementation or third-party AI voice. The owner supplied the governing Oct 29 rules-bot ruling; the earlier allowance is superseded.
- Remaining evidence gaps: the full ten-photo production evaluation and two complete demo runs are not recorded; real-phone camera, installed-session and mobile-loading checks remain. The worker stall #177 is unresolved. #218 stays blocked. No new feature, migration, production write, review run or customer contact is authorized by this handover.

## Evidence links

- [Autonomous photo posting and readiness](https://github.com/aibraincoach/my-food-ai/issues/137#issuecomment-6522507311); [eaten-at check](https://github.com/aibraincoach/my-food-ai/issues/106#issuecomment-6522508021).
- [Post-three-hour photo recheck](https://github.com/aibraincoach/my-food-ai/pull/206#issuecomment-6527241469); [admin browser check and role restoration](https://github.com/aibraincoach/my-food-ai/issues/67#issuecomment-6527285363).
- [Breakfast result](https://github.com/aibraincoach/my-food-ai/issues/189#issuecomment-6522506987); [reopen #189](https://github.com/aibraincoach/my-food-ai/issues/189#issuecomment-6537239960); [close #196](https://github.com/aibraincoach/my-food-ai/issues/196#issuecomment-6537240249).
- #205: [Gemini receipt](https://github.com/aibraincoach/my-food-ai/pull/205#issuecomment-6521537794), [Codex receipt](https://github.com/aibraincoach/my-food-ai/pull/205#issuecomment-6521506078).
- #206: [Gemini receipt](https://github.com/aibraincoach/my-food-ai/pull/206#issuecomment-6521553743), [Codex receipt](https://github.com/aibraincoach/my-food-ai/pull/206#issuecomment-6521506368).
