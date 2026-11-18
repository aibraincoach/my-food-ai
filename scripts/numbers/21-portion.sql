-- #990: one food of a meal is given the weight both reviewers judged right, and the worker sums the meal again.
-- Every current food is copied (each copy supersedes its original, as in 18-remove.sql). The chosen food's copy gets
-- the new weight; recompute then rescales that food's retained nutrition to it, every value by the same ratio
-- (src/lib/nutrition/portion.ts), and keeps the others exactly. Nothing is looked up and no model is asked. The
-- operator takes the meal's snapshot (08) first and ledgers the food, its old and new weight and the reason;
-- 13-restore.sql through `reanalyse.mjs restore` puts the meal back.
-- psql variables: post (the full meal id), item (the full id of the current food) and grams (the new weight, above 0).
begin;
-- Lock the meal's row first, as 18-remove.sql does (#1040).
select id from public.posts where id = :'post'::uuid for update \g /dev/null
with meal as (
  select p.id from public.posts p
  where p.id = :'post'::uuid and p.status = 'ready' and p.deleted_at is null
    and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
    and exists (select 1 from public.post_items i where i.id = :'item'::uuid and i.post_id = p.id and i.superseded_at is null
                and i.portion_grams > 0 and :'grams'::numeric > 0 and i.portion_grams <> :'grams'::numeric
                -- A food with a leftovers weight is not rescaled here: its eaten share would no longer add up.
                and i.not_eaten_grams is null and i.not_eaten_calories is null)
), old as (
  update public.post_items i set superseded_at = now()
  where i.post_id in (select id from meal) and i.superseded_at is null
  returning i.*
), copies as (
  insert into public.post_items (post_id, name, portion_text, portion_grams, box, mask_path, confidence, source, gtin,
                                 not_eaten_grams, count_text, not_eaten_count_text, not_eaten_calories, supersedes)
  select o.post_id, o.name,
         case when o.id = :'item'::uuid then round(:'grams'::numeric) || ' g' else o.portion_text end,
         case when o.id = :'item'::uuid then :'grams'::numeric else o.portion_grams end,
         o.box, o.mask_path, o.confidence, o.source, o.gtin, o.not_eaten_grams, o.count_text, o.not_eaten_count_text,
         o.not_eaten_calories, o.id
  from old o
  returning post_id
), queued as (
  update public.posts p set status = 'queued', fail_reason = null
  where p.id in (select post_id from copies)
  returning p.id
)
insert into public.jobs (post_id, kind, priority, status, payload)
select distinct id, 'recompute', 200, 'queued', '{"operator":"portion"}'::jsonb from queued
returning left(id::text, 8) as job, left(post_id::text, 8) as post, kind, priority;
commit;
