-- Keep future compact payloads readable by old code before expanding storage.
-- Use scripts/rollback-compact-nutrition.sql before rolling the app below its reader floor.
do $$begin
 if exists(select 1 from public.nutrition_provenance_format where id and compact) then
  raise exception 'Switch the database write boundary to legacy before rollback';
 end if;
end $$;
-- Re-tags every entry from the first entry's label; per100 returns into the tag.
update public.item_nutrition n set micronutrients=(
  select jsonb_agg((e - 'per100') || jsonb_build_object('approximation', l.tag || (case when e ? 'per100' then jsonb_build_object('per100',e->'per100') else '{}'::jsonb end)) order by ord)
  from jsonb_array_elements(n.micronutrients) with ordinality as t(e,ord),
  lateral (select (select x->'approximation' from jsonb_array_elements(n.micronutrients) x where x ? 'approximation' limit 1) as tag) l)
where n.micronutrients @> '[{"approximation":{}}]'::jsonb;
