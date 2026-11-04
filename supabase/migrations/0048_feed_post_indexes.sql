-- Feed reads filter media and comments by post; neither table had a plain index on post_id.
create index if not exists post_media_post_id_idx on public.post_media(post_id);
create index if not exists post_comments_post_id_idx on public.post_comments(post_id);
