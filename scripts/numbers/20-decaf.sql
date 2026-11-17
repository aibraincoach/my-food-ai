-- #456: caffeine (nutrient 1057) stored on an alcoholic drink that names no caffeine source is removed from that
-- food's micronutrients, and the worker sums the meal again and rewrites its summary. It is an operator recompute:
-- every food keeps its other nutrition, so nothing is looked up again and no model is asked. A food is an alcoholic
-- drink when it holds alcohol (nutrient 1018 above zero) or its category is an alcoholic one (rule b of 03). A name
-- with a caffeine source keeps its caffeine: a rum and cola, a coffee liqueur, a Long Island iced tea.
-- psql variable: post (the full meal id). Run through reanalyse.mjs --mode=decaf only: it privately records the
-- original nutrition with 08 before this writes, so restore can run 15-repair-undo.sql on the same item IDs.
begin;
-- Lock the meal's row first, as 18-remove.sql does (#1040), so the check below sees every change committed before it.
select id from public.posts where id = :'post'::uuid for update \g /dev/null
with meal as (
  select p.id from public.posts p
  where p.id = :'post'::uuid and p.status = 'ready' and p.deleted_at is null
    and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
), fixed as (
  update public.item_nutrition n set micronutrients = (
      select coalesce(jsonb_agg(m order by o), '[]'::jsonb)
      from jsonb_array_elements(n.micronutrients) with ordinality e(m, o)
      where m->>'nutrientId' is distinct from '1057')
  from public.post_items i
  where n.post_item_id = i.id and i.superseded_at is null and i.post_id in (select id from meal)
    and jsonb_typeof(n.micronutrients) = 'array'
    and exists (select 1 from jsonb_array_elements(n.micronutrients) e(m) where m->>'nutrientId' = '1057')
    and (exists (select 1 from jsonb_array_elements(n.micronutrients) e(m)
                 where m->>'nutrientId' = '1018' and jsonb_typeof(m->'value') = 'number' and (m->>'value')::numeric > 0)
         or lower(coalesce(n.food_category, '')) in ('alcoholic beverages', 'beer', 'wine', 'liquor and cocktails'))
    and i.name !~* '\m(coffee|espresso|kahlua|cola|coke|pepsi|tea|matcha|energy|guarana|mate|cocoa|chocolate|mocha)\M'
  returning i.post_id
), queued as (
  update public.posts p set status = 'queued', fail_reason = null
  where p.id in (select post_id from fixed)
  returning p.id
)
insert into public.jobs (post_id, kind, priority, status, payload)
select id, 'recompute', 200, 'queued', '{"operator":"decaf"}'::jsonb from queued
returning left(id::text, 8) as job, left(post_id::text, 8) as post, kind, priority;
commit;
