-- #990: add micronutrient entries that a run's new nutrition row lacks, taken from the same food's old row, so a
-- re-match that finds a fuller record loses nothing (the butter of f08e2e86 gained energy and protein but had no
-- iodine). Only reanalyse.mjs runs it, after its own checks: the food has the same name and weight before and after,
-- and the entry is not water, caffeine or alcohol, which feed the day's totals. An entry for the same nutrient that
-- the new row holds with no value is replaced; every other entry stays as it is. Nothing else in the row changes.
-- psql variables: post (the full meal id), item (the new current item id) and entries (a JSON array of entries).
begin;
update public.item_nutrition n set micronutrients = (
  select coalesce(jsonb_agg(m order by o), '[]'::jsonb)
  from jsonb_array_elements(case when jsonb_typeof(n.micronutrients) = 'array' then n.micronutrients else '[]'::jsonb end) with ordinality e(m, o)
  where not exists (select 1 from jsonb_array_elements(:'entries'::jsonb) c where c->>'nutrientId' = m->>'nutrientId')
) || :'entries'::jsonb
from public.post_items i, public.posts p
where n.post_item_id = :'item'::uuid and i.id = n.post_item_id and i.superseded_at is null and i.post_id = :'post'::uuid
  and p.id = i.post_id and p.status = 'ready' and p.deleted_at is null
  and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
  and jsonb_typeof(:'entries'::jsonb) = 'array'
returning left(n.post_item_id::text, 8) as item, jsonb_array_length(n.micronutrients) as micronutrients;
commit;
