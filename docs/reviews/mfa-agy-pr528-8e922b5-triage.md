Coder triage: Codex; head 8e922b51c085641860bc1ec42572a6491601c25d
Real — src/components/Feed.tsx:289: load() replaces userId with the client session owner, then marks the server initialPage fresh based only on zone and usedServerPage. It does not verify initialUserId equals that owner. publish() later persists under userId and reportTotals() labels events with userId, so a mismatched seed can be reused under another owner. The fix must gate seed reuse by owner and avoid carrying the previous owner's seeded baseline/totals into the new owner.
Real findings: 1
