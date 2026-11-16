Head at submission: 5738da3a01c3c34cc06c7c285caeaef8ed8c4b55
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 27.6s
Elapsed since tab open: 34.0s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/916

Answer
Links
Images
Share
9:05 PM

code review 
 aibraincoach/my-food-ai#916

Finished
16s

PR #916 (fix21/feed-reread) cleanly eliminates redundant /api/feed?ids= mount reads on settled Home cards while preserving repair reads for revision-inconsistent cards and preventing off-page meals from triggering false-positive discovery. The changes are well-scoped, backed by targeted unit tests, and ready to merge once the team's required checks and PM merge order are satisfied.

What Works Well

Conditional mount refresh (src/components/RealtimePost.tsx): Guarding the initial refresh() call with if (needsPolling()) stops already-complete SSR cards from re-fetching themselves on mount, while keeping realtime postgres_changes, focus, and custom event listeners active.

Revision-fence repair (src/lib/posts/feed.ts): Adding revisionUnavailable to FeedPost and hasUnavailableFields() ensures that if toFeedPost or toFeedPosts detects a revision mismatch between before and after (or a failed bulk revision RPC returning null), the card is flagged as unavailable and automatically repairs itself on the client. Genuinely empty ready meals (null revision before and after) are not penalized with extra polling.

Shared discovery query (src/lib/posts/feed.ts, src/components/Feed.tsx): Extracting readFeedDiscovery into feed.ts removes query duplication, adds an 8-second AbortSignal.timeout, and includes .is("deleted_at", null), which was previously missing from the inline discovery query in Feed.tsx.

Off-page discovery filtering (src/lib/posts/feed.ts, src/components/Feed.tsx): Recording discoveryKnown from getFeed when before === null && limit < FEED_PAGE_SIZE prevents older meals outside the 6-card Home window from being treated as newly posted on focus/discovery ticks.

Potential Risks and Edge Cases

Serial round-trip on short initial loads (src/lib/posts/feed.ts): getFeed awaits readFeedDiscovery before executing the main posts query whenever before === null && limit < FEED_PAGE_SIZE. While intentional to guarantee that transactions committed after the ID snapshot remain discoverable, it adds one sequential database round-trip to initial Home SSR/API loads.

Structural equality via JSON.stringify (src/lib/posts/feed.ts): toFeedPost and toFeedPosts compare before and after revisions using JSON.stringify. This is safe for the current { modelCommentId, fingerprint } shape returned by the RPC, but would become fragile if future fields are added with non-deterministic key ordering.

Test Coverage

Component polling (tests/card-polling.test.mjs): Verifies that complete ready cards make 0 mount/poll reads over 15s, revisionUnavailable cards trigger mount and repair reads, and genuinely empty ready cards do not poll.

Revision availability (tests/feed-revision-availability.test.mjs, tests/feedback-revision.test.mjs): Covers both toFeedPosts and getPostCard under revision races and 503 RPC failures.

Discovery window (tests/feed-cache-lifecycle.test.mjs, tests/feed-pagination.test.mjs, tests/feed-removal.test.mjs): Confirms discoveryIds is captured before the meal snapshot, older off-page meals are skipped, and newly committed back-dated meals are still discovered.

Show me the code changes for RealtimePost.tsx
Are there any edge cases with revisionUnavailable
Summarize the test coverage for this PR
Show me the security implications of this PR
What did the review miss or leave out
Sources
⠋
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen