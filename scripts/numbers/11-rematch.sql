begin;
with old as (
  update public.post_items i set superseded_at = now()
  where i.post_id = :'post'::uuid and i.superseded_at is null
    and exists (select 1 from public.posts p where p.id = i.post_id and p.status = 'ready' and p.deleted_at is null)
    and not exists (select 1 from public.jobs j where j.post_id = i.post_id and j.status in ('queued', 'running'))
  returning i.*
)
insert into public.post_items (post_id, name, portion_text, portion_grams, box, mask_path, confidence, source, gtin,
                               not_eaten_grams, count_text, not_eaten_count_text, not_eaten_calories, supersedes)
select o.post_id, o.name, o.portion_text, o.portion_grams, o.box, o.mask_path, o.confidence, o.source, o.gtin,
       o.not_eaten_grams, o.count_text, o.not_eaten_count_text, o.not_eaten_calories,
       case when n.source_ref ~ '^(barcode:|off:|label|user:)' or o.gtin is not null then o.id end
from old o left join public.item_nutrition n on n.post_item_id = o.id;
update public.posts set status = 'queued', fail_reason = null
where id = :'post'::uuid and status = 'ready'
  and exists (select 1 from public.post_items i where i.post_id = :'post'::uuid and i.superseded_at is null);
insert into public.jobs (post_id, kind, priority, status, payload)
select p.id, 'recompute', 200, 'queued', '{"operator":"rematch"}'::jsonb
from public.posts p where p.id = :'post'::uuid and p.status = 'queued'
  and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'));
commit;
