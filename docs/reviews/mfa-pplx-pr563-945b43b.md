Head at submission: 945b43bb6be7b0e0d613bf4418a5d78c648aa25f
Model proof: model_preference = gemini38flash
Elapsed since Enter: 138.2s
Elapsed since tab open: 176.0s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/563

Answer
Links
Images
Share
12:59 AM

code review 
 aibraincoach/my-food-ai#563

Finished
28s
Review verdict

Changes requested: the new persistence acknowledgment can report success before a draft has a recoverable owner. I found one substantive correctness gap in the durability change.

Reviewed PR #563 at head 945b43b. This was a static review of the diff and surrounding upload-manager, capture-sheet, and fetch-wrapper code; I did not execute the application or tests.

Finding
P1 — Wait for owner resolution before acknowledging a durable post

Location: src/lib/posts/upload-manager.ts, post(), lines 200–202.

post() now returns true after its queued persistence write resolves, but that write can contain ownerId: ''.

The sequence is:

A fresh UploadManager starts with an empty ownerId.

stage() creates the entry with that empty owner and starts process().

process() waits for auth.getUser() before assigning the authenticated owner.

Meanwhile, post() sets posted = true and persists the entry without waiting for owner resolution.

That write succeeds, so CaptureSheet closes.

If the page reloads or the process terminates before the authenticated-owner write completes, initialize(ownerId) skips the saved entry because its stored owner does not match the signed-in user.

The new acknowledgment therefore proves that a row was written, but not that the row is recoverable on the next launch. useUploads() only subscribes to manager state; it does not itself provide an initialization barrier.

Suggested fix: resolve and validate the owner before queuing the acknowledged snapshot, and recheck that the entry is still valid after awaiting persistence. Keep upload work asynchronous, but make the success condition require an owner-bound, recoverable posted draft—or confirmed publication.

Regression test:

Start with an uninitialized manager and defer auth.getUser().

Stage a file and call post().

Verify that successful storage of the ownerless row does not resolve the acknowledgment.

Resolve authentication and verify that the acknowledged stored row contains both the owner ID and posted: true.

Initialize a second manager from that store and verify that it recovers the operation.

Other changes

Shared open-model deadline: the implementation appears sound. Both format attempts receive the same abort signal, and fetchWithRetry() combines that signal with its own timeout while buffering the response body. A format rejection therefore does not restart the total budget.

Native Space handling: excluding buttons, links, and summaries addresses the interception shown in the previous handler.

Completed-operation retry guard: returning the existing finished operation prevents the specific duplicate-publication retry covered by the added test.

Validation limits

The PR description reports passing TypeScript, production-build, and open-identify checks. The check-run response available during this review contained only a successful “Vercel Preview Comments” check; it did not independently establish that the application test suite passed.

No GitHub review or comments were posted.

Code review audit for aibraincoach/my-food-ai PR 563 — line-by-line vulnerability, security, and performance report
Computer
Show me the code fix for this owner issue
Draft a review comment for this pull request
Check the test suite for this upload manager
How can we fix the race condition in process
⠇
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash
GPT-6.1 Sol