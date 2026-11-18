# Owner nutrition numbers: follow-up study (2026-11-18)

## 1. What a photo can and cannot establish

**A photo can establish:**

- which foods are on the plate, and whether a large one is missing from the record;
- whether a food is cooked or raw, and roughly how it was prepared, when that shows;
- **a rough share left:** comparing the meal photo with the leftovers photo of the same plate, about how much of each food is still there;
- the kind of a visible drink (beer, cola, coffee);
- a brand, only from a legible label on the food's own pack or can.

**A photo cannot establish:**

- **grams.** At best, with a plate, hand, cutlery or a pack of known size in the picture, it can show that a weight is off by more than half or double. Without such a reference it shows nothing about weight;
- **calories, or any nutrient;**
- hidden ingredients, oil, butter, sugar or the recipe;
- what was poured into a glass. A logo on a glass, cup or plate names the glassware, not the drink;
- whether a USDA record is the right one, beyond its name matching the food.

**So the study is not a weight audit and cannot become one.** It checks identity, preparation, the share left, and calories per 100 g against the usual value for the food. A number the photo cannot check is reported as "cannot tell", never as right.

## 2. The bounded follow-up

This is a selected follow-up of Fleet 55, not a new random control sample: 12 leftovers meals plus the two controls previously flagged, 14 meals / 52 foods / 47 foods with leftovers / 26 photos. Food rows remain those read at 21:22Z for Fleet 55; later owner edits are not reflected in this photo comparison. The parent sample hash is retained privately. There was no new sample SELECT, account lookup or baseline snapshot.

The reviewed reader was merged in #1169 after the rubric plan in #1168. The model saw named eaten and served amounts; code calculated the share verdict from numeric photo estimates, with an absolute difference strictly above 0.25 counted wrong. Weight without a named size reference becomes cannot tell; set_weight on leftovers is withheld. Raw judgments are uncertain and are not corrections.

Explicit reader: app:muse-spark-1.3. Reason recorded on every row: AGY 0 of 2 local calls succeeded in Fleet 55; the app's own model reads photos reliably. Calls: 14; successful verdicts: 14; failed/malformed: 0. Known tokens: 87,532 input / 22,764 output. No dollar amount is inferred.

Photo traffic: 26 signs / 26 GETs; 0 failures. All external work was sequential, one attempt per path/meal/record id, with no automatic retry or provider switch. Study started 2026-11-18T22:08:11.532Z; stopped/finished 2026-11-18T22:27:51.071Z; status study-finished; stop reason: none.

## 3. Per-meal Fleet 55 → Fleet 56 comparison

R = right; W = wrong; ? = cannot tell; — = not applicable. A surviving flag is W in both studies. A dropped flag may now be unknown; it is not necessarily proven right.

| Meal | Food | Record | Weight | Value | Not eaten | Surviving flags | Reader time |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 45d7e3df | R → R | ? → ? | W → R | W → W | W → ? | value | 20.11 s |
| 189673aa | W → R | ? → ? | W → R | ? → R | W → W | not_eaten | 20.84 s |
| ad3006c2 | R → R | ? → ? | R → R | R → R | R → ? | none | 21.54 s |
| bc01cbd2 | R → R | ? → ? | W → R | R → R | W → R | none | 8.29 s |
| 816869a5 | R → R | ? → W | R → R | R → R | R → R | none | 31.51 s |
| 5f41a0e4 | R → R | ? → ? | W → R | R → R | R → R | none | 10.61 s |
| 564ec764 | R → R | R → W | R → R | R → R | R → W | none | 26.18 s |
| bf54e289 | R → W | R → ? | R → R | R → R | W → W | not_eaten | 28.39 s |
| 6be9dea2 | R → R | ? → ? | R → R | R → R | W → R | none | 9.65 s |
| a91dfdcf | W → R | ? → ? | W → R | ? → R | W → R | none | 28.47 s |
| 4f818b6d | R → R | R → ? | R → R | R → R | R → ? | none | 25.29 s |
| 89acdde4 | R → R | ? → ? | R → R | R → R | R → ? | none | 12.31 s |
| 47913b69 | R → R | ? → ? | R → R | W → W | — → — | value | 18.12 s |
| bb031868 | W → ? | ? → ? | R → ? | R → R | — → — | none | 11.60 s |

### Surviving flags and reasons

| Meal | Questions | Item evidence |
| --- | --- | --- |
| 45d7e3df | value | value: meal-level density judgment; named reason is private |
| 189673aa | not_eaten | e2b0234a: stored share 0.6, photo 1, delta 0.400 |
| bf54e289 | not_eaten | 892cab9a: stored share 0.567, photo 0.3, delta 0.267; f4fa6c20: stored share 0.417, photo 0.9, delta 0.483 |
| 47913b69 | value | value: meal-level density judgment; named reason is private |

Named foods and complete reader reasons are retained in the private second-stop report. The public table records question types and item/share evidence; none is an instruction.

### New flags and reasons

| Meal | Questions | Item evidence |
| --- | --- | --- |
| 816869a5 | record | record: meal-level judgment; named reason is private |
| 564ec764 | record, not_eaten | record: meal-level judgment; 920e9513: stored share 0.429, photo 0.9, delta 0.471; d3f957dc: stored share 0.5, photo 1, delta 0.500; ff9f856a: stored share 0.4, photo 0.8, delta 0.400 |
| bf54e289 | food | food: missing-food judgment; no stored item target inferred |

Named foods and complete reader reasons are retained in the private second-stop report. The public table records question types and item/share evidence; none is an instruction.

## 4. All outcomes, including cannot tell

| Question | Group | Right | Wrong | Cannot tell |
| --- | --- | --- | --- | --- |
| food | a | 11 | 1 | 0 |
| food | b | 0 | 0 | 0 |
| food | c | 1 | 0 | 1 |
| record | a | 0 | 2 | 10 |
| record | b | 0 | 0 | 0 |
| record | c | 0 | 0 | 2 |
| weight | a | 12 | 0 | 0 |
| weight | b | 0 | 0 | 0 |
| weight | c | 1 | 0 | 1 |
| value | a | 11 | 1 | 0 |
| value | b | 0 | 0 | 0 |
| value | c | 1 | 1 | 0 |
| not_eaten | a | 5 | 3 | 4 |
| not_eaten | b | 0 | 0 | 0 |
| not_eaten | c | 0 | 0 | 0 |

Group a is the selected leftovers meals; group c is the two previously flagged controls; group b is empty. This selected two-control cohort cannot estimate the unflagged population’s error rate. Unknown outcomes are not counted as flags or corrections.

## 5. The share left, food by food

| Meal | Item | Served g | Stored share | Photo share | Outcome |
| --- | --- | --- | --- | --- | --- |
| 45d7e3df | 08c9fb98 | 60 | 0 | unknown | ? |
| 45d7e3df | 17dda10c | 50 | 0.7 | 0.8 | R |
| 45d7e3df | b01117b5 | 50 | 0.8 | 0.9 | R |
| 45d7e3df | cb57c967 | 150 | 0 | unknown | ? |
| 45d7e3df | df841c48 | 60 | 0.333 | 0.25 | R |
| 45d7e3df | e7eb1dbf | 200 | 0 | unknown | ? |
| 189673aa | 2680107b | 500 | 0.04 | 0.05 | R |
| 189673aa | c5c20f99 | 70 | 0.071 | 0.05 | R |
| 189673aa | d08c61f4 | 330 | 0 | unknown | ? |
| 189673aa | e2710dbf | 100 | 0 | unknown | ? |
| 189673aa | e2b0234a | 30 | 0.6 | 1 | W |
| 189673aa | e67c4eed | 80 | 0 | unknown | ? |
| ad3006c2 | 0704788a | 150 | 0 | unknown | ? |
| ad3006c2 | 36e49d52 | 40 | 0.75 | 0.85 | R |
| ad3006c2 | aef2bb08 | 180 | 0.833 | 0.6 | R |
| bc01cbd2 | 41b1b6f9 | 150 | 0.533 | 0.5 | R |
| 816869a5 | 07c368a4 | 100 | 0.25 | 0.25 | R |
| 816869a5 | 66648420 | 50 | 0.02 | 0.02 | R |
| 816869a5 | 9e3f8d48 | 10 | 0.3 | 0.3 | R |
| 816869a5 | b3be144b | 50 | 0 | 0 | R |
| 816869a5 | eb013a87 | 40 | 0 | 0 | R |
| 5f41a0e4 | b7a37318 | 250 | 0.68 | 0.7 | R |
| 564ec764 | 1f07da4b | 250 | 0.02 | 0 | R |
| 564ec764 | 920e9513 | 35 | 0.429 | 0.9 | W |
| 564ec764 | cf6a48d7 | 40 | 0 | unknown | ? |
| 564ec764 | d3f957dc | 30 | 0.5 | 1 | W |
| 564ec764 | df10ec87 | 25 | 0 | unknown | ? |
| 564ec764 | ff9f856a | 20 | 0.4 | 0.8 | W |
| bf54e289 | 47a5570f | 130 | 0.346 | 0.5 | R |
| bf54e289 | 892cab9a | 150 | 0.567 | 0.3 | W |
| bf54e289 | c1ed5ce2 | 80 | 0.438 | 0.4 | R |
| bf54e289 | f4fa6c20 | 120 | 0.417 | 0.9 | W |
| 6be9dea2 | 38ee63c2 | 70 | 0.114 | 0.1 | R |
| 6be9dea2 | 76c1ddc5 | 80 | 0.5 | 0.5 | R |
| a91dfdcf | 6d8cab9d | 130 | 0.115 | 0.1 | R |
| a91dfdcf | b00a0caf | 60 | 0.833 | 0.9 | R |
| a91dfdcf | e5c7ac46 | 40 | 0.05 | 0.05 | R |
| a91dfdcf | e8f4b8a6 | 80 | 0 | 0 | R |
| a91dfdcf | fbad747e | 180 | 0.444 | 0.5 | R |
| 4f818b6d | 1ec21447 | 300 | 0 | unknown | ? |
| 4f818b6d | 2a1957c9 | 550 | 0.273 | 0.35 | R |
| 4f818b6d | 2fbd6a8a | 60 | 0 | unknown | ? |
| 4f818b6d | b91ae0ce | 15 | 0.333 | unknown | ? |
| 4f818b6d | c958cc13 | 30 | 0 | unknown | ? |
| 4f818b6d | f02ace2d | 150 | 0 | unknown | ? |
| 89acdde4 | a2ea64da | 80 | 0.15 | 0.25 | R |
| 89acdde4 | c9888cc5 | 200 | 0 | unknown | ? |

## 6. Local consistency questions

The nine checks use the existing Fleet 55 rows on disk only, with no database or network. They produce questions, never corrections. Counts by check 1–9: 0, 6, 7, 0, 3, 15, 2, 0, 0. Check 3 counts seven affected rows with eight missing-field events. Check 5 has three normalized-name groups; the original plan’s count of two incorrectly excluded a zero density.

The old export cannot compare calories against macros, a density against record nutrients, or the same food across days because those fields were absent. The separately authorized one-read expansion below supplies those columns, rather than claiming the old data did.

## 7. Public record-density comparison

The on-disk rows had 242 numeric matched record ids, of which 241 had a known stored density. One matched row with no grams/calories has no comparable density and was not an extra request. Public API traffic sent only public record numbers and the required API credential, never the owner’s ids, meals, photos or app context. 241 records attempted, 241 successful, 0 failed. Requests were sequential and paced at least 3.7 seconds apart, also respecting any lower advertised quota; the pass had a 20-minute cap. Public replies are cached locally; no production cache was written.

Comparable USDA rows: 368; density questions (absolute difference above 0.5 kcal/100 g): 0. Energy selection and unit/gram-basis handling use the app’s existing pure parseFoodDetail/scaleNutrition functions, without its cache or trace-writing wrappers. Reference agreement leaves the choice of food record and serving weight unverified. The 368 comparable rows are matched foods; 26 closest approximations, 5 own-reference foods and the matched row without a density are outside this API comparison.

| Meal | Food | Stored kcal/100 g | Public record kcal/100 g | Delta |
| --- | --- | --- | --- | --- |

## 8. One fresh owner read: macros, cached nutrients and dates

Exactly one owner-scoped SELECT ran inside an explicit read-only transaction, with the read-only guard, a refused zero-row write, lock timeout 5 s and statement timeout 30 s. It returned 400 current foods on 178 ready undeleted meals; no other owner or search cache was read. Cached nutrients used fdc_cache’s primary key. The consumed food list for the photo reading was not refreshed; this later query is separate consistency evidence.

Macro arithmetic: 399 comparable rows; 24 questions. The screen is 4×protein + 4×carbohydrate + 9×fat, with a question only when the discrepancy is above both 10 kcal and 10% of stored energy. It omits alcohol, fibre and specific Atwater factors, so a discrepancy is not proof that stored energy is wrong. Of the 24 question rows, 23 are stored drink entries; the remaining solid-food row is 94 stored kcal versus 108.3 from the macro formula. Alcohol can explain drink gaps, and food-specific Atwater factors can explain differences for foods.

Canonical cached-record density: 5 comparable rows; 0 questions above 0.5 kcal/100 g. Missing, invalid or non-gram-basis references stay unknown; no second route is queried.

Same normalized food across different UTC dates: 31 names compared; 2 questions with densities more than twice apart. Dates are UTC, not an assumed owner timezone; recipes can differ.

| Check | Meal | Item | Numbers |
| --- | --- | --- | --- |
| 4/4/9 | 1e8ee4f9 | 8bd9ae02 | stored 136.00; macro 80.80; delta 55.20 |
| 4/4/9 | 231dfd5e | 95e7a04d | stored 224.40; macro 133.32; delta 91.08 |
| 4/4/9 | 24b9b270 | bcf67ae7 | stored 417.20; macro 188.36; delta 228.84 |
| 4/4/9 | 24f50214 | 0fbf2a54 | stored 224.40; macro 133.32; delta 91.08 |
| 4/4/9 | 7d5fe125 | e34f54ff | stored 180.00; macro 66.96; delta 113.04 |
| 4/4/9 | 82c56c32 | 8959a389 | stored 98.40; macro 12.82; delta 85.58 |
| 4/4/9 | 8535b793 | c6d600b5 | stored 195.80; macro 72.40; delta 123.40 |
| 4/4/9 | 8ab2eccb | 7fb8c6b5 | stored 178.00; macro 65.82; delta 112.18 |
| 4/4/9 | 8b728c7e | 05f7d02d | stored 195.80; macro 72.40; delta 123.40 |
| 4/4/9 | 8ffbeda3 | eff627d5 | stored 83.00; macro 12.32; delta 70.68 |
| 4/4/9 | 95f6d4e9 | fddadfd9 | stored 224.40; macro 133.32; delta 91.08 |
| 4/4/9 | 9e65c1b1 | a96e5808 | stored 133.50; macro 49.36; delta 84.14 |
| 4/4/9 | ac598a03 | 6755d2c4 | stored 141.90; macro 52.93; delta 88.97 |
| 4/4/9 | b50a93d2 | 0f366c82 | stored 224.40; macro 133.32; delta 91.08 |
| 4/4/9 | b77e5294 | 9e7d30fa | stored 100.80; macro 10.70; delta 90.10 |
| 4/4/9 | bb031868 | c273b2bf | stored 215.00; macro 80.20; delta 134.80 |
| 4/4/9 | bc471ad8 | a93525e9 | stored 295.20; macro 157.15; delta 138.05 |
| 4/4/9 | c0f53d65 | f00a0f60 | stored 448.80; macro 266.64; delta 182.16 |
| 4/4/9 | c47aeaf6 | 99feaa63 | stored 94.00; macro 108.30; delta -14.30 |
| 4/4/9 | deece2b7 | 593d4322 | stored 270.90; macro 101.05; delta 169.85 |
| 4/4/9 | e13593a2 | eae32f2d | stored 136.00; macro 80.80; delta 55.20 |
| 4/4/9 | e6c8cfaf | ceaa2f7c | stored 141.60; macro 0.00; delta 141.60 |
| 4/4/9 | f1d0d44d | 50fbbe57 | stored 150.50; macro 56.14; delta 94.36 |
| 4/4/9 | f7338182 | 4b14b46b | stored 264.25; macro 172.59; delta 91.66 |
| across UTC dates | 2b585085, 47913b69, fe8eff27 | c905e174, ab169e63, 4013223d | 2026-10-28: 162.00; 2026-10-28: 162.00; 2026-11-18: 29.00 |
| across UTC dates | 3501b261, 494a2c3a, 509ef9bc, e31fd9af | 170cd4cd, f8a9ae15, d378f311, 1cc66238 | 2026-11-04: 0.00; 2026-11-04: 0.00; 2026-11-12: 21.00; 2026-11-09: 263.00 |

## 9. Written correction list — never run

0 recommendations; 8 withheld entries. Every private recommendation carries its meal/item ids, structured reader fields and evidence/source row ids. The public summary uses meal prefixes only. A cannot-tell answer or prose note cannot authorize a correction; served-weight proposals on leftovers are withheld. No new snapshot was taken.

| Meal | Food | Cause | Proposed script |
| --- | --- | --- | --- |
| — | — | — | none |

Nothing was corrected, re-analysed, restored or closed. Questions and model judgments are not instructions. #694 and #990 remain open pending later PM disposition.

The temporary photos were deleted after this finding was written and read back absent; private JSON verdicts, comparison/share checks, API replies, query evidence and correction lists were retained.
