Reviewer: Gemini 4 Hydrogen via Perplexity (PPLX); version reviewed: 5d1896c1af122b32de0914a4f3629ee539844339
Head reviewed: 5d1896c1af122b32de0914a4f3629ee539844339
Model proof: model_preference = gemini4hydrogen; picker = Gemini 4 Hydrogen; completed answer footer = Gemini 4 Hydrogen
Thread: https://www.perplexity.ai/session/04dc8215-b60c-4b04-874d-25ab05d78026
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/915
Completion re-inspected: 2026-11-15T13:58:35.703143+00:00; answer Copy/Helpful controls present; Stop response absent.
Evidence note: complete recapture of the same live thread supersedes the runner's earlier truncated capture; no resubmission.

Answer
Links
Images
Share
6:52 AM

code review 
 aibraincoach/my-food-ai#915

Finished
17s

PR #915 (fix: Fleet 21 photo-address) is well-structured and ready to merge once the 0063_photo_secret.sql migration is applied and the pending integration/browser checks pass. It cleanly combines two changes: CDN-cacheable public photo URLs (/p/{id}_{secret}_{width}.webp) and consolidating Home's today-meals read (readToday) so today's nutrition is fetched once per request.

Public photo delivery and security

The new route src/app/p/[file]/route.ts enforces strict validation before serving or caching any image:

Input and access checks: The FILE regex restricts requests to valid UUIDs, 32-char hex secrets, and widths 640 | 1080 | 1600, while rejecting any query parameters. It verifies photo.kind === 'photo', photo.photo_secret === secret, and post.deleted_at is null, returning 404 with Cache-Control: no-store and X-Content-Type-Options: nosniff on any mismatch.

Fallback behavior: If reserveFeedPhoto() is saturated or resizeSharpPhoto throws, original() returns a 302 redirect to a 60-second signed URL with no-store, preventing the CDN from caching transient errors or redirects.

Migration: supabase/migrations/0063_photo_secret.sql adds photo_secret with a gen_random_uuid()-based default and triggers notify pgrst, 'reload schema'. As noted in the PR, this must be applied to production immediately before merging.

Single read of today (#324)

src/lib/posts/home-today.ts and src/app/(tabs)/page.tsx eliminate the duplicate read of today's meals and the today_summary RPC call:

Shared calculation: dayTotalFromMeals in src/lib/posts/days.ts centralizes the day-circle total logic for both getDayTotals (used for the 5 prior days) and readToday (used for today's circle and the desktop Today column).

Graceful fallback: In homeDayTotals, homeTodayRead().catch(() => null) runs in parallel with the 5-day getDayTotals call. If readToday fails, homeDayTotals falls back to getDayTotals(db, user.id, zone, [today]), while HomeToday falls back to client-side loading.

Minor observations

Type casts in feed.ts, items.ts, and days.ts: In src/lib/posts/feed.ts (toFeedPosts), mediaRead still has an explicit inline type annotation without photo_secret?: string | null, which requires (entry as {photo_secret?:string|null}).photo_secret casts across feed.ts, items.ts, and days.ts. Updating the mediaRead type annotation would clean this up, though it has no runtime impact.

Limit bump in feed-photo.ts: Raising limitInputPixels from 2_000_000 to 4_000_000 for v1.webp previews is paired with an updated 2100x2100 oversized fixture in tests/feed-photo.test.mjs, keeping the pixel-limit test accurate.

Test coverage: tests/photo-address.test.mjs covers all key access-control paths (valid secret, wrong secret, invalid width, query string, cross-photo secret, and soft-deleted post), and tests/home-day-totals.test.mjs verifies both the single-read invariant and the readToday failure fallback.

Pending verification

Run tests/photo-address.test.mjs against the local stack with 0063_photo_secret.sql applied.

Verify x-vercel-cache (MISS then HIT) on /p/... after deploy, and confirm the cold-open first-photo metrics and desktop Today column behavior in the browser.

Show me the diff for the photo route
Explain how the photo secret migration works
Show me the implementation of dayTotalFromMeals
Check the browser and integration test status
Draft a response comment for this PR
⠸
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen
