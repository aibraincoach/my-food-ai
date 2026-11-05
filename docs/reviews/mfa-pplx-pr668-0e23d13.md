Head at submission: 0e23d1331785cc594dcea9b0f7588a59b622b9ca
Model proof: model_preference = gemini38flash
Elapsed since Enter: 42.4s
Elapsed since tab open: 49.0s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/668

Answer
Links
Images
Share
5:46 PM

code review 
 aibraincoach/my-food-ai#668

Finished
21s
Review verdict

Changes requested on PR #668, reviewed at commit 0e23d1331785cc594dcea9b0f7588a59b622b9ca.

The retry counter correctly re-runs the transition’s timer effect. The image-cache change, however, still has two expiration/recovery gaps. This was a static review of both changed files and their surrounding code; I did not execute the application or tests.

Findings
1. [P2] Cache expiration is not enforced while the component remains mounted

Location: src/components/OutlineOverlay.tsx, readOriginalCache and the DetailImage effect, approximately lines 33–76.

The new TTL is checked only during initialization or when the effect runs. Once a cached URL is copied into originalUrl, expiration does not clear that state. Furthermore, the cache-hit branch returns before creating the preloader, so it never checks or promotes a newer photo.url while the cached entry is considered valid.

A concrete failure sequence:

Open a photo with signed URL A and cache it.

Leave the detail mounted until A expires.

A refresh supplies a fresh signed URL B for the same photo.

If the session entry has expired, the effect starts preloading B, but leaves A as the displayed src until B loads.

If B fails, there is no preloader onerror handler to clear A or otherwise recover.

Even before expiry, a refreshed B is ignored whenever the entry for A remains valid. The underlying problem is that cache validity and displayed state are independent.

Suggested fix:

Track the cached URL and its expiration together in state.

Clear an expired original before attempting a replacement, so the preview remains the fallback.

Prefer a newly supplied original URL over an older cached URL, or explicitly validate their identity and expiration.

Add an error handler to the original-image preloader.

2. [P2] Error recovery retries the same signed URL instead of obtaining a fresh one

Location: src/components/OutlineOverlay.tsx, DetailImage’s onError handler, approximately lines 77–82.

When the displayed original fails, the handler removes the cache, clears originalUrl, and increments reloadOriginal. That reruns the effect, but the effect requests the unchanged photo.url:

tsx
image.src = photo.url;

If that URL itself has expired, removing the session entry cannot repair it. The preloader fails without an onerror callback, leaving the component on its preview indefinitely. This recovers only when the failed cached URL differs from an already-fresh photo.url.

Suggested fix: obtain a fresh signed URL through the existing data-refresh/signing path, then retry once. Bound retries by URL or attempt, and preserve the preview when recovery fails.

Tests needed before merging

The PR changes only the two component files; it adds no regression tests. I would cover:

Cached original fails, fresh photo.url succeeds: cache is replaced.

Both cached original and photo.url are expired: recovery requests a new signature rather than retrying the same URL.

Mounted detail crosses the cache expiration boundary: expired original state is cleared.

Fresh original preload fails: preview remains usable.

Retry after the 10-second opening error: “Still opening…” returns after 2.5 seconds, error returns after 10 seconds, and completion cancels both timers.

Scope and CI

The returned check-run list contained one successful check, Vercel Preview Comments. That does not establish that component behavior, type-checking, or regression tests passed.

Source reviewed: 
 aibraincoach/my-food-ai#668. No review or comments were posted to GitHub.

Show me a code fix for finding 1
Explain finding 2 in detail
Draft a review comment for this PR
How can I test the image cache fix
What about the retry counter changes
⠋
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol