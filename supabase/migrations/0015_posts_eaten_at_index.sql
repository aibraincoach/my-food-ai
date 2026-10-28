-- The feed and the profile grid page by (eaten_at, id) within one user's posts (keyset pagination).
create index if not exists posts_user_eaten_idx on public.posts (user_id, eaten_at desc, id desc);
