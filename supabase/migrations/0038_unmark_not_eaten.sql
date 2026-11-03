-- Keep the photograph while rebuilding the meal without its subtraction.
create function public.unmark_not_eaten(p_media_id uuid) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare photo public.post_media; post public.posts; job_id uuid;
begin
 select * into photo from public.post_media where id=p_media_id and kind='photo';
 if not found then raise exception 'Photo not found' using errcode='42501';end if;
 select * into post from public.posts where id=photo.post_id and user_id=auth.uid() and deleted_at is null for update;
 if not found then raise exception 'Photo not found' using errcode='42501';end if;
 if post.status<>'ready' then raise exception 'Wait for this meal to be ready' using errcode='55000';end if;
 -- Attachment and removal use the same parent lock. Re-read after taking it.
 select * into photo from public.post_media where id=p_media_id and post_id=post.id and kind='photo' and not_eaten for update;
 if not found then raise exception 'Photo is not marked as leftovers' using errcode='55000';end if;
 update public.post_media set not_eaten=false where id=photo.id;
 insert into public.jobs(post_id,kind,priority,status,payload)
 values(post.id,'recompute',100,'queued',jsonb_build_object('reason','media_removed','media_position',photo.position,'media_unmarked',true)) returning id into job_id;
 update public.posts set status='processing',fail_reason=null where id=post.id;
 return job_id;
end $$;
revoke all on function public.unmark_not_eaten(uuid) from public,anon;
grant execute on function public.unmark_not_eaten(uuid) to authenticated;
notify pgrst,'reload schema';
