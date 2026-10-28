-- Servings: a multiplier on a whole meal. Changing it scales every current item's portion by new/old,
-- exactly like a portion edit of each item, so the recompute job rescales stored nutrition with no model call.
alter table public.posts add column servings numeric(6,2) not null default 1
  check (servings >= 0.25 and servings <= 50);

create or replace function public.set_post_servings(p_post_id uuid, p_user_id uuid, p_servings numeric)
returns numeric language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_old numeric;
  v_initialized timestamptz;
  v_ratio numeric;
  v_item public.post_items;
begin
  if p_servings is null or p_servings < 0.25 or p_servings > 50 then
    raise exception 'Servings must be between 0.25 and 50' using errcode = '22023';
  end if;
  p_servings := round(p_servings, 2);
  select servings, analysis_initialized_at into v_old, v_initialized from public.posts
    where id = p_post_id and user_id = p_user_id for update;
  if not found then raise exception 'Post not found' using errcode = '42501'; end if;
  if v_initialized is null then raise exception 'Initial meal analysis must complete before editing' using errcode = '55000'; end if;
  if p_servings = v_old then return v_old; end if;
  v_ratio := p_servings / v_old;
  for v_item in select * from public.post_items where post_id = p_post_id and superseded_at is null for update loop
    update public.post_items set superseded_at = now() where id = v_item.id;
    insert into public.post_items (post_id, name, portion_text, portion_grams, box, mask_path, confidence, source, supersedes)
    values (p_post_id, v_item.name,
      case when v_item.portion_grams is null then v_item.portion_text else round(v_item.portion_grams * v_ratio, 2)::text || ' g' end,
      case when v_item.portion_grams is null then null else round(v_item.portion_grams * v_ratio, 2) end,
      v_item.box, v_item.mask_path, v_item.confidence, 'user', v_item.id);
  end loop;
  update public.posts set servings = p_servings, status = 'queued', fail_reason = null where id = p_post_id;
  insert into public.jobs(post_id, kind, priority, status)
  select p_post_id, 'recompute', 100, 'queued'
  where not exists (select 1 from public.jobs where post_id = p_post_id and kind = 'recompute' and status = 'queued');
  insert into public.post_comments(post_id, author, body)
  values (p_post_id, 'model', 'Servings changed from ' || trim(trailing '.' from trim(trailing '0' from v_old::text))
    || ' to ' || trim(trailing '.' from trim(trailing '0' from p_servings::text)) || '. Every item and the totals were scaled to match.');
  return p_servings;
end;
$$;
revoke all on function public.set_post_servings(uuid, uuid, numeric) from public, anon, authenticated;
grant execute on function public.set_post_servings(uuid, uuid, numeric) to service_role;
