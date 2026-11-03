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

## Post–Run 7 reconciliation — November 3, 2026

Run 7 is merged through `58d127b999163bfb8212fa8145482ae875ed2276`; #310 closed unmerged as superseded by #311. The [current reconciliation](docs/post-run7-backlog-reconciliation.md) supersedes older pre-merge status below and in the Part 1 reports. The final execution receipt records production migrations and the successful Open-model smoke. Only #139 of the eleven queried Run 7 issues is closed; implementation and remaining acceptance are listed separately in that report. The twelve owner-ordered issues are closed; #325 remains open pending region/timeout evidence and clarification of its unsupported earlier close-list inclusion.

BACKLOG.md uses the owner's pasted 11:03 WIB snapshot, with closed #139 removed. The Claude artifact could not be read; no live-Doc fetch is claimed. Other open items retain the supplied wording until PM reconciliation and issue closure. No merge or deployment is authorized by this docs PR.

## Run 7 dispatch — November 3, 2026

The owner dispatched [Run 7](docs/plan-run7.md), with Part 1 building/reviewing the feature PRs and Part 2 held for the named-head merge order after evaluation. This is active coding, not a handover. The owner subsequently assigned Run 7 code reviews to Muse; coders do not launch PPLX, AGY or Codex reviews and instead fix findings delivered on GitHub or by the owner. Baseten authentication has been verified successfully (models, image chat completion and Responses all HTTP 200), and all eleven paired trial cases used the actual open model. The key remains in ignored .env.local as BASETEN_API_KEY and IDENTIFY_OPEN_API_KEY; no credential value is committed or published. Production schema, preference and environment changes remain held for Part 2. The local owner-supplied Wall entries, coder access rule and Nov3 07:10 WIB backlog are preserved on the Run 7 docs branch.

## Prior reconciliation — November 3, 2026

Observed 2026-11-03 00:15:07 UTC (2026-11-02T18:15:07.453950-06:00): fetched origin/main is `26242040e5b657e2fec20eb4af4efb682fc94a3c`; GitHub has no open pull requests. Run 6 #296–#301 and docs #295/#302 are all merged. The final merge was #302 at 2026-11-02 17:12:40 UTC. The [final execution receipt](https://github.com/aibraincoach/my-food-ai/pull/302#issuecomment-6583475674) reports this same production revision READY, alias assigned and health 200; production was not independently queried during this handover. Successful PR-head Vercel checks were read once; they do not establish current production health.

GitHub now shows #168/#169/#227/#274/#275/#292 closed; their completed entries and the entire stale status section have been removed from BACKLOG.md. The remaining three-part owner wording and item numbers are preserved. The live backlog Doc is not accessible in this coder checkout; this is a repository reconciliation of the supplied rev409 snapshot, not a claim to have fetched the PM’s later Doc edits. The open-issue index is refreshed separately.

The owner supplied three verbatim Wall entries dated Nov3 07:08, 07:11 and 07:13 WIB. PM-private files are not shared project truth. The PM has no GitHub or project-filesystem access; the coder and runner do. Agent instructions travel in prompts or the backlog Doc. The backlog contains open work only, without a status table or an “in flight” section. The PM sends no unsolicited order; a Wall prompt contains only its entry. A fourth owner-reported incident records that the PM sent its successor a coder-style prompt: a successor handover must be prose, not an execution order.

The Baseten key supplied by the owner is saved as `BASETEN_API_KEY` in ignored `.env.local`. Its value is excluded from Git and handover exports. Authentication, credit balance and the open-weights trial remain unverified. No paid trial, new dispatch, merge, deployment or database write is authorized by this handover. The existing requested trial scope remains #281 and the inert Facebook button; this handover does not establish that work has started.

Remaining acceptance includes physical-phone camera/pack, installed-session persistence, mobile-data timing, iPhone fit, background push, full Home comparison and owner meal-estimate acceptance. The intermittent feed error remains undiagnosed. Freeze is Nov3 23:59 WIB; preserve the recording-to-submission deployment hold. The owner rules every built feature into the video, including the not-eaten plate, and requests no PM script.

## Prior session observations — historical cutoffs

All dated sections below retain their original observations; their PR, issue and deployment states are superseded by the current state above.

## Historical state — November 1, 2026

Observed November 1, 2026, 15:19:11 UTC: main and production are `f095afe545a2be099ba6f2fca0b216d273db56e0`, READY, alias confirmed, health 200. #269 merged at the owner's exact head, then docs #266 merged last; #258 closed as superseded. The owner ordered the fleet closed and all subagents completed. [Final execution receipt](https://github.com/aibraincoach/my-food-ai/pull/266#issuecomment-6558350575).

Fix #269 (`c54525b1bd1c8985866f7fe840411be274822719`) merged as `4d83d3c44428930a1cf1e21cf3add76c9d39c386`. Production build and all 353 tests in 127 files passed, zero failures/skips; external Gemini exact-head review returned BLOCKERS: NONE. Owner-meal recheck showed 87/40 kcal, two unavailable noodle-roll meals, and 3 known kcal with the pastry explicitly unavailable. The separate 0.3-kcal espresso now displays <1; its stored card was regenerated without changing nutrition or original photos. The initial latest-meal zero screen remains unreproduced. [Owner report](docs/post-run5-owner-report.md).

The twenty-post speed check passed 20/20 on attempt one: median144.50 s, max307.47 s, all ready421.474 s from start; maximum job overlap one. Retain the 9/10 photo05 failure and uncorrelated reservation409; neither is proven fixed by the formatting change. Saved meals/Log again copy stored nutrition; fresh estimates can vary in portions and reference selection. Owner breakfast/curry acceptance remains outstanding.

Closed by the owner’s explicit closure order: #67, #172, #173, #185–#188, #191, #195, #213, #214, #219, #220. Reopened #11/#22; physical-phone #212 stays open. The latest supplied BACKLOG.md is the PM’s **Doc rev 358, Nov2 20:50 WIB snapshot**, committed with its wording and three-part format preserved, with issue numbers inserted for its five unfiled items (#303–#307). It is not replaced by the obsolete bullet-only scripts/backlog.mjs output. Live GitHub open-issue references are separately indexed in docs/open-issue-index.md; a backlog item is not automatically removed on implementation evidence alone.

New owner decisions in this session: every after-meal photograph should be markable as not eaten; the requested label is **“leftovers (not eaten)”**, replacing the old “Not eaten” ruling. These are backlog requests, not implemented behavior or an execution dispatch. A real half-eaten plate must be checked before this flow is included in the demo; the previous repeated-image fixture proves mechanics only. Preserve the standalone target-related “left” ban. The supplied zero-calorie item remains in the approved backlog; the subsequent #269 deployment/recheck evidence is in the owner report and needs PM reconciliation, not a claim that the original cause was established.

Earlier #267/#268 merges relied on an overbroad interpretation of “authority for the whole job”; no separate named merge order existed. Subsequent #269/#266 merges used explicit owner orders with full heads. Follow docs/planner-contract.md’s superseding named-PR/head rule; the older plan-as-authorization lines do not authorize merges. No current code dispatch or merge order remains outstanding. This PM handover only reconciles documents and packages them; its draft docs PR is not a merge/deployment order.

Remaining acceptance: physical camera/pack, installed sessions on two phones, mobile-data image timing, iPhone safe areas, background push, full Home-state comparison and owner meal estimates. Credits balance/end date and judging coverage are unverified; final narrated video/account choice remain the owner’s. Freeze: Nov3 23:59 WIB; no merge/deployment from recording start until submission. Public source contains fixture identifiers but private account mappings/session material are excluded from the handover. Wall row is already on main, original commit `fd4563ac87b68623117fbd931deea030beba2df1`.

## PM gap follow-up — November 2

The PM explicitly authorized the issue decisions and cleanup below while holding all merges. Closed after checking their own done conditions: #190 (published ten-photo production result table), #198/#210/#211 (delivered saved/label/hydration designer frames), #225 (known nutrition summed with the unknown food named). Closure comments carry immutable source/evidence links. This does not close #212 physical-phone capture or owner food-accuracy acceptance.

The Nov2 read-only run created eight second-account test posts, all now removed under the follow-up order, including the two reservation checks and both rehearsal attempts. Their32 storage objects and two detached cleanup jobs were removed; original five posts remain (four ready, one needs_input). Six of the deleted posts were ready with no unavailable food; two were needs_input with no items. The fresh feed has the original four cards and one old question strip. Archived proof remains in ignored uploads; deleted IDs are no longer live acceptance targets.

The verified current-interface rehearsal was60.420 s versus historical51.287 s. The largest growing interval was publication→ready:14.350→23.887 s (+9.537). The newer run uses another food, actual form sign-in and an extra Log again/Home step; this is not a controlled UI regression benchmark. The50.442 s candidate is retained but not accepted because its new-question visibility check was too broad.

The PM supplied a newer **Nov2 08:26 WIB** backlog after being asked for rev280; that exact supplied text now replaces21:57 in this docs branch (50 three-part items). No new revision number is inferred from its timestamp. It adds a temperature comparison and preserving remainder fields on an added-photo correction as pending work; this follow-up does not run the trial or implement either feature. Future sync requires the full approved snapshot or an accessible exact-revision export, not a timestamp/GitHub issue list alone.

Proposed changes to docs/pm-contract.md and the historical plan’s reference name are prepared only on this draft docs branch. Their text is not live on main until a PM order names the PR and exact head; no merge/deployment is authorized by this handover or gap report. Main/production remain f095afe545a2be099ba6f2fca0b216d273db56e0. One document branch is used; no product source changes or new PR are needed.

## Backlog update — November 2, 20:50 WIB (Doc rev 358)

The PM supplied the full Doc rev 358 snapshot, stamped Nov 2 20:50 WIB. It replaces the earlier 17:04 copy on docs PR #295, including its “In flight” section. The copy preserves the PM's wording and order; only five assigned issue numbers were added: #303 owner-only checks, #304 last-feed startup, #305 first-photo priority/cache, #306 immediate save feedback and #307 food names before nutrition. The unauthorized #294 “(see #277)” addition is removed, #174 uses “The Exemplar”, and #288 now names Baseten. Supplied numbered titles and two-paragraph bodies are synchronized to GitHub.

Under the explicit reconciliation order, #276/#277/#278 are closed as completed by merged PR #271; #284 is closed as not planned under the owner's removal order. #107/#108 were reopened to match their acceptance work still listed by the PM. The live [issue index](docs/open-issue-index.md) is regenerated separately. The snapshot's historical statements are not silently rewritten: for example #286 still mentions already-merged #270, and #168/#169 still say the PNG export is pending although the ZIP has since been supplied. The Baseten credential was privately recorded, but this reconciliation makes no authentication or trial-success claim and never publishes the credential.

[Run 6 copy audit](docs/run6-copy-audit.md) records the exact #296–#301 heads, the additional static claims-rule review and the runtime strings/states not exhaustively checked. Passing the existing two wording tests is not whole-UI coverage. #294 stays open for the planner's AGY terminology review and owner rulings. The six feature heads and #302 remain unchanged; no merge order, production migration or deployment is supplied here. Docs PR #295 remains unmerged.

## Work

Coders check their actual repository, GitHub and file-system access before claiming access is missing or stopping work. Use a local read and a read-only repository request to establish what is available; report the specific failure only if a check fails. The PM’s access restrictions apply to the PM role, not to coders. Do not assume the PM role or wait idle on an untested access assumption.

Branch from `origin/main`; never commit directly on `main`. One PR per change. Docs-only PRs (only `docs/`, `skills/`, and root `*.md` policy files) need no PPLX/AGY/Codex review.

Code PRs: PPLX first (`skills/pplx-review/SKILL.md`), AGY second, Codex third per `REVIEW_POLICY.md`. End coder runs with `scripts/cleanup.sh`.

Never commit secrets; use `.env.example` only. Prior Supabase wipe notes: [docs/database-before-wipe.md](docs/database-before-wipe.md).

## Run 5 record

The owner-supplied plan remains unchanged in [docs/plan.md](docs/plan.md); Run3 is archived in [docs/plan-run3.md](docs/plan-run3.md). #259–#265 and #267–#269 are merged; migrations0025–0027 are applied. Pre-merge reports and review captures retain their original cutoffs and are not current orders. No product code changes are authorized by this handover.

## PM handover

Reconcile documents, commit on the document branch, then `skills/pm-handover/scripts/pack.sh`. The handover text is the reply; zip output goes under `uploads/` (gitignored). Dispatch shape and technical ownership follow the current PM and planner contracts linked above.

## Historical session summary — superseded by Current state above

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

## Backlog update — November 2, 23:23 WIB (Doc rev 409)

The PM supplied Doc rev 409 and requested another backlog commit. BACKLOG.md preserves that supplied snapshot, including the unnumbered Facebook item, removal of #174/#293/#286, the expanded caption-free-can acceptance for #292, and the owner’s 23:21 WIB rulings. The planner’s requested scope is #281 (attempt Muse Spark Open through Baseten before the Nov3 23:59 WIB freeze, with a real switchable path and recorded model ID) and the visible, grayed-out, inert Facebook button on both authentication pages. The $5 trial cap, ten photos plus the half-rice caption, unchanged USDA lookup, and keeping SAM/transcription on the Meta API remain in the supplied item. The credential has already been recorded privately; authentication and trial success remain unproven.

Owner merge-policy ruling, supplied with this snapshot: “a head refreshed from main with no code change of its own merges without a new order,” and “a refresh with a code change needs a fresh review first.” The owner also ruled that #295 and #302 merge in any order, every built feature is included in the video (including the not-eaten plate), and the PM supplies no script. These rulings supersede conflicting older session rules; the backlog commit itself makes no feature implementation or production-trial claim.

The snapshot predates later evidence and is not silently rewritten: #299 is now merged/deployed as `9748c241f9a42871258339776222eabbc3702a52`; the caption-free can and live image-load-once proof passed ([#292 evidence](https://github.com/aibraincoach/my-food-ai/issues/292#issuecomment-6582329284), [#299 evidence](https://github.com/aibraincoach/my-food-ai/pull/299#issuecomment-6582329711)); Profile/token/activity and docs-on-main checks passed ([#169 evidence](https://github.com/aibraincoach/my-food-ai/issues/169#issuecomment-6582330301)). #174/#293 were explicitly ordered closed and are closed. #292/#212/#169 remain open under the PM’s last closure instruction. #301 has reviewed, green head `7affd872dd0eee32ceb66419b52739d0488164de` after incorporating #299 ([confirmation](https://github.com/aibraincoach/my-food-ai/pull/301#issuecomment-6582235368)); this backlog update does not merge it. The feed-error digest remains undiagnosed.
