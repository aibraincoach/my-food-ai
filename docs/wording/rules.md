# Wording rules by language

`checkWording(text, locale)` requires `en` or `ja`; an omitted or unknown locale throws. These rules check AI-output text, not the application's UI strings or a person's caption or quoted correction. A lexical match is a refusal signal, not proof that every semantic advice or health claim is detected.

The live lists are `src/lib/wording/rules/en.json` and `ja.json`, each with `match`, `banned`, `allow` and `notes`. `scripts/wording-inventory.mjs` imports the English list rather than keeping a second copy. The inventory remains an English source-review heuristic; its results are not semantic approval.

English matching applies NFKC, lowercase and collapsed whitespace, then the existing case-insensitive whole-word rules (with whitespace between phrase words). The 23 phrases and the hits on the frozen main corpus are unchanged. NFKC intentionally also detects compatibility forms such as full-width Latin words.

Japanese substring matching applies NFKC, lowercase and removes whitespace while keeping punctuation. Text and phrases use the same normalization. Approved whole phrases are masked longest first with U+FFFC, never deleted, so their neighbours cannot join into another phrase. A banned phrase outside a mask still fails. Japanese text also runs through the English word rules with collapsed spaces; those spaces are not removed for the English check. Allows are reviewed phrases with at least two characters, not blanket single-character exemptions. The current locale registry must have a rules file for every supported language; a missing registration is a compile error, not an English fallback.

The Japanese rules and notes are PM-drafted, reviewer double-read, **not native-reviewed**. The approved v2.3 source packet has SHA-256 `811c2b68d3674cf221ef7bff51d3ce4eef25d77ddeef882553bba8311eb6066d`. Its 60 banned phrases, seven whole-phrase allows and notes are copied without wording edits; `tests/fixtures/wording-ja.json` contains the two original lexical batches joined in order, retaining all 36 rows and expected results. Extra regressions cover the reviewed spelling variants, factual comparisons, food-name allows and punctuation boundaries.

Four separate health-claim examples in the PM packet deliberately pass lexically. They are outside the lexical fixture and remain semantic review/model-exercise work for #1219 slice B. This change makes no semantic-health-enforcement or real-model claim, and performs no model calls.

Current main checks model clarification questions/options and the English generated removal/leftovers text. The model's correction `reply` is parsed but discarded; no check or replacement path is added for unused text. A failing clarification keeps the existing fixed question and filters options; a failing generated reply still throws before persistence.

#1392 is held separately. When it rebases after this change, its two structured-message guard calls must pass the required locale, check both English and Japanese renderings, and blank only the person's quoted correction in the checked removal copies. No SQL migration or production change is part of #1214. Follow the recorded #1392 database/app release order independently.
