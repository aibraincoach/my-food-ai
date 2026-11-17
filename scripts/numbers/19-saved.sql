-- #990: every saved meal and every copied meal, against the meal it came from. Read-only, one SELECT, no variables.
-- A saved meal keeps the foods and nutrition of its source meal as they were when it was saved (saved_meals.items);
-- a copy is a meal logged again from a saved meal or a meal (posts.source_post_id). The row says whether its calories
-- still match its source's current foods, and which of rules a2, d, e and f of 03-suspicious.sql its own foods fail.
-- #1048: a saved value is read as a number only when it is a JSON number or a numeric string. A string that is not a
-- number (empty, or text) is not turned into zero and does not stop the report: the value is unknown, and the meal's
-- row lists rule x, "a saved number cannot be read". A value that is absent, null or not a string or number counts as
-- missing (rule a2). A saved meal whose items is not a list has no foods and x.
-- Prefixes only: no name, caption or comment is printed.
with saved_foods as (
  select s.id, e.food, e.position,
         case when jsonb_typeof(e.food) <> 'object' then null when g.raw ~ '^\s*-?[0-9]+([.][0-9]+)?\s*$' then g.raw::numeric end as grams,
         case when c.raw ~ '^\s*-?[0-9]+([.][0-9]+)?\s*$' then c.raw::numeric end as kcal,
         case when pr.raw ~ '^\s*-?[0-9]+([.][0-9]+)?\s*$' then pr.raw::numeric end as protein,
         case when cb.raw ~ '^\s*-?[0-9]+([.][0-9]+)?\s*$' then cb.raw::numeric end as carbs,
         case when ft.raw ~ '^\s*-?[0-9]+([.][0-9]+)?\s*$' then ft.raw::numeric end as fat,
         -- x: a value that is present but is not a number.
         jsonb_typeof(e.food) <> 'object' or exists (select 1 from (values (g.raw), (c.raw), (pr.raw), (cb.raw), (ft.raw)) v(raw)
                where v.raw is not null and v.raw !~ '^\s*-?[0-9]+([.][0-9]+)?\s*$') as unreadable,
         c.raw is null or pr.raw is null or cb.raw is null or ft.raw is null as missing
  from public.saved_meals s
  cross join lateral jsonb_array_elements(case when jsonb_typeof(s.items) = 'array' then s.items else '[]'::jsonb end) with ordinality e(food, position)
  cross join lateral (select case when jsonb_typeof(e.food) = 'object' and jsonb_typeof(e.food->'portion_grams') in ('number', 'string') then e.food->>'portion_grams' end) g(raw)
  cross join lateral (select case when jsonb_typeof(e.food->'nutrition') = 'object' and jsonb_typeof(e.food->'nutrition'->'calories') in ('number', 'string') then e.food->'nutrition'->>'calories' end) c(raw)
  cross join lateral (select case when jsonb_typeof(e.food->'nutrition') = 'object' and jsonb_typeof(e.food->'nutrition'->'protein_g') in ('number', 'string') then e.food->'nutrition'->>'protein_g' end) pr(raw)
  cross join lateral (select case when jsonb_typeof(e.food->'nutrition') = 'object' and jsonb_typeof(e.food->'nutrition'->'carbs_g') in ('number', 'string') then e.food->'nutrition'->>'carbs_g' end) cb(raw)
  cross join lateral (select case when jsonb_typeof(e.food->'nutrition') = 'object' and jsonb_typeof(e.food->'nutrition'->'fat_g') in ('number', 'string') then e.food->'nutrition'->>'fat_g' end) ft(raw)
), saved as (
  select 'saved' as kind, s.user_id, s.id, s.source_post_id,
         (select count(*) from saved_foods f where f.id = s.id) as foods,
         (select sum(f.kcal) from saved_foods f where f.id = s.id) as kcal,
         (select string_agg(distinct r, ',' order by r) from (
            select case when jsonb_typeof(s.items) <> 'array' then 'x' end
            union all
            select r from saved_foods f cross join lateral (values
              (case when f.missing or (not f.unreadable and (f.kcal is null or f.protein is null or f.carbs is null or f.fat is null)) then 'a2' end),
              (case when f.grams > 0 and (f.kcal / f.grams < 0 or f.kcal / f.grams > 9) then 'd' end),
              (case when (f.grams is null and not f.unreadable and not (f.kcal is not null and f.food->>'portion_text' ~ '^[0-9]+([.][0-9]+)? ml$'))
                      or f.grams < 5 or f.grams > 1500 then 'e' end),
              (case when f.kcal < 0 or f.protein < 0 or f.carbs < 0 or f.fat < 0 then 'f' end),
              (case when f.unreadable then 'x' end)) v(r)
            where f.id = s.id) rr(r) where r is not null) as rules
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
