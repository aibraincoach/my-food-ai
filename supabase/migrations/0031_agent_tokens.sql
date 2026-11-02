-- Tokens are shown once. Only a SHA-256 digest and display suffix persist.
create table public.agent_tokens(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 40),
 token_hash text not null unique,
 token_last4 text not null check(char_length(token_last4)=4),
 created_at timestamptz not null default now(),last_used_at timestamptz,revoked_at timestamptz
);
alter table public.agent_tokens enable row level security;
create policy agent_tokens_owner_select on public.agent_tokens for select to authenticated using(user_id=auth.uid());
create policy agent_tokens_owner_revoke on public.agent_tokens for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,update on public.agent_tokens to authenticated;
create function public.only_revoked_at_changes() returns trigger
language plpgsql set search_path=public,pg_temp as $$
begin
 if current_user='authenticated' then
  if (to_jsonb(new)-'revoked_at') is distinct from (to_jsonb(old)-'revoked_at')
    or new.revoked_at is null or (old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at) then
   raise exception 'Only token revocation is permitted' using errcode='42501';
  end if;
 end if;
 return new;
end $$;
create trigger only_revoked_at_changes before update on public.agent_tokens for each row execute function public.only_revoked_at_changes();

create table public.agent_activity(
 id uuid primary key default gen_random_uuid(),token_id uuid not null references public.agent_tokens(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 action text not null check(action in ('posted','read','listed','corrected')),
 post_id uuid references public.posts(id) on delete set null,
 meal_count integer check(meal_count is null or meal_count between 0 and 50),
 created_at timestamptz not null default now()
);
alter table public.agent_activity enable row level security;
create policy agent_activity_owner_select on public.agent_activity for select to authenticated using(user_id=auth.uid());
grant select on public.agent_activity to authenticated;
create table public.agent_token_hits(
 token_id uuid not null references public.agent_tokens(id) on delete cascade,
 minute timestamptz not null,hits integer not null default 0,primary key(token_id,minute)
);
alter table public.agent_token_hits enable row level security;
-- No owner policy: only the server can count or reset calls.
alter table public.posts add column agent_token_id uuid references public.agent_tokens(id) on delete set null;
create function public.agent_hit(p_token_id uuid,p_limit integer) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_hits integer;
begin
 if p_limit is null or p_limit<>60 then raise exception 'Invalid call limit' using errcode='22023'; end if;
 perform 1 from public.agent_tokens where id=p_token_id and revoked_at is null for share;
 if not found then return false;end if;
 insert into public.agent_token_hits(token_id,minute,hits) values(p_token_id,date_trunc('minute',clock_timestamp()),1)
 on conflict(token_id,minute) do update set hits=public.agent_token_hits.hits+1 returning hits into v_hits;
 delete from public.agent_token_hits where minute<clock_timestamp()-interval '1 hour';
 return v_hits<=p_limit;
end $$;
revoke all on function public.agent_hit(uuid,integer) from public,anon,authenticated;
grant execute on function public.agent_hit(uuid,integer) to service_role;

-- Reuse the existing caption-only upload protocol, stamping provenance and
-- activity in the same transaction as publication.
create function public.agent_log_meal(p_user_id uuid,p_token_id uuid,p_caption text,p_eaten_at timestamptz) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_post uuid:=gen_random_uuid();
begin
 perform 1 from public.agent_tokens where id=p_token_id and user_id=p_user_id and revoked_at is null for share;
 if not found then raise exception 'Token required' using errcode='42501';end if;
 if p_caption is null or length(btrim(p_caption))=0 or length(p_caption)>2000 or p_eaten_at is null or p_eaten_at>now() then
  raise exception 'Invalid meal' using errcode='22023';end if;
 perform public.reserve_post_upload_with_leftovers(v_post,p_user_id,p_caption,p_eaten_at,'[]'::jsonb,null,'{}'::integer[],false,'UTC');
 perform public.publish_uploaded_post(v_post,p_user_id);
 update public.posts set agent_token_id=p_token_id where id=v_post and user_id=p_user_id;
 insert into public.agent_activity(token_id,user_id,action,post_id) values(p_token_id,p_user_id,'posted',v_post);
 return v_post;
end $$;
revoke all on function public.agent_log_meal(uuid,uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.agent_log_meal(uuid,uuid,text,timestamptz) to service_role;

-- Attribution is server-written, even though owners can edit their captions.
create function public.protect_agent_attribution() returns trigger
language plpgsql set search_path=public,pg_temp as $$
begin
 if current_user in ('authenticated','anon') and
  ((tg_op='INSERT' and new.agent_token_id is not null) or (tg_op='UPDATE' and new.agent_token_id is distinct from old.agent_token_id)) then
  raise exception 'Agent attribution is server-owned' using errcode='42501';
 end if;
 return new;
end $$;
create trigger protect_agent_attribution before insert or update on public.posts for each row execute function public.protect_agent_attribution();
