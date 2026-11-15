Triage by coder, head a605e181112639acf5b4cadcff29c88912d2dbe1, model Gemini 4 Hydrogen (request proof and footer agree).
1. Dead code: void models (line 36) and unused photoRows[0] alias — Real (minor; verified present, no effect).
2. Removed fence comment about revisionBefore ordering — Cannot tell (deletion history not checked; the current code has no explanatory comment there).
3. No visibilitychange listener; wake only fires on the (backed-off) tick cadence — Real (minor, verified: no listener, tick-gated wake).
4. Optimistic waiting flag set then overwritten by load() when status has not transitioned — Real (minor, verified code path; flicker depends on timing).
5. No test for null mask_path / empty signPaths branch — Real (minor, verified gap).
Real findings: 4 (items 1,3,4,5)
