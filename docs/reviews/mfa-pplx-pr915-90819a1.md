Head at submission: 90819a1fd24f5b92673eb9a9126184783b99002b
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 30.7s
Elapsed since tab open: 45.3s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/915

Answer
Links
Images
Share
6:12 PM

code review 
 aibraincoach/my-food-ai#915

Finished
17s

PR #915 (fix21/photo-address) looks solid and ready to merge once the pending local build/stack tests (tests/photo-address.test.mjs) and production verification steps pass. It cleanly introduces capability-URL public photo delivery (/p/{id}_{secret}_{width}.webp) with bounded streaming and CDN caching, and consolidates Home's today read into a single query.

Public Photo Route & Migration

Capability URL & Migration (supabase/migrations/0063_photo_secret.sql, src/app/p/[file]/route.ts): Adding photo_secret via replace(gen_random_uuid()::text, '-', '') provides 122 bits of entropy per photo. The route strictly validates the filename regex (640|1080|1600 widths only), rejects query strings, verifies kind === 'photo', photo_secret === secret, and !post.deleted_at, and returns no-store on all 404/503/302 responses.

Bounded Streaming & Deadlines (src/app/p/[file]/route.ts, src/lib/supabase/admin.ts): Passing an AbortSignal into createAdminClient and combining request.signal with a 6s timeout ensures aborted or slow upstream reads are cancelled. Using readFeedSource(..., MAX_ORIGINAL_SOURCE_BYTES) avoids buffering unbounded blobs in memory, and falling back to a 60s signed URL (302, no-store) when reserveFeedPhoto() is busy or sharp fails prevents broken srcset candidates.

URL & srcset Wiring (src/lib/posts/feed-photo-url.ts, src/components/Carousel.tsx, src/app/(tabs)/page.tsx, src/lib/posts/feed.ts, src/lib/posts/items.ts, src/lib/posts/days.ts): Falling back to /api/media/feed/.../v2.webp when photo_secret is absent keeps existing tests and unmigrated rows working. Adding sizes="(min-width: 1024px) 520px, 100vw" (and matching imageSizes in preload) aligns browser candidate selection with the 640w/1080w/1600w srcset.

Home Today Read Consolidation (#324)

Single Read & Shared Total Logic (src/lib/posts/home-today.ts, src/lib/posts/days.ts, src/app/(tabs)/page.tsx): Replacing the today_summary RPC with readToday (backed by getDays for today..today) and extracting dayTotalFromMeals eliminates duplicate nutrition queries and keeps the Today column and today's day circle consistent.

Graceful Fallback: homeDayTotals fetches the 5 prior days in parallel with homeTodayRead().catch(() => null) and falls back to getDayTotals(..., [today]) if homeTodayRead fails, preserving both the day circles and DesktopToday's client-side fallback.

DST-Aware Day Bounds (src/lib/posts/days.ts): Switching getDays, getLoggedDates, and getDayTotals from wide UTC padding (shiftDay(from, -1)T00:00:00Z) to localDateStart(from, zone) / localDateStart(shiftDay(through, 1), zone) prevents today's meals from overlapping the prior-day nutrition query across DST transitions.

Minor Notes & Verification

src/lib/posts/feed-photo.ts: Bumping limitInputPixels from 2_000_000 to 4_000_000 for v1.webp previews is safe and matches the updated 2100x2100 oversized test in tests/feed-photo.test.mjs.

Pending Checks: As noted in the PR description, tests/photo-address.test.mjs (requiring the local Supabase stack + migration) and post-deploy x-vercel-cache: HIT verification on /p/... still need to be run before/after merge.

Run the photo-address test suite locally
Show me the SQL migration code
Explain how the capability URL secret works
Check the Home today read query optimization
Help me draft the PR description
Sources
⠹
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen