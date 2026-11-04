Same-thread completion read; https://www.perplexity.ai/search/42cd661f-28fd-44bc-8f17-0d8f18d6f280
Original request/head proof retained in the corresponding exact-head initial capture. No new review request was submitted.

Answer
Links
Images
Share
1:08 AM

code review 
 aibraincoach/my-food-ai#560
Follow-up on the prior review findings, at the CURRENT exact PR head. Confirm the shared analysis-revision pending-save lock and failure ownership fix, including a remount during thumbs-down save. The owner explicitly accepted the 2px overlap between adjacent 44px hit boxes to preserve icon positions; it is an intentional product decision, not a blocker. Review the delta and relevant surrounding paths. Report remaining correctness blockers, or state BLOCKERS: NONE when resolved. Do not post or modify the repository.

Read more
Finished
34s

BLOCKERS: NONE

Reviewed PR #560 at exact head 45fddaf62f3932e48f054013c30773fadd2e7059. I re-read the PR metadata after reviewing; the head was unchanged. The shared pending-save lock and failure-ownership fix resolve the previously reported same-revision save race, including navigation and remount during a thumbs-down save.

Confirmed fixes

Shared analysis-revision lock: saveFeedbackRevision() keys pending requests by [postId, modelCommentId, fingerprint] in module-level storage. It acquires the lock synchronously before invoking the save callback. Another component instance targeting that revision returns false without starting another request or changing the optimistic selection.

Remount during thumbs-down save: navigation now occurs inside the accepted, lock-owning callback. Unmounting clears the component-local token, but does not release the shared lock. A remounted row reads the shared pending state through useSyncExternalStore, and another tap cannot race the original save.

Failure ownership: only the accepted save callback can record a failure. Rejected duplicate attempts do not clear errors or publish failures. The owning request records failure against its original revision and releases its lock in finally; a subsequent accepted retry clears that revision’s stored failure.

Revision isolation: the shared error key and revision-qualified failure event prevent an older analysis’s failed request from marking a newer displayed analysis. Component-local rollback remains guarded by the request token and displayed revision.

Delta and surrounding paths

I reviewed the latest ownership-fix commit and the full PR delta, together with feedback-optimistic.ts, feedback.ts, PostActions.tsx, and the post-detail route and component.

The bookmark handler still sets its ref-backed pending guard synchronously before dispatching its save event, so removing the button’s native disabled state does not remove its immediate duplicate-tap guard.

The accepted 2px overlap between adjacent 44px hit boxes is an intentional product decision and is not a blocker.

Validation limits

This was a static code review, not an executed browser or test run. The added regression test covers a pending request surviving loss of component ownership, rejection of a competing same-revision save, failure isolation, and successful retry clearing the stored failure. It simulates ownership loss with isCurrent: () => false; it is not an actual React remount test.

No comments were posted and no repository state was modified.

Check the tests covering the new lock logic
Show me where failure ownership is implemented
Explain how revision isolation prevents stale errors
Review the test file for edge cases
Summarize remaining risks in this PR
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol