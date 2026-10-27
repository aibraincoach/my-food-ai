-- 0001_init.sql — item 2 (#4 schema with RLS) + plan extras for item 7/8.
-- RLS on in the same statement block, default deny (no public policies except below).

create extension if not exists "pgcrypto";

-- profiles ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy profiles_owner_select on public.profiles for select using (auth.uid() = id);
create policy profiles_owner_update on public.profiles for update using (auth.uid() = id);

-- posts ------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  caption text not null default '',
  eaten_at timestamptz not null default now(),
  visibility text not null default 'private' check (visibility in ('private')),
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'needs_input', 'ready', 'failed')),
  created_at timestamptz not null default now()
);
alter table public.posts enable row level security;
create policy posts_owner_all on public.posts for all using (auth.uid() = user_id);

-- post_media ---------------------------------------------------------------
create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  storage_path text not null,
  position int not null default 0,
  width int,
  height int
);
alter table public.post_media enable row level security;
create policy post_media_owner_all on public.post_media for all using (
  auth.uid() = (select user_id from public.posts where id = post_media.post_id)
);

-- post_items (includes box jsonb for item 8) -------------------------------
create table public.post_items (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  name text not null,
  portion_text text,
  portion_grams numeric,
  box jsonb,
  mask_path text,
  confidence numeric,
  source text not null default 'model' check (source in ('model', 'user')),
  created_at timestamptz not null default now()
);
alter table public.post_items enable row level security;
create policy post_items_owner_all on public.post_items for all using (
  auth.uid() = (select user_id from public.posts where id = post_items.post_id)
);

-- item_nutrition ------------------------------------------------------------
create table public.item_nutrition (
  post_item_id uuid primary key references public.post_items (id) on delete cascade,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fibre_g numeric,
  sugar_g numeric,
  sodium_mg numeric,
  micronutrients jsonb not null default '[]',
  source_ref text
);
alter table public.item_nutrition enable row level security;
create policy item_nutrition_owner_all on public.item_nutrition for all using (
  auth.uid() = (select p.user_id from public.posts p
    join public.post_items i on i.post_id = p.id
    where i.id = item_nutrition.post_item_id)
);

-- post_comments: insert + select only, no update/delete ----------------------
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author text not null check (author in ('user', 'model')),
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.post_comments enable row level security;
create policy post_comments_owner_select on public.post_comments for select using (
  auth.uid() = (select user_id from public.posts where id = post_comments.post_id)
);
create policy post_comments_owner_insert on public.post_comments for insert with check (
  auth.uid() = (select user_id from public.posts where id = post_comments.post_id)
);

-- post_feedback --------------------------------------------------------------
create table public.post_feedback (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  verdict text not null check (verdict in ('up', 'down')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_feedback enable row level security;
create policy post_feedback_owner_all on public.post_feedback for all using (auth.uid() = user_id);

-- jobs: no client policies (server only with secret key) ----------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts (id) on delete cascade,
  kind text not null,
  priority smallint not null default 100,
  status text not null default 'queued' check (status in ('queued', 'running', 'finished', 'error')),
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  error text
);
alter table public.jobs enable row level security;
-- default deny: no policies for anon/authenticated.

-- worker lease for item 7 ------------------------------------------------------
create table public.worker_lease (
  id int primary key check (id = 1),
  holder text,
  expires_at timestamptz
);
alter table public.worker_lease enable row level security;
-- default deny: server only.

create or replace function public.try_acquire_worker_lease(p_holder text, ttl_seconds int default 300)
returns boolean language plpgsql security definer as $$
declare
  v_now timestamptz := now();
begin
  insert into public.worker_lease (id, holder, expires_at)
  values (1, p_holder, v_now + make_interval(secs => ttl_seconds))
  on conflict (id) do update set
    holder = excluded.holder,
    expires_at = excluded.expires_at
  where public.worker_lease.expires_at is null
     or public.worker_lease.expires_at < v_now;
  return found;
end $$;

create or replace function public.release_worker_lease(p_holder text)
returns void language sql security definer as $$
  update public.worker_lease set holder = null, expires_at = null
  where id = 1 and holder = p_holder;
$$;

create or replace function public.claim_job(p_now timestamptz default now())
returns public.jobs language plpgsql security definer as $$
declare
  v_job public.jobs;
begin
  select * into v_job from public.jobs
  where status = 'queued'
  order by priority asc, created_at asc
  limit 1 for update skip locked;
  if not found then
    return null;
  end if;
  update public.jobs set status = 'running', started_at = p_now,
    attempts = attempts + 1 where id = v_job.id;
  select * into v_job from public.jobs where id = v_job.id;
  return v_job;
end $$;

-- realtime ----------------------------------------------------------------------
alter publication supabase_realtime add table
  public.posts, public.post_media, public.post_items,
  public.item_nutrition, public.post_comments;

-- private storage bucket ----------------------------------------------------------
insert into storage.buckets (id, name, public) values ('media', 'media', false)
on conflict (id) do nothing;

create policy media_owner_read on storage.objects for select using (
  bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy media_owner_insert on storage.objects for insert with check (
  bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy media_owner_update on storage.objects for update using (
  bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy media_owner_delete on storage.objects for delete using (
  bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
);
