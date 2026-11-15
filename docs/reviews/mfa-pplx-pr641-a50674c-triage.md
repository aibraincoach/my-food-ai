Triage by coder, head a50674c66a6f7946f8eff7c59c11127cf6a43bf2, model Gemini 4 Hydrogen (request proof and footer agree).
1. Unused mime parameter in cropLabelBox (signature only) — Real (trivial).
2. macroCompleteness counts only 3 macros; a retry recovering kcal/sugar/etc without raising the count is discarded — Real.
3. Box-boundary throw is caught by the retry try/catch with fallback — Not real (handled).
4. p_grams set to servings count while create_food_post stores it as grams ('N g') — Real (wrong unit persisted).
5. per100 computed twice (line 66 and line 71) — Real (trivial).
6. Dead noServing branch (setter removed, JSX still checks it) — Real (trivial).
7. No tests for crop-and-retry or POST with serving:null — Real (minor).
Real findings: 6
