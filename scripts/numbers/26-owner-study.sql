-- #694: one account's current foods only. Run once in an explicitly guarded READ ONLY transaction.
-- psql -v uid=<account>. No caption/comment or search-cache scan.
with foods as (
 select p.id as meal_id,i.id as item_id,i.name,i.portion_grams as grams,n.calories,
        n.source_ref,n.food_category,coalesce(n.micronutrients,'[]'::jsonb) as micro,
        i.not_eaten_grams,i.not_eaten_calories,i.supersedes,n.post_item_id as nutrition_item_id,i.created_at
 from public.posts p
 join public.post_items i on i.post_id=p.id and i.superseded_at is null
 left join public.item_nutrition n on n.post_item_id=i.id
 where p.user_id=:'uid'::uuid and p.status='ready' and p.deleted_at is null
)
select json_build_object(
 'kind','meal','meal',left(f.meal_id::text,8),'item',left(f.item_id::text,8),
 'meal_id',f.meal_id,'item_id',f.item_id,'supersedes',f.supersedes,
 'name',f.name,'grams',f.grams,'kcal',f.calories,
 'kcal_per_100g',case when f.grams>0 and f.calories is not null then round(f.calories/f.grams*100,1) end,
 'record',f.source_ref,'category',f.food_category,
 'how',coalesce((select m->'approximation'->>'kind' from jsonb_array_elements(f.micro)m where m->'approximation'->>'kind' in('closest','estimate') limit 1),
                 case when f.source_ref~'^(barcode(-own)?:|off:|label|user:)' then 'own' when f.source_ref~'^[1-9][0-9]*$' then 'match' else 'none' end),
 'description',coalesce((select m->'approximation'->>'basis' from jsonb_array_elements(f.micro)m where m->'approximation'->>'kind'='closest' limit 1),c.response->'payload'->>'description',c.response->>'description'),
 'not_eaten_g',f.not_eaten_grams,'not_eaten_kcal',f.not_eaten_calories,
 'evidence_rows',jsonb_build_array(jsonb_build_object('id','post_items:'||f.item_id::text,'kind','current','meal_id',f.meal_id,'item_id',f.item_id,
   'source_row_ids',to_jsonb(array['post_items:'||f.item_id::text])||case when f.nutrition_item_id is not null then to_jsonb(array['item_nutrition:'||f.nutrition_item_id::text])else '[]'::jsonb end,
   'values',jsonb_build_object('record',f.source_ref,'grams',f.grams,'kcal',f.calories,'not_eaten_g',f.not_eaten_grams,'not_eaten_kcal',f.not_eaten_calories),
   'basis',jsonb_build_object('record','record','grams','g','kcal','kcal_per_portion','not_eaten_g','g','not_eaten_kcal','kcal_per_portion'))),
 'photos',coalesce((select json_agg(json_build_object('path',m.storage_path,'not_eaten',m.not_eaten) order by m.position,m.id) from public.post_media m where m.post_id=f.meal_id and m.kind='photo'),'[]'::json))
from foods f
left join lateral (
 select cached.response from public.fdc_cache cached
 where cached.query='fdc-detail:'||f.source_ref limit 1
) c on true
order by f.meal_id,f.created_at,f.item_id;
