Head at submission: 228b7335a93d22b70f147c7b2bab6de548a243fd
Model proof: model_preference = gemini38flash
Elapsed since Enter: 38.1s
Elapsed since tab open: 44.4s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/674

Answer
Links
Images
Share
4:58 PM

code review 
 aibraincoach/my-food-ai#674

Finished
21s
Review: PR #674

Verdict: One P2 issue remains in the retry/polling fix. I would address it before merging.

Reviewed head commit 228b7335a93d22b70f147c7b2bab6de548a243fd, including both changed components and the retry endpoint/helper.

P2 — An in-flight read can cancel the restarted retry polling

Location: src/components/Thread.tsx:74, interacting with load() at lines 27–43.

The new retry handler calls setWaiting(true) and then wake.current(), but load() immediately returns when another read is already in flight. That older read can subsequently overwrite the optimistic waiting state with a stale failed status.

A possible sequence:

A thread refresh reads the post while its status is still failed, but its response is delayed.

The user retries. The endpoint queues the job, updates the post to queued, and returns successfully.

The retry handler sets waiting=true, but its call to wake.current() is discarded because inFlight is still true.

The older read finishes with failed, setting waiting=false and restoring the failure message.

The polling effect stops because it depends on waiting.

This can leave the thread stuck in the failed state until another comment event or remount. The thread subscribes to comment changes, not post-status changes, so retry transitions alone do not guarantee recovery. router.refresh() is not a substitute for ensuring the thread performs a fresh read.

Suggested fix: Coalesce wake requests instead of dropping them. If load() is already running, record that another read is required and run it after the current request completes, while the effect is still live. RealtimePost already uses an again flag for this pattern.

Regression test: Hold an existing load’s stale failed response, complete a successful retry, then release the stale response. Verify that a subsequent read occurs, observes queued/processing, and keeps polling active until completion.

Other observations

The new model-comment detection refreshes on the initial load whenever historical model replies exist, because modelIds starts empty. That causes an unnecessary route refresh when opening an existing thread. Consider seeding the baseline on the first successful load and refreshing only for subsequently discovered model IDs. This is an efficiency concern, not a blocker.

The visibility/focus change in RealtimePost now explicitly refreshes settled posts on return, rather than only restarting polling. I found no blocking issue in that change.

Validation limits

This was a static review; I did not execute the application or tests. The returned GitHub check runs showed one successful check, Vercel Preview Comments; that does not establish test, type-check, or build coverage. No review or comments were posted to GitHub.

Automated code review: PR #674 security audit, style compliance, and performance bottlenecks
Computer
Show me a code fix for this P2 issue
How do I check the CI test coverage for this PR
Post this code review as a comment on PR 674
Check the rest of the PR files for other bugs
⠹
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol