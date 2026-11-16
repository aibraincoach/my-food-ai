Reviewer: Gemini 4 Hydrogen via Perplexity (PPLX); version reviewed: eadbdc83a9206ef8559a0ac33fbd911c49881862
Head reviewed: eadbdc83a9206ef8559a0ac33fbd911c49881862
Model proof: model_preference = gemini4hydrogen; picker = Gemini 4 Hydrogen; completed answer footer = Gemini 4 Hydrogen
Thread: https://www.perplexity.ai/session/aefc2fff-6765-495e-b45c-1f93d43d889f
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/916
Completion re-inspected: 2026-11-15T13:58:37.863014+00:00; answer Copy/Helpful controls present; Stop response absent.
Evidence note: complete recapture of the same live thread supersedes the runner's earlier truncated capture; no resubmission.

Answer
Links
Images
Share
6:53 AM

code review 
 aibraincoach/my-food-ai#916

Finished
19s

PR #916 (fix: Fleet 21 feed-reread (plan PR 9)) is a clean, minimal fix that stops finished feed cards from re-fetching themselves on initial mount. The code change in src/components/RealtimePost.tsx is sound, though the manual /api/feed request-count verification and 390px page-look check noted in the PR description are still pending before merge.

Summary of the change

In src/components/RealtimePost.tsx, the mount-time void refresh(); call is now gated behind if (needsPolling()) void refresh();. Previously, every mounted RealtimePost triggered getPostCard, which batched into a /api/feed?ids=… request even when the server had already rendered a settled card.

Correctness and edge cases

Settled cards on mount: needsPolling() evaluates !isSettled(post.status) || awaitingCard || awaitingItems. For a finished meal with a rendered card and no unavailable fields, both refresh() on mount and schedulePoll() are skipped.

Unfinished or partial cards: Posts that are still processing, missing their card slide (awaitingCard), or missing item fields (awaitingItems) still call refresh() immediately on mount and continue polling with backoff.

Live updates preserved: Supabase postgres_changes (UPDATE and DELETE), custom window events (media-removed and correction-reverted), and visibilitychange / focus handlers remain wired up for all cards.

Race window trade-off: As noted in the PR description, if a finished meal is edited in the brief window between SSR and the Supabase channel subscription completing, the card will display the SSR snapshot until the next focus, event, or database change.

Verification status

CI checks: The Vercel Preview Comments check completed with success.

Pending manual checks: The PR description still requires recording the cold Home open /api/feed request counts (main vs. fix21/feed-reread) and verifying the 390px Home view with fixtures F1 and F3.

Draft a comment summarizing the review for PR 916
Show me the code diff for src/components/RealtimePost.tsx
What tests should I run to verify the 390px view
How does needsPolling handle edge cases for F1 and F3
Draft a review approval with the remaining manual checks
⠴
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen
