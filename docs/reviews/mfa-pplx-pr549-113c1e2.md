Thread URL: https://www.perplexity.ai/search/576427d4-9e01-4c69-bc16-8e38d82ad7bc
Head at submission: 113c1e2bdbb60dd09acb6fc629df0aebfbf5d6fd
Model proof: model_preference = gemini38flash
Elapsed since Enter: 128.8s
Elapsed since tab open: 161.7s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/549

Answer
Links
Images
Share
10:49 PM

code review
 aibraincoach/my-food-ai#549

Finished
21s
Review verdict

Changes requested for PR #549, reviewed at commit 113c1e2. I found two correctness issues involving approximation provenance and summary persistence.

1. [P1] Approximation labels disappear when nutrition is reused

Locations: src/lib/worker/jobs/correct.ts:102–122; related reuse paths in src/lib/pipeline/persist.ts and src/lib/worker/jobs/recompute.ts.

replayCorrection() adds a label only when it performs a new food lookup:

ts
if (food?.approximation) {
  approximations.push({
    name: item.name,
    basis: food.approximation.basis,
    sourceRef: String(food.fdcId),
  });
}

The unchanged-item and retained-nutrition branches copy the nutrient values and source_ref, but not the approximation metadata. The generated correction summary therefore describes only approximations newly selected during that correction—not all approximations contributing to its totals.

Reproduction:

Analyze a meal containing macaroni resolved through the closest-record fallback.

Correct only its portion, or correct another item while keeping the macaroni unchanged.

The correction reuses the macaroni’s approximate nutrition but generates a new “Consumed” summary without its closest-record disclosure.

The same gap exists when analysis uses copiedNutrition, and when a later recompute retains an existing item’s nutrition. Saving labels in the current recompute job’s payload protects retries of that job, but does not preserve provenance across future jobs.

Suggested fix: Persist approximation kind and USDA record description alongside the nutrition source, propagate them through copy/rescale/reuse operations, and build disclosures from the final contributing items rather than only fresh lookups.

Regression tests:

Portion-only correction of an approximated item retains its disclosure.

Editing another food preserves disclosures for unchanged approximated foods.

Copying or recomputing retained nutrition preserves the same provenance.

2. [P1] Updating the summary before the persistence RPC breaks atomic replacement

Location: src/lib/pipeline/persist.ts:109–119.

The new code overwrites the existing model comment before invoking the RPC that replaces the analysis:

ts
await admin.from('post_comments')
  .update({ body: summary })
  .eq('id', previous.id);

// The analysis transaction happens afterward.
await admin.rpc(...);

If that RPC fails, the updated comment remains committed while the replacement items and nutrition do not. The meal can then contain a new summary—with new totals and a new USDA approximation disclosure—paired with its previous nutrition rows.

This directly breaks the function’s existing guarantee that a failed replacement leaves the previous analysis intact. Updating while the post is processing does not make these two database writes atomic.

Reproduction:

Re-analyze an existing meal and select an approximate record.

Allow the post_comments update to succeed.

Make the persistence RPC fail.

Verify that the original nutrition remains but its summary has changed.

Suggested fix: Move the existing-summary update inside the persistence RPC, under the same transaction and ownership/job checks as the item replacement. Commit the summary and nutrition together.

Regression test: Inject a persistence failure after resolution and verify that both the previous summary and previous nutrition remain unchanged.

Validation and scope

Reviewed the PR diff and the correction, portion-reuse, and analysis-persistence implementations.

I did not execute the application or test suite.

The PR description reports passing TypeScript, lint, 16 existing tests, and 17 paid smoke cases. Those are author-reported results, not tests independently verified in this review.

The check-runs endpoint returned one successful check, Vercel Preview Comments; it did not provide evidence of a completed full test suite.

No comments, reviews, or code changes were posted to GitHub.

Code review audit: architecture, security risks, and suggested refactors for GitHub pull request #549
Computer
Test coverage and edge-case audit for GitHub pull request #549 — find missing tests before merging
Computer
Show me the fix for issue 1
Explain the second correctness issue
Draft a comment for the PR author
⠦
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol
