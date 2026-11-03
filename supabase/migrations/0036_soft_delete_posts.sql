-- Deleted rows remain private and retained until the daily purge.
begin;
alter table public.posts add column deleted_at timestamptz;
create index posts_deleted_idx on public.posts(user_id,deleted_at) where deleted_at is not null;
-- The original FOR ALL policy also granted SELECT; split it so no permissive
-- policy can accidentally expose retained records.
drop policy posts_owner_all on public.posts;
create policy posts_owner_select on public.posts for select using(auth.uid()=user_id and deleted_at is null);
create policy posts_owner_insert on public.posts for insert with check(auth.uid()=user_id and deleted_at is null);
create policy posts_owner_update on public.posts for update using(auth.uid()=user_id and deleted_at is null) with check(auth.uid()=user_id and deleted_at is null);
create policy posts_owner_delete on public.posts for delete using(auth.uid()=user_id and deleted_at is null);
-- Intake has its own owner policy: hiding only posts would still count drinks.
alter policy intake_owner_select on public.intake_logs using(auth.uid()=user_id and (post_id is null or exists(select 1 from public.posts p where p.id=post_id)));
create or replace function public.owner_remove_post_data(p_action text,p_id uuid,p_paths text[] default '{}') returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare post public.posts; photo public.post_media; comment public.post_comments; prefix text;
begin
 if auth.uid() is null then return false;end if;
 if p_action='delete' then
  select * into post from public.posts where id=p_id and user_id=auth.uid() for update;
 elsif p_action='media' then
  select * into photo from public.post_media where id=p_id and kind='photo' and not_eaten;
  if not found then return false;end if;
  select * into post from public.posts where id=photo.post_id and user_id=auth.uid() for update;
 elsif p_action='correction' then
  select * into comment from public.post_comments where id=p_id and author='user' and reverted_at is null;
  if not found then return false;end if;
  select * into post from public.posts where id=comment.post_id and user_id=auth.uid() for update;
 else return false;
 end if;
 if not found then return false;end if;
 if post.deleted_at is not null then return false;end if;
 if p_action='delete' then
  update public.posts set deleted_at=now() where id=post.id;
  return true;
 end if;
 if post.status<>'ready' then return false;end if;
 if p_action='media' then
  -- Re-read under the parent lock used by all attachment/removal operations.
  select * into photo from public.post_media where id=p_id and post_id=post.id and kind='photo' and not_eaten for update;
  if not found then return false;end if;
  prefix:=auth.uid()::text||'/'||post.id::text||'/';
  if left(photo.storage_path,length(prefix))<>prefix or '..'=any(string_to_array(photo.storage_path,'/')) then raise exception 'Invalid cleanup path' using errcode='22023';end if;
  insert into public.jobs(post_id,kind,priority,status,payload) values(null,'media_cleanup',200,'queued',jsonb_build_object('owner_id',auth.uid(),'deleted_post_id',post.id,'paths',jsonb_build_array(photo.storage_path,regexp_replace(photo.storage_path,'[.]jpg$','.feed.jpg')),'exact',true,'removed_media_id',photo.id));
  delete from public.post_media where id=photo.id;
  insert into public.jobs(post_id,kind,priority,status,payload) values(post.id,'recompute',100,'queued',jsonb_build_object('reason','media_removed','media_position',photo.position));
 else
  update public.post_comments set reverted_at=now() where id=p_id and post_id=post.id and author='user' and reverted_at is null;
  if not found then return false;end if;
  insert into public.jobs(post_id,kind,priority,status,payload) values(post.id,'recompute',100,'queued',jsonb_build_object('reason','correction_reverted','comment_id',p_id));
 end if;
 update public.posts set status='processing',fail_reason=null where id=post.id;
 return true;
end $$;

create or replace function public.delete_post(p_post_id uuid,p_paths text[]) returns boolean
language sql security invoker set search_path=public,pg_temp as $$ select public.owner_remove_post_data('delete',p_post_id,p_paths) $$;
create function public.restore_post(p_post_id uuid) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update public.posts set deleted_at=null where id=p_post_id and user_id=auth.uid() and deleted_at>now()-interval '30 days';
 return found;
end $$;
create function public.list_deleted_posts(p_user_id uuid) returns table(id uuid,caption text,eaten_at timestamptz,deleted_at timestamptz,thumbnail_path text)
language sql stable security definer set search_path=public,pg_temp as $$
 select p.id,p.caption,p.eaten_at,p.deleted_at,(select m.storage_path from public.post_media m where m.post_id=p.id and m.kind='photo' order by m.position limit 1)
 from public.posts p where p.user_id=p_user_id and p_user_id=auth.uid() and p.deleted_at>now()-interval '30 days' order by p.deleted_at desc,p.id desc
$$;
create function public.purge_deleted_posts() returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare post public.posts;
begin
 for post in select * from public.posts where deleted_at<now()-interval '30 days' for update skip locked loop
  -- The durable prefix job also catches uploads that finished after deletion.
  insert into public.jobs(post_id,kind,priority,status,payload) values(null,'media_cleanup',200,'queued',jsonb_build_object('owner_id',post.user_id,'deleted_post_id',post.id,'paths','[]'::jsonb));
  delete from public.posts where id=post.id;
 end loop;
end $$;
revoke all on function public.restore_post(uuid),public.list_deleted_posts(uuid) from public,anon;
grant execute on function public.restore_post(uuid),public.list_deleted_posts(uuid) to authenticated;
revoke all on function public.purge_deleted_posts() from public,anon,authenticated;
grant execute on function public.purge_deleted_posts() to service_role;
select cron.schedule('purge-deleted-posts','0 3 * * *','select public.purge_deleted_posts()');
notify pgrst,'reload schema';
commit;
