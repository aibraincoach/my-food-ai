-- #990: after a recheck of a meal was kept, its saved meal takes the meal's current foods and nutrition, exactly as
-- save_meal_from_post builds them, so the saved copy no longer carries the record of another kind of food. Writes one
-- saved_meals row in place. The meal's snapshot (08, taken by reanalyse.mjs before the recheck) holds the saved meal's
-- old row under "saved_meals": that is the only way back (put its items back with an update by id).
-- psql variable: post (the meal's id). Refuses a meal that is not ready or has a queued or running job.
begin;
update public.saved_meals s set items = (
  select jsonb_agg(jsonb_build_object('name', i.name, 'portion_grams', i.portion_grams, 'portion_text', i.portion_text,
                                      'nutrition', to_jsonb(n) - 'post_item_id') order by i.created_at, i.id)
  from public.current_post_items i left join public.item_nutrition n on n.post_item_id = i.id where i.post_id = :'post'::uuid)
where s.source_post_id = :'post'::uuid
  and exists (select 1 from public.posts p where p.id = :'post'::uuid and p.status = 'ready' and p.deleted_at is null)
  and not exists (select 1 from public.jobs j where j.post_id = :'post'::uuid and j.status in ('queued', 'running'))
  and exists (select 1 from public.current_post_items i where i.post_id = :'post'::uuid);
commit;
