Head at submission: e62b717eff3b680f6319470a76e0d83fcbb818de
Model proof: model_preference = gemini38flash
Elapsed since Enter: 40.0s
Elapsed since tab open: 47.6s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/271
Thread: https://www.perplexity.ai/search/46e4c5ca-e456-4d24-ad2b-a309861c7569

Answer
Links
Images
Share
10:20 PM

code review 
 aibraincoach/my-food-ai#271

Finished
17s

This pull request expands the meal-tracking pipeline to support multiple leftovers photos per meal, tracking cumulative uneaten deductions and persisting them across subsequent photo revisions .

Architecture and Core Changes

Database schema (migration 0028): Drops the post_media_one_not_eaten partial index, adds not_eaten_calories to post_items, backfills legacy revisions, updates current_post_items view, and introduces the carry_item_leftovers() trigger to propagate deductions across supersedes revision inserts .

Draft & upload RPCs: Replaces single-index leftovers in reserve_post_upload_with_leftovers and publish_uploaded_post with not_eaten_positions integer[], with transactional advisory locks .

Job execution & pipeline: Scopes remainder jobs to a specific remainder_photo_id . In leftovers.ts and correct.ts, meals are reconstructed to gross amounts (beforeLeftovers) prior to sending prompts to the vision model, and deductions are reapplied once (carryLeftovers) so corrections cannot wipe out past leftovers .

Client & UI copy: Updates the client-facing UI (LightComposer, CaptureSheet, Carousel, Thread, card summaries) to support multi-select leftovers arrays and standardize on the user-facing label leftovers (not eaten) .

Key Findings and Recommendations
1. SQL Migration Safety: Backfill Locks Large Tables

In supabase/migrations/0028_multiple_leftovers.sql:

sql
update public.post_items i set not_eaten_calories=case when i.not_eaten_grams=0 then 0
 when p.portion_grams>0 and n.calories is not null then n.calories*i.not_eaten_grams/p.portion_grams else null end
from public.post_items p join public.item_nutrition n on n.post_item_id=p.id
where i.supersedes=p.id and i.not_eaten_grams is not null;

Risk: Running an unbatched UPDATE across post_items joining item_nutrition directly inside an active deployment migration acquires exclusive row/table locks . If post_items contains significant production history, this statement risks hitting transaction timeouts or blocking concurrent writes .

Recommendation: If the dataset in production is substantial, wrap the backfill in batched chunking or execute the column addition first, backfilling not_eaten_calories asynchronously before enforcing any constraints.

2. Trigger Condition vs. Application Reconciliation

In supabase/migrations/0028_multiple_leftovers.sql:

sql
if found and prior.not_eaten_grams is not null and new.not_eaten_grams is null then
  new.not_eaten_grams:=prior.not_eaten_grams;
  new.not_eaten_calories:=prior.not_eaten_calories;
  new.not_eaten_count_text:=prior.not_eaten_count_text;
  new.count_text:=case when new.portion_grams is not distinct from prior.portion_grams then prior.count_text else null end;
end if;

Behavior: The trigger only engages when new.not_eaten_grams is null . In carryLeftovers (src/lib/pipeline/leftovers.ts), the application explicitly calculates and attaches not_eaten_grams, bypassing the trigger in normal worker execution .

Recommendation: This dual-layer behavior is safe provided callers understand the trigger acts solely as a fallback safeguard for raw SQL inserts or uninstrumented callers . Ensure any test verifying manual corrections checks both trigger-applied and app-applied pathways.

3. Error Handling and Nullable Checks in API Route

In src/app/api/posts/route.ts:

typescript
let reserved = await admin.rpc("reserve_post_upload_with_leftovers", { ...options, p_not_eaten_positions: notEatenPositions });
if (
  reserved.error?.code === 'PGRST202' &&
  reserved.error.message.includes('reserve_post_upload_with_leftovers') &&
  notEatenPositions.length <= 1
) {
  reserved = await admin.rpc("reserve_post_upload_with_options", { ...options, p_not_eaten_position: notEatenPositions[0] ?? null });
}

Compatibility: This check smoothly preserves rolling deployment compatibility if the database migration lags behind the API server .

Edge Case: When notEatenPositions is empty, notEatenPositions[0] ?? null evaluates to null . Because reserve_post_upload_with_options permits p_not_eaten_position to be null, zero-leftover uploads successfully fall back . However, ensure reserved.error logging captures the initial PGRST202 during rollout telemetry to avoid silent fallback masked in monitoring dashboards.

4. Array State Mutation in UI Components

In src/components/LightComposer.tsx:

typescript
onClick={() => p.setNotEaten(on ? p.notEaten.filter(index => index !== p.index) : [...p.notEaten, p.index])}

Ordering: Adding p.index appends to the array, which may lead to out-of-order indices (e.g., [3, 1]) . While the database stores integer[] and checks position < 1 and cardinality , downstream display strings (Photos ${p.notEaten.map(index => index + 1).join(', ')}) will display photo numbers out of sequence .

Recommendation: Sort the indices when toggling:

typescript
[...p.notEaten, p.index].sort((a, b) => a - b)
Summary Table of PR Components
Component	File(s)	Assessment
Database Migrations	0028_multiple_leftovers.sql	Solid advisory lock handling and view upgrades; verify table lock duration on backfill .
API Layer	src/app/api/posts/route.ts	Clean zero-downtime RPC backward compatibility fallback for rolling deploys .
Pipeline Logic	leftovers.ts, remainder.ts, correct.ts	Properly gross-scales items before LLM review and carries cumulative deductions .
Client UI	CaptureSheet.tsx, LightComposer.tsx, Thread.tsx	Standardized label casing and switch logic; consider sorting index arrays on state update .
Test Coverage	multiple-leftovers.test.mjs	Comprehensive transaction rollback integration tests verifying retries and isolation .
Show me how to optimize the SQL backfill migration
Walk me through the leftovers recalculation logic
Check the advisory lock implementation in the RPCs
Review the test coverage in multiple-leftovers.test.mjs
Summarize potential edge cases with concurrent revisions
⠹
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash