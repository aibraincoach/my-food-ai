Triage by coder, head 4c0dab0166a3bf2130e2b37e7d4f483aa0aec52f, model Gemini 4 Hydrogen (request proof and footer agree).
1. Retries recovering only non-core nutrients (kcal, fibre, etc.) are discarded when the core-macro count does not rise — Real (verified).
2. Stale 'grams' validation message when unit is ml or serving — Real (verified in both functions).
3. Duplicated validation logic across the two create_food_post variants — Not real (style).
4. Missing tests for without_gtin variant and singular '1 serving' — Real (minor, verified gap).
Real findings: 3
