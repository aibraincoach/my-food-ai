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

The tea preference bucket uses exact stored nutrition references 173227, 171917 and 174120. Old `Tea, mug` rows with the black reference count alongside new black tea. A label such as `Tea cake` cannot enter the bucket. The other five tiles retain their prior exact-label preference logic. Counts affect only tile ordering and usual allowed volume, never nutrient selection. No migration is required.

Barley and matcha stay held. Barley has no cited caffeine figure, so absence is not called zero. MEXT matcha 16035 is excluded by the current identity join and its caffeine is in remarks outside the import. Deploying #1221 alone does not enable it. A future matcha preparation can use [Ippodo's stated 2 g in 60 ml](https://global.ippodo-tea.co.jp/collections/all/products/matcha5014831); it requires a usable nutrient reference first.

The five new or changed Japanese pairs are PM-drafted and require reviewer double-read; they are not native-reviewed.
