# Fleet 12 external review attempts: PRs 502–505

The Fleet 12 dispatch overrides older routing rules: one PPLX runner attempt per head, then one AGY fallback if the model-proof line is absent. No Claude route, no Codex substitute review, and no end-of-run cleanup during other live lane work.

| PR | Exact head | PPLX attempt | AGY fallback |
| --- | --- | --- | --- |
| 502 | 7338ea3c2e4d0fe08ed9c5760f424a26d95e7533 | Batch with 503, exit 2; no input after 8.2 s, no model proof | Counting receipt: `mfa-agy-pr502-7338ea3.md`; completeness PASS, zero blockers |
| 503 | 60a2050291e938258b17e0e9dfd6b99dfa031512 | Batch with 502, exit 2; no input after 6.4 s, no model proof | Original head: completeness PASS, zero blockers (`mfa-agy-pr503-60a2050.md`); refreshed-head confirmation is separate |
| 504 | f1fe7cce895d894e305dce4e20bb7870ece29688 | Batch with 505, exit 2; no input after 9.2 s, no model proof | Original head: completeness PASS, one CSS finding (`mfa-agy-pr504-f1fe7cc.md`); coder triage identifies Tailwind normalization, confirmation held for actual geometry fix |
| 505 | bc1c4a8912231f545281cdf09a10e3e1dd75b1d6 | Batch with 504, exit 2; no input after 6.9 s, no model proof | Original head: completeness PASS, zero blockers (`mfa-agy-pr505-bc1c4a8.md`); refreshed-head confirmation is separate |

Every runner passed its memory guard. Live Firefox inspections showed: “You’re incognito”, “Ask anything…”, “Search”, “Computer”, “Model”, and “Sessions you create won't save to your history and expire after 24 hours”. The runner reported “No input found during live page inspections”; this is an automation/page-state failure. No inference about model availability or quotas was made. PPLX failure captures are retained beside this file and are not review receipts.

AGY uses `gemini-3.8-flash-high` with exact-head packets and the completeness validator. Its raw receipts are preserved without modifying reviewed lane heads. No migration or merge was performed by this review task.

Additional original-head attempts:

- PR506 `192e4e1d5d0533184427cabb72b242d380955cc9`: PPLX batch with507 exit2, no input8.8s, same inspected page text; no model-proof line. AGY fallback started once.
- PR507 `3264bc60a755b5c4122a88ff222c1f129951c171`: PPLX batch with506 exit2, no input6.5s, same inspected page text; no model-proof line. AGY fallback started once.

PR502 receipt applies to its original reviewed head; later main refreshes require applicable exact-head confirmation before merging other code PRs.

Confirmed review results through the first main refresh:

- PR503 refreshed head `a5415aa4ea5570996603daeca8df75be2cb3d50f`: AGY completeness PASS (4 paths/4 parts), zero blockers, receipt `mfa-agy-pr503-a5415aa.md`.
- PR505 refreshed head `be66808ee7f72b372c25b10ce6c1ddd782f2bdbf`: AGY completeness PASS (1 path/1 part), zero blockers, receipt `mfa-agy-pr505-be66808.md`.
- PR506 original head `192e4e1d5d0533184427cabb72b242d380955cc9`: AGY completeness PASS (5 paths/5 parts), two findings based on an older Next.js error-boundary API premise. Coder triage is documented in `mfa-agy-pr506-192e4e1-triage.md`; this triage is not a counting zero-blocker receipt. Confirmation requires supplemental observed pinned dependency evidence and the applicable current head.
- PR507 original head `3264bc60a755b5c4122a88ff222c1f129951c171`: AGY completeness PASS (2 paths/2 parts), zero blockers, receipt `mfa-agy-pr507-3264bc6.md`.

After PR503's main merge and required refresh:

- PR504 local geometry-fix head `836676d0e3dfb1e6f1377e79292f7492bfc95271`: AGY PASS 1/1, zero blockers with supplemental generated-CSS evidence. This head was superseded during the live review; preserved receipt `mfa-agy-pr504-836676d.md` is not authorization for a later head.
- PR505 refreshed head `a8c0fe78121e0f321d716871d64651c273d8df8e`: AGY PASS 1/1, zero blockers; receipt `mfa-agy-pr505-a8c0fe7.md`.
- PR506 refreshed head `31c70c48ab8c3963e0b9f05e6b6c05a3bc813ed9`: AGY PASS 5/5, zero blockers; receipt `mfa-agy-pr506-31c70c4.md`. The temporary confirmation runner appends instructions to read clearly labeled observed installed-dependency/browser evidence, preserving exact-head manifest, completeness validator, actual invocation and unchanged raw response. No repository runner changes or feature-head docs churn were introduced. The supplement is `run12-pr506-observed-dependency-evidence.md`.

New original-head batch PR526–530: initial preflight exited 6 because Vercel was pending, before claims/submission. Independent status reads then proved all five Vercel statuses SUCCESS; the actual runner batch exited 2, finding no input after 23.0, 19.7, 15.3, 11.4 and 7.9 seconds respectively. Firefox page text remained the incognito page described above; PR526 also showed “Type @ for connectors”. Captures lack model-proof lines and do not authorize merges. One AGY fallback per supplied head was started after passing memory guards.

Additional completed applicable-head confirmations (before any further main merge):

- PR504 `651cfc2942d1d9e2cdcb09b54d5f3844cc867442`: AGY PASS 1/1, zero blockers; `mfa-agy-pr504-651cfc2.md`. Supplemental generated-CSS evidence was labeled observed build evidence, not committed source. This reviews the actual geometry correction as well as the prior changes.
- PR507 `dd7b04c6fe49626dd7aa09d3bf17a33f5d940752`: AGY PASS 2/2, zero blockers; `mfa-agy-pr507-dd7b04c.md`.
- PR530 `1c1d6937ff01dcd918de87b94e492007cf3dbfff`: AGY PASS 1/1, zero blockers; `mfa-agy-pr530-1c1d693.md`.

PR531–534 actual PPLX batch ran after the PR504 main refresh and exited2 with no input (17.0/13.4/10.9/7.4s), same incognito page text, no model proof. One AGY fallback per current head was then launched after guards passed.

- PR531 fallback submission head: `6d70865e95cf540c4903be0b571c839716e32549`.
- PR532 fallback submission head: `846424aff899fcff71a98f5b024b97471fddeb61`.
- PR533 fallback submission head: `83ac318ba21df7fdf4c6e15aca27398483ba372f`.
- PR534 fallback submission head: `ee598fe8f94b9553fca38ff3001efeaf08ff0e92`.

PR526 original `47e59ab4d40d3a7f7295f10497b7e4ce8ab2b75c`: AGY completeness PASS13/13 paths/parts, zero blockers, receipt `mfa-agy-pr526-47e59ab.md`. This head was superseded by the required PR504 main refresh.

Later completions before the PR505 main refresh:

- PR505 `f2b0f35becac7cfeb296f58b3fd0fde118b6324a`: AGY PASS1/1, zero blockers; receipt `mfa-agy-pr505-f2b0f35.md`.
- PR528 original `8e922b51c085641860bc1ec42572a6491601c25d`: AGY PASS2/2, one real owner-isolation finding. Coder triage `mfa-agy-pr528-8e922b5-triage.md` records unguarded SSR-seed reuse after client owner changes. Awaiting code correction and same-reviewer confirmation.
- PR529 original `b474215749d8b0d203bb9e9585274b8d26c83f6f`: AGY PASS1/1, one real expiry-cache finding. Coder triage `mfa-agy-pr529-b474215-triage.md` includes an executable reproduction returning an expired slide after time advances. Awaiting code correction and same-reviewer confirmation.
- PR531 `6d70865e95cf540c4903be0b571c839716e32549`: AGY PASS2/2, zero blockers; receipt `mfa-agy-pr531-6d70865.md`.
- PR532 `846424aff899fcff71a98f5b024b97471fddeb61`: AGY PASS1/1, zero blockers; receipt `mfa-agy-pr532-846424a.md`.

PR533 `83ac318ba21df7fdf4c6e15aca27398483ba372f`: AGY PASS3/3, zero blockers (`mfa-agy-pr533-83ac318.md`). PR534 `ee598fe8f94b9553fca38ff3001efeaf08ff0e92`: AGY PASS1/1, zero blockers (`mfa-agy-pr534-ee598fe.md`). Both heads were superseded by the PR505 main refresh while reviews completed.

PR506 after PR505 main refresh, head `e5bbc4730d85de019dff115019191937e91ea96d`: AGY PASS5/5, zero blockers; receipt `mfa-agy-pr506-e5bbc47.md`, using the same labeled installed-dependency/browser supplement. GitHub head verified unchanged before posting receipt.

PR535–539 initial PPLX batch after506 refresh exited2: no input after16.1/14.1/11.0/9.3/7.1s, same incognito page text; some pages also showed “Type @ for connectors”. Captures lack modelproof. One AGY fallback per supplied head started after memory guards passed.

PR535 original `06cd9203aec839a991d3602377d3c13f51e2a9ce`: AGY PASS1/1, zero blockers; receipt `mfa-agy-pr535-06cd920.md`. GitHub head unchanged on completion.

PR536 original `c4a471c32dbd14e279c36d7a54ac1d97995ce5f2`: AGY PASS1/1, zero blockers; receipt `mfa-agy-pr536-c4a471c.md`. PR537 original `03ca5a9ca3845b7efc91eaf1b0b847df727607df`: AGY PASS1/1 with a finding about the target guard never resetting. Coder triage `mfa-agy-pr537-03ca5a9-triage.md` identifies the target-reference comparison and the sole parent's fresh object per opening. Same-reviewer confirmation must include exact-head `src/components/SavedMealListeners.tsx` context; no zero-blocker receipt is claimed from coder triage.

PR507 after506 refresh, exact head `f189b536649ac075f72731e382c8c15ea7a6ea2b`: AGY PASS2/2, zero blockers (`mfa-agy-pr507-f189b53.md`). PR538 original `7b8058238323bbbb8bd06905059bc09d157b3175`: AGY PASS15/15, zero blockers (`mfa-agy-pr538-7b80582.md`). PR539 original `6cf10f4612010c67c143cbb5459f30e59a80c8c1`: AGY PASS1/1, zero blockers (`mfa-agy-pr539-6cf10f4.md`), superseded while its original review completed.

PR540 initial head `3bed2f483c6d12906f5f687f3801759987cd3940`: PPLX exit2 no input5.8s, same incognito page, no modelproof; capture preserved. One AGY fallback started after guard passed.

PR526 after507 refresh, exact head `5ce73f8e0079abe39b4863677411c9c9a138e5a2`: AGY PASS13/13, zero blockers (`mfa-agy-pr526-5ce73f8.md`). PR540 original `3bed2f483c6d12906f5f687f3801759987cd3940`: AGY PASS2/2, zero blockers (`mfa-agy-pr540-3bed2f4.md`). PR541 initial PPLX preflight at `a40b18dbdf5986d4aede2b94be48e4a40dbe2c05` exited6 while Vercel pending, before submission; no fallback or gate bypass was attempted.

Correction confirmations on heads before PR526's main refresh:

- PR528 `1342a667ea84199b7835823bf3bf677fe9497e84`: AGY PASS5/5, zero blockers (`mfa-agy-pr528-1342a66.md`), confirming the owner-guard fix.
- PR529 `a3f94f97c39330b3617d19fda2394e9700dcdc54`: AGY PASS2/2, zero blockers (`mfa-agy-pr529-a3f94f9.md`), confirming cache-hit expiry filtering.
- PR537 `93e47b269b32fbbe62c59122cae9bcc886b2a753`: AGY PASS1/1, zero blockers (`mfa-agy-pr537-93e47b2.md`), with exact-head SavedMealListeners parent source supplied through the native runner's --context-path option.

PR541 original `a40b18dbdf5986d4aede2b94be48e4a40dbe2c05`: after independent Vercel SUCCESS evidence resolved the preflight gate, actual PPLX attempt exited2 (no input5.2s; same incognito page; no proof). During the attempt the required main refresh moved the PR head. One AGY fallback is reviewing the original submission head with exact-head middleware, verified-header, server client and feed-photo dependency context. A later applicable-head confirmation remains necessary.

Receipt preservation audit: `mfa-agy-pr502-7338ea3.md` matches the original GitHub receipt comment6622025324 byte-for-byte apart from trailing newline normalization (verified through GitHub API). Its SHA256 is `bde1cb310fb4b2fafbaa7f5ec52cb5f20295738a02ab0031a725af3b04553d3b`. The mutable main .git review-state path contains a later invocation; the preserved original receipt remains unchanged. The derived receipt index is scoped strictly to Fleet12 PRs and excludes pre-existing historical reviews.
