# Brewed tea choices

Tea remains tile index 3 in the six-tile grid. The person chooses black, green or oolong inside that tile, then a mug or large serving. Display labels never select a reference.

| Stable identity | USDA FDC record | Caffeine / 100 g | 300 ml |
| --- | --- | --- | --- |
| tea-black | [173227](https://fdc.nal.usda.gov/food-details/173227/nutrients), Beverages, tea, black, brewed, prepared with tap water | 20 mg | 60 mg |
| tea-green | [171917](https://fdc.nal.usda.gov/food-details/171917/nutrients), Beverages, tea, green, brewed, regular | 12 mg | 36 mg |
| tea-oolong | [174120](https://fdc.nal.usda.gov/food-details/174120/nutrients), Beverages, tea, Oolong, brewed | 16 mg | 48 mg |

The server reads the selected record's own caffeine nutrient (1057), scales all its nutrients and retains its source identity. Missing caffeine or a changed record description fails before publication; there is no black-tea fallback. Preview figures come from these cited records. Black tea changes from the previous fixed 45 mg to 60 mg per 300 ml.

The PM ordered the explicit convention `BREWED_TEA_GRAMS_PER_ML = 1`, limited to these three brewed teas. This is a convention rather than a density measured separately for each tea. Black's published 237 g per 8 fl oz (236.6 ml) is about 1.00 g/ml. Green's published 245 g per cup (236.6 ml) is about 1.035 g/ml: the convention differs by about 3.5% and is used instead. Oolong has no published volume portion in this record; none is invented. Other drinks are unchanged; their conversion is tracked in #1401.

The public USDA detail response was read once through its [official API](https://api.nal.usda.gov/fdc/v1/foods?api_key=DEMO_KEY&fdcIds=173227,171917,174120). The checked-in fixture preserves the published identities, nutrients and portions used by the tests. No test needs live USDA traffic.

New requests always carry `tea_id`, including black. An old queued `{tile:3}` still means black and retains exactly its previous request hash, so an existing receipt replays without publishing twice. An explicit tea id changes the request key. Unknown tea ids or a tea id on a different tile are refused.

The tea preference bucket counts `source=sheet` rows whose label exactly matches the finite tile or copied-tile set: Tea, Black tea, Green tea or Oolong tea, followed by the server's mug or large suffix. Item-sourced photo drinks and Tea cake do not enter the bucket. The other five tiles keep their prior preference rules. The picker order is fixed: black, green, oolong. Counts affect only the person's tile order and usual allowed volume; the selected record and the normal portion calculation supply nutrition and caffeine, never a count or a reported total. No migration, join, cache or longer deadline is required.

This is a preference boundary, not exclusive provenance: a person can craft such a sheet row by editing their own saved meal through the raw API. The count result affects only their own tile order/usual volume and does not supply nutrition, caffeine or totals to the tea calculation. The broader pre-existing saved snapshot integrity defect is #1404, with a held migration outside this PR. The local counterexample is recorded in SHEET-WRITER-COUNTEREXAMPLE.json; the labels must not be described as exclusively server-owned.

SQL writer inventory (including historical replacements):

- 0016: owner-writable unlinked intake is excluded by the count's non-null post filter; 0019:46 and 0029:441 prohibit owners from directly inserting linked rows.
- 0019:74 and its current replacement 0037:15: create_drink_post inserts the label with the default sheet source. The sole current app caller is postDrink, through publish_drink_operation (0045:31; held 0082 also delegates). The app chooses finite tile labels; SQL's service-role primitive itself accepts a label.
- 0026:45 and :66: original saved/post copy helpers preserve existing labels into default-sheet rows.
- 0029:33: sync_item_drinks writes item rows explicitly; :195 and :221 replace the copy helpers and filter existing sheet rows.
- 0041:42-44: the current saved-snapshot copy uses source=sheet from the saved drinks JSON and copies its label verbatim. 0041:70-71 post copies filter actual sheet rows. 0044's current publish_copy_operation delegates to these helpers; the old exposed log_saved_meal/log_post_again wrappers also delegate.
- The owner ALL policy and insert/update grant on saved_meals in 0026:9-10 still cover drinks JSON. Thus a crafted saved snapshot is an additional source of sheet labels; it is not safely excluded by source=sheet alone. Photo publication otherwise synchronizes item rows rather than minting sheet rows. There is no direct src/operator intake insert beyond these SQL paths.


Barley and matcha stay held. Barley has no cited caffeine figure, so absence is not called zero. MEXT matcha 16035 is excluded by the current identity join and its caffeine is in remarks outside the import. Deploying #1221 alone does not enable it. A future matcha preparation can use [Ippodo's stated 2 g in 60 ml](https://global.ippodo-tea.co.jp/collections/all/products/matcha5014831); it requires a usable nutrient reference first.

The five new or changed Japanese pairs are PM-drafted and require reviewer double-read; they are not native-reviewed.
