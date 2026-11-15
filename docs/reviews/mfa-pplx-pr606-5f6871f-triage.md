Triage by coder, head 5f6871f47d843f766e636dae2e7d21abe4a5d8d3, model Gemini 4 Hydrogen (request proof and footer agree).
1. saved/draft useState has no sync when servings prop changes without unmount — Real (verified: no syncing useEffect).
2. Hardcoded "0.25 to 50" bounds text instead of MIN/MAX constants — Real (trivial, verified).
3. Blur-before-click: typing a value then clicking +/- submits via onBlur and the busy flag eats the click — Real (same verified pattern as #643).
Real findings: 3
