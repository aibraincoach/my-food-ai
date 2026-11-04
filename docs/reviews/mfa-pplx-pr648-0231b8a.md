Head at submission: 0231b8ad83794a5c8cd306537e85d11bb6504cbb
Model proof: model_preference = gemini38flash
Elapsed since Enter: 47.0s
Elapsed since tab open: 53.9s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/648

Answer
Links
Images
Share
11:04 AM

code review 
 aibraincoach/my-food-ai#648

Finished
23s
Review verdict

Request changes on PR #648, reviewed at head 0231b8ad. I found two correctness defects in the inventory generator: the freshness check changes with every commit, and interpolated template strings are silently excluded—including the wording this PR is intended to help review. The PR changes tooling and documentation, not application strings. [github_mcp_direct]

Findings
1. P1 — --check fails after committing an otherwise up-to-date inventory

Location: scripts/wording-inventory.mjs, renderInventory() and the exact-content comparison in main().

renderInventory() embeds the current git rev-parse --short HEAD in the generated Markdown, and --check compares that entire output byte-for-byte against the committed file. The committed inventory identifies 7d2cbd37, but the PR head is 0231b8ad. Consequently, checking this PR’s checkout reports the inventory as stale even if no source wording changed. [github_mcp_direct]

The failure cycle is:

Generate the inventory at commit A.

Commit the generated file, producing commit B.

Run --check: rendering now embeds B, while the file embeds A.

Regenerating and committing repeats the mismatch.

This makes the advertised freshness check unsuitable for a clean committed checkout or CI.

Recommended fix: remove HEAD from the compared output, or replace it with a deterministic fingerprint of the scanned source inputs. Add a regression test that generates and commits an inventory, then verifies --check succeeds; an unrelated commit should also leave the check passing.

2. P2 — The candidate filter rejects every interpolated template

Location: scripts/wording-inventory.mjs, the ts.isTemplateExpression(node) branch and the brace rejection in isCandidate().

The template extractor joins literal segments using "${…}":

js
const text = [
  node.head.text,
  ...node.templateSpans.map((s) => s.literal.text),
].join("${…}");

However, add() routes that result through isCandidate(), which rejects any text containing { or }:

js
if (/[{}\\@<>]/.test(text) /* ... */) return false;

Every interpolated template therefore fails the filter, despite template extraction being part of the stated scope. [github_mcp_direct]

This affects relevant, existing UI wording in src/lib/pipeline/card-data.ts, including:

ts
`Water in this meal: ${...} ml · Consumed today: ${...} ml`
`Drank in this meal: ${...}`
`Leftovers: ${...} · ${...} kcal`

The raw tracked-term scan still finds selected terms, but these complete candidate strings never enter the “All strings” inventory or its banned-phrase analysis. In particular, the pending Drank in this meal wording is only represented by the fallback substring scan—not by the advertised template extraction. [github_mcp_direct]

Recommended fix: use an interpolation marker without braces, or make filtering template-aware so generated placeholders are not mistaken for code. Add a fixture containing an interpolated, user-visible template and assert that it appears in the inventory. Include a template with a banned phrase to verify flagging works too.

Validation and scope

I inspected all four changed files and checked the existing card-data builder to confirm the template omission affects real wording. These findings are based on static inspection; I did not execute the build or tests. [github_mcp_direct]

The two added tests cover basic JSX/string extraction and token/URL filtering. They do not cover renderInventory(), commit-stable freshness checking, or interpolated templates. [github_mcp_direct]

GitHub returned one successful check, Vercel Preview Comments. The build, lint, and two passing tests are reported in the PR description, rather than independently verified by this review. [github_mcp_direct]

Leaving the owner’s wording decision and AGY review pending is explicitly documented as out of scope for this scaffold; I would not treat that alone as a code-review blocker. [github_mcp_direct]

No review comments or repository changes were posted.

GitHub PR review: security audit, performance bottlenecks, and bug check for pull request #648 in aibraincoach/my-food-ai
Computer
Refactor report: automated code review and architectural suggestions for pull request #648 in aibraincoach/my-food-ai
Computer
Show me the full text of finding 2
Draft a comment to post on this pull request
Suggest a code fix for the freshness check bug
⠦
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol