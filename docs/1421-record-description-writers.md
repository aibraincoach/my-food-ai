# #1421 held migration 0087: record metadata writers

Merging this file applies nothing. The app PR waits for owner written yes and the PM-ordered apply. No backfill or production execution is part of this PR.

0087 adds nullable record_description and record_data_type together, bounded to 1–500 trimmed description characters and 1–80 data-type characters, only for numeric source refs (including blend 0). Old rows remain null. It checks the 0082 zone signature and 0084 message objects/signatures, then pins all sixteen existing function bodies before DDL. A rerun or changed/missing body raises22023, rather than silently restoring an older implementation. No grants, signatures or other function behavior changes.

## Effective writer inventory

The source extractor replays CREATE/REPLACE, DROP and RENAME by signature. Its sixteen effective writers were independently compared with all nutrition-inserting pg_proc bodies in the disposable database; signatures and source bodies match. CI checks the complete current set, explicit insert columns and both new fields. It also verifies no body change outside the nutrition insert, and deliberately unreviewed/omitted-field writers fail.

|Function signature|Latest defining migration before0087|Status|Pair provenance in0087|
|---|---|---|---|
|`apply_post_remainder(uuid,uuid,uuid,uuid[],jsonb,jsonb)`|`0084_structured_comment_messages.sql`|held per PM record|same-ref source row; otherwise payload or null|
|`apply_post_remainder(uuid,uuid,uuid,uuid[],jsonb,text)`|`0029_drinks_from_items.sql`|existing baseline; no new production verification|same-ref source row; otherwise payload or null|
|`copy_owned_post(uuid,timestamp with time zone)`|`0041_saved_drink_snapshots.sql`|existing baseline; no new production verification|source row (same ref)|
|`copy_owned_saved_meal(uuid,timestamp with time zone)`|`0041_saved_drink_snapshots.sql`|existing baseline; no new production verification|saved nutrition snapshot; old pair null|
|`correct_barcode_item(uuid,uuid,text,text,numeric,text,jsonb,jsonb)`|`0084_structured_comment_messages.sql`|held per PM record|fresh nutrition JSON payload|
|`correct_barcode_item(uuid,uuid,text,text,numeric,text,jsonb)`|`0029_drinks_from_items.sql`|existing baseline; no new production verification|fresh nutrition JSON payload|
|`create_food_post(uuid,timestamp with time zone,text,numeric,jsonb,jsonb)`|`0075_food_post_gtin.sql`|existing baseline; no new production verification|fresh nutrition JSON payload|
|`edit_post_item_with_nutrition(uuid,uuid,text,uuid,text,numeric,jsonb,jsonb)`|`0029_drinks_from_items.sql`|existing baseline; no new production verification|fresh nutrition JSON payload|
|`persist_analysis_initial(uuid,jsonb,jsonb)`|`0084_structured_comment_messages.sql`|held per PM record|fresh nutrition JSON payload|
|`persist_analysis_initial(uuid,jsonb,text)`|`0029_drinks_from_items.sql`|existing baseline; no new production verification|fresh nutrition JSON payload|
|`persist_correction(uuid,uuid,uuid[],uuid,jsonb,jsonb)`|`0084_structured_comment_messages.sql`|held per PM record|same-ref source row; otherwise payload or null|
|`persist_correction(uuid,uuid,uuid[],uuid,jsonb,text)`|`0029_drinks_from_items.sql`|existing baseline; no new production verification|same-ref source row; otherwise payload or null|
|`persist_photo_correction(uuid,uuid,uuid[],jsonb,jsonb,jsonb)`|`0084_structured_comment_messages.sql`|held per PM record|same-ref source row; otherwise payload or null|
|`persist_photo_correction(uuid,uuid,uuid[],jsonb,text,jsonb)`|`0029_drinks_from_items.sql`|existing baseline; no new production verification|same-ref source row; otherwise payload or null|
|`persist_removed_rebuild(uuid,uuid,uuid[],uuid[],uuid[],jsonb,jsonb)`|`0084_structured_comment_messages.sql`|held per PM record|same-ref source row; otherwise payload or null|
|`persist_removed_rebuild(uuid,uuid,uuid[],uuid[],uuid[],jsonb,text)`|`0030_delete_and_remove.sql`|existing baseline; no new production verification|same-ref source row; otherwise payload or null|

Prerequisites by number and function:0084 supplies the jsonb overloads of persist_analysis_initial, persist_correction, apply_post_remainder, persist_photo_correction, persist_removed_rebuild and correct_barcode_item.0084 itself requires0082 atomic zone overloads;0087 independently checks require_capture_zone and the zoned publish_food_operation signature.0078–0080 are absent/reserved on this main base;0085/0086 define no item_nutrition writer. If another held migration changes one of the pinned bodies before apply,0087 must be recomposed and reviewed; it must not overwrite that change. PM sequences applies, each requiring the owner's yes.

For same-ref copies, source-row metadata wins even over a conflicting payload. When the ref changes, the payload pair (or null) wins, never the old description. This includes text and jsonb correction, photo correction, leftovers and removal-rebuild overloads. The former whole-record rebuild insert is explicit about all current nutrition columns and the pair. Saved snapshots already include to_jsonb(n), so the pair round-trips without a separate snapshot writer change; old snapshots carry null. This does not change the separate pre-existing owner-writable snapshot boundary tracked in#1404.

## Validation and rollout

- Disposable DB tests exercise all16 writer signatures, both comment formats, constraints (including null source ref), old-row preservation, same-ref/changed-ref copying, saved and old snapshots, prerun prerequisites, rerun refusal and unchanged writer privileges. Every test rolls back its schema and fixture changes.
- Mutations dropping the ref equality, dropping fresh pairs and removing the non-FDC constraint each fail the corresponding real DB tests.
- Existing source-ref writer inventory extended for0087; the14/23 hashes also updated to match already-merged#1415 (the snapshot on main was stale), with no assertion removed or source form changed.
- The pre-0087 create_food_post really accepts unknown JSON keys but ignores them: a disposable proof shows the pair is not retained. Therefore the app PR remains held after0087's ordered apply, so its first deployed new row will retain its name.

App changes are a separate PR. Later audit changes that prefer record_description are also separately reviewed. This migration changes no old rows or source refs and performs no USDA/cache lookup.
