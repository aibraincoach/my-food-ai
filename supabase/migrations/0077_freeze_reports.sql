-- Explicitly sent diagnostics only. No changes to existing application tables.
-- Match the endpoint whitelist for direct authenticated inserts as well.
create function public.freeze_report_events_valid(events jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  event jsonb;
  allowed constant jsonb := '{"page-load":[],"screen":["feed","post","days","search","profile","about","deleted","agents","admin","welcome","sign-in","sign-up","handle","reset","other"],"visibility":["visible","hidden"],"update":["found","waiting","deferred","reloading"],"camera":["opening","ready","closed","failed:NotAllowedError","failed:NotFoundError","failed:NotReadableError","failed:OverconstrainedError","failed:AbortError","failed:SecurityError","failed:InvalidStateError","failed:NotSupportedError","failed:other"],"sheet":["capture-open","capture-close"]}'::jsonb;
  name text;
  stamp numeric;
begin
  if jsonb_typeof(events) is distinct from 'array' then return false; end if;
  if jsonb_array_length(events) > 20 then return false; end if;
  for event in select value from jsonb_array_elements(events) loop
    if jsonb_typeof(event) is distinct from 'object' then return false; end if;
    if event - array['t','name','value'] <> '{}'::jsonb then return false; end if;
    if jsonb_typeof(event->'t') is distinct from 'number' or jsonb_typeof(event->'name') is distinct from 'string' then return false; end if;
    stamp := (event->>'t')::numeric;
    if stamp < 0 or stamp > 8640000000000000 or mod(stamp,1) <> 0 then return false; end if;
    name := event->>'name';
    if not (allowed ? name) then return false; end if;
    if name = 'page-load' then
      if event ? 'value' then return false; end if;
    else
      if jsonb_typeof(event->'value') is distinct from 'string' then return false; end if;
      if not ((allowed->name) ? (event->>'value')) then return false; end if;
    end if;
  end loop;
  return true;
end;
$$;
revoke all on function public.freeze_report_events_valid(jsonb) from public, anon;
grant execute on function public.freeze_report_events_valid(jsonb) to authenticated, service_role;
create table public.freeze_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default clock_timestamp(),
  events jsonb not null check (public.freeze_report_events_valid(events)),
  user_agent text not null check (char_length(user_agent) <= 300),
  build text not null check (char_length(build) <= 80),
  camera_permission text not null check (camera_permission in ('granted','denied','prompt','unknown'))
);
create index freeze_reports_created_at on public.freeze_reports (created_at desc);
create index freeze_reports_user_created_at on public.freeze_reports (user_id, created_at desc);
alter table public.freeze_reports enable row level security;
revoke all on public.freeze_reports from public, anon, authenticated, service_role;
grant insert (user_id, events, user_agent, build, camera_permission) on public.freeze_reports to authenticated;
grant select on public.freeze_reports to service_role;
create policy freeze_reports_insert_own on public.freeze_reports for insert to authenticated with check (auth.uid() = user_id);
-- Serialize concurrent sends for the same account, including direct authenticated inserts.
-- The timestamp cannot be supplied by authenticated callers (column grant above).
create function public.freeze_reports_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Reject a foreign owner before the definer can inspect that account's rate.
  if auth.uid() is not null and auth.uid() is distinct from new.user_id then
    raise exception 'Not report owner' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 1206));
  if exists (select 1 from public.freeze_reports where user_id = new.user_id and created_at > clock_timestamp() - interval '60 seconds') then
    raise exception 'Report rate limited' using errcode = 'P4290';
  end if;
  return new;
end;
$$;
revoke all on function public.freeze_reports_limit() from public, anon, authenticated, service_role;
create trigger freeze_reports_limit before insert on public.freeze_reports for each row execute function public.freeze_reports_limit();
