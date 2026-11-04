Head reviewed: 8bff5d10d7267c1f88ea3d463c6cc386e8017bec
Thread: https://www.perplexity.ai/search/79cc2343-6a1e-42cb-b040-286569e26c1f
Original request preference: gemini38flash; final footer below. ChatGPT accepted by Fleet13 override.
Observed selected/footer model: UNCONFIRMED
Observation resumed without resubmission after runner deadline.

Answer
Links
Images
Share
10:53 PM

code review 
 aibraincoach/my-food-ai#547

Finished
24s
Review result

Approve — I found no blocking correctness or data-safety issues in PR #547 at commit 8bff5d10d7267c1f88ea3d463c6cc386e8017bec.

I reviewed all six changed files, the surrounding nutrient-selection implementation, and the current PR discussion. This was a static review; I did not independently execute the TypeScript tests or PostgreSQL migration.

What looks correct

Nutrient precedence is deterministic. nutrientValue() iterates the requested IDs in order, so [2000, 1063] selects 2000 whenever it exists, regardless of the order of USDA’s nutrient array. The new regression test deliberately puts 1063 first and confirms that 2000 still wins.

Portion scaling stays consistent. The fallback uses the existing conversion and portion-scaling path rather than introducing a separate calculation. The test verifies that 8.55 g per 100 g becomes 4.275 g for a 50 g portion.

Duplicate sugar rows are suppressed. Adding 1063 to macroIds prevents the fallback nutrient from also appearing as an additional micronutrient row.

The backfill is narrowly scoped. It requires null sugar_g, non-null calories, a non-null 1063 value explicitly marked as grams and portion-basis, and no 2000 record. It updates only sugar_g, leaving calories unchanged.

Rollback now handles the previously reported edit-history problem. The invalidation trigger deletes provenance on every subsequent nutrition update—including same-value updates and edits away and back. Consequently, equality with the original backfilled value alone cannot cause rollback to erase a later edit.

The database regression covers the important preservation boundaries: pre-existing sugar, pre-existing matching sugar, later changed sugar, same-value writes, edit-away-and-back, reapplication, and client access restrictions on the ledger.

Non-blocking observations
The rollback policy is intentionally conservative

Because the trigger fires on every item_nutrition update, changing an unrelated nutrition field also removes that row’s rollback provenance. A later rollback therefore preserves its backfilled sugar rather than restoring null.

That matches the migration’s explicit “any later write” policy and is safe against overwriting edits. It is worth retaining this behavior in operational documentation so rollback is not mistaken for a guaranteed reversal of every original backfill.

Automated validation is reported, not independently verified here

The PR description reports passing nutrition-scaling tests, nutrition-table tests, the transaction-isolated database regression, and TypeScript validation. The check-runs response I inspected exposed only a successful “Vercel Preview Comments” check—not test execution results.

Production migration application and readback are still pending according to the PR. I would retain that deployment gate: verify the affected-row count, confirm representative corrected sugar values, and confirm unchanged calories before closing the related issue.

No GitHub review or comments were posted.

Show me the exact curl or CLI checks to run
Draft the approval comment for the pull request
Summarize potential risks for the deployment phase
Show the backfill SQL query for verification
List any remaining edge cases to check manually
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol