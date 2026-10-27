alter table public.post_media add column if not exists kind text not null default 'photo'
  check (kind in ('photo', 'card'));
create unique index if not exists post_media_one_card on public.post_media(post_id) where kind = 'card';

-- A single-statement snapshot includes the exact item and nutrition rows.
create or replace function public.results_card_snapshot(p_post_id uuid)
returns jsonb language sql security definer set search_path = public, pg_temp as $$
  select jsonb_build_object('user_id', p.user_id, 'eaten_at', p.eaten_at,
    'items', s.items, 'fingerprint', md5(s.items::text || p.eaten_at::text))
  from public.posts p cross join lateral (
    select coalesce(jsonb_agg(jsonb_build_object('item', to_jsonb(i), 'nutrition', to_jsonb(n)) order by i.id), '[]'::jsonb) items
    from public.current_post_items i left join public.item_nutrition n on n.post_item_id = i.id
    where i.post_id = p.id
  ) s where p.id = p_post_id;
$$;
revoke all on function public.results_card_snapshot(uuid) from public, anon, authenticated;
grant execute on function public.results_card_snapshot(uuid) to service_role;

-- Immutable object paths plus conditional publication prevent an older render
-- from overwriting a corrected card. Publication and ready happen under the
-- same post lock used by edits and corrections.
create or replace function public.publish_results_card(p_post_id uuid, p_fingerprint text, p_storage_path text, p_size integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_snapshot jsonb; v_old text; v_position integer; v_owner uuid;
begin
  select user_id into v_owner from public.posts where id = p_post_id for update;
  if not found then return jsonb_build_object('published', false); end if;
  v_snapshot := public.results_card_snapshot(p_post_id);
  if v_snapshot->>'fingerprint' is distinct from p_fingerprint or exists (
    select 1 from jsonb_array_elements(v_snapshot->'items') e where e->'nutrition' = 'null'::jsonb
  ) then return jsonb_build_object('published', false); end if;
  if p_storage_path not like v_owner::text || '/' || p_post_id::text || '/cards/%/card.png' or p_size <> 1080 then
    raise exception 'Invalid card path or dimensions';
  end if;
  select storage_path into v_old from public.post_media where post_id = p_post_id and kind = 'card';
  select coalesce(max(position) + 1, 0) into v_position from public.post_media where post_id = p_post_id and kind = 'photo';
  insert into public.post_media(post_id, kind, storage_path, position, width, height)
  values(p_post_id, 'card', p_storage_path, v_position, p_size, p_size)
  on conflict(post_id) where kind = 'card' do update set storage_path = excluded.storage_path,
    position = excluded.position, width = excluded.width, height = excluded.height;
  update public.posts set status = 'ready', fail_reason = null where id = p_post_id;
  return jsonb_build_object('published', true, 'old_path', v_old);
end;
$$;
revoke all on function public.publish_results_card(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.publish_results_card(uuid, text, text, integer) to service_role;

create or replace function public.enqueue_card_backfill()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('enqueue_card_backfill'));
  insert into public.jobs(post_id, kind, priority, status)
  select p.id, 'card_backfill', 200, 'queued' from public.posts p
  where p.status = 'ready'
    and not exists(select 1 from public.post_media m where m.post_id = p.id and m.kind = 'card')
    and not exists(select 1 from public.jobs j where j.post_id = p.id and j.kind = 'card_backfill' and j.status in ('queued','running'));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.enqueue_card_backfill() from public, anon, authenticated;
grant execute on function public.enqueue_card_backfill() to service_role;
