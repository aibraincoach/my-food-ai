# Fleet 27 — a review route that survives site and model changes, silent maintenance, and the tidy-up (2026-11-17)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** A new plan from the owner's Engineering backlog (Doc rev 1983). It has three code PRs and one docs PR, one stop before the merges, and one production step after the PM's merge order. Fleet 26 is with the builder. This plan edits none of Fleet 26's files, and none of the files it edits is on a Fleet 26 branch.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix. A defect you find goes to the PM as one line for the backlog, and nothing more. A Find text that does not occur exactly once is skipped and reported, never rewritten.

**Stops: one**, before the merges (section 8). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void; the rest continues), and an operation that would contact a customer.

**Long waits.** Every wait in this plan is bounded and says its bound; none is longer than 10 minutes. Nothing in this plan is a long run under AGENTS.md.

**Nothing in this plan runs against production before the merge order.** Customer contact is forbidden.

## 1. The items

| # | Item | What changes | PR |
|---|---|---|---|
| 1 | #929 | The newer review runner comes to main. It no longer fails when the model picker shows only "Model", and it refuses an answer written by a different model from the one requested. A written finding lists every review route and every failure on record | 1, docs |
| 2 | #1001 | A maintenance re-analysis, re-match or restore sends no notification to the person's phone; a new meal still does | 2 |
| 3 | #1002 | Eight one-off scripts are deleted; fourteen are kept, each with its reason in `scripts/README.md` | 3 |
| 4 | #715 | The two failed-run captures from the closed docs branch are committed as failure receipts | docs |
| 5 | #698 | The planner contract stops calling a plan its own merge order | docs |
| 6 | #690 | The leftover Fleet 17 test post and its draft are deleted, and the Fleet 17 report says what the post was | section 9, docs |
| 7 | #659 | Each review finding on the Fleet 18 PRs that has not been checked is reproduced or dismissed on main | section 7 |
| 8 | #925 | A written finding on the readiness pack of draft PR #682 | section 7 |
| 9 | #937 | The not-found requests for an uploading meal's address are traced to the link that sends them | section 7 |
| 10 | #699 | A written comparison of this repository's review and merge practice with the owner's most recently active repositories | section 7 |
| 11 | #990 | The design of the revisit's later steps, and what waits on Fleet 26's #989 run | section 10 |

## 2. Facts the planner checked on 2026-11-17, and premises

Facts. Read on main `84a6c1b7358ec2f4e92b0e91f7376e8ec84ec152` and branch `docs/muse-readiness-pm-pack` at `a78a0ecb2dd89c5d13126f38144925e0c124a18a`; do not check them again.

- The planner applied every edit of this plan to an export of main and compared the result with the tested copy byte for byte.
- `tools/pplx-review.mjs` on main is blob `0c0b7bd0bed5edd512b1de9c3392b0b003bdc133`; on the branch it is blob `11379e8a7e89d3825a53a45e13cf69c6df2afabd`. The branch also changes `REVIEW_POLICY.md` (the Chrome model rule) and `skills/pplx-review/SKILL.md` (its description). PR 1 starts by taking those three files from the branch, then applies its edits.
- In Fleet 25, #993 and #994 exited 4 ("wrong model") because the picker's `aria-label` read "Model"; the request's `model_preference` and the answer's follow-up box both named Gemini 4 Hydrogen (`fleet25/reviews/summary.md` in the build state). In four 2026-11-03 receipts the request carried `gemini38flash` and the follow-up box named GPT-6.1 Sol; the runner then checked only the request (`docs/reviews/mfa-pplx-pr310-2d4142b-invalid-model.md` and three others).
- PR 1's new page script was run against stand-in picker buttons: `aria-label` "Gemini 3.8 Flash" gives that name; "Model" with visible text "Gemini 4 Hydrogen" gives "Gemini 4 Hydrogen"; "Model" with no name gives "generic"; no button gives "". `node --check tools/pplx-review.mjs` passes, and `tests/pplx-model-label.test.mjs` passes 4 of 4.
- `posts.active_job_id` is set by `claim_post_job` when a job is claimed (0027) and is not cleared when the meal becomes ready (`mark_post_ready`, 0007b). So when `sendPostPush` runs at the end of a job, the meal's active job is that job. Operator jobs carry `"operator"` in their payload (`scripts/numbers/11`, `12`, `13`).
- `tests/push-operator.test.mjs` passes. With the change, `tests/push-completion.test.mjs`, `push-lifecycle`, `push-payload` and `visible-question-push` pass. `tests/push-leave.test.mjs`'s test "authenticated logout cannot remove other devices or another account endpoint" fails when the six push files run together without the local stack, on main too. It passes alone, and in the full suite with the stack.
- GitHub, 2026-11-17: main has no branch protection and no rulesets, auto-merge is off, there is no workflow, and one collaborator account. `docs/coder-contract.md` "Merge control" and `docs/pm-contract.md` already state the merge rule. `docs/planner-contract.md` still says "The plan is its own merge order" (Planner role) and "Then it is the merge order for the PRs it names", under a 2026-10-27 coder note that calls those lines superseded.
- PR #682 (draft) is closed and unmerged at `6dcc1e48`. `docs/reviews/mfa-pplx-pr670-9c37722-close.md` and `docs/reviews/mfa-pplx-pr677-close.md` exist only on the branch. Both record failed runs: a GraphQL error posting the claim, and "head moved since it was read".
- None of the eight scripts PR 3 deletes is named by `src`, `scripts`, `tests`, `tools`, `skills`, `config` or `package.json`. With them removed, `npx tsc --noEmit` reports nothing.
- On the tested copy with all three code PRs and the docs edits applied (as one copy, so the per-PR runs in step 5 are still needed), with its own stack: `npx tsc --noEmit` reported nothing, and the application suite passed 722 of 728 with 6 skipped and 0 failures in 392 s (main skips the same 6). The build ended with `SecurityFatalError` after "Generating static pages (44/44)".

Premises. From reports, not checked by the planner.

- P1: Fleet 26 merges before Fleet 27, or in any order: the two share no file.
- P2: Fleet 26's section 9 production run has not started when PR 2 merges. If PR 2 merges first, the owner's phone gets no notification from that run.
- P3: The answer's follow-up box names the model that wrote the answer. On 2026-10-28 that box was seen naming GPT-6.1 Sol, or only "Model", on threads whose request proved Gemini. The 2026-11-03 ruling on #311 (now in `REVIEW_POLICY.md`, route 3) treats a box that names another model as an invalid attempt, and PR 1 applies that ruling to the runner. A box that names no model does not stop a run. If PR 1's check refuses a run whose request and picker agree, report the capture; the PM decides whether the check stays.

## 3. Not in this run, and why

| Item | Why it is left out |
|---|---|
| #999 | The live barcode loop runs only on the Barcode screen (`src/components/CaptureSheet.tsx`, the effect guarded by `mode !== "barcode"`); in Photo mode a barcode is read only from the photo after the shutter, with a 900 ms limit. So the code does not support the reader as the cause. The black picture needs a phone reading. What to record when it happens: whether "Camera unavailable" or a retry shows, and, through Safari's Web Inspector, the video element's `videoWidth` and the stream track's `readyState`. |
| #1000 | A new feature with no design. The rules for what a merged meal keeps (photos, caption, time, items, numbers, comments) are a design decision for the Designer before a plan. |
| #683 | The two bookmark defects need a code reading this fleet did not make. |
| #60 | Waits for the last feature, as the item says. |
| #687 | The submission is already sent; correcting it is done on the submission site, which this team cannot reach. |
| #212, #594, #579, #571 | Each needs a real phone. |
| #373, #375 | Each needs the billed byte counts from the Supabase usage page, which no command here reads. |
| #368, #279 | #279's CAPTCHA stays off by owner ruling until the app is public. #368's hammer through the production form could lock real people out, so it waits for that same switch. |
| #578 | Filing the 25 findings as items is the PM's work. |
| #684, #552, #553, #217 | Built. What remains is a look on production, which is GrokBot's work (#938 and the items' own lines). |
| #628 | Fleet 26's check K4 runs this script and will show whether anything is still wrong. |
| #689 | Needs the receipts' contents to reach the PM. Their links are on the PRs. |
| #694, #285, #617 | Wait on Fleet 26's #989 run. #617's narrow finding is in docs PR #994 (merged); the PM can judge whether that closes it. |
| Fleet 26's items (In flight) | Held by Fleet 26. |

## 4. How it runs

1. **Worktrees.** One fresh worktree per PR from `origin/main`. Before any test in a worktree: `npm ci`.
2. **Your own stack.** `TEST_PORT_BASE=60960 TEST_PG_PORT=55519 TEST_STACK_DIR=/tmp/mfa-f27/stack TEST_ENV_FILE=.env.test.fleet27`. Fleet 26's stack uses 60760: never stop or touch it, or any container not ending in `-60960`.
3. **Test command.** `PATH="$PWD/tests/bin:/usr/pgsql-17/bin:$PATH" TZ=UTC TEST_ENV_FILE=.env.test.fleet27 MFA_TEST_DISPOSABLE=1 npm test`. Bound: 10 minutes (`timeout 600`).
4. **Build.** As Fleet 26's plan says: the build can end with `SecurityFatalError` after "Generating static pages (44/44)"; a fresh `.next/BUILD_ID` means it built.
5. **Per PR:** apply the edits; `node --check` on each changed `.mjs`; `npx tsc --noEmit`; `npx eslint <changed files>`; the PR's named tests; the application suite once, on PR 3's worktree.
6. **Reviews.** PR 1 first. Review PR 1 with PR 1's own runner (the runner from PR 1's worktree): it is the review route's own test. Then review PR 2 and PR 3 with it. Each review on the final head, full 40-character SHA. If PR 1's runner fails, report its exit code and capture, review with main's runner, and report both. AGY when PPLX is unavailable. The docs PR needs no review.
7. **Checks and findings** (section 7).
8. **Docs PR**, branch `docs/fleet27` from `origin/main`: commit this plan unchanged as `docs/plan-fleet27.md`, plus the docs edits of section 6 and the findings of section 7 that are marked for the repository.
9. **Stop** (section 8).

## 5. The code PRs

### PR 1 — branch `fix27/review-runner` — #929

**Service:** the PPLX review route: `tools/pplx-review.mjs`, `REVIEW_POLICY.md`, `skills/pplx-review/SKILL.md`. Nothing a person using the app runs.
**First,** take the three files from the branch, in the PR's worktree:

```
git checkout a78a0ecb2dd89c5d13126f38144925e0c124a18a -- tools/pplx-review.mjs REVIEW_POLICY.md skills/pplx-review/SKILL.md
git hash-object tools/pplx-review.mjs
```

It must print `11379e8a7e89d3825a53a45e13cf69c6df2afabd`. Then apply the edits below to those files.
**What changes:** (1) the picker's model name is read from the button's `aria-label`, or from its visible text when the label is only "Model"; a picker that names no model is left as it is, and the model is taken from the request's `model_preference`; (2) the model named in the answer's follow-up box must agree with the request, or the run exits 4 and posts nothing; (3) one shared function, `sameModel`, makes both comparisons; (4) the policy's first route names no fixed model. Each receipt carries three model lines: the request, the picker, and the answer.

File `tools/pplx-review.mjs`.

Find:
```
 * Exit 0: success. Exit 2: timeout or error. Exit 3: DEVIATION (Searching the web). Exit 4: the request carried no model_preference or one disagreeing with the selected model. Exit 5: the model could not be selected. Exit 6: head has no successful Vercel status. Exit 7: memory guard refused. Exit 8: the PR already carries a fresh "Review in progress" claim or a receipt for this head (set PPLX_FORCE=1 to override).
```
Replace:
```
 * Exit 0: success. Exit 2: timeout or error. Exit 3: DEVIATION (Searching the web). Exit 4: the request carried no model_preference or one disagreeing with the selected model, or the answer's follow-up box names a different model. Exit 5: the model could not be selected. Exit 6: head has no successful Vercel status. Exit 7: memory guard refused. Exit 8: the PR already carries a fresh "Review in progress" claim or a receipt for this head (set PPLX_FORCE=1 to override).
```

Find:
```
  const modelLabel = () =>
    evalScript(tab.context, `((${MODEL_BUTTON}) || { getAttribute: () => '' }).getAttribute('aria-label')`);
  for (let wait = 0; wait < 8; wait++) {
    const label = await modelLabel();
    if (label && (!WANT || label === WANT)) break;
```
Replace:
```
  // The picker's name for the selected model: its aria-label, or, when that is only the generic
  // "Model" (seen 2026-11-16, #929), the first line of its visible text. "" = no button, "generic" = a
  // button that names no model. A site change that hides the name is not a reason to change the model.
  const modelLabel = () =>
    evalScript(tab.context, `(() => { const b = ${MODEL_BUTTON}; if (!b) return ''; const named = (s) => (s && !/^(model|models|choose a model|select a model|select model)$/i.test(s.trim())) ? s.trim() : ''; return named(b.getAttribute('aria-label') || '') || named(((b.innerText || '').trim().split('\\n')[0]) || '') || 'generic'; })()`);
  for (let wait = 0; wait < 8; wait++) {
    const label = await modelLabel();
    if (label && label !== "generic" && (!WANT || label === WANT)) break;
```

Find:
```
  let label = await modelLabel();
  if (WANT ? label !== WANT : !label) {
```
Replace:
```
  let label = await modelLabel();
  if (!WANT && label === "generic") {
    // The offered model is selected but unnamed on the page. pollAnswer takes its name from the
    // request's model_preference and records that it did.
    tab.modelLabel = "";
    tab.pickerGeneric = true;
    return { ok: true };
  }
  if (WANT ? label !== WANT : !label) {
```

Find:
```

async function pollAnswer(tab) {
```
Replace:
```

const normModel = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
// Exact normalized match, or containment with the shorter side at least 6 characters.
function sameModel(a, b) {
  const x = normModel(a), y = normModel(b), short = Math.min(x.length, y.length);
  return Boolean(x && y && (x === y || (short >= 6 && (x.includes(y) || y.includes(x)))));
}
// The model named after "Ask a follow-up" at the end of the page text, or "" when none is named.
function answerModelOf(text) {
  const lines = String(text || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const at = lines.lastIndexOf("Ask a follow-up");
  if (at < 0) return "";
  const last = lines.at(-1);
  if (lines.length - at > 6 || /^(model|search|computer|ask a follow-up)$/i.test(last)) return "";
  return last;
}

async function pollAnswer(tab) {
```

Find:
```
  const header = `Head at submission: ${tab.headAt}\nModel proof: model_preference = ${modelPref || "MISSING"}\nModel picker at submission: ${tab.modelLabel || "MISSING"}\nElapsed since Enter: ${elapsedSinceEnter}s\nElapsed since tab open: ${tab.sinceTabOpen()}s\nPrompt submitted: ${tab.prompt}`;
```
Replace:
```
  if (tab.pickerGeneric && modelPref) tab.modelLabel = modelPref;
  const pickerLine = tab.pickerGeneric ? `generic ("Model"); model taken from the request: ${modelPref || "MISSING"}` : (tab.modelLabel || "MISSING");
  const header = `Head at submission: ${tab.headAt}\nModel proof: model_preference = ${modelPref || "MISSING"}\nModel picker at submission: ${pickerLine}\nElapsed since Enter: ${elapsedSinceEnter}s\nElapsed since tab open: ${tab.sinceTabOpen()}s\nPrompt submitted: ${tab.prompt}`;
```

Find:
```
  // The request must carry a model_preference that agrees with the selected model
  // at submission: exact normalized match, or containment with the shorter side
  // at least 6 chars so short slugs cannot collide ("best" never matches "pplx_pro").
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const want = norm(tab.modelLabel || "");
  const got = norm(modelPref);
  const short = Math.min(got.length, want.length);
  if (!got || !want || !(got === want || (short >= 6 && (got.includes(want) || want.includes(got))))) {
    return { ok: false, code: 4, message: "WRONG MODEL", header, text };
  }
  return { ok: true, header, text };
```
Replace:
```
  // The request must carry a model_preference that agrees with the selected model at submission
  // (sameModel: short slugs cannot collide, so "best" never matches "pplx_pro").
  if (!sameModel(tab.modelLabel, modelPref)) {
    return { ok: false, code: 4, message: "WRONG MODEL", header, text };
  }
  // #929: the model that answered. The follow-up box under a finished answer names it on the last line of
  // the page text. On 2026-11-03 the request carried gemini38flash while this line read GPT-6.1 Sol, and
  // five such answers were posted as reviews. A named answer model must agree with the request.
  const answerModel = answerModelOf(text);
  const answerLine = `Answer model (follow-up box): ${answerModel || "not shown"}`;
  if (answerModel && !sameModel(answerModel, modelPref)) {
    return { ok: false, code: 4, message: "WRONG ANSWER MODEL", header: `${header}\n${answerLine}`, text };
  }
  return { ok: true, header: `${header}\n${answerLine}`, text };
```

File `REVIEW_POLICY.md`.

Find:
```
1. **PPLX**: Gemini 3.8 Flash on Perplexity via `tools/pplx-review.mjs` (`skills/pplx-review/SKILL.md`, `docs/pplx-review-procedure.md`). Submission is exactly `code review <PR URL>`.
```
Replace:
```
1. **PPLX**: the model Perplexity offers that day, recorded in each receipt from the request and the answer (#929), via `tools/pplx-review.mjs` (`skills/pplx-review/SKILL.md`, `docs/pplx-review-procedure.md`). Submission is exactly `code review <PR URL>`.
```

New file, given whole in section 6: `tests/pplx-model-label.test.mjs`.

**Tests:** `node --check tools/pplx-review.mjs`; `MFA_TEST_DISPOSABLE=1 node --test tests/pplx-model-label.test.mjs` (expected 4 of 4); and this PR's own review with this runner (step 6).

**Done when:** the test passes and PR 1's own review posts a receipt whose three model lines agree, or the run exits with a code and capture that section 8 reports.

### PR 2 — branch `fix27/operator-silent` — #1001

**Service:** `src/lib/push/send.ts`, the one function that sends a meal's notification.
**What changes:** before sending, it reads the meal's active job; a job whose payload carries `operator` (a re-analysis, re-match or restore from `scripts/numbers`) sends nothing, for a ready meal and for a question alike. A meal with no active job, or a job that cannot be read, notifies as before. No Fleet 26 file is touched: the check lives where the notification is sent.

File `src/lib/push/send.ts`.

Find:
```
    const { data: post, error } = await admin.from("posts").select("user_id,status,needs_input,question").eq("id", postId).maybeSingle();
    if (error || !post) return;
```
Replace:
```
    const { data: post, error } = await admin.from("posts").select("user_id,status,needs_input,question,active_job_id").eq("id", postId).maybeSingle();
    if (error || !post) return;
    // #1001: an operator re-analysis or re-match (scripts/numbers; its job payload carries "operator") is
    // maintenance on a meal the person already saw, so it never notifies. The job that publishes the meal is
    // still the meal's active job here; a job that cannot be read does not stop an ordinary notification.
    if (post.active_job_id) {
      const { data: job } = await admin.from("jobs").select("payload").eq("id", post.active_job_id).maybeSingle();
      const payload = (job as { payload?: unknown } | null)?.payload;
      if (payload && typeof payload === "object" && "operator" in payload) return;
    }
```

New file, given whole in section 6: `tests/push-operator.test.mjs`.

**Tests:** `tests/push-operator.test.mjs` and every `tests/push-*.test.mjs` and `tests/visible-question-push.test.mjs`, in the full suite with the stack (step 5: `push-leave` needs the stack).

**Done when:** those pass.

### PR 3 — branch `fix27/scripts` — #1002

**Service:** none; scripts nothing runs.
**What changes:** deletes eight one-off scripts (each a backfill, cleanup, probe or acceptance run for work that is finished) and adds `scripts/README.md`, which lists the fourteen hand-run scripts that stay, with the reason for each. It touches no file of Fleet 26's PR 8, which deletes nine others.

```
git rm scripts/backfill-cards.mjs scripts/backfill-item-drinks.ts scripts/backfill-media-sizes.mjs scripts/browser-session.mjs scripts/cleanup-368-accounts.mjs scripts/meta-check.mjs scripts/tick-cold-probe.mjs scripts/verify-desktop-round6.mjs
```

New file, given whole in section 6: `scripts/README.md`.

**Tests:** `npx tsc --noEmit`, `npx eslint`, the build, and the application suite (step 5).

**Done when:** the build and the suite pass with the eight scripts gone.


## 6. The docs PR's edits and the new files

### Docs PR edits

File `docs/planner-contract.md`.

Find:
```
Check before delivering a plan. Revised 2026-10-02. The rules that get an agent fired are in [pm-operational-rules.md](../pm-operational-rules.md); rule 31 names the planner. The incidents behind them are in the Wall of Stupid archive, [WALL_OF_STUPID.md](../WALL_OF_STUPID.md).

> Coder annotation 2026-10-27 (handoff, not the planner's words): the
> "plan is its own merge order" lines below (Run shape, Authorization)
> are superseded. Owner rule since 16:43 JST: the coder never merges
> without a merge order naming one PR and one head SHA, sent after the
> planner's evaluation and the reviewer's zero-blocker result on that
> head. Standing conditional orders do not authorize merges.

```
Replace:
```
Check before delivering a plan. Revised 2026-10-02. The rules that get an agent fired are in [pm-operational-rules.md](../pm-operational-rules.md); rule 31 names the planner. The incidents behind them are in the Wall of Stupid archive, [WALL_OF_STUPID.md](../WALL_OF_STUPID.md).

```

Find:
```
The whole plan is written, and it runs on one prompt to the end. No stops, no pauses, no stages that wait on the PM, no blank for the PM to fill in, no report-and-wait between items, no mid-plan re-planning. The plan is its own merge order: it names the sequence and the coder reads each head SHA itself. The plan states at the top how many times it stops; for an unattended plan the answer is zero. If one coder cannot do a step, such as browser work without a browser, the plan says how the hand-off happens without a person relaying it. Every item has a number, and the coder's final report lists every number as done or not done. RT, 2026-10-01, verbatim: "A plan should run all the way 100% to the end. All testing, all browser testing, all fucking AGY, all fucking everything happens at the very fucking end after all the fucking code is built."
```
Replace:
```
The whole plan is written, and it runs on one prompt to the end. No stops, no pauses, no stages that wait on the PM, no blank for the PM to fill in, no report-and-wait between items, no mid-plan re-planning. The plan names the merge sequence, but it is not a merge order: each pull request merges only on the PM's order naming that PR and its full head SHA, after the planner's evaluation and a zero-blocker review of that exact head (docs/coder-contract.md, "Merge control"; #698). The plan states at the top how many times it stops; for an unattended plan the answer is zero. If one coder cannot do a step, such as browser work without a browser, the plan says how the hand-off happens without a person relaying it. Every item has a number, and the coder's final report lists every number as done or not done. RT, 2026-10-01, verbatim: "A plan should run all the way 100% to the end. All testing, all browser testing, all fucking AGY, all fucking everything happens at the very fucking end after all the fucking code is built."
```

Find:
```
A plan authorizes nothing until RT approves it and it is dispatched. Then it is the merge order for the PRs it names. Where a plan has more than one migration, it states the apply and merge order by number. Merges come last, in ascending PR number, with the docs PR never merged unless RT says so.
```
Replace:
```
A plan authorizes nothing until RT approves it and it is dispatched, and even then it authorizes no merge. Where a plan has more than one migration, it states the apply and merge order by number. Merges come last, in ascending PR number, with the docs PR never merged unless RT says so.
```

File `docs/run17-report.md`.

Find:
```
- Two-step error formats on the dismiss route — #627. Question save not atomic — #626 (found in the #620 review).
```
Replace:
```
- Two-step error formats on the dismiss route — #627. Question save not atomic — #626 (found in the #620 review).

## Note added 2026-11-17 (#690)

A post captioned "Fleet 17 post-close 2" (id starting `d37b129e`) was created on test account 2 at 16:21 UTC, between the "retry" batch at 16:16 and the "v4" batch at 16:23. No receipt covers it, so it is not one of the nine readings above. Whether a fourth close-time batch ran cannot be shown either way. The post and its upload draft were deleted in Fleet 27.
```

**#715.** Bring the two captures from the branch, unchanged:

```
git show a78a0ecb2dd89c5d13126f38144925e0c124a18a:docs/reviews/mfa-pplx-pr670-9c37722-close.md > docs/reviews/mfa-pplx-pr670-9c37722-close.md
git show a78a0ecb2dd89c5d13126f38144925e0c124a18a:docs/reviews/mfa-pplx-pr677-close.md > docs/reviews/mfa-pplx-pr677-close.md
```

They are failure receipts, not reviews; the #929 finding below lists them. New files of the docs PR, given whole below: `docs/findings/review-route-2026-11-17.md`; and the files section 7 writes into the repository (`docs/findings/readiness-pack-2026-11-17.md`, and `docs/findings/fleet27-checks.md` with sections 7.1 and 7.2).


### `tests/pplx-model-label.test.mjs`

```
// #929: the review runner names the offered model even when the picker's aria-label is only "Model".
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../tools/pplx-review.mjs',import.meta.url),'utf8');
const MODEL_BUTTON=source.match(/const MODEL_BUTTON = `(.*)`;/)[1];
const line=source.split('\n').find(l=>l.includes('const b = ${MODEL_BUTTON}'));
// Build the page script exactly as the runner's template literal does.
const script=new Function('MODEL_BUTTON','return `'+line.match(/`(.*)`\);\s*$/)[1]+'`')(new Function('return `'+MODEL_BUTTON+'`')());
function label(buttons){
 for(const b of buttons)b.getAttribute=()=>b.aria;
 const document={querySelector:selector=>selector==='button[aria-label="Model"]'?buttons.find(b=>b.aria==='Model')??null:null,querySelectorAll:()=>buttons};
 return new Function('document','return '+script)(document);
}

test('the picker is named by its aria-label, or by its visible text when the aria-label is the generic "Model"',()=>{
 assert.equal(label([{aria:'Gemini 3.8 Flash',innerText:'Gemini 3.8 Flash'}]),'Gemini 3.8 Flash');
 assert.equal(label([{aria:'Model',innerText:'Gemini 4 Hydrogen\nFast'}]),'Gemini 4 Hydrogen');
});

test('a picker that names no model is "generic", and a missing picker is empty',()=>{
 assert.equal(label([{aria:'Model',innerText:'Model'}]),'generic');
 assert.equal(label([{aria:'Model',innerText:''}]),'generic');
 assert.equal(label([]),'');
});

test('a generic picker is not changed, and the request names the model in the receipt',()=>{
 assert.match(source,/if \(!WANT && label === "generic"\) \{\n[^]*?tab\.pickerGeneric = true;\n\s*return \{ ok: true \};/);
 assert.match(source,/if \(tab\.pickerGeneric && modelPref\) tab\.modelLabel = modelPref;/);
 assert.match(source,/model taken from the request: \$\{modelPref \|\| "MISSING"\}/);
});

// The runner is a command, so its two pure functions are read from its source rather than imported.
const pure=new Function(['normModel','sameModel','answerModelOf'].map(name=>source.match(new RegExp(`^(?:const ${name} = .*;|function ${name}\\([^]*?\\n\\})$`,'m'))[0]).join('\n')+'\nreturn {sameModel,answerModelOf};')();

test('the model in the answer\'s follow-up box must agree with the request',()=>{
 const page=model=>`Answer text\nLinks\n\nAsk a follow-up\nSearch\nComputer\n${model}\n`;
 assert.equal(pure.answerModelOf(page('GPT-6.1 Sol')),'GPT-6.1 Sol');
 assert.equal(pure.sameModel(pure.answerModelOf(page('GPT-6.1 Sol')),'gemini38flash'),false,'the 2026-11-03 answers are refused');
 assert.equal(pure.sameModel(pure.answerModelOf(page('Gemini 4 Hydrogen')),'gemini4hydrogen'),true);
 assert.equal(pure.answerModelOf(page('Model')),'','a generic box names no model');
 assert.equal(pure.answerModelOf('An answer with no follow-up box'),'');
 assert.equal(pure.sameModel('Best','pplx_pro'),false,'short names cannot collide');
});
```

### `tests/push-operator.test.mjs`

```
import assert from 'node:assert/strict';
import test from 'node:test';
import Module, {createRequire} from 'node:module';

// #1001: an operator re-analysis or re-match publishes the meal without a notification;
// an ordinary job's ready meal and question still notify.
test('an operator job never notifies, and an ordinary job still does', async () => {
  const originalLoad=Module._load;const delivered=[];
  Module._load=function(name,...args){
    if(name==='web-push')return{sendNotification:async(_subscription,payload)=>delivered.push(JSON.parse(payload))};
    return originalLoad.call(this,name,...args);
  };
  let sendPostPush;
  try{({sendPostPush}=createRequire(import.meta.url)('../src/lib/push/send.ts'));}finally{Module._load=originalLoad;}
  const names=['NEXT_PUBLIC_VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT'];
  const previous=names.map(name=>process.env[name]);
  for(const name of names)process.env[name]='fixture';
  let post,job;const jobReads=[];
  const admin={from(table){
    let id;
    const data=()=>table==='posts'?post:table==='jobs'?(jobReads.push(id),job):[{id:'subscription',endpoint:'https://fcm.googleapis.com/fixture',keys:{p256dh:'A'.repeat(87),auth:'A'.repeat(22)}}];
    const q={select(){return q;},eq(column,value){if(column==='id')id=value;return q;},maybeSingle(){return q;},then(resolve){return Promise.resolve({data:data(),error:null}).then(resolve);}};
    return q;
  }};
  try{
    for(const operator of ['reanalysis','rematch','restore']){
      post={user_id:'owner',status:'ready',active_job_id:`job-${operator}`};job={payload:{operator,post_ownership:true}};
      await sendPostPush(admin,'meal');
    }
    assert.equal(delivered.length,0,'no operator job notifies');
    assert.deepEqual(jobReads,['job-reanalysis','job-rematch','job-restore'],'the meal\'s own active job is the one read');
    post={user_id:'owner',status:'ready',question:{question:'Was this a beer?'},active_job_id:'job-question'};job={payload:{operator:'reanalysis'}};
    await sendPostPush(admin,'meal','Was this a beer?');
    assert.equal(delivered.length,0,'an operator job asks no question by notification either');
    post={user_id:'owner',status:'ready',active_job_id:'job-plain'};job={payload:{post_ownership:true}};
    await sendPostPush(admin,'meal');
    assert.deepEqual(delivered.map(d=>d.title),['Your meal is ready'],'an ordinary job still notifies');
    post={user_id:'owner',status:'ready',active_job_id:null};
    await sendPostPush(admin,'meal');
    post={user_id:'owner',status:'ready',active_job_id:'job-gone'};job=null;
    await sendPostPush(admin,'meal');
    assert.equal(delivered.length,3,'a meal with no active job, or a job that cannot be read, still notifies');
  }finally{names.forEach((name,index)=>{if(previous[index]===undefined)delete process.env[name];else process.env[name]=previous[index];});}
});
```

### `scripts/README.md`

```
# Scripts that nothing runs on its own

Most files in this folder are run by `package.json`, by a test or by another script. The ones below are run only by hand. Each one stays for the reason given (#1002). A one-off script that has done its job is deleted, not kept here.

| Script | What it is for | Why it stays |
|---|---|---|
| `auth-hammer.mjs` | Sends sign-ups and sign-ins as fast as a script can | `docs/auth-protection.md` uses it, and #279 is done only when a hammer is refused |
| `feed-probe.mjs` | Repeated read-only feed and Home reads on the test accounts | The only tool that measures how often the feed fails to open (#222) |
| `font-codepoints.mjs` | Lists the characters the font subset must keep | `docs/media-loading.md` describes how the subset was built with it |
| `open-weights-trial.mjs` | The paid comparison of the open model against Muse Spark | `docs/open-weights.md` gives the command to rerun it |
| `trace-rollout-smoke.mjs` | Checks the trace tables through local REST | `docs/open-weights.md` lists it among the trace checks |
| `create-test-user.mjs` | Creates test account 1 or 2 from `.env.local` | The only way to recreate the test accounts the checks sign in with |
| `make-tone.mjs` | Writes `scripts/fixtures/tone.wav`, the non-speech audio fixture | The only way to regenerate that committed fixture |
| `record-fixtures.mjs` | Records the scripted model answers in `tests/fake-meta/fixtures/` | The only way to refresh the fixtures the offline tests replay |
| `real-identify-smoke.mjs` | Paid check of identification on a licensed photo with the real models | A release check that the offline suite cannot make |
| `real-food-match-smoke.mjs` | Paid check of USDA matching with the real model | As above |
| `real-correction-smoke.mjs` | Paid check of the correction answer's shape | As above |
| `real-remainder-smoke.mjs` | Paid check of the leftovers step | As above |
| `real-same-meal-smoke.mjs` | Paid check of the earlier-meal reuse decision | As above |
| `real-vision-quality-smoke.mjs` | Paid check on the ten licensed photos | As above |

The paid checks call the real model with the key in `.env.local`. Run one only when a change touches the step it checks.
```

### `docs/findings/review-route-2026-11-17.md`

```
# The PPLX review route: how a review runs, and every way it has failed (#929)

Written 2026-11-17 for Fleet 27. The runner on main before Fleet 27 (`tools/pplx-review.mjs`, blob `0c0b7bd0`) required one fixed model, Gemini 3.8 Flash. The runner that wrote Fleet 24's and Fleet 25's receipts was a newer copy kept outside main (blob `11379e8a`, branch `docs/muse-readiness-pm-pack`), which takes the model Perplexity offers. Fleet 27 brings that copy to main and fixes the two failures below that it still had.

**Maintainer:** the build seat (`build.builder`). It runs the runner on every fleet and sees a failure first. A failure goes to the PM as one line, and the planner plans the fix.

## Ways a review is run today

| Route | What runs | Where it is written down |
|---|---|---|
| 1. PPLX headless runner | `scripts/pplx-firefox.sh` starts the signed-in Firefox; `tools/pplx-review.mjs` submits `code review <PR URL>` over WebDriver BiDi, waits for the answer and posts the receipt | `REVIEW_POLICY.md` "PPLX routes" 1, `skills/pplx-review/SKILL.md` |
| 2. PPLX cookie refresh | A visible Firefox on the same profile, for the owner to pass a Cloudflare check; then route 1 again | `REVIEW_POLICY.md` "PPLX routes" 2 |
| 3. PPLX in the owner's Chrome | The same submission through the Claude in Chrome tools, receipt posted by hand (Claude harness only) | `REVIEW_POLICY.md` "PPLX routes" 3 |
| 4. PPLX from the other server | Route 1 on the other OCI server | `REVIEW_POLICY.md` "PPLX routes" 4 |
| AGY | Antigravity CLI review, after every PPLX route has failed in one session | `skills/agy-review/SKILL.md` |
| Codex | Read-only `codex exec review` from a clean clone, when PPLX and AGY are unavailable and no OpenAI model wrote the head | `skills/codex-review/SKILL.md` |

## Failures on record

| When | PR, head | What happened | Cause | Step it broke | Fixed by |
|---|---|---|---|---|---|
| 2026-11-03 | #310 `2d4142b`; #311 `8f814f5` (twice); #312 `9e5877b` | The request asked for Gemini 3.8 Flash; the answer's follow-up box named GPT-6.1 Sol | Model change: Perplexity answered with another model | Model proof: the runner checked only the request, not the answer | Fleet 27: the answer's model must agree with the request, or the run exits 4 |
| 2026-11-03 | #311 `e7ece5c` | No input box found within 5.6 s | Page change or a lapsed sign-in | Submission | Not a runner fix: route 2 (cookie refresh) applies |
| 2026-11-05 | #670 `9c37722` | Posting the "Review in progress" claim failed with a GitHub GraphQL error | GitHub outage, not Perplexity | Claim | Not a runner fix: run again |
| 2026-11-05 | #677 | "Head moved since it was read" | The PR changed during the run; the capture's recorded head (`c4f468bc8e2f…`, 39 characters) is not a valid commit id | Head check | Working as designed: run again on the new head |
| 2026-11-16 | Fleet 24, #975 and #978 | Tab-open deadline in a five-tab batch | Load: five tabs at once | Opening the tab | Smaller batches (the next batch of three finished) |
| 2026-11-16 | Fleet 24, #976, #979, #980 | Early captures of answers still being written | The answer looked finished before it was; cause not proven | Waiting for the answer | Not fixed: the complete answers were read again from the same threads. Recorded as an open finding |
| 2026-11-16 | Fleet 24, #979 | Input failure before submission | Page state; cause not proven | Submission | Run again; it submitted on the next batch |
| 2026-11-16 | Fleet 25, #993 `0580522`, #994 `9eea9f5` | Exit 4 "wrong model" although the request and the answer both named Gemini 4 Hydrogen | Page change: the picker button's label read only "Model" | Reading the selected model before submission | Fleet 27: the runner reads the button's visible text, and a picker that names no model is left as it is, with the model taken from the request |

## What the runner now proves for each run

- **The request:** the `model_preference` Perplexity received (as before).
- **The picker:** the model's name from the button's label or its visible text, or "generic" with the model taken from the request.
- **The answer:** the model named in the follow-up box under the answer. It must agree with the request, or the run exits 4 and posts nothing.

Each receipt carries all three lines. No model name is fixed in the code. `PPLX_MODEL` still pins one when the owner names it.
```


## 7. Checks and findings

Read-only, on the local stack or GitHub. Nothing here touches production or a customer. Each result is written as what was seen.

### 7.1 #937 — which link asks for an uploading meal's address

On PR 3's build at 390 × 844, signed in as local test user 2, with the network slowed to "Regular 3G" (the browser and how it is driven: "The browser" in `docs/plan-fleet21.md`). Post a photo meal (`plate2.jpg`, caption `Fixture overlap 1`); while its card shows "Uploading photo…", post a second (`plate3.jpg`, `Fixture overlap 2`). Until both are ready or failed (bound: 5 minutes), record every request to `/posts/<id>` or with `_rsc=` whose answer is 404, with the time. At the first such answer, evaluate `JSON.stringify([...document.querySelectorAll('a[href^="/posts/"]')].map(a=>({href:a.getAttribute('href'),label:a.getAttribute('aria-label')||a.textContent.trim().slice(0,40),card:a.closest('[data-upload-id]')?.getAttribute('data-upload-id')??null,status:a.closest('[data-post-status]')?.getAttribute('data-post-status')??null})))`. **Record:** the count of 404 answers, the links on the page at the first one, and which card each belongs to. The fix is planned from this in the next fleet.

### 7.2 #659 — the unchecked Fleet 18 review findings

For each row, read the code on main named in the item (#659's text on the backlog), and write "reproduced" with the file and line, or "dismissed" with the proof. Do not fix anything.

| Finding | What to check on main |
|---|---|
| #647 viewer identity | Whether a post header can show the viewer's avatar or handle for another author's post. `src/components/PostHandle.tsx` `usePostAuthor` now returns the author's own row when `row.userId` is not the viewer; confirm with a post by test user 1 opened by test user 2 on the local build. |
| #647 avatar route | Which route serves an avatar, whose token it reads with, and its `Cache-Control` header (`grep -rn "avatar" src/app`). |
| #648 inventory hash | Whether `scripts/wording-inventory.mjs` still embeds a commit hash, and whether `node scripts/wording-inventory.mjs --check` passes on main. |
| #641 portion unit | Whether a portion unit "serving" can reach the database and be refused (`grep -rn "serving" src/lib supabase/migrations`). |
| #638 Feed discovery | Whether the feed's discovery poll restarts when the tab is shown again. |
| #639 question strip | Whether `NeedsInputStrip` finds a new question after an empty first poll, and whether `RealtimePost` refreshes on a return to the tab. |
| #637 Thread retry | Whether the thread's retry poll can stop for good. |
| #643 header text | Whether the post header's text is cut off at 390 wide (local build, a handle of 30 characters). |

**Record:** one line per row. Each reproduced finding goes to the PM for filing; the planner files nothing.

### 7.3 #925 — the readiness pack on PR #682

Read PR #682 on GitHub (author, branch, creation and closing dates, files) and the seven files under `docs/product/muse-readiness-pm-pack/` on branch `docs/muse-readiness-pm-pack`, with `git show a78a0ecb:<path>` (never check out that branch: it is the owner's preserved checkout). Compare each statement about the app, the backlog or a contract with `README.md`, `docs/eval.md` and `docs/pm-contract.md` on main. **Record, in `docs/findings/readiness-pack-2026-11-17.md`:** which PR holds which files (the seven pack files and the two #715 captures are on the same branch, in the same PR #682); every statement that disagrees with the code or a contract, with both texts; and that the pack never reached main. Ruling (PM, 2026-11-17): the pack stays on its branch as it is; nothing is changed or deleted.

### 7.4 #699 — the owner's other repositories

`gh repo list aibraincoach --limit 20 --json name,pushedAt,isPrivate` and take the three most recently pushed after this one. For each, read its contributor or agent rules (`AGENTS.md`, `CLAUDE.md`, `REVIEW_POLICY.md`, `CONTRIBUTING.md` or the like) and its branch protection (`gh api repos/aibraincoach/<name>/branches/<default>/protection`). Write, practice by practice: how a change is reviewed, who may merge and on what evidence, how proof that a change works is recorded, and what happens when a merge goes wrong, beside this repository's practice. **Write it outside the repository**, at `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/fleet27/process-comparison.md`, because it names private repositories. Each improvement worth making goes to the PM as one line.

## 8. The stop

Stop after the reviews and section 7. Report, in this order:
1. For each of the four PRs: number, branch, full 40-character head, the model that wrote it, each command of step 5 with exit code and counts, and the review receipt link. For PR 1's own review: the receipt's three model lines (request, picker, answer).
2. Items 1 to 11, each done or not done, with what was seen.
3. Every finding outside this plan's diffs, one line each, for the PM.
4. Cleanup: `npm run test:stack -- down` with this plan's variables; `podman ps` shows no container ending in `-60960`; `/tmp/mfa-f27` removed; `scripts/cleanup.sh` output.

Merge nothing. The PM's merge order names each PR and its head.

## 9. After the PM's merge order

Merge PR 2 first if Fleet 26's section 9 run has not started (premise P2), then PR 1, PR 3, and the docs PR last, each at the head the order names.

**#690, on production** (test account 2 only; bound: each command 30 seconds). Read first: `psql "$SUPABASE_DB_URL" -X -At -v e="$TEST_USER2_EMAIL" <<< "select left(p.id::text,8), p.caption, p.status, p.deleted_at is not null, (select count(*) from public.post_upload_drafts d where d.id=p.id) from public.posts p join auth.users u on u.id=p.user_id where u.email=:'e' and left(p.id::text,8)='d37b129e'"` (the address comes from `.env.local`; never print it; the query is given on standard input because `psql -c` does not fill in variables). Expected: one row, caption "Fleet 17 post-close 2". Then delete it as test account 2 through the app's own delete (`DELETE /api/posts/<id>` signed in with `scripts/lib/session.mjs`'s `signInAsTestUser(2)`), and delete its draft the same way, on standard input with `-v e=…`: `delete from public.post_upload_drafts where id = '<full id>' and user_id = (select id from auth.users where email = :'e')`. Read again: the post is deleted and no draft remains. **Undo:** the post's delete is a soft delete (`deleted_at`), cleared with an update of that one row; the draft row cannot be restored and holds no meal data. Then the docs PR's note in `docs/run17-report.md` is true; merge the docs PR.

## 10. #990: the design, and what waits on #989

#990's three parts start only after Fleet 26's #989 run has reported. Each is planned to exact steps then, from these choices:

1. **Meals that pass every rule.** 20 of the owner's ready meals that pass every rule of `14-rule-failures.sql` and were not touched by #989, chosen by `md5(id)` order, as the Fleet 25 study chose its control meals. For each, AGY reads the meal's photo (downloaded into a private directory outside the repository) with no app numbers in its prompt, and estimates the foods and total kcal. A meal is flagged when the app's kcal and AGY's differ by more than 35 % and more than 150 kcal. Flagged meals are re-matched with `reanalyse.mjs`, and re-analysed if still flagged. Cost: 20 AGY calls, plus about 6 model calls per re-matched meal.
2. **The other accounts.** A read-only count per account of ready meals and of meals failing a rule (`14-rule-failures.sql` per account). Test accounts are counted, never re-analysed. Whether real people's meals are re-analysed is the PM's decision, from that count.
3. **Saved meals.** After Fleet 26's migration 0065, a saved copy follows each operator run on its meal. The rest are listed: saved meals whose meal is deleted or missing, and saved meals of meals re-analysed before 0065 was applied.

**What waits on #989's result:** how many meals still fail after a re-match, which sets whether part 1 starts with a re-match or a re-analysis; the model calls and tokens per meal, which set part 1's budget; and the number of meals put back, which tells whether the 35 % threshold is too tight.

## 11. Blast radius, by PR

| PR | What it touches | What could go wrong, and how it would show |
|---|---|---|
| 1 | The review runner and its policy text | A review that ran correctly but whose follow-up box names a different model now exits 4 instead of posting. That is the intended refusal. A picker that names no model no longer stops a run. |
| 2 | `src/lib/push/send.ts` | One extra read of the meal's active job before each notification. A job that cannot be read does not stop an ordinary notification. |
| 3 | Eight unused scripts | A deleted script that something needed would fail the build or a test in step 5. |
| docs | Policy text and findings | The planner contract's two sentences change meaning: a plan no longer authorizes any merge. |

## 12. For RT

Each line states what this plan does. Nothing here waits on you.

1. **Code reviews.** The automatic code review no longer stops when the review site hides the model's name. It now refuses a review written by a different model than the one it asked for.
2. **Notifications.** When the team re-checks your stored meals, your phone gets no "meal ready" notification. New meals still notify you.
3. **Tidy-up.** Eight old one-off scripts are deleted, and the fourteen kept ones each say why they stay.
4. **The readiness pack.** In November an agent made a pack of seven documents about the Muse launch in a draft pull request, which is now closed and never reached the main code. The team writes down where the pack disagrees with the app. The PM ruled that the pack stays on its branch as it is.
