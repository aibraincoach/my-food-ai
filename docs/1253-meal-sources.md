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
