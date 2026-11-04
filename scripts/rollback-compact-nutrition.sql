\set ON_ERROR_STOP on
-- Run BEFORE an application rollback below the recorded reader floor. This
-- transaction re-expands every row and future compact payload before allowing
-- old immutable workers to claim again. New writers cannot re-break old readers.
begin;
lock table public.jobs in access exclusive mode nowait;
lock table public.item_nutrition in access exclusive mode nowait;
do $$begin
 if exists(select 1 from public.jobs where status='running') then
  raise exception 'Running jobs remain; compact rollback made no changes';
 end if;
end $$;
update public.nutrition_provenance_format set compact=false,reader_floor=null where id;
\ir ../supabase/rollbacks/0055_approximation_once.down.sql
create or replace function public.claim_owned_job(p_now timestamptz default now()) returns public.jobs
language sql security definer set search_path=public,pg_temp as $$ select public.claim_post_job(p_now,true) $$;
create or replace function public.claim_job(p_now timestamptz default now()) returns public.jobs
language sql security definer set search_path=public,pg_temp as $$ select public.claim_post_job(p_now,false) $$;
commit;
