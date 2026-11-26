# Actual nutrition suppliers

The nutrition table names only recorded suppliers. The card footnote remains
source-neutral. The classifier uses typed source references and estimate tags,
never food names or stored prose. Unknown references throw visibly. Unavailable
foods supplied no values and add no supplier. Suppliers appear once in a fixed
order. Old null and barcode references show an explicit unrecorded-source line;
old mixed photo-drink corrections show entered macro values plus an unrecorded
nutrient-source warning. No old row is rewritten or guessed.

New water tiles record `user:drink-tile`. Corrected photo drinks record
`user:drink-correction:<reading_id>`; old `user:photo-drink:` references retain
their separate meaning. Saving confirms all displayed macro inputs, but a
cleared field stays null. The unchanged editor cannot save, and an identical
PATCH is refused. Optional caffeine is an integer 0–1000 mg for this drink,
initially empty, with empty meaning unknown. It is never prefilled from the
database. The ordinary barcode correction editor keeps its existing behavior.

## Corrected photo-drink fields

| Field | New value |
|---|---|
| name | Submitted, trimmed name |
| ml | Submitted package volume |
| nutrition's seven macro columns | Confirmed per-100 ml input × volume / 100; null stays null |
| kcal | The corrected calories column |
| caffeineMg | Only the submitted optional caffeine amount; empty is null |
| micronutrients | Water 1051 from submitted ml; caffeine 1057 only when entered |
| source_ref | New typed personal correction reference |
| grams | Null; previous density is discarded |
| food_category | Null; previous USDA category is discarded |
| source | Original photo-reading method metadata, retained as capture history, not nutrition provenance |

No earlier nutrient, approximation tag, category, density or caffeine amount is
carried into the new nutrition. A rename cannot keep the previous drink's
potassium or vitamin C. The real publication RPC reads the entered caffeine
entry into intake, so it contributes to the daily total. Reading correction
ownership, draft locking and revision fences are unchanged.

## Barcode references and consumers

The product's UI `source` still describes a saved name or other product facts.
The required `nutritionSource` separately identifies whether usable saved
nutrients replaced the provider's values. Only that case writes
`barcode-own:<gtin>`; name-only and serving-only changes retain the numeric USDA
or OFF reference. Old `barcode:` rows remain readable but their nutrient supplier
is explicitly unrecorded.

| Consumer | Handling |
|---|---|
| barcode-product.ts, both food publication and correct-item routes | New nutrition source determines the stored ref |
| NutritionTable / meal-sources.ts | New own ref is saved values; old ref is unrecorded |
| nutrition/portion.ts | Opaque non-numeric ref survives retained amount rescaling; never fetched as USDA |
| pipeline/prior-nutrition.ts | Both own and old refs are ineligible for numeric USDA copy trust |
| worker/jobs/recompute.ts | Package guard includes both refs, so incomplete saved values do not trigger a name lookup |
| 0041 copy_owned_post / copy_owned_saved_meal | Existing SQL copies source_ref verbatim, unchanged |
| numbers/02-inventory.sql | Separate truthful new-own and old-unrecorded labels |
| numbers/11-rematch.sql, 23-records.sql, 26-owner-study.sql | Existing package handling includes both refs |

There are no other source-prefix consumers in src, scripts or applied SQL.
Reports were changed locally, never executed against production.

## Composition and limits

This branch is based on main, independent of held #1392 and #1399. It understands
the `mext:` prefix and its approved supplier label but neither reads jp_foods nor
duplicates #1399's credit component. Whichever branch merges second must wire
that component into the source table and review that delta. No migration is
added or applied.

The 13 Japanese strings are PM-drafted and reviewer double-read, not
native-reviewed. Supplier lists use Japanese 、 or English comma-space; warnings
are separate complete paragraphs. Browser evidence covers the real table's SSR
output and built CSS at 390px in Chromium and WebKit, including accessibility
snapshots; it is component evidence, not an authenticated full-app journey or a
real phone. The correction sheet's state is verified separately in both locales,
and the PATCH and publication checks use an owned disposable database.

## Complete source-reference writer audit (S10)

The reviewed search covers all source_ref and sourceRef assignments in src,
plus every source_ref site in migration and operator SQL. The CI fixture
source-writers.json pins that complete search, including pass-through and trace
metadata sites rather than relying on a hand-selected set of writer filenames.
A new or changed assignment or SQL source-reference site fails the inventory
test. Its accepted form must be added to the classifier and real-table corpus
at the same review. The corpus renders every listed form in English and Japanese;
an invented prefix throws through the actual NutritionTable component.

| Constructor | Every form it can generate |
|---|---|
| fdc/nutrients.ts scaleNutrition | Numeric USDA ids (including 0 for a composed USDA reference); estimate:<basis>; unavailable:not_food:<detail>, unavailable:no_match:<detail>, unavailable:no_estimate:<detail>. No-food without a reason now throws; sourceRef is non-nullable. |
| meta/label.ts labelNutrition | Bare label. The analyze job passes this to persistAnalysis's label branch, which publishes the label nutrition directly. |
| app/api/posts/food/route.ts photographed-label branch | label:<reading_id>. Other food branches pass barcodeNutrition or scaleNutrition's ref unchanged. |
| fdc/barcode-product.ts barcodeNutrition | barcode-own:<gtin> for usable saved nutrients, off:<gtin> for OFF, numeric USDA otherwise. |
| intake/post-drink.ts | user:drink-tile for water; scaleNutrition's numeric ref for reference-backed tiles. |
| intake/identify-drinks.ts | user:drink-volume for plain water confirmed in the photo-drink flow; non-water uses resolveFoodMatchDetailed and passes its unavailable reason to scaleNutrition. It never scales a null food without a reason. |
| intake/drink-correction.ts | user:drink-correction:<reading_id>. |
| Held #1399 scaleMextNutrition | mext:<five-digit food number>; supported here without a schema dependency. |

Old barcode:<gtin>, old user:photo-drink:<id> and old null are compatibility
reads only. They keep their explicit uncertainty labels and are never rewritten.
Bare label and label:<id> are equally valid package-label sources. An estimate
reference is explicit provenance even when its tag is absent: the supplier list
accepts the prefix; tag-dependent per-food approximation wording stays separate.

The other src assignment sites (persistAnalysis, correction/recompute,
items/portion, leftovers and numeric rescaling) pass through one of these
constructors or retain an existing stored reference. Their no-food calls either
pass resolveFoodMatchDetailed's reason or have a non-null exact-reference read;
the no-food guard prevents a new silent null if that assumption changes.

SQL does not invent a supplier form. Nutrition sinks accept the server's typed
p_nutrition/p_items JSON or copy an existing source_ref: create_food_post and its
retained without-GTIN wrapper; edit_post_item_with_nutrition;
persist_analysis/persist_analysis_initial/persist_correction/
persist_photo_correction/persist_removed_rebuild; correct_barcode_item;
apply_post_remainder; copy_owned_post/copy_owned_saved_meal. The operation
wrappers delegate to those sinks. publish_composer_drinks corrects/publishes
server-held reading items by calling the correction/item sinks; its reading
cache retains the constructor output. agent_log_meal itself only creates the
post/job, and subsequent analysis uses the same constructors. Held 0082 and
0084 add zone/message overloads and still pass the supplied reference through;
they remain unapplied. SQL retention, summary guards and format triggers do not
choose a source. CI pins source-reference sites across historical definitions
too, so a newly introduced SQL writer cannot silently escape this search.
