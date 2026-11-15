Triage by coder, head c42c35bf98776644b0b33e2a0818d822ca005673, model Gemini 4 Hydrogen (request proof and footer agree).
1. Hard failure on non-critical trace lookup: openFailureError throws and breaks the whole detail page — Real (verified line 147).
2. Sequential model_calls query after hydration instead of parallel — Real (minor, verified).
3. Stale src if photo props change without remount when no previewUrl — Real (minor, verified useState init + early return).
Real findings: 3
