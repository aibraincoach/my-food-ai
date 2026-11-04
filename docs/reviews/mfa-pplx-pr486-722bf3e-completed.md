Head reviewed: 722bf3e76e6c22e0f0b658da0ff5709fab9d5422
Thread: https://www.perplexity.ai/search/507d09ff-593f-4c75-a789-eb122aede01e
Original request model proof: gemini38flash
Observed selected/footer model: Gemini 3.8 Flash
Observation resumed without resubmission after runner deadline.

Answer
Links
Images
Share
Continued from
code review https://github.com/aibraincoach/my-food-ai/pull/486
5:27 PM

Confirm the fixes to your PR #486 review at the new exact head 722bf3e76e6c22e0f0b658da0ff5709fab9d5422 (Vercel succeeded). The Today display now excludes hydrated alcoholG=0 sentinel rows and explicitly says alcohol unavailable, rather than displaying the database minimum1 as measured grams. The owner Fleet11 plan explicitly requires storing amount1 for unknown alcohol, the alcohol-first summary, and deleting alcohol rows in rollback; those are intended contract choices, not accidental code behavior. The bounded100-ID nutrition reads preserve caffeine independently of alcohol grams. Verify the actual new source/diff and whether your functional findings remain. Treat formatting suggestions as nonblocking when lint/build pass. State BLOCKERS: NONE plus the full new SHA if there is no actual blocking defect; otherwise name the remaining concrete blocker. Same-reviewer fix confirmation only.

Read more
Finished
12s
Review Verification

The fix commit 722bf3e76e6c22e0f0b658da0ff5709fab9d5422 ("fix: show unavailable alcohol without counting the storage sentinel") updates src/components/IntakeSheet.tsx:

Storage Sentinel Exclusion:

typescript
const alcohol = rows.reduce(
  (total, row) => total + (row.kind === "alcohol" && (row.alcoholG ?? 0) > 0 ? row.amount : 0),
  0
);

Rows with alcoholG = 0 (or undefined) now evaluate (row.alcoholG ?? 0) > 0 to false. The database constraint minimum amount = 1 sentinel is no longer accumulated into measured alcohol grams.

Unavailable Label:

typescript
const alcoholUnavailable = rows.some(
  row => row.kind === "alcohol" && !(row.alcoholG! > 0)
);

The header display appends · alcohol unavailable when unmeasured alcoholic items are present rather than attributing phantom grams to the user's daily total.

Confirmed Contract Intent:

Storing amount: 1 as the minimum sentinel for unknown alcohol rows satisfies the database check constraint amount between 1 and 500.

The alcohol-first summary line and deleting alcohol rows during rollback migrations match the Fleet 11 specification.

Bounded 100-ID reads in withAlcoholNutrition preserve caffeine values independently of alcohol gram calculations.

With lint, formatting, and Vercel build passing, there are no remaining functional defects or blockers.

BLOCKERS: NONE
HEAD SHA: 722bf3e76e6c22e0f0b658da0ff5709fab9d5422

Merge this pull request
Check remaining git status
Run tests locally
Generate release notes
Review another pull request
You're incognito. Follow-ups will create a fork.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash