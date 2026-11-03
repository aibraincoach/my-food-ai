-- Shared account-level hourly buckets. Clients cannot inspect or reset counts.
create table public.user_call_hits (
 user_id uuid not null references auth.users(id) on delete cascade,
 route text not null check (route in ('label','transcribe','fdc_search','fdc_barcode','post','correct')),
 hour timestamptz not null,
 hits integer not null default 0,
 primary key (user_id,route,hour)
);
alter table public.user_call_hits enable row level security;
revoke all on public.user_call_hits from public,anon,authenticated;

create function public.user_hit(p_user_id uuid,p_route text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_limit integer; v_hits integer;
begin
 v_limit := case p_route when 'label' then 30 when 'transcribe' then 60
  when 'fdc_search' then 300 when 'fdc_barcode' then 120
  when 'post' then 40 when 'correct' then 100 end;
 if v_limit is null then raise exception 'Unknown call route' using errcode='22023';end if;
 insert into public.user_call_hits(user_id,route,hour,hits)
 values(p_user_id,p_route,date_trunc('hour',clock_timestamp()),1)
 on conflict(user_id,route,hour) do update set hits=public.user_call_hits.hits+1
 returning hits into v_hits;
 delete from public.user_call_hits where user_id=p_user_id and hour<clock_timestamp()-interval '1 day';
 return v_hits<=v_limit;
end $$;
revoke all on function public.user_hit(uuid,text) from public,anon,authenticated;
grant execute on function public.user_hit(uuid,text) to service_role;
