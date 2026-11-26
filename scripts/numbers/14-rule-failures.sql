-- #694: rule evidence on one owner's current, non-deleted ready posts.
-- Read-only, one SELECT. psql variable uid. Output: prefix, failing item count,
-- rule codes (empty for unknown-only rows), and otherwise-eligible g1 items
-- whose description cannot be judged. A missing description is not a g1 hit.
-- Numeric/name predicates a1/a2/b/d/e/f/g1 are retained; identity lookup is
-- stored closest basis first, then indexed detail only. No shared search scan.
with items as (
  select p.id as post_id, i.id as item_id, i.name, i.portion_grams, i.portion_text,
         n.post_item_id is not null as has_row, n.calories, n.protein_g, n.carbs_g, n.fat_g,
         n.fibre_g, n.sugar_g, n.sodium_mg, n.source_ref, n.food_category,
         coalesce(n.micronutrients, '[]'::jsonb) as micro
  from public.posts p
  join public.post_items i on i.post_id = p.id and i.superseded_at is null
  left join public.item_nutrition n on n.post_item_id = i.id
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
), needed_ids as materialized (
  select distinct source_ref as fdc_id from items where source_ref ~ '^[1-9][0-9]*$'
), cache_foods as (
  -- query is the fdc_cache PRIMARY KEY. Do not expand the shared search cache.
  select coalesce(c.response->'payload'->>'fdcId', c.response->>'fdcId') as fdc_id,
         coalesce(c.response->'payload'->>'description', c.response->>'description') as description
  from public.fdc_cache c
  where c.query = any(array(select 'fdc-detail:' || fdc_id from needed_ids))
), described0 as (
  select it.*,
         coalesce((select m->'approximation'->>'basis' from jsonb_array_elements(case when jsonb_typeof(it.micro) = 'array' then it.micro else '[]'::jsonb end) m
                    where m->'approximation'->>'kind' = 'closest' limit 1), cf.description) as raw_description
  from items it left join cache_foods cf on cf.fdc_id = it.source_ref
), described as (
  select d0.*, case when raw_description like 'Combined %' then regexp_replace(raw_description, ' for .*$', '') else raw_description end as record_description
  from described0 d0
), g1_candidates as (
  select * from described
  where name ~* '\m(coffee|espresso|americano|tea)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|sweetened|condensed|mocha|brownie|cookie|cake)\M'
    and portion_grams > 0 and calories / portion_grams > 0.25
    and not (name ~* '\miced\M' and name ~* '\mtea\M' and calories / portion_grams <= 0.40)
), g1_unknown as (
  select post_id, count(*) as g1_cannot_tell from g1_candidates
  where record_description is null group by post_id
), flags as (
  select post_id, item_id, 'a1' as rule from items where not has_row
  union all
  select post_id, item_id, 'a2' from items where has_row and (calories is null or protein_g is null or carbs_g is null or fat_g is null)
  union all
  select post_id, item_id, 'b' from items
  where portion_grams > 20 and (calories = 0 or (protein_g = 0 and carbs_g = 0 and fat_g = 0))
    and not (name ~* '\m(water|tea|coffee|espresso|americano|diet|zero)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|mocha|bubble|boba)\M')
    and not (calories > 0 and lower(coalesce(food_category, '')) in ('alcoholic beverages', 'beer', 'wine', 'liquor and cocktails'))
  union all
  select post_id, item_id, 'd' from items
  where portion_grams > 0 and calories is not null and (calories / portion_grams < 0 or calories / portion_grams > 9)
  union all
  select post_id, item_id, 'e' from items where (portion_grams is null and not (calories is not null and portion_text ~ '^[0-9]+([.][0-9]+)? ml$')) or portion_grams < 5 or portion_grams > 1500
  union all
  select post_id, item_id, 'f' from items
  where calories < 0 or protein_g < 0 or carbs_g < 0 or fat_g < 0 or fibre_g < 0 or sugar_g < 0 or sodium_mg < 0
  union all
  select post_id, item_id, 'g1' from g1_candidates
  where record_description is not null and record_description !~* '\mmilk\M'
), failing as (
  select post_id, count(distinct item_id) as items_failing, count(distinct rule) as rule_count,
         string_agg(distinct rule, ',' order by rule) as rules
  from flags group by post_id
)
select left(p.post_id::text, 8) as post, coalesce(f.items_failing, 0) as items_failing,
       coalesce(f.rules, '') as rules, coalesce(u.g1_cannot_tell, 0) as g1_cannot_tell
from (select post_id from failing union select post_id from g1_unknown) p
left join failing f on f.post_id = p.post_id
left join g1_unknown u on u.post_id = p.post_id
order by coalesce(f.rule_count, 0) desc, post;
