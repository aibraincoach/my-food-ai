Head at submission: 85487ed63235f32fbf84e147461548e5e7cbad4c
Model proof: model_preference = gemini4hydrogen
Elapsed since Enter: 25.9s
Elapsed since tab open: 30.6s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/654

Answer
Links
Images
Share
10:28 AM

code review 
 aibraincoach/my-food-ai#654

Finished
15s

PR #654 (Fleet 19: atomic question save (#626)), which is already merged into main, successfully moves meal analysis persistence, ready-state transition, and question comment creation into a single atomic PostgreSQL transaction. The core architecture is sound and well-tested, though there are a few edge cases around notification suppression and input validation worth noting.

Transaction Atomicity and Security

Moving the multi-step write into public.persist_analysis_with_question in supabase/migrations/0059_question_atomic.sql eliminates the partial-write window that previously existed in src/lib/pipeline/persist.ts.

All-or-nothing persistence: Wrapping persist_approximated_analysis, mark_post_ready, the posts.question update, and the post_comments insert in one PL/pgSQL function ensures any failure rolls back the entire unit so the job can retry cleanly.

Privilege lockdown: Using security definer with set search_path=public,pg_temp, revoking execute from public, anon, authenticated, and granting only to service_role follows best practices.

Rollback and test coverage: supabase/rollbacks/0059_question_atomic.down.sql cleanly drops the exact function signature, and tests/db/question-atomic.test.mjs verifies both the rollback on partial failure and the privilege restrictions.

Edge Cases and Potential Bugs

Notification suppression on hasNotEaten: In both src/lib/pipeline/persist.ts and src/lib/worker/jobs/analyze.ts, markReady suppresses the standard notification when hasNotEaten is true (notify: !hasNotEaten), but sendPostPush(admin, ..., question) is still called unconditionally whenever ready is truthy. If hasNotEaten is meant to suppress all push notifications for that post, sendPostPush should also be gated on !hasNotEaten.

Partial commit when mark_post_ready returns false: In persist_analysis_with_question, persist_approximated_analysis runs before if not public.mark_post_ready(p_post_id, p_job_id) then return false; end if;. Returning false does not roll back persist_approximated_analysis, meaning items, summary, and analysis_initialized_at remain committed while question and post_comments are skipped. This is safe if the queued correction expects those items to exist, but it is a subtle behavior to keep in mind.

Empty question string: The SQL function checks p_question is null or jsonb_typeof(p_question) <> 'object' and relies on the NOT NULL constraint of post_comments.body to reject missing question text. An empty string ({"question": ""}) would still pass and insert a blank model comment.

Code Style and Maintainability

Single-line compression: The new logic in src/lib/worker/jobs/analyze.ts (line 20) and supabase/migrations/0059_question_atomic.sql is compressed onto single lines without spacing. Expanding these into standard multi-line formatting will make future diffs and debugging much easier.

Show me the push notification fix for hasNotEaten
Help me write a test for the notification edge case
How should we reformat the SQL migration files
Check the rest of the persist pipeline for bugs
Review the test file question-atomic.test.mjs
Sources
⠋
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen