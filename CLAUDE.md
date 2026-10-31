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

_Observed 2026-10-29 07:28:17 UTC (2026-10-29 01:28:17 MDT). The owner replaced PM session 4 and requested a reconciled successor handover. This documentation branch is unmerged and is not the product revision. Current owner dispatches below override older plan/report assumptions._

- Product main is `cb78e8f30228b27e451fd5043b182c4154b87f06`: #200 shared tokens merged into main. #183 food search also merged since the preceding handover. #202 is marked merged, but its base was `run3/tokens`; merge `cff9af561ed7c1022d5e03751b5347c628b25830` is on that stack branch and is not an ancestor of main. Do not call the plus menu released on main or infer that child bases retargeted automatically.
- The latest five-PR merge dispatch was executed once. #200 merged; #197 was skipped when its required mergeStateStatus was UNKNOWN. #202 merged into its existing stack base. #203 and #204 were skipped when their required mergeStateStatus was UNKNOWN. The owner required skipping on any failed check: no retry, rebase or merge-main was performed. Later clean/mergeable observations do not retroactively execute those orders.
- #201 remains held because removing Home's water row before #205 would remove the production water-entry path. #205/#206 remain held for Codex findings; #199/#207 are held until after the code. Do not merge held PRs. Inspect actual bases before any future merge dispatch; #201/#204/#205/#206 still target run3/tokens.
- #203's current head is `1fddd03957222cd70c67e7b362839c4e08ee35de`. The owner removed the token-hash auth callback extension and unused magic-link generator/docs. The callback matches main; ordinary production sign-in worked, and cookie-only mode passed. Same-reviewer Gemini confirmation on that exact head reports BLOCKERS: NONE. The old d3335e3 receipt and older generated-link evidence are historical only.
- Gemini receipts remain on all current code heads, but Codex's additional receipts also stand: #205 has one P1 and two P2 findings; #206 has two P2 findings. A first reviewer's clean receipt does not waive a second reviewer's findings. Fixes have not been implemented. The outstanding fix dispatch requires evidence-backed Real/Not real triage on each finding's post, new commits for every real finding, then Gemini and Codex on each new head; no migration and no merge in that fix task.
- The #205 findings concern the isolated branch's intake trigger, linked drink times after eaten-at edits, and drink metadata after item edits. The #206 findings concern volume nutrition under servings recomputation and staged-media cleanup on failed saves. The trigger finding must be assessed with the sibling menu contract and actual merge/base state, not silently waived.
- Production admin authorization is public.profiles.role = admin, not ADMIN_EMAIL. The owner-designated account's role grant, existing profile/auth rows, confirmed email and prior sign-in were verified. Never put its address or handle in repository files, issues, PRs or comments. Account prerequisites for Run3 item9 exist; its trace/non-admin production proofs have not run.
- Migration0014/model_calls exists. Migrations0019 and0020 are not applied; confirmed by catalog queries, not by assuming rollback tests installed them. No migration was applied in the merge dispatch. They remain tied to their explicit migration/merge instructions.
- Run3 implementation/local evidence: production build and changed-source lint passed; targeted suite64 tests:62 passed,0 failed,2 explicitly skipped HTTP proofs awaiting0019/0020. Native Chromium390x844 checks passed; no Playwright or saved screenshots. Temporary UI fixtures were deleted. These observations are historical integrated-local evidence, not proof that all code is on main or production.
- The supplied Run3 plan is docs/plan.md verbatim from #199; docs/plan-run2.md preserves the earlier design transcription. The plan's automatic-retarget assumption and missing-admin/magic-link premises are superseded by the facts above. The pre-merge execution snapshot from #207 is archived with an explicit status warning; consult current receipts and fresh GitHub state before acting.
- Owner's prompt rule: one prompt per response, not one PR per prompt. A merge prompt may batch ready PRs, each with its exact SHA and checks, but must not mix a fix prompt or unrelated work into the merge prompt. PM owns technical dispatch choices; owner supplies product rulings and private account names. Before asserting where a setting belongs, get the runtime read path from the coder.
- #177 is open: a production20-post load run stalled with11 queued until manual tick. No fix is claimed. Production proof for the breakfast, three photos, trace access and eaten-at remains outstanding after the proper merge phase. No customer contact, verification resend, owner-post edits or unsolicited review run is authorized by a handover.
