-- Per-account identify provider; hosted Meta remains the default.
alter table public.profiles add column identify_provider text not null default 'meta'
 check (identify_provider in ('meta','open'));
alter table public.model_calls add column model text, add column host text;

-- Existing profile editing policies stay intact. This narrowly scoped RPC also
-- permits an admin owner to change this one preference without weakening the
-- role='user' guard in the general UPDATE policy.
create function public.set_identify_provider(p_provider text) returns text
language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or p_provider not in ('meta','open') or p_provider is null then
  raise exception 'Invalid identify provider' using errcode='22023';
 end if;
 update public.profiles set identify_provider=p_provider where id=auth.uid();
 if not found then raise exception 'Profile not found' using errcode='42501'; end if;
 return p_provider;
end $$;
revoke all on function public.set_identify_provider(text) from public,anon;
grant execute on function public.set_identify_provider(text) to authenticated;
notify pgrst,'reload schema';
