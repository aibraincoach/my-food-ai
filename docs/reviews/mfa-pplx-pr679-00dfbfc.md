Head at submission: 00dfbfc2c3f659af48375748b201a9e5d32222ce
Model proof: model_preference = gemini38flash
Elapsed since Enter: 48.4s
Elapsed since tab open: 54.7s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/679

Answer
Links
Images
Share
6:26 PM

code review 
 aibraincoach/my-food-ai#679

Finished
34s

This PR (
 aibraincoach/my-food-ai#679) provides a focused and well-targeted fix for signed URL cache expiry and retry behavior. Below is the code review covering overall architecture, potential edge cases, and recommendations.

Summary of Changes

Conservative timestamp calculation (src/lib/posts/items.ts): Calculates signedExpiresAt right before executing supabase.storage.from("media").createSignedUrls(...) rather than after the response arrives, ensuring network latency or client processing time does not overestimate URL validity.

Conditional expiry assignment: Only attaches expiresAt when an original storage path was signed (url !== undefined), preventing fallback/preview URLs from inheriting a 1-hour expiry.

Cache safety (src/components/OutlineOverlay.tsx): Eliminates the synthetic Date.now() + 3_300_000 load-time fallback. Entries without an explicit expiresAt or with less than 5 minutes remaining (expiresAt <= Date.now()) are skipped.

Storage exception handling: Wraps sessionStorage.setItem in a try / catch block to guard against private browsing or quota limits.

Bounded error retries: Introduces retriedFresh ref to retry the fresh signed photo.url exactly once when a cached original fails before permanently falling back to previewUrl.

Key Findings & Considerations
1. Component Re-renders & Photo Prop Changes

In DetailImage, retriedFresh is initialized as:

typescript
const retriedFresh = useRef(false);

If DetailImage stays mounted while the photo prop changes (e.g., navigating between photos in a carousel or selecting a different post/item without unmounting), retriedFresh.current will remain true. If the new photo’s cached URL fails, it will immediately skip retrying photo.url and fall straight back to previewUrl.

Recommendation: Reset retriedFresh.current = false inside an effect or when photo.id / photo.url changes:

typescript
useEffect(() => {
  retriedFresh.current = false;
}, [photo.id, photo.url]);
2. Margin & Expiration Edge Cases

In writeOriginalCache:

typescript
const expiresAt = signedExpiresAt - 300_000;
if (expiresAt <= Date.now()) return;

Subtracting 300,000 ms (5 minutes) creates a buffer against clock drift and in-flight expiration.

If a post detail response is cached or delayed in transit such that fewer than 5 minutes remain on the signed URL, it will safely skip sessionStorage and load directly from memory. This is clean and robust.

3. Error Fallback Flow

In DetailImage:

typescript
if (sharp && originalUrl && cacheKey && !retriedFresh.current) {
  retriedFresh.current = true;
  try { sessionStorage.removeItem(cacheKey); } catch { /* ignore */ }
  setOriginalUrl(null);
  setReloadOriginal(n => n + 1);
  return;
}

When originalUrl fails on the first attempt, it clears the cache and sets originalUrl to null.

The effect listening to reloadOriginal triggers, fetches/checks the original again, or renders src = preview.

If the newly loaded original fails subsequently, retriedFresh.current prevents infinite retry loops and lets the standard setFailedSharp / preview fallback handle it.

Assessment
Dimension	Rating	Notes
Correctness	High	Accurately prevents caching expired signed URLs and eliminates infinite error cycles.
Performance	High	Prevents stale session storage reads and avoids unnecessary cache writes.
Resilience	High	Safely wraps session storage writes and prevents network overestimation.

The change is clean, minimal, and ready to merge, with the minor suggestion to reset retriedFresh.current on photo identity changes if DetailImage instances are ever reused across different items.

Reset retriedFresh when photo changes
Show me the refactored DetailImage component
Check for other places with sessionStorage issues
Draft a comment for this pull request
Review error handling in createSignedUrls
⠴
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash