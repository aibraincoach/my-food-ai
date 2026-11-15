Triage by coder, head 9c04984bc4a5de80edb98f264b55795c0fe44178, model Gemini 4 Hydrogen (request proof and footer agree).
1. renderInventory embeds HEAD short hash so --check fails after every commit — Real (matches #659's confirmed finding).
2. BANNED list duplicated between wording-check.ts and the inventory script — Real (verified identical lists, comment-only sync).
3. Unsafe CLI parsing passes undefined to resolve() when a flag has no value — Real (minor, verified lines 197-198).
4. Single-word dynamic/ternary attributes dropped by isCandidate — Real (minor, verified lines 121-124 + 70).
5. isCandidate rejects @-containing strings, dropping emails/handles — Real (minor, verified line 72).
6. No tests for bannedHits, renderInventory, template interpolation, --check — Real (minor; test file covers only extraction basics).
Real findings: 6
