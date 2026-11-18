-- #1095 (Fleet 50): discarding a meal that waits for an answer is a soft delete, like the owner's delete (0036).
-- The row keeps its media until the daily purge (purge_deleted_posts), which queues the prefix media_cleanup job and
-- deletes the row. Readers already treat a soft-deleted needs_input meal as deleted: the owner's delete reaches it too.
-- Rollback: docs/plan-fleet50.md section 2a.
begin;
drop function public.discard_post(uuid,uuid,text[]);
create function public.discard_post(p_post_id uuid,p_user_id uuid) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.posts set deleted_at=now()
   where id=p_post_id and user_id=p_user_id and status='needs_input' and deleted_at is null;
  return found;
end $$;
revoke all on function public.discard_post(uuid,uuid) from public,anon,authenticated;
grant execute on function public.discard_post(uuid,uuid) to service_role;
notify pgrst,'reload schema';
commit;
