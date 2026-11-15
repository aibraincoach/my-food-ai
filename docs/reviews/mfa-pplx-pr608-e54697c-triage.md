Triage by coder, head e54697c2abaacd65c98fbbc2f57ef8870c71d2f8, model Gemini 4 Hydrogen (request proof and footer agree).
1. Shared negation captures only the first item ("no dressing or croutons" guards dressing, not croutons) — Real (verified by execution).
2. [a-z]+ truncates accented/non-ASCII and numeric components — Real (verified in source).
3. Fallback message does not distinguish missing-component rejections from missing nutrition — Real (verified line 37).
4. Extract a shared hasExcludedComponent helper — Not real (style).
Real findings: 3
