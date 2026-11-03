-- Pre-publication drink identification is server-owned; clients choose portions,
-- never nutrition. Publish and consume the prepared reading under one draft lock.
create table public.composer_drink_readings (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 upload_id uuid not null references public.post_upload_drafts(id) on delete cascade,
 position integer not null check(position between 0 and 7),
 photo_hash text check(photo_hash is null or photo_hash ~ '^[0-9a-f]{64}$'),
 state text not null default 'pending' check(state in ('pending','ready','failed')),
 drinks jsonb not null default '[]' check(jsonb_typeof(drinks)='array'),
 all_drinks boolean not null default false,
 created_at timestamptz not null default clock_timestamp(),
 unique(upload_id,position)
);
create index composer_drink_readings_photo on public.composer_drink_readings(user_id,photo_hash);
create unique index composer_drink_readings_one_pending_photo on public.composer_drink_readings(user_id,photo_hash) where state='pending' and photo_hash is not null;
alter table public.composer_drink_readings enable row level security;
revoke all on public.composer_drink_readings from public,anon,authenticated;
grant all on public.composer_drink_readings to service_role;

create function public.publish_composer_drinks(p_upload_id uuid,p_user_id uuid,p_readings jsonb,p_caption text,p_eaten_at timestamptz,p_location jsonb,p_save_as_meal boolean)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.post_upload_drafts; r public.composer_drink_readings; choice jsonb; selection jsonb; drink jsonb; n jsonb; row_item jsonb; nutrient jsonb; nutrients jsonb;
 items jsonb:='[]'; positions integer[]:='{}'; indexes integer[]; ratio numeric; ml numeric; idx integer; key text; amount numeric; result uuid; intake jsonb;
 calories numeric; protein numeric; carbs numeric; fat numeric;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_upload_id::text,0));
 select * into d from public.post_upload_drafts where id=p_upload_id and user_id=p_user_id for update;
 if not found then raise exception 'Draft not found' using errcode='42501';end if;
 if d.published then
  if exists(select 1 from public.posts where id=d.id and user_id=p_user_id and deleted_at is null and analysis_initialized_at is not null) then return d.id;end if;
  raise exception 'Draft is no longer available' using errcode='40001';
 end if;
 if jsonb_typeof(p_readings) is distinct from 'array' or jsonb_array_length(p_readings) not between 1 and 8
  or p_caption is null or length(p_caption)>2000 or p_eaten_at is null or p_eaten_at>clock_timestamp()+interval '5 minutes'
  or cardinality(d.not_eaten_positions)>0 then raise exception 'Invalid drink selection' using errcode='22023';end if;
 for choice in select value from jsonb_array_elements(p_readings) loop
  select * into r from public.composer_drink_readings where id=(choice->>'reading_id')::uuid and user_id=p_user_id and upload_id=p_upload_id and state='ready' and all_drinks for update;
  if not found then raise exception 'Drink reading not found' using errcode='42501';end if;
  if r.position=any(positions) then raise exception 'Duplicate photo selection' using errcode='22023';end if;
  positions:=array_append(positions,r.position); indexes:='{}';
  if jsonb_typeof(choice->'selections') is distinct from 'array' then raise exception 'Invalid drink portions' using errcode='22023';end if;
  for selection in select value from jsonb_array_elements(choice->'selections') loop
   idx:=(selection->>'index')::integer; ml:=(selection->>'ml')::numeric;
   if idx is null or idx<0 or idx>=jsonb_array_length(r.drinks) or idx=any(indexes) or ml is null or ml not between 1 and 5000
    or (selection->>'index')::numeric<>idx then raise exception 'Invalid drink portion' using errcode='22023';end if;
   indexes:=array_append(indexes,idx); drink:=r.drinks->idx;
   ratio:=ml/(drink->>'ml')::numeric;n:=drink->'nutrition';
   for key in select unnest(array['calories','protein_g','carbs_g','fat_g','fibre_g','sugar_g','sodium_mg']) loop
    n:=jsonb_set(n,array[key],coalesce(to_jsonb((n->>key)::numeric*ratio),'null'::jsonb));
   end loop;
   nutrients:='[]';
   for nutrient in select value from jsonb_array_elements(coalesce(n->'micronutrients','[]')) loop
    amount:=(nutrient->>'value')::numeric*ratio;
    if (nutrient->>'nutrientId')::integer=1057 and amount>1000 then raise exception 'Caffeine portion too large' using errcode='22023';end if;
    nutrients:=nutrients||jsonb_build_array(jsonb_set(nutrient,'{value}',coalesce(to_jsonb(amount),'null'::jsonb)));
   end loop;
   n:=jsonb_set(n,'{micronutrients}',nutrients);
   row_item:=jsonb_build_object('name',drink->>'name','portion_text',trim_scale(ml)::text||' ml','portion_grams',(drink->>'grams')::numeric*ratio,'confidence',null,'box',null,'mask_path',null,'nutrition',n);
   items:=items||jsonb_build_array(row_item);
  end loop;
 end loop;
 if cardinality(positions)<>jsonb_array_length(d.shots) or exists(select 1 from generate_series(0,jsonb_array_length(d.shots)-1) s where not s=any(positions))
  or jsonb_array_length(items) not between 1 and 40 then raise exception 'Select the drinks for every photo' using errcode='22023';end if;
 update public.post_upload_drafts set caption=p_caption,eaten_at=p_eaten_at,location=p_location,save_as_meal=p_save_as_meal where id=d.id;
 -- The normal publication checks uploaded originals/feed copies, expiry and the
 -- cleanup lease. Its analyze job never becomes externally visible in this txn.
 result:=public.publish_uploaded_post(p_upload_id,p_user_id);
 delete from public.jobs where id=result and post_id=result and kind='analyze' and status='queued';
 select sum((value#>>'{nutrition,calories}')::numeric),sum((value#>>'{nutrition,protein_g}')::numeric),sum((value#>>'{nutrition,carbs_g}')::numeric),sum((value#>>'{nutrition,fat_g}')::numeric)
 into calories,protein,carbs,fat from jsonb_array_elements(items);
 perform public.persist_analysis(result,items,format('Consumed: %s kcal · %s g protein · %s g carbs · %s g fat.',coalesce(round(calories)::text,'unavailable'),coalesce(round(protein)::text,'unavailable'),coalesce(round(carbs)::text,'unavailable'),coalesce(round(fat)::text,'unavailable')));
 update public.posts set identify_model='muse-spark-1.3',identify_host='meta' where id=result;
 select jsonb_agg(jsonb_build_object('post_item_id',i.id,'ml',round(split_part(i.portion_text,' ',1)::numeric)::integer,'kind',case when coalesce(c.mg,0)>=1 then 'caffeine' else 'water' end,
  'amount',case when coalesce(c.mg,0)>=1 then round(c.mg)::integer else round(split_part(i.portion_text,' ',1)::numeric)::integer end,'label',left(i.name,40))) into intake
 from public.current_post_items i join public.item_nutrition nut on nut.post_item_id=i.id
 left join lateral(select (value->>'value')::numeric mg from jsonb_array_elements(nut.micronutrients) where (value->>'nutrientId')::integer=1057 limit 1) c on true where i.post_id=result;
 perform public.sync_item_drinks(result,coalesce(intake,'[]'));
 -- Only the committed item history remains; the upload tombstone handles retries.
 delete from public.composer_drink_readings where upload_id=p_upload_id and user_id=p_user_id;
 return result;
end $$;
revoke all on function public.publish_composer_drinks(uuid,uuid,jsonb,text,timestamptz,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.publish_composer_drinks(uuid,uuid,jsonb,text,timestamptz,jsonb,boolean) to service_role;

-- Serialize correcting a prepared reading with publication, and reject stale
-- edits instead of overwriting another tab's current reading.
create function public.correct_composer_drinks(p_reading_id uuid,p_user_id uuid,p_expected jsonb,p_drinks jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare upload uuid; d public.post_upload_drafts; r public.composer_drink_readings;
begin
 select upload_id into upload from public.composer_drink_readings where id=p_reading_id and user_id=p_user_id;
 if not found then raise exception 'Reading not found' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(upload::text,0));
 select * into d from public.post_upload_drafts where id=upload and user_id=p_user_id for update;
 if not found or d.published then raise exception 'Photo already posted' using errcode='40001';end if;
 select * into r from public.composer_drink_readings where id=p_reading_id and user_id=p_user_id and state='ready' for update;
 if not found then raise exception 'Reading not found' using errcode='42501';end if;
 if r.drinks is distinct from p_expected then raise exception 'Drink reading changed' using errcode='40001';end if;
 if jsonb_typeof(p_drinks) is distinct from 'array' or jsonb_array_length(p_drinks)<>jsonb_array_length(r.drinks) then raise exception 'Invalid correction' using errcode='22023';end if;
 update public.composer_drink_readings set drinks=p_drinks where id=r.id;
end $$;
revoke all on function public.correct_composer_drinks(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.correct_composer_drinks(uuid,uuid,jsonb,jsonb) to service_role;

notify pgrst, 'reload schema';
