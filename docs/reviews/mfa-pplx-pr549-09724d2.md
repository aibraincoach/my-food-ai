Thread URL: https://www.perplexity.ai/search/1144f507-4535-4e12-88f0-1221b8b77d8a
Head at submission: 09724d2f0ac1842e604a99d5094eefd74b458edf
Model proof: model_preference = gemini38flash
Elapsed since Enter: 39.1s
Elapsed since tab open: 46.3s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/549

Answer
Links
Images
Share
10:59 PM

code review 
 aibraincoach/my-food-ai#549

Finished
21s
Review verdict

Request changes on PR #549 at commit 09724d2f0ac1842e604a99d5094eefd74b458edf. I found one correctness issue in the new summary-refresh behavior that should be fixed before merge.

Finding
P2 — Recompute can leave a stale approximation disclosure in the latest correction reply

Location: supabase/migrations/0051_approximation_summary.sql, refresh_owned_approximation_summary; called from src/lib/worker/jobs/recompute.ts:55–67.

The new RPC updates only the earliest model comment:

sql
where id=(
  select id
  from public.post_comments
  where post_id=p_post_id and author='model'
  order by created_at,id
  limit 1
)

However, correction replies now also contain approximation disclosures: correct.ts passes the final rows’ labels to safeSummary() and persists that text as the correction reply. Recompute does not update those later replies.

A concrete failure sequence is:

Initial analysis produces exact nutrition, so the first model comment has no approximation disclosure.

A correction introduces an approximated food. Its correction reply names the closest USDA record.

Recompute runs on that meal.

refresh_owned_approximation_summary writes the corrected meal’s totals and disclosure into the original analysis comment. The later correction reply remains unchanged.

If a later recompute removes or changes that approximation, only the original comment is refreshed; the correction reply still names the previous source.

This both rewrites the original analysis with a later revision’s totals and leaves conflicting source disclosures in the thread. The ownership fence protects which job can write, but it does not identify which meal revision the summary describes.

Suggested fix: associate the authoritative summary with a meal revision, or keep a dedicated current-summary field separate from historical comments. If the intended design is to mutate a comment, resolve and validate the comment belonging to the current revision rather than always selecting the first model comment.

Regression test: create an exact initial analysis, add a correction containing an approximation, then recompute through an approximation-to-exact transition. Assert that the current authoritative disclosure is cleared and that the original analysis comment retains its original revision’s totals.

Validation and remaining coverage

I inspected the full 17-file diff and the surrounding recompute, nutrition normalization/rescaling, persistence, wording-check, and leftovers paths.

The provenance changes look internally consistent for ordinary copies and portion rescaling: metadata travels on nutrient entries, and disclosure checks the metadata’s sourceRef against the stored source_ref.

The added database regression exercises ownership, retries, rollback, and approximation-to-exact transitions, but its fixture has only one model comment. It therefore cannot catch the multi-comment issue above.

I did not execute the application or database tests. The GitHub check-runs response showed only a successful Vercel Preview Comments check—not a completed application test suite. The test and smoke results in the PR description remain author-reported.

No comments or reviews were posted to GitHub.

Show me a SQL fix for the RPC function
How should recompute handle correction replies
Draft a review comment for this finding
Check the rest of the migration file
Run a quick check on safeSummary usage
⠼
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol