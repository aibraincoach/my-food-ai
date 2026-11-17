-- Undo only the in-place nutrition writes of 15-repair.sql, using the original rows recorded privately by
-- reanalyse.mjs before repair. The CLI supplies post and nutrition_rows from its selected repair snapshot.
-- This never creates items or changes their IDs; 13-restore.sql handles items, summary and recompute afterwards.
begin;
with meal as materialized (
  select p.id from public.posts p
  where p.id = :'post'::uuid and p.status = 'ready' and p.deleted_at is null
    and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
  for update
), original as (
  select * from jsonb_populate_recordset(null::public.item_nutrition, :'nutrition_rows'::jsonb)
)
update public.item_nutrition n set
  calories = o.calories, protein_g = o.protein_g, carbs_g = o.carbs_g, fat_g = o.fat_g,
  fibre_g = o.fibre_g, sugar_g = o.sugar_g, sodium_mg = o.sodium_mg,
  micronutrients = o.micronutrients, source_ref = o.source_ref, food_category = o.food_category
from original o, public.post_items i, meal
where n.post_item_id = o.post_item_id and i.id = o.post_item_id and i.post_id = meal.id;
commit;
