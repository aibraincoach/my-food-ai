Triage reviewer: coder; head 06817fad25b1b1c0d1af55625292a1d86480c4dc, Gemini 3.8 Flash via PPLX.

1. Real robustness gap — effect recreation could discard in-flight per-post save locks. Saving set and Log-again request version now live in refs; malformed event ids are rejected before use. Regular rerenders did not recreate the [router] effect, but the stronger lifetime guard is warranted.
2. Not real — the original source already encloses both date and time parsing in if(mode!=='now'). The default Now path leaves its Date intact. Posting stays disabled during loading.
3. Not real — the failed result explicitly carries the authoritative previous saved-meal id. The helper receives that id as its previous state, so rollback restores the correct icon; passing the optimistic ref as previous would instead retain a pending-save marker. The failed boolean is now explicit for clarity. Built browser failure tests already proved rollback.
4. Not real — pathname is a lexical constant captured by the async handler; React rerender does not mutate that closure. The failure therefore restores the original detail path.
5. Not real blocker — existing cross-component event architecture is preserved rather than introducing a new state-management dependency in this scoped change.

Real findings: 1; fixed. Build/TypeScript/scoped lint pass; all 8 selected tests pass. Same-reviewer confirmation follows.
