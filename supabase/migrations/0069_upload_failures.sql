-- #684: an added photo that fails says, privately, which step failed and how, so the next failure on a phone leaves
-- evidence. No photo data is kept: the step, its status, a short error, the photo's size and type, and the browser.
-- The person's own browser adds the row (Row Level Security: only as themselves); nobody reads rows through the API.
create table public.upload_failures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  post_id uuid,
  kind text not null check (kind in ('attachment')),
  stage text not null check (stage in ('encode', 'sign', 'put-original', 'put-feed', 'attach')),
  status text check (char_length(status) <= 20),
  detail text check (char_length(detail) <= 300),
  bytes bigint check (bytes >= 0),
  mime text check (char_length(mime) <= 80),
  user_agent text check (char_length(user_agent) <= 300)
);
alter table public.upload_failures enable row level security;
create policy upload_failures_insert_own on public.upload_failures for insert to authenticated with check (user_id = auth.uid());
grant insert on public.upload_failures to authenticated;
create index upload_failures_user_time on public.upload_failures (user_id, created_at desc);
