-- Only after a reviewed fix is deployed; retain original retry deadlines.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
LOCK TABLE public.posts, public.post_media, public.jobs IN SHARE ROW EXCLUSIVE MODE;
DROP TRIGGER IF EXISTS park_leftover_jobs ON public.jobs;
DROP TRIGGER IF EXISTS pause_leftover_photos ON public.post_media;
UPDATE public.jobs SET run_after=(payload#>>'{leftovers_pause,run_after}')::timestamptz,payload=payload-'leftovers_pause' WHERE status='queued' AND payload ? 'leftovers_pause';
DROP FUNCTION IF EXISTS public.park_leftover_jobs();
DROP FUNCTION IF EXISTS public.pause_leftover_photos();
COMMIT;
