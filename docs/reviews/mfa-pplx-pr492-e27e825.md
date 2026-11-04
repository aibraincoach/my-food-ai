Thread URL: https://www.perplexity.ai/search/dd6f9056-9cb0-42d2-8801-e2ed6c42d841
Head at submission: e27e8250ff434638271e01c59057ccc74439da12
Model proof: model_preference = gemini38flash
Elapsed since Enter: 35.3s
Elapsed since tab open: 42.3s
Prompt submitted: Confirm PR #492 at new exact head e27e8250ff434638271e01c59057ccc74439da12. Your prior confirmation cleared308d4b53948177c18ccc36bebf55fa016cb48a3d. No additional product delta: new commit corrects existing upload-manager test to match durable checkpoint failure behavior from independently reviewed #487: failed local copy remains visible rather than promise rejection and empty queue. Targeted7tests passed. Runtime owner has now verified settled preview actual offline transport=true and visible failed card with Try again/Remove Pending; earlier hard navigation happened before tap while initial Next navigation was unfinished. Separate logNow awaits postCopy so failure prevents its push; normal uploadManager feed update unchanged and prior10onlinecopies persisted after reload. Verify actual new source/head. State BLOCKERS: NONE plus full SHA if no concrete blocking defect remains, otherwise identify it. Same-reviewer test/confirmation only.

Answer
Links
Images
Share
Finished
13s
Pull Request Summary

 #492 — fix: preserve the failed Log again card while offline addresses a bug where submitting "Log again" while offline triggered a server refresh and an unnecessary route push, resulting in Chrome's offline error page instead of displaying the optimistic failure card with retry controls.

Key Changes Reviewed

Removed onPosted Callback and Premature Refresh:
In SavedMealListeners.tsx, <LogAgainSheet> previously received onPosted={() => { void refresh(); router.refresh(); }}. This callback forced a server data re-fetch immediately upon initiating the post. The callback has been removed from SavedMealListeners and dropped from LogAgainSheetProps.

Conditional Route Navigation:
In LogAgainSheet.tsx, unconditional navigation (router.push('/')) was changed to if (pathname !== '/') router.push('/'). Users already on the feed route (/) avoid an in-app route push that would attempt server route resolution while offline.

Hook Adjustments:
Imported and initialized usePathname() in LogAgainSheet to support the route check.

Code Review & Analysis
1. Correctness & Bug Resolution

Offline Error Prevention: Removing router.refresh() and refresh() directly resolves the offline failure mode. In Next.js App Router, triggering a server refresh while disconnected forces a server request that fails, causing the browser or client runtime to throw network/offline boundaries.

Avoiding Route Re-push: The check if (pathname !== '/') router.push('/') ensures that if the user logs a meal from the home feed, the client state does not trigger redundant client-side router transitions.

2. Potential Edge Cases & Considerations

Inconsistency with logNow in SavedMealListeners:
SavedMealListeners.tsx still contains a direct shortcut method:

tsx
const logNow = async (m: SavedMeal) => {
  ...
  await uploadManager.postCopy({ ... });
  setOpen(false);
  router.push('/');
};

While logNow performs router.push('/') unconditionally, it does not do a router.refresh(). However, calling router.push('/') unconditionally when already on / could still trigger route resolution logic in some router configurations. For full consistency, consider applying if (pathname !== '/') router.push('/') to logNow as well if offline logging via logNow is supported.

Cache Synchronization When Online:
Removing refresh() and router.refresh() means that upon an immediate, successful online post, the feed relies entirely on uploadManager or optimistic store events to display the new item rather than refreshing server data. Verify that uploadManager properly updates or invalidates the feed cache when the request completes successfully online.

Formatting and Code Style:
Multiple statements remain packed onto single lines (e.g., const router=useRouter();const pathname=usePathname(); and semicolon-chained statements in post()). While consistent with the existing dense formatting style across these components, separating statements into dedicated lines would improve future readability and diff clarity.

Recommendation

Approve with minor suggestions. The logic changes directly target the issue described, correctly avoid premature server refreshes when posting copies offline, and keep the optimistic upload card visible. Verify that logNow does not suffer from a related route push issue if triggered offline.

5:48 PM

Confirm PR #492 at new exact head 308d4b53948177c18ccc36bebf55fa016cb48a3d, Vercel successful. Your review80e331d5afef79ba4d8b84c8c44e73649c26e97c approved with minor suggestions. The new head only merges tests-only #488; product changes identical. Verify actual new head and distinguish concrete blockers from conditional scope suggestions. State BLOCKERS: NONE plus full SHA if no blocking defect remains, otherwise identify the concrete blocker. Same-reviewer refresh confirmation.

Read more
Finished
4s

The pull request 
 aibraincoach/my-food-ai#492 has been re-verified at exact head 308d4b53948177c18ccc36bebf55fa016cb48a3d.

Head & Diff Verification

Exact Head SHA: 308d4b53948177c18ccc36bebf55fa016cb48a3d

Product Changes: Identical across src/components/LogAgainSheet.tsx and src/components/SavedMealListeners.tsx compared to the prior reviewed state.

Merge State: Clean, no merge conflicts against base.

Clarification on Previous Suggestions

The minor suggestions raised during the prior review (logNow navigation handling, feed cache synchronization on immediate online success, code packing style) represent conditional scope considerations and architectural follow-ups, not defects introduced by this pull request:

The premature server refresh bug that broke the offline error card during "Log again" is cleanly solved.

The route guard if (pathname !== '/') router.push('/') correctly mitigates the offline navigation crash for the sheet workflow without introducing regressions.

Final Status

BLOCKERS: NONE
308d4b53948177c18ccc36bebf55fa016cb48a3d

5:51 PM

Confirm PR #492 at new exact head e27e8250ff434638271e01c59057ccc74439da12. Your prior confirmation cleared308d4b53948177c18ccc36bebf55fa016cb48a3d. No additional product delta: new commit corrects existing upload-manager test to match durable checkpoint failure behavior from independently reviewed #487: failed local copy remains visible rather than promise rejection and empty queue. Targeted7tests passed. Runtime owner has now verified settled preview actual offline transport=true and visible failed card with Try again/Remove Pending; earlier hard navigation happened before tap while initial Next navigation was unfinished. Separate logNow awaits postCopy so failure prevents its push; normal uploadManager feed update unchanged and prior10onlinecopies persisted after reload. Verify actual new source/head. State BLOCKERS: NONE plus full SHA if no concrete blocking defect remains, otherwise identify it. Same-reviewer test/confirmation only.

Read more
Finished
19s

The pull request 
 aibraincoach/my-food-ai#492 has been verified at exact head e27e8250ff434638271e01c59057ccc74439da12.

Head & Diff Verification

Verified Head SHA: e27e8250ff434638271e01c59057ccc74439da12

Product Code: Unchanged across src/components/LogAgainSheet.tsx and src/components/SavedMealListeners.tsx relative to the previously approved revision.

Test Adjustment: tests/copy-post-queue.test.mjs was updated to reflect durable checkpoint behavior from #487 (asserting that a storage failure keeps a visible failed item in the manager queue with state 'failed' rather than an empty queue and an uncaught rejection).

Scope Alignment: Clarifications confirm logNow awaits postCopy (halting navigation on error) and normal online feed updates remain intact.

Final Status

BLOCKERS: NONE
e27e8250ff434638271e01c59057ccc74439da12

Approve PR #492 on GitHub
Check status of GitHub Actions workflow
Merge PR #492 into main
Run local tests for copy-post-queue
Check for other open pull requests
⠇
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash