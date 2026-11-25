-- #1336: an operator rematch can adjust a retained slice portion as well as
-- nutrition. Commit the two together under the existing post/job fence.
create function public.persist_operator_rematch(
 p_post_id uuid,p_job_id uuid,p_expected uuid[],p_items jsonb
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare row jsonb; item_id uuid; grams numeric; actual uuid[]; expected uuid[]; nutrient text;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found or not public.post_work_matches(p_post_id,p_job_id)
  or not exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id
   and kind='recompute' and status='running' and payload->>'operator'='rematch') then
  raise exception 'Rematch job no longer owns this meal' using errcode='PT409';
 end if;
 if p_expected is null or cardinality(p_expected)>100 or p_items is null
  or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>100 then
  raise exception 'Invalid rematch snapshot' using errcode='22023';
 end if;
 select coalesce(array_agg(id order by id),'{}'::uuid[]) into actual from public.current_post_items where post_id=p_post_id;
 select coalesce(array_agg(id order by id),'{}'::uuid[]) into expected from unnest(p_expected) id;
 if actual is distinct from expected then raise exception 'Rematch items changed' using errcode='PT409';end if;
 if (select count(distinct value->>'post_item_id') from jsonb_array_elements(p_items))<>jsonb_array_length(p_items) then
  raise exception 'Duplicate rematch item' using errcode='22023';
 end if;
 for row in select value from jsonb_array_elements(p_items) loop
  item_id:=(row->>'post_item_id')::uuid;
  if item_id is null or not item_id=any(actual) or not (row?'portion_grams') then
   raise exception 'Rematch item is outside this meal' using errcode='22023';
  end if;
  grams:=(row->>'portion_grams')::numeric;
  if grams<0 or grams>100000 then raise exception 'Invalid rematch portion' using errcode='22023';end if;
  foreach nutrient in array array['calories','protein_g','carbs_g','fat_g','fibre_g','sugar_g','sodium_mg'] loop
   if (row->>nutrient)::numeric<0 or (row->>nutrient)::numeric in('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) then
    raise exception 'Negative or non-finite rematch nutrient: %',nutrient using errcode='22023';
   end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(case when jsonb_typeof(row->'micronutrients')='array' then row->'micronutrients' else '[]'::jsonb end) entry
   where (entry->>'value')::numeric<0 or (entry->>'amount')::numeric<0
    or (entry->>'value')::numeric in('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)
    or (entry->>'amount')::numeric in('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)) then
   raise exception 'Negative or non-finite rematch nutrient: micronutrients' using errcode='22023';
  end if;
  update public.post_items set portion_grams=grams where id=item_id and post_id=p_post_id and superseded_at is null;
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref,food_category)
  values(item_id,(row->>'calories')::numeric,(row->>'protein_g')::numeric,(row->>'carbs_g')::numeric,(row->>'fat_g')::numeric,
   (row->>'fibre_g')::numeric,(row->>'sugar_g')::numeric,(row->>'sodium_mg')::numeric,coalesce(row->'micronutrients','[]'::jsonb),row->>'source_ref',row->>'food_category')
  on conflict(post_item_id) do update set calories=excluded.calories,protein_g=excluded.protein_g,carbs_g=excluded.carbs_g,
   fat_g=excluded.fat_g,fibre_g=excluded.fibre_g,sugar_g=excluded.sugar_g,sodium_mg=excluded.sodium_mg,
   micronutrients=excluded.micronutrients,source_ref=excluded.source_ref,food_category=excluded.food_category;
 end loop;
end $$;
revoke all on function public.persist_operator_rematch(uuid,uuid,uuid[],jsonb) from public,anon,authenticated;
grant execute on function public.persist_operator_rematch(uuid,uuid,uuid[],jsonb) to service_role;
notify pgrst,'reload schema';
