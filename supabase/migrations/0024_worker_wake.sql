-- Durable wake survives a failed or terminated serverless handoff. Installation
-- creates no network traffic until the deployment URL is explicitly configured.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create table public.worker_wake_config (
  id boolean primary key default true check (id),
  tick_url text not null,
  updated_at timestamptz not null default now()
);
alter table public.worker_wake_config enable row level security;
revoke all on public.worker_wake_config from public, anon, authenticated;
grant select, insert, update, delete on public.worker_wake_config to service_role;

create or replace function public.configure_worker_wake(p_app_url text)
returns void language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  -- Accept an origin, never credentials, a query, or an arbitrary request path.
  if p_app_url is null or p_app_url !~ '^https://[A-Za-z0-9.-]+(:[0-9]+)?/?$' then
    raise exception 'Worker wake requires an HTTPS application origin' using errcode = '22023';
  end if;
  insert into public.worker_wake_config(id,tick_url,updated_at)
    values(true,rtrim(p_app_url,'/')||'/api/jobs/tick',now())
    on conflict(id) do update set tick_url=excluded.tick_url,updated_at=excluded.updated_at;
end $$;
revoke all on function public.configure_worker_wake(text) from public, anon, authenticated;
grant execute on function public.configure_worker_wake(text) to service_role;

create or replace function public.wake_due_worker()
returns bigint language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare target text; due timestamptz; request_id bigint;
begin
  select tick_url into target from public.worker_wake_config where id;
  if target is null then return null; end if;
  due := public.next_worker_wake();
  -- The existing RPC includes due retries, expired owners, and the lease expiry.
  -- Future jobs (including photo staging cleanup) do not produce polling work.
  if due is null or due > clock_timestamp() then return null; end if;
  select net.http_get(url := target, timeout_milliseconds := 10000) into request_id;
  return request_id;
end $$;
revoke all on function public.wake_due_worker() from public, anon, authenticated;
grant execute on function public.wake_due_worker() to service_role;

-- The stable job name makes repeated installation/configuration nonduplicating.
do $$
declare existing bigint;
begin
  for existing in select jobid from cron.job where jobname='my-food-ai-worker-wake' loop
    perform cron.unschedule(existing);
  end loop;
  perform cron.schedule('my-food-ai-worker-wake','* * * * *','select public.wake_due_worker();');
end $$;
