Head at submission: 9c04984bc4a5de80edb98f264b55795c0fe44178
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 24.4s
Elapsed since tab open: 28.1s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/648

Answer
Links
Images
Share
7:12 PM

code review 
 aibraincoach/my-food-ai#648

Finished
14s

PR #648 (Fleet 18 item 17: wording inventory and #294 review scaffold, already merged) cleanly scaffolds the wording audit for #294 without altering any application strings.

Overall Assessment

The implementation is well-scoped and readable: scripts/wording-inventory.mjs uses the TypeScript compiler API to extract JSX text, visible JSX attributes, and sentence-like literals, while docs/wording/review.md clearly separates ruled terms from the single pending item (Drank in this meal). However, there is one significant issue with how --check interacts with Git history, plus a few heuristic and maintenance edge cases.

Bugs and Risks

--check will fail on every subsequent commit: renderInventory embeds git rev-parse --short HEAD into the generated header of docs/wording/inventory.md (currently 7d2cbd37). Because HEAD changes as soon as this PR is committed or any new commit lands on main, node scripts/wording-inventory.mjs --check will fail due to the hash mismatch even when no source strings changed.

Duplicated BANNED list: BANNED in scripts/wording-inventory.mjs is manually mirrored from src/lib/pipeline/wording-check.ts. If the enforcement list changes, the inventory script will silently drift unless it imports or reads from a shared source.

Unsafe CLI flag parsing: args.includes("--root") ? args[args.indexOf("--root") + 1] : process.cwd() (and the same pattern for --out) will pass undefined to resolve() and throw if a flag is provided without a value.

Heuristic and Coverage Gaps

Single-word dynamic jsx-attr values are dropped: In collectInventory, jsx-attr:* only handles static StringLiterals and JsxExpressions containing a single StringLiteral. Ternary or conditional attributes (e.g., aria-label={open ? "Close" : "Open"}) fall through to the general StringLiteral branch, where single words without spaces or punctuation are rejected by isCandidate.

Characters excluded by isCandidate: Rejecting any string matching /[{}\\@<>]/ will drop non-JSX error messages or templates that contain @ (such as an email address or handle).

Test coverage: tests/wording-inventory.test.mjs verifies basic extraction and isCandidate filtering, but does not test bannedHits, renderInventory, template expressions (${…}), or --check mode.

Recommendations

Remove the HEAD commit hash from renderInventory (or exclude it from the --check comparison) so --check only fails when extracted strings actually change.

Share the BANNED array between src/lib/pipeline/wording-check.ts and scripts/wording-inventory.mjs (for example, via a small JSON or .mjs module) to prevent rule drift.

Add unit tests for bannedHits, template literal interpolation, and --check staleness detection.

How do I fix the git hash issue in the inventory script
Show me how to share the banned list between files
Refactor the CLI argument parsing for safety
Write unit tests for the wording inventory script
Explain the TypeScript compiler API usage here
Sources
⠴
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen