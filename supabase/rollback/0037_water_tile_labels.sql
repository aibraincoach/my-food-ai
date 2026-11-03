-- Restore the pre-tile water-label guard. Existing tile posts remain intact.
begin;
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
commit;
