Triage by coder, head d50bdf791848b9d528147197abec41c98fe2c029, model Gemini 4 Hydrogen (picker, request proof and footer agree).
1. fail() returns immutable private cache headers on errors (401/404/503 cacheable a year) — Real (fixed downstream in #678; verified the no-store change there).
2. adminRequestAllowed role lookup runs before the viewer-is-owner short-circuit — Real (minor perf; every own-avatar fetch pays a profiles read).
3. profiles .in() with possibly empty userIds, no length guard — Real (minor).
4. usePostAuthor calls useProfileIdentity() with no args even when row data exists, registering listener and loadIdentity on mount — Real (minor).
5. Missing 304 If-None-Match test — Real (minor; no 304 coverage in the test file).
6. Admin viewer fetching another user's avatar (200) coverage — Cannot tell (admin plumbing and other-user flows exist in the test; 200-for-admin path not isolated).
Real findings: 5
