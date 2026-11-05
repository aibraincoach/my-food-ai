Head at submission: 97d0a9d066d72e970e125d5e86795b391c65fc53
Model proof: model_preference = gemini38flash
Elapsed since Enter: 34.1s
Elapsed since tab open: 40.6s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/672

Answer
Links
Images
Share
5:43 PM

code review 
 aibraincoach/my-food-ai#672

Finished
17s
Review verdict: Request changes

Reviewed PR #672 at head commit 97d0a9d066d72e970e125d5e86795b391c65fc53. I found two correctness issues in the author-identity handling. This was a static review of the diff and supporting code; I did not run the application or tests.

1. P2 — Missing author metadata attributes another user’s post to the viewer

Location: src/components/PostHandle.tsx, lines 37–47; author construction in PostCard.tsx, PostDetailHeader.tsx, and PostOpenFrame.tsx.

Each updated component requires both an owner ID and a nonempty handle before passing an author:

tsx
const author = usePostAuthor(
  record.user_id && record.handle
    ? {
        userId: record.user_id,
        handle: record.handle,
        avatarMediaId: record.avatar_media_id ?? null,
      }
    : null
);

However, toFeedPosts() explicitly tolerates failed profile reads and missing profile rows, returning an empty handle while preserving the actual user_id. The component then discards that known owner ID, and usePostAuthor(null) returns the signed-in viewer’s profile.

Concrete failure:

Admin A opens a post belonging to B.

The profile query fails, times out, or returns no row for B.

The post retains B’s user_id, but its handle is empty.

The header displays A’s handle and avatar as B’s author identity.

This recreates the attribution problem the PR is intended to fix.

Suggested fix: preserve a known author ID even when profile metadata is unavailable. Render a neutral placeholder or load that specific author’s profile. Only use the viewer’s identity when the post is explicitly known to belong to the viewer—not merely because its handle is missing.

Regression test: render B’s post while signed in as A, with the author profile read failing or returning no row. Assert that A’s handle and avatar never appear as B’s attribution.

2. P2 — Author-backed headers ignore live profile updates

Location: src/components/PostHandle.tsx, lines 23–40.

usePostAuthor() subscribes to the viewer’s identity, but always returns the supplied row when it contains an ID and handle:

tsx
const profile = useProfileIdentity();

if (row?.userId && row.handle) {
  return {
    handle: row.handle,
    userId: row.userId,
    avatarMediaId: row.avatarMediaId ?? null,
  };
}

return profile;

Meanwhile, the fully seeded useProfileIdentity() path skips the profile-change listener:

tsx
if (seeded) return;

Consequently, for a mounted post with complete author metadata, a profile-identity-changed event can refresh the internal viewer profile without changing the displayed author. The original feed row keeps winning.

For the current user’s own posts, an avatar upload, replacement, or removal therefore cannot update the header through that event alone. It remains stale until another mechanism refreshes the post data. Before this change, the headers used the subscribed profile identity directly.

Suggested fix: keep identity bound to the author’s user ID, but invalidate or refresh that author’s metadata when their profile changes. An author cache keyed by user ID or explicit feed/detail invalidation would work. Do not refresh another author’s header with the viewer’s identity.

Regression test: render a seeded post belonging to the viewer, change the mocked avatar, dispatch profile-identity-changed, and verify the existing header updates. Cover both replacement and removal.

Validation notes

The earlier conditional-hook issue is fixed: usePostHandle() now calls useProfileIdentity() unconditionally.

The avatar route now uses auth.getUser() before authorizing privileged storage downloads; the previous session-only authentication concern does not apply to this head.

The changed tests exercise avatar-route owner access and rejection paths, but do not cover either React identity issue above.

GitHub returned one successful check, Vercel Preview Comments. That does not establish that tests, lint, or typechecking passed.

I have not posted comments or submitted a review to GitHub.

GitHub pull request architectural audit: security vulnerabilities, performance bottlenecks, and test-coverage gaps across changed files
Computer
AI-powered food app code review: API rate limiting, schema validation bugs, and database migration risks for pull request 672
Computer
Write the suggested fix for PostHandle.tsx
Draft a GitHub review comment for this PR
Check the second correctness issue found
⠼
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol