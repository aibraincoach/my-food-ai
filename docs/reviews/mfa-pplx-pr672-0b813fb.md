Head at submission: 0b813fb8c8c4d9953e3bba4afc2b6a0a6e9b63ca
Model proof: model_preference = gemini38flash
Elapsed since Enter: 45.8s
Elapsed since tab open: 52.2s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/672

Answer
Links
Images
Share
5:27 PM

code review 
 aibraincoach/my-food-ai#672

Finished
21s
Review: changes requested

I found one security blocker and two correctness issues in PR #672, reviewing head commit 0b813fb8c8c4d9953e3bba4afc2b6a0a6e9b63ca. My recommendation is request-changes before merging. This was a static review; I did not run the application or tests.

1. P1 — Verify authentication before using service-role storage access

Location: src/app/api/media/avatar/[owner]/[media]/[variant]/route.ts, session lookup and admin.storage.download(path).

The route takes viewerId from db.auth.getSession(), then uses a service-role client to download the avatar. This replaces the previous storage request, which forwarded the caller’s access token and therefore required storage to authorize that token. The new privileged download no longer provides that independent authorization check.

The owner-profile lookup does not adequately replace it: it selects only avatar_media_id, and the explicit owner check depends on the same session-derived ID. The server client reads cookies, while the middleware that verifies claims does not match /api/media/avatar/.... Consequently, this route needs its own verified identity before it authorizes privileged reads.

Suggested fix:

Obtain the viewer ID from auth.getUser() or verified auth.getClaims(), rejecting verification failures.

Perform the owner/admin check using that verified ID.

Only then instantiate or use the service-role client.

Regression test: supply an unverified or manipulated session that claims the target owner’s ID, and assert that the route rejects it without downloading anything.

2. P2 — Missing author metadata still displays the viewer as the author

Locations: src/components/PostHandle.tsx, usePostAuthor; its callers in PostCard, PostDetailHeader, and PostOpenFrame.

Each caller constructs an author row only when both user_id and handle are truthy. Otherwise, usePostAuthor returns the signed-in viewer’s profile. That means a post with a known owner but a missing handle is rendered with the viewer’s handle and avatar—the identity mismatch this PR intends to fix.

This failure path is explicitly reachable in the new feed code: the batch profile lookup is optional, and a failed lookup or missing profile becomes {handle: '', avatar_media_id: null} while the post retains its real user_id. A profile-read failure should not change who appears to have authored a post.

Suggested fix:

Preserve a known user_id even when the handle is unavailable.

Render a neutral placeholder or fetch that specific owner’s identity.

Restrict viewer fallback to records explicitly known to belong to the viewer, such as local optimistic entries.

Regression test: render a post belonging to user A while signed in as user B, with A’s handle missing or the profile query failing. Assert that B’s identity is never shown.

3. P2 — Author-seeded cards stop responding to profile identity changes

Location: src/components/PostHandle.tsx, the if (seeded) return; effect branch and usePostAuthor.

Previously, post headers subscribed to profile-identity-changed through useProfileIdentity. The new seeded path returns before installing that listener. Although usePostAuthor still calls an unseeded identity hook, it always returns the supplied author row when that row has an ID and handle, discarding the refreshed identity.

As a result, for an already-rendered post with populated author metadata, a profile identity event alone cannot update its avatar or handle. It remains stale until the post data is refreshed independently.

Suggested fix: keep author identities in a cache keyed by user ID, or explicitly refresh/invalidate the author data when the corresponding profile changes. Do not replace another author with the viewer as part of that refresh.

Regression test: render an owned post with an initial avatar, update the mocked profile, dispatch profile-identity-changed, and verify that the existing card updates without remounting or refetching the feed.

Validation gaps

The changed avatar tests cover owner success and several rejection cases, but they stub adminRequestAllowed and do not exercise the authentication-verification boundary introduced by service-role downloads. Add tests for verified admin access, invalid authentication, and the missing-author and live-update cases above.

The check-runs response contains one successful check, Vercel Preview Comments; it does not establish that a build, typecheck, or test suite passed. No review comments or changes were posted to GitHub.

Show me the exact fix for issue 1
Draft a polite review comment for the PR
How do I check if the middleware covers this route
Help me write a regression test for issue 1
What are the other correctness issues found
⠏
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol