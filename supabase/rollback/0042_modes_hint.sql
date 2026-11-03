-- Restore the previous three-key validation; existing seen keys remain intact.
create or replace function public.dismiss_hint(hint_key text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if hint_key is null or hint_key not in ('capture', 'thread', 'thumbs') then raise exception 'Unknown hint'; end if;
  update public.profiles set hints_seen = array_append(hints_seen, hint_key)
    where id = auth.uid() and not (hint_key = any(hints_seen));
end;
$$;
revoke all on function public.dismiss_hint(text) from public, anon;
grant execute on function public.dismiss_hint(text) to authenticated;
