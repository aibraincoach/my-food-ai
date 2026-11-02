Head at submission: c980c70ce32aa777673ac42706c616c6707c250f
Model proof: model_preference = gemini38flash
Elapsed since Enter: 52.1s
Elapsed since tab open: 56.7s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/271
Thread: https://www.perplexity.ai/search/0ab61070-3054-4e20-86d1-1d64b3bfcdb0

Answer
Links
Images
Share
10:14 PM

code review 
 aibraincoach/my-food-ai#271

Finished
28s

This pull request expands the meal-logging system to support multiple, cumulative leftovers photos and retain those deductions across subsequent photo revisions .

Architectural Summary

Database & Migrations (0028_multiple_leftovers.sql):

Drops post_media_one_not_eaten to allow multiple not_eaten photos per post .

Adds not_eaten_calories to public.post_items to record cumulative unconsumed energy explicitly, backfilling existing single-deduction items .

Adds carry_item_leftovers() trigger to ensure deductions persist across supersedes revision inserts .

Updates reserve_post_upload_with_leftovers and publish_uploaded_post to store and mark not_eaten_positions integer[] .

Scopes apply_post_remainder and queue_post_remainder to a targeted remainder_photo_id .

Pipeline & Worker (leftovers.ts, correct.ts, remainder.ts):

Reconstructs gross meal quantities prior to LLM correction prompts (beforeLeftovers) .

Re-applies recorded deductions once via carryLeftovers to prevent corrections from deleting or re-subtracting past deductions .

Tracks cumulative grams and calories in remainder.ts using item.not_eaten_calories + incrementKcal .

Client UI & Copy Updates:

Updates client-facing text across CaptureSheet, LightComposer, Carousel, Thread, and summaries to the approved label "leftovers (not eaten)" .

Transitions notEaten state from a single number | null to number[] .

Key Findings and Issues
High Severity: Broken Backward Compatibility Fallback in API Route

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
const { data, error } = reserved;

Problem: When admin.rpc(...) fails, Supabase PostgREST clients return { data: null, error: PostgrestError }. Re-assigning reserved inside the condition correctly updates reserved, but if the fallback RPC also fails or if the error is unhandled, reserved.error takes precedence .

Subtle Bug: options does not include p_not_eaten_position. When falling back to reserve_post_upload_with_options, it passes p_not_eaten_position: notEatenPositions[0] ?? null . However, if notEatenPositions is empty, notEatenPositions[0] ?? null evaluates to null, which matches ordinary uploads . Verify whether reserve_post_upload_with_options expects p_not_eaten_position to be omitted or nullable when there are no leftovers .

Medium Severity: Potential Underflow/NaN in Ratio and Cumulative Calorie Calculations

In src/lib/worker/jobs/remainder.ts:

typescript
const incrementKcal = rule.notEatenGrams === 0 
  ? 0 
  : item.calories == null 
    ? null 
    : toNumber(item.calories) * ratio;

const cumulativeKcal = ((item.not_eaten_grams ?? 0) > 0 && item.not_eaten_calories == null) || incrementKcal == null
  ? null
  : (item.not_eaten_calories ?? 0) + incrementKcal;

Portion Drift: ratio is computed as rule.notEatenGrams / toNumber(item.portion_grams) . If a previous remainder reduced item.portion_grams close to 0, floating point rounding or model estimates could result in rule.notEatenGrams > item.portion_grams.

Validation: While apply_post_remainder in SQL asserts (v->>'portion_grams')::numeric >= 0 and (v->>'not_eaten_grams')::numeric >= coalesce(old.not_eaten_grams,0), the worker itself should clamp rule.notEatenGrams so that consumedGrams never dips below 0 before dispatching to RPC, avoiding unhandled 400/500 job failures .

Low Severity: Fragile Regex in Thread Component

In src/components/Thread.tsx:

typescript
row.author === 'model' 
  ? row.body.replace(/\bNot eaten:/g, 'leftovers (not eaten):') 
  : row.body

Case Sensitivity & Edge Cases: If legacy model comments used different casing or formatting (e.g., Not Eaten:, not eaten:), this regex will miss them .

Recommendation: Consider using a case-insensitive match /\bnot eaten:/gi .

Design & Performance Observations

Rolling Deployment Guard: The fallback query check in src/lib/nutrition/totals.ts (if (snapshot.error?.code === '42703' && snapshot.error.message.includes('not_eaten_calories'))) is a well-designed safety guard for zero-downtime database migrations .

Trigger Redundancy: Both carryLeftovers (in application code) and carry_item_leftovers() (trigger in PostgreSQL) handle propagating not_eaten_grams and not_eaten_calories . Ensure unit tests validate that manual recalculation in carryLeftovers doesn't conflict with the BEFORE INSERT trigger in Postgres when explicit values are provided .

Verdict

The PR implements clean invariants across database triggers, RPC locking, prompt engineering, and UI state . Address the edge-case error handling in src/app/api/posts/route.ts and guard against possible portion underflow in remainder.ts prior to production deployment .

Show me how to fix the API route backward compatibility issue
Review the database trigger and migration logic for edge cases
Show the corrected code for remainder ts portion underflow
Explain how the carry_item_leftovers trigger works
Check the client UI state changes for multiple leftovers
⠙
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash