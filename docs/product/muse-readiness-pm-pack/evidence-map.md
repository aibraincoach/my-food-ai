# Evidence, source boundaries and validation record

## Source
S1 — [The AI Corner article](https://www.the-ai-corner.com/p/meta-muse-alexandr-wang-interview), Ruben Dominguez, Nov 10, 2026. Entire publicly returned article body preserved, including all ten lessons, scorecard example/prompt, FAQ, and related links. Raw public HTML retained in the Obsidian source capture. The primary interview link is [S6l3aRsecuE](https://www.youtube.com/watch?v=S6l3aRsecuE); not independently verified in this work. Sections 1/3 underpin reliability and gates; 5/6 output-sharing; 7 trust ladder; 4/10 ownership; 9 separate exploration from operations.

**Do not conflate** the author's example booking/money thresholds with Wang's actual internal thresholds. The article asserts 100+ behavior rows; it does not publish the actual rows or demonstrate causal retention/viral effects. No independent fact-check of Meta launch dates, user counts, acquisitions, private anecdotes or linked claims was performed.

## Repository sources pinned to inspected main
- [README.md](https://github.com/aibraincoach/my-food-ai/blob/96ecdcf7897035b3019d14c7f0af38ce2510f890/README.md): purpose, non-goals, model roles, private history and traceability. A later report flags its unmatched-food statement as stale; do not resolve that conflict by guessing.
- [docs/eval.md](https://github.com/aibraincoach/my-food-ai/blob/96ecdcf7897035b3019d14c7f0af38ce2510f890/docs/eval.md): ten-photo baseline, mechanical scorer limits, missing cheese example, separate later repairs; no photo portion ground truth.
- [docs/eval-method.md](https://github.com/aibraincoach/my-food-ai/blob/96ecdcf7897035b3019d14c7f0af38ce2510f890/docs/eval-method.md): name-matching method and visual-annotation limits.
- [docs/phone-acceptance.md](https://github.com/aibraincoach/my-food-ai/blob/96ecdcf7897035b3019d14c7f0af38ce2510f890/docs/phone-acceptance.md): actual camera, barcode, background push, sessions, safe areas; historical unproven claims, not new observations.
- [docs/production-performance.md](https://github.com/aibraincoach/my-food-ai/blob/96ecdcf7897035b3019d14c7f0af38ce2510f890/docs/production-performance.md): dated quality/latency cohorts, queue vs active-time distinction, not current p95.
- [docs/run19-final-report.md](https://github.com/aibraincoach/my-food-ai/blob/96ecdcf7897035b3019d14c7f0af38ce2510f890/docs/run19-final-report.md): code-complete versus proof-incomplete distinction, #628 unresolved in that report, stale README #657.
- [BACKLOG.md](https://github.com/aibraincoach/my-food-ai/blob/96ecdcf7897035b3019d14c7f0af38ce2510f890/BACKLOG.md): preserve owner wording and open-work shape; no replacement backlog created.
- [AGENTS.md](https://github.com/aibraincoach/my-food-ai/blob/96ecdcf7897035b3019d14c7f0af38ce2510f890/AGENTS.md): long runs require both PM and owner confirmation; none started.
- [docs/pm-contract.md](https://github.com/aibraincoach/my-food-ai/blob/96ecdcf7897035b3019d14c7f0af38ce2510f890/docs/pm-contract.md): authorization, no customer contact, role separation; we are supplying artifacts to the PM, not taking the PM role.
- [REVIEW_POLICY.md](https://github.com/aibraincoach/my-food-ai/blob/96ecdcf7897035b3019d14c7f0af38ce2510f890/REVIEW_POLICY.md): Markdown-only docs PR needs no code review/CI gate under stated policy; no merges authorized.

## Fresh reads and limitations
Main tree SHA `96ecdcf7897035b3019d14c7f0af38ce2510f890` and recursive tree read complete/nontruncated. Selected docs read, not a full source-code or security audit. Issue states captured via GitHub API in `pm-intake.md`; no open PR at initial discovery. README/CLAUDE/BACKLOG can include historical states; live issue-state check is not a production test. No real user records or credentials included. No deployment or database inspected or modified. No customer signup/notification/outreach. No model eval executed; every scorecard result is UNRUN.

## Deliverable verification
Article body contains all ten numbered lessons and FAQ/ending reading sections. Scorecard has exactly 40 unique row IDs, explicit test inputs, measurements, denominators, proposed thresholds and UNRUN state. ZIP CRC and per-file SHA-256 manifest are checked during packaging. GitHub branch/PR and vault readback are verified separately from file creation. This validates the artifacts, not application readiness.
