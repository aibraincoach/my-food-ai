Head reviewed: fd01b42e0a5aa0ed551da6ec4a439d12c966eb79
Thread: https://www.perplexity.ai/search/c1b4b477-4a2d-4709-ac31-9bc4d5364fe8
Original request model proof: gemini38flash
Observed selected/footer model: Gemini 3.8 Flash
Observation resumed without resubmission after runner deadline.

Answer
Links
Images
Share
5:20 PM

code review 
 aibraincoach/my-food-ai#486

Finished
14s
Overview

Pull Request 
 aibraincoach/my-food-ai#486 introduces support for tracking alcohol consumption in my-food-ai. It adds an alcohol intake kind, sets a 500 g upper check bound in the database, explicitly excludes alcoholic liquid from hydration/water totals, and ensures caffeine from mixed drinks (e.g., rum and coke) is preserved without erroneously adding water volume.

The implementation is well-tested and thoughtfully addresses edge cases like rehydrating caffeine alongside alcohol. Below is a code review covering bugs, potential edge cases, and code style.

Critical Issues & Functional Bugs
1. Artificial 1 g minimum for unknown alcohol amounts

In src/lib/intake/drinks-from-items.ts:

typescript
if (isAlcoholic(item))
  return [{
    post_item_id: item.id,
    kind: 'alcohol' as const,
    amount: Math.max(1, Math.round(alcoholGrams(item.micronutrients))),
    ml,
    label: item.name.trim().slice(0, 40) || 'Drink',
    caffeineMg,
    alcoholG: alcoholGrams(item.micronutrients),
  }];

Issue: If an alcoholic item lacks micronutrient data or ethyl alcohol records, alcoholGrams(...) returns 0. Math.max(1, 0) coerces the stored intake amount to 1 (presumably to pass the amount between 1 and 500 database check constraint).

Impact: Any alcoholic drink with missing/unknown alcohol content will record and display 1 g of alcohol instead of remaining 0 or unrecorded. In IntakeSheet.tsx, alcohol > 0 evaluates to true, showing 1 g alcohol instead of flagging it as unknown.

Recommendation: If unknown alcohol shouldn't be counted, either allow 0 in the database check constraint for alcohol or do not log an intake amount for undetermined alcohol grams.

Hydration & Aggregation Edge Cases
2. Potential N+1 query and ID chunking limitation

In src/lib/intake/hydration.ts (withAlcoholNutrition):

typescript
const amounts = new Map<string, { alcoholG: number; caffeineMg: number }>();
for (let offset = 0; offset < ids.length; offset += 100) {
  const { data, error } = await db
    .from('current_post_items')
    .select(...)
    .in('id', ids.slice(offset, offset + 100))
    .abortSignal(AbortSignal.timeout(8000));
  // ...
}

Issue: Each call to drinksForDay and hydrationTimelines executes withAlcoholNutrition. In timeline views or weekly rollups with many alcoholic drinks, this queries current_post_items in batches of 100.

Recommendation: Ensure post_item_id lookups are properly indexed on current_post_items / item_nutrition, and consider caching or joining when fetching drinks if timeline generation becomes slow.

3. Mixed posts summary calculation

In src/lib/posts/summary-line.ts:

typescript
if (drinks.some((row) => row.kind === 'alcohol')) {
  const g = post.items.reduce(
    (sum, item) => sum + alcoholGrams(item.micronutrients),
    0
  );
  return `Drank: ${g > 0 ? `${number(g)} g alcohol · ${(g / 14).toFixed(1)} standard drinks` : 'alcohol unavailable'} · ${formatCalories(totals.calories)} kcal`;
}

Issue: If a user logs a post containing both a non-alcoholic beverage (like water or coffee) and an alcoholic drink, drinks.some(row => row.kind === 'alcohol') takes over the entire summary string, omitting non-alcoholic drink volume and caffeine totals.

Recommendation: Verify whether mixed-beverage meals/posts should report both fluids/caffeine and alcohol metrics, or clarify this product requirement.

Migration & Database Checks
4. Destructive rollback script

In supabase/rollbacks/0047_alcohol_intake.down.sql:

sql
delete from public.intake_logs where kind='alcohol';
alter table public.intake_logs drop constraint intake_logs_kind_check;
...

Observation: Rolling back permanently removes user alcohol data without archiving or a backup mechanism.

Recommendation: Confirm this is acceptable for rollback semantics in production, or ensure down-migrations are run strictly in staging/development.

Code Style & Formatting
5. Spacing and code consistency

Across several files (src/lib/intake/hydration.ts, src/lib/intake/drinks-from-items.ts, src/components/IntakeSheet.tsx), new lines were written without standard whitespace or formatting (e.g., const alcohol=rows.reduce(...), if(isAlcoholic(item))return [...]).

Recommendation: Run prettier / linter formatting across the changed files to match the rest of the codebase style.

Show me the fix for the 1g minimum bug
Check the database check constraints for alcohol
Review the hydration and aggregation logic
How is caffeine handled in mixed drinks here
Suggest tests for this pull request
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash