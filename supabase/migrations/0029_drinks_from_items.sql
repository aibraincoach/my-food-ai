-- Item-sourced drink records are rebuilt from the current consumed revision.
alter table public.intake_logs
 add column source text not null default 'sheet' check (source in ('sheet','item')),
 add column post_item_id uuid references public.post_items(id) on delete cascade;
alter table public.item_nutrition add column food_category text;
-- Keep legacy owner-writable, unlinked intake from reserving another item's
-- unique link. Allow the post FK's transient SET NULL during deletion; the
-- post_item FK then cascades the item record without a dependency on 0030.
alter table public.intake_logs add constraint intake_source_shape check (
 (source='sheet' and post_item_id is null) or
 (source='item' and post_item_id is not null)
);
drop index public.intake_one_drink_per_post;
create unique index intake_one_sheet_drink_per_post on public.intake_logs(post_id) where post_id is not null and source = 'sheet';
create unique index intake_one_drink_per_item on public.intake_logs(post_item_id) where post_item_id is not null;

create or replace function public.sync_item_drinks(p_post_id uuid,p_rows jsonb) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_post public.posts; v_row jsonb;
begin
 select * into v_post from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post not found' using errcode='42501'; end if;
 -- A sheet drink's model-free record remains authoritative.
 if exists(select 1 from public.intake_logs where post_id=p_post_id and source='sheet') then return; end if;
 if p_rows is null or jsonb_typeof(p_rows)<>'array' then raise exception 'Invalid drinks' using errcode='22023'; end if;
 for v_row in select value from jsonb_array_elements(p_rows) loop
  if not exists(select 1 from public.current_post_items where id=(v_row->>'post_item_id')::uuid and post_id=p_post_id) then
   raise exception 'Drink item not found' using errcode='42501';
  end if;
 end loop;
 delete from public.intake_logs where post_id=p_post_id and source='item'
 and post_item_id not in (select (value->>'post_item_id')::uuid from jsonb_array_elements(p_rows));
 insert into public.intake_logs(user_id,post_id,post_item_id,source,kind,amount,ml,label,logged_at)
 select v_post.user_id,p_post_id,(value->>'post_item_id')::uuid,'item',value->>'kind',(value->>'amount')::integer,
 (value->>'ml')::integer,value->>'label',v_post.eaten_at from jsonb_array_elements(p_rows)
 on conflict(post_item_id) where post_item_id is not null do update set
 kind=excluded.kind,amount=excluded.amount,ml=excluded.ml,label=excluded.label,logged_at=excluded.logged_at;
end $$;
revoke all on function public.sync_item_drinks(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.sync_item_drinks(uuid,jsonb) to service_role;

create or replace function public.keep_drink_record_consistent()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if exists(select 1 from public.intake_logs where post_id=old.id and source='sheet') then
    if new.servings is distinct from old.servings or new.status is distinct from old.status then
      raise exception 'Drink amounts were recorded when posted and cannot be changed through meal edits' using errcode='22023';
    end if;
  end if;
  if new.eaten_at is distinct from old.eaten_at then
    update public.intake_logs set logged_at=new.eaten_at where post_id=old.id;
  end if;
  return new;
end;
$$;

create or replace function public.protect_drink_items()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_post uuid := case when tg_op='DELETE' then old.post_id else new.post_id end;
begin
  perform 1 from public.posts where id=v_post for update;
  if found and exists(select 1 from public.intake_logs where post_id=v_post and source='sheet') then
    raise exception 'Drink amounts were recorded when posted and cannot be changed through meal edits' using errcode='22023';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

-- Preserve category in edit_post_item_with_nutrition.
create or replace function public.edit_post_item_with_nutrition(
  p_post_id uuid, p_user_id uuid, p_action text, p_item_id uuid,
  p_name text, p_portion_grams numeric, p_box jsonb, p_nutrition jsonb
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_new uuid;
begin
  if p_action = 'remove' or p_nutrition is null or jsonb_typeof(p_nutrition) <> 'object' then
    raise exception 'Selected food nutrition is required' using errcode = '22023';
  end if;
  v_new := public.edit_post_item(p_post_id, p_user_id, p_action, p_item_id, p_name, p_portion_grams, p_box);
  insert into public.item_nutrition(post_item_id, calories, protein_g, carbs_g, fat_g,
    fibre_g, sugar_g, sodium_mg, micronutrients, source_ref,food_category)
  values (v_new, (p_nutrition->>'calories')::numeric, (p_nutrition->>'protein_g')::numeric,
    (p_nutrition->>'carbs_g')::numeric, (p_nutrition->>'fat_g')::numeric,
    (p_nutrition->>'fibre_g')::numeric, (p_nutrition->>'sugar_g')::numeric,
    (p_nutrition->>'sodium_mg')::numeric, coalesce(p_nutrition->'micronutrients','[]'::jsonb), p_nutrition->>'source_ref',p_nutrition->>'food_category');
  return v_new;
end;
$$;

-- Preserve category in persist_correction.
create or replace function public.persist_correction(p_post_id uuid,p_job_id uuid,p_expected uuid[],p_through uuid,p_items jsonb,p_reply text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare expected uuid[]; actual uuid[]; row jsonb; new_id uuid; prior uuid;
  v_payload jsonb; v_sequence bigint; v_applied uuid[]; v_pending uuid[];
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post missing' using errcode='42501'; end if;
 if not public.post_work_matches(p_post_id,p_job_id) then raise exception 'Correction job no longer owns this meal' using errcode='40001';end if;
 if exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id and coalesce((payload->>'correction_applied')::boolean,false)) then return false; end if;
 if not exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id and kind='correct' and status='running') then raise exception 'Correction job missing' using errcode='22023'; end if;
 select payload into v_payload from public.jobs where id=p_job_id;
 select coalesce(max((payload->>'correction_sequence')::bigint),0) into v_sequence
   from public.jobs where post_id=p_post_id and kind='correct' and payload->>'correction_applied'='true';
 if v_payload ? 'correction_from_sequence' and (v_payload->>'correction_from_sequence')::bigint is distinct from v_sequence then
   raise exception 'Correction progress changed during the model call' using errcode='40001';
 end if;
 select coalesce(array_agg(distinct value::uuid),array[]::uuid[]) into v_applied
   from public.jobs j cross join lateral jsonb_array_elements_text(coalesce(j.payload->'correction_pending_ids','[]'::jsonb))
   where j.post_id=p_post_id and j.kind='correct' and j.payload->>'correction_applied'='true';
 if v_payload ? 'correction_pending_ids' then
   select array_agg(value::uuid) into v_pending from jsonb_array_elements_text(v_payload->'correction_pending_ids');
 else
   -- Backward-compatible callers (including the question wrapper) retain the
   -- six-argument RPC. New workers always record their exact pending set.
   select array_agg(c.id order by c.created_at,c.id) into v_pending from public.post_comments c
     join public.post_comments last_comment on last_comment.id=p_through
     where c.post_id=p_post_id and c.author='user' and (c.created_at,c.id)<=(last_comment.created_at,last_comment.id)
       and not(c.id=any(v_applied));
 end if;
 if coalesce(cardinality(v_pending),0)=0 or not(p_through=any(v_pending)) or v_pending && v_applied then
   raise exception 'Correction message range is stale' using errcode='40001';
 end if;
 if exists(select 1 from unnest(v_pending) as pending(id) where not exists(select 1 from public.post_comments c where c.id=pending.id and c.post_id=p_post_id and c.author='user')) then
   raise exception 'Correction message does not belong to post' using errcode='22023';
 end if;
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
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref,food_category)
  values(new_id,(row#>>'{nutrition,calories}')::numeric,(row#>>'{nutrition,protein_g}')::numeric,(row#>>'{nutrition,carbs_g}')::numeric,(row#>>'{nutrition,fat_g}')::numeric,
   (row#>>'{nutrition,fibre_g}')::numeric,(row#>>'{nutrition,sugar_g}')::numeric,(row#>>'{nutrition,sodium_mg}')::numeric,coalesce(row#>'{nutrition,micronutrients}','[]'::jsonb),row#>>'{nutrition,source_ref}',row#>>'{nutrition,food_category}');
 end loop;
 insert into public.post_comments(post_id,author,body) values(p_post_id,'model',p_reply);
 update public.jobs set payload=payload||jsonb_build_object('correction_applied',true,'correction_sequence',v_sequence+1,
   'correction_through',p_through,'correction_pending_ids',to_jsonb(v_pending)) where id=p_job_id;
 -- A newly committed correction supersedes an earlier recompute failure.
 -- Idempotent replays return above, so an old completion cannot clear a newer failure.
 update public.posts set status='processing',fail_reason=null where id=p_post_id;
 if exists(select 1 from public.post_comments where post_id=p_post_id and author='user' and not(id=any(v_applied||v_pending))) then
  insert into public.jobs(post_id,kind,priority,status) select p_post_id,'correct',100,'queued'
   where not exists(select 1 from public.jobs where post_id=p_post_id and kind='correct' and status='queued');
  update public.posts set status='queued' where id=p_post_id;
 end if;
 return true;
end;
$$;

-- Preserve category in correct_barcode_item.
create or replace function public.correct_barcode_item(p_post uuid,p_user uuid,p_gtin text,p_name text,p_amount numeric,p_unit text,p_nutrition jsonb)
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
 insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref,food_category)
 values(fresh,(p_nutrition->>'calories')::numeric,(p_nutrition->>'protein_g')::numeric,(p_nutrition->>'carbs_g')::numeric,(p_nutrition->>'fat_g')::numeric,(p_nutrition->>'fibre_g')::numeric,(p_nutrition->>'sugar_g')::numeric,(p_nutrition->>'sodium_mg')::numeric,coalesce(p_nutrition->'micronutrients','[]'),p_nutrition->>'source_ref',p_nutrition->>'food_category');
 update public.posts set status='queued',fail_reason=null where id=p_post;
 insert into public.jobs(post_id,kind,priority,status) select p_post,'recompute',100,'queued' where not exists(select 1 from public.jobs where post_id=p_post and kind='recompute' and status='queued');
 insert into public.post_comments(post_id,author,body) values(p_post,'model','Product corrected to '||p_name||'.');
 return fresh;
end $$;

-- Preserve category in copy_owned_saved_meal.
create or replace function public.copy_owned_saved_meal(p_id uuid,p_eaten_at timestamptz) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_saved public.saved_meals; v_post uuid; v_item uuid; v_row jsonb; v_n jsonb;
begin
 if p_eaten_at is null or p_eaten_at>now()+interval '5 minutes' then raise exception 'Invalid time eaten' using errcode='22023'; end if;
 select * into v_saved from public.saved_meals where id=p_id and user_id=auth.uid() for update;
 if not found then raise exception 'Saved meal not found' using errcode='42501'; end if;
 insert into public.posts(user_id,caption,eaten_at,status,analysis_initialized_at,source_post_id)
 values(auth.uid(),v_saved.name,p_eaten_at,'ready',clock_timestamp(),v_saved.source_post_id) returning id into v_post;
 for v_row in select value from jsonb_array_elements(v_saved.items) loop
  insert into public.post_items(post_id,name,portion_grams,portion_text,source)
  values(v_post,v_row->>'name',(v_row->>'portion_grams')::numeric,v_row->>'portion_text','user') returning id into v_item;
  v_n:=v_row->'nutrition';
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref,food_category)
  values(v_item,(v_n->>'calories')::numeric,(v_n->>'protein_g')::numeric,(v_n->>'carbs_g')::numeric,(v_n->>'fat_g')::numeric,(v_n->>'fibre_g')::numeric,(v_n->>'sugar_g')::numeric,(v_n->>'sodium_mg')::numeric,coalesce(v_n->'micronutrients','[]'::jsonb),v_n->>'source_ref',v_n->>'food_category');
 end loop;
 insert into public.intake_logs(user_id,kind,amount,ml,label,post_id,logged_at)
 select auth.uid(),kind,amount,ml,label,v_post,p_eaten_at from public.intake_logs where post_id=v_saved.source_post_id and user_id=auth.uid() and source='sheet';
 update public.saved_meals set last_logged_at=clock_timestamp() where id=p_id;
 return v_post;
end $$;

-- Preserve category in copy_owned_post.
create or replace function public.copy_owned_post(p_post_id uuid,p_eaten_at timestamptz) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_source public.posts; v_copy uuid; v_item uuid; v_row record;
begin
 if p_eaten_at is null or p_eaten_at>now()+interval '5 minutes' then raise exception 'Invalid time eaten' using errcode='22023'; end if;
 select * into v_source from public.posts where id=p_post_id and user_id=auth.uid() and status='ready' for update;
 if not found then raise exception 'Meal not found' using errcode='42501'; end if;
 if not exists(select 1 from public.current_post_items where post_id=p_post_id) then raise exception 'No meal items to copy' using errcode='22023'; end if;
 insert into public.posts(user_id,caption,eaten_at,status,analysis_initialized_at,source_post_id)
 values(auth.uid(),v_source.caption,p_eaten_at,'ready',clock_timestamp(),p_post_id) returning id into v_copy;
 for v_row in select i.name,i.portion_grams,i.portion_text,n.* from public.current_post_items i left join public.item_nutrition n on n.post_item_id=i.id where i.post_id=p_post_id order by i.created_at,i.id loop
  insert into public.post_items(post_id,name,portion_grams,portion_text,source) values(v_copy,v_row.name,v_row.portion_grams,v_row.portion_text,'user') returning id into v_item;
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref,food_category)
  values(v_item,v_row.calories,v_row.protein_g,v_row.carbs_g,v_row.fat_g,v_row.fibre_g,v_row.sugar_g,v_row.sodium_mg,v_row.micronutrients,v_row.source_ref,v_row.food_category);
 end loop;
 insert into public.intake_logs(user_id,kind,amount,ml,label,post_id,logged_at)
 select auth.uid(),kind,amount,ml,label,v_copy,p_eaten_at from public.intake_logs where post_id=p_post_id and user_id=auth.uid() and source='sheet';
 update public.saved_meals set last_logged_at=clock_timestamp() where user_id=auth.uid() and source_post_id=p_post_id;
 return v_copy;
end $$;

-- Preserve category in apply_post_remainder.
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
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref,food_category)
   values(new_id,(n->>'calories')::numeric,(n->>'protein_g')::numeric,(n->>'carbs_g')::numeric,(n->>'fat_g')::numeric,(n->>'fibre_g')::numeric,(n->>'sugar_g')::numeric,(n->>'sodium_mg')::numeric,coalesce(n->'micronutrients','[]'::jsonb),n->>'source_ref',n->>'food_category');
 end loop;
 insert into public.post_comments(post_id,author,body) values(p_post_id,'model',p_reply);
 update public.jobs set payload=payload||jsonb_build_object('remainder_applied',true,'leftover_items',p_items,'leftover_reply',p_reply) where id=p_job_id;
 return true;
end $$;

-- Preserve category in persist_photo_correction.
create or replace function public.persist_photo_correction(p_post_id uuid,p_job_id uuid,p_expected uuid[],p_items jsonb,p_reply text,p_question jsonb default null)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare job public.jobs; actual uuid[]; expected uuid[]; row jsonb; prior uuid; fresh uuid; applied uuid[]; pending uuid[]; seq bigint;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found or not public.post_work_matches(p_post_id,p_job_id) then raise exception 'Photo job no longer owns meal' using errcode='40001';end if;
 select * into job from public.jobs where id=p_job_id and post_id=p_post_id and kind='correct' and status='running' for update;
 if not found or not coalesce((job.payload->>'photo_added')::boolean,false) then raise exception 'Photo correction missing' using errcode='22023';end if;
 if coalesce((job.payload->>'correction_applied')::boolean,false) then return false;end if;
 select coalesce(max((payload->>'correction_sequence')::bigint),0) into seq from public.jobs where post_id=p_post_id and kind='correct' and payload->>'correction_applied'='true';
 if (job.payload->>'correction_from_sequence')::bigint is distinct from seq then raise exception 'Correction progress changed' using errcode='40001';end if;
 select coalesce(array_agg(distinct value::uuid),array[]::uuid[]) into applied from public.jobs j cross join lateral jsonb_array_elements_text(coalesce(j.payload->'correction_pending_ids','[]')) where j.post_id=p_post_id and j.kind='correct' and j.payload->>'correction_applied'='true';
 select coalesce(array_agg(value::uuid),array[]::uuid[]) into pending from jsonb_array_elements_text(coalesce(job.payload->'correction_pending_ids','[]'));
 if pending && applied or exists(select 1 from unnest(pending) pending_id where not exists(select 1 from public.post_comments where id=pending_id and post_id=p_post_id and author='user')) then raise exception 'Correction messages changed' using errcode='40001';end if;
 select array_agg(id order by id) into actual from public.current_post_items where post_id=p_post_id;
 select array_agg(id order by id) into expected from unnest(p_expected) id;
 if actual is distinct from expected then raise exception 'Items changed during photo correction' using errcode='40001';end if;
 if jsonb_typeof(p_items)<>'array' or char_length(btrim(p_reply))=0 then raise exception 'Invalid correction' using errcode='22023';end if;
 update public.post_items set superseded_at=now() where post_id=p_post_id and superseded_at is null;
 for row in select value from jsonb_array_elements(p_items) loop
  prior:=nullif(row->>'supersedes','')::uuid;
  if prior is not null and not(prior=any(coalesce(p_expected,array[]::uuid[]))) then raise exception 'Invalid source item' using errcode='22023';end if;
  insert into public.post_items(post_id,name,portion_text,portion_grams,box,mask_path,source,supersedes) values(p_post_id,row->>'name',row->>'portion_text',(row->>'portion_grams')::numeric,nullif(row->'box','null'::jsonb),row->>'mask_path','model',prior) returning id into fresh;
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref,food_category) values(fresh,(row#>>'{nutrition,calories}')::numeric,(row#>>'{nutrition,protein_g}')::numeric,(row#>>'{nutrition,carbs_g}')::numeric,(row#>>'{nutrition,fat_g}')::numeric,(row#>>'{nutrition,fibre_g}')::numeric,(row#>>'{nutrition,sugar_g}')::numeric,(row#>>'{nutrition,sodium_mg}')::numeric,coalesce(row#>'{nutrition,micronutrients}','[]'),row#>>'{nutrition,source_ref}',row#>>'{nutrition,food_category}');
 end loop;
 insert into public.post_comments(post_id,author,body) values(p_post_id,'model',coalesce(p_question->>'question',p_reply));
 update public.jobs set payload=payload||jsonb_build_object('correction_applied',true,'correction_sequence',seq+1,'correction_pending_ids',to_jsonb(pending)) where id=p_job_id;
 update public.posts set status=case when p_question is null then 'processing' else 'needs_input' end,needs_input=p_question,fail_reason=null where id=p_post_id;
 if exists(select 1 from public.post_comments where post_id=p_post_id and author='user' and not(id=any(applied||pending))) then
  insert into public.jobs(post_id,kind,priority,status) select p_post_id,'correct',100,'queued' where not exists(select 1 from public.jobs where post_id=p_post_id and kind='correct' and status='queued');
  update public.posts set status='queued',needs_input=null where id=p_post_id;
 end if;
 return true;
end $$;

-- Preserve category in persist_analysis_initial.
create or replace function public.persist_analysis_initial(
  p_post_id uuid,
  p_items jsonb,
  p_summary text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item jsonb;
  v_item_id uuid;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'persist_analysis: items must be an array';
  end if;
  if p_summary is null then
    raise exception 'persist_analysis: summary is required';
  end if;

  -- Serialize retries for this post, including the first-comment check.
  perform 1 from public.posts where id = p_post_id for update;
  if not found then
    raise exception 'persist_analysis: post not found';
  end if;

  -- Nutrition is deleted by its ON DELETE CASCADE foreign key. Historical
  -- versions and user/correction replacements must survive an analysis retry.
  delete from public.post_items
  where post_id = p_post_id and source = 'model'
    and supersedes is null and superseded_at is null;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) <> 'object'
      or jsonb_typeof(v_item -> 'nutrition') is distinct from 'object' then
      raise exception 'persist_analysis: each item requires nutrition';
    end if;

    insert into public.post_items (
      post_id, name, portion_text, portion_grams, box, mask_path, confidence, source
    ) values (
      p_post_id, v_item ->> 'name', v_item ->> 'portion_text',
      (v_item ->> 'portion_grams')::numeric, nullif(v_item -> 'box', 'null'::jsonb),
      v_item ->> 'mask_path', (v_item ->> 'confidence')::numeric, 'model'
    ) returning id into v_item_id;

    insert into public.item_nutrition (
      post_item_id, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g,
      sodium_mg, micronutrients, source_ref,food_category
    ) values (
      v_item_id,
      (v_item #>> '{nutrition,calories}')::numeric,
      (v_item #>> '{nutrition,protein_g}')::numeric,
      (v_item #>> '{nutrition,carbs_g}')::numeric,
      (v_item #>> '{nutrition,fat_g}')::numeric,
      (v_item #>> '{nutrition,fibre_g}')::numeric,
      (v_item #>> '{nutrition,sugar_g}')::numeric,
      (v_item #>> '{nutrition,sodium_mg}')::numeric,
      coalesce(nullif(v_item #> '{nutrition,micronutrients}', 'null'::jsonb), '[]'::jsonb),
      v_item #>> '{nutrition,source_ref}', v_item #>> '{nutrition,food_category}'
    );
  end loop;

  insert into public.post_comments (post_id, author, body)
  select p_post_id, 'model', p_summary
  where not exists (
    select 1 from public.post_comments where post_id = p_post_id and author = 'model'
  );

  update public.posts set status = 'ready' where id = p_post_id;
end;
$$;

-- Preserve category in create_food_post_without_gtin.
create or replace function public.create_food_post_without_gtin(
  p_user_id uuid, p_eaten_at timestamptz, p_name text, p_grams numeric, p_nutrition jsonb, p_photo jsonb default null
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_post uuid;
  v_item uuid;
  v_cleanup_status text;
  v_cleanup_due timestamptz;
  v_unit text := coalesce(p_nutrition->>'portion_unit', 'g');
begin
  if length(v_name) = 0 or length(v_name) > 160 then raise exception 'Name must contain 1 to 160 characters' using errcode = '22023'; end if;
  if p_grams is null or p_grams <= 0 or p_grams > 100000 then raise exception 'Portion must be between 0 and 100000 grams' using errcode = '22023'; end if;
  if p_nutrition is null or jsonb_typeof(p_nutrition) <> 'object' then raise exception 'Nutrition is required' using errcode = '22023'; end if;
  if v_unit not in ('g', 'ml') then raise exception 'Invalid portion unit' using errcode = '22023'; end if;
  if p_eaten_at is null or p_eaten_at > now() + interval '5 minutes' then raise exception 'Invalid time eaten' using errcode = '22023'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then raise exception 'User not found' using errcode = '42501'; end if;
  if p_photo is not null then
    if jsonb_typeof(p_photo) <> 'object'
       or coalesce(p_photo->>'path', '') !~ ('^' || p_user_id::text || '/[0-9a-f-]{36}/0[.]jpg$')
       or coalesce((p_photo->>'width')::int, 0) not between 1 and 4096
       or coalesce((p_photo->>'height')::int, 0) not between 1 and 4096 then
      raise exception 'Invalid pack photo' using errcode = '22023';
    end if;
    if not exists (select 1 from storage.objects where bucket_id = 'media' and name = p_photo->>'path')
       or not exists (select 1 from storage.objects where bucket_id = 'media' and name = regexp_replace(p_photo->>'path', '[.]jpg$', '.feed.jpg')) then
      raise exception 'Pack photo upload is incomplete' using errcode = '22023';
    end if;
  end if;
  if p_photo is not null then
    -- A lost response may retry the same completed upload. Claim that path once.
    perform pg_advisory_xact_lock(hashtextextended(p_photo->>'path', 0));
    select m.post_id into v_post from public.post_media m join public.posts p on p.id=m.post_id
      where m.storage_path=p_photo->>'path' and p.user_id=p_user_id limit 1;
    if found then return v_post; end if;
    -- Serialize claiming a stage against its delayed cleanup job. Once cleanup is
    -- eligible/running, an old upload cannot be attached to a newly created post.
    select status,run_after into v_cleanup_status,v_cleanup_due from public.jobs
      where kind='media_cleanup' and payload->>'owner_id'=p_user_id::text
        and payload->>'deleted_post_id'=split_part(p_photo->>'path','/',2)
      for update;
    if found and (v_cleanup_status<>'queued' or v_cleanup_due<=clock_timestamp()) then
      raise exception 'Pack photo expired; choose the photo again' using errcode='22023';
    end if;
  end if;
  -- Keep every photo under its actual post id, as required by correction authorization.
  v_post:=case when p_photo is null then gen_random_uuid() else split_part(p_photo->>'path','/',2)::uuid end;
  insert into public.posts (id, user_id, caption, eaten_at, status, analysis_initialized_at)
  values (v_post, p_user_id, v_name, p_eaten_at, 'ready', clock_timestamp());
  insert into public.post_items (post_id, name, portion_text, portion_grams, source)
  values (v_post, v_name, trim_scale(p_grams)::text || ' ' || v_unit, case when v_unit = 'g' then p_grams else null end, 'user') returning id into v_item;
  insert into public.item_nutrition (post_item_id, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g, sodium_mg, micronutrients, source_ref,food_category)
  values (v_item, (p_nutrition->>'calories')::numeric, (p_nutrition->>'protein_g')::numeric, (p_nutrition->>'carbs_g')::numeric,
    (p_nutrition->>'fat_g')::numeric, (p_nutrition->>'fibre_g')::numeric, (p_nutrition->>'sugar_g')::numeric,
    (p_nutrition->>'sodium_mg')::numeric, coalesce(p_nutrition->'micronutrients', '[]'::jsonb), p_nutrition->>'source_ref',p_nutrition->>'food_category');
  if p_photo is not null then
    insert into public.post_media(post_id, storage_path, position, width, height, kind)
    values (v_post, p_photo->>'path', 0, (p_photo->>'width')::int, (p_photo->>'height')::int, 'photo');
  end if;
  return v_post;
end;
$$;

-- Keep owner access identical: linked records are server-owned.
alter policy intake_owner_select on public.intake_logs using (auth.uid()=user_id);
alter policy intake_owner_insert on public.intake_logs with check (auth.uid()=user_id and post_id is null and source='sheet' and post_item_id is null);
alter policy intake_owner_delete on public.intake_logs using (auth.uid()=user_id and post_id is null);
