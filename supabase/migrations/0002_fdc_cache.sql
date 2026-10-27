-- 0002_fdc_cache.sql — item 10 (#10 nutrition lookup).
-- FDC response cache: query text primary key, raw response, fetch time.
-- Server only: RLS on, no client policies (default deny, like jobs).
create table public.fdc_cache (
  query text primary key,
  response jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.fdc_cache enable row level security;
