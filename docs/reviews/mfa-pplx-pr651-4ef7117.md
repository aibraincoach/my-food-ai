Head at submission: 4ef71176147a40644ec571fd2d3d5daa9871ef21
Model proof: model_preference = gemini4hydrogen
Elapsed since Enter: 21.6s
Elapsed since tab open: 32.2s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/651

Answer
Links
Images
Share
10:27 AM

code review 
 aibraincoach/my-food-ai#651

Finished
12s

PR #651 (Fleet 19: run17-checks exit code and cleanup (#628)) updates scripts/run17-checks.mjs (+31/-15 lines) to ensure failed checks set a non-zero exit code, fix a bug where dismiss checks sampled the wrong post, and clean up the push_subscriptions test fixture after beer runs. The changes are solid and directly address silent false positives, though there are a couple of minor fragility points in the DOM/fetch instrumentation.

What Changed

Exit code enforcement: Sets process.exitCode = 1 when receipt.pass is false in both post-close and beer modes, matching the error handling in catch and cleanup blocks.

Dismiss sampling fix: snap(label, id = postId) now accepts a post ID, and the second beer post (dismissId) passes its ID to snap during both dismiss-wait-* and after-dismiss instead of accidentally reading the first post.

Targeted dismiss verification: Replaces the broken .find(... || true) selector with a filter matching the second post's exact question text, asserts rows.length === 1, intercepts window.fetch to confirm a DELETE /api/posts/${dismissId}/question returned 204, and verifies still?.status === 'ready'.

Push fixture cleanup: Extracts PUSH_FIXTURE, wraps the push_subscriptions upsert in checked(...), and deletes/verifies removal of the fixture row in the finally block for beer mode.

Potential Issues

Fragile DOM assumption in ownRow: Filtering with b.parentElement?.textContent?.includes(...) assumes the dismiss button's direct parent contains the question text. If the button is wrapped in another container element, this will return 0 matches and time out.

Duplicate question text collision: Both beer posts use plate3.jpg with 'a glass of beer'. If the first post's question row hasn't been removed from the DOM before the second post settles, and both generate the identical question string, rows.length === 1 will throw even when the feature works.

Unrestored window.fetch wrapper: window.fetch is monkey-patched to populate window.__dismissCalls and never restored to original. This is harmless at the end of the script today, but could cause subtle issues if additional browser steps are appended later.

Minor Observations

Indentation: Several added lines in scripts/run17-checks.mjs use 6-space indentation inside 1-space/2-space blocks, which stands out against the surrounding file formatting.

Pull request code review: run a static analysis audit on your GitHub branch for security flaws, style leaks, and test coverage
Computer
Suggest a cleaner way to write the ownRow filter
Show me how to fix the indentation in the script
Draft a review comment about the question text collision
How can I test these changes locally
Sources
⠦
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen