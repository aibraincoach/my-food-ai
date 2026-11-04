-- Fill sugar from USDA 1063 "Sugars, Total" for rows that hold it but not 2000. Fills nulls only.
update public.item_nutrition n
set sugar_g = (select (m->>'value')::numeric from jsonb_array_elements(n.micronutrients) m
               where (m->>'nutrientId')::int = 1063 and m->>'unitName' = 'G' and m->>'basis' = 'portion' and m->>'value' is not null limit 1)
where n.sugar_g is null and n.calories is not null
  and exists (select 1 from jsonb_array_elements(n.micronutrients) m where (m->>'nutrientId')::int = 1063 and m->>'unitName' = 'G' and m->>'basis' = 'portion' and m->>'value' is not null)
  and not exists (select 1 from jsonb_array_elements(n.micronutrients) m where (m->>'nutrientId')::int = 2000);
