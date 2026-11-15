Head at submission: 1f7ea5f829c0f1e2b86ec64c8e55e3e4ce432711
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 19.9s
Elapsed since tab open: 23.8s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/636

Answer
Links
Images
Share
11:11 AM

code review 
 aibraincoach/my-food-ai#636

Finished
8s

PR #636 (run18/auth-once: getClaims middleware (#323)) replaces server-side getUser() network calls in middleware with supabase.auth.getClaims(), skips the middleware post-ownership query on React Server Component (RSC) navigations, and switches six client components from getUser() to getSession(). Overall the change reduces redundant Auth round-trips, though a few security and edge-case details in src/middleware.ts warrant attention.

Middleware authentication and header checks

Unchecked getClaims() error: const { data: claimsData } = await supabase.auth.getClaims() ignores any returned error object. If getClaims() fails or rejects on a malformed/expired token, userId silently resolves to null (or throws an unhandled rejection if getClaims() rejects). Destructuring error and handling it explicitly would make failure modes predictable.

RSC header bypass on /posts/[id]: Skipping postRequestAllowed when request.headers.get("RSC") is truthy avoids an extra DB query during client-side Next.js navigations, but RSC is a client-controlled HTTP header. Anyone sending RSC: 1 directly to /posts/<foreign-id> bypasses the middleware 404 check and falls back to the page's own Suspense/server check (which, as the removed comment noted, can return HTTP 200 instead of a 404). Make sure the /posts/[id] page/layout itself enforces ownership and never leaks post metadata.

Removed explanatory comments: Three helpful comments in src/middleware.ts (explaining why notFound() after streaming returns 200, why getSession() is safe after verification, and why Link preloads are avoided on /) were deleted. Keeping brief comments for non-obvious invariants helps future maintainers.

Client components switching to getSession()

Tamperable local state for UI-only chrome: Moving BottomBar.tsx, PostHandle.tsx, PostReadinessListener.tsx, ShellHome.tsx, and UploadChip.tsx from getUser() to getSession() is appropriate for non-privileged UI state, provided Supabase RLS and server endpoints still enforce real authorization.

PushPrompt.tsx subscription guard: In registerDevice and posted, session?.user?.id is read from local storage/cookies rather than verified against the Auth server. While postPushSubscription on the backend should still validate the session, using unverified session.user.id here means a stale local session could trigger a push registration attempt that fails server-side.

Inconsistent error handling: ShellHome.tsx previously checked error from getUser(), whereas the new getSession() call ignores error and only checks session?.user?.id ?? null. That is fine if getSession() only throws on unexpected failures, but worth keeping consistent.

Test coverage

Mocked unit tests only: tests/home-photo-preload.test.mjs and tests/readiness-refresh.test.mjs were updated with getClaims and getSession stubs, but no new test cases verify the !request.headers.get("RSC") branch or getClaims() returning missing/non-string sub claims in src/middleware.ts. Adding assertions for both paths in tests/post-access.test.mjs or tests/verified-user.test.mjs would lock in the new middleware behavior.

Show me the updated middleware code
How to handle the RSC header security risk
Draft a review comment for the PR
Show me the rest of the review
Are there tests for getClaims() failures
Sources
⠹
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen