-- Apply before the admin page is deployed. Production policy drift was found
-- during the rollback validation pass: INSERT absent, UPDATE lacked WITH CHECK.
drop policy if exists profiles_owner_insert on public.profiles;
create policy profiles_owner_insert on public.profiles for insert to authenticated
  with check (auth.uid() = id and role = 'user');
drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id and role = 'user');
