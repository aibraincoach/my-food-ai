---
name: pm-handover
description: Reconcile My Food AI documents with fresh GitHub evidence and current session decisions, then package tracked Markdown and the Wall of Stupid for an incoming PM. Use for PM replacement and handover exports, including local-only exports.
---

# PM handover

The deliverable is a reconciled repository memory and its verified zip, not a zip of stale notes. RT required reconciliation before packaging on the Naval Association Calgary project (October 16, 2026); this repo follows the same rule. The coder performs the reads and edits; the incoming PM receives the package.

## 1. Establish scope and publication mode

Read the user's current instructions and `CLAUDE.md`. Use the fleet's existing document branch/worktree and draft docs PR; do not put documents on code branches or merge the document PR for a handover. Check for existing edits before changing files and preserve other work.

Distinguish local reconciliation from publishing to GitHub. Honor an explicit local-only/no-push instruction. Otherwise use the session's existing authorization for document pushes; if none exists, complete and commit the local documents and package without pushing, and report that fact. A handover request does not authorize merges, deployments, database writes, review runs, PR comments, or customer contact. Do not alter product code just to make a handover statement true.

## 2. Gather current evidence before writing

- Record the observation time in UTC and America/Edmonton, then `git fetch origin` and read `origin/main`'s SHA. Do not confuse the local checkout or the document branch with main.
- Read GitHub's open PRs and the merged/closed PRs since the preceding handover. For each relevant PR record number, title, branch, exact head, state, draft status, mergeability, and merge SHA/time when applicable. Use fresh `gh pr view` output.
- Read checks once per relevant head, without waiting or polling. Label pending/failed/missing checks accurately. A successful build is not proof of a production deployment.
- Read review captures and triage on the exact heads. Distinguish valid reviews from failed attempts and superseded heads.
- Read the coder's reports, current user decisions, outstanding prompts and supplied Wall of Stupid entries. Session decisions absent from GitHub still belong in the handover, attributed to their source.
- Read relevant code at the reported revisions when a document describes behavior. Keep merged code, open-branch implementation, runtime observations and proposed policy distinct.

## 3. Reconcile the repository documents

Inventory all tracked Markdown (`git ls-files -- '*.md'`). Review every current document for statements affected by the evidence, and update all affected files, not just the handover summary. At minimum inspect `CLAUDE.md`, `README.md`, `BACKLOG.md`, the PM/planner contracts, `docs/review.md`, `REVIEW_POLICY.md`, and `WALL_OF_STUPID.md`. List reviewed documents and any unresolved evidence gaps in the handover.

- Put current PR/head/build/review/deployment facts, dependencies, outstanding prompts and next actions in the handover reply, with observation dates and source references; the handover is never a tracked file.
- Preserve backlog item numbers, user wording, and the three-part item format in `BACKLOG.md`. Update what remains to be solved; do not dump PR tables or build logs into backlog items.
- Update behavior and setup documents where evidence changed them. Label descriptions of open-branch features and unmerged policy as pending.
- Update the Wall of Stupid while doing the work. Insert supplied entries at the top of the table in `WALL_OF_STUPID.md` (newest first), preserving their text verbatim. Supplied entries already recorded are not duplicated.
- If a new report or user correction arrives before packaging, reconcile its affected documents before the final commit.

## 4. Commit, then package

Review the complete document diff, run the checks required by the user's instructions and repository, and commit with attribution on the document branch. In publish mode push that branch once for this batch; keep its PR open. In local-only mode leave the commit unpushed and name both local and remote SHAs in the handover report.

From the clean document checkout run:

```sh
skills/pm-handover/scripts/pack.sh
```

The script writes under `uploads/`: a zip of every tracked `*.md`, plus a separate Wall of Stupid file and separate copies of docs/pm-contract.md and docs/planner-contract.md when present, each with the same timestamp prefix. Do not zip the whole checkout. Exclude credentials, environment files, browser profiles, live exports, private captures and token-bearing links. Package the reconciled document commit even when the product checkout is older; state that the documentation branch is unmerged and name the observed main SHA.

Verify ZIP CRC, the exact tracked-Markdown entry set, and every entry's SHA-256 against the packaged commit. Verify the separate wall and contracts byte-for-byte against their zip entries. Provide a manifest outside the zip naming the source commit, observed main SHA, UTC/MDT times, archive hash and per-file hashes.

Report the document commit and publication status, observation cutoff and unresolved gaps, zip, separate-wall and separate-contract paths, verification result, and important pending work for the new PM.
