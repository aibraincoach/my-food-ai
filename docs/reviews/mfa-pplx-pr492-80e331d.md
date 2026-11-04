Thread URL: https://www.perplexity.ai/search/dd6f9056-9cb0-42d2-8801-e2ed6c42d841
Head at submission: 80e331d5afef79ba4d8b84c8c44e73649c26e97c
Model proof: model_preference = gemini38flash
Elapsed since Enter: 38.2s
Elapsed since tab open: 54.7s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/492

Answer
Links
Images
Share
5:46 PM

code review 
 aibraincoach/my-food-ai#492

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

Check logNow for similar route push issues
Write a test case for offline Log Again behavior
Are there any other components using onPosted
Review the full diff for LogAgainSheet.tsx
Check if router refresh is needed online
⠏
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash