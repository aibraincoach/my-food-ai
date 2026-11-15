Triage by coder, head 8c3707a6d7afd455c5022d6992ce169aec49c52e, model Gemini 4 Hydrogen (request proof and footer agree).
1. Unhandled rejection: the losing persist() promise has no .catch, so a post-700ms failure rejects unobserved — Real (verified).
2. Durability tradeoff (700ms success before persist lands) — Not real (explicit, documented design tradeoff).
3. Unstarted 700ms timer cleanup — Not real (negligible; fires once, harmless).
4. CDP send timeout never cleared on response (BiDi clears its timer; CDP relies on a has() guard so it fires as a no-op) — Real (trivial, verified).
5. Fragile __fixturePostIds[0] under concurrent posts (hook dedupes by id, but a second post would still pollute index 0) — Cannot tell (timing-dependent, test-only).
Real findings: 2 (items 1, 4)
