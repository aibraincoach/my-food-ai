-- Owner entrypoints stay invoker functions. A constrained definer helper is
-- necessary because jobs has no authenticated INSERT policy, and cascading
-- generated-card deletion must execute under the server role.
alter table public.intake_logs drop constraint intake_logs_post_id_fkey;
alter table public.intake_logs add constraint intake_logs_post_id_fkey foreign key(post_id) references public.posts(id) on delete cascade;
alter table public.post_comments add column reverted_at timestamptz;
create policy post_comments_owner_revert on public.post_comments for update
 using(auth.uid()=(select user_id from public.posts where id=post_id))
 with check(auth.uid()=(select user_id from public.posts where id=post_id));
create function public.only_reverted_at_changes() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if current_user='authenticated' and (to_jsonb(new)-'reverted_at') is distinct from (to_jsonb(old)-'reverted_at') then
  raise exception 'Only reverted_at may change' using errcode='42501';
 end if;
 if current_user='authenticated' and (old.author<>'user' or old.reverted_at is not null or new.reverted_at is null) then
  raise exception 'Only an active correction may be removed' using errcode='42501';
 end if;
 return new;
end $$;
create trigger only_reverted_at_changes before update on public.post_comments for each row execute function public.only_reverted_at_changes();

create function public.owner_remove_post_data(p_action text,p_id uuid,p_paths text[] default '{}') returns boolean
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
revoke all on function public.owner_remove_post_data(text,uuid,text[]) from public,anon;
grant execute on function public.owner_remove_post_data(text,uuid,text[]) to authenticated;
create function public.delete_post(p_post_id uuid,p_paths text[]) returns boolean language sql security invoker set search_path=public,pg_temp as $$ select public.owner_remove_post_data('delete',p_post_id,p_paths) $$;
create function public.remove_post_media(p_media_id uuid) returns boolean language sql security invoker set search_path=public,pg_temp as $$ select public.owner_remove_post_data('media',p_media_id) $$;
create function public.revert_correction(p_comment_id uuid) returns boolean language sql security invoker set search_path=public,pg_temp as $$ select public.owner_remove_post_data('correction',p_comment_id) $$;
revoke all on function public.delete_post(uuid,text[]),public.remove_post_media(uuid),public.revert_correction(uuid) from public,anon;
grant execute on function public.delete_post(uuid,text[]),public.remove_post_media(uuid),public.revert_correction(uuid) to authenticated;

create or replace function public.carry_item_leftovers() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare prior public.post_items;
begin
 if current_setting('mfa.reset_leftovers',true)='on' then return new;end if;
 if new.supersedes is not null then
  select * into prior from public.post_items where id=new.supersedes and post_id=new.post_id;
  if found and prior.not_eaten_grams is not null and new.not_eaten_grams is null then
   new.not_eaten_grams:=prior.not_eaten_grams;new.not_eaten_calories:=prior.not_eaten_calories;new.not_eaten_count_text:=prior.not_eaten_count_text;
   new.count_text:=case when new.portion_grams is not distinct from prior.portion_grams then prior.count_text else null end;
  end if;
 end if;
 return new;
end $$;

-- The whole rebuilt revision commits once, on the same connection as the local
-- leftovers bypass. Model calls happen before this transaction, so a retry never
-- exposes a half-rebuilt meal. The job marker makes card-render retries idempotent.
create function public.persist_removed_rebuild(p_post_id uuid,p_job_id uuid,p_expected uuid[],p_comments uuid[],p_photos uuid[],p_items jsonb,p_reply text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare actual uuid[]; row jsonb; n jsonb; new_id uuid; prior uuid;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found or not public.post_work_matches(p_post_id,p_job_id) then raise exception 'Rebuild no longer owns meal' using errcode='40001';end if;
 if exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id and payload->>'removal_rebuilt'='true') then return false;end if;
 if not exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id and kind='recompute' and status='running' and payload->>'reason' in ('media_removed','correction_reverted')) then raise exception 'Rebuild job missing' using errcode='42501';end if;
 select array_agg(id order by id) into actual from public.current_post_items where post_id=p_post_id;
 if actual is distinct from (select array_agg(id order by id) from unnest(p_expected) id) then raise exception 'Meal changed during rebuild' using errcode='40001';end if;
 select coalesce(array_agg(id order by created_at,id),'{}') into actual from public.post_comments where post_id=p_post_id and author='user' and reverted_at is null;
 if actual is distinct from p_comments then raise exception 'Corrections changed during rebuild' using errcode='40001';end if;
 select coalesce(array_agg(id order by position,id),'{}') into actual from public.post_media where post_id=p_post_id and kind='photo' and not_eaten;
 if actual is distinct from p_photos then raise exception 'Photos changed during rebuild' using errcode='40001';end if;
 if jsonb_typeof(p_items) is distinct from 'array' or length(p_reply)>4000 or length(btrim(p_reply))=0 then raise exception 'Invalid rebuilt revision' using errcode='22023';end if;
 perform set_config('mfa.reset_leftovers','on',true);
 update public.post_items set superseded_at=clock_timestamp() where post_id=p_post_id and superseded_at is null;
 for row in select value from jsonb_array_elements(p_items) loop
  prior:=nullif(row->>'supersedes','')::uuid;
  if prior is not null and not(prior=any(p_expected)) then raise exception 'Invalid rebuild ancestor' using errcode='22023';end if;
  insert into public.post_items(post_id,name,portion_text,portion_grams,box,mask_path,source,gtin,not_eaten_grams,not_eaten_calories,count_text,not_eaten_count_text,supersedes)
   values(p_post_id,row->>'name',row->>'portion_text',(row->>'portion_grams')::numeric,row->'box',row->>'mask_path','model',row->>'gtin',(row->>'not_eaten_grams')::integer,(row->>'not_eaten_calories')::numeric,row->>'count_text',row->>'not_eaten_count_text',prior) returning id into new_id;
  n:=row->'nutrition';
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref)
   values(new_id,(n->>'calories')::numeric,(n->>'protein_g')::numeric,(n->>'carbs_g')::numeric,(n->>'fat_g')::numeric,(n->>'fibre_g')::numeric,(n->>'sugar_g')::numeric,(n->>'sodium_mg')::numeric,coalesce(n->'micronutrients','[]'),n->>'source_ref');
 end loop;
 insert into public.post_comments(post_id,author,body) values(p_post_id,'model',p_reply);
 update public.jobs set payload=payload||jsonb_build_object('removal_rebuilt',true) where id=p_job_id;
 -- Include these messages in future correction windows without re-applying them.
 insert into public.jobs(post_id,kind,status,priority,payload,finished_at)
 values(p_post_id,'correct','finished',100,jsonb_build_object('correction_applied',true,'correction_pending_ids',to_jsonb(p_comments),'correction_sequence',coalesce((select max((payload->>'correction_sequence')::bigint) from public.jobs where post_id=p_post_id and kind='correct' and payload->>'correction_applied'='true'),0)+1),now());
 perform set_config('mfa.reset_leftovers','off',true);
 return true;
end $$;
revoke all on function public.persist_removed_rebuild(uuid,uuid,uuid[],uuid[],uuid[],jsonb,text) from public,anon,authenticated;
grant execute on function public.persist_removed_rebuild(uuid,uuid,uuid[],uuid[],uuid[],jsonb,text) to service_role;
notify pgrst,'reload schema';
