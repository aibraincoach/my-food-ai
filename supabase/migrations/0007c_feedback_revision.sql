-- Feedback approves the immutable analysis actually displayed to the user.
alter table public.post_feedback add column model_comment_id uuid references public.post_comments(id) on delete set null;
drop policy post_feedback_owner_all on public.post_feedback;
create policy post_feedback_owner_all on public.post_feedback for all
using (auth.uid()=user_id and exists(select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid()))
with check (auth.uid()=user_id and exists(select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid())
 and exists(select 1 from public.post_comments c where c.id=model_comment_id and c.post_id=post_feedback.post_id and c.author='model'));
