alter table public.posts add column analysis_initialized_at timestamptz;
-- 0004 already introduced these history columns for retry-safe persistence.
alter table public.post_items add column if not exists superseded_at timestamptz;
alter table public.post_items add column if not exists supersedes uuid references public.post_items(id);
create index if not exists post_items_current_post on public.post_items(post_id) where superseded_at is null;
create or replace view public.current_post_items with (security_invoker = true) as
  select * from public.post_items where superseded_at is null;
grant select on public.current_post_items to authenticated, service_role;

drop policy if exists post_items_owner_all on public.post_items;
create policy post_items_owner_select on public.post_items for select to authenticated using (
  exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
);
create policy post_items_owner_insert on public.post_items for insert to authenticated with check (
  source = 'user' and superseded_at is null and
  exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid() and p.analysis_initialized_at is not null)
);
create policy post_items_owner_supersede on public.post_items for update to authenticated using (
  superseded_at is null and exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
) with check (
  superseded_at is not null and exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
);

-- Nutrition belongs to immutable estimates too. All calculations are server
-- writes; clients may read their own current and historical nutrition only.
drop policy if exists item_nutrition_owner_all on public.item_nutrition;
create policy item_nutrition_owner_select on public.item_nutrition for select to authenticated using (
  exists (select 1 from public.post_items i join public.posts p on p.id = i.post_id
    where i.id = post_item_id and p.user_id = auth.uid())
);
revoke insert, update, delete on public.item_nutrition from authenticated;

-- RLS checks the resulting row, not which columns changed. Enforce immutable
-- history with column privileges and a trigger, including inherited grants.
revoke update, delete on public.post_items from authenticated;
grant update(superseded_at) on public.post_items to authenticated;
create or replace function public.guard_item_history()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'UPDATE' and (
      old.superseded_at is not null or new.superseded_at is null or
      (to_jsonb(new) - 'superseded_at') is distinct from (to_jsonb(old) - 'superseded_at')
    ) then raise exception 'Only superseded_at may change' using errcode = '42501'; end if;
    if tg_op = 'INSERT' and new.supersedes is not null and not exists (
      select 1 from public.post_items i where i.id = new.supersedes and i.post_id = new.post_id
    ) then raise exception 'History must belong to this post' using errcode = '42501'; end if;
  end if;
  return new;
end;
$$;
create trigger post_items_history_guard before insert or update on public.post_items
for each row execute function public.guard_item_history();

-- The server supplies the authenticated user ID, and the RPC checks it again
-- under the same post lock that serializes edits and their queued recompute.
create or replace function public.edit_post_item(
  p_post_id uuid, p_user_id uuid, p_action text, p_item_id uuid,
  p_name text, p_portion_grams numeric, p_box jsonb
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_old public.post_items;
  v_new uuid;
  v_name text;
  v_grams numeric;
  v_width integer;
  v_height integer;
  v_initialized timestamptz;
begin
  select analysis_initialized_at into v_initialized from public.posts where id = p_post_id and user_id = p_user_id for update;
  if not found then raise exception 'Post not found' using errcode = '42501'; end if;
  if v_initialized is null then raise exception 'Initial meal analysis must complete before editing' using errcode='55000';end if;
  if p_action is null or p_action not in ('rename', 'portion', 'remove', 'add') then
    raise exception 'Invalid item action' using errcode = '22023';
  end if;
  if p_action <> 'add' then
    select * into v_old from public.post_items
      where id = p_item_id and post_id = p_post_id and superseded_at is null for update;
    if not found then raise exception 'Item changed; reload before editing' using errcode = '40001'; end if;
  elsif p_item_id is not null then
    raise exception 'New items do not have an existing ID' using errcode = '22023';
  end if;
  if p_action <> 'remove' then
    v_name := btrim(coalesce(p_name, v_old.name));
    v_grams := coalesce(p_portion_grams, v_old.portion_grams);
    if v_name is null or length(v_name) = 0 or length(v_name) > 160 then
      raise exception 'Name must contain 1 to 160 characters' using errcode = '22023';
    end if;
    if v_grams is null or v_grams <= 0 or v_grams > 100000 then
      raise exception 'Portion must be between 0 and 100000 grams' using errcode = '22023';
    end if;
    if p_action = 'add' and p_box is not null then
      select width, height into v_width, v_height from public.post_media
        where post_id = p_post_id order by position limit 1;
      if jsonb_typeof(p_box) <> 'object' or
        not (p_box ?& array['left','top','right','bottom']) or
        jsonb_typeof(p_box->'left') <> 'number' or jsonb_typeof(p_box->'top') <> 'number' or
        jsonb_typeof(p_box->'right') <> 'number' or jsonb_typeof(p_box->'bottom') <> 'number' or
        v_width is null or v_height is null or
        (p_box->>'left')::numeric < 0 or (p_box->>'top')::numeric < 0 or
        (p_box->>'right')::numeric <= (p_box->>'left')::numeric or
        (p_box->>'bottom')::numeric <= (p_box->>'top')::numeric or
        (p_box->>'right')::numeric > v_width or (p_box->>'bottom')::numeric > v_height then
        raise exception 'Invalid photo box' using errcode = '22023';
      end if;
    end if;
    insert into public.post_items (post_id, name, portion_text, portion_grams, box, mask_path, confidence, source, supersedes)
    values (p_post_id, v_name, v_grams::text || ' g', v_grams,
      case when p_action = 'add' then p_box else v_old.box end,
      v_old.mask_path, v_old.confidence, 'user', v_old.id)
    returning id into v_new;
  end if;
  if p_action <> 'add' then update public.post_items set superseded_at = now() where id = v_old.id; end if;
  update public.posts set status = 'queued', fail_reason = null where id = p_post_id;
  insert into public.jobs(post_id, kind, priority, status)
  select p_post_id, 'recompute', 100, 'queued'
  where not exists (select 1 from public.jobs where post_id = p_post_id and kind = 'recompute' and status = 'queued');
  return v_new;
end;
$$;
revoke all on function public.edit_post_item(uuid, uuid, text, uuid, text, numeric, jsonb) from public, anon, authenticated;
grant execute on function public.edit_post_item(uuid, uuid, text, uuid, text, numeric, jsonb) to service_role;

-- A recompute that started before another edit must not mark a newer,
-- unnourished item set ready. The post lock serializes this check with edits.
create or replace function public.mark_post_ready(p_post_id uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform 1 from public.posts where id = p_post_id for update;
  if not found then return false; end if;
  if exists (select 1 from public.current_post_items i left join public.item_nutrition n on n.post_item_id = i.id
    where i.post_id = p_post_id and n.post_item_id is null) then return false; end if;
  update public.posts set status = 'ready', fail_reason = null where id = p_post_id;
  return true;
end;
$$;
revoke all on function public.mark_post_ready(uuid) from public, anon, authenticated;
grant execute on function public.mark_post_ready(uuid) to service_role;

-- A selected FDC record is resolved and scaled by the server, never from
-- client-supplied nutrient values. Keep the existing edit RPC signature for
-- later wrappers; this outer transaction retains its post lock through insert.
create or replace function public.edit_post_item_with_nutrition(
  p_post_id uuid, p_user_id uuid, p_action text, p_item_id uuid,
  p_name text, p_portion_grams numeric, p_box jsonb, p_nutrition jsonb
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_new uuid;
begin
  if p_action = 'remove' or p_nutrition is null or jsonb_typeof(p_nutrition) <> 'object' then
    raise exception 'Selected food nutrition is required' using errcode = '22023';
  end if;
  v_new := public.edit_post_item(p_post_id, p_user_id, p_action, p_item_id, p_name, p_portion_grams, p_box);
  insert into public.item_nutrition(post_item_id, calories, protein_g, carbs_g, fat_g,
    fibre_g, sugar_g, sodium_mg, micronutrients, source_ref)
  values (v_new, (p_nutrition->>'calories')::numeric, (p_nutrition->>'protein_g')::numeric,
    (p_nutrition->>'carbs_g')::numeric, (p_nutrition->>'fat_g')::numeric,
    (p_nutrition->>'fibre_g')::numeric, (p_nutrition->>'sugar_g')::numeric,
    (p_nutrition->>'sodium_mg')::numeric, coalesce(p_nutrition->'micronutrients','[]'::jsonb), p_nutrition->>'source_ref');
  return v_new;
end;
$$;
revoke all on function public.edit_post_item_with_nutrition(uuid, uuid, text, uuid, text, numeric, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.edit_post_item_with_nutrition(uuid, uuid, text, uuid, text, numeric, jsonb, jsonb) to service_role;

-- Initial analysis commits once. Later card/finish retries must never restore
-- model rows over a user's edits (including removing the entire meal).
update public.posts p set analysis_initialized_at=now()
where exists(select 1 from public.post_comments c where c.post_id=p.id and c.author='model')
   or exists(select 1 from public.post_items i where i.post_id=p.id and i.source='model');
create function public.guard_analysis_marker() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if current_user in ('authenticated','anon') and
   ((tg_op='INSERT' and new.analysis_initialized_at is not null) or
    (tg_op='UPDATE' and new.analysis_initialized_at is distinct from old.analysis_initialized_at)) then
  raise exception 'Analysis initialization is server-owned' using errcode='42501';
 end if;
 return new;
end $$;
create trigger protect_analysis_marker before insert or update on public.posts
 for each row execute function public.guard_analysis_marker();
alter function public.persist_analysis(uuid,jsonb,text) rename to persist_analysis_initial;
revoke all on function public.persist_analysis_initial(uuid,jsonb,text) from public,anon,authenticated,service_role;
create function public.persist_analysis(p_post_id uuid,p_items jsonb,p_summary text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare initialized timestamptz;
begin
 select analysis_initialized_at into initialized from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 if initialized is not null then return;end if;
 perform public.persist_analysis_initial(p_post_id,p_items,p_summary);
 update public.posts set analysis_initialized_at=clock_timestamp() where id=p_post_id;

end $$;
revoke all on function public.persist_analysis(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.persist_analysis(uuid,jsonb,text) to service_role;
