Head at submission: 06817fad25b1b1c0d1af55625292a1d86480c4dc
Model proof: model_preference = gemini38flash
Elapsed since Enter: 27.5s
Elapsed since tab open: 34.2s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/314

Answer
Links
Images
Share
5:52 PM

code review 
 aibraincoach/my-food-ai#314

Finished
10s

A code review for 
 #314 — aibraincoach/my-food-ai PR #314: "feat: show meal save and edit results at the tap" follows below.

Summary of Changes

This pull request introduces optimistic UI updates across common post actions:

Bookmark / Save meal: Updates bookmark state immediately, prevents duplicate taps via local locks, and skips fetching the saved-meals list if a saved_meal_id is already present.

Delete post: Emits post-deleted, closes the sheet, and navigates immediately. If the API fails, it dispatches post-restore and surfaces an alert.

Log again: Opens LogAgainSheet immediately populated with the card's local meal data/thumbnail while disabling submission until authoritative server data arrives.

Edit caption: Closes the dialog and overrides the caption locally via post-caption custom event; reopens dialog and reverts on failure.

Critical Issues & Bugs
1. saving Set leak and stale closures in SavedMealListeners.tsx

In SavedMealListeners.tsx:

tsx
const saving = new Set<string>();
const save = async (e: Event) => {
  const d = (e as CustomEvent<{postId:string;savedMealId?:string|null;previousSaved?:boolean}>).detail;
  if (saving.has(d.postId)) return;
  saving.add(d.postId);
  // ...
  try {
    // ...
  } catch (e) {
    // ...
  } finally {
    saving.delete(d.postId);
  }
};

Issue: saving is defined inside the useEffect body. Because useEffect runs only on mount/unmount ([router]), this specific instance survives across events. However, if the effect ever re-executes, active in-flight locks in saving are abandoned. More critically, saving.delete(d.postId) will never be called if (e as CustomEvent).detail is malformed or d.postId throws before reaching finally.

Fix: Move saving to a useRef(new Set<string>()) outside useEffect to guarantee persistence across effect lifecycles, and validate d?.postId before mutating the set.

2. Potential unhandled rejection / uncaught error in post()

In LogAgainSheet.tsx:

tsx
if (mode === 'day') {
  const [y, m, d] = date.split('-').map(Number);
  when.setFullYear(y, m - 1, d);
}
const [h, m] = time.split(':').map(Number);
when.setHours(h, m, 0, 0);

Issue: In mode === 'now', time is empty string (""), so time.split(':').map(Number) produces [0]. Setting h = 0, m = NaN results in an Invalid Date (NaN) passed to when.toISOString(), which throws RangeError: Invalid time value. This gets caught in the local try-catch and immediately shows an error toast when logging a meal "Now".

Fix: Wrap time-parsing strictly within if (mode !== 'now' && time).

3. finishBookmark ignores failed parameter in PostActions.tsx

In PostActions.tsx:

tsx
const next = finishBookmark(
  { id: d.savedMealId ?? null, pending: false },
  d.savedMealId ?? null
);

In SavedMealListeners.tsx:

tsx
window.dispatchEvent(
  new CustomEvent('save-meal-result', {
    detail: { postId: d.postId, savedMealId: previousId, failed: true }
  })
);

Issue: finishBookmark accepts signature finishBookmark(previous, savedId, failed = false). In PostActions.tsx, finishBookmark is called as finishBookmark({ id: d.savedMealId ?? null, pending: false }, d.savedMealId ?? null). The third argument (d.failed) is never passed, and the first argument (previous) is instantiated with the incoming payload rather than bookmarkRef.current.

Consequence: When a bookmark save fails and emits { failed: true, savedMealId: previousId }, finishBookmark evaluates d.savedMealId as the successful ID instead of falling back to the previous bookmark state.

Fix: Pass bookmarkRef.current and Boolean(d.failed):

tsx
const next = finishBookmark(bookmarkRef.current, d.savedMealId ?? null, Boolean(d.failed));
Suggestions & Architecture Improvements
1. CustomEvent decoupling vs React Context / Store

The application relies heavily on window.dispatchEvent(new CustomEvent(...)) for cross-component communication (save-meal, save-meal-result, post-caption, post-restore, delete-post, log-again).

While this avoids prop-drilling, window events have pitfalls:

No type safety without manual casting as CustomEvent<T>.

Memory leaks or duplicate handler execution if event listeners are not properly cleaned up or added multiple times.

Harder to test in unit test environments without synthetic DOM mocking.

Recommendation: Consider using a lightweight scoped React Context, Zustand, or TanStack Query cache mutations for post state manipulation.

2. Navigation fallback on Delete failure

In DeletePostSheet.tsx:

tsx
if (pathname.startsWith('/posts/')) router.replace('/');
// ... on failure:
if (pathname.startsWith('/posts/')) router.replace(pathname);

Once router.replace('/') has executed, pathname during the catch block may already reflect '/' rather than the original post URL, making router.replace(pathname) redirect back to '/' instead of the post page.

Fix: Store the original path before navigation in a local variable:

tsx
const currentPath = pathname;
if (currentPath.startsWith('/posts/')) router.replace('/');
// catch:
if (currentPath.startsWith('/posts/')) router.replace(currentPath);
Positive Highlights

Immediate UX responsiveness: Tapping bookmark/save or delete no longer leaves the user wondering if their click registered.

Well-targeted tests: Added unit tests in tests/save-optimistic.test.mjs verifying state transitions for optimistic bookmarks.

Request race handling: Use of againVersion counter in SavedMealListeners.tsx prevents out-of-order race conditions when quickly triggering multiple Log Again actions.

Check the rest of the PR diff
Suggest a fix for the saving set leak
Write a test for the optimistic UI flow
Review the error handling logic
Explain how the optimistic updates work
⠏
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash