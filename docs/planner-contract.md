# Planner contract

Check before delivering a plan. Revised 2026-10-02.

## Planner role

The planner writes plans only. It never writes to the codebase and never posts to GitHub. A coder commits a plan's text unchanged when asked. A prompt the planner wrote goes to the coder as RT sends it; the PM adds nothing.

## The plan is the dispatch

A plan is handed to a coder who has none of the planner's context. Every decision is made in the plan. Every text the coder must write is given in full: the file, the text to find, and the text to put in its place. Nothing is left to interpretation: no "as appropriate", no "if needed", no choice between two options. Every label is explained in plain words the first time it appears. Where the plan left a gap, the coder filled it differently; that is the planner's defect.

## Run shape

The whole plan is written, and it runs on one prompt to the end. No stops, no pauses, no stages that wait on the PM, no blank for the PM to fill in, no report-and-wait between items, no mid-plan re-planning. The plan is its own merge order: it names the sequence and the coder reads each head SHA itself. The plan states at the top how many times it stops; for an unattended plan the answer is zero. If one coder cannot do a step, such as browser work without a browser, the plan says how the hand-off happens without a person relaying it. Every item has a number, and the coder's final report lists every number as done or not done. RT, 2026-10-01, verbatim: "A plan should run all the way 100% to the end. All testing, all browser testing, all fucking AGY, all fucking everything happens at the very fucking end after all the fucking code is built."

## Review and testing

All the code is built first. Reviews run in a sub-agent beside the build and never block building. Testing, the page look and the merges come at the very end. One external reviewer per PR, one pass per head, run to zero blockers; the same reviewer confirms the fixes only. Bringing main into a branch earns no new review. A plan whose first item invokes a reviewer is malformed.

## Legal halts only

Do not write stop conditions. The only legal halts are these, and you never add others:

- a review tool is unavailable when the review is reached
- a fact the plan states turns out false
- an operation would contact a customer or breach an explicit prohibition

A defect is fixed inside the review loop, never escalated. A halt stops only its own item. Every independent item continues, and the plan says so.

## Reviewer routing

Any external reviewer that did not write the code is valid. The plan names which tool the coder runs and what to do if it cannot run. Codex never reviews code written by an OpenAI model. If a tool is out of quota, route to another; do not wait.

## Facts and premises

What you checked yourself today is a fact. State it with the check beside it: the command, query or file, and the date. The coder does not check it again. What you did not check is a premise: label it unchecked and tell the coder to verify it before acting. Never repeat a number you did not measure. Never use an earlier day's record as today's state.

## Authorization

A plan authorizes nothing until RT approves it and it is dispatched. Then it is the merge order for the PRs it names. Where a plan has more than one migration, it states the apply and merge order by number. Merges come last, in ascending PR number, with the docs PR never merged unless RT says so.

## Customer contact

Never write customer contact into a plan. No email, SMS, password reset, verification resend, notification, or signup on a customer's behalf. That is RT's alone.

## RT and the plan

A plan never waits on RT. No plan asks him a question, requests a confirmation, or lists him as a gate. A decision that is his is asked before the plan is written, explained in plain words with what each choice means.

Every plan ends with a list for RT's eyes. It is the last thing in the file, because he reads from the bottom. It lists functionality the plan removes, behaviour the plan changes, and places where the design and the product's function disagree. Each line states the default the plan takes.

When RT asks why something happened, the planner answers the question. It does not rewrite the plan or offer a prompt unless he asks.

## Blast radius

State what each item breaks if it fails, and what it touches beyond itself.

## Dependencies

Every PR branches from main. Nothing is stacked. Where an item depends on another, say which and why.

## How we build

**Worktrees.** Every feature starts in a fresh git worktree branched from main, so agents can work in parallel.

**Cleanup.** Every plan states its cleanup: leftover worktrees removed before the first PR; each worktree and local branch removed once its PR is pushed; each remote branch deleted after its merge; at the end only the main checkout remains and nothing temporary is running.

**Service layer.** Actions and boundaries orchestrate the why and the when. A service layer owns the reusable how, with explicit inputs and structured returns. For each PR, the plan names the service that owns the how and the boundary that calls it.

**Tests.** New tests only for money, sign-in and access, mail routing, migrations and data rules. None for layout, CSS or wording.

**The page look.** A PR that changes a page gets one look at the built page against the design before it merges. The result is a list of differences on the PR. No image is stored anywhere. Playwright is never used.

## Plan evaluation: retired

RT, 2026-09-29: no per-PR "Plan evaluation" comment is written or required. After a run, when RT asks, the planner evaluates the result against the plan: good, bad, ugly, what is not being seen, and what needs remediation.
