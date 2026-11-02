-- Multiple leftovers photos are independent deductions from the available meal.
-- Carry immutable earlier deductions through every subsequent item revision.
drop index public.post_media_one_not_eaten;
alter table public.post_items add column not_eaten_calories numeric check(not_eaten_calories is null or not_eaten_calories>=0);
-- Existing single-photo revisions obtain their recorded calories once, before
-- future revisions make the immediate ancestor a consumed rather than gross row.
update public.post_items i set not_eaten_calories=case when i.not_eaten_grams=0 then 0
 when p.portion_grams>0 and n.calories is not null then n.calories*i.not_eaten_grams/p.portion_grams else null end
from public.post_items p join public.item_nutrition n on n.post_item_id=p.id
where i.supersedes=p.id and i.not_eaten_grams is not null;
create or replace view public.current_post_items with (security_invoker=true) as select * from public.post_items where superseded_at is null;
grant select on public.current_post_items to authenticated,service_role;

create function public.carry_item_leftovers() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare prior public.post_items;
begin
 if new.supersedes is not null then
  select * into prior from public.post_items where id=new.supersedes and post_id=new.post_id;
  if found and prior.not_eaten_grams is not null and new.not_eaten_grams is null then
   new.not_eaten_grams:=prior.not_eaten_grams;
   new.not_eaten_calories:=prior.not_eaten_calories;
   new.not_eaten_count_text:=prior.not_eaten_count_text;
   new.count_text:=case when new.portion_grams is not distinct from prior.portion_grams then prior.count_text else null end;
  end if;
 end if;
 return new;
end $$;
create trigger carry_item_leftovers before insert on public.post_items for each row execute function public.carry_item_leftovers();

alter table public.post_upload_drafts add column not_eaten_positions integer[] not null default '{}';
create function public.reserve_post_upload_with_leftovers(p_operation_id uuid,p_user_id uuid,p_caption text,p_eaten_at timestamptz,p_shots jsonb,p_location jsonb,p_not_eaten_positions integer[],p_save_as_meal boolean,p_render_zone text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if p_not_eaten_positions is null or cardinality(p_not_eaten_positions)>7 or cardinality(p_not_eaten_positions)<>(select count(distinct value) from unnest(p_not_eaten_positions) value) or exists(select 1 from unnest(p_not_eaten_positions) value where value is null or value<1 or value>=jsonb_array_length(p_shots)) then raise exception 'Only later photos can record leftovers' using errcode='22023';end if;
 result:=public.reserve_post_upload_with_options(p_operation_id,p_user_id,p_caption,p_eaten_at,p_shots,p_location,null,p_save_as_meal,p_render_zone);
 if not coalesce((result->>'published')::boolean,false) then update public.post_upload_drafts set not_eaten_positions=p_not_eaten_positions where id=p_operation_id and user_id=p_user_id and not published;end if;
 return result;
end $$;
revoke all on function public.reserve_post_upload_with_leftovers(uuid,uuid,text,timestamptz,jsonb,jsonb,integer[],boolean,text) from public,anon,authenticated;
grant execute on function public.reserve_post_upload_with_leftovers(uuid,uuid,text,timestamptz,jsonb,jsonb,integer[],boolean,text) to service_role;
alter function public.publish_uploaded_post(uuid,uuid) rename to publish_uploaded_post_before_multiple_leftovers;
create function public.publish_uploaded_post(p_operation_id uuid,p_user_id uuid) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.post_upload_drafts; result uuid; photo_position integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 select * into d from public.post_upload_drafts where id=p_operation_id and user_id=p_user_id for update;
 if not found then raise exception 'Draft not found' using errcode='42501';end if;
 result:=public.publish_uploaded_post_before_multiple_leftovers(p_operation_id,p_user_id);
 if not d.published then
  foreach photo_position in array d.not_eaten_positions loop
   update public.post_media set not_eaten=true where post_id=result and post_media.position=photo_position and kind='photo';
   if not found then raise exception 'Leftovers photo was not uploaded' using errcode='22023';end if;
  end loop;
 end if;
 update public.post_upload_drafts set not_eaten_positions='{}' where id=result;
 return result;
end $$;
revoke all on function public.publish_uploaded_post(uuid,uuid),public.publish_uploaded_post_before_multiple_leftovers(uuid,uuid) from public,anon,authenticated;
grant execute on function public.publish_uploaded_post(uuid,uuid) to service_role;

create or replace function public.queue_post_remainder(p_post_id uuid,p_job_id uuid) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare inserted integer;
begin
 perform 1 from public.posts where id=p_post_id and analysis_initialized_at is not null and status='ready' for update;
 if not found or not public.post_work_matches(p_post_id,p_job_id) then return false;end if;
 insert into public.jobs(post_id,kind,priority,status,payload)
 select p_post_id,'remainder',100,'queued',jsonb_build_object('remainder_photo_id',id)
 from public.post_media where post_id=p_post_id and kind='photo' and not_eaten order by position
 on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=0 then return false;end if;
 update public.posts set status='processing' where id=p_post_id;
 return true;
end $$;

create or replace function public.apply_post_remainder(p_post_id uuid,p_job_id uuid,p_photo_id uuid,p_expected uuid[],p_items jsonb,p_reply text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare actual uuid[]; j public.jobs; v jsonb; old public.post_items; new_id uuid; n jsonb; old_kcal numeric;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not public.post_work_matches(p_post_id,p_job_id) then raise exception 'Not-eaten job no longer owns this meal' using errcode='40001';end if;
 select * into j from public.jobs where id=p_job_id and post_id=p_post_id and kind='remainder' and status='running' for update;
 if not found then raise exception 'Not-eaten job not found' using errcode='42501';end if;
 if coalesce((j.payload->>'remainder_applied')::boolean,false) then return true;end if;
 if j.payload->>'remainder_photo_id' is distinct from p_photo_id::text then raise exception 'Leftovers job photo changed' using errcode='40001';end if;
 if not exists(select 1 from public.post_media where id=p_photo_id and post_id=p_post_id and kind='photo' and not_eaten) then raise exception 'Not-eaten photo changed' using errcode='40001';end if;
 select array_agg(id order by id) into actual from public.current_post_items where post_id=p_post_id;
 if actual is distinct from (select array_agg(x order by x) from unnest(p_expected) x) then raise exception 'Meal items changed during the not-eaten estimate' using errcode='40001';end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)<>cardinality(p_expected) or p_reply is null or length(p_reply)>4000 then raise exception 'Invalid not-eaten revision' using errcode='22023';end if;
 if (select count(distinct value->>'old_id') from jsonb_array_elements(p_items))<>cardinality(p_expected) then raise exception 'Duplicate not-eaten item' using errcode='22023';end if;
 for v in select value from jsonb_array_elements(p_items) loop
  select * into old from public.current_post_items where id=(v->>'old_id')::uuid and post_id=p_post_id;
  if not found or not (old.id=any(p_expected)) or (v->>'portion_grams')::numeric<0 or (v->>'not_eaten_grams')::numeric<coalesce(old.not_eaten_grams,0) or (v->>'portion_grams')::numeric+(v->>'not_eaten_grams')::numeric is distinct from old.portion_grams+coalesce(old.not_eaten_grams,0) then raise exception 'Invalid consumed difference' using errcode='22023';end if;
  select calories into old_kcal from public.item_nutrition where post_item_id=old.id;
  update public.post_items set superseded_at=clock_timestamp() where id=old.id;
  insert into public.post_items(post_id,name,portion_text,portion_grams,box,mask_path,confidence,source,supersedes,gtin,not_eaten_grams,not_eaten_calories,count_text,not_eaten_count_text)
   values(p_post_id,old.name,v->>'portion_text',(v->>'portion_grams')::numeric,old.box,old.mask_path,old.confidence,'model',old.id,old.gtin,(v->>'not_eaten_grams')::integer,case when v ? 'not_eaten_calories' then (v->>'not_eaten_calories')::numeric when coalesce(old.not_eaten_grams,0)>0 and old.not_eaten_calories is null then null when old.portion_grams>0 and old_kcal is not null then coalesce(old.not_eaten_calories,0)+old_kcal*((v->>'not_eaten_grams')::numeric-coalesce(old.not_eaten_grams,0))/old.portion_grams else old.not_eaten_calories end,v->>'count_text',v->>'not_eaten_count_text') returning id into new_id;
  n:=v->'nutrition';
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref)
   values(new_id,(n->>'calories')::numeric,(n->>'protein_g')::numeric,(n->>'carbs_g')::numeric,(n->>'fat_g')::numeric,(n->>'fibre_g')::numeric,(n->>'sugar_g')::numeric,(n->>'sodium_mg')::numeric,coalesce(n->'micronutrients','[]'::jsonb),n->>'source_ref');
 end loop;
 insert into public.post_comments(post_id,author,body) values(p_post_id,'model',p_reply);
 update public.jobs set payload=payload||jsonb_build_object('remainder_applied',true,'leftover_items',p_items,'leftover_reply',p_reply) where id=p_job_id;
 return true;
end $$;
revoke all on function public.apply_post_remainder(uuid,uuid,uuid,uuid[],jsonb,text) from public,anon,authenticated;
grant execute on function public.apply_post_remainder(uuid,uuid,uuid,uuid[],jsonb,text) to service_role;


create or replace function public.prepare_post_photo_attachment(p_post_id uuid,p_user_id uuid,p_stage_path text,p_not_eaten boolean)
returns public.post_photo_attachments language plpgsql security definer set search_path=public,pg_temp as $$
declare row public.post_photo_attachments; current_status text; pos integer; cleanup uuid; stage_cleanup public.jobs;
begin
 select status into current_status from public.posts where id=p_post_id and user_id=p_user_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 if exists(select 1 from public.intake_logs where post_id=p_post_id) then raise exception 'Drink amounts were recorded when posted' using errcode='55000';end if;
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


create or replace function public.complete_post_photo_attachment(p_id uuid,p_user_id uuid,p_width integer,p_height integer)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare row public.post_photo_attachments; current_status text; photo uuid; cleanup public.jobs;
begin
 select * into row from public.post_photo_attachments where id=p_id and user_id=p_user_id;
 if not found then raise exception 'Photo not found' using errcode='42501';end if;
 select status into current_status from public.posts where id=row.post_id and user_id=p_user_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 select * into row from public.post_photo_attachments where id=p_id for update;
 if row.media_id is not null then return row.media_id;end if;
 if current_status<>'ready' then raise exception 'Wait for this meal to be ready' using errcode='55000';end if;
 select * into cleanup from public.jobs where id=row.cleanup_job_id for update;
 if not found or cleanup.status<>'queued' or cleanup.run_after<=clock_timestamp() then raise exception 'Photo stage expired' using errcode='22023';end if;
 if p_width is null or p_height is null or p_width not between 1 and 4096 or p_height not between 1 and 4096 then raise exception 'Invalid photo dimensions' using errcode='22023';end if;
 if not exists(select 1 from storage.objects where bucket_id='media' and name=row.target_path) or not exists(select 1 from storage.objects where bucket_id='media' and name=replace(row.target_path,'.jpg','.feed.jpg')) then raise exception 'Photo upload incomplete' using errcode='22023';end if;
 if (select count(*) from public.post_media where post_id=row.post_id and kind='photo')>=8 then raise exception 'A meal has at most eight photos' using errcode='22023';end if;
 update public.post_media set position=greatest(position,row.position)+1 where post_id=row.post_id and kind='card';
 insert into public.post_media(post_id,storage_path,position,width,height,kind,not_eaten) values(row.post_id,row.target_path,row.position,p_width,p_height,'photo',row.not_eaten) returning id into photo;
 update public.post_photo_attachments set media_id=photo where id=p_id;
 update public.posts set status='processing',fail_reason=null where id=row.post_id;
 insert into public.jobs(post_id,kind,priority,status,payload) values(row.post_id,case when row.not_eaten then 'remainder' else 'correct' end,100,'queued',case when row.not_eaten then jsonb_build_object('remainder_photo_id',photo) else jsonb_build_object('photo_added',true,'added_media_id',photo) end);
 return photo;
end $$;
revoke all on function public.complete_post_photo_attachment(uuid,uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.complete_post_photo_attachment(uuid,uuid,integer,integer) to service_role;


notify pgrst,'reload schema';
