Head at submission: e03ade6ce9d587534802e62a98c6b03ddc4c4268
Model proof: model_preference = gemini38flash
Elapsed since Enter: 37.4s
Elapsed since tab open: 43.9s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/668

Answer
Links
Images
Share
4:53 PM

code review 
 aibraincoach/my-food-ai#668

Finished
18s
Review verdict

Changes requested for PR #668. The retry counter correctly restarts the transition timers, but the image-cache changes leave two failure paths worth fixing before merging.

Reviewed head commit e03ade6ce9d587534802e62a98c6b03ddc4c4268, including both changed files and their surrounding component code. This was a static review; I did not run the application or tests.

Findings
1. [P2] An invalid cached original never retries the current original URL

Location: src/components/OutlineOverlay.tsx, lines 59–61 and 74–78.

When readOriginalCache() returns a cached URL, the effect sets originalUrl and returns before preloading photo.url. If that cached URL subsequently fails, the new error handler removes the cache entry and clears originalUrl, but neither operation changes an effect dependency:

tsx
}, [sharp, photo.url, photo.previewUrl, cacheKey]);

Consequently, the effect does not run again to fetch the current photo.url, even when that URL is valid. The component remains on the preview for the rest of that mount. This matters because the sharp image is used when outlines or drawing are enabled.

Reproduction:

Seed an unexpired cache record containing a URL that returns an error.

Render DetailImage with a working photo.url and photo.previewUrl.

Let the cached original fail.

Observe the preview fallback, but no request for the working current original.

Suggested fix: make cached-original failure trigger a bounded retry of the current original—for example, invalidate the cached candidate and increment a reload counter included in the preload effect’s dependencies. Distinguish failure of a cached URL from failure of the current original so this cannot become an infinite retry loop.

2. [P2] Storage failures escape the cache reader and interrupt image fallback

Location: src/components/OutlineOverlay.tsx, lines 46–48 and 74–78.

The cache reader catches failures, but its catch block performs another unguarded storage operation:

tsx
} catch {
  sessionStorage.removeItem(key);
  return null;
}

If access to sessionStorage throws, the cleanup can throw for the same reason. Because readOriginalCache() runs inside the useState initializer, this can propagate during rendering rather than treating the cache as unavailable.

The new image error handler has a related issue: it calls removeItem() before updating either state variable. If removal throws, setOriginalUrl(null) and setFailedSharp(...) never execute, preventing the intended fallback.

Suggested fix: make storage strictly best-effort. Protect reads, writes, and removals independently, and ensure the image fallback executes regardless of storage availability:

tsx
function removeOriginalCache(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Storage is optional; image rendering must continue.
  }
}

Use guarded removal in both places and guard writeOriginalCache() as well.

Tests to add

Cached original fails, current original succeeds: verify recovery to the current original.

Both cached and current originals fail: verify preview fallback without a retry loop.

Storage reads, writes, and removals throw: verify rendering and fallback still work.

Retry after the transition timeout: verify the 2.5-second slow indicator and 10-second error timer restart, then clear when the detail-ready marker appears.

Validation status

The only check run returned by GitHub was “Vercel Preview Comments,” which succeeded. That does not establish build, type-check, or behavioral-test coverage. No review or comments were posted to GitHub.

Show me the code fix for finding one
Check the second finding in detail
Draft a review comment for this PR
How can we prevent infinite retry loops here
Show me the full text of finding two
⠴
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol