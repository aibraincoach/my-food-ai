Triage by coder, head dc07c47f5992d92fc300972b8b41866404e2df3b, model Gemini 4 Hydrogen (request proof and footer agree).
1. Unbounded scroll when earliest is null (Number.MAX_SAFE_INTEGER span) — Real (verified line 27).
2. Stale months cache on timezone change (months.current never cleared) — Real (verified; new closure per zone but ref persists).
3. No new test assertions for home-reset, earliest clamping, pagination — Real (minor, test gap).
Real findings: 3
