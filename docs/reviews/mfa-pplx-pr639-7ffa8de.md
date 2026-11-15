Head at submission: 7ffa8dec94210837f403917614f09dfed49e34ce
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 24.8s
Elapsed since tab open: 28.3s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/639

Answer
Links
Images
Share
11:09 AM

code review 
 aibraincoach/my-food-ai#639

Finished
14s

PR #639 (run18/quiet) replaces fixed 2-second setInterval polling in NeedsInputStrip and RealtimePost with visibility-aware exponential backoff (2s → 30s) and adds immutable cache headers to the feed media 302 redirect . The PR is already merged , so the points below focus on potential edge cases for follow-up.

Feed Media Redirect

In src/app/api/media/feed/[owner]/[post]/[media]/[variant]/route.ts, swapping headers for cacheHeaders on the 302 response is clean and minimal . Ensure cacheHeaders includes Vary or appropriate Cache-Control directives if the signed URL or authorization depends on request headers.

NeedsInputStrip Polling

src/components/NeedsInputStrip.tsx now stops polling when hasPending is false and backs off from 2s to 30s when idle .

Polling stops permanently on network errors: The catch block swallows errors without calling schedulePoll(), so a transient network failure during a pending poll halts polling until the tab's visibility changes .

No recovery when new questions arrive: Because NeedsInputStrip has no Realtime subscription and stops polling once hasPending becomes false, newly created needs_input posts will not appear until the component remounts .

Delayed refresh on tab focus: visible() calls schedulePoll() instead of refresh(), which forces a returning user to wait up to pollBackoffMs (30s) before seeing updated questions .

RealtimePost Polling

src/components/RealtimePost.tsx converts setInterval to setTimeout backoff and resets pollBackoffMs on Realtime UPDATE events and custom window events (media-removed, correction-reverted) .

Delayed refresh on tab return: Changing visible() from void refresh() to schedulePoll() removes the immediate fresh read when a user returns to the tab, delaying updates by up to 30s .

Overlapping backoff mechanisms: In schedulePoll(), the awaitingCard && !awaitingItems branch manages state.next (2s or 15s) alongside pollBackoffMs (2s → 30s), making the effective cadence harder to reason about .

Closure freshness: needsPolling() reads post.status, awaitingCard, and awaitingItems from the render closure ; ensure those values are in the useEffect dependency array so schedulePoll() does not evaluate stale state.

Show me a fix for the polling network error edge case
How can I update the useEffect dependency array here
Write a follow up PR description for these issues
Check the rest of the PR files for similar patterns
Review the backoff logic implementation details
Sources
⠸
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen