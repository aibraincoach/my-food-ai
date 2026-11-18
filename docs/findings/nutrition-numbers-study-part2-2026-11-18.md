# Owner nutrition numbers: photo study, part 2 (2026-11-18)

## 1. The sample

One guarded read-only account lookup and one guarded owner SELECT returned 178 ready, undeleted meals and 400 current foods. The lookup took 310 ms; the owner SELECT took 572 ms. Both ran once, sequentially, inside explicit READ ONLY transactions with write-refusal checks, lock timeout 5 s and statement timeout 30 s. No production row or model-trace row was written.

The deterministic sample has 20 meals: 12 leftovers (a), 0 flagged non-leftovers (b), and 8 unflagged controls (c), from 166 available controls. There are 12 leftovers meals, versus 11 in the Nov 16 study. All leftovers fit the 22-meal cap; 0 were omitted. No foods met the current record-kind detector's flag threshold, so group b is empty; this does not certify the other 158 meals. The detector uses record-kind checks, not every possible nutrition or protein error.

The record screen checked 31 matched/closest foods with a description; skipped categories/counts are {'match': 364, 'own': 5}. This screening count is not a photo judgment.

Existing private 08 snapshots were found for 1 selected meal(s), with usable item links on 1 meal(s). No new snapshot query ran. Meals without an existing snapshot have no restore evidence; restore is never proposed for them.

Reader: explicit `--reader=app` (`app:muse-spark-1.3`), chosen by the PM: AGY 0 of 2 local calls succeeded; the app's own model reads photos reliably. AGY had 0 successful local verdicts in 2 attempts; there was no provider switching during this study. Photos were signed and fetched sequentially once per path: 32 signs, 32 GETs, 0 failures. There were 20 provider calls, 20 successful verdicts and 0 failed/malformed verdicts. Known usage: 112,166 input tokens and 34,858 output tokens; usage unavailable for 0 calls. No dollar cost is inferred.

Started 2026-11-18T21:22:41.105Z; finished 2026-11-18T21:29:29.041Z. Stop reason: none. Per-call timeout was 60 s, below the authorized 3-minute cap; no request was retried.

**Interpretation limit:** these are model judgments, not measured truth. On leftovers meals, `grams` and `kcal` describe the consumed portion; original amount is consumed plus not-eaten. The reader sometimes compares consumed grams with the original plate and calls the difference an error. Those weight/value/not-eaten flags must be checked by a person before any correction; raw counts below do not prove the cause or size of an error. For example, bc01cbd2 grilled bangers has 70 g consumed and 80 g left: stored share 80/150 = 0.533, close to the reader’s own photo estimate of 0.5. The reader instead divided by consumed grams and flagged a share above 1; that not-eaten flag is contradicted by its own observation. No second reading was made to change the result.

## 2. The verdicts

R = right; W = wrong; ? = cannot tell; — = not applicable. Notes are shortened; complete answers and evidence stay private.

| Meal | Group | Food | Record | Weight | Value | Not eaten | Reader time | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 45d7e3df | a | R | ? | W | W | W | 29.22 s | Weight wrong: romaine lettuce stored 15g but photo 1 shows ~50-60g (3-4 large romaine leaves covering half plate). Value wrong: roasted cherry tomatoes 60g stored 120 kcal vs ~10-12 kcal usual. Not-eaten wrong: romaine l… |
| 189673aa | a | W | ? | W | ? | W | 37.51 s | Breaded beef cutlet (100g stored) not on main tray in photo 1 - photo shows 0g, background breaded plate is on separate table - and absent in leftovers photo, so food and weight wrong. Chopped scallions and pickled veget… |
| ad3006c2 | a | R | ? | R | R | R | 16.64 s | Initial photo shows 5 chicken satay skewers, small cup of peanut sambal sauce, and bowl of lontong cubes; leftovers photo shows skewers fully eaten, sauce largely remaining, and ~6 lontong cubes remaining. Totals (eaten+… |
| bc01cbd2 | a | R | ? | W | R | W | 21.43 s | grilled bangers weight wrong: photo 1 shows two grilled sausages ~150g vs stored 70g; grilled bangers not-eaten wrong: leftover photo shows ~0.5 share (1 of 2 sausages) remaining vs stored share 80g/70g >1. |
| 816869a5 | a | R | ? | R | R | R | 19.32 s | Bento shows rice, stir-fried greens, shredded tuna with chili, chunky meat with chili, and sambal cup matching all 5 names; no >1/4 plate item missing. Weights plausible vs box compartments; values within normal per 100g… |
| 5f41a0e4 | a | R | ? | W | R | R | 33.39 s | truffle popcorn chicken: initial plate shows ~250g heaped fried chicken vs stored 80g; record 2706099 has no description to compare so cannot tell. |
| 564ec764 | a | R | R | R | R | R | 22.24 s |  |
| bf54e289 | a | R | R | R | R | W | 29.54 s | not_eaten wrong for cheese-filled pork katsu: stored not_eaten_g 85g exceeds stored grams 65g (>100% left) and leftover photo shows ~1 of ~4 pieces left, not >100%; also shares for other katsu/cabbage do not match. |
| 6be9dea2 | a | R | ? | R | R | W | 18.98 s | tortilla chips not-eaten wrong: stored 40/40g = 100% left but leftovers photo shows roughly half of initial chips eaten, share differs by >0.25; salsa share ~10% left matches stored 8/62g. |
| a91dfdcf | a | W | ? | W | ? | W | 34.77 s | food wrong: fried tempeh - photo 1 shows large fried tofu cube (>1/4 plate), no tempeh visible. weight wrong: sambal chili sauce - two bowls show ~80-100g total, stored 10g is less than half what photo shows. not_eaten w… |
| 4f818b6d | a | R | R | R | R | R | 19.98 s |  |
| 89acdde4 | a | R | ? | R | R | R | 10.81 s | Plate shows papaya chunks and pineapple chunks matching list; weights ~200g papaya and ~68g pineapple plausible; kcal densities plausible; leftovers show one small pineapple piece (~12g) and no papaya matching stored sha… |
| 166141be | c | R | ? | R | R | — | 8.62 s | Filet-O-Fish sandwich held in hand matches listed food; weight 142g consistent with size vs hand; 357.84 kcal within expected range; record 2707021 cannot be verified without description text. |
| 3a1a3843 | c | R | ? | R | R | — | 11.78 s | All listed foods visible: roast beef slices, brown gravy, roasted potatoes, cauliflower gratin with breadcrumb topping. Weights and values within range; no record descriptions supplied to judge. |
| 47913b69 | c | R | ? | R | W | — | 17.12 s | value wrong: Lemon wedge 15g at 24.3 kcal is ~5x usual lemon value (~4 kcal); Spiced potato side dish 60g at 12 kcal is well below half usual potato value (~60-80 kcal). |
| bb031868 | c | W | ? | R | R | — | 15.41 s | Sapporo beer is wrong: photo shows a tall glass clearly labeled Konig Ludwig Weissbier, not Sapporo. |
| 45d7b469 | c | R | ? | R | R | — | 10.17 s | Photo shows large cookie, Lotus Biscoff, black coffee, watermelon cubes and papaya cubes matching all 5 items; no major food missing; weights and kcal within half-to-double; no record descriptions supplied to judge recor… |
| 0aed0581 | c | R | R | R | R | — | 15.59 s | All 9 listed foods visible on mixed grill plate; no missing >1/4 plate item. |
| 35d5edb8 | c | R | R | ? | R | — | 11.88 s | Photo shows Starbucks can back label 220ml (1 kaleng) 130 kkal, barcode 9556001299154 matching stored record; stored 127.5 kcal consistent with label. |
| d5059135 | c | R | ? | R | R | — | 7.25 s |  |

## 3. The causes, ranked (S8)

Raw reader flags; one meal can occur in several rows. The leftovers interpretation limit above applies.

| Cause | a | b | c | Total |
| --- | --- | --- | --- | --- |
| not_eaten | 6 | 0 | 0 | 6 |
| weight | 5 | 0 | 0 | 5 |
| food | 2 | 0 | 1 | 3 |
| value | 1 | 0 | 1 | 2 |
| record | 0 | 0 | 0 | 0 |

## 4. Leftovers (#285)

Stored not-eaten share is `not_eaten_g / (grams + not_eaten_g)`, because grams is the consumed amount. Unknown values remain unknown. Photo-share observations below are the reader’s notes, not independently measured fractions; the schema did not require a separate numeric photo-share field.

| Meal | Stored shares by food | Not-eaten verdict | Photo observation |
| --- | --- | --- | --- |
| 45d7e3df | roasted cherry tomatoes: 0.000; romaine lettuce: 0.700; brown gravy: 0.800; roasted baby potatoes: 0.000; creamy pepper sauce: 0.333; beef tenderloin steak topped with butter: 0.000 | W | Weight wrong: romaine lettuce stored 15g but photo 1 shows ~50-60g (3-4 large romaine leaves covering half plate). Value wrong: roasted cherry tomatoes 60g stored 120 kcal vs ~10-12 kcal usual. Not-eaten wrong: romaine lettuce - photo 2 shows essentially all lettuce remaining (~1.0 share) vs stored 15g eaten / 35g not-eaten (~0.7 share) and stored not_eaten exceeds stored served amount; brown gravy stored 10g with 40g not-eaten also exceeds served. |
| 189673aa | Mala udon with beef: 0.040; Shrimp tempura with sauce: 0.071; Cola: 0.000; Breaded beef cutlet: 0.000; Chopped scallions and pickled vegetables: 0.600; Extra seasoned beef: 0.000 | W | Breaded beef cutlet (100g stored) not on main tray in photo 1 - photo shows 0g, background breaded plate is on separate table - and absent in leftovers photo, so food and weight wrong. Chopped scallions and pickled vegetables stored 12g with not_eaten_g 18g impossible; leftovers photo 2 shows that dish essentially untouched, so not-eaten share wrong. |
| ad3006c2 | chicken satay skewers: 0.000; satay peanut sambal sauce: 0.750; lontong compressed rice cakes: 0.833 | R | Initial photo shows 5 chicken satay skewers, small cup of peanut sambal sauce, and bowl of lontong cubes; leftovers photo shows skewers fully eaten, sauce largely remaining, and ~6 lontong cubes remaining. Totals (eaten+not-eaten) match initial portions within half-double. No description supplied to judge record match. |
| bc01cbd2 | grilled bangers: 0.533 | W | grilled bangers weight wrong: photo 1 shows two grilled sausages ~150g vs stored 70g; grilled bangers not-eaten wrong: leftover photo shows ~0.5 share (1 of 2 sausages) remaining vs stored share 80g/70g >1. |
| 816869a5 | kaffir lime leaf rice (nasi daun jeruk): 0.250; stir-fried greens with chili: 0.020; red chili sambal sauce: 0.300; tuna rica (spicy shredded tuna with red chili): 0.000; stir-fried meat with red chilies: 0.000 | R | Bento shows rice, stir-fried greens, shredded tuna with chili, chunky meat with chili, and sambal cup matching all 5 names; no >1/4 plate item missing. Weights plausible vs box compartments; values within normal per 100g. Leftover shares match stored shares within 0.25. |
| 5f41a0e4 | truffle popcorn chicken: 0.680 | R | truffle popcorn chicken: initial plate shows ~250g heaped fried chicken vs stored 80g; record 2706099 has no description to compare so cannot tell. |
| 564ec764 | nasi goreng with sunny-side-up egg: 0.020; sliced tomato: 0.429; grilled chicken satay: 0.000; sliced cucumber: 0.500; kerupuk cracker: 0.000; lettuce: 0.400 | R |  |
| bf54e289 | black pepper pork katsu: 0.346; cheese-filled pork katsu: 0.567; shredded cabbage: 0.438; original pork katsu: 0.417 | W | not_eaten wrong for cheese-filled pork katsu: stored not_eaten_g 85g exceeds stored grams 65g (>100% left) and leftover photo shows ~1 of ~4 pieces left, not >100%; also shares for other katsu/cabbage do not match. |
| 6be9dea2 | salsa: 0.114; tortilla chips: 0.500 | W | tortilla chips not-eaten wrong: stored 40/40g = 100% left but leftovers photo shows roughly half of initial chips eaten, share differs by >0.25; salsa share ~10% left matches stored 8/62g. |
| a91dfdcf | fried chicken (ayam goreng): 0.115; sambal chili sauce: 0.833; fried green vegetables: 0.050; fried tempeh: 0.000; steamed white rice: 0.444 | W | food wrong: fried tempeh - photo 1 shows large fried tofu cube (>1/4 plate), no tempeh visible. weight wrong: sambal chili sauce - two bowls show ~80-100g total, stored 10g is less than half what photo shows. not_eaten wrong: sambal chili sauce stored 50g not-eaten of 10g (share 5.0) vs bowls still ~full in photo 2; steamed white rice stored 80% left vs photo 2 shows ~50% mound left diff >0.25. |
| 4f818b6d | Curry soup: 0.000; Beef noodle soup with sliced beef, soft egg and seaweed: 0.273; Fried side dish: 0.000; Chili condiment: 0.333; Kimchi vegetable side: 0.000; Steamed white rice: 0.000 | R |  |
| 89acdde4 | pineapple chunks: 0.150; papaya chunks: 0.000 | R | Plate shows papaya chunks and pineapple chunks matching list; weights ~200g papaya and ~68g pineapple plausible; kcal densities plausible; leftovers show one small pineapple piece (~12g) and no papaya matching stored shares. Record IDs have no descriptions to compare. |

## 5. How many meals look wrong

The reader flagged at least one wrong verdict on 2 of 8 controls (25.0%). 7 controls have at least one cannot-tell verdict, so an unflagged control is not necessarily correct. This is a small deterministic sample of the current 178 meals, rather than a fresh measurement of the Nov 16 population of 151. One food flag (bb031868) infers the beer brand from the glass logo, which cannot establish what was poured; the raw flag is not confirmation of a wrong drink. The sample suggests possible errors outside the detector’s flags but establishes neither a population error count nor a statistical confidence interval.

## 6. Written correction list — never run

0 evidence-backed proposals and 16 withheld findings. The wrong verdicts were prose-only or carried action none / unknown loss, so the structured guard did not turn them into instructions. Full private JSON lines carry the meal/item UUIDs, structured reader fields, evidence ids and source row ids; this public finding uses prefixes only. Free-text notes never authorize action. A meal without snapshot evidence has no restore proposal; negation or unknown fields authorize nothing.

| Meal | Food | Cause | Proposed script |
| --- | --- | --- | --- |
| — | — | — | No executable proposal |

Proposals are not validated repairs. In particular, a set-weight proposal for a leftovers meal must be checked against the consumed-versus-original distinction before any later order. Missing snapshots are documented per meal in the private snapshot-coverage ledger. Nothing in this list was executed.

## 7. What was not judged

16 sampled meals have at least one cannot-tell verdict: 45d7e3df, 189673aa, ad3006c2, bc01cbd2, 816869a5, 5f41a0e4, 6be9dea2, a91dfdcf, 89acdde4, 166141be, 3a1a3843, 47913b69, bb031868, 45d7b469, 35d5edb8, d5059135. Record descriptions alone do not prove ingredients or exact recipes, and a photo cannot establish precise nutrient values or a hidden drink’s contents. The other 158 owner meals were included in the narrow metadata SELECT but were not photo-judged; other accounts and saved-meal scope were not read. No additional production query, retry or re-analysis ran; #694 and #990 remain open.

The temporary photos were deleted after this finding was written, and the photo directory was read back absent. JSON verdicts, request ledgers and existing snapshot references remain private.
