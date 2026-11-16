with items as (
  select p.id as post_id, p.eaten_at, i.id as item_id, i.name, i.portion_grams, n.calories, n.source_ref, n.food_category,
         coalesce(n.micronutrients, '[]'::jsonb) as micro
  from public.posts p
  join public.post_items i on i.post_id = p.id and i.superseded_at is null
  left join public.item_nutrition n on n.post_item_id = i.id
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
    and i.name ~* '\m(squid|ika|calamari|octopus|tako|takoyaki|eels?|unagi|mackerel|saba|salmon|tuna|shrimps?|ebi)\M'
), cache_foods as (
  select distinct on (fdc_id) fdc_id, description, found_in from (
    select (f->>'fdcId') as fdc_id, f->>'description' as description, 'fdc_cache search' as found_in
    from public.fdc_cache c
    cross join lateral jsonb_array_elements(case when jsonb_typeof(coalesce(c.response->'payload'->'foods', c.response->'foods')) = 'array'
                                             then coalesce(c.response->'payload'->'foods', c.response->'foods') else '[]'::jsonb end) f
    union all
    select coalesce(c.response->'payload'->>'fdcId', c.response->>'fdcId'), coalesce(c.response->'payload'->>'description', c.response->>'description'), 'fdc_cache detail'
    from public.fdc_cache c where c.query like 'fdc-detail:%'
  ) d
  where fdc_id in (select source_ref from items where source_ref ~ '^[1-9][0-9]*$') and description is not null
  order by fdc_id, found_in
)
select left(it.post_id::text, 8) as post, to_char(it.eaten_at at time zone 'UTC', 'YYYY-MM-DD') as eaten_utc, left(it.item_id::text, 8) as item,
       left(it.name, 40) as name, round(it.portion_grams, 1) as grams, round(it.calories, 1) as kcal,
       case when it.source_ref like 'estimate:%' then 'model estimate'
            when it.source_ref like 'unavailable:%' then 'unavailable'
            when it.source_ref = '0' then 'rice-and-protein blend'
            when it.micro @> '[{"approximation":{"kind":"closest"}}]' then 'closest USDA record'
            when it.source_ref ~ '^[1-9][0-9]*$' then 'matched USDA record'
            else coalesce(split_part(it.source_ref, ':', 1), 'none') end as source,
       case when it.source_ref ~ '^[0-9]+$' then it.source_ref end as fdc_id,
       left(coalesce(
         (select m->'approximation'->>'basis' from jsonb_array_elements(case when jsonb_typeof(it.micro) = 'array' then it.micro else '[]'::jsonb end) m
           where m->'approximation'->>'basis' is not null limit 1),
         cf.description,
         case when it.source_ref like 'unavailable:%' then split_part(it.source_ref, ':', 2) end), 90) as record_description,
       case when it.micro @> '[{"approximation":{}}]' then 'item_nutrition.micronutrients approximation.basis' else cf.found_in end as description_from,
       it.food_category
from items it left join cache_foods cf on cf.fdc_id = it.source_ref
order by it.eaten_at, post, name;
