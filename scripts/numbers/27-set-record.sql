-- Operator-only chosen record; every current food is copied, originals remain as history.
-- The worker resolves a same-name bridge with a numeric reference and no amounts by id.
-- psql variables: post, item (full current food UUID), fdc (positive safe integer).
begin;
select id from public.posts where id=:'post'::uuid for update \g /dev/null
with meal as (
 select p.id from public.posts p
 join public.post_items i on i.post_id=p.id and i.id=:'item'::uuid and i.superseded_at is null
 left join public.item_nutrition n on n.post_item_id=i.id
 where p.id=:'post'::uuid and p.status='ready' and p.deleted_at is null
 and not exists(select 1 from public.jobs j where j.post_id=p.id and j.status in ('queued','running'))
 and i.portion_grams>0 and i.not_eaten_grams is null and i.not_eaten_calories is null and i.not_eaten_count_text is null
 and :'fdc' ~ '^[1-9][0-9]*$' and :'fdc'::numeric<=9007199254740991
 and n.source_ref is distinct from :'fdc'
), old as (
 update public.post_items i set superseded_at=now()
 where i.post_id in(select id from meal) and i.superseded_at is null returning i.*
), bridge as (
 insert into public.post_items(post_id,name,portion_text,portion_grams,box,mask_path,confidence,source,gtin,
  not_eaten_grams,count_text,not_eaten_count_text,not_eaten_calories,supersedes,superseded_at)
 select post_id,name,portion_text,portion_grams,box,mask_path,confidence,source,gtin,
  not_eaten_grams,count_text,not_eaten_count_text,not_eaten_calories,id,now()
 from old where id=:'item'::uuid returning id
), bridge_nutrition as (
 insert into public.item_nutrition(post_item_id,source_ref,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients)
 select id,:'fdc',null,null,null,null,null,null,null,'[]'::jsonb from bridge returning post_item_id
), copies as (
 insert into public.post_items(post_id,name,portion_text,portion_grams,box,mask_path,confidence,source,gtin,
  not_eaten_grams,count_text,not_eaten_count_text,not_eaten_calories,supersedes)
 select o.post_id,o.name,o.portion_text,o.portion_grams,o.box,o.mask_path,o.confidence,o.source,o.gtin,
  o.not_eaten_grams,o.count_text,o.not_eaten_count_text,o.not_eaten_calories,
  case when o.id=:'item'::uuid then (select post_item_id from bridge_nutrition) else o.id end
 from old o returning post_id
), queued as (
 update public.posts p set status='queued',fail_reason=null where p.id in(select post_id from copies) returning p.id
)
insert into public.jobs(post_id,kind,priority,status,payload)
 select id,'recompute',200,'queued','{"operator":"set-record"}'::jsonb from queued
 returning left(id::text,8) as job,left(post_id::text,8) as post,kind,priority;
commit;
