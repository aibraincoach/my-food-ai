\set ON_ERROR_STOP on
-- Stage 2, AFTER the reader-compatible application is READY on the production
-- alias. The caller verifies that immutable SHA and supplies it as reader_floor.
-- psql "$SUPABASE_DB_URL" -v reader_floor=<verified 40-character SHA> -f scripts/activate-compact-nutrition.sql
-- No polling/soak: abort immediately if a claim/write transaction or job is live.
\if :{?reader_floor}
\else
\echo 'reader_floor is required; verify the deployed dual-reader release first'
\quit 1
\endif
begin;
lock table public.jobs in access exclusive mode nowait;
lock table public.item_nutrition in access exclusive mode nowait;
do $$begin
 if exists(select 1 from public.jobs where status='running') then
  raise exception 'Running jobs remain; compact activation made no changes';
 end if;
end $$;
-- Old immutable deployment URLs can still wake. They must not claim compact
-- rows even after currently-running jobs have completed. Compatible callers
-- use the new required integer argument and bypass these two legacy wrappers.
create or replace function public.claim_owned_job(p_now timestamptz default now()) returns public.jobs
language sql security definer set search_path=public,pg_temp as $$ select null::public.jobs $$;
create or replace function public.claim_job(p_now timestamptz default now()) returns public.jobs
language sql security definer set search_path=public,pg_temp as $$ select null::public.jobs $$;
update public.nutrition_provenance_format set compact=true,reader_floor=:'reader_floor' where id;
\ir ../supabase/migrations/0055_approximation_once.sql
commit;
-- The new writer may now opt in with NUTRITION_COMPACT_WRITE=1. The database
-- trigger already compacts all writes, including legacy/copy payloads.
