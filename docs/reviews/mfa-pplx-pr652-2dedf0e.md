Head at submission: 2dedf0e5ef2abeb325c80a80681816ec41b6bbc9
Model proof: model_preference = gemini4hydrogen
Elapsed since Enter: 26.0s
Elapsed since tab open: 29.6s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/652

Answer
Links
Images
Share
10:27 AM

code review 
 aibraincoach/my-food-ai#652

Finished
15s

PR #652 (Fleet 19: post cap counts meals not requests (#471)) is already merged and cleanly implements per-meal rate limiting on POST /api/posts by only charging a post cap hit when an operationId is not yet present in post_upload_drafts or posts.

Strengths

Targeted fix: Moving capUser(user.id, "post") after body validation and checking post_upload_drafts and posts in parallel via Promise.all avoids charging repeated composer reservations for the same meal.

Solid test coverage: tests/post-cap-once.test.mjs verifies both the happy path (10 photos × 3 reservation calls = 10 hits) and the cap boundary (a known operation_id succeeds at 40 hits while a fresh operation_id returns 429), with proper finally cleanup.

Thorough production proof script: scripts/run19-ten-photos.mjs includes strong guardrails—enforcing test account 2, checking for a fair starting bucket and sufficient time left in the hour, and cleaning up database rows and Supabase storage objects in finally.

Potential Issues & Edge Cases

Race condition on concurrent reservations: In src/app/api/posts/route.ts, if the client fires two concurrent POST /api/posts requests with the same new operationId before reserveUpload inserts the row into post_upload_drafts, both requests will see !knownDraft.data && !knownPost.data and both will call capUser.

Unthrottled 400s: Because capUser now runs after payload validation, repeated malformed POST /api/posts requests (returning 400) are no longer counted against the post cap. If capUser was also relied upon to throttle bad-payload spam, consider whether a lightweight IP/user rate limit is still needed upstream.

Silent DB read errors: knownDraft and knownPost do not inspect .error. Your comment notes that a failed read intentionally counts as a hit, which is a safe fail-closed choice, though logging knownDraft.error || knownPost.error would make transient Supabase issues easier to diagnose.

Minor Suggestions

Readability in test and script files: tests/post-cap-once.test.mjs and scripts/run19-ten-photos.mjs pack multiple statements onto single lines, which makes future diffs and debugging harder; formatting them with standard line breaks would improve maintainability.

How can I fix the race condition on concurrent reservations
Show me how to handle DB read errors safely here
Let's refactor the test and script formatting
Should we add a lightweight rate limit for 400 errors
Review another pull request
Sources
⠋
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen