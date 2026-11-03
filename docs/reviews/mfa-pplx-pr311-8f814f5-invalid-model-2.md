# INVALID REVIEW ATTEMPT — wrong actual answer model

Requested Gemini3.8Flash; captured answer footer identifies GPT-6.1 Sol. This is not an eligible external review or approval. Original capture follows unchanged.

Head at submission: 8f814f54fbfef039aa48e9626cdca53a910db8f1
Model proof: model_preference = gemini38flash
Elapsed since Enter: 45.5s
Elapsed since tab open: 52.6s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/311

Answer
Links
Images
Share
6:04 PM

code review
 aibraincoach/my-food-ai#311

Finished
19s
Review verdict

Changes requested. I found three correctness issues in PR #311’s feed-loading and refresh logic that I would fix before merging.

Reviewed head: 8f814f54fbfef039aa48e9626cdca53a910db8f1. This was a static review of the PR diff and related code; I did not execute the application or tests.

Findings
1. P1 — Partial day-total refreshes invalidate unrelated days’ results

Location: src/components/Feed.tsx — refreshTotals()

The change narrows each refresh to its touched dates, but retains one global totalsGeneration:

ts
const version = ++totalsGeneration;
const days = await getDayTotals(supabase, userId, zone, dates);
if (!live || version !== totalsGeneration) return;

That generation check worked when each request refreshed the complete relevant date set. With partial requests, a newer request no longer supersedes all the data in an older one.

Reproduction:

An update to Monday’s meal starts refreshTotals(["Monday"]).

Before it completes, an update to Tuesday’s meal starts refreshTotals(["Tuesday"]).

Monday’s response is discarded because Tuesday incremented the global generation.

Tuesday’s response updates only Tuesday, leaving Monday stale.

This also affects concurrent deletions and backdated uploads. There is no guaranteed subsequent event to repair the discarded day.

Suggested fix: track request versions per date, or accumulate dirty dates and drain them through a serialized/coalesced refresh queue.

Regression test: start two requests for disjoint days, resolve them in both orders, and verify both totals update.

2. P2 — Failed optional reads overwrite good card data with empty values

Location: src/lib/posts/feed.ts — toFeedPosts(), especially its use by getPostCards()

Optional-read failures are converted into successful-looking empty values:

Nutrition failure → items: []

Media/signing failure → empty or missing slides

Saved-state failure → saved_meal_id: null

This is reasonable as a last-resort initial rendering strategy, but the same representation is now used for browser card refreshes. RealtimePost.refresh() treats the returned card as authoritative and replaces its existing snapshot.

Consequently, a transient auxiliary failure can erase already-visible nutrition, photos, or saved state. For a settled meal, automatic polling can then stop: a ready post with items: [] does not satisfy awaitingCard, so missing nutrition may remain until another focus or realtime event.

Suggested fix: distinguish “successfully read and empty” from “read failed.” Preserve the previous value for failed families during refreshes, or reject an incomplete refresh so the existing card remains visible. Initial-page fallback can still tolerate unavailable families.

Regression test: render a complete settled card, fail each auxiliary family during refresh, and assert that its previous successful fields remain visible.

3. P2 — Unchanged questions bypass signed-thumbnail renewal indefinitely

Location: src/components/NeedsInputStrip.tsx — refresh()

The unchanged-question shortcut runs before checking signed URL expiry:

ts
const identity = JSON.stringify(questions);
if (identity === lastQuestions) return;

Although cached signing entries have an until timestamp, unchanged questions never reach the code that evaluates it. A question can therefore retain the same one-hour signed URL for the entire component lifetime.

If a clarification remains unanswered long enough, a later image reload can use an expired URL. The two-second polling loop will not repair it because the question identity remains unchanged.

A related failure path exists when batch signing returns HTTP 200 with per-object errors: signingFailed remains false, lastQuestions is recorded, and unchanged polls do not retry the missing thumbnails.

Suggested fix: skip media/signing work only when question identity is unchanged and all required thumbnail capabilities are still valid. Treat per-object signing errors as retryable failures.

Regression tests:

Advance time beyond the renewal threshold with unchanged questions and verify another signing call.

Return a per-object signing error in an otherwise successful response and verify the next poll retries it.

Validation and merge readiness

The returned GitHub checks contain only one successful check, Vercel Preview Comments; that does not establish that a build or test suite passed. The PR description reports targeted test, lint, and TypeScript successes, while broader preview and physical-phone evidence remain pending.

Before merging, I would require the three regression tests above, plus a browser test covering a cached reopen followed by a failed fresh-page request. That path is central to this PR’s stated behavior and is not established by the added batching tests.

No review comments were posted and no repository state was changed.

Show me a fix for the first issue
How would I write the regression test for P1
Let's look at the second finding in detail
Draft a comment for the PR author about these issues
Check if there are any other files changed in this PR
⠏
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol
