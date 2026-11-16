with items as (
  select p.id as post_id, i.id as item_id, i.name, i.created_at, i.portion_grams as eaten_g, n.calories as eaten_kcal,
         i.not_eaten_grams as not_eaten_g, i.not_eaten_calories as not_eaten_kcal,
         (select count(*) from public.post_media m where m.post_id = p.id and m.kind = 'photo' and m.not_eaten) as not_eaten_photos
  from public.posts p
  join public.post_items i on i.post_id = p.id and i.superseded_at is null
  left join public.item_nutrition n on n.post_item_id = i.id
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
), meals as (
  select post_id from items group by post_id, not_eaten_photos
  having count(*) filter (where not_eaten_g is not null) > 0 or not_eaten_photos > 0
), rated as (
  select it.*,
         case when coalesce(it.eaten_g, 0) + coalesce(it.not_eaten_g, 0) > 0 then it.not_eaten_g / (coalesce(it.eaten_g, 0) + it.not_eaten_g) end as ratio_g,
         case when coalesce(it.eaten_kcal, 0) + coalesce(it.not_eaten_kcal, 0) > 0 then it.not_eaten_kcal / (coalesce(it.eaten_kcal, 0) + it.not_eaten_kcal) end as ratio_kcal
  from items it join meals m on m.post_id = it.post_id
)
select left(post_id::text, 8) as post, left(item_id::text, 8) as item, left(name, 40) as name,
       round(eaten_g, 1) as eaten_g, not_eaten_g, round(eaten_kcal, 1) as eaten_kcal, round(not_eaten_kcal, 1) as not_eaten_kcal,
       round(ratio_g, 3) as not_eaten_ratio_g, round(ratio_kcal, 3) as not_eaten_ratio_kcal, not_eaten_photos,
       nullif(concat_ws('; ',
         case when not_eaten_g is null then 'no deduction stored on this item' end,
         case when not_eaten_g > 0 and not_eaten_kcal is null then 'not-eaten calories NULL' end,
         case when ratio_g < 0 or ratio_g > 1 or ratio_kcal < 0 or ratio_kcal > 1 then 'ratio outside 0..1' end,
         case when abs(ratio_g - ratio_kcal) > 0.1 then 'calorie ratio differs from gram ratio' end,
         case when not_eaten_g > 0 and eaten_kcal is null then 'eaten calories NULL' end,
         case when not_eaten_photos = 0 then 'deduction without a not-eaten photo' end), '') as flag
from rated
order by post, created_at, item;
