Head at submission: d50bdf791848b9d528147197abec41c98fe2c029
Model proof: model_preference = gemini4hydrogen
Elapsed since Enter: 28.3s
Elapsed since tab open: 33.1s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/672

Answer
Links
Images
Share
10:47 AM

code review 
 aibraincoach/my-food-ai#672

Finished
16s

PR #672 fixes post author attribution by threading user_id, handle, and avatar_media_id through the feed pipeline into PostHandle, PostCard, PostDetailHeader, and PostOpenFrame, while locking down the avatar media route to the owner or an admin with private caching [github_mcp_direct:1, github_mcp_direct:2].

What Looks Good

Verified auth and authorization: Switching from db.auth.getSession() to db.auth.getUser() in src/app/api/media/avatar/[owner]/[media]/[variant]/route.ts validates the JWT with Supabase Auth rather than trusting unverified session data, and gating access to viewerId === owner || adminAllowed prevents cross-user avatar enumeration .

Shared-cache protection: Changing Cache-Control from public to private, max-age=31536000, immutable with Vary: Cookie prevents CDNs and shared proxies from caching private user avatars .

Batched profile loading: toFeedPosts in src/lib/posts/feed.ts deduplicates user_id values and fetches profiles in a single .in('id', userIds) query alongside the other parallel reads .

Issues to Address

Error responses cached as immutable: In src/app/api/media/avatar/[owner]/[media]/[variant]/route.ts, fail() was changed to return privateHeaders (Cache-Control: private, max-age=31536000, immutable) instead of private, no-store . A transient 503, pre-login 401, or 404 before an avatar is set can be cached by the browser for a year. Keep no-store for fail() and only apply max-age=31536000, immutable to 200 and 304 responses.

Extra profiles query on every owner request: In src/app/api/media/avatar/[owner]/[media]/[variant]/route.ts, adminRequestAllowed runs before checking viewerId !== owner, so an authenticated user fetching their own avatar triggers an extra profiles role lookup on every request . Short-circuiting with const adminAllowed = viewerId === owner ? false : await adminRequestAllowed(...) avoids that round-trip on the common path.

Empty-array .in() query in toFeedPosts: In src/lib/posts/feed.ts, profileRead calls .in('id', userIds) without checking if (userIds.length === 0) return new Map();, which sends an unnecessary query when rows is empty .

Minor Suggestions and Test Gaps

Unnecessary loadIdentity() subscription in usePostAuthor: In src/components/PostHandle.tsx, usePostAuthor calls useProfileIdentity() with no arguments even when row?.userId && row.handle is present, which still registers the profile-identity-changed listener and triggers loadIdentity() on mount . Passing row (when valid) into useProfileIdentity(row) lets the existing if (seeded) return; guard skip the effect.

Missing test coverage in tests/profile-avatar.test.mjs: The updated tests cover signed-out 401, non-owner 404, and owner 200 with private headers, but do not test an admin: true viewer fetching another user's avatar or a 304 response via If-None-Match .

Show me how to fix the error caching issue
Draft a comment for this pull request
Show me the updated file for the avatar route
What tests should I add for the admin role
Explain the avatar route changes in detail
Sources
⠸
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen