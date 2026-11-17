-- #990: remove one food of a meal that is demonstrably counted twice (the PM's ruling of 2026-11-17 19:35Z): meal
-- 1c4f16bf holds "sweetened condensed milk" beside a coffee matched to "Beverages, coffee, ready to drink, milk based,
-- sweetened" (171880), which already holds the milk and sugar. Every other current food is copied with its nutrition
-- kept (each copy supersedes its original, so recompute keeps the complete row and looks nothing up), the removed food
-- stays as a superseded row, and an operator recompute sums the meal again and rewrites its summary. The operator
-- records the removed food, its values and the reason in a private ledger, with the meal's snapshot (08) taken first;
-- 13-restore.sql through `reanalyse.mjs restore` puts the meal back from that snapshot.
-- psql variables: post (the full meal id) and item (the full id of the current food to remove).
begin;
with meal as (
  select p.id from public.posts p
  where p.id = :'post'::uuid and p.status = 'ready' and p.deleted_at is null
    and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
    and exists (select 1 from public.post_items i where i.id = :'item'::uuid and i.post_id = p.id and i.superseded_at is null)
    and (select count(*) from public.post_items i where i.post_id = p.id and i.superseded_at is null) >= 2
), old as (
  update public.post_items i set superseded_at = now()
  where i.post_id in (select id from meal) and i.superseded_at is null
  returning i.*
), copies as (
  insert into public.post_items (post_id, name, portion_text, portion_grams, box, mask_path, confidence, source, gtin,
                                 not_eaten_grams, count_text, not_eaten_count_text, not_eaten_calories, supersedes)
  select o.post_id, o.name, o.portion_text, o.portion_grams, o.box, o.mask_path, o.confidence, o.source, o.gtin,
         o.not_eaten_grams, o.count_text, o.not_eaten_count_text, o.not_eaten_calories, o.id
  from old o where o.id <> :'item'::uuid
  returning post_id
), queued as (
  -- Only a meal whose foods this statement superseded is queued, so a second run changes nothing.
  update public.posts p set status = 'queued', fail_reason = null
  where p.id in (select post_id from copies)
  returning p.id
)
insert into public.jobs (post_id, kind, priority, status, payload)
select distinct id, 'recompute', 200, 'queued', '{"operator":"remove"}'::jsonb from queued
returning left(id::text, 8) as job, left(post_id::text, 8) as post, kind, priority;
commit;
