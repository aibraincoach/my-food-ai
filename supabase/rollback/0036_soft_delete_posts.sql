begin;
select cron.unschedule('purge-deleted-posts');
drop function public.purge_deleted_posts();
drop function public.list_deleted_posts(uuid);
drop function public.restore_post(uuid);
alter policy intake_owner_select on public.intake_logs using(auth.uid()=user_id);
drop policy posts_owner_select on public.posts;
drop policy posts_owner_insert on public.posts;
drop policy posts_owner_update on public.posts;
drop policy posts_owner_delete on public.posts;
create policy posts_owner_all on public.posts for all using(auth.uid()=user_id);
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
 if p_action='delete' then
  prefix:=auth.uid()::text||'/'||post.id::text||'/';
  if p_paths is null or exists(select 1 from unnest(p_paths) path where path is null or left(path,length(prefix))<>prefix or '..'=any(string_to_array(path,'/'))) then raise exception 'Invalid cleanup path' using errcode='22023';end if;
  -- Prefix cleanup also catches an object arriving after the route's listing.
  insert into public.jobs(post_id,kind,priority,status,payload) values(null,'media_cleanup',200,'queued',jsonb_build_object('owner_id',auth.uid(),'deleted_post_id',post.id,'paths',to_jsonb(p_paths)));
  delete from public.posts where id=post.id;
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
drop index public.posts_deleted_idx;
alter table public.posts drop column deleted_at;
notify pgrst,'reload schema';
commit;
