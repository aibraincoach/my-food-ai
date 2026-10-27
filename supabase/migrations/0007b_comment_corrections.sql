-- Apply after 0007 and before 0008. Users can append only their own words.
drop policy if exists post_comments_owner_insert on public.post_comments;
create policy post_comments_owner_insert on public.post_comments for insert to authenticated with check (
  author = 'user' and exists(select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid())
);
revoke update, delete on public.post_comments from authenticated;

create or replace function public.append_post_comment(p_post_id uuid,p_user_id uuid,p_text text)
returns public.post_comments language plpgsql security definer set search_path=public,pg_temp as $$
declare result public.post_comments;
begin
 perform 1 from public.posts where id=p_post_id and user_id=p_user_id for update;
 if not found then raise exception 'Post not found' using errcode='42501'; end if;
 if p_text is null or length(btrim(p_text))=0 or length(p_text)>4000 then raise exception 'Invalid comment' using errcode='22023'; end if;
 insert into public.post_comments(post_id,author,body) values(p_post_id,'user',btrim(p_text)) returning * into result;
 insert into public.jobs(post_id,kind,priority,status)
 select p_post_id,'correct',100,'queued' where not exists (
  select 1 from public.jobs where post_id=p_post_id and kind='correct' and
   (status='queued' or (status='running' and not coalesce((payload->>'correction_applied')::boolean,false)))
 );
 update public.posts set status='queued',fail_reason=null where id=p_post_id;
 return result;
end;
$$;
revoke all on function public.append_post_comment(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.append_post_comment(uuid,uuid,text) to service_role;

-- Preserve the original estimates, revision and reply in one transaction.
-- Expected IDs protect a manual edit made while the model was answering.
create or replace function public.persist_correction(p_post_id uuid,p_job_id uuid,p_expected uuid[],p_through uuid,p_items jsonb,p_reply text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare expected uuid[]; actual uuid[]; row jsonb; new_id uuid; prior uuid; latest uuid;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post missing' using errcode='42501'; end if;
 if exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id and coalesce((payload->>'correction_applied')::boolean,false)) then return false; end if;
 if not exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id and kind='correct' and status='running') then raise exception 'Correction job missing' using errcode='22023'; end if;
 select array_agg(id order by id) into actual from public.current_post_items where post_id=p_post_id;
 select array_agg(id order by id) into expected from unnest(p_expected) id;
 if actual is distinct from expected then raise exception 'Items changed during correction' using errcode='40001'; end if;
 if not exists(select 1 from public.post_comments where id=p_through and post_id=p_post_id and author='user') then raise exception 'Comment missing' using errcode='22023'; end if;
 if jsonb_typeof(p_items)<>'array' or length(btrim(p_reply))=0 then raise exception 'Invalid correction' using errcode='22023'; end if;
 update public.post_items set superseded_at=now() where post_id=p_post_id and superseded_at is null;
 for row in select value from jsonb_array_elements(p_items) loop
  prior := nullif(row->>'supersedes','')::uuid;
  if prior is not null and not (prior=any(coalesce(p_expected,array[]::uuid[]))) then raise exception 'Invalid prior item' using errcode='22023'; end if;
  insert into public.post_items(post_id,name,portion_text,portion_grams,box,mask_path,source,supersedes)
  values(p_post_id,row->>'name',row->>'portion_text',(row->>'portion_grams')::numeric,nullif(row->'box','null'::jsonb),row->>'mask_path','model',prior) returning id into new_id;
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref)
  values(new_id,(row#>>'{nutrition,calories}')::numeric,(row#>>'{nutrition,protein_g}')::numeric,(row#>>'{nutrition,carbs_g}')::numeric,(row#>>'{nutrition,fat_g}')::numeric,
   (row#>>'{nutrition,fibre_g}')::numeric,(row#>>'{nutrition,sugar_g}')::numeric,(row#>>'{nutrition,sodium_mg}')::numeric,coalesce(row#>'{nutrition,micronutrients}','[]'::jsonb),row#>>'{nutrition,source_ref}');
 end loop;
 insert into public.post_comments(post_id,author,body) values(p_post_id,'model',p_reply);
 update public.jobs set payload=payload||'{"correction_applied":true}'::jsonb where id=p_job_id;
 select id into latest from public.post_comments where post_id=p_post_id and author='user' order by created_at desc,id desc limit 1;
 if latest<>p_through then
  insert into public.jobs(post_id,kind,priority,status) select p_post_id,'correct',100,'queued'
   where not exists(select 1 from public.jobs where post_id=p_post_id and kind='correct' and status='queued');
 end if;
 return true;
end;
$$;
revoke all on function public.persist_correction(uuid,uuid,uuid[],uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.persist_correction(uuid,uuid,uuid[],uuid,jsonb,text) to service_role;
