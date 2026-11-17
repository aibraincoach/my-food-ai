with items as (
  select p.id as post_id, i.id as item_id, i.name, i.portion_grams,
         n.post_item_id is not null as has_row, n.calories, n.protein_g, n.carbs_g, n.fat_g,
         n.fibre_g, n.sugar_g, n.sodium_mg, n.source_ref, n.food_category,
         coalesce(n.micronutrients, '[]'::jsonb) as micro,
         (select max((m->>'value')::numeric) from jsonb_array_elements(case when jsonb_typeof(n.micronutrients) = 'array' then n.micronutrients else '[]'::jsonb end) m
           where m->>'nutrientId' = '1018' and m->>'basis' = 'portion') as alcohol_g,
         (select max((m->>'value')::numeric) from jsonb_array_elements(case when jsonb_typeof(n.micronutrients) = 'array' then n.micronutrients else '[]'::jsonb end) m
           where m->>'nutrientId' = '1057' and m->>'basis' = 'portion') as caffeine_mg,
         (select max(l.amount) from public.intake_logs l where l.post_item_id = i.id and l.kind = 'caffeine') as intake_caffeine_mg
  from public.posts p
  join public.post_items i on i.post_id = p.id and i.superseded_at is null
  left join public.item_nutrition n on n.post_item_id = i.id
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
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
), described0 as (
  select it.*,
         coalesce((select m->'approximation'->>'basis' from jsonb_array_elements(case when jsonb_typeof(it.micro) = 'array' then it.micro else '[]'::jsonb end) m
                    where m->'approximation'->>'kind' = 'closest' limit 1), cf.description) as raw_description
  from items it left join cache_foods cf on cf.fdc_id = it.source_ref
), described as (
  select d0.*, case when raw_description like 'Combined %' then regexp_replace(raw_description, ' for .*$', '') else raw_description end as record_description
  from described0 d0
), flags as (
  select post_id, item_id, name, portion_grams, calories, 'a1 no nutrition row' as reason, null::text as detail from described where not has_row
  union all
  select post_id, item_id, name, portion_grams, calories, 'a2 calories, protein, carbs or fat is NULL',
         concat_ws(' ', case when calories is null then 'kcal' end, case when protein_g is null then 'protein' end,
                   case when carbs_g is null then 'carbs' end, case when fat_g is null then 'fat' end, '| source_ref:', coalesce(left(source_ref, 60), 'NULL'))
  from described where has_row and (calories is null or protein_g is null or carbs_g is null or fat_g is null)
  union all
  select post_id, item_id, name, portion_grams, calories, 'b zero calories or all macros zero on more than 20 g',
         'kcal ' || calories || ', p/c/f ' || protein_g || '/' || carbs_g || '/' || fat_g
  from described
  where portion_grams > 20 and (calories = 0 or (protein_g = 0 and carbs_g = 0 and fat_g = 0))
    and not (name ~* '\m(water|tea|coffee|espresso|americano|diet|zero)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|mocha|bubble|boba)\M')
  union all
  select post_id, item_id, name, portion_grams, calories, 'c energy differs from 4p+4c+9f+7alc by more than 25% and 40 kcal',
         'from macros ' || round(4 * protein_g + 4 * carbs_g + 9 * fat_g + 7 * coalesce(alcohol_g, 0), 1) || ' kcal (alcohol grams stored: ' || coalesce(round(alcohol_g, 1)::text, 'none') || ')'
  from described
  where calories is not null and protein_g is not null and carbs_g is not null and fat_g is not null
    and abs(calories - (4 * protein_g + 4 * carbs_g + 9 * fat_g + 7 * coalesce(alcohol_g, 0))) > 0.25 * calories
    and abs(calories - (4 * protein_g + 4 * carbs_g + 9 * fat_g + 7 * coalesce(alcohol_g, 0))) > 40
  union all
  select post_id, item_id, name, portion_grams, calories, 'd energy density outside 0 to 9 kcal per gram',
         round(calories / portion_grams, 2) || ' kcal/g'
  from described where portion_grams > 0 and calories is not null and (calories / portion_grams < 0 or calories / portion_grams > 9)
  union all
  select post_id, item_id, name, portion_grams, calories, 'e portion NULL, under 5 g or over 1500 g', coalesce(portion_grams::text, 'NULL') || ' g'
  from described where portion_grams is null or portion_grams < 5 or portion_grams > 1500
  union all
  select post_id, item_id, name, portion_grams, calories, 'f negative value',
         concat_ws(' ', case when calories < 0 then 'kcal ' || calories end, case when protein_g < 0 then 'protein ' || protein_g end,
                   case when carbs_g < 0 then 'carbs ' || carbs_g end, case when fat_g < 0 then 'fat ' || fat_g end,
                   case when fibre_g < 0 then 'fibre ' || fibre_g end, case when sugar_g < 0 then 'sugar ' || sugar_g end,
                   case when sodium_mg < 0 then 'sodium ' || sodium_mg end)
  from described where calories < 0 or protein_g < 0 or carbs_g < 0 or fat_g < 0 or fibre_g < 0 or sugar_g < 0 or sodium_mg < 0
  union all
  select post_id, item_id, name, portion_grams, calories, 'g1 plain coffee or tea above 0.25 kcal per gram',
         round(calories / portion_grams, 2) || ' kcal/g, category ' || coalesce(food_category, 'NULL')
  from described
  where name ~* '\m(coffee|espresso|americano|tea)\M' and name !~* '\m(milk|latte|cappuccino|sugar|mocha)\M'
    and portion_grams > 0 and calories / portion_grams > 0.25
  union all
  select post_id, item_id, name, portion_grams, calories, 'g2 caffeine stored on a name with no caffeine source',
         'nutrient ' || coalesce(round(caffeine_mg, 1)::text, '-') || ' mg, intake row ' || coalesce(intake_caffeine_mg::text, '-') || ' mg, category ' || coalesce(food_category, 'NULL')
  from described
  where (caffeine_mg > 0 or intake_caffeine_mg > 0)
    and name !~* '\m(coffee|tea|cola|coke|energy|mate|chocolate|cocoa|espresso|americano|latte|cappuccino|macchiato|mocha|matcha|pepsi|kopi|teh|guarana)\M'
  union all
  select post_id, item_id, name, portion_grams, calories, 'i matched record shares no word with the item name', left(record_description, 80)
  from described
  where record_description is not null
    and not exists (
      select 1 from regexp_split_to_table(lower(name), '[^a-z]+') w(word)
      where length(word) >= 4
        and regexp_replace(word, '(es|s)$', '') in (select regexp_replace(d, '(es|s)$', '') from regexp_split_to_table(lower(record_description), '[^a-z]+') x(d) where length(d) >= 4))
  union all
  select post_id, null, '(whole meal, ' || count(*) || ' items)', sum(portion_grams), sum(calories), 'h meal total under 30 or over 2500 kcal',
         count(*) filter (where calories is null) || ' item(s) without calories'
  from described group by post_id
  having coalesce(sum(calories), 0) < 30 or sum(calories) > 2500
)
select left(post_id::text, 8) as post, left(item_id::text, 8) as item, left(name, 40) as name,
       round(portion_grams, 1) as grams, round(calories, 1) as kcal, reason, detail
from flags
order by reason, post, name;
