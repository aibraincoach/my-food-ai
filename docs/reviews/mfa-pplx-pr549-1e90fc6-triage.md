Triage by coder, head 1e90fc6713c22a24e0f51d4a95345752ddb9908f, model Gemini 4 Hydrogen (request proof and footer agree).
1. Wording-coupled disclosure detection in both persist.ts and the 0059 migration (literal ' is taken from the closest USDA record, ') — Real (verified both sides; rephrasing breaks the guard silently).
2. Missing baseFood skips approximation when the first decision names no query_food — Real (verified lines 78, 89-90).
3. Rebuilt-removed summary joins labels with '. ' while plainConsumed ends each label with '.' — Not real (equivalent rendered output).
4. persist.ts orders first model comment by created_at only, SQL uses created_at, id — Real (minor, verified).
Real findings: 3 (items 1, 2, 4)
