# #1421 app preparation — HELD until 0087 apply

The schema file merged in PR #1422 as fc47a172, but 0087 remains UNAPPLIED and held. This app must merge only after the owner's written database yes, the PM's exact apply order, and the 0087 read-back (after its prerequisite applies). No backfill, audit-reader activation or production operation is part of this app PR. The issue stays open for its ordered production acceptance.

## What is retained

recordMetadata accepts only numeric source refs (including blend0), the description of the same FdcFood that supplied the numbers, and its dataType. It preserves the original text; it never uses an approximation basis, a display name, a search-cache reconstruction, another detail request or a guess. Blank/whitespace descriptions, absent/blank types, overlength values or non-FDC refs yield BOTH nulls, so an incomplete pair cannot fail the whole numeric write under0087's constraints.

scaleNutrition carries that pair for exact/closest FDC and the blend's own description; estimate and unavailable carry nulls. The new pure helper has no I/O. All existing numeric calculations, lookup decisions and source refs are unchanged.

|Writer/copy path|Pair source|
|---|---|
|pipeline/persist fresh|scaleNutrition's matched food|
|pipeline/persist copied; prior.ts item_nutrition(*)|original stored pair, with old missing fields null|
|worker correct/rematch and recompute|fresh scaled match or the retained row|
|pipeline/leftovers retainedNutrition and portion rescaling|stored source pair; no reconstruction|
|nutrition/portion storedNutrition/resolvePortionNutrition|existing scaled-food path or retained row; no new lookup|
|posts/items and /api/posts/food search|server-selected FDC food|
|barcode-product productFromFood / barcodeNutrition|separate original USDA description/dataType, independent of a saved display-name correction; only numeric refs carry it; barcode-own and OFF explicitly null|
|intake/post-drink tea and other FDC drinks|selected food that supplied the numbers|
|intake/identify-drinks and photo-drinks scaling|same scaled match / stored pair; plain water explicitly null|
|meta/label and intake/drink-correction|explicit nulls, even if the old drink carried an FDC pair|

SQL copy semantics are0087's already-reviewed contract: same-ref source rows win, including their null pair. Changed refs use the new payload pair or null, never the former record's description. Saved snapshots already round-trip the pair; old snapshots remain null.

## Reads and payload cost

The pair is selected only by getCurrentItems(requireNutrition:true), which the correction, leftovers and recompute workers already use, and the existing portion-reuse nutrition read. Existing wildcard prior/removal reads already include it. Ordinary display getCurrentItems and CURRENT_NUTRITION_COLUMNS for batched Feed/UI remain unchanged: they do not download or emit this unused text. No new request, read, USDA lookup or cache lookup is introduced. There is no retry without the new columns, so the apply dependency is real even though the old RPC accepts unknown JSON keys and silently ignores them.

## Local evidence

Unit cases cover exact/closest/blend, estimate/unavailable, blank/missing/overlong fields, boundary lengths, copying and repeated scaling, barcode display-name changes versus actual supplier, and label/person corrections clearing the pair.

The real persistAnalysis integration uses a disposable loopback PostgREST/RPC stack with0087 temporarily applied, a complete scripted USDA transport and the existing local scripted chooser. Fresh matching performs the existing two search requests and one cache read, zero detail requests; a repeat copy and an old missing-pair copy add zero search/detail/cache reads. The matched description/type and calories persist, old pairs remain null, branded-FDC barcode writes store their pair and own/OFF writes store null. An ordinary display read requests no metadata. No real external model or USDA request is made. Its owned posts/cache fixtures are deleted; the temporary local schema is removed and the prior16 writer bodies restored afterwards. This is not a production apply.

Build, types, targeted lint, focused test results and the root-suite comparison are recorded in the PR/evidence. No real-phone or performance timing claim is made here.

## Writer mutation gaps closed

The review found missing test protection, not observed pair loss in b2251ac3. No product code changes are needed for this delta. Free-text rename changes the food and queues a rematch; there is no display-label-only rename action, and it must not inherit the old food's nutrition.

The real-handler/PostgREST/RPC integration now exercises a same-food portion edit followed by recompute (pair retained, amounts rescaled without another lookup), an unchanged correction (stored pair and explicit app payload retained), a search-selected food edit (new pair), and a free-text changed-food recompute (new pair). A selected record with blank data type writes both null. Tests pass on the existing b2251ac3 product code. Removing recompute's fresh pair, item edit's fresh pair, correction's unchanged pair or the portion-reuse read's pair makes the new integration fail. The unchanged correction asserts its outgoing payload as well as the stored row because 0087 independently protects same-ref SQL copies.

The source audit also rechecked persist fresh/copy, prior wildcard copies, portion scaling, leftovers retainedNutrition/carryLeftovers, correction rematch, removal rebuild, barcode FDC/own/OFF, search API and item edit, tile/caffeine drinks, photo identification/scaling, labels and person corrections. Each new source takes its pair from that source's record or both null; same-source reuse carries the stored pair. Ordinary UI reads stay unchanged. This is an audit of the paths, not a claim that every one has its own real-RPC mutation test.
