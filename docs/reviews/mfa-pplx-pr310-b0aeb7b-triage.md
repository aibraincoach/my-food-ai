# PR #310 review triage

External reviewer: Gemini 3.8 Flash through Perplexity (PPLX).
Reviewed head: `b0aeb7bec4dc2d015407b46e2fe42cc32f1a15c0`.
Capture: [mfa-pplx-pr310-b0aeb7b.md](mfa-pplx-pr310-b0aeb7b.md).
Triage: coder, against the exact submitted source and the cache/privacy test outcomes.

1. **Not real — MessagePort transfer/source check.** `SignOutButton.tsx` explicitly passes `[channel.port2]` as the second `controller.postMessage` argument. The service worker replies on `event.ports[0]`, which is that transferred port, and the page listens on its paired `port1`. This is the expected MessageChannel pairing. The message can only clear optional cached data; it grants no account or storage access. The 1500 ms timer bounds an absent acknowledgement. No missing transfer was identified in the reviewed code.
2. **Not real — unbounded eviction/OOM.** Writes are serialized and every successful write trims to 300 entries. Enumeration therefore holds at most 301 keys per write, not a growing cache. Cache-operation failures are caught and do not fail the network image. The actual worker test writes 302 distinct paths and verifies the 300-entry cap and oldest-entry eviction. Further profiling could assess optimization, but the capture supplies no measured bottleneck or unbounded allocation.
3. **Not real — `void userId` in the generation memo.** This makes the account dependency explicit: a fresh account captures a new reset generation, while ordinary cache writes/rerenders retain the original authenticated mount's generation. Refreshing that token on every render after logout would revive callbacks that must stay invalid. The expression is a readability preference, not a behavioral failure; changed-file ESLint passes.
4. **Not real — explicit 1080 × 1080 dimensions.** The dispatched plan requires these dimensions. The image is in a square `aspect-square` container with `object-cover`, and this PR introduces no responsive `srcset`. A hypothetical future responsive-image change does not establish a current layout-shift defect.

The external answer recommends approval with minor follow-ups. No source change follows from these findings. The capture and triage are added as documentation; the same reviewer is asked to confirm `BLOCKERS: NONE` on the resulting exact head.

Real findings: 0
