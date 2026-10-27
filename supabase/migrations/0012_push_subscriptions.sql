create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text unique not null,
  keys jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy push_owner_select on public.push_subscriptions for select to authenticated using (auth.uid() = user_id);
create policy push_owner_insert on public.push_subscriptions for insert to authenticated with check (auth.uid() = user_id);
create policy push_owner_delete on public.push_subscriptions for delete to authenticated using (auth.uid() = user_id);
