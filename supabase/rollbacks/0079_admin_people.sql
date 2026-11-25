-- Revert the panel code before removing its read-only function.
drop function public.admin_people(text,timestamptz,uuid[],integer,uuid);
