-- #990: look up again only the listed foods of one meal, whose records are another kind of food (mismatch.mjs). Every
-- other food keeps its nutrition exactly: its new row supersedes the old one under the same name, so the recompute
-- retains and rescales it (resolvePortionNutrition) instead of matching it again. As 11-rematch.sql otherwise: old
-- rows are kept, marked superseded. Run only through reanalyse.mjs run --mode=recheck, which takes the snapshot first.
-- psql variables: post (the meal's id), items (comma-separated 8-character prefixes of the foods to look up again).
begin;
with old as (
  update public.post_items i set superseded_at = now()
  where i.post_id = :'post'::uuid and i.superseded_at is null
    and exists (select 1 from public.posts p where p.id = i.post_id and p.status = 'ready' and p.deleted_at is null)
    and not exists (select 1 from public.jobs j where j.post_id = i.post_id and j.status in ('queued', 'running'))
    -- Every listed food must still be a current food of this meal, or nothing changes.
    and (select count(*) from public.post_items t where t.post_id = :'post'::uuid and t.superseded_at is null
           and left(t.id::text, 8) = any (string_to_array(:'items', ','))) = cardinality(string_to_array(:'items', ','))
  returning i.*
)
insert into public.post_items (post_id, name, portion_text, portion_grams, box, mask_path, confidence, source, gtin,
                               not_eaten_grams, count_text, not_eaten_count_text, not_eaten_calories, supersedes)
select o.post_id, o.name, o.portion_text, o.portion_grams, o.box, o.mask_path, o.confidence, o.source, o.gtin,
       o.not_eaten_grams, o.count_text, o.not_eaten_count_text, o.not_eaten_calories,
       case when left(o.id::text, 8) = any (string_to_array(:'items', ',')) then null else o.id end
from old o;
update public.posts set status = 'queued', fail_reason = null
where id = :'post'::uuid and status = 'ready'
  and exists (select 1 from public.post_items i where i.post_id = :'post'::uuid and i.superseded_at is null and i.supersedes is null);
insert into public.jobs (post_id, kind, priority, status, payload)
select p.id, 'recompute', 200, 'queued', '{"operator":"recheck"}'::jsonb
from public.posts p where p.id = :'post'::uuid and p.status = 'queued'
  and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'));
commit;
