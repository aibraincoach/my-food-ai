Coder triage of Gemini 3.8 Flash review at c980c70ce32aa777673ac42706c616c6707c250f

- API fallback/null marker: Not real. 0027 reserve_post_upload_with_options explicitly accepts p_not_eaten_position null; its validation is conditional on non-null. A fallback error is deliberately returned to the existing failure response. The rebuilt app's HTTP publication/worker test passed through this fallback before migration 0028.
- Portion underflow: Not real. remainderRule clamps the photo quantity with Math.min(grams, Math.max(0, Math.round(...))) and consumed grams with Math.max(0,...). readRemainder also rejects an estimate above the supplied grams. Existing clamp tests and the new cumulative worker test pass.
- Legacy thread-label casing: Real. Use a case-insensitive replacement on model comments, preserving user-written captions/comments.
- Trigger/application coordination: Verified in the new rolled-back SQL test: explicit cumulative values are retained; an ordinary correction that omits the columns inherits them. An additional self-check found that changed consumed grams should clear stale count_text; the next head includes that correction and a regression assertion.

Real findings: 1
