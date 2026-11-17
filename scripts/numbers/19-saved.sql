-- #990: every saved meal and every copied meal, against the meal it came from. Read-only, one SELECT, no variables.
-- A saved meal keeps the foods and nutrition of its source meal as they were when it was saved (saved_meals.items);
-- a copy is a meal logged again from a saved meal or a meal (posts.source_post_id). The row says whether its calories
-- still match its source's current foods, and which of rules a2, d, e and f of 03-suspicious.sql its own foods fail.
-- Prefixes only: no name, caption or comment is printed.
with saved as (
  select 'saved' as kind, s.user_id, s.id, s.source_post_id,
         (select count(*) from jsonb_array_elements(s.items)) as foods,
         (select sum((e->'nutrition'->>'calories')::numeric) from jsonb_array_elements(s.items) e) as kcal,
         (select string_agg(distinct r, ',' order by r) from jsonb_array_elements(s.items) e
            cross join lateral (values
              (case when e->'nutrition'->>'calories' is null or e->'nutrition'->>'protein_g' is null
                      or e->'nutrition'->>'carbs_g' is null or e->'nutrition'->>'fat_g' is null then 'a2' end),
              (case when (e->>'portion_grams')::numeric > 0 and ((e->'nutrition'->>'calories')::numeric / (e->>'portion_grams')::numeric < 0
                      or (e->'nutrition'->>'calories')::numeric / (e->>'portion_grams')::numeric > 9) then 'd' end),
              (case when ((e->>'portion_grams') is null and not (e->'nutrition'->>'calories' is not null and e->>'portion_text' ~ '^[0-9]+([.][0-9]+)? ml$'))
                      or (e->>'portion_grams')::numeric < 5 or (e->>'portion_grams')::numeric > 1500 then 'e' end),
              (case when (e->'nutrition'->>'calories')::numeric < 0 or (e->'nutrition'->>'protein_g')::numeric < 0
                      or (e->'nutrition'->>'carbs_g')::numeric < 0 or (e->'nutrition'->>'fat_g')::numeric < 0 then 'f' end)) v(r)
            where r is not null) as rules
  from public.saved_meals s
), copies as (
  select 'copy' as kind, p.user_id, p.id, p.source_post_id,
         (select count(*) from public.post_items i where i.post_id = p.id and i.superseded_at is null) as foods,
         (select sum(n.calories) from public.post_items i join public.item_nutrition n on n.post_item_id = i.id
            where i.post_id = p.id and i.superseded_at is null) as kcal,
         null::text as rules
  from public.posts p where p.source_post_id is not null and p.status = 'ready' and p.deleted_at is null
), source as (
  select p.id, p.status, p.deleted_at is not null as deleted,
         (select count(*) from public.post_items i where i.post_id = p.id and i.superseded_at is null) as foods,
         (select sum(n.calories) from public.post_items i join public.item_nutrition n on n.post_item_id = i.id
            where i.post_id = p.id and i.superseded_at is null) as kcal
  from public.posts p where p.id in (select source_post_id from saved union select source_post_id from copies)
)
select x.kind, left(x.user_id::text, 8) as account, left(x.id::text, 8) as meal, left(x.source_post_id::text, 8) as source,
       x.foods, round(x.kcal, 1) as kcal, s.foods as source_foods, round(s.kcal, 1) as source_kcal,
       case when x.source_post_id is null then 'no source'
            when s.id is null then 'source gone'
            when s.deleted then 'source deleted'
            when s.status <> 'ready' then 'source ' || s.status
            when x.foods = s.foods and round(x.kcal, 1) is not distinct from round(s.kcal, 1) then 'matches source'
            else 'differs from source' end as against_source,
       coalesce(x.rules, '') as rules
from (select * from saved union all select * from copies) x left join source s on s.id = x.source_post_id
order by x.kind desc, account, meal;
