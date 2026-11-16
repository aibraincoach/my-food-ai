select left(p.id::text, 8) as post, p.status,
       (select count(*) from public.post_items s where s.post_id = p.id and s.superseded_at is not null) as superseded_rows,
       left(i.id::text, 8) as item, left(i.name, 40) as name, round(i.portion_grams, 1) as grams, i.portion_text,
       n.food_category as category, round(n.calories, 1) as kcal, round(n.protein_g, 1) as protein_g, round(n.carbs_g, 1) as carbs_g, round(n.fat_g, 1) as fat_g,
       left(n.source_ref, 40) as source_ref,
       (select round(max((m->>'value')::numeric), 1) from jsonb_array_elements(case when jsonb_typeof(n.micronutrients) = 'array' then n.micronutrients else '[]'::jsonb end) m
         where m->>'nutrientId' = '1057') as caffeine_mg_stored,
       (select round(max((m->>'value')::numeric), 1) from jsonb_array_elements(case when jsonb_typeof(n.micronutrients) = 'array' then n.micronutrients else '[]'::jsonb end) m
         where m->>'nutrientId' = '1018') as alcohol_g_stored,
       (select string_agg(l.kind || ' ' || l.amount || coalesce(' (' || l.ml || ' ml)', ''), ', ' order by l.kind)
          from public.intake_logs l where l.post_item_id = i.id) as item_intake_rows,
       (select string_agg(l.kind || ' ' || l.amount || coalesce(' (' || l.ml || ' ml)', '') || ' [' || l.source || ']', ', ' order by l.kind)
          from public.intake_logs l where l.post_id = p.id and l.post_item_id is null) as post_intake_rows
from public.posts p
left join public.post_items i on i.post_id = p.id and i.superseded_at is null
left join public.item_nutrition n on n.post_item_id = i.id
where left(p.id::text, 8) in ('4dfe4411', '8535b793', '8b728c7e', '8ab2eccb')
order by post, i.created_at, item;
