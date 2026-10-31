-- Reserve upload capabilities before creating a visible post or analyzable job.
create table public.post_upload_drafts (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption text not null,
  eaten_at timestamptz,
  shots jsonb not null,
  location jsonb,
  cleanup_job_id uuid,
  published boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  check ((not published and eaten_at is not null) or (published and caption='' and location is null and shots='[]'::jsonb and eaten_at is null and cleanup_job_id is null))
);
alter table public.post_upload_drafts enable row level security;
revoke all on public.post_upload_drafts from anon,authenticated;
grant all on public.post_upload_drafts to service_role;

create function public.reserve_post_upload(
  p_operation_id uuid, p_user_id uuid, p_caption text, p_eaten_at timestamptz, p_shots jsonb, p_location jsonb default null
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.post_upload_drafts; s jsonb; n integer; cleanup_id uuid;
begin
  if p_operation_id is null or p_user_id is null or p_caption is null or length(p_caption)>2000
     or p_eaten_at is null or p_eaten_at>clock_timestamp()+interval '5 minutes'
     or jsonb_typeof(p_shots) is distinct from 'array' then
    raise exception 'Invalid post draft' using errcode='22023';
  end if;
  n:=jsonb_array_length(p_shots);
  if n>8 or (n=0 and length(btrim(p_caption))=0) then raise exception 'A caption or photo is required' using errcode='22023'; end if;
  for i in 0..n-1 loop
    s:=p_shots->i;
    if (s->>'position')::integer is distinct from i or coalesce((s->>'width')::integer,0) not between 1 and 4096
       or coalesce((s->>'height')::integer,0) not between 1 and 4096 then raise exception 'Invalid photo metadata' using errcode='22023'; end if;
    perform (s->>'phash')::bigint;
  end loop;
  perform pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
  select * into d from public.post_upload_drafts where id=p_operation_id for update;
  if found then
    if d.user_id<>p_user_id then raise exception 'Draft not found' using errcode='42501'; end if;
    if d.published then
      if not exists(select 1 from public.posts where id=d.id and user_id=p_user_id) then raise exception 'Post was removed' using errcode='22023'; end if;
      return jsonb_build_object('id',d.id,'published',true);
    end if;
    if d.shots<>p_shots then raise exception 'Selected photos changed; start a new draft' using errcode='22023'; end if;
    -- New two-hour signed capabilities must expire before the original three-hour cleanup.
    if d.created_at+interval '1 hour'<=clock_timestamp() then raise exception 'Upload draft expired; select the photos again' using errcode='22023'; end if;
    update public.post_upload_drafts set caption=p_caption,eaten_at=p_eaten_at,location=p_location where id=d.id;
    return jsonb_build_object('id',d.id,'published',false);
  end if;
  if exists(select 1 from public.posts where id=p_operation_id) then raise exception 'Draft identifier is unavailable' using errcode='22023'; end if;
  if n>0 then
    cleanup_id:=gen_random_uuid();
    insert into public.jobs(id,post_id,kind,priority,status,run_after,payload)
    values(cleanup_id,null,'media_cleanup',200,'queued',clock_timestamp()+interval '3 hours',
      jsonb_build_object('owner_id',p_user_id,'deleted_post_id',p_operation_id,'paths',jsonb_build_array(p_user_id::text||'/'||p_operation_id::text||'/0.jpg',p_user_id::text||'/'||p_operation_id::text||'/0.feed.jpg')));
  end if;
  insert into public.post_upload_drafts(id,user_id,caption,eaten_at,shots,location,cleanup_job_id)
    values(p_operation_id,p_user_id,p_caption,p_eaten_at,p_shots,p_location,cleanup_id);
  return jsonb_build_object('id',p_operation_id,'published',false);
end $$;

create function public.publish_uploaded_post(p_operation_id uuid,p_user_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.post_upload_drafts; s jsonb; path text; cleanup_status text; cleanup_due timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
  select * into d from public.post_upload_drafts where id=p_operation_id and user_id=p_user_id for update;
  if not found then raise exception 'Draft not found' using errcode='42501'; end if;
  if d.published then
    if not exists(select 1 from public.posts where id=d.id and user_id=p_user_id) then raise exception 'Post was removed' using errcode='22023'; end if;
    return d.id;
  end if;
  if d.cleanup_job_id is not null then
    select status,run_after into cleanup_status,cleanup_due from public.jobs where id=d.cleanup_job_id for update;
    if not found or cleanup_status<>'queued' or cleanup_due<=clock_timestamp() then raise exception 'Upload draft expired; select the photos again' using errcode='22023'; end if;
  end if;
  for s in select value from jsonb_array_elements(d.shots) loop
    path:=p_user_id::text||'/'||d.id::text||'/'||(s->>'position')||'.jpg';
    if not exists(select 1 from storage.objects where bucket_id='media' and name=path and coalesce((metadata->>'size')::bigint,0)>0)
       or not exists(select 1 from storage.objects where bucket_id='media' and name=regexp_replace(path,'[.]jpg$','.feed.jpg') and coalesce((metadata->>'size')::bigint,0)>0) then
      raise exception 'Photo upload is incomplete; retry the upload' using errcode='22023';
    end if;
  end loop;
  insert into public.posts(id,user_id,caption,eaten_at,status) values(d.id,d.user_id,d.caption,d.eaten_at,'queued');
  if d.location is not null then
    insert into public.post_locations(post_id,lat,lng,accuracy_m) values(d.id,(d.location->>'lat')::double precision,(d.location->>'lng')::double precision,(d.location->>'accuracy_m')::double precision);
  end if;
  for s in select value from jsonb_array_elements(d.shots) loop
    insert into public.post_media(post_id,storage_path,position,width,height,phash)
    values(d.id,p_user_id::text||'/'||d.id::text||'/'||(s->>'position')||'.jpg',(s->>'position')::integer,(s->>'width')::integer,(s->>'height')::integer,(s->>'phash')::bigint);
  end loop;
  insert into public.jobs(id,post_id,kind,priority,status) values(d.id,d.id,'analyze',100,'queued');
  -- Keep only the ownership/idempotency tombstone, never a second meal payload.
  update public.post_upload_drafts set published=true,caption='',location=null,shots='[]'::jsonb,eaten_at=null,cleanup_job_id=null where id=d.id;
  return d.id;
end $$;
revoke all on function public.reserve_post_upload(uuid,uuid,text,timestamptz,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.publish_uploaded_post(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reserve_post_upload(uuid,uuid,text,timestamptz,jsonb,jsonb) to service_role;
grant execute on function public.publish_uploaded_post(uuid,uuid) to service_role;
