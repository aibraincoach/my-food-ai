-- Water and caffeine, logged as intake only: what was taken, never a target and never a remainder.
create table public.intake_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('water', 'caffeine')),
  amount integer not null,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  -- millilitres for water, milligrams for caffeine
  constraint intake_amount_range check (
    (kind = 'water' and amount between 1 and 5000) or (kind = 'caffeine' and amount between 1 and 1000)
  )
);
create index intake_logs_user_logged_idx on public.intake_logs (user_id, logged_at desc);
alter table public.intake_logs enable row level security;
create policy intake_owner_select on public.intake_logs for select to authenticated using (auth.uid() = user_id);
create policy intake_owner_insert on public.intake_logs for insert to authenticated with check (auth.uid() = user_id);
create policy intake_owner_delete on public.intake_logs for delete to authenticated using (auth.uid() = user_id);
-- No update policy: a mistaken entry is deleted and logged again.
