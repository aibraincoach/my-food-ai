-- #1368 C-atomic: add before switching app callers. Old signatures stay.
-- Production apply requires RT written yes and PM exact order. No backfill/drop here.
begin;
do $$ begin
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('publish_photo_drink_operation','publish_composer_drinks')
  and p.proargnames @> array['p_message']::text[]) then
  raise exception '0082 must precede 0084; use the reviewed both-parameter composition' using errcode='22023';
 end if;
end $$;
create function public.require_capture_zone(p_render_zone text) returns void
language plpgsql stable set search_path=public,pg_temp as $$
begin
 -- Named-zone boundary agrees with the app; pg_timezone_names is authoritative
 -- for this database's actual tzdata. No offset, abbreviation or silent UTC substitute.
 if p_render_zone is null or (p_render_zone<>'UTC' and position('/' in p_render_zone)=0)
  or not exists(select 1 from pg_timezone_names where name=p_render_zone) then
  raise exception 'A valid capture time zone is required' using errcode='PT400';
 end if;
end $$;
revoke all on function public.require_capture_zone(text) from public,anon,authenticated,service_role;

create function public.publish_food_operation(p_operation_id uuid,p_user_id uuid,p_request_key text,p_eaten_at timestamptz,p_name text,p_grams numeric,p_nutrition jsonb,p_render_zone text,p_photo jsonb default null,p_barcode_correction jsonb default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare receipt public.food_post_operations;result uuid;
begin
 perform public.require_capture_zone(p_render_zone);
 if p_operation_id is null or p_user_id is null or p_request_key is null or length(p_request_key)<>64 then raise exception 'Invalid food operation' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('food-operation:'||p_operation_id::text,0));
 select * into receipt from public.food_post_operations where operation_id=p_operation_id for update;
 if found then
  if receipt.user_id<>p_user_id then raise exception 'Food operation not found' using errcode='42501';end if;
  if receipt.cancelled then raise exception 'This pending food post was removed' using errcode='PT410';end if;
  if receipt.request_key<>p_request_key then raise exception 'Food selection changed' using errcode='PT409';end if;
  if receipt.post_id is null or not exists(select 1 from public.posts where id=receipt.post_id and user_id=p_user_id and deleted_at is null) then raise exception 'This food post was removed' using errcode='PT410';end if;
  if (select render_time_zone from public.posts where id=receipt.post_id) is distinct from p_render_zone then
   raise exception 'The capture time zone changed' using errcode='PT409';
  end if;
  return receipt.post_id;
 end if;
 result:=public.create_food_post(p_user_id,p_eaten_at,p_name,p_grams,p_nutrition,p_photo);
 update public.posts set render_time_zone=p_render_zone where id=result;
 if p_barcode_correction is not null then
  if jsonb_typeof(p_barcode_correction)<>'object' or coalesce(p_barcode_correction->>'gtin','')!~'^[0-9]{14}$' or p_barcode_correction->>'gtin' is distinct from p_nutrition->>'gtin' or jsonb_typeof(p_barcode_correction->'per_100')<>'object' then raise exception 'Invalid verified label correction' using errcode='22023';end if;
  insert into public.barcode_corrections(gtin,user_id,name,source,serving_amount,serving_unit,per_100,updated_at)
  values(p_barcode_correction->>'gtin',p_user_id,p_name,'label',(p_barcode_correction->>'serving_amount')::numeric,p_barcode_correction->>'serving_unit',p_barcode_correction->'per_100',now())
  on conflict(gtin,user_id) do update set name=excluded.name,source=excluded.source,serving_amount=excluded.serving_amount,serving_unit=excluded.serving_unit,per_100=excluded.per_100,updated_at=excluded.updated_at;
 end if;
 insert into public.food_post_operations(operation_id,user_id,request_key,post_id)values(p_operation_id,p_user_id,p_request_key,result);
 return result;
end $$;
revoke all on function public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,text,jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,text,jsonb,jsonb) to service_role;

create function public.publish_drink_operation(p_operation_id uuid,p_user_id uuid,p_request_key text,p_eaten_at timestamptz,p_kind text,p_ml integer,p_label text,p_caffeine_mg integer,p_nutrition jsonb,p_render_zone text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare receipt public.drink_post_operations;result uuid;
begin
 perform public.require_capture_zone(p_render_zone);
 if p_operation_id is null or p_user_id is null or p_request_key is null or length(p_request_key)<>64 then raise exception 'Invalid drink operation' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('drink-operation:'||p_operation_id::text,0));
 select * into receipt from public.drink_post_operations where operation_id=p_operation_id for update;
 if found then
  if receipt.user_id<>p_user_id then raise exception 'Drink operation not found' using errcode='42501';end if;
  if receipt.kind<>'tile' then raise exception 'Drink intent changed' using errcode='PT409';end if;
  if receipt.cancelled then raise exception 'Pending drink removed' using errcode='PT410';end if;
  if receipt.request_key<>p_request_key then raise exception 'Drink selection changed' using errcode='PT409';end if;
  if receipt.post_id is null or not exists(select 1 from public.posts where id=receipt.post_id and user_id=p_user_id and deleted_at is null) then raise exception 'Drink post removed' using errcode='PT410';end if;
  if (select render_time_zone from public.posts where id=receipt.post_id) is distinct from p_render_zone then
   raise exception 'The capture time zone changed' using errcode='PT409';
  end if;
  return receipt.post_id;
 end if;
 result:=public.create_drink_post(p_user_id,p_eaten_at,p_kind,p_ml,p_label,p_caffeine_mg,p_nutrition);
 update public.posts set render_time_zone=p_render_zone where id=result;
 insert into public.drink_post_operations(operation_id,user_id,kind,request_key,post_id)values(p_operation_id,p_user_id,'tile',p_request_key,result);
 return result;
end $$;
revoke all on function public.publish_drink_operation(uuid,uuid,text,timestamptz,text,integer,text,integer,jsonb,text) from public,anon,authenticated,service_role;
grant execute on function public.publish_drink_operation(uuid,uuid,text,timestamptz,text,integer,text,integer,jsonb,text) to service_role;

create function public.publish_photo_drink_operation(p_operation_id uuid,p_user_id uuid,p_request_key text,p_upload_id uuid,p_readings jsonb,p_caption text,p_eaten_at timestamptz,p_location jsonb,p_save_as_meal boolean,p_items jsonb,p_summary text,p_expected jsonb,p_render_zone text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare receipt public.drink_post_operations;draft public.post_upload_drafts;result uuid;
begin
 perform public.require_capture_zone(p_render_zone);
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
  if (select render_time_zone from public.posts where id=receipt.post_id) is distinct from p_render_zone then
   raise exception 'The capture time zone changed' using errcode='PT409';
  end if;
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
 update public.posts set render_time_zone=p_render_zone where id=result;
 insert into public.drink_post_operations(operation_id,user_id,kind,request_key,upload_id,post_id)values(p_operation_id,p_user_id,'photo',p_request_key,p_upload_id,result);
 return result;
end $$;
revoke all on function public.publish_photo_drink_operation(uuid,uuid,text,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,text,jsonb,text) from public,anon,authenticated,service_role;
grant execute on function public.publish_photo_drink_operation(uuid,uuid,text,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,text,jsonb,text) to service_role;

create function public.publish_copy_operation(p_operation_id uuid,p_source_id uuid,p_saved boolean,p_eaten_at timestamptz,p_render_zone text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare receipt public.copy_post_operations; owner_id uuid:=auth.uid(); result uuid; original_id uuid; logged_before jsonb; logged_changes jsonb;
begin
 perform public.require_capture_zone(p_render_zone);
 if owner_id is null then raise exception 'Authentication required' using errcode='42501';end if;
 if p_operation_id is null or p_source_id is null or p_saved is null or p_eaten_at is null or p_eaten_at>now()+interval '5 minutes' then raise exception 'Invalid copy operation' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('copy-operation:'||p_operation_id::text,0));
 select * into receipt from public.copy_post_operations where operation_id=p_operation_id for update;
 if found then
  if receipt.user_id<>owner_id then raise exception 'Copy operation not found' using errcode='42501';end if;
  if receipt.source_id<>p_source_id or receipt.saved<>p_saved or receipt.eaten_at<>p_eaten_at then raise exception 'Copy selection changed' using errcode='PT409';end if;
  if receipt.cancelled then raise exception 'This pending copy was removed' using errcode='PT410';end if;
  if receipt.post_id is null or not exists(select 1 from public.posts where id=receipt.post_id and user_id=owner_id and deleted_at is null) then raise exception 'This copied post was removed' using errcode='PT410';end if;
  if (select render_time_zone from public.posts where id=receipt.post_id) is distinct from p_render_zone then
   raise exception 'The capture time zone changed' using errcode='PT409';
  end if;
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
 update public.posts set render_time_zone=p_render_zone where id=result;
 select coalesce(jsonb_agg(entry.value||jsonb_build_object('after',saved.last_logged_at)),'[]'::jsonb) into logged_changes
 from jsonb_array_elements(logged_before) entry join public.saved_meals saved on saved.id=(entry.value->>'id')::uuid and saved.user_id=owner_id;
 insert into public.copy_post_operations(operation_id,user_id,source_id,saved,eaten_at,post_id,last_logged)
 values(p_operation_id,owner_id,p_source_id,p_saved,p_eaten_at,result,logged_changes);
 return result;
end $$;
revoke all on function public.publish_copy_operation(uuid,uuid,boolean,timestamptz,text) from public,anon,authenticated,service_role;
grant execute on function public.publish_copy_operation(uuid,uuid,boolean,timestamptz,text) to authenticated;

create function public.agent_log_meal(p_user_id uuid,p_token_id uuid,p_caption text,p_eaten_at timestamptz,p_render_zone text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_post uuid:=gen_random_uuid();
begin
 perform public.require_capture_zone(p_render_zone);
 perform 1 from public.agent_tokens where id=p_token_id and user_id=p_user_id and revoked_at is null for share;
 if not found then raise exception 'Token required' using errcode='42501';end if;
 if p_caption is null or length(btrim(p_caption))=0 or length(p_caption)>2000 or p_eaten_at is null or p_eaten_at>now() then
  raise exception 'Invalid meal' using errcode='22023';end if;
 perform public.reserve_post_upload_with_leftovers(v_post,p_user_id,p_caption,p_eaten_at,'[]'::jsonb,null,'{}'::integer[],false,p_render_zone);
 perform public.publish_uploaded_post(v_post,p_user_id);
 update public.posts set agent_token_id=p_token_id where id=v_post and user_id=p_user_id;
 insert into public.agent_activity(token_id,user_id,action,post_id) values(p_token_id,p_user_id,'posted',v_post);
 return v_post;
end $$;
revoke all on function public.agent_log_meal(uuid,uuid,text,timestamptz,text) from public,anon,authenticated,service_role;
grant execute on function public.agent_log_meal(uuid,uuid,text,timestamptz,text) to service_role;

notify pgrst,'reload schema';
commit;
