-- Pin search_path on the three SECURITY DEFINER functions so an attacker's
-- search_path cannot redirect their unqualified lookups (make_interval,
-- now(), gen_random_uuid() are all pg_catalog, resolved safely either way;
-- this removes the residual hijack surface entirely).
alter function public.try_acquire_worker_lease(text, int)
  set search_path = public, pg_temp;
alter function public.release_worker_lease(text)
  set search_path = public, pg_temp;
alter function public.claim_job(timestamptz)
  set search_path = public, pg_temp;
