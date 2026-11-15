Triage by coder, head 8a8e52a94f08f81dc334640f498465448b21c411, model Gemini 4 Hydrogen (request proof and footer agree).
1. String-replace $ patterns in ASK_INPUT_FOCUS — Not real (prompt is a fixed GitHub URL; no $ sequences can occur).
2. Redundant if (label) break after if (label === WANT) break — Real (trivial; verified at head).
3. Duplicated ask-input selectors — Not real (style; repo favors inline redundancy over helpers).
4. Truncated run18 captures with zero-finding triages presented as reviews — Real (process; verified: 636/637/638/639/641/643 captures cut mid-answer; being re-reviewed in this session).
Real findings: 2 (items 2, 4)
