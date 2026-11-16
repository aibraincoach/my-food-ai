LONG RUN FLAGGED AND SKIPPED: S7 photo sampler (up to 120 downloads; duration unconfirmed, potential hours).

# Nutrition numbers study — November 16, 2026

Production readings S1–S6 and S9 ran from PR 2 head `cda0fee522d559fec4f8504a171350cbc277db03`, based on `a69a066d73657566e851ee2b7a52638732942ddc`, between 17:10:55 and 17:11:04 UTC. Each call used a read-only PostgreSQL session and a 30-second statement timeout; all returned exit 0 without retry. S1 found exactly one meal and one account; the full account id stayed private. The readings are separate statement snapshots, not one transaction, so concurrent app activity could change later readings. Only the account identified by that guard was studied; no name, address, token, photo or storage path is included here.

The plan's thirteen-file narrative names fourteen explicit paths: README plus SQL 01–13. All fourteen were copied byte for byte. The five prescribed local empty-account runs (02–06) passed separately on the disposable database; the SQL files add no automatic execution. No production snapshot, drink sync, re-match, re-analysis, restore or other write was performed, and production migration 0064 remains held. S7 was skipped under AGENTS.md because the sampler's duration was unconfirmed; the required written PM and owner necessity confirmations were absent. S8 depends on S7 and is not done.

## 1. What is stored

S2 inventory, as returned. There are 151 ready meals, 347 current foods, eight user-entered or edited foods and no copied ready meals; one undeleted meal is failed. Sources count food rows, not independent meals, and the eight user-source rows overlap those source categories.

| section | label | n |
| --- | --- | --- |
| posts | ready posts | 151 |
| posts | ready posts with no current item | 0 |
| posts | ready posts copied from an earlier meal (source_post_id set) | 0 |
| posts | posts in another state: failed | 1 |
| items | current items on ready posts | 347 |
| items | current items entered or edited by the user (source = user) | 8 |
| items | current items on copied posts (numbers copied from an earlier meal) | 0 |
| source | 1 matched USDA record | 322 |
| source | 2 closest USDA record | 22 |
| source | 6 barcode (Open Food Facts) | 3 |

## 2. How many meals show a number that cannot be right, and why

The heading is the plan's wording. These are **screening rule hits**, not confirmed wrong-food or wrong-nutrition judgments: 72 of 151 ready meals with current foods (47.7%) hit at least one rule, involving 65 distinct foods and 85 rule rows. A meal and food can hit several rules; the whole-meal rule has no food id, so its food count is zero. The denominator excludes meals not ready and is confined to this guarded account. No photo/control study was performed, so these percentages do not estimate true error prevalence or errors among unflagged meals.

S3 summary, in its returned ranking:

| reason | items | posts | pct_of_ready_posts_with_items |
| --- | --- | --- | --- |
| i matched record shares no word with the item name | 41 | 40 | 26.5 |
| h meal total under 30 or over 2500 kcal | 0 | 15 | 9.9 |
| g2 caffeine stored on a name with no caffeine source | 9 | 9 | 6.0 |
| g1 plain coffee or tea above 0.25 kcal per gram | 8 | 8 | 5.3 |
| e portion NULL, under 5 g or over 1500 g | 6 | 6 | 4.0 |
| b zero calories or all macros zero on more than 20 g | 3 | 3 | 2.0 |
| a2 calories, protein, carbs or fat is NULL | 2 | 2 | 1.3 |
| f negative value | 1 | 1 | 0.7 |
| ANY REASON (distinct items, distinct posts) | 65 | 72 | 47.7 |
| ALL ready posts with items / current items (denominator) | 347 | 151 | 100.0 |

The largest rule is a word-overlap heuristic: "Tonkatsu" versus "Pork, steak, coated" and "Omelette" versus "Egg, whole, cooked, omelet" fire it without establishing a wrong record. The coffee-density rule also catches an espresso chocolate brownie cookie and explicitly sweetened tea; the caffeine-name rule catches Pain au chocolat and a Snickers bar. The zero-macros rule catches a whisky highball with 141.6 kcal, where alcohol can supply energy. Small portions and low-calorie drink-only meals can likewise be legitimate. These cases limit the screen's specificity; nothing here changes its literal SQL or promotes those hits into validated causes.

## 3. The suspicious foods

S4 returned 85 rows across eight rules. For each rule below, these are at most its ten largest-calorie rows; NULL calories sort last and ties retain the returned order. The full TSV remains private. Rules a1 (no nutrition row), c (macro-energy discrepancy) and d (density outside 0–9 kcal/g) returned no rows. Names and record-description fragments retain the query's truncation limits; NULL denotes an absent value.

| post | item | name | grams | kcal | reason | detail |
| --- | --- | --- | --- | --- | --- | --- |
| 6fad4a16 | d629fbad | salami | NULL | NULL | a2 calories, protein, carbs or fat is NULL | kcal protein carbs fat \| source_ref: 2706195 |
| f08e2e86 | 8562303d | unsalted butter packet | 7.0 | NULL | a2 calories, protein, carbs or fat is NULL | kcal protein carbs \| source_ref: 789828 |
| e6c8cfaf | 5dda45b8 | Whisky highball | 240.0 | 141.6 | b zero calories or all macros zero on more than 20 g | kcal 141.6, p/c/f 0/0/0 |
| 509ef9bc | 4351b6c2 | Sambal | 30.0 | 0.0 | b zero calories or all macros zero on more than 20 g | kcal 0, p/c/f 0/0/0 |
| e31fd9af | b2ffa4dd | Sambal | 30.0 | 0.0 | b zero calories or all macros zero on more than 20 g | kcal 0, p/c/f 0/0/0 |
| 1a901e4e | 4d0f4684 | Pocari Sweat Water 500ml | NULL | 139.9 | e portion NULL, under 5 g or over 1500 g | NULL g |
| 89286fbf | 6c3027fa | Pocari Sweat Water 500ml | NULL | 139.9 | e portion NULL, under 5 g or over 1500 g | NULL g |
| 14f4761d | e0ffb306 | Hydro Coco Original | NULL | 60.0 | e portion NULL, under 5 g or over 1500 g | NULL g |
| a0e6b3bf | c7bbf186 | Indonesian puffed rice crispie cake | 3.0 | 11.8 | e portion NULL, under 5 g or over 1500 g | 3 g |
| e7e1782c | daae1a19 | Bakpia | 3.0 | 10.2 | e portion NULL, under 5 g or over 1500 g | 3 g |
| 6fad4a16 | d629fbad | salami | NULL | NULL | e portion NULL, under 5 g or over 1500 g | NULL g |
| 38de279e | d379c1f1 | lamb curry with rice | 280.0 | 663.6 | f negative value | carbs -0.7028 |
| 8512685d | 2c23d2a1 | Espresso chocolate brownie cookie | 70.0 | 283.5 | g1 plain coffee or tea above 0.25 kcal per gram | 4.05 kcal/g, category cookies and brownies |
| f1c1dc7d | 4eab332b | sweet lemon iced tea | 350.0 | 157.5 | g1 plain coffee or tea above 0.25 kcal per gram | 0.45 kcal/g, category beverages |
| e9a5660b | 81c34430 | sweetened iced tea | 480.0 | 153.6 | g1 plain coffee or tea above 0.25 kcal per gram | 0.32 kcal/g, category tea |
| 4dfe4411 | 6c9dc49d | black coffee | 180.0 | 111.6 | g1 plain coffee or tea above 0.25 kcal per gram | 0.62 kcal/g, category NULL |
| 5711e19c | afe93993 | iced tea | 300.0 | 96.0 | g1 plain coffee or tea above 0.25 kcal per gram | 0.32 kcal/g, category tea |
| d3b40213 | c291cab1 | iced tea | 300.0 | 96.0 | g1 plain coffee or tea above 0.25 kcal per gram | 0.32 kcal/g, category tea |
| d701fa08 | 2def3f0d | Indonesian iced tea | 250.0 | 80.0 | g1 plain coffee or tea above 0.25 kcal per gram | 0.32 kcal/g, category tea |
| 1c4f16bf | aacbf581 | Vietnamese drip coffee | 100.0 | 71.0 | g1 plain coffee or tea above 0.25 kcal per gram | 0.71 kcal/g, category beverages |
| 8771c651 | f6352834 | Pain au chocolat | 80.0 | 336.8 | g2 caffeine stored on a name with no caffeine source | nutrient 9.6 mg, intake row - mg, category doughnuts, sweet rolls, pastries |
| 2fbab11d | 57e7a6b6 | Choco banana cookie from Petit Bite | 65.0 | 319.8 | g2 caffeine stored on a name with no caffeine source | nutrient 7.2 mg, intake row - mg, category cookies and brownies |
| 7312d86d | 597fb7c4 | Snickers bar | 51.0 | 250.4 | g2 caffeine stored on a name with no caffeine source | nutrient 4.1 mg, intake row - mg, category NULL |
| ba79d7ce | 65790555 | Doughlab Gold Digger cookie | 47.5 | 233.7 | g2 caffeine stored on a name with no caffeine source | nutrient 5.2 mg, intake row - mg, category cookies and brownies |
| 8535b793 | c6d600b5 | Lime and rum tiki cocktail | 220.0 | 195.8 | g2 caffeine stored on a name with no caffeine source | nutrient 15.4 mg, intake row - mg, category liquor and cocktails |
| 8b728c7e | 05f7d02d | Fiore cocktail with chamomile-infused vo | 220.0 | 195.8 | g2 caffeine stored on a name with no caffeine source | nutrient 15.4 mg, intake row - mg, category liquor and cocktails |
| 8ab2eccb | 7fb8c6b5 | Peach bicyclette cocktail with Prosecco, | 200.0 | 178.0 | g2 caffeine stored on a name with no caffeine source | nutrient 14.0 mg, intake row - mg, category liquor and cocktails |
| 45d7b469 | 14be91ee | Cookie | 35.0 | 172.2 | g2 caffeine stored on a name with no caffeine source | nutrient 3.8 mg, intake row - mg, category cookies and brownies |
| d3b8c2a3 | 6bb72e10 | Small bite-sized cookies | 32.0 | 157.4 | g2 caffeine stored on a name with no caffeine source | nutrient 3.5 mg, intake row - mg, category cookies and brownies |
| d8f82e79 | NULL | (whole meal, 1 items) | 11.0 | 28.6 | h meal total under 30 or over 2500 kcal | 0 item(s) without calories |
| a0e6b3bf | NULL | (whole meal, 1 items) | 3.0 | 11.8 | h meal total under 30 or over 2500 kcal | 0 item(s) without calories |
| e7e1782c | NULL | (whole meal, 1 items) | 3.0 | 10.2 | h meal total under 30 or over 2500 kcal | 0 item(s) without calories |
| 8603b4f2 | NULL | (whole meal, 2 items) | 260.0 | 6.6 | h meal total under 30 or over 2500 kcal | 0 item(s) without calories |
| 2abae4c7 | NULL | (whole meal, 1 items) | 60.0 | 5.4 | h meal total under 30 or over 2500 kcal | 0 item(s) without calories |
| 5df62149 | NULL | (whole meal, 1 items) | 60.0 | 5.4 | h meal total under 30 or over 2500 kcal | 0 item(s) without calories |
| 3218809c | NULL | (whole meal, 1 items) | 400.0 | 4.0 | h meal total under 30 or over 2500 kcal | 0 item(s) without calories |
| a49fbd6a | NULL | (whole meal, 1 items) | 30.0 | 2.7 | h meal total under 30 or over 2500 kcal | 0 item(s) without calories |
| b2bcd7f6 | NULL | (whole meal, 1 items) | 30.0 | 2.7 | h meal total under 30 or over 2500 kcal | 0 item(s) without calories |
| bc4a217f | NULL | (whole meal, 1 items) | 30.0 | 2.7 | h meal total under 30 or over 2500 kcal | 0 item(s) without calories |
| 7b1782b0 | accde944 | Indonesian nasi kotak bento box with ric | 450.0 | 657.0 | i matched record shares no word with the item name | Frozen dinner, NFS |
| d4971e89 | 8613ce2f | Tonkatsu | 220.0 | 605.0 | i matched record shares no word with the item name | Pork, steak, coated |
| 810f45f5 | e5d75b57 | Fried Macaroni with Spicy Powder | 80.0 | 416.8 | i matched record shares no word with the item name | Noodles, chow mein |
| 7a66d811 | a2fd69bb | hamburger steak | 150.0 | 408.0 | i matched record shares no word with the item name | Beef, ground, patty |
| 8771c651 | f6352834 | Pain au chocolat | 80.0 | 336.8 | i matched record shares no word with the item name | Croissant, chocolate |
| 564ec764 | 1f07da4b | nasi goreng with sunny-side-up egg | 245.0 | 335.7 | i matched record shares no word with the item name | Rice pilaf |
| 519cd981 | cbeb59ed | CHAGEE BO.YA Mango Jasmine Green Milk Te | 470.0 | 258.5 | i matched record shares no word with the item name | Tea, bubble |
| 4f0dc363 | 75cb73d1 | Tuna and black olive pain Suisse | 120.0 | 248.4 | i matched record shares no word with the item name | Turnover, seafood |
| 509ef9bc | 9aa31272 | Omelette | 150.0 | 231.0 | i matched record shares no word with the item name | Egg, whole, cooked, omelet |
| e31fd9af | ba9bbe90 | Omelette | 150.0 | 231.0 | i matched record shares no word with the item name | Egg, whole, cooked, omelet |

## 4. Leftovers (#285)

S5 returned 46 current food rows across 11 meals with a deduction or a not-eaten photo. One row on one meal is flagged: meal `189673aa`, item `e2b0234a`, stores 18 g not eaten but NULL not-eaten calories. The gram deduction ratio is 0.600; its calorie ratio is unknown. The other returned rows carry no SQL flag; no physical share or photo correctness was checked, so this is not a pass of the photo-dependent not-eaten rubric.

| post | item | name | eaten_g | not_eaten_g | eaten_kcal | not_eaten_kcal | not_eaten_ratio_g | not_eaten_ratio_kcal | not_eaten_photos | flag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 189673aa | 2680107b | Mala udon with beef | 480.0 | 20 | 830.4 | 34.6 | 0.040 | 0.040 | 1 | NULL |
| 189673aa | c5c20f99 | Shrimp tempura with sauce | 65.0 | 5 | 141.7 | 10.9 | 0.071 | 0.071 | 1 | NULL |
| 189673aa | d08c61f4 | Cola | 330.0 | 0 | 138.6 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 189673aa | e2710dbf | Breaded beef cutlet | 100.0 | 0 | 306.0 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 189673aa | e2b0234a | Chopped scallions and pickled vegetables | 12.0 | 18 | 5.5 | NULL | 0.600 | NULL | 1 | not-eaten calories NULL |
| 189673aa | e67c4eed | Extra seasoned beef | 80.0 | 0 | 184.8 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 45d7e3df | 08c9fb98 | roasted cherry tomatoes | 60.0 | 0 | 120.0 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 45d7e3df | 17dda10c | romaine lettuce | 15.0 | 35 | 3.1 | 7.3 | 0.700 | 0.700 | 1 | NULL |
| 45d7e3df | b01117b5 | brown gravy | 10.0 | 40 | 5.3 | 21.2 | 0.800 | 0.800 | 1 | NULL |
| 45d7e3df | cb57c967 | roasted baby potatoes | 150.0 | 0 | 189.0 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 45d7e3df | df841c48 | creamy pepper sauce | 40.0 | 20 | 60.0 | 30.0 | 0.333 | 0.333 | 1 | NULL |
| 45d7e3df | e7eb1dbf | beef tenderloin steak topped with butter | 200.0 | 0 | 392.0 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 4f818b6d | 1ec21447 | Curry soup | 300.0 | 0 | 141.0 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 4f818b6d | 2a1957c9 | Beef noodle soup with sliced beef, soft  | 400.0 | 150 | 188.0 | 70.5 | 0.273 | 0.273 | 1 | NULL |
| 4f818b6d | 2fbd6a8a | Fried side dish | 60.0 | 0 | 135.0 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 4f818b6d | b91ae0ce | Chili condiment | 10.0 | 5 | 2.1 | 1.0 | 0.333 | 0.333 | 1 | NULL |
| 4f818b6d | c958cc13 | Kimchi vegetable side | 30.0 | 0 | 4.5 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 4f818b6d | f02ace2d | Steamed white rice | 150.0 | 0 | 226.5 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 564ec764 | 1f07da4b | nasi goreng with sunny-side-up egg | 245.0 | 5 | 335.7 | 6.9 | 0.020 | 0.020 | 1 | NULL |
| 564ec764 | 920e9513 | sliced tomato | 20.0 | 15 | 4.0 | 3.0 | 0.429 | 0.429 | 1 | NULL |
| 564ec764 | cf6a48d7 | grilled chicken satay | 40.0 | 0 | 72.0 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 564ec764 | d3f957dc | sliced cucumber | 15.0 | 15 | 2.4 | 2.4 | 0.500 | 0.500 | 1 | NULL |
| 564ec764 | df10ec87 | kerupuk cracker | 25.0 | 0 | 106.5 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 564ec764 | ff9f856a | lettuce | 12.0 | 8 | 2.4 | 1.6 | 0.400 | 0.400 | 1 | NULL |
| 6be9dea2 | 38ee63c2 | salsa | 62.0 | 8 | 21.1 | 2.7 | 0.114 | 0.114 | 1 | NULL |
| 6be9dea2 | 76c1ddc5 | tortilla chips | 40.0 | 40 | 188.8 | 188.8 | 0.500 | 0.500 | 1 | NULL |
| 816869a5 | 07c368a4 | kaffir lime leaf rice (nasi daun jeruk) | 75.0 | 25 | 96.8 | 32.3 | 0.250 | 0.250 | 1 | NULL |
| 816869a5 | 66648420 | stir-fried greens with chili | 49.0 | 1 | 34.8 | 0.7 | 0.020 | 0.020 | 1 | NULL |
| 816869a5 | 9e3f8d48 | red chili sambal sauce | 7.0 | 3 | 1.5 | 0.6 | 0.300 | 0.300 | 1 | NULL |
| 816869a5 | b3be144b | tuna rica (spicy shredded tuna with red  | 50.0 | 0 | 88.0 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 816869a5 | eb013a87 | stir-fried meat with red chilies | 40.0 | 0 | 70.4 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| 89acdde4 | a2ea64da | pineapple chunks | 68.0 | 12 | 40.9 | 7.2 | 0.150 | 0.150 | 1 | NULL |
| 89acdde4 | c9888cc5 | papaya chunks | 200.0 | 0 | 86.0 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| a91dfdcf | 6d8cab9d | fried chicken (ayam goreng) | 115.0 | 15 | 251.9 | 32.9 | 0.115 | 0.115 | 1 | NULL |
| a91dfdcf | b00a0caf | sambal chili sauce | 10.0 | 50 | 2.1 | 10.5 | 0.833 | 0.833 | 1 | NULL |
| a91dfdcf | e5c7ac46 | fried green vegetables | 38.0 | 2 | 90.8 | 4.8 | 0.050 | 0.050 | 1 | NULL |
| a91dfdcf | e8f4b8a6 | fried tempeh | 80.0 | 0 | 156.0 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| a91dfdcf | fbad747e | steamed white rice | 100.0 | 80 | 151.0 | 120.8 | 0.444 | 0.444 | 1 | NULL |
| ad3006c2 | 0704788a | chicken satay skewers | 150.0 | 0 | 270.0 | 0.0 | 0.000 | 0.000 | 1 | NULL |
| ad3006c2 | 36e49d52 | satay peanut sambal sauce | 10.0 | 30 | 25.7 | 77.1 | 0.750 | 0.750 | 1 | NULL |
| ad3006c2 | aef2bb08 | lontong compressed rice cakes | 30.0 | 150 | 38.7 | 193.5 | 0.833 | 0.833 | 1 | NULL |
| bc01cbd2 | 41b1b6f9 | grilled bangers | 70.0 | 80 | 227.5 | 260.0 | 0.533 | 0.533 | 1 | NULL |
| bf54e289 | 47a5570f | black pepper pork katsu | 85.0 | 45 | 233.8 | 123.8 | 0.346 | 0.346 | 1 | NULL |
| bf54e289 | 892cab9a | cheese-filled pork katsu | 65.0 | 85 | 124.8 | 163.2 | 0.567 | 0.567 | 1 | NULL |
| bf54e289 | c1ed5ce2 | shredded cabbage | 45.0 | 35 | 11.3 | 8.8 | 0.438 | 0.438 | 1 | NULL |
| bf54e289 | f4fa6c20 | original pork katsu | 70.0 | 50 | 192.5 | 137.5 | 0.417 | 0.417 | 1 | NULL |

## 5. Seafood matches (#617)

S6 returned ten rows, all with a record description. The requested binary verdict below applies **only** to the different-animal-name rule: `wrong` requires a record explicitly naming a different animal. Here `right` means no explicitly different animal was named, not that the food, preparation, recipe, portion or nutrition match was validated. In particular, "Turnover, seafood", "Crepe, with meat" and "Roll with meat and/or shrimp…" do not establish a unique species match. Missing descriptions would be `cannot tell`, rather than invented binary passes; none was missing in these ten rows.

| post | eaten_utc | item | name | grams | kcal | source | fdc_id | record_description | description_from | food_category | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4f0dc363 | 2026-11-01 | 75cb73d1 | Tuna and black olive pain Suisse | 120.0 | 248.4 | matched USDA record | 2708741 | Turnover, seafood | fdc_cache search | turnovers and other grain-based items | right |
| 0d10c312 | 2026-11-01 | 06686780 | shrimp rice noodle roll | 70.0 | 121.1 | closest USDA record | 2708719 | Crepe, with meat | item_nutrition.micronutrients approximation.basis | turnovers and other grain-based items | right |
| 25c12980 | 2026-11-01 | 216ce0f0 | shrimp rice noodle roll | 130.0 | 145.6 | closest USDA record | 2708704 | Roll with meat and/or shrimp, vegetables and rice paper, not fried | item_nutrition.micronutrients approximation.basis | egg rolls, dumplings, sushi | right |
| 189673aa | 2026-11-02 | c5c20f99 | Shrimp tempura with sauce | 65.0 | 141.7 | matched USDA record | 2706364 | Shrimp, fried | fdc_cache search | NULL | right |
| 63f6a276 | 2026-11-03 | ddb863bf | fried calamari | 150.0 | 351.0 | matched USDA record | 2706334 | Calamari, fried | fdc_cache search | shellfish | right |
| 2e5588eb | 2026-11-07 | 5a62ba1e | salt and pepper battered baby squid | 20.0 | 35.0 | matched USDA record | 171982 | Mollusks, squid, mixed species, cooked, fried | fdc_cache search | finfish and shellfish products | right |
| 816869a5 | 2026-11-08 | b3be144b | tuna rica (spicy shredded tuna with red  | 50.0 | 88.0 | matched USDA record | 2706310 | Fish, tuna, cooked | fdc_cache search | fish | right |
| 8d3f07bf | 2026-11-08 | 76fc8cc6 | Salmon bomb sushi with spicy topping and | 120.0 | 128.4 | matched USDA record | 2708969 | Sushi, topped with salmon | fdc_cache search | egg rolls, dumplings, sushi | right |
| 8d3f07bf | 2026-11-08 | 143df756 | Salmon sashimi platter with garnishes | 150.0 | 282.0 | matched USDA record | 2706284 | Fish, salmon, raw | fdc_cache search | fish | right |
| 5711e19c | 2026-11-08 | 82ff0b1b | assorted salmon sashimi | 125.0 | 235.0 | matched USDA record | 2706284 | Fish, salmon, raw | fdc_cache search | fish | right |

Ten rows show no explicitly different animal under this limited criterion; zero rows demonstrate a different named animal. No S7 photo check was performed, and truncated names/descriptions can limit what this text-only result establishes.

## 6. What the photos show

LONG RUN FLAGGED AND SKIPPED: S7 photo sampler (up to 120 downloads; duration unconfirmed, potential hours).

S7 NOT DONE. No control/sample selection, photo listing, download, image inspection or model call was made. There are no photo-based right/wrong/cannot-tell verdicts. The planned groups and sample denominators were not collected; their absence is not a zero-error result.

## 7. The causes, ranked

S8 NOT DONE because it depends on S7. No photo-validated cause ranking, flagged-versus-control counts or share of erroneous control meals is available. SQL rule counts in section 2 are screening logic, not counts of these causes.

| Cause | Flagged-meal cause count | Control-meal cause count |
|---|---|---|
| Food identified | NOT DONE | NOT DONE |
| Record matched | NOT DONE | NOT DONE |
| Weight estimated | NOT DONE | NOT DONE |
| Stored value | NOT DONE | NOT DONE |
| Not-eaten step | NOT DONE | NOT DONE |

## 8. The four meals before re-analysis

S9 before-only data, as returned; nine current food rows belong to the four prefixes. All four meals are ready. The coffee row stores 111.6 kcal for 180 g, no category and no caffeine nutrient, and has a water intake row. The three cocktail food rows already have alcohol intake rows and no caffeine intake row in this reading, while their stored nutrient caffeine remains 15.4, 14.0 and 15.4 mg. Those are distinct stored values; an absent caffeine intake row does not mean the nutrient value is absent. No write-stage before/after comparison, pilot cost or repair verdict is claimed.

| post | status | superseded_rows | item | name | grams | portion_text | category | kcal | protein_g | carbs_g | fat_g | source_ref | caffeine_mg_stored | alcohol_g_stored | item_intake_rows | post_intake_rows |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4dfe4411 | ready | 5 | 135bf72c | ham | 5.0 | 1 piece | NULL | 5.4 | 0.9 | 0.2 | 0.1 | 2073255 | NULL | NULL | NULL | NULL |
| 4dfe4411 | ready | 5 | 5192861b | mixed green salad | 50.0 | 1 small bowl | NULL | 213.5 | 1.0 | 3.7 | 21.7 | 169057 | 0.0 | 0.0 | NULL | NULL |
| 4dfe4411 | ready | 5 | 6c9dc49d | black coffee | 180.0 | 1 cup | NULL | 111.6 | 3.7 | 18.5 | 2.6 | 175224 | NULL | NULL | water 180 (180 ml) | NULL |
| 4dfe4411 | ready | 5 | ba0a2ff0 | white toast | 120.0 | 2 slices | NULL | 348.0 | 10.8 | 65.4 | 4.8 | 174925 | 0.0 | 0.0 | NULL | NULL |
| 4dfe4411 | ready | 5 | f645343f | scrambled egg with ketchup | 40.0 | 1 egg | NULL | 46.8 | 0.4 | 10.7 | 0.2 | 747693 | NULL | NULL | NULL | NULL |
| 8535b793 | ready | 1 | c6d600b5 | Lime and rum tiki cocktail | 220.0 | 1 tiki mug | liquor and cocktails | 195.8 | 0.0 | 17.2 | 0.4 | 2710626 | 15.4 | 18.3 | alcohol 18 (220 ml) | NULL |
| 8ab2eccb | ready | 0 | 7fb8c6b5 | Peach bicyclette cocktail with Prosecco, | 200.0 | 1 glass | liquor and cocktails | 178.0 | 0.0 | 15.6 | 0.4 | 2710626 | 14.0 | 16.6 | alcohol 17 (200 ml) | NULL |
| 8b728c7e | ready | 2 | 05f7d02d | Fiore cocktail with chamomile-infused vo | 220.0 | 1 tall highball glass | liquor and cocktails | 195.8 | 0.0 | 17.2 | 0.4 | 2710626 | 15.4 | 18.3 | alcohol 18 (220 ml) | NULL |
| 8b728c7e | ready | 2 | f5bfed81 | fried bar snacks | 50.0 | 1 small bowl | beans, peas, legumes | 185.5 | 12.8 | 29.9 | 1.6 | 2707429 | 0.0 | 0.0 | NULL | NULL |

## 9. What this means for revisiting every number

The SQL screen identifies 72 candidate meals out of 151, but it does not prove all are wrong. Several high-count rules catch plausible naming, dessert, alcohol or small-meal cases, so Part 3's proposed repair cohort needs validation before treating every hit as a correction target. Eleven leftovers meals include one NULL-calorie deduction, while the ten seafood rows show no explicitly different named animal under the narrow text criterion. With S7 and S8 skipped, the unflagged error share and cause ranking remain unknown, so the study cannot size the later all-meals stage. Production re-analysis and its cost pilot remain pending the later exact-head merge order.

The plan's cause/workflow items already exist; no new issue was filed or changed:

- #983: the multi-meal repair command and ledger remain planned; only literal operator SQL was added.
- #984: copying old numbers from an earlier meal remains a source-based risk, not reproduced by this read-only study; no ready copied meal was counted.
- #985: stale first comments or saved copies after re-analysis were not exercised because no re-analysis ran.
- #986: rebuilding from old numbers after a correction or leftovers-photo removal was not exercised.
- #987: estimated coffee/tea caffeine remains a source-based limitation; this inventory returned no model-estimate source rows.
- #988: the category-less drink concern has a concrete stored coffee case here, but no repair or new cause attribution was performed.
- #989: the 72 screened meals are candidates for validation, not 72 proven fixes to apply.
- #990: control error share, other accounts and saved-meal scope remain unmeasured; S7/S8 were skipped.
