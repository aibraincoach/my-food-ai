Head at submission: 148d9ab2158734cf849274660c38e7841054be17
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 19.4s
Elapsed since tab open: 23.0s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/565

Answer
Links
Images
Share
7:32 PM

code review 
 aibraincoach/my-food-ai#565

Finished
9s

PR #565 (perf: share verified identity and seed Today from the feed page, already merged) is a well-scoped performance improvement that eliminates redundant /auth/v1/user calls and /api/days fetches on initial Home load, backed by targeted unit tests.

Auth and Identity Sharing

Middleware-to-browser identity hint (src/lib/auth/verified-cookie.ts, src/lib/auth/browser-user.ts, src/middleware.ts): Setting a non-HttpOnly mfa-verified-user cookie with a 1-hour maxAge (cleared on sign-out) and only trusting it when verified === session.user.id is a safe pattern for a UI hint. Because getSession() is still checked and all data queries rely on Supabase RLS with the real session, a forged cookie cannot grant unauthorized data access.

Feed photo route (src/app/api/media/feed/[owner]/[post]/[media]/v1.webp/route.ts): Switching from db.auth.getUser() to db.auth.getSession() avoids a per-image Auth network round-trip while keeping owner !== session.user.id and RLS enforcement on post_media and storage signing.

Today Seeding and Data Consistency

Chronological ordering (src/lib/posts/today-view.ts): todayFromPage() filters status === "ready" posts for today and explicitly sorts them ascending by eaten_at and id (Date.parse(a.eaten_at) - Date.parse(b.eaten_at) || a.id.localeCompare(b.id)), matching getDays() and preventing list-order flips when DesktopToday later refreshes from /api/days.

Completeness & fallback (src/lib/posts/today-view.ts, src/components/DesktopToday.tsx): Returning null when nextCursor !== null without an earlier-day post—or when itemsUnavailable is true—safely defers to the client /api/days fetch. DesktopToday also keys its loaded state by { seed: initial, day } so stale fetches don't overwrite a newer server seed.

Timezone mismatch edge case (src/app/(tabs)/page.tsx): HomeToday only passes initial when cookieZone is present (seed && cookieZone ? todayFromPage(seed.page, seed.zone) ?? undefined : undefined), which avoids seeding with a UTC fallback on a user's first visit before the time-zone cookie is set.

Minor Observations

Instrumentation logs: console.info("auth verify ...") calls were added in src/middleware.ts, src/app/(tabs)/page.tsx, src/app/api/feed/route.ts, and src/lib/profile/hints.ts. If these were only meant for local/run14 verification, consider removing or gating them behind a debug flag so they don't add noise to production logs.

Documentation/review artifacts: docs/evidence/run14/* and docs/reviews/mfa-pplx-pr565-3c5d55a*.md are included in the PR diff; if those are intentional audit trails for your workflow, they're fine, otherwise they could live outside the app repo.

Test coverage: The new tests (tests/today-view.test.mjs, tests/verified-cookie.test.mjs) and updated mocks (tests/feed-photo.test.mjs, tests/desktop-review.test.mjs, tests/home-day-totals.test.mjs) cover the key invariants, including equal-timestamp tie-breaking and cookie/session mismatches.

Show me test coverage details for this PR
Check for potential edge cases with the verified cookie
Review any related recent PRs in the repository
Examine the performance impact on the Home load
How does DesktopToday handle data synchronization
Sources
⠴
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen