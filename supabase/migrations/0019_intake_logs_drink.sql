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

-- Only the server creates/removes linked records; legacy unlinked intake remains owner writable.
alter policy intake_owner_insert on public.intake_logs with check (auth.uid()=user_id and post_id is null);
alter policy intake_owner_delete on public.intake_logs using (auth.uid()=user_id and post_id is null);
create unique index intake_one_drink_per_post on public.intake_logs(post_id) where post_id is not null;
create or replace function public.validate_drink_owner()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.post_id is null then return new; end if;
  perform 1 from public.posts where id=new.post_id and user_id=new.user_id for update;
  if not found then raise exception 'Drink post not found' using errcode='42501'; end if;
  return new;
end;
$$;
revoke all on function public.validate_drink_owner() from public,anon,authenticated;
create trigger validate_drink_owner before insert or update of post_id,user_id on public.intake_logs
for each row execute function public.validate_drink_owner();

-- Publish the ready post and intake link together, before any feed INSERT can observe it.
create or replace function public.create_drink_post(
  p_user_id uuid,p_eaten_at timestamptz,p_kind text,p_ml integer,p_label text,p_caffeine_mg integer,p_nutrition jsonb
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_post uuid;
begin
  if p_kind is null or p_kind not in ('water','caffeine') or p_ml is null or p_ml not between 1 and 5000
    or p_caffeine_mg is null or p_caffeine_mg not between 0 and 1000
    or (p_kind='water' and (p_caffeine_mg<>0 or p_label is distinct from 'Water')) then
    raise exception 'Invalid drink' using errcode='22023';
  end if;
  v_post:=public.create_food_post(p_user_id,p_eaten_at,p_label,p_ml,p_nutrition);
  insert into public.intake_logs(user_id,kind,amount,ml,label,post_id,logged_at)
    values(p_user_id,p_kind,case when p_kind='water' then p_ml else p_caffeine_mg end,p_ml,p_label,v_post,p_eaten_at);
  return v_post;
end;
$$;
revoke all on function public.create_drink_post(uuid,timestamptz,text,integer,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.create_drink_post(uuid,timestamptz,text,integer,text,integer,jsonb) to service_role;
