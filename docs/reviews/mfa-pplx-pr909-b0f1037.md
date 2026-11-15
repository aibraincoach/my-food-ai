Head at submission: b0f1037a6947104f97d7cc2da803af9d3b3a01bb
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 90.3s
Elapsed since tab open: 94.3s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/909

Answer
Links
Images
Share
6:59 AM

code review 
 aibraincoach/my-food-ai#909

Finished
10s

PR #909 (fix21/feed-hint → main) replaces the getHintState server action in src/components/FirstRunHint.tsx with a shared client-side Supabase query (loadHintState), preventing Home from re-rendering and remounting the feed. The approach is clean and well-scoped, with one defensive-coding issue around nullable database values that should be addressed before merging.

What works well

Shared in-flight promise: Caching hintState at the module level deduplicates concurrent profiles reads across all mounted FirstRunHint cards.

Account-switch invalidation: Tracking hintStateUserId and resetting hintState when session?.user.id changes prevents stale hint state after a server-action sign-in.

Failure recovery: Checking if (!state && hintState === read) hintState = null ensures a failed or empty read does not permanently poison the cache for the session, while avoiding clobbering a newer user's promise.

Optimistic cache update: Pushing hint into state.seen inside hide() keeps the shared in-memory state consistent with dismissHint(hint) for any cards mounted later in the same session.

Issues to address

Possible TypeError when hints_seen is null: In loadHintState(), return { userId, seen: [...(data.hints_seen as string[])] }; assumes data.hints_seen is always an array. If a profile row has hints_seen as null or undefined, spreading it throws a TypeError that .catch(() => null) silently swallows, causing hints to never appear for that user. Guard it with Array.isArray(data.hints_seen) ? data.hints_seen : [] or (data.hints_seen ?? []).

Minor notes

Use of getSession(): db.auth.getSession() reads the session locally rather than revalidating with getUser(). For non-sensitive UI hint visibility this is a reasonable trade-off to avoid extra network calls, as Supabase RLS still governs the profiles query.

Dead-code check: Confirm whether getHintState in @/lib/profile/hints is still used elsewhere in the codebase; if not, it can be cleaned up in a follow-up.

Show me the code fix for that TypeError issue
Check if getHintState is used elsewhere in the codebase
What does the rest of FirstRunHint.tsx look like
How can we test this auth switch invalidation logic
Are there any performance implications with this module-level cache
⠴
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen