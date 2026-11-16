Triage reviewer: Codex source verification; head 58b02b13dc0f954d8f058c8a64299f605e53a578
Not real: genuinely negative coordinates require this patch to clamp every offscreen control. The dispatched defect is serialized negative zero; ||0 fixes exactly that while scrollIntoView handles positioning. No negative-coordinate failure was observed in this review.
Not real: matching question about misses the new wording. Both old and new dispatched headings contain that exact substring; the explicit missing-row check remains.
Real findings: 0
