Head at submission: 7fc0814ef7698d1953ff123c28f655efe35f3c14
Model proof: model_preference = gemini38flash
Elapsed since Enter: 33.7s
Elapsed since tab open: 40.8s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/663

Answer
Links
Images
Share
4:49 PM

code review 
 aibraincoach/my-food-ai#663

Finished
14s

This pull request aligns database null semantics for macro summaries with client-side aggregations and resolves component lifecycle/liveness issues across DesktopToday, Feed, and LocalTimeZone .

PR Overview
Area	Changes	Impact
Database (0062_today_summary_nulls.sql)	Replaces coalesce(..., 0) with conditional null checks when count(*) filter (where macro is not null) = 0 .	Returns null instead of 0 when no macro data is recorded, matching sumNutrition .
Component (DesktopToday.tsx)	Removed day from useEffect dependencies; unconditionally arms slowTimer .	Fixes stale/infinite re-trigger loop on data load; changes timeout behavior when initial data is present .
Component (Feed.tsx)	Reschedules discover polling on window focus/visibility change if not realtime subscribed .	Keeps polling active across backgrounding without active websocket subscription .
Component (LocalTimeZone.tsx)	Triggers router.refresh() when IANA timezone string changes, even if dates currently match .	Ensures SSR content reflects proper timezone string without waiting for midnight boundaries .
Test Suite (today-summary.test.mjs)	Verifies local day boundary, macro nulls, partial data, and multi-user isolation .	Strengthens end-to-end SQL function coverage .
Critical Issues
1. Unconditional slowTimer in DesktopToday.tsx

In src/components/DesktopToday.tsx:

typescript
if(!initial)load();
slowTimer=setTimeout(()=>{if(live)setSlow(true);},3000);

Previously, the timer was set only when !day evaluated to true. Now, even if initial data is provided and day is already populated on initial render, setSlow(true) will trigger after 3 seconds because if (live) does not check whether day exists .

If day is already populated from initial, slow state gets set to true in background state. While the UI check hides slow messages when !day is false ({slow&&!day&&!error?...}), this leaves redundant state updates and causes showPlaceholder (placeholder||(!day&&!error&&!slow)) to flip from true to false when !day is true, or causes confusing state transitions if day later changes .

Recommendation: Check whether data is actually pending before toggling slow:

typescript
slowTimer = setTimeout(() => {
  if (live && !initial) setSlow(true);
}, 3000);

Or check data state inside the callback:

typescript
slowTimer = setTimeout(() => {
  if (live) setSlow(prev => (!day ? true : prev));
}, 3000);
Key Recommendations
2. SQL Migration Performance on ready_nutrition

In supabase/migrations/0062_today_summary_nulls.sql:

sql
ready_nutrition as (
  select
    n.calories,
    n.protein_g,
    n.carbs_g,
    n.fat_g
  from today_posts tp
  join public.posts p on p.id = tp.id and tp.status = 'ready'
  join public.current_post_items i on i.post_id = p.id
  left join public.item_nutrition n on n.post_item_id = i.id
)

In the final jsonb_build_object, four separate subqueries evaluate against ready_nutrition:

sql
'kcal', (select case when count(*) filter (where calories is not null) = 0 then null else sum(calories::numeric) filter (where calories is not null) end from ready_nutrition),
'protein_g', (select case when count(*) filter (where protein_g is not null) = 0 then null else sum(protein_g::numeric) filter (where protein_g is not null) end from ready_nutrition),
...

While PostgreSQL's query optimizer often flattens CTEs, executing four aggregate scans across ready_nutrition can result in repeated traversals of current_post_items and item_nutrition .

Recommendation: Compute the aggregated metrics in a single CTE step:

sql
nutrition_totals as (
  select
    case when count(calories) = 0 then null else sum(calories::numeric) end as kcal,
    case when count(protein_g) = 0 then null else sum(protein_g::numeric) end as protein_g,
    case when count(carbs_g) = 0 then null else sum(carbs_g::numeric) end as carbs_g,
    case when count(fat_g) = 0 then null else sum(fat_g::numeric) end as fat_g
  from ready_nutrition
)

(Note: count(col) natively excludes nulls, making filter (where col is not null) redundant .)

3. Cleanup in Down Migration

In supabase/rollbacks/0062_today_summary_nulls.down.sql:
The rollback re-implements function 0057, but test runner script tests/db/today-summary.test.mjs executes both migration scripts sequentially and references ${rollback} . Verify that running db:rollback via Supabase CLI restores identical permissions, search paths, and return contracts for earlier schema dependents .

Commendations

Strict Dependency Management: Removing day from the DesktopToday useEffect array eliminates unnecessary re-fetching and event-listener teardown/re-registration every time today's data loads .

Cleaner Timezone Transitions: Removing dateInZone(now, local) === dateInZone(now, zone) in LocalTimeZone.tsx prevents subtle edge cases where users change regions within identical calendar dates but formatting/offset rules differ .

Thorough SQL Integration Test: today-summary.test.mjs cleanly verifies local date transitions, RLS/user isolation, and partial null preservation .

Show me the full review of DesktopToday.tsx
How can I fix the slowTimer issue in DesktopToday
Review the database migration for null semantics
Check the test suite coverage in this PR
Are there any other components affected by timezones
⠦
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash