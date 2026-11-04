Head at submission: 001f84d3c26f3b310bbfc9571fbf7cc7c58d865f
Model proof: model_preference = gemini38flash
Elapsed since Enter: 51.3s
Elapsed since tab open: 59.6s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/635

Answer
Links
Images
Share
11:00 AM

code review 
 aibraincoach/my-food-ai#635

Finished
30s
Review verdict

Request changes. I reviewed PR #635 at head 001f84d3c26f3b310bbfc9571fbf7cc7c58d865f. Two correctness issues should be fixed before merging: retry does not restart the opening watchdog, and the image cache can permanently reuse expired signed URLs.

This was a static review of the diff and related source; I did not run the application or tests.

Findings
1. [P1] Retry disables timeout feedback for subsequent attempts

Location: src/components/PostOpenTransition.tsx, retry handler and the effect depending on [opening].

The initial opening schedules the 2.5-second slow message and 10-second error state. After the error appears, “Try again” does only this:

tsx
setPhase('opening');
router.push(`/posts/${opening.id}`);

It does not change opening, so the effect that owns both timers does not run again. Both original timers have already fired. If the retry also stalls, the committed full-screen cover remains in the opening state indefinitely, without another slow message or error/retry interface.

Reproduction:

Open a post on mobile while its detail request is stalled.

Wait for the 10-second error state.

Select “Try again” and keep the request stalled.

Verify that the slow and error states never return.

Suggested fix: add an attempt counter to the watchdog effect’s dependencies, or replace the opening object when retrying. Preserve the intended destination rather than rebuilding it from the ID alone.

Regression test: with fake timers and an unresolved navigation, verify that every retry produces the slow state after 2.5 seconds and error state after 10 seconds.

2. [P1] The original-image cache reuses expired signed URLs with no recovery

Locations:

src/components/OutlineOverlay.tsx, DetailImage

src/lib/posts/items.ts, getPostDetail

getPostDetail signs original photo URLs for 3,600 seconds. The new session-storage cache saves that signed URL under the photo ID and treats any cached value as authoritative:

tsx
const cached = cacheKey ? sessionStorage.getItem(cacheKey) : null;
if (cached) {
  setOriginalUrl(cached);
  return;
}

After the signed URL expires, reopening the meal in the same tab can select the expired cached URL even though the server has supplied a fresh photo.url. The image’s onError handler only changes failedSharp; it neither evicts the cache nor falls back to the preview or fresh original. Since src remains the cached original, the photo can remain broken.

Reproduction:

Open a meal and let its original image populate session storage.

Keep the tab open past the signed URL’s one-hour lifetime.

Reopen the meal with the cached image unavailable locally.

The component selects the stale URL instead of the fresh server-provided URL.

Suggested fix:

Prefer the current photo.url over a previously cached signed URL.

If caching URLs remains necessary, track their validity and invalidate stale entries.

On an original-image failure, evict the entry and recover using the preview and/or current original URL.

Regression test: prepopulate session storage with an expired URL, provide a fresh photo.url, simulate an image error, and verify that the component recovers rather than retaining the failed source.

Validation before merge

In addition to the two regression tests above:

Test mobile navigation with a delayed response, including retry and cancellation.

Test reopening a meal after its original-image URL expires.

Run the production build and relevant automated tests. The retrieved check runs show only a successful “Vercel Preview Comments” check; that is not evidence that the build or behavior tests passed.

No review comments or approval were posted to GitHub.

⠏
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol