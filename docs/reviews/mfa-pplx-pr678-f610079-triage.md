Triage by coder, head f6100790c28d71826f358f47ce897e524f6eee1a, model Gemini 4 Hydrogen (picker, request proof and footer agree).
1. Conditional hook call: usePostHandle early-returns before useProfileIdentity(seeded) — Real (verified at head; fixed in #680, whose review confirms the reorder).
2. URL.revokeObjectURL before store.remove succeeds, leaving a dead preview URL on rollback — Real (verified pattern; fixed in #680).
Real findings: 2
