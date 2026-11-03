-- Durable browser food-post retry requires a server receipt for a committed
-- response lost in transit. Only the existing server-resolved route may write.
create table public.food_post_operations (
 operation_id uuid primary key,
 user_id uuid not null references public.profiles(id) on delete cascade,
 request_key text not null check(length(request_key)=64),
 cancelled boolean not null default false,
 post_id uuid references public.posts(id) on delete set null,
 created_at timestamptz not null default now()
);
alter table public.food_post_operations enable row level security;
revoke all on public.food_post_operations from public,anon,authenticated;
grant all on public.food_post_operations to service_role;
create function public.publish_food_operation(p_operation_id uuid,p_user_id uuid,p_request_key text,p_eaten_at timestamptz,p_name text,p_grams numeric,p_nutrition jsonb,p_photo jsonb default null,p_barcode_correction jsonb default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare receipt public.food_post_operations;result uuid;
begin
 if p_operation_id is null or p_user_id is null or p_request_key is null or length(p_request_key)<>64 then raise exception 'Invalid food operation' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('food-operation:'||p_operation_id::text,0));
 select * into receipt from public.food_post_operations where operation_id=p_operation_id for update;
 if found then
  if receipt.user_id<>p_user_id then raise exception 'Food operation not found' using errcode='42501';end if;
  if receipt.cancelled then raise exception 'This pending food post was removed' using errcode='PT410';end if;
  if receipt.request_key<>p_request_key then raise exception 'Food selection changed' using errcode='PT409';end if;
  if receipt.post_id is null or not exists(select 1 from public.posts where id=receipt.post_id and user_id=p_user_id and deleted_at is null) then raise exception 'This food post was removed' using errcode='PT410';end if;
  return receipt.post_id;
 end if;
 result:=public.create_food_post(p_user_id,p_eaten_at,p_name,p_grams,p_nutrition,p_photo);
 if p_barcode_correction is not null then
  if jsonb_typeof(p_barcode_correction)<>'object' or coalesce(p_barcode_correction->>'gtin','')!~'^[0-9]{14}$' or p_barcode_correction->>'gtin' is distinct from p_nutrition->>'gtin' or jsonb_typeof(p_barcode_correction->'per_100')<>'object' then raise exception 'Invalid verified label correction' using errcode='22023';end if;
  insert into public.barcode_corrections(gtin,user_id,name,source,serving_amount,serving_unit,per_100,updated_at)
  values(p_barcode_correction->>'gtin',p_user_id,p_name,'label',(p_barcode_correction->>'serving_amount')::numeric,p_barcode_correction->>'serving_unit',p_barcode_correction->'per_100',now())
  on conflict(gtin,user_id) do update set name=excluded.name,source=excluded.source,serving_amount=excluded.serving_amount,serving_unit=excluded.serving_unit,per_100=excluded.per_100,updated_at=excluded.updated_at;
 end if;
 insert into public.food_post_operations(operation_id,user_id,request_key,post_id)values(p_operation_id,p_user_id,p_request_key,result);
 return result;
end $$;
revoke all on function public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,jsonb,jsonb) to service_role;
create function public.cancel_food_operation(p_operation_id uuid,p_user_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare receipt public.food_post_operations;
begin
 if p_operation_id is null or p_user_id is null then raise exception 'Invalid food operation' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('food-operation:'||p_operation_id::text,0));
 select * into receipt from public.food_post_operations where operation_id=p_operation_id for update;
 if found then
  if receipt.user_id<>p_user_id then raise exception 'Food operation not found' using errcode='42501';end if;
  if receipt.post_id is not null then update public.posts set deleted_at=coalesce(deleted_at,now()) where id=receipt.post_id and user_id=p_user_id;end if;
  update public.food_post_operations set cancelled=true where operation_id=p_operation_id;
  return receipt.post_id;
 end if;
 insert into public.food_post_operations(operation_id,user_id,request_key,cancelled)values(p_operation_id,p_user_id,repeat('0',64),true);
 return null;
end $$;
revoke all on function public.cancel_food_operation(uuid,uuid) from public,anon,authenticated;
grant execute on function public.cancel_food_operation(uuid,uuid) to service_role;
notify pgrst,'reload schema';
