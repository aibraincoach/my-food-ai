Thread URL: https://www.perplexity.ai/search/f408bdc2-f72b-41e3-8100-ab26eac682c5
Head at submission: 7756cc31f287886e66cef3fd13082e30d78f5918
Model proof: model_preference = gemini38flash
Elapsed since Enter: 125.1s
Elapsed since tab open: 144.2s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/546

Answer
Links
Images
Share
10:48 PM

code review 
 aibraincoach/my-food-ai#546

Finished
30s
Review verdict

Approve with a non-blocking test-coverage recommendation. I found no clear correctness regression in PR #546’s three-file diff at commit 7756cc3.

The change addresses the intended failure mode: Open Food Facts HTTP errors other than 404 now reject rather than returning null, and the resolver propagates those errors unless a personal label correction can supply nutrition independently.

Main review comment: test the resolver’s error handling

Location: src/lib/fdc/barcode-resolver.ts:21

The new tests cover the provider adapter’s 500, 429, and 404 behavior, but not the resolver’s newly changed catch branch. That branch determines whether an outage reaches the caller or is suppressed in favor of saved label data.

I recommend adding resolver-level tests for these cases:

Scenario	Expected result
FDC returns no product; OFF rejects; no personal correction	Resolver rejects
FDC returns no product; OFF rejects; name-only correction exists	Resolver rejects
FDC returns no product; OFF rejects; complete label correction exists	Returns the personal product
Both providers return no product; no usable correction	Returns null

These tests would protect the distinction this PR introduces: “temporarily unavailable” versus “no usable product found.”

Implementation assessment

open-food-facts.ts:43–44: The explicit 404 handling remains ahead of the general HTTP-error check, preserving the missing-product path while making 429 and 5xx failures observable.

barcode-resolver.ts:21: The new exception handling follows the existing FDC policy rather than introducing a different fallback rule for OFF.

The scope is appropriately small: provider error classification, resolver propagation, and focused adapter tests.

One existing edge case is worth tracking separately: the exception-suppression condition checks source === "label" and per_100, whereas mergeProduct() also requires a name and serving unit to construct a product without a provider result. An incomplete saved label row could therefore suppress an outage and still produce null. The same mismatch already exists in the FDC branch, so I would not classify it as a new blocker introduced here.

Validation limits

This was a static review; I did not execute the tests. The PR description reports four passing OFF tests and a clean git diff --check. The check-run response showed only a successful “Vercel Preview Comments” check—not an automated test-suite result. The PR also explicitly leaves phone acceptance testing outstanding.

No review comments or approval were posted to GitHub.

Write a comment for this pull request
Show me the suggested test cases in code
Check the phone acceptance testing status
What about the Vercel preview comments
Review the changes file by file
⠸
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol