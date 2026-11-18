alter publication supabase_realtime drop table public.post_media, public.post_items, public.item_nutrition;
create index jobs_running_post on public.jobs (post_id) where status = 'running';
