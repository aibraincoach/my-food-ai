Head at submission: 3023b2bcc487017c821f54615f21ae0fd398b740
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 23.8s
Elapsed since tab open: 27.5s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/663

Answer
Links
Images
Share
11:12 AM

code review 
 aibraincoach/my-food-ai#663

Finished
14s

Pull request 
 aibraincoach/my-food-ai#663 (fix18: today_summary null semantics + DesktopToday (F4–F6/#638)) is merged and generally solid, with one subtle timer bug in DesktopToday.tsx worth addressing in a follow-up.

DesktopToday timer and effect dependencies

Effect dependency fix: Removing day from the useEffect dependency array in src/components/DesktopToday.tsx prevents the effect from tearing down and re-attaching window event listeners (post-settled, post-deleted, post-restore, intake-changed) every time day updates.

Unconditional slowTimer bug: Moving slowTimer outside the else branch fixes the case where slowTimer never ran when !initial, but slowTimer is not cleared when load() resolves. If /api/today finishes in under 3000ms when !initial, live && !initial remains true and setSlow(true) will still fire at the 3-second mark after data has already loaded. Clearing slowTimer inside load()'s .then() (or tracking completion with a local flag) avoids this.

Feed and LocalTimeZone liveness

Fallback polling on focus: In src/components/Feed.tsx, calling scheduleDiscoverPoll(true) on focus and visibilitychange when !realtimeSubscribed ensures polling resumes promptly if the realtime channel is disconnected.

Timezone cookie refresh: In src/components/LocalTimeZone.tsx, removing the dateInZone(now, local) === dateInZone(now, zone) short-circuit guarantees router.refresh() runs whenever local !== zone, even if both zones currently share the same calendar date.

Database migration and test coverage

Null semantics: supabase/migrations/0062_today_summary_nulls.sql updates public.today_summary(p_zone text) so each macro (kcal, protein_g, carbs_g, fat_g) returns null when no ready item has a non-null value for that nutrient, while preserving security invoker, set search_path = public, pg_temp, and authenticated execute grants.

Rollback: supabase/rollbacks/0062_today_summary_nulls.down.sql cleanly restores the 0057 function definition.

Tests: tests/db/today-summary.test.mjs covers empty-day nulls, partial-null macros across multiple items, user isolation, and timezone day boundaries.

Draft a follow-up fix for the slowTimer bug
Show me the exact lines to clear the timer
Review another pull request in the repository
Explain the timezone cookie refresh change
Check the tests in today-summary.test.mjs
Sources
⠋
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen