-- A durable browser copy may retry after its committed HTTP response is lost.
-- The receipt and copy commit together; cancellation uses the same lock and
-- leaves a tombstone, including when it arrives before publication.
create table public.copy_post_operations (
 operation_id uuid primary key,
 user_id uuid not null references public.profiles(id) on delete cascade,
 source_id uuid not null,
 saved boolean not null,
 eaten_at timestamptz not null,
 cancelled boolean not null default false,
 post_id uuid references public.posts(id) on delete set null,
 last_logged jsonb not null default '[]'::jsonb check(jsonb_typeof(last_logged)='array'),
 created_at timestamptz not null default now()
);
alter table public.copy_post_operations enable row level security;
revoke all on public.copy_post_operations from public,anon,authenticated;
grant all on public.copy_post_operations to service_role;

create function public.publish_copy_operation(p_operation_id uuid,p_source_id uuid,p_saved boolean,p_eaten_at timestamptz)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare receipt public.copy_post_operations; owner_id uuid:=auth.uid(); result uuid; original_id uuid; logged_before jsonb; logged_changes jsonb;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='42501';end if;
 if p_operation_id is null or p_source_id is null or p_saved is null or p_eaten_at is null or p_eaten_at>now()+interval '5 minutes' then raise exception 'Invalid copy operation' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('copy-operation:'||p_operation_id::text,0));
 select * into receipt from public.copy_post_operations where operation_id=p_operation_id for update;
 if found then
  if receipt.user_id<>owner_id then raise exception 'Copy operation not found' using errcode='42501';end if;
  if receipt.source_id<>p_source_id or receipt.saved<>p_saved or receipt.eaten_at<>p_eaten_at then raise exception 'Copy selection changed' using errcode='PT409';end if;
  if receipt.cancelled then raise exception 'This pending copy was removed' using errcode='PT410';end if;
  if receipt.post_id is null or not exists(select 1 from public.posts where id=receipt.post_id and user_id=owner_id and deleted_at is null) then raise exception 'This copied post was removed' using errcode='PT410';end if;
  return receipt.post_id;
 end if;
 -- Use the original-post-before-saved-row lock order for both entry points.
 -- A saved snapshot remains usable when its original post has disappeared.
 if p_saved then
  select source_post_id into original_id from public.saved_meals where id=p_source_id and user_id=owner_id;
  if not found then raise exception 'Saved meal not found' using errcode='42501';end if;
  if original_id is not null then perform id from public.posts where id=original_id and user_id=owner_id for update;end if;
  perform id from public.saved_meals where id=p_source_id and user_id=owner_id for update;
  if not found then raise exception 'Saved meal not found' using errcode='42501';end if;
 else
  perform id from public.posts where id=p_source_id and user_id=owner_id and status='ready' and deleted_at is null for update;
  if not found then raise exception 'Meal not found' using errcode='42501';end if;
 end if;
 perform id from public.saved_meals where user_id=owner_id and ((p_saved and id=p_source_id) or (not p_saved and source_post_id=p_source_id)) order by id for update;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'before',last_logged_at)),'[]'::jsonb) into logged_before
 from public.saved_meals where user_id=owner_id and ((p_saved and id=p_source_id) or (not p_saved and source_post_id=p_source_id));
 result:=case when p_saved then public.copy_owned_saved_meal(p_source_id,p_eaten_at) else public.copy_owned_post(p_source_id,p_eaten_at) end;
 select coalesce(jsonb_agg(entry.value||jsonb_build_object('after',saved.last_logged_at)),'[]'::jsonb) into logged_changes
 from jsonb_array_elements(logged_before) entry join public.saved_meals saved on saved.id=(entry.value->>'id')::uuid and saved.user_id=owner_id;
 insert into public.copy_post_operations(operation_id,user_id,source_id,saved,eaten_at,post_id,last_logged)
 values(p_operation_id,owner_id,p_source_id,p_saved,p_eaten_at,result,logged_changes);
 return result;
end $$;

create function public.cancel_copy_operation(p_operation_id uuid,p_source_id uuid,p_saved boolean,p_eaten_at timestamptz)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare receipt public.copy_post_operations; owner_id uuid:=auth.uid(); change jsonb;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='42501';end if;
 if p_operation_id is null or p_source_id is null or p_saved is null or p_eaten_at is null then raise exception 'Invalid copy operation' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('copy-operation:'||p_operation_id::text,0));
 select * into receipt from public.copy_post_operations where operation_id=p_operation_id for update;
 if found then
  if receipt.user_id<>owner_id then raise exception 'Copy operation not found' using errcode='42501';end if;
  if receipt.source_id<>p_source_id or receipt.saved<>p_saved or receipt.eaten_at<>p_eaten_at then raise exception 'Copy selection changed' using errcode='PT409';end if;
  if not receipt.cancelled then
   if receipt.post_id is not null then update public.posts set deleted_at=coalesce(deleted_at,now()) where id=receipt.post_id and user_id=owner_id;end if;
   -- Restore bookkeeping only if a later successful log has not replaced it.
   for change in select value from jsonb_array_elements(receipt.last_logged) loop
    update public.saved_meals set last_logged_at=(change->>'before')::timestamptz
    where id=(change->>'id')::uuid and user_id=owner_id and last_logged_at is not distinct from (change->>'after')::timestamptz;
   end loop;
   update public.copy_post_operations set cancelled=true where operation_id=p_operation_id;
  end if;
  return receipt.post_id;
 end if;
 insert into public.copy_post_operations(operation_id,user_id,source_id,saved,eaten_at,cancelled)
 values(p_operation_id,owner_id,p_source_id,p_saved,p_eaten_at,true);
 return null;
end $$;
revoke all on function public.publish_copy_operation(uuid,uuid,boolean,timestamptz),public.cancel_copy_operation(uuid,uuid,boolean,timestamptz) from public,anon;
grant execute on function public.publish_copy_operation(uuid,uuid,boolean,timestamptz),public.cancel_copy_operation(uuid,uuid,boolean,timestamptz) to authenticated;
notify pgrst,'reload schema';
