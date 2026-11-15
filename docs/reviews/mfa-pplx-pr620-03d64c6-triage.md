Triage by coder, head 03d64c6f20c429a4da390d1d8558c692f167d4e1, model Gemini 4 Hydrogen (request proof and footer agree).
1. Non-atomic persist: posts.question update, post_comments insert, and markReady run sequentially outside the 0059 RPC — Real (verified).
2. Silent comment-answer failure: question clear failure only logs a warning, still returns 201, leaving a stale strip row — Real (minor, verified).
3. No tests for DELETE /api/posts/[id]/question or the visibleQuestion branch — Real (minor, verified gap).
Real findings: 3
