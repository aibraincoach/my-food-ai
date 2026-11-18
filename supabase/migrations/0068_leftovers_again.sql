-- #684: 0067 rebuilt prepare_post_photo_attachment from 0027's body to change its drink rule, and with it brought
-- back 0027's "only one later photo can be not eaten", which 0028 (multiple leftovers) had removed. So since 0067 a
-- meal that already had a leftovers photo refused another, with a sentence the app does not map ("The photo could not
-- be attached."). This is 0067's function without that line: 0028's rule for leftovers and 0067's rule for drinks.
create or replace function public.prepare_post_photo_attachment(p_post_id uuid,p_user_id uuid,p_stage_path text,p_not_eaten boolean)
returns public.post_photo_attachments language plpgsql security definer set search_path=public,pg_temp as $$
declare row public.post_photo_attachments; current_status text; pos integer; cleanup uuid; stage_cleanup public.jobs;
begin
 select status into current_status from public.posts where id=p_post_id and user_id=p_user_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 -- #684: only drinks typed in the drink sheet are fixed when posted (0029). A drink or a caffeine row that the
 -- meal's own foods produce is rebuilt from them, so a leftovers photo may change it.
 if exists(select 1 from public.intake_logs where post_id=p_post_id and source='sheet') then raise exception 'Drink amounts were recorded when posted' using errcode='55000';end if;
 select * into row from public.post_photo_attachments where stage_path=p_stage_path for update;
 if found then
  if row.post_id<>p_post_id or row.user_id<>p_user_id or row.not_eaten<>p_not_eaten then raise exception 'Photo already claimed' using errcode='22023';end if;
  return row;
 end if;
 if current_status<>'ready' then raise exception 'Wait for this meal to be ready' using errcode='55000';end if;
 if p_not_eaten is null then raise exception 'Photo type required' using errcode='22023';end if;
 if p_stage_path !~ ('^'||p_user_id::text||'/[0-9a-f-]{36}/0[.]jpg$') then raise exception 'Invalid staged photo' using errcode='22023';end if;
 select * into stage_cleanup from public.jobs where kind='media_cleanup' and payload->>'owner_id'=p_user_id::text and payload->>'deleted_post_id'=split_part(p_stage_path,'/',2) for update;
 if not found or stage_cleanup.status<>'queued' or stage_cleanup.run_after<=clock_timestamp() then raise exception 'Photo stage expired' using errcode='22023';end if;
 if not exists(select 1 from storage.objects where bucket_id='media' and name=p_stage_path) or not exists(select 1 from storage.objects where bucket_id='media' and name=replace(p_stage_path,'.jpg','.feed.jpg')) then raise exception 'Photo upload incomplete' using errcode='22023';end if;
 if (select count(*) from public.post_media where post_id=p_post_id and kind='photo')>=8 then raise exception 'A meal has at most eight photos' using errcode='22023';end if;
 select coalesce(max(position),-1)+1 into pos from (select position from public.post_media where post_id=p_post_id and kind='photo' union all select position from public.post_photo_attachments where post_id=p_post_id) positions;
 insert into public.post_photo_attachments(post_id,user_id,stage_path,target_path,position,not_eaten)
 values(p_post_id,p_user_id,p_stage_path,p_user_id::text||'/'||p_post_id::text||'/'||pos::text||'.jpg',pos,p_not_eaten) returning * into row;
 insert into public.jobs(post_id,kind,priority,status,run_after,payload) values(null,'media_cleanup',200,'queued',now()+interval '3 hours',jsonb_build_object('owner_id',p_user_id,'deleted_post_id',p_post_id,'paths',jsonb_build_array(row.target_path,replace(row.target_path,'.jpg','.feed.jpg')),'exact',true,'attachment_id',row.id)) returning id into cleanup;
 update public.post_photo_attachments set cleanup_job_id=cleanup where id=row.id returning * into row;
 return row;
end $$;
revoke all on function public.prepare_post_photo_attachment(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.prepare_post_photo_attachment(uuid,uuid,text,boolean) to service_role;
