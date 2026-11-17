-- #989: a stored negative nutrition value of one meal's current foods becomes zero, and the worker sums the meal
-- again and rewrites its summary. It is an operator recompute: every food keeps its nutrition, so nothing is looked
-- up again and no model is asked. Rows written since the matcher clamps carbohydrate to zero are not negative;
-- this repairs older rows (rule f of 03-suspicious.sql). NULL stays NULL. The micronutrient list is repaired the same way.
-- psql variable: post (the full meal id). Run through reanalyse.mjs only: it privately records the original
-- nutrition with 08 before this writes, so restore can run 15-repair-undo.sql on the same item IDs.
begin;
with meal as (
  select p.id from public.posts p
  where p.id = :'post'::uuid and p.status = 'ready' and p.deleted_at is null
    and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
), fixed as (
  update public.item_nutrition n set
    calories = case when n.calories < 0 then 0 else n.calories end,
    protein_g = case when n.protein_g < 0 then 0 else n.protein_g end,
    carbs_g = case when n.carbs_g < 0 then 0 else n.carbs_g end,
    fat_g = case when n.fat_g < 0 then 0 else n.fat_g end,
    fibre_g = case when n.fibre_g < 0 then 0 else n.fibre_g end,
    sugar_g = case when n.sugar_g < 0 then 0 else n.sugar_g end,
    sodium_mg = case when n.sodium_mg < 0 then 0 else n.sodium_mg end,
    micronutrients = case when jsonb_typeof(n.micronutrients) = 'array' then (
      select coalesce(jsonb_agg(case when jsonb_typeof(m->'value') = 'number' and (m->>'value')::numeric < 0
                                     then jsonb_set(m, '{value}', '0'::jsonb) else m end order by o), '[]'::jsonb)
      from jsonb_array_elements(n.micronutrients) with ordinality e(m, o)) else n.micronutrients end
  from public.post_items i
  where n.post_item_id = i.id and i.superseded_at is null and i.post_id in (select id from meal)
    and (n.calories < 0 or n.protein_g < 0 or n.carbs_g < 0 or n.fat_g < 0 or n.fibre_g < 0 or n.sugar_g < 0 or n.sodium_mg < 0)
  returning i.post_id
), queued as (
  update public.posts p set status = 'queued', fail_reason = null
  where p.id in (select post_id from fixed)
  returning p.id
)
insert into public.jobs (post_id, kind, priority, status, payload)
select id, 'recompute', 200, 'queued', '{"operator":"repair"}'::jsonb from queued
returning left(id::text, 8) as job, left(post_id::text, 8) as post, kind, priority;
commit;
