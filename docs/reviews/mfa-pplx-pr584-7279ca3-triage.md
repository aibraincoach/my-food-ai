Triage by coder, head 7279ca386f43fcf1451cc3716d572cb2d5d73a69, model Gemini 4 Hydrogen (request proof and footer agree).
1. Inline style height beats desktop:h-auto; layout depends on !important globals — Real (verified line 497).
2. Short-screen overflow below ~436px with overflow hidden — Real (structural math verified).
3. Width mismatch below 1008px (hardcoded 600+360) — Real (minor, verified values).
4. Dead readFile import and unused fill() in the verification script — Real (verified: one self-reference only).
5. Admin role promotion without finally-guaranteed demotion — Real (verified lines 42-43).
6. Hardcoded pause() timeouts instead of until() conditions — Real (minor, test flakiness).
Real findings: 6
