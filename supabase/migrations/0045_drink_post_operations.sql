-- One receipt per explicit drink intent. Repeated delivery is not another tap.
create table public.drink_post_operations (
 operation_id uuid primary key,
 user_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null check(kind in ('tile','photo')),
 request_key text not null check(length(request_key)=64),
 upload_id uuid unique references public.post_upload_drafts(id) on delete set null,
 post_id uuid references public.posts(id) on delete set null,
 cancelled boolean not null default false,
 created_at timestamptz not null default now(),
 check(kind='photo' or upload_id is null)
);
alter table public.drink_post_operations enable row level security;
revoke all on public.drink_post_operations from public,anon,authenticated;
grant all on public.drink_post_operations to service_role;
create function public.publish_drink_operation(p_operation_id uuid,p_user_id uuid,p_request_key text,p_eaten_at timestamptz,p_kind text,p_ml integer,p_label text,p_caffeine_mg integer,p_nutrition jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare receipt public.drink_post_operations;result uuid;
begin
 if p_operation_id is null or p_user_id is null or p_request_key is null or length(p_request_key)<>64 then raise exception 'Invalid drink operation' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('drink-operation:'||p_operation_id::text,0));
 select * into receipt from public.drink_post_operations where operation_id=p_operation_id for update;
 if found then
  if receipt.user_id<>p_user_id then raise exception 'Drink operation not found' using errcode='42501';end if;
  if receipt.kind<>'tile' then raise exception 'Drink intent changed' using errcode='PT409';end if;
  if receipt.cancelled then raise exception 'Pending drink removed' using errcode='PT410';end if;
  if receipt.request_key<>p_request_key then raise exception 'Drink selection changed' using errcode='PT409';end if;
  if receipt.post_id is null or not exists(select 1 from public.posts where id=receipt.post_id and user_id=p_user_id and deleted_at is null) then raise exception 'Drink post removed' using errcode='PT410';end if;
  return receipt.post_id;
 end if;
 result:=public.create_drink_post(p_user_id,p_eaten_at,p_kind,p_ml,p_label,p_caffeine_mg,p_nutrition);
 insert into public.drink_post_operations(operation_id,user_id,kind,request_key,post_id)values(p_operation_id,p_user_id,'tile',p_request_key,result);
 return result;
end $$;
create function public.publish_photo_drink_operation(p_operation_id uuid,p_user_id uuid,p_request_key text,p_upload_id uuid,p_readings jsonb,p_caption text,p_eaten_at timestamptz,p_location jsonb,p_save_as_meal boolean,p_items jsonb,p_summary text,p_expected jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare receipt public.drink_post_operations;draft public.post_upload_drafts;result uuid;
begin
 if p_operation_id is null or p_upload_id is null or p_user_id is null or p_request_key is null or length(p_request_key)<>64 then raise exception 'Invalid photo drink operation' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('drink-operation:'||p_operation_id::text,0));
 perform pg_advisory_xact_lock(hashtextextended(p_upload_id::text,0));
 select * into receipt from public.drink_post_operations where operation_id=p_operation_id for update;
 if found then
  if receipt.user_id<>p_user_id then raise exception 'Drink operation not found' using errcode='42501';end if;
  if receipt.kind<>'photo' then raise exception 'Drink intent changed' using errcode='PT409';end if;
  if receipt.cancelled then raise exception 'Pending drink removed' using errcode='PT410';end if;
  if receipt.request_key<>p_request_key then raise exception 'Drink selection changed' using errcode='PT409';end if;
  if receipt.post_id is null or not exists(select 1 from public.posts where id=receipt.post_id and user_id=p_user_id and deleted_at is null) then raise exception 'Drink post removed' using errcode='PT410';end if;
  return receipt.post_id;
 end if;
 select * into draft from public.post_upload_drafts where id=p_upload_id and user_id=p_user_id for update;
 if not found then raise exception 'Photo draft not found' using errcode='42501';end if;
 select * into receipt from public.drink_post_operations where upload_id=p_upload_id for update;
 if found then
  if receipt.cancelled then raise exception 'Pending drink removed' using errcode='PT410';end if;
  raise exception 'Photo already belongs to another drink intent' using errcode='PT409';
 end if;
 if draft.published or exists(select 1 from public.posts where id=p_upload_id) then raise exception 'Photo already posted' using errcode='PT409';end if;
 result:=public.publish_composer_drinks(p_upload_id,p_user_id,p_readings,p_caption,p_eaten_at,p_location,p_save_as_meal,p_items,p_summary,p_expected);
 insert into public.drink_post_operations(operation_id,user_id,kind,request_key,upload_id,post_id)values(p_operation_id,p_user_id,'photo',p_request_key,p_upload_id,result);
 return result;
end $$;
create function public.cancel_drink_operation(p_operation_id uuid,p_user_id uuid,p_upload_id uuid default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare receipt public.drink_post_operations;other_receipt public.drink_post_operations;claim_upload uuid;operation_kind text:=case when p_upload_id is null then 'tile' else 'photo' end;
begin
 if p_operation_id is null or p_user_id is null then raise exception 'Invalid drink operation' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('drink-operation:'||p_operation_id::text,0));
 if p_upload_id is not null then perform pg_advisory_xact_lock(hashtextextended(p_upload_id::text,0));end if;
 select * into receipt from public.drink_post_operations where operation_id=p_operation_id for update;
 if found then
  if receipt.user_id<>p_user_id then raise exception 'Drink operation not found' using errcode='42501';end if;
  if receipt.kind<>operation_kind then raise exception 'Drink intent changed' using errcode='PT409';end if;
  if receipt.post_id is not null then update public.posts set deleted_at=coalesce(deleted_at,now()) where id=receipt.post_id and user_id=p_user_id;end if;
  update public.drink_post_operations set cancelled=true where operation_id=p_operation_id;
  return receipt.post_id;
 end if;
 if p_upload_id is not null then
  if not exists(select 1 from public.post_upload_drafts where id=p_upload_id and user_id=p_user_id)
     and not exists(select 1 from public.posts where id=p_upload_id and user_id=p_user_id) then raise exception 'Photo draft not found' using errcode='42501';end if;
  select * into other_receipt from public.drink_post_operations where upload_id=p_upload_id for update;
  -- A failed second intent must not delete the first intent's committed post.
  if not found and not exists(select 1 from public.posts where id=p_upload_id) then claim_upload:=p_upload_id;end if;
 end if;
 insert into public.drink_post_operations(operation_id,user_id,kind,request_key,upload_id,cancelled)values(p_operation_id,p_user_id,operation_kind,repeat('0',64),claim_upload,true);
 return null;
end $$;
revoke all on function public.publish_drink_operation(uuid,uuid,text,timestamptz,text,integer,text,integer,jsonb),public.publish_photo_drink_operation(uuid,uuid,text,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,text,jsonb),public.cancel_drink_operation(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.publish_drink_operation(uuid,uuid,text,timestamptz,text,integer,text,integer,jsonb),public.publish_photo_drink_operation(uuid,uuid,text,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,text,jsonb),public.cancel_drink_operation(uuid,uuid,uuid) to service_role;
notify pgrst,'reload schema';
