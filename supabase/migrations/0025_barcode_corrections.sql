-- Personal corrections override database products; only corroborated names are shared.
create table public.barcode_corrections (
 id uuid primary key default gen_random_uuid(), gtin text not null check (gtin ~ '^[0-9]{8,14}$'),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text check (name is null or char_length(btrim(name)) between 1 and 80),
 pack_amount numeric check (pack_amount > 0 and pack_amount <= 100000), pack_unit text check (pack_unit in ('g','ml')),
 serving_amount numeric check (serving_amount > 0 and serving_amount <= 100000), serving_unit text check (serving_unit in ('g','ml')),
 per_100 jsonb check (per_100 is null or jsonb_typeof(per_100)='object'),
 source text not null check (source in ('user','label')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(gtin,user_id)
);
alter table public.barcode_corrections enable row level security;
create policy barcode_corrections_owner on public.barcode_corrections for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update,delete on public.barcode_corrections to authenticated;
create table public.label_readings (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 photo_path text not null, reading jsonb not null, created_at timestamptz not null default now()
);
alter table public.label_readings enable row level security;
create policy label_readings_owner on public.label_readings for select to authenticated using(user_id=auth.uid());
grant select on public.label_readings to authenticated;
revoke insert,update,delete on public.label_readings from authenticated,anon;
create function public.barcode_shared_name(p_gtin text) returns text language sql stable security definer set search_path=public,pg_temp as $$
 select lower(btrim(regexp_replace(name,'[[:space:]]+',' ','g'))) from public.barcode_corrections where gtin=p_gtin and name is not null
 group by lower(btrim(regexp_replace(name,'[[:space:]]+',' ','g'))) having count(distinct user_id)>=3 order by count(distinct user_id) desc,lower(btrim(regexp_replace(name,'[[:space:]]+',' ','g'))) limit 1
$$;
revoke all on function public.barcode_shared_name(text) from public,anon;
grant execute on function public.barcode_shared_name(text) to authenticated,service_role;
alter table public.model_calls drop constraint model_calls_kind_check;
alter table public.model_calls add constraint model_calls_kind_check check(kind in ('sam','spark_identify','spark_correct','spark_same_meal','spark_search','fdc','transcribe','spark_label'));
alter table public.post_items add column gtin text;
create or replace view public.current_post_items with(security_invoker=true) as select * from public.post_items where superseded_at is null;

-- Corrections replace exactly the current scanned item and preserve its revision lineage.
create function public.correct_barcode_item(p_post uuid,p_user uuid,p_gtin text,p_name text,p_amount numeric,p_unit text,p_nutrition jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare old public.post_items; fresh uuid;
begin
 perform 1 from public.posts where id=p_post and user_id=p_user and analysis_initialized_at is not null for update;
 if not found then raise exception 'Post not found' using errcode='42501'; end if;
 select * into old from public.post_items where post_id=p_post and superseded_at is null and gtin=p_gtin for update;
 if not found then raise exception 'Product changed' using errcode='40001'; end if;
 if p_unit not in ('g','ml') or p_amount is null or p_amount<=0 or p_amount>100000 or char_length(p_name) not between 1 and 80 then raise exception 'Invalid product' using errcode='22023'; end if;
 update public.post_items set superseded_at=now() where id=old.id;
 insert into public.post_items(post_id,name,portion_text,portion_grams,box,mask_path,confidence,source,supersedes,gtin)
 values(p_post,p_name,trim_scale(p_amount)::text||' '||p_unit,case when p_unit='g' then p_amount else null end,old.box,old.mask_path,old.confidence,'user',old.id,p_gtin) returning id into fresh;
 insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref)
 values(fresh,(p_nutrition->>'calories')::numeric,(p_nutrition->>'protein_g')::numeric,(p_nutrition->>'carbs_g')::numeric,(p_nutrition->>'fat_g')::numeric,(p_nutrition->>'fibre_g')::numeric,(p_nutrition->>'sugar_g')::numeric,(p_nutrition->>'sodium_mg')::numeric,coalesce(p_nutrition->'micronutrients','[]'),p_nutrition->>'source_ref');
 update public.posts set status='queued',fail_reason=null where id=p_post;
 insert into public.jobs(post_id,kind,priority,status) select p_post,'recompute',100,'queued' where not exists(select 1 from public.jobs where post_id=p_post and kind='recompute' and status='queued');
 insert into public.post_comments(post_id,author,body) values(p_post,'model','Product corrected to '||p_name||'.');
 return fresh;
end $$;
revoke all on function public.correct_barcode_item(uuid,uuid,text,text,numeric,text,jsonb) from public,anon,authenticated;
grant execute on function public.correct_barcode_item(uuid,uuid,text,text,numeric,text,jsonb) to service_role;

-- Keep the GTIN in the same transaction as the ready food post.
alter function public.create_food_post(uuid,timestamptz,text,numeric,jsonb,jsonb) rename to create_food_post_without_gtin;
revoke all on function public.create_food_post_without_gtin(uuid,timestamptz,text,numeric,jsonb,jsonb) from public,anon,authenticated,service_role;
create function public.create_food_post(p_user_id uuid,p_eaten_at timestamptz,p_name text,p_grams numeric,p_nutrition jsonb,p_photo jsonb default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare post uuid;
begin
 post:=public.create_food_post_without_gtin(p_user_id,p_eaten_at,p_name,p_grams,p_nutrition,p_photo);
 if p_nutrition->>'gtin' is not null then
  update public.post_items set gtin=p_nutrition->>'gtin' where post_id=post and superseded_at is null;
 end if;
 return post;
end $$;
revoke all on function public.create_food_post(uuid,timestamptz,text,numeric,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.create_food_post(uuid,timestamptz,text,numeric,jsonb,jsonb) to service_role;

create function public.persist_owned_label(p_post_id uuid,p_job_id uuid,p_items jsonb,p_summary text,p_needs_input jsonb default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform public.persist_owned_analysis(p_post_id,p_job_id,p_items,p_summary,p_needs_input);
 update public.post_items i set source='user' where i.post_id=p_post_id and i.superseded_at is null
  and exists(select 1 from public.item_nutrition n where n.post_item_id=i.id and n.source_ref='label');
end $$;
revoke all on function public.persist_owned_label(uuid,uuid,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.persist_owned_label(uuid,uuid,jsonb,text,jsonb) to service_role;

-- Portion edits and servings keep the code as their new current version replaces the old one.
create function public.inherit_item_gtin() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.gtin is null and new.supersedes is not null then
  select gtin into new.gtin from public.post_items where id=new.supersedes and post_id=new.post_id;
 end if;
 return new;
end $$;
create trigger post_items_inherit_gtin before insert on public.post_items for each row execute function public.inherit_item_gtin();

-- Serverless instances share this atomic six-reads-per-minute owner quota.
-- Browser roles cannot reset counters or spend another user's allowance.
create table public.label_read_limits(
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_started_at timestamptz not null,calls integer not null check(calls between 1 and 6)
);
alter table public.label_read_limits enable row level security;
revoke all on public.label_read_limits from public,anon,authenticated;
grant select,insert,update,delete on public.label_read_limits to service_role;
create function public.consume_label_read(p_user_id uuid) returns integer
language plpgsql security definer set search_path=public,pg_temp as $$
declare allowed boolean; retry_seconds integer; instant timestamptz:=clock_timestamp();
begin
 if p_user_id is null then raise exception 'Owner required' using errcode='22023';end if;
 insert into public.label_read_limits as limits(user_id,window_started_at,calls) values(p_user_id,instant,1)
 on conflict(user_id) do update set
  window_started_at=case when limits.window_started_at<=instant-interval '60 seconds' then instant else limits.window_started_at end,
  calls=case when limits.window_started_at<=instant-interval '60 seconds' then 1 else limits.calls+1 end
 where limits.window_started_at<=instant-interval '60 seconds' or limits.calls<6
 returning true into allowed;
 if coalesce(allowed,false) then return 0;end if;
 select greatest(1,ceil(extract(epoch from window_started_at+interval '60 seconds'-instant))::integer) into retry_seconds from public.label_read_limits where user_id=p_user_id;
 return coalesce(retry_seconds,60);
end $$;
revoke all on function public.consume_label_read(uuid) from public,anon,authenticated;
grant execute on function public.consume_label_read(uuid) to service_role;
