-- Home reads today's totals with the Days reader; nothing calls this function any more.
drop function if exists public.today_summary(text);
notify pgrst, 'reload schema';
