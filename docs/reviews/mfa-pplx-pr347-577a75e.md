Head at submission: 577a75e031fe8d4e77d633bb37cdab3f3e3a9d70
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 28.8s
Elapsed since tab open: 32.6s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/347

Answer
Links
Images
Share
7:05 PM

code review 
 aibraincoach/my-food-ai#347

Finished
18s

Pull Request #347 (feat: restore deleted posts with Undo and Recently deleted (#291)) implements 30-day soft deletion for posts with an Undo toast, a Recently deleted recovery page, updated RLS policies, and a scheduled purge job. Overall, the architecture is solid, security boundaries are well-maintained, and database test coverage is thorough.

Strengths

RLS & Security: Splitting posts_owner_all into operation-specific policies with deleted_at is null in supabase/migrations/0036_soft_delete_posts.sql prevents owners from accidentally reading or mutating soft-deleted rows via PostgREST, while restore_post and list_deleted_posts safely encapsulate access via SECURITY DEFINER functions.

Service-Client Filtering: Adding visibleDrinkRows in src/lib/intake/hydration.ts (and wiring it into days.ts) ensures that service-role queries—which bypass RLS—still exclude drinks linked to soft-deleted posts, and chunks .in() queries in batches of 100.

Database Tests: tests/db/soft-delete.test.mjs covers owner vs. cross-user access, intake_logs visibility, the 30-day restore boundary, and purge_deleted_posts() cascading with media_cleanup job creation.

Issues & Edge Cases

Timezone mismatch in date formatting:

In src/app/(tabs)/profile/deleted/DeletedPosts.tsx, eaten_at is formatted with timeZone: 'UTC', which can display the wrong calendar date for users in non-UTC timezones.

In src/components/DeletePostSheet.tsx, weekday uses new Intl.DateTimeFormat('en-US', { weekday: 'long' }) without an explicit timezone, relying on the browser's local timezone rather than the app's configured zone.

Rollback data visibility: supabase/rollback/0036_soft_delete_posts.sql drops deleted_at without purging soft-deleted rows first. If rolled back in an environment with pending soft-deleted posts, those posts will immediately become visible again.

Redundant ownership check: In src/lib/posts/deleted.ts, softDeletePost queries posts to verify ownership before calling db.rpc('delete_post', ...), even though owner_remove_post_data already locks the row and checks user_id = auth.uid() and deleted_at is not null.

Minor Suggestions

list_deleted_posts(p_user_id uuid): The p_user_id parameter is redundant since the function enforces p_user_id = auth.uid(). Removing the parameter or defaulting to auth.uid() simplifies the RPC signature.

Toast & animation: Moving the DELETE fetch before router.replace('/') and the 200 ms collapse animation in DeletePostSheet.tsx avoids the previous optimistic-rollback complexity and works cleanly with prefers-reduced-motion.

Show me how to fix the timezone issues
Give me the code to fix the rollback script
Check the rest of the PR comments
Are there any performance concerns with the RLS policies
Summarize the remaining action items for this PR
Sources
⠧
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen