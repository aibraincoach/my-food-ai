-- #573: keep the closest-record / estimate label once per food, on the first nutrient entry.
-- Estimate per-100 g values move from the tag to each entry's own per100 key.
update public.item_nutrition n set micronutrients=(
  select jsonb_agg(
    case
      when e ? 'approximation' and ord=1 then (e - 'approximation')
        || jsonb_build_object('approximation',(e->'approximation') - 'per100')
        || (case when (e->'approximation') ? 'per100' then jsonb_build_object('per100',e->'approximation'->'per100') else '{}'::jsonb end)
      when e ? 'approximation' then (e - 'approximation')
        || (case when (e->'approximation') ? 'per100' then jsonb_build_object('per100',e->'approximation'->'per100') else '{}'::jsonb end)
      else e end order by ord)
  from jsonb_array_elements(n.micronutrients) with ordinality as t(e,ord))
where n.micronutrients @> '[{"approximation":{}}]'::jsonb;
