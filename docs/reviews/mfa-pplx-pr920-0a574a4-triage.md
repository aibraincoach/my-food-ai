Triage reviewer: Codex source verification; head 0a574a4604ff296fb1254e52e34d1fbc68f32e46
Not real: top-level fixture environment mutations leak across the suite. scripts/test.mjs invokes node --test with default per-file process isolation; this test file's process owns these settings.
Not real: the one-second assertion must be relaxed. It is the explicit #625 acceptance requirement and manager.post waits on putIntent, not the delayed 800ms draft write; load sensitivity is a validation consideration.
Real findings: 0
