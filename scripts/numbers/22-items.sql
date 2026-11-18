-- #990: each listed meal's current foods with the numbers a reviewer compares: weight, calories, calories per 100 g,
-- the matched record and its description (found as 03 finds it). Read-only, one SELECT. Prints prefixes and food
-- names only, never a caption or comment. psql variable: prefixes (comma-separated 8-character meal prefixes).
with meals as (
  select p.id from public.posts p
  where left(p.id::text, 8) = any (string_to_array(:'prefixes', ',')) and p.deleted_at is null
), items as (
  select i.post_id, i.id as item_id, i.name, i.portion_grams, i.portion_text, i.created_at,
         n.calories, n.source_ref, n.food_category, coalesce(n.micronutrients, '[]'::jsonb) as micro
  from public.post_items i join meals m on m.id = i.post_id
  left join public.item_nutrition n on n.post_item_id = i.id
  where i.superseded_at is null
), cache_foods as (
  -- One description per record, chosen the same way every run and by the rule of 06-seafood.sql:
  -- a detail entry ('fdc_cache detail') wins over a search entry ('fdc_cache search'); then the first description in text order.
  select distinct on (fdc_id) fdc_id, description from (
    select (f->>'fdcId') as fdc_id, f->>'description' as description, 'fdc_cache search' as found_in
    from public.fdc_cache c
    cross join lateral jsonb_array_elements(case when jsonb_typeof(coalesce(c.response->'payload'->'foods', c.response->'foods')) = 'array'
                                             then coalesce(c.response->'payload'->'foods', c.response->'foods') else '[]'::jsonb end) f
    union all
    select coalesce(c.response->'payload'->>'fdcId', c.response->>'fdcId'), coalesce(c.response->'payload'->>'description', c.response->>'description'), 'fdc_cache detail'
    from public.fdc_cache c where c.query like 'fdc-detail:%'
  ) d
  where fdc_id in (select source_ref from items where source_ref ~ '^[1-9][0-9]*$') and description is not null
  order by fdc_id, found_in, description
)
select left(it.post_id::text, 8) as meal, row_number() over (partition by it.post_id order by it.created_at, it.item_id) as food,
       it.name, round(it.portion_grams, 1) as grams, round(it.calories, 1) as kcal,
       case when it.portion_grams > 0 and it.calories is not null then round(it.calories / it.portion_grams * 100, 1) end as kcal_per_100g,
       it.source_ref as record, it.food_category as category,
       coalesce((select m->'approximation'->>'kind' from jsonb_array_elements(case when jsonb_typeof(it.micro) = 'array' then it.micro else '[]'::jsonb end) m
                 where m->'approximation'->>'kind' in ('closest', 'estimate') limit 1), 'match') as how,
       left(cf.description, 90) as description
from items it left join cache_foods cf on cf.fdc_id = it.source_ref
order by meal, food;
