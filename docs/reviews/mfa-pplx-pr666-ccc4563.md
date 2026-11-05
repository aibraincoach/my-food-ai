Head at submission: ccc45636621c0dba35fb1d513ee0be006da4c563
Model proof: model_preference = gemini38flash
Elapsed since Enter: 39.5s
Elapsed since tab open: 47.6s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/666

Answer
Links
Images
Share
5:42 PM

code review 
 aibraincoach/my-food-ai#666

Finished
20s
Review verdict

Changes requested for PR #666, fix18: needs-input discovery poll, at commit ccc4563. I found two reliability gaps in the polling lifecycle. The change is narrowly scoped to src/components/NeedsInputStrip.tsx.

Findings
1. [P2] Authentication transitions can leave discovery permanently stopped

Location: src/components/NeedsInputStrip.tsx, auth callback at lines 23–29 and early returns at lines 40–41.

The new discovery timer is scheduled only when a read reaches a success path or throws. Two normal return paths bypass scheduling:

tsx
if (!live || generation !== authGeneration) return;
if (!session) {
  if (live) { setPosts([]); hasPending = false; }
  return;
}

The authentication callback clears account-specific state but neither refreshes nor schedules another poll.

A reproducible sequence is:

Mount the component without a session.

The initial refresh() returns without scheduling a timer.

Sign in while the component remains mounted.

The auth callback updates owner, but no read or discovery timer starts.

Discovery then depends on a later focus/visibility event or a remount. Similarly, an auth-generation change while getSession() is pending can terminate an already-consumed polling cycle.

Suggested fix: make authenticated account changes restart discovery, and ensure an obsolete request cannot consume the only scheduled retry. Centralizing rescheduling in finally, after releasing busy, would make the lifecycle easier to guarantee; retain the appropriate live/visibility/session guards.

Regression test: mount without a session, resolve the initial read, emit a signed-in session without focus or visibility events, and verify that discovery resumes.

2. [P2] Failed reads retry indefinitely without increasing backoff

Location: src/components/NeedsInputStrip.tsx, line 76.

The new catch block schedules retries, but it never increases pollBackoffMs:

tsx
catch {
  if (live) schedulePoll();
}

When the strip already has pending questions and the backoff is still at its initial value, repeated failures produce a request approximately every two seconds, plus request duration. The exponential backoff only advances on successful poll processing, so it never helps during the failure sequence it should protect against.

For example: load a pending question successfully, then make subsequent reads reject immediately. The timer remains at two seconds indefinitely instead of progressing toward the 30-second cap.

Suggested fix: advance a bounded failure backoff before scheduling a retry. Keep failure retries distinct from the 60-second empty-state discovery interval if faster recovery is intentional.

Regression test: load a pending question, reject successive reads, and verify increasing retry intervals capped at the configured maximum.

Validation and scope

Reviewed the complete changed component, the diff, and the readNeedsInput helper.

No automated tests were added in this PR.

The returned check-run list contains only a successful “Vercel Preview Comments” check; it does not establish that component tests, linting, or type checking passed.

This was a static review; I did not execute the application or tests, and I have not posted anything to GitHub.

Show me the suggested fix for the auth transition bug
How should I handle failed reads to avoid infinite retry
Show me the updated component code for NeedsInputStrip.tsx
Draft a reply comment for this pull request review
What tests should I add for this polling lifecycle
⠼
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol