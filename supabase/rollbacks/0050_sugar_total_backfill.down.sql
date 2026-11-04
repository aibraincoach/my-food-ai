-- Restore null sugar for matching 1063 backfill values without a 2000 nutrient.
update public.item_nutrition n
set sugar_g = null
where n.calories is not null
  and n.sugar_g = (select (m->>'value')::numeric from jsonb_array_elements(n.micronutrients) m
                   where (m->>'nutrientId')::int = 1063 and m->>'unitName' = 'G' and m->>'basis' = 'portion' and m->>'value' is not null limit 1)
  and not exists (select 1 from jsonb_array_elements(n.micronutrients) m where (m->>'nutrientId')::int = 2000);
