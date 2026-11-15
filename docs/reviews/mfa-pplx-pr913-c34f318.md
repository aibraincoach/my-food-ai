Reviewer: Gemini 4 Hydrogen via Perplexity (PPLX); version reviewed: c34f31826af004165ca0a3c8157ebb94679505c8
Head reviewed: c34f31826af004165ca0a3c8157ebb94679505c8
Model proof: model_preference = gemini4hydrogen; picker = Gemini 4 Hydrogen; completed answer footer = Gemini 4 Hydrogen
Thread: https://www.perplexity.ai/session/ff7bad71-236a-4337-b2e3-e4791d85e849
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/913
Completion re-inspected: 2026-11-15T13:58:31.757705+00:00; answer Copy/Helpful controls present; Stop response absent.
Evidence note: complete recapture of the same live thread supersedes the runner's earlier truncated capture; no resubmission.

Answer
Links
Images
Share
6:52 AM

code review 
 aibraincoach/my-food-ai#913

Finished
14s

PR #913 (fix: Fleet 21 test-setup (plan PR 6)) looks solid overall and is safe to approve with one minor UX improvement suggested in PostActions.tsx. The changes cleanly move bookmark refusal messages inline under each post's action row, update the bookmark styling and aria-label, and align the test runner and unit test stubs with the current implementation.

Inline bookmark notices (PostActions.tsx & SavedMealListeners.tsx)

Delegated error handling: Removing the save-meal-blocked listener from SavedMealListeners.tsx and handling it locally in PostActions.tsx via notice state prevents the page-wide alert banner from covering failure text or retry controls.

Status handling: PostActions.tsx now immediately refuses needs_input posts with "Answer the question about this meal first. Then it can be saved.", emits "This meal is still being analysed. Save it when it finishes." on the 120-second timeout revert, and keeps the bookmark button styled with text-text at all times.

Minor suggestion (stale notice on retry): In PostActions.tsx, notice is only cleared when save-meal-result fires with !d.failed (or hidden once ready becomes true). If a user hits the 120-second timeout notice and taps the bookmark again to start a new wait, the previous "This meal is still being analysed..." alert remains visible until the meal finishes. Calling setNotice('') at the start of save() (or inside starting) would clear the old message immediately on retry.

Test runner & test suites

scripts/test.mjs: Filtering process.argv.slice(2) for .test.mjs arguments is a clean, backwards-compatible way to run targeted test files while preserving the default directory scan when no file is specified.

tests/profile-avatar.test.mjs: Adding getClaims() to the mock auth client properly unblocks the avatar route tests.

tests/save-meal-readiness.test.mjs: The updated harness (setTimeout/clearTimeout stubs, usePostAuthor mock, and blocked event tracking) accurately covers the new needs_input, failed, queued/processing wait-for-ready, and unsave-when-failed flows. Note that because useState and useEffect are stubbed as no-ops in this harness, the tests verify the dispatched save-meal-blocked events rather than the rendered <p role="alert"> element itself.

Show me the suggested fix for PostActions tsx
Draft a PR comment for this review
Explain how the test stub harness works
Check the remaining plans in Fleet 21
Show me the full code review breakdown
⠙
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen
