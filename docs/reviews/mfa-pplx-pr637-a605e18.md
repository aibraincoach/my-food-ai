Head at submission: a605e181112639acf5b4cadcff29c88912d2dbe1
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 24.0s
Elapsed since tab open: 27.7s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/637

Answer
Links
Images
Share
11:11 AM

code review 
 aibraincoach/my-food-ai#637

Finished
14s

PR #637 (run18/detail-server: batch getPostDetail) is a clean performance and polling-efficiency improvement across three files, and it has already been merged. Overall, the batching of signed URLs and the move from constant polling to exponential backoff while waiting are solid changes, with a few minor cleanups and edge cases to note.

Server-side batching in getPostDetail

In src/lib/posts/items.ts, replacing per-item createSignedUrl calls with a single createSignedUrls call for both photoRows and maskPaths, and running openFailurePromise in parallel with signing, meaningfully reduces round-trips.

Unused variable: const media = photoRows[0]; is no longer used now that signPaths.length gates createSignedUrls, so it can be removed.

Removed fence comment: The comment explaining why revisionBefore must be awaited before getCurrentItems was deleted; keeping a brief note there helps prevent future refactors from accidentally moving latestRevision into the Promise.all.

Thread polling and refresh behavior

In src/components/Thread.tsx, dropping router.refresh() on new comments and replacing the 2s/15s setInterval with a waiting-gated exponential backoff (2000ms up to 30000ms) reduces unnecessary server renders and idle network traffic.

Dead code: const models = (data ?? []).filter(row => row.author === 'model'); followed by void models; is unused and can be removed.

Visibility-change gap: When document.visibilityState !== 'visible', tick still doubles delay and schedules the next timeout, and there is no visibilitychange listener to trigger an immediate wake.current() when the user returns to the tab.

Optimistic waiting state: append sets waiting to true for user comments and immediately calls wake.current(), which runs load() and overwrites waiting with correctionFeedback(post.status) === 'waiting'. If post.status has not transitioned yet when load() resolves, waiting will briefly flip back to false until the next realtime event.

Test coverage

tests/post-detail-reads.test.mjs provides a focused unit test using a mocked fetch client to verify that getPostDetail preserves the expected post and items shape, populates maskUrl, and batches both photo and mask paths into a single /object/sign/media request. Adding a case where mask_path is null or signPaths is empty would also cover the signPaths.length === 0 branch.

Show me the code for the visibility change fix
Help me write a test for the exponential backoff
How can I optimize the batch signing further
Draft a follow-up PR for the dead code cleanup
Explain how the exponential backoff timer works
Sources
⠹
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen