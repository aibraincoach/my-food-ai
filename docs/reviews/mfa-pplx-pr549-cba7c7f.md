Thread URL: https://www.perplexity.ai/search/cabc2151-d0ee-450e-ac82-f6d7e7f9449b
Head at submission: cba7c7f8ee9edfe821e09df2b33d4ff2275e5bfc
Model proof: model_preference = gemini38flash
Elapsed since Enter: 64.2s
Elapsed since tab open: 75.3s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/549

Answer
Links
Images
Share
10:55 PM

code review 
 aibraincoach/my-food-ai#549

Finished
44s
Review result

Changes requested — I found one clear correctness issue in PR #549 at head 6d5800406b6ea2e184c7a17df882b5f1c0449d95: approximation disclosures can remain visible after the corresponding approximation has been removed.

Finding
P2 — Clear stale approximation summaries when the last approximated food disappears

Locations:

src/lib/worker/jobs/recompute.ts:60–70 — summary refresh runs only inside if (labels.length).

src/lib/pipeline/persist.ts:116–120 — re-analysis uses the summary-refreshing wrapper only when the new result contains approximations.

The new code updates the first model comment when approximations exist, but does not handle the reverse transition.

Reproduction through item editing:

Analyze a meal containing an approximated food.

The first model comment includes “Nutrition for … is taken from the closest USDA record …”.

Remove that food, or replace it with an explicitly selected USDA record so that no approximated foods remain.

The queued recompute reads the current items and obtains an empty labels array.

It skips the summary RPC and calls markReady.

The meal is now ready with current nutrition, but its first model comment still reports the old totals and names an approximation that no longer applies.

The same asymmetry exists in re-analysis: an approximation-free result takes the original persistence path. The PR’s migration explicitly notes that re-analysis retains its first model comment, so the approximation-specific wrapper does not clear a disclosure when a later analysis finds an exact match.

Suggested fix:

Refresh the authoritative summary for both transitions—into and out of approximation—under the same ownership, snapshot, and retry protections. In recompute, removing the labels.length gate and supplying an empty labels array would address that path, provided refreshing the first comment is the intended behavior for ordinary recomputes. Re-analysis likewise needs a summary-refresh path that is not selected solely by the new result’s approximation count.

Regression tests to add:

Approximate → exact after selecting a USDA record.

Remove the only approximated item while retaining an exact item.

Re-analyze an approximated meal into an exact-only result.

Verify that a failed summary write retries safely for these approximation-free results too.

Validation and scope

I inspected the complete diff, the matching and provenance code, analysis/correction/recompute handlers, and the underlying ownership and item-edit persistence functions. This was a static review; I did not execute the application or database tests.

The check-runs response showed one successful check, Vercel Preview Comments; it did not show a test-suite check. The PR description reports TypeScript, ESLint, existing tests, and paid smoke results, but those are author-reported rather than results I independently reproduced.

No review or comments were posted to GitHub.

Show me a code fix for this P2 finding
Draft a GitHub review comment for this PR
Check if there are any other edge cases in persist.ts
How should the migration handle existing stale comments
Verify the test coverage for this approximation flow
⠧
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol