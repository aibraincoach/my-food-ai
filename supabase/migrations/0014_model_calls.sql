-- Close the pre-existing self-provisioning privilege escalation before an
-- admin-readable trace table is introduced. Ordinary users cannot choose admin.
drop policy profiles_owner_insert on public.profiles;
create policy profiles_owner_insert on public.profiles for insert
  with check (auth.uid() = id and role = 'user');

create table public.model_calls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  kind text not null check (kind in ('sam','spark_identify','spark_correct','spark_same_meal','spark_search','fdc','transcribe')),
  started_at timestamptz not null,
  duration_ms integer not null,
  input_tokens integer,
  output_tokens integer,
  request_text text,
  response_text text,
  fdc_id integer,
  error text
);
alter table public.model_calls enable row level security;
create policy model_calls_admin_select on public.model_calls for select
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create index model_calls_post_started on public.model_calls (post_id, started_at);
-- No client insert/update/delete policies: writes use the service client.
