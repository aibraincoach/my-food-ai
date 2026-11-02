-- Emergency feature rollback AFTER 0028; preserve every accepted record.
-- Hold the worker lease and wait for running affected jobs to finish first.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
LOCK TABLE public.posts, public.post_media, public.jobs IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.jobs j WHERE j.status='running' AND j.kind IN ('analyze','correct','recompute','remainder') AND EXISTS(SELECT 1 FROM public.post_media m WHERE m.post_id=j.post_id AND m.not_eaten)) THEN
  RAISE EXCEPTION 'Wait for affected running jobs before pausing leftovers' USING ERRCODE='55000';
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.pause_leftover_photos() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.kind<>'photo' THEN RETURN NEW;END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.not_eaten IS NOT DISTINCT FROM OLD.not_eaten THEN RETURN NEW;END IF;
  IF OLD.not_eaten THEN RAISE EXCEPTION 'Existing leftovers records are preserved while updates are paused' USING ERRCODE='55000';END IF;
 END IF;
 IF NEW.not_eaten OR EXISTS(SELECT 1 FROM public.post_media m WHERE m.post_id=NEW.post_id AND m.not_eaten) THEN
  RAISE EXCEPTION 'Leftovers updates are paused. Your existing meal record was kept; try this photo again later.' USING ERRCODE='55000';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pause_leftover_photos ON public.post_media;
CREATE TRIGGER pause_leftover_photos BEFORE INSERT OR UPDATE OF not_eaten ON public.post_media FOR EACH ROW EXECUTE FUNCTION public.pause_leftover_photos();
CREATE OR REPLACE FUNCTION public.park_leftover_jobs() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.status IN ('queued','running') AND NEW.kind IN ('analyze','correct','recompute','remainder') AND EXISTS(SELECT 1 FROM public.post_media m WHERE m.post_id=NEW.post_id AND m.not_eaten) THEN
  IF NEW.status='running' THEN RAISE EXCEPTION 'Leftovers work is paused' USING ERRCODE='55000';END IF;
  NEW.payload:=coalesce(NEW.payload,'{}'::jsonb)||jsonb_build_object('leftovers_pause',coalesce(NEW.payload->'leftovers_pause',jsonb_build_object('run_after',NEW.run_after)));
  NEW.run_after:='2100-01-01T00:00:00Z'::timestamptz;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS park_leftover_jobs ON public.jobs;
CREATE TRIGGER park_leftover_jobs BEFORE INSERT OR UPDATE OF status,run_after,payload ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.park_leftover_jobs();
UPDATE public.jobs j SET run_after=j.run_after WHERE j.status='queued' AND j.kind IN ('analyze','correct','recompute','remainder') AND EXISTS(SELECT 1 FROM public.post_media m WHERE m.post_id=j.post_id AND m.not_eaten);
-- Existing media flags, item/nutrition rows, comments and per-photo receipts
-- are unchanged. Unaffected meals continue after the worker lease is released.
COMMIT;
