create table public.post_locations (
  post_id uuid primary key references public.posts(id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  accuracy_m real check (accuracy_m >= 0),
  captured_at timestamptz not null default now()
);
alter table public.post_locations enable row level security;
create policy post_locations_owner_select on public.post_locations for select
  using (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));
create policy post_locations_owner_insert on public.post_locations for insert
  with check (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));
