Head at submission: b55316fb43ddc9e835e1a724b327c4689e766304
Model proof: model_preference = gemini38flash
Elapsed since Enter: 40.5s
Elapsed since tab open: 48.1s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/672

Answer
Links
Images
Share
4:56 PM

code review 
 aibraincoach/my-food-ai#672

Finished
20s
Review: request changes

I found one merge-blocking React bug and one author-attribution regression in PR #672, reviewing head commit b55316f. The switch to author-backed avatar data is sensible, but the fallback path still needs correction.

1. P1 — usePostHandle conditionally calls a hook

Location: src/components/PostHandle.tsx, usePostHandle, lines 45–47.

tsx
export function usePostHandle(handle?: string, author?: PostAuthorRow | null) {
  if (author?.handle) return author.handle;
  return useProfileIdentity(handle ? {handle} : undefined).handle || handle || '';
}

The early return changes whether useProfileIdentity runs. That hook itself calls useState and useEffect.

There is a concrete transition in the updated callers:

A post without complete author metadata renders.

usePostAuthor() initially returns an empty viewer identity.

usePostHandle() therefore calls useProfileIdentity().

The asynchronous viewer-profile lookup resolves with a handle.

On the next render, author.handle is populated, so usePostHandle() skips those hooks.

This changes the parent component’s hook sequence and can produce a hook-order error or state mismatch. It affects the exact legacy/incomplete-row fallback that this change retains.

Fix: call the hook unconditionally, then select the returned value:

tsx
export function usePostHandle(
  handle?: string,
  author?: PostAuthorRow | null,
) {
  const identity = useProfileIdentity(
    author?.userId && author.handle
      ? {
          userId: author.userId,
          handle: author.handle,
          avatarMediaId: author.avatarMediaId ?? null,
        }
      : handle
        ? {handle}
        : undefined,
  );

  return author?.handle || handle || identity.handle || '';
}

Add a component test that renders without author metadata, resolves the profile lookup, and verifies the rerender completes without a hook-order error.

2. P2 — A failed author-profile read silently attributes the post to the viewer

Locations:

src/lib/posts/feed.ts, profile lookup and fallback in toFeedPosts

src/components/PostHandle.tsx, usePostAuthor

The new author construction in PostCard, PostDetailHeader, and PostOpenFrame

The feed deliberately tolerates profile-query failures and emits:

tsx
user_id: row.user_id,
handle: '',
avatar_media_id: null,

However, each updated component requires both user_id and a truthy handle before passing the author row. When the handle is empty, it passes null; usePostAuthor(null) then substitutes the signed-in viewer’s identity.

For an administrator viewing someone else’s post, a profile-query failure therefore displays the administrator’s handle and avatar as the post author. The actual owner ID remains available, but the component discards it. This also happens when an individual profile lookup returns no data.

Fix: distinguish “no owner identity available” from “owner known, profile metadata unavailable.” Preserve the post’s user_id, render a neutral handle/avatar fallback for missing metadata, and use viewer identity only when the post is known to belong to that viewer.

Add a regression test with:

Viewer A and a post belonging to B.

B’s profile lookup failing or returning no row.

An assertion that neither A’s handle nor A’s avatar appears as B’s identity.

Validation and scope

This was a static review of the diff and supporting identity/authorization code; I did not execute the application or tests. GitHub returned one successful check, Vercel Preview Comments, but no test or lint check in the check-run results.

The changed avatar-route tests cover owner success and rejection paths, but they do not exercise the React identity transition or missing-author-profile case above. No review comments or changes were posted to GitHub.

Automated code review: static analysis, security vulnerabilities, and architectural feedback for GitHub PR #672
Computer
Pull request risk scorecard: analyze test coverage, breaking changes, and performance impacts for PR #672
Computer
Explain the hook conditional call error in detail
Show me the complete revised version of PostHandle.tsx
What author-attribution regression did you find
⠼
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol