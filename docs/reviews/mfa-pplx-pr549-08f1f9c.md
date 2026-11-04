Thread URL: https://www.perplexity.ai/search/ba999ac1-38a9-44f8-8be3-4b525b9ee77f
Head at submission: 08f1f9caeeca3d6ff26ebe4bf6e6b0535d0bb0ce
Model proof: model_preference = gemini38flash
Elapsed since Enter: 50.0s
Elapsed since tab open: 58.0s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/549

Answer
Links
Images
Share
11:02 PM

code review 
 aibraincoach/my-food-ai#549

Finished
26s

This PR (
 aibraincoach/my-food-ai#549) introduces a fallback mechanism to match the closest generic USDA record when strict matching fails, attaching provenance metadata to nutrient entries and updating meal disclosures accordingly.

Overview and Changes

The pull request addresses food items that fail strict USDA resolution by selecting a generic equivalent (SR Legacy, Foundation, Survey) via LLM selection while keeping drink matching exact-only.

FDC matching fallback: Adds closestGenericFood() in approximate.ts using structured model output (closest_food) to pick from candidate generic foods.

Provenance metadata: Attaches {kind: 'closest', basis, sourceRef} within micronutrients in nutrients.ts, propagating it through portion rescaling and retained nutrition in portion.ts and correct.ts.

Disclosure summaries: Formats disclosure statements in wording.ts ("Nutrition for <item> is taken from the closest USDA record, <basis>.").

Database synchronization & migrations: Introduces 0051_approximation_summary.sql with persist_approximated_analysis and refresh_owned_approximation_summary, locking posts and targeting model comments identified by feedback_revision(p_post_id)->>'modelCommentId'.

Legacy rollout safety: Handles missing RPCs in persist.ts with checks against downgrading disclosure removals when unmigrated.

Key Review Findings
1. RPC Parameter Mismatch in Migration Test (tests/db/approximation-summary.test.mjs)

In tests/db/approximation-summary.test.mjs:

sql
perform persist_approximated_analysis(p, j, payload, 'Retry must not replace the committed label');

The signature defined in 0051_approximation_summary.sql is:

sql
persist_approximated_analysis(
  p_post_id uuid, p_job_id uuid, p_items jsonb, p_summary text, p_needs_input jsonb default null,
  p_identify_model text default null, p_identify_host text default null, p_is_label boolean default false
)

Calling it with 4 parameters works because the remaining parameters have default values (NULL / false). However, later in the test:

sql
perform persist_approximated_analysis(p, j, payload, 'New exact reanalysis.');

Notice that when p_identify_model is null and p_is_label is false, it delegates to:

sql
perform public.persist_owned_analysis(p_post_id, p_job_id, p_items, p_summary, p_needs_input);

Ensure test coverage explicitly tests the p_identify_model path during re-analysis so the model-identification metadata branch is exercised under the wrapper.

2. Model Comment Selection on First-Analysis Failures / Edge Cases

In persist_approximated_analysis:

sql
update public.post_comments set body=p_summary
where id=(select id from public.post_comments where post_id=p_post_id and author='model' order by created_at,id limit 1);

For brand-new posts, persist_owned_analysis / persist_identified_analysis inserts the first model comment with p_summary.

Then, the wrapper executes an UPDATE on the comment just created if initialized is null and the summary or previous comment contains the disclosure substring.

Because persist_identified_analysis already inserted p_summary, the subsequent UPDATE is a redundant write on the same row during initial creation. While benign under low volume, adding and body is distinct from p_summary avoids an unnecessary second write and trigger cycle.

3. Handling Multiple Approximated Items with the Same Name

In approximation-metadata.ts:

typescript
export function approximationLabels(items: readonly (NutritionSource & {name:string})[]): {name:string; basis:string}[] {
  const seen = new Set<string>();
  return items.flatMap(item => {
    const approximation = foodApproximation(item), key = `${item.name}\0${item.source_ref}`;
    if (!approximation || seen.has(key)) return [];
    seen.add(key);
    return [{ name: item.name, basis: approximation.basis }];
  });
}

If a meal contains two distinct items with the same display name (e.g., two entries for "macaroni" with different USDA fallback records/bases), deduplicating only on ${item.name}\0${item.source_ref} correctly keeps them distinct if their USDA source references differ. However, in wording.ts:

typescript
approximations.map(a => ` Nutrition for ${a.name} is taken from the closest USDA record, ${a.basis}.`).join("")

If both entries have the same name but different basis, the disclosure will output two consecutive sentences stating:
"Nutrition for macaroni is taken from the closest USDA record, Pasta, cooked. Nutrition for macaroni is taken from the closest USDA record, Macaroni, dry."
Consider keying or formatting duplicates so repeated item names are disambiguated if multiple instances exist.

4. Verification of Migration Rollback & Grant Permissions

The SQL definition revokes execute permissions from anon and authenticated, granting execute strictly to service_role:

sql
revoke all on function public.persist_approximated_analysis(...) from public,anon,authenticated;
grant execute on function public.persist_approximated_analysis(...) to service_role;

This follows least-privilege security practices for internal pipeline RPCs. The rollback file 0051_approximation_summary.down.sql cleanly drops both created procedures and notifies PostgREST to reload schema cache.

Verdict

The PR cleanly resolves the provenance and comment-revision synchronization issues identified in earlier iterations. Pending confirmation of the deduplication formatting for duplicate item names and the redundant update micro-optimization, the changes are well-tested, maintain migration safety, and are ready to merge following execution of migration 0051.

Show me the fix for that RPC parameter mismatch
Check the error handling for missing migration 0051
Explain how the drink matching exact-only rule works
Review the portion rescaling provenance logic
How does the LLM structured output select candidates
⠸
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash