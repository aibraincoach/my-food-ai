-- Meals with numbers that cannot be right, and whether 12-reanalyse.sql would take each one.
-- Read-only, one SELECT. psql variable: uid (the account id).
-- It repeats rules a1, a2, b, d, e, f and g1 of 03-suspicious.sql word for word (not c, g2, h or i),
-- because one SELECT in a read-only session cannot read another file. A rule change is made in 03, 04 and 14.
-- can_reanalyse repeats the guards of 12-reanalyse.sql; a change to those guards is made in 12 and 14.
with items as (
  select p.id as post_id, i.id as item_id, i.name, i.portion_grams,
         n.post_item_id is not null as has_row, n.calories, n.protein_g, n.carbs_g, n.fat_g,
         n.fibre_g, n.sugar_g, n.sodium_mg
  from public.posts p
  join public.post_items i on i.post_id = p.id and i.superseded_at is null
  left join public.item_nutrition n on n.post_item_id = i.id
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
), flags as (
  select post_id, item_id, 'a1' as rule from items where not has_row
  union all
  select post_id, item_id, 'a2' from items where has_row and (calories is null or protein_g is null or carbs_g is null or fat_g is null)
  union all
  select post_id, item_id, 'b' from items
  where portion_grams > 20 and (calories = 0 or (protein_g = 0 and carbs_g = 0 and fat_g = 0))
    and not (name ~* '\m(water|tea|coffee|espresso|americano|diet|zero)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|mocha|bubble|boba)\M')
  union all
  select post_id, item_id, 'd' from items
  where portion_grams > 0 and calories is not null and (calories / portion_grams < 0 or calories / portion_grams > 9)
  union all
  select post_id, item_id, 'e' from items where portion_grams is null or portion_grams < 5 or portion_grams > 1500
  union all
  select post_id, item_id, 'f' from items
  where calories < 0 or protein_g < 0 or carbs_g < 0 or fat_g < 0 or fibre_g < 0 or sugar_g < 0 or sodium_mg < 0
  union all
  select post_id, item_id, 'g1' from items
  where name ~* '\m(coffee|espresso|americano|tea)\M' and name !~* '\m(milk|latte|cappuccino|sugar|mocha)\M'
    and portion_grams > 0 and calories / portion_grams > 0.25
), failing as (
  select post_id, count(distinct item_id) as items_failing, count(distinct rule) as rule_count,
         string_agg(distinct rule, ',' order by rule) as rules
  from flags group by post_id
)
select left(f.post_id::text, 8) as post, f.items_failing, f.rules,
       round((select sum(it.calories) from items it where it.post_id = f.post_id), 1) as kcal,
       (p.analysis_initialized_at is not null and p.source_post_id is null
        and exists (select 1 from public.post_media m where m.post_id = p.id and m.kind = 'photo' and not m.not_eaten)
        and not exists (select 1 from public.post_media m where m.post_id = p.id and m.kind = 'photo' and m.not_eaten)
        and not exists (select 1 from public.post_comments c where c.post_id = p.id and c.author = 'user' and c.reverted_at is null)
        and not exists (select 1 from public.intake_logs l where l.post_id = p.id and l.source = 'sheet')
        and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))) as can_reanalyse
from failing f join public.posts p on p.id = f.post_id
order by f.rule_count desc, kcal desc nulls last, post;
