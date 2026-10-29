-- Drink posts retain the existing owner-only read/insert/delete policies and no update policy.
alter table public.intake_logs
  add column ml integer check (ml is null or ml between 1 and 5000),
  add column label text check (label is null or char_length(label) between 1 and 40),
  add column post_id uuid references public.posts(id) on delete set null;
create index intake_logs_post_idx on public.intake_logs(post_id) where post_id is not null;
