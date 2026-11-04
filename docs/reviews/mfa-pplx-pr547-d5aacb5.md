Head at submission: d5aacb50d326506ef414ac36a5788bc10423dce4
Model proof: model_preference = gemini38flash
Elapsed since Enter: 94.7s
Elapsed since tab open: 120.2s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/547

Answer
Links
Images
Share
10:45 PM

code review
 aibraincoach/my-food-ai#547

Finished
31s
Review result

I reviewed PR #547 at commit d5aacb5. The application change looks correct: it tries nutrient 2000 before 1063, and excludes 1063 from duplicate micronutrient rows. I found one rollback correctness issue worth fixing before relying on the migration’s stated edit-preservation guarantee.

P2 — Rollback can erase a subsequent edit that has the same sugar value

Location: supabase/rollbacks/0050_sugar_total_backfill.down.sql, lines 2–5.

The rollback identifies untouched backfills solely by comparing the current sugar value with the recorded backfill:

sql
where n.post_item_id = b.post_item_id
  and n.sugar_g = b.applied_sugar_g;

That checks value equality, not whether the row has been edited since migration. For example:

Migration fills a missing sugar value with 4.275.

A later correction or nutrition recomputation independently writes 4.275 to that same row.

Rollback sees an equal value and clears it to NULL, even though it is now a subsequent write.

An edit from 4.275 to another value and then back to 4.275 has the same problem. The current integration test only changes sugar to 6, so it does not exercise this case.

Recommended fix: use a reliable write-version or provenance marker to identify whether the backfilled value remains untouched. Alternatively, explicitly narrow the rollback contract to “preserves values that differ from the backfill,” rather than claiming it preserves subsequent edits generally. Add a test for a same-value subsequent write.

What looks sound

Precedence is explicit. nutrientValue() iterates [2000, 1063] in that order, so input nutrient ordering does not override the preference for 2000.

The backfill is conservative. It requires missing sugar, present calories, portion-basis 1063 in grams, and no 2000 record; it updates only sugar_g.

The ledger protects pre-existing equal values. Only newly recorded rows feed the update, and the test includes a pre-existing 4.275 value that must survive rollback.

Client access is restricted. The migration enables RLS and revokes ledger access from public, anon, and authenticated.

These observations come from the
 #547 — PR’s changed files (diff).

Validation limits

This was a static review; I did not execute the tests or apply the migration. The PR description reports passing scaling, table, migration, and TypeScript checks. The GitHub check-runs response exposed only a

⠼
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash
GPT-6.1 Sol
