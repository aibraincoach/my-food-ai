Head at submission: b6d313496ca879a8c0f9af23aa42de5b9f9b8a83
Model proof: model_preference = gemini38flash
Elapsed since Enter: 33.7s
Elapsed since tab open: 40.3s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/666

Answer
Links
Images
Share
5:22 PM

code review 
 aibraincoach/my-food-ai#666

Finished
17s
Review verdict

Changes requested. PR #666’s idle-discovery loop stops after an unchanged empty result, so it does not reliably discover questions created later.

Reviewed head: b6d313496ca879a8c0f9af23aa42de5b9f9b8a83, including the diff and full NeedsInputStrip.tsx.

Finding
P1 — Re-arm the timer when an empty discovery poll returns unchanged data

Location: src/components/NeedsInputStrip.tsx, lines 52–55, interacting with the modified schedulePoll().

The existing unchanged-result branch is:

tsx
if(identity === lastQuestions && (!auxiliaryFailed || Date.now()<mediaRetryAt)) {
  hasPending = questions.length > 0 || auxiliaryFailed;
  if (fromPoll && hasPending) {
    pollBackoffMs = Math.min(pollBackoffMs * 2, POLL_MAX_MS);
    schedulePoll();
  }
  return;
}

The new scheduler supports hasPending === false, but this branch still calls it only when hasPending is true. Consequently:

The initial read returns no questions and schedules a 60-second discovery timer.

That timer fires and again finds no questions.

identity === lastQuestions is true, and hasPending is false.

The function returns without scheduling another timer.

Questions created afterward remain undiscovered until a focus/visibility event or remount triggers another read.

This also occurs after existing questions disappear: once the empty result becomes unchanged, background discovery stops.

Suggested correction:

tsx
if (
  identity === lastQuestions &&
  (!auxiliaryFailed || Date.now() < mediaRetryAt)
) {
  hasPending = questions.length > 0 || auxiliaryFailed;

  if (fromPoll && hasPending) {
    pollBackoffMs = Math.min(pollBackoffMs * 2, POLL_MAX_MS);
  }

  schedulePoll();
  return;
}

The same scheduling invariant needs attention on the !session early return: a timer-driven signed-out read currently consumes the timer without replacing it, and the auth-state callback does not initiate a refresh on later sign-in.

Source: reviewed component at the PR head.

Tests to add before merging

Use fake timers and mocked database responses to verify:

Repeated empty responses continue polling across at least three 60-second intervals.

A question appearing after multiple empty intervals is discovered without focus or visibility events.

Transitioning from pending questions to an empty list preserves idle polling.

Signing in after an initial signed-out read resumes discovery.

Failed reads retry, while hidden tabs and unmounted components do not continue polling.

Validation limits

This was a static review; I did not execute the application or tests. GitHub returned one successful check, “Vercel Preview Comments,” which does not establish behavioral test coverage. No review or comments were posted to GitHub.

Show me the code fix for this P1 issue
Draft a response comment for this PR review
Check the rest of NeedsInputStrip.tsx for issues
What about the auxiliaryFailed branch mentioned below
How does schedulePoll handle backoff here
⠼
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol