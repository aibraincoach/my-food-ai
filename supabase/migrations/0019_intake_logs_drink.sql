-- Drink posts retain the existing owner-only read/insert/delete policies and no update policy.
alter table public.intake_logs
  add column ml integer check (ml is null or ml between 1 and 5000),
  add column label text check (label is null or char_length(label) between 1 and 40),
  add column post_id uuid references public.posts(id) on delete set null;
create index intake_logs_post_idx on public.intake_logs(post_id) where post_id is not null;

-- A linked drink is one recorded event. Moving it moves the intake in the same transaction.
create or replace function public.keep_drink_record_consistent()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if exists(select 1 from public.intake_logs where post_id=old.id) then
    if new.servings is distinct from old.servings or new.status is distinct from old.status then
      raise exception 'Drink amounts were recorded when posted and cannot be changed through meal edits' using errcode='22023';
    end if;
    if new.eaten_at is distinct from old.eaten_at then
      update public.intake_logs set logged_at=new.eaten_at where post_id=old.id;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.keep_drink_record_consistent() from public,anon,authenticated;
create trigger keep_drink_record_consistent before update on public.posts
for each row execute function public.keep_drink_record_consistent();

-- Generic food editing has no volume/density or coffee-preset semantics. Reject it atomically
-- for a linked drink instead of keeping contradictory intake and item records.
create or replace function public.protect_drink_items()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_post uuid := case when tg_op='DELETE' then old.post_id else new.post_id end;
begin
  perform 1 from public.posts where id=v_post for update;
  if found and exists(select 1 from public.intake_logs where post_id=v_post) then
    raise exception 'Drink amounts were recorded when posted and cannot be changed through meal edits' using errcode='22023';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.protect_drink_items() from public,anon,authenticated;
create trigger protect_drink_items before insert or update or delete on public.post_items
for each row execute function public.protect_drink_items();
