# Coder contract

Rules for coders executing a fleet plan. Supplements [docs/planner-contract.md](planner-contract.md).

## Fleet scope

1. A fleet ends when its plan is done, and the coder says so plainly: **"I completed my plan."**
2. The coder starts **no new work** inside the fleet.
3. Every **new defect** — meaning anything not already in the backlog — is **reported to the owner in the message that finds it**, so it can be filed.
4. A **high-intelligence coder** investigates the defect properly.
5. The **fix runs afterwards, in a new fleet**.

These rules apply to defects found during production checks and any other work in the fleet, not only to defects listed in the plan.

## Final report

Every fleet ends with a report that:

- States plainly: **"I completed my plan."**
- Lists **every plan item number** as done or not done.
- Includes a mandatory section: **New defects found (not worked on)** — each new defect named there was reported to the owner when found; no fix was started in this fleet.

## Merge control (written rule, owner ruling Nov 14 2026)

Routes to main as observed on Nov 15 2026: the web merge button, `gh pr merge`, a direct push,
and the API. main has no branch protection and no rulesets. Auto-merge is off. There is no merge
queue and no workflow. Every agent acts as the owner's admin account, so GitHub refuses nothing.

The rule: a pull request merges only when the PM orders that one PR at its full head SHA, after
the planner's evaluation and a zero-blocker review of that exact head. A coder never merges on a
plan, a standing order, or its own judgement. The owner ruled that this stays a written rule.
