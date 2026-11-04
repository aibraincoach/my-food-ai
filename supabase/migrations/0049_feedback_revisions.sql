-- One call returns many posts' revisions; it wraps feedback_revision so fingerprints stay byte-identical.
create function public.feedback_revisions(p_post_ids uuid[]) returns table(post_id uuid, revision jsonb)
language sql stable security invoker set search_path=public,pg_temp as $$
  select p.id, public.feedback_revision(p.id) from public.posts p where p.id = any(p_post_ids)
$$;
revoke all on function public.feedback_revisions(uuid[]) from public,anon;
grant execute on function public.feedback_revisions(uuid[]) to authenticated,service_role;
