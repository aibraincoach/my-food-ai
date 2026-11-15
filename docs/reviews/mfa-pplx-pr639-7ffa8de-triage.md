Triage by coder, head 7ffa8dec94210837f403917614f09dfed49e34ce, model Gemini 4 Hydrogen (request proof and footer agree).
1. Whether cacheHeaders needs Vary for signed URLs — Cannot tell (not assessed; redirect is no-store).
2. Catch swallows errors without rescheduling; polling halts until visibility change/remount — Real (verified, line 73 and empty catch in refresh).
3. No Realtime subscription and hasPending gate: new needs_input never appears until remount — Real (verified, no channel subscription).
4. visible() calls schedulePoll() instead of refresh(): up to 30s wait on tab return — Real (verified).
5. Overlapping backoff (cardPolling.next 2s/15s alongside pollBackoffMs) — Real (minor, verified dual mechanism; works, harder to reason about).
6. Closure/stale-state on needsPolling — Not real (effect deps [initial, post.status, awaitingCard, awaitingItems] cover the reads).
Real findings: 4 (items 2,3,4,5)
