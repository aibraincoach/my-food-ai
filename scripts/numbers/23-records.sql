-- #990: every current food on every account's ready meals, and every food of every saved meal, with its matched record,
-- the stored closest basis or indexed detail description and category, and how it was chosen. Read-only, one SELECT, no
-- variables. One JSON object per line, read by mismatch.mjs. Prefixes and food names only, never a caption or comment.
with foods as (
  select 'meal' as kind, p.user_id, p.id as meal_id, i.id as item_id, i.name, i.portion_grams as grams, n.calories,
         n.source_ref, n.food_category, coalesce(n.micronutrients, '[]'::jsonb) as micro, i.created_at as at
  from public.posts p
  join public.post_items i on i.post_id = p.id and i.superseded_at is null
  left join public.item_nutrition n on n.post_item_id = i.id
  where p.status = 'ready' and p.deleted_at is null
  union all
  select 'saved', s.user_id, s.id, null::uuid, e.food->>'name',
         case when jsonb_typeof(e.food->'portion_grams') = 'number' then (e.food->>'portion_grams')::numeric end,
         case when jsonb_typeof(e.food->'nutrition'->'calories') = 'number' then (e.food->'nutrition'->>'calories')::numeric end,
         e.food->'nutrition'->>'source_ref', e.food->'nutrition'->>'food_category',
         case when jsonb_typeof(e.food->'nutrition'->'micronutrients') = 'array' then e.food->'nutrition'->'micronutrients' else '[]'::jsonb end,
         s.created_at + make_interval(secs => e.position)
  from public.saved_meals s
  cross join lateral jsonb_array_elements(case when jsonb_typeof(s.items) = 'array' then s.items else '[]'::jsonb end) with ordinality e(food, position)
  where jsonb_typeof(e.food) = 'object' and e.food->>'name' is not null
), needed_ids as materialized (
  select distinct source_ref as fdc_id from foods where source_ref ~ '^[1-9][0-9]*$'
), cache_foods as (
  -- query is the fdc_cache PRIMARY KEY. Do not expand the shared search cache.
  select coalesce(c.response->'payload'->>'fdcId', c.response->>'fdcId') as fdc_id,
         coalesce(c.response->'payload'->>'description', c.response->>'description') as description
  from public.fdc_cache c
  where c.query = any(array(select 'fdc-detail:' || fdc_id from needed_ids))
)
select json_build_object(
  'kind', f.kind, 'account', left(f.user_id::text, 8), 'meal', left(f.meal_id::text, 8), 'item', left(f.item_id::text, 8),
  'name', f.name, 'grams', round(f.grams, 1), 'kcal', round(f.calories, 1),
  'kcal_per_100g', case when f.grams > 0 and f.calories is not null then round(f.calories / f.grams * 100, 1) end,
  'record', f.source_ref, 'category', f.food_category,
  'how', coalesce((select m->'approximation'->>'kind' from jsonb_array_elements(f.micro) m
                   where m->'approximation'->>'kind' in ('closest', 'estimate') limit 1),
                  case when f.source_ref ~ '^(barcode(-own)?:|off:|label|user:)' then 'own' when f.source_ref ~ '^[1-9][0-9]*$' then 'match' else 'none' end),
  'detail_available', cf.description is not null,
  'description_source', case when a.basis is not null then 'basis' when cf.description is not null then 'detail' else 'none' end,
  'description', coalesce(a.basis, cf.description))
from foods f
left join lateral (select m->'approximation'->>'basis' as basis from jsonb_array_elements(f.micro) m
                   where m->'approximation'->>'kind' = 'closest' limit 1) a on true
left join cache_foods cf on cf.fdc_id = f.source_ref
order by f.kind, f.user_id, f.meal_id, f.at;
