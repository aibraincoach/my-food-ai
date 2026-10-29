-- A meal logged from an FDC food search: one ready post with one item and its stored nutrition, in one transaction,
-- with no model call. The server resolves and scales the nutrition; this function only stores it for the signed-in owner.
create or replace function public.create_food_post(
  p_user_id uuid, p_eaten_at timestamptz, p_name text, p_grams numeric, p_nutrition jsonb
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_post uuid;
  v_item uuid;
begin
  if length(v_name) = 0 or length(v_name) > 160 then raise exception 'Name must contain 1 to 160 characters' using errcode = '22023'; end if;
  if p_grams is null or p_grams <= 0 or p_grams > 100000 then raise exception 'Portion must be between 0 and 100000 grams' using errcode = '22023'; end if;
  if p_nutrition is null or jsonb_typeof(p_nutrition) <> 'object' then raise exception 'Nutrition is required' using errcode = '22023'; end if;
  if p_eaten_at is null or p_eaten_at > now() + interval '5 minutes' then raise exception 'Invalid time eaten' using errcode = '22023'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then raise exception 'User not found' using errcode = '42501'; end if;
  insert into public.posts (user_id, caption, eaten_at, status, analysis_initialized_at)
  values (p_user_id, v_name, p_eaten_at, 'ready', clock_timestamp()) returning id into v_post;
  insert into public.post_items (post_id, name, portion_text, portion_grams, source)
  values (v_post, v_name, trim_scale(p_grams)::text || ' g', p_grams, 'user') returning id into v_item;
  insert into public.item_nutrition (post_item_id, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g, sodium_mg, micronutrients, source_ref)
  values (v_item, (p_nutrition->>'calories')::numeric, (p_nutrition->>'protein_g')::numeric, (p_nutrition->>'carbs_g')::numeric,
    (p_nutrition->>'fat_g')::numeric, (p_nutrition->>'fibre_g')::numeric, (p_nutrition->>'sugar_g')::numeric,
    (p_nutrition->>'sodium_mg')::numeric, coalesce(p_nutrition->'micronutrients', '[]'::jsonb), p_nutrition->>'source_ref');
  return v_post;
end;
$$;
revoke all on function public.create_food_post(uuid, timestamptz, text, numeric, jsonb) from public, anon, authenticated;
grant execute on function public.create_food_post(uuid, timestamptz, text, numeric, jsonb) to service_role;
