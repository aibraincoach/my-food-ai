Triage reviewer: external-review operator; head c54525b1bd1c8985866f7fe840411be274822719

- Not real: Locale consistency is optional. MonthGrid retains its existing en locale; formatCalories default preserves existing unlocalized rounded strings. Source: src/components/MonthGrid.tsx:10 and src/lib/nutrition/totals.ts:56. Same reviewer explicitly confirmed no introduced locale regression.
- Not real: Future sub-gram macro precision is outside this calorie fix and unchanged. NutritionTable continues formatNutrition for non-kcal units; its prior whole-unit rounding remains. Source: src/components/NutritionTable.tsx:4 and src/lib/nutrition/totals.ts:50.

Same-thread exact-head Gemini confirmation: BLOCKERS: NONE. No code changes, DB actions, or merge performed.

Real findings: 0
