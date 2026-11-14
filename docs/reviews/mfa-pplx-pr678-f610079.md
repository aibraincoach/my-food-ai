Head at submission: f6100790c28d71826f358f47ce897e524f6eee1a
Model proof: model_preference = gemini4hydrogen
Elapsed since Enter: 26.6s
Elapsed since tab open: 30.4s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/678

Answer
Links
Images
Share
10:48 AM

code review 
 aibraincoach/my-food-ai#678

Finished
16s

PR 
 aibraincoach/my-food-ai#678 (fix18/post-merge: PPLX #677 follow-up, already merged) is a small 7-file follow-up (+9 / -6) that addresses avatar error caching, failed meal-save events, author identity fallbacks, and upload removal rollback. While the caching and event changes look solid, there is one Rules of Hooks bug in usePostHandle and a minor rollback issue in UploadManager.remove.

Critical Issue: Conditional Hook Call

In src/components/PostHandle.tsx, the early return inside usePostHandle runs before useProfileIdentity(seeded):

ts
export function usePostHandle(handle?:string,author?:PostAuthorRow|null) {
 if(author?.userId&&!author.handle)return handle||'';
 const seeded=author?.userId&&author.handle?{userId:author.userId,handle:author.handle,avatarMediaId:author.avatarMediaId??null}:handle?{handle}:undefined;
 const identity=useProfileIdentity(seeded);

Because PostCard.tsx, PostDetailHeader.tsx, and PostOpenFrame.tsx now pass handle: record.handle ?? '' whenever user_id is present, author?.userId && !author.handle will be true whenever handle is missing. If author.handle later populates (or clears) across renders, React will throw a hook-count mismatch error.

Fix: Move the if (author?.userId && !author.handle) return handle || ''; check after useProfileIdentity(seeded) (or pass undefined to useProfileIdentity and return after the hook call).

Minor Issue: Revoked Preview URL on Rollback

In src/lib/posts/upload-manager.ts, URL.revokeObjectURL(entry.previewUrl) is called before await this.store.remove(id) inside remove(id: string):

ts
if (entry.previewUrl)
    URL.revokeObjectURL(entry.previewUrl);
try { await entry.writing.catch(() => { }); await this.store.remove(id); }
catch (error) { entry.deleted = false; this.entries.set(id, entry); throw error; }

If this.store.remove(id) throws, entry is restored to this.entries, but entry.previewUrl has already been revoked and will render as a broken image. Moving URL.revokeObjectURL(entry.previewUrl) into the try block after await this.store.remove(id) avoids leaving a dead blob URL on failure.

Changes That Look Good

Avatar error caching (src/app/api/media/avatar/[owner]/[media]/[variant]/route.ts): fail now explicitly sets 'Cache-Control': 'private, no-store' instead of reusing privateHeaders, preventing failed avatar responses from being cached.

Blocked meal save events (src/components/PostActions.tsx): When post-settled fires with a non-ready status, onSettled now dispatches save-meal-result (failed: true) and save-meal-blocked with a user-facing message instead of silently resetting bookmark state.

Author prop propagation (PostCard.tsx, PostDetailHeader.tsx, PostOpenFrame.tsx): Passing userId even when handle is absent (handle: row.handle ?? '') preserves author.userId and author.avatarMediaId for avatar rendering.

Code review audit: analyze pull request #678 in aibraincoach/my-food-ai — structural bugs, security risks, and optimization report
Computer
Automated pull request review dashboard for aibraincoach/my-food-ai PR #678 — security checks, test coverage, and code quality scorecard
Computer
Show me the fix for the hook order issue
How should I handle the blob URL revocation order
Draft a fix commit for this PR
Sources
⠸
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen