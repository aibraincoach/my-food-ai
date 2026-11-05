Head at submission: 30db5ad29baa6f89303cae9a92c482f25b3fa45e
Model proof: model_preference = gemini38flash
Elapsed since Enter: 36.4s
Elapsed since tab open: 44.8s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/667

Answer
Links
Images
Share
5:45 PM

code review 
 aibraincoach/my-food-ai#667

Finished
19s
Review verdict

Changes requested — one user-visible failure-handling issue remains in PR #667, “fix18: bookmark failed/unsave order (F12/#634),” reviewed at commit 30db5ad29baa6f89303cae9a92c482f25b3fa45e. The PR changes only src/components/PostActions.tsx. [github_mcp_direct:pull_request_read]

Finding
P2 — Failed-post bookmark clicks silently do nothing

Location: src/components/PostActions.tsx:23, with the same feedback gap in the queued-save failure handler at line 32.

The already-failed branch returns after calling:

tsx
const next = finishBookmark(
  { id: null, pending: false },
  null,
  true
);
bookmarkRef.current = next;
setBookmark(next);
return;

However, finishBookmark(..., true) does not record or display an error. It only restores previous.id and clears pending:

ts
export function finishBookmark(
  previous: BookmarkState,
  savedId: string | null,
  failed = false
): BookmarkState {
  return { id: failed ? previous.id : savedId, pending: false };
}

For an already-unsaved failed post, this produces the same {id: null, pending: false} state it already had. The component renders no error message, so clicking “Save meal” gives no feedback. For a queued save that subsequently fails, the optimistic bookmark disappears without explaining why. [github_mcp_direct:get_file_contents]

The existing save-error alert belongs to SavedMealListeners, whose request handler calls setError(...) on failure. Neither of these local failure branches dispatches save-meal or otherwise reaches that error-reporting path. Thus, the patch avoids indefinite pending state but does not implement its stated “failed posts show failure” behavior. [github_mcp_direct:get_file_contents][github_mcp_direct:pull_request_read]

Reproduction:

Render an unsaved post with status="failed".

Click “Save meal.”

Observe no request, no bookmark change, and no error announcement.

Suggested fix: retain the immediate rollback, but explicitly report the failure through a shared notification mechanism or a local accessible role="alert". Apply the same notification to the queued-save failure branch. Do not rely on the failed argument to finishBookmark as an error-reporting mechanism. [github_mcp_direct:get_file_contents]

What the patch fixes correctly

Saved posts take the unsave path before failed/readiness checks, allowing immediate unsave even when the post is not ready.

Already-failed unsaved posts no longer enter the readiness wait.

A queued save reverts after 120 seconds without a matching readiness event.

The current revision stores the wait cleanup function in a ref and calls it on unmount, addressing the earlier listener/timer leak.

Both readiness callbacks clean up before dispatching save-meal; sequential post-ready and post-settled events therefore do not themselves cause duplicate dispatches. [github_mcp_direct:get_file_contents]

Regression coverage to add

The diff contains no added tests. The highest-value cases are: [github_mcp_direct:pull_request_read]

Scenario	Expected result
Already-failed, unsaved post	No save request; nonpending state; accessible failure message
Queued save, then failure	Optimistic bookmark cleared; accessible failure message
No readiness event for 120 seconds	Original state restored; subsequent late readiness event does not save
Unmount while waiting	Timer and both readiness listeners removed
Saved post with failed/not-ready status	Unsave dispatches immediately
Both readiness events arrive	Exactly one save dispatch

This was a static review of the diff, the complete changed component, the optimistic-state helper, and the save-event consumer. I did not run the application or tests, and I did not post a GitHub review or comment.

Code review audit: clone and inspect PR #667 on aibraincoach/my-food-ai — check diffs, security vulnerabilities, and code quality in a PDF report
Computer
GitHub PR review dashboard: analyze file changes, test coverage gaps, and architectural impacts for aibraincoach/my-food-ai pull requests
Computer
Show me a suggested fix for this error handling issue
Draft a review comment for this pull request
Check if there are tests covering bookmark failures
⠼
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol