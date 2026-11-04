Coder triage: Codex; head b474215749d8b0d203bb9e9585274b8d26c83f6f
Real — src/lib/posts/feed-cache.ts:53: expiration filtering is inside `prior?.raw !== raw`, whereas writeFeedCache primes the snapshot. A direct execution against the lane source with a signed token expiring in five minutes returned one slide before expiry and one slide ten minutes later (`{"beforeExpiry":1,"afterExpiry":1}`). Repeated reads must re-evaluate time-dependent expiry while preserving stable snapshot identity when the effective slides are unchanged.
Real findings: 1
