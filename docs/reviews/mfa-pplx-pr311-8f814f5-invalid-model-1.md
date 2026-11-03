# INVALID REVIEW ATTEMPT — wrong actual answer model

Requested Gemini3.8Flash; captured answer footer identifies GPT-6.1 Sol. This is not an eligible external review or approval. Original capture follows unchanged.

Head at submission: 8f814f54fbfef039aa48e9626cdca53a910db8f1
Model proof: model_preference = gemini38flash
Elapsed since Enter: 41.3s
Elapsed since tab open: 48.3s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/311

Answer
Links
Images
Share
6:02 PM

code review
 aibraincoach/my-food-ai#311

Finished
15s
Review result

Changes requested. I reviewed PR #311 at head commit 8f814f5 and found three correctness issues worth fixing before merge. This was a static review of the diff and related components; I did not run the app or tests, and I have not posted a review to GitHub.

Findings
1. [P1] Concurrent updates to different days silently discard valid totals

Location: src/components/Feed.tsx, refreshTotals, approximately lines 79–86.

The change narrows totals refreshes to touched dates but retains a single global totalsGeneration:

ts
const version = ++totalsGeneration;
const days = await getDayTotals(supabase, userId, zone, dates);
if (!live || version !== totalsGeneration) return;

That guard worked differently when every refresh covered the full set of displayed dates. With disjoint requests, the latest request no longer supersedes all earlier requests.

Reproduction:

An update to Monday starts refreshTotals(["Monday"]).

An update to Tuesday starts refreshTotals(["Tuesday"]) before Monday completes.

Monday’s successful response is discarded because Tuesday incremented the generation.

Only Tuesday’s total updates; Monday remains stale until another event happens to refresh it.

Moving a meal between days can encounter the same problem if another card refresh overlaps the two-day refresh.

Recommended fix: track request versions per date, or collect dirty dates into a shared queue and drain them without losing dates from superseded requests. Add a test that resolves two disjoint-day requests in both completion orders and verifies both results survive.

2. [P2] A transient nutrition-read failure can permanently erase a settled card’s nutrition

Locations:

src/lib/posts/feed.ts, toFeedPosts, nutrition fallback.

src/components/RealtimePost.tsx, refresh and polling conditions.

The new batched path turns a failed nutrition read into a successful card with items: []:

ts
optionalRead(
  "items",
  () => getCurrentItemsForPosts(db, ready.map(row => row.id)),
  new Map<string, CurrentItem[]>()
)

RealtimePost then accepts that degraded result unconditionally:

ts
setSnapshot({ seed: initial, current: fresh });

For a ready post, an empty item list also makes awaitingCard false:

ts
const awaitingCard =
  post.status === "ready" &&
  post.items.length > 0 &&
  !post.slides.some(slide => slide.kind === "card");

Consequently, one transient items-query failure during the mount refresh can replace a complete server-rendered card with an empty-nutrition snapshot. Because the post is settled and awaitingCard is false, automatic polling stops. Discovery also does not reread IDs already present in the baseline. Recovery then depends on a later focus, visibility, or realtime event.

Recommended fix: distinguish “successfully read an empty item list” from “nutrition unavailable.” Preserve the last good nutrition on partial refresh failures and schedule a bounded retry for missing optional families. Add a regression test starting with a complete ready card, failing the next items request, then recovering without a focus or realtime event.

3. [P2] Unchanged questions never renew expired signed photo URLs

Location: src/components/NeedsInputStrip.tsx, the identity early return.

The refresh exits before checking whether cached signed URLs need renewal:

ts
const identity = JSON.stringify(questions);
if (identity === lastQuestions) return;

The signing cache has an until timestamp, but its expiry check sits after that return. An unanswered question can therefore retain the same photo URL indefinitely while its question data remains unchanged, even though the URL was signed for only 3,600 seconds.

There is a related recovery issue: HTTP 200 signing responses with individual row errors do not set signingFailed. The component records lastQuestions anyway, so missing thumbnails from those partial failures are not retried on subsequent unchanged polls.

Recommended fix: skip media/signing work only when question identity is unchanged and every required photo capability remains valid. Treat per-row signing errors as retryable. Test unchanged questions across URL expiry and a 200 response containing an individual signing error.

Validation before merge

Add these targeted regression cases:

Case	Required outcome
Concurrent totals refreshes for two different dates	Both dates update, regardless of response order
Ready-card refresh with temporarily unavailable nutrition	Existing nutrition stays visible; recovery retries automatically
Unchanged question beyond signed-URL expiry	Its photo URL renews
Batch signing returns one per-object error	The failed photo is retried on a later poll

The PR description reports passing targeted tests, changed-file ESLint, and TypeScript checking, while preview stress tests and physical-phone evidence remain pending. The check-run response I retrieved listed only a successful “Vercel Preview Comments” check; that does not independently verify the reported test or build results.

Source:
 #311 — reviewed changes and validation notes.

Automated code review: deep security audit and architecture check for pull request #311 on aibraincoach/my-food-ai
Computer
Test coverage and refactoring scorecard for pull request #311 on aibraincoach/my-food-ai — linting, smells, and fixes
Computer
Show me the rest of the findings
Draft a review comment for finding one
How should I fix the first finding
⠴
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol
