-- #1219 A. Additive only: apply before the app switch, by RT yes + PM order.
-- Old body rows and text overloads are untouched. No history rebuild or English parsing.
begin;
-- 0082 must already be applied; the file on main alone is not a database apply.
do $$ begin
 if to_regprocedure('public.require_capture_zone(text)') is null
  or to_regprocedure('public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,text,jsonb,jsonb)') is null
  or to_regprocedure('public.publish_drink_operation(uuid,uuid,text,timestamptz,text,integer,text,integer,jsonb,text)') is null
  or to_regprocedure('public.publish_photo_drink_operation(uuid,uuid,text,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,text,jsonb,text)') is null
  or to_regprocedure('public.publish_copy_operation(uuid,uuid,boolean,timestamptz,text)') is null
  or to_regprocedure('public.agent_log_meal(uuid,uuid,text,timestamptz,text)') is null then
  raise exception '0084 requires applied 0082 atomic zone overloads first' using errcode='22023';
 end if;
end $$;
alter table public.post_comments add column message jsonb;
alter table public.post_comments alter column body drop not null;
alter table public.post_comments add constraint post_comment_one_content check (
 (body is not null and message is null) or
 coalesce((body is null and message is not null and author='model' and jsonb_typeof(message)='object'
  and message->>'code' in ('mealSummary','editRemoved','editAdded','editRenamed','editPortion','productCorrected')
  and jsonb_typeof(message->'values')='object'),false)
);
alter table public.post_comments add constraint post_comments_post_and_id unique(post_id,id);
alter table public.posts add column summary_comment_id uuid;
alter table public.posts add constraint posts_summary_same_post foreign key(id,summary_comment_id)
 references public.post_comments(post_id,id) on delete set null(summary_comment_id);
create function public.protect_summary_pointer() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if current_user in ('anon','authenticated') and ((tg_op='INSERT' and new.summary_comment_id is not null)
  or (tg_op='UPDATE' and new.summary_comment_id is distinct from old.summary_comment_id)) then
  raise exception 'Summary pointer is server owned' using errcode='42501';
 end if;
 if new.summary_comment_id is not null and not exists(select 1 from public.post_comments c
  where c.id=new.summary_comment_id and c.post_id=new.id and c.author='model' and c.message->>'code'='mealSummary') then
  raise exception 'Invalid summary pointer' using errcode='22023';
 end if;
 return new;
end $$;
create trigger protect_summary_pointer before insert or update of summary_comment_id on public.posts
 for each row execute function public.protect_summary_pointer();
create function public.require_meal_summary(p_message jsonb) returns void
language plpgsql immutable set search_path=public,pg_temp as $$
begin
 if jsonb_typeof(p_message) is distinct from 'object' or p_message->>'code' is distinct from 'mealSummary'
  or jsonb_typeof(p_message->'values') is distinct from 'object'
  or coalesce(p_message#>>'{values,kind}','') not in ('consumed','removal','leftovers') then
  raise exception 'A structured meal summary is required' using errcode='22023';
 end if;
end $$;
create function public.append_meal_summary(p_post_id uuid,p_message jsonb) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare summary_id uuid;
begin
 perform public.require_meal_summary(p_message);
 perform 1 from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post missing' using errcode='42501';end if;
 insert into public.post_comments(post_id,author,message) values(p_post_id,'model',p_message) returning id into summary_id;
 update public.posts set summary_comment_id=summary_id where id=p_post_id;
 return summary_id;
end $$;

create function public.persist_analysis_initial(
  p_post_id uuid,
  p_items jsonb,
  p_message jsonb
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
  if p_message is null then
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

  perform public.append_meal_summary(p_post_id,p_message);

  update public.posts set status = 'ready' where id = p_post_id;
end;
$$;
revoke all on function public.persist_analysis_initial(uuid,jsonb,jsonb) from public,anon,authenticated,service_role;

create function public.persist_analysis(p_post_id uuid,p_items jsonb,p_message jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare initialized timestamptz;
begin
 select analysis_initialized_at into initialized from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 if initialized is not null then return;end if;
 perform public.persist_analysis_initial(p_post_id,p_items,p_message);
 update public.posts set analysis_initialized_at=clock_timestamp() where id=p_post_id;

end $$;
revoke all on function public.persist_analysis(uuid,jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.persist_analysis(uuid,jsonb,jsonb) to service_role;

create function public.persist_analysis_question(p_post_id uuid,p_items jsonb,p_message jsonb,p_question jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare initialized timestamptz;
begin
  select analysis_initialized_at into initialized from public.posts where id=p_post_id for update;
  if not found then raise exception 'Post not found' using errcode='42501';end if;
  if initialized is not null then return;end if;
  perform public.persist_analysis(p_post_id,p_items,p_message);
  update public.posts set status=case when exists (
    select 1 from public.jobs where post_id=p_post_id and kind='correct' and status in ('queued','running')
      and not coalesce((payload->>'correction_applied')::boolean,false)
  ) then 'queued' else 'needs_input' end,needs_input=p_question where id=p_post_id;
  if not exists(select 1 from post_comments where post_id=p_post_id and author='model' and body=p_question->>'question') then
    insert into post_comments(post_id,author,body) values(p_post_id,'model',p_question->>'question');
  end if;
end $$;
revoke all on function public.persist_analysis_question(uuid,jsonb,jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.persist_analysis_question(uuid,jsonb,jsonb,jsonb) to service_role;

create function public.persist_owned_analysis(p_post_id uuid,p_job_id uuid,p_items jsonb,p_message jsonb,p_needs_input jsonb default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not public.post_work_matches(p_post_id,p_job_id) then raise exception 'Analysis job no longer owns this meal' using errcode='40001';end if;
 if p_needs_input is null then perform public.persist_analysis(p_post_id,p_items,p_message);
 else perform public.persist_analysis_question(p_post_id,p_items,p_message,p_needs_input);end if;
end $$;
revoke all on function public.persist_owned_analysis(uuid,uuid,jsonb,jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.persist_owned_analysis(uuid,uuid,jsonb,jsonb,jsonb) to service_role;

create function public.persist_owned_label(p_post_id uuid,p_job_id uuid,p_items jsonb,p_message jsonb,p_needs_input jsonb default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform public.persist_owned_analysis(p_post_id,p_job_id,p_items,p_message,p_needs_input);
 update public.post_items i set source='user' where i.post_id=p_post_id and i.superseded_at is null
  and exists(select 1 from public.item_nutrition n where n.post_item_id=i.id and n.source_ref='label');
end $$;
revoke all on function public.persist_owned_label(uuid,uuid,jsonb,jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.persist_owned_label(uuid,uuid,jsonb,jsonb,jsonb) to service_role;

create function public.persist_identified_analysis(
 p_post_id uuid,p_job_id uuid,p_items jsonb,p_message jsonb,p_needs_input jsonb default null,
 p_identify_model text default null,p_identify_host text default null,p_is_label boolean default false
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare initialized timestamptz;
begin
 select analysis_initialized_at into initialized from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 -- Delegate the existing owner fence, initialization marker and item transaction.
 -- A replay is a no-op for the meal and must also be a no-op for its identity.
 if p_is_label then
  perform public.persist_owned_label(p_post_id,p_job_id,p_items,p_message,p_needs_input);
 else
  perform public.persist_owned_analysis(p_post_id,p_job_id,p_items,p_message,p_needs_input);
 end if;
 if initialized is null then
  update public.posts set identify_model=p_identify_model,identify_host=p_identify_host
   where id=p_post_id and analysis_initialized_at is not null;
 end if;
end $$;
revoke all on function public.persist_identified_analysis(uuid,uuid,jsonb,jsonb,jsonb,text,text,boolean) from public,anon,authenticated,service_role;
grant execute on function public.persist_identified_analysis(uuid,uuid,jsonb,jsonb,jsonb,text,text,boolean) to service_role;

create function public.persist_approximated_analysis(
 p_post_id uuid,p_job_id uuid,p_items jsonb,p_message jsonb,p_needs_input jsonb default null,
 p_identify_model text default null,p_identify_host text default null,p_is_label boolean default false
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare initialized timestamptz;
begin
 select analysis_initialized_at into initialized from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 -- These functions enforce the active job fence before any item/comment write.
 if p_identify_model is not null then
  perform public.persist_identified_analysis(p_post_id,p_job_id,p_items,p_message,p_needs_input,p_identify_model,p_identify_host,p_is_label);
 elsif p_is_label then
  perform public.persist_owned_label(p_post_id,p_job_id,p_items,p_message,p_needs_input);
 else
  perform public.persist_owned_analysis(p_post_id,p_job_id,p_items,p_message,p_needs_input);
 end if;
end $$;
revoke all on function public.persist_approximated_analysis(uuid,uuid,jsonb,jsonb,jsonb,text,text,boolean) from public,anon,authenticated,service_role;
grant execute on function public.persist_approximated_analysis(uuid,uuid,jsonb,jsonb,jsonb,text,text,boolean) to service_role;

create function public.persist_analysis_with_question(
 p_post_id uuid,p_job_id uuid,p_items jsonb,p_message jsonb,p_question jsonb,
 p_identify_model text default null,p_identify_host text default null,p_is_label boolean default false
) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_question is null or jsonb_typeof(p_question)<>'object' then raise exception 'A question is required' using errcode='22023';end if;
 -- Items, nutrition and summary, behind the same job fence as every other analysis.
 perform public.persist_approximated_analysis(p_post_id,p_job_id,p_items,p_message,null,p_identify_model,p_identify_host,p_is_label);
 -- A comment that arrived first queued a correction; that correction publishes the meal and answers it.
 if not public.mark_post_ready(p_post_id,p_job_id) then return false;end if;
 update public.posts set question=p_question where id=p_post_id;
 if not exists(select 1 from public.post_comments where post_id=p_post_id and author='model' and body=p_question->>'question') then
  insert into public.post_comments(post_id,author,body) values(p_post_id,'model',p_question->>'question');
 end if;
 return true;
end $$;
revoke all on function public.persist_analysis_with_question(uuid,uuid,jsonb,jsonb,jsonb,text,text,boolean) from public,anon,authenticated,service_role;
grant execute on function public.persist_analysis_with_question(uuid,uuid,jsonb,jsonb,jsonb,text,text,boolean) to service_role;

create function public.refresh_owned_approximation_summary(
 p_post_id uuid,p_job_id uuid,p_message jsonb,p_expected jsonb
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare changed integer; expected_count integer; current_count integer; matched_count integer; revision_comment uuid;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found or not public.post_work_matches(p_post_id,p_job_id) then
  raise exception 'Nutrition summary job no longer owns this meal' using errcode='PT409';
 end if;
 if p_expected is null or jsonb_typeof(p_expected)<>'array' then raise exception 'Current items are required' using errcode='22023';end if;
 expected_count:=jsonb_array_length(p_expected);
 select count(*) into current_count from public.current_post_items where post_id=p_post_id;
 select count(*) into matched_count from public.current_post_items i
 join public.item_nutrition n on n.post_item_id=i.id
 where i.post_id=p_post_id and exists(select 1 from jsonb_array_elements(p_expected) e
  where (e->>'id')::uuid=i.id and (e->>'source_ref') is not distinct from n.source_ref);
 if current_count<>expected_count or matched_count<>expected_count then
  raise exception 'Nutrition summary items changed' using errcode='PT409';
 end if;
 perform public.require_meal_summary(p_message);
 select summary_comment_id into revision_comment from public.posts where id=p_post_id;
 if revision_comment is null then return;end if;
 -- A code guard replaces the old prose search. Never select latest model/question.
 if not exists(select 1 from public.post_comments where id=revision_comment and post_id=p_post_id
  and author='model' and message->>'code'='mealSummary') then
  raise exception 'Pointed summary has an invalid code' using errcode='22023';
 end if;
 update public.post_comments set message=p_message where id=revision_comment and post_id=p_post_id;
end $$;
revoke all on function public.refresh_owned_approximation_summary(uuid,uuid,jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.refresh_owned_approximation_summary(uuid,uuid,jsonb,jsonb) to service_role;

create function public.persist_correction(p_post_id uuid,p_job_id uuid,p_expected uuid[],p_through uuid,p_items jsonb,p_message jsonb)
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
 if jsonb_typeof(p_items)<>'array' or p_message is null then raise exception 'Invalid correction' using errcode='22023'; end if;
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
 perform public.append_meal_summary(p_post_id,p_message);
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
revoke all on function public.persist_correction(uuid,uuid,uuid[],uuid,jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.persist_correction(uuid,uuid,uuid[],uuid,jsonb,jsonb) to service_role;

create function public.apply_post_remainder(p_post_id uuid,p_job_id uuid,p_photo_id uuid,p_expected uuid[],p_items jsonb,p_message jsonb) returns boolean
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
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)<>cardinality(p_expected) or p_message is null or octet_length(p_message::text)>100000 then raise exception 'Invalid not-eaten revision' using errcode='22023';end if;
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
 perform public.append_meal_summary(p_post_id,p_message);
 update public.jobs set payload=payload||jsonb_build_object('remainder_applied',true,'leftover_items',p_items,'leftover_message',p_message) where id=p_job_id;
 return true;
end $$;
revoke all on function public.apply_post_remainder(uuid,uuid,uuid,uuid[],jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.apply_post_remainder(uuid,uuid,uuid,uuid[],jsonb,jsonb) to service_role;

create function public.persist_photo_correction(p_post_id uuid,p_job_id uuid,p_expected uuid[],p_items jsonb,p_message jsonb,p_question jsonb default null)
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
 if jsonb_typeof(p_items) is distinct from 'array' or p_message is null or octet_length(p_message::text)>100000 then raise exception 'Invalid correction' using errcode='22023';end if;
 update public.post_items set superseded_at=now() where post_id=p_post_id and superseded_at is null;
 for row in select value from jsonb_array_elements(p_items) loop
  prior:=nullif(row->>'supersedes','')::uuid;
  if prior is not null and not(prior=any(coalesce(p_expected,array[]::uuid[]))) then raise exception 'Invalid source item' using errcode='22023';end if;
  insert into public.post_items(post_id,name,portion_text,portion_grams,box,mask_path,source,supersedes) values(p_post_id,row->>'name',row->>'portion_text',(row->>'portion_grams')::numeric,nullif(row->'box','null'::jsonb),row->>'mask_path','model',prior) returning id into fresh;
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref,food_category) values(fresh,(row#>>'{nutrition,calories}')::numeric,(row#>>'{nutrition,protein_g}')::numeric,(row#>>'{nutrition,carbs_g}')::numeric,(row#>>'{nutrition,fat_g}')::numeric,(row#>>'{nutrition,fibre_g}')::numeric,(row#>>'{nutrition,sugar_g}')::numeric,(row#>>'{nutrition,sodium_mg}')::numeric,coalesce(row#>'{nutrition,micronutrients}','[]'),row#>>'{nutrition,source_ref}',row#>>'{nutrition,food_category}');
 end loop;
 perform public.append_meal_summary(p_post_id,p_message);
 if p_question is not null then
  insert into public.post_comments(post_id,author,body,created_at) values(p_post_id,'model',p_question->>'question',clock_timestamp());
 end if;
 update public.jobs set payload=payload||jsonb_build_object('correction_applied',true,'correction_sequence',seq+1,'correction_pending_ids',to_jsonb(pending)) where id=p_job_id;
 update public.posts set status=case when p_question is null then 'processing' else 'needs_input' end,needs_input=p_question,fail_reason=null where id=p_post_id;
 if exists(select 1 from public.post_comments where post_id=p_post_id and author='user' and not(id=any(applied||pending))) then
  insert into public.jobs(post_id,kind,priority,status) select p_post_id,'correct',100,'queued' where not exists(select 1 from public.jobs where post_id=p_post_id and kind='correct' and status='queued');
  update public.posts set status='queued',needs_input=null where id=p_post_id;
 end if;
 return true;
end $$;
revoke all on function public.persist_photo_correction(uuid,uuid,uuid[],jsonb,jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.persist_photo_correction(uuid,uuid,uuid[],jsonb,jsonb,jsonb) to service_role;

create function public.persist_removed_rebuild(p_post_id uuid,p_job_id uuid,p_expected uuid[],p_comments uuid[],p_photos uuid[],p_items jsonb,p_message jsonb) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare actual uuid[]; row jsonb; n jsonb; new_id uuid; prior uuid;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found or not public.post_work_matches(p_post_id,p_job_id) then raise exception 'Rebuild no longer owns meal' using errcode='40001';end if;
 if exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id and payload->>'removal_rebuilt'='true') then return false;end if;
 if not exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id and kind='recompute' and status='running' and payload->>'reason' in ('media_removed','correction_reverted')) then raise exception 'Rebuild job missing' using errcode='42501';end if;
 select array_agg(id order by id) into actual from public.current_post_items where post_id=p_post_id;
 if actual is distinct from (select array_agg(id order by id) from unnest(p_expected) id) then raise exception 'Meal changed during rebuild' using errcode='40001';end if;
 select coalesce(array_agg(id order by created_at,id),'{}') into actual from public.post_comments where post_id=p_post_id and author='user' and reverted_at is null;
 if actual is distinct from p_comments then raise exception 'Corrections changed during rebuild' using errcode='40001';end if;
 select coalesce(array_agg(id order by position,id),'{}') into actual from public.post_media where post_id=p_post_id and kind='photo' and not_eaten;
 if actual is distinct from p_photos then raise exception 'Photos changed during rebuild' using errcode='40001';end if;
 if jsonb_typeof(p_items) is distinct from 'array' or octet_length(p_message::text)>100000 or p_message is null then raise exception 'Invalid rebuilt revision' using errcode='22023';end if;
 perform set_config('mfa.reset_leftovers','on',true);
 update public.post_items set superseded_at=clock_timestamp() where post_id=p_post_id and superseded_at is null;
 for row in select value from jsonb_array_elements(p_items) loop
  prior:=nullif(row->>'supersedes','')::uuid;
  if prior is not null and not(prior=any(p_expected)) then raise exception 'Invalid rebuild ancestor' using errcode='22023';end if;
  insert into public.post_items(post_id,name,portion_text,portion_grams,box,mask_path,source,gtin,not_eaten_grams,not_eaten_calories,count_text,not_eaten_count_text,supersedes)
   values(p_post_id,row->>'name',row->>'portion_text',(row->>'portion_grams')::numeric,row->'box',row->>'mask_path','model',row->>'gtin',(row->>'not_eaten_grams')::integer,(row->>'not_eaten_calories')::numeric,row->>'count_text',row->>'not_eaten_count_text',prior) returning id into new_id;
  n:=row->'nutrition';
  -- Copy additive nutrition fields (including the independent drink category)
  -- without depending on another Run 6 migration having been applied first.
  insert into public.item_nutrition select (jsonb_populate_record(null::public.item_nutrition,
   n||jsonb_build_object('post_item_id',new_id,'micronutrients',coalesce(n->'micronutrients','[]'::jsonb)))).*;
 end loop;
 perform public.append_meal_summary(p_post_id,p_message);
 update public.jobs set payload=payload||jsonb_build_object('removal_rebuilt',true) where id=p_job_id;
 -- Include these messages in future correction windows without re-applying them.
 insert into public.jobs(post_id,kind,status,priority,payload,finished_at)
 values(p_post_id,'correct','finished',100,jsonb_build_object('correction_applied',true,'correction_pending_ids',to_jsonb(p_comments),'correction_sequence',coalesce((select max((payload->>'correction_sequence')::bigint) from public.jobs where post_id=p_post_id and kind='correct' and payload->>'correction_applied'='true'),0)+1),now());
 perform set_config('mfa.reset_leftovers','off',true);
 return true;
end $$;
revoke all on function public.persist_removed_rebuild(uuid,uuid,uuid[],uuid[],uuid[],jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.persist_removed_rebuild(uuid,uuid,uuid[],uuid[],uuid[],jsonb,jsonb) to service_role;

create function public.persist_correction_question(p_post_id uuid,p_job_id uuid,p_expected uuid[],p_through uuid,p_items jsonb,p_message jsonb,p_question jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if not public.persist_correction(p_post_id,p_job_id,p_expected,p_through,p_items,p_message) then return; end if;
  insert into public.post_comments(post_id,author,body,created_at) values(p_post_id,'model',p_question->>'question',clock_timestamp());
  -- Persist the outcome in the same transaction as the question. A retry of
  -- this completed correction must not reinterpret it as an answered meal.
  update public.jobs set payload=payload||jsonb_build_object('needs_input_question',true)
    where id=p_job_id;
  -- A message arriving during the model call already has follow-up work.
  -- Keep its queued state instead of hiding it behind the older question.
  update public.posts set status=case when exists (
    select 1 from public.jobs where post_id=p_post_id and kind='correct' and status in ('queued','running')
      and not coalesce((payload->>'correction_applied')::boolean,false)
  ) then 'queued' else 'needs_input' end,needs_input=p_question where id=p_post_id;
end $$;
revoke all on function public.persist_correction_question(uuid,uuid,uuid[],uuid,jsonb,jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.persist_correction_question(uuid,uuid,uuid[],uuid,jsonb,jsonb,jsonb) to service_role;

create function public.publish_composer_drinks(p_upload_id uuid,p_user_id uuid,p_readings jsonb,p_caption text,p_eaten_at timestamptz,p_location jsonb,p_save_as_meal boolean,p_items jsonb,p_message jsonb,p_expected jsonb,p_render_zone text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.post_upload_drafts; r public.composer_drink_readings; choice jsonb; selection jsonb; drink jsonb; row_item jsonb;
 items jsonb:='[]'; positions integer[]:='{}'; indexes integer[]; ml numeric; idx integer; item_index integer:=0; result uuid; intake jsonb;
begin
 perform public.require_capture_zone(p_render_zone);
 perform pg_advisory_xact_lock(hashtextextended(p_upload_id::text,0));
 select * into d from public.post_upload_drafts where id=p_upload_id and user_id=p_user_id for update;
 if not found then raise exception 'Draft not found' using errcode='42501';end if;
 if d.published then
  if exists(select 1 from public.posts where id=d.id and user_id=p_user_id and deleted_at is null and analysis_initialized_at is not null) then
   perform 1 from public.posts where id=d.id for update;
   update public.posts set render_time_zone=p_render_zone where id=d.id and render_time_zone is null;
   if (select render_time_zone from public.posts where id=d.id) is distinct from p_render_zone then
    raise exception 'The capture time zone changed' using errcode='PT409';
   end if;
   return d.id;
  end if;
  raise exception 'Draft is no longer available' using errcode='PT409';
 end if;
 perform public.require_meal_summary(p_message);
 if jsonb_typeof(p_readings) is distinct from 'array' or jsonb_array_length(p_readings) not between 1 and 8
  or p_caption is null or length(p_caption)>2000 or p_eaten_at is null or p_eaten_at>clock_timestamp()+interval '5 minutes'
  or jsonb_typeof(p_items) is distinct from 'array' or jsonb_typeof(p_expected) is distinct from 'object' or p_message is null or octet_length(p_message::text)>100000
  or cardinality(d.not_eaten_positions)>0 then raise exception 'Invalid drink selection' using errcode='22023';end if;
 for choice in select value from jsonb_array_elements(p_readings) loop
  select * into r from public.composer_drink_readings where id=(choice->>'reading_id')::uuid and user_id=p_user_id and upload_id=p_upload_id and state='ready' and all_drinks for update;
  if not found then raise exception 'Drink reading not found' using errcode='42501';end if;
  if r.drinks is distinct from p_expected->r.id::text then raise exception 'Drink reading changed' using errcode='PT409';end if;
  if r.position=any(positions) then raise exception 'Duplicate photo selection' using errcode='22023';end if;
  positions:=array_append(positions,r.position); indexes:='{}';
  if jsonb_typeof(choice->'selections') is distinct from 'array' then raise exception 'Invalid drink portions' using errcode='22023';end if;
  for selection in select value from jsonb_array_elements(choice->'selections') loop
   idx:=(selection->>'index')::integer; ml:=(selection->>'ml')::numeric;
   if idx is null or idx<0 or idx>=jsonb_array_length(r.drinks) or idx=any(indexes) or ml is null or ml not between 1 and 5000
    or (selection->>'index')::numeric<>idx then raise exception 'Invalid drink portion' using errcode='22023';end if;
   indexes:=array_append(indexes,idx); drink:=r.drinks->idx;
   -- The service supplies nutrition calculated from this exact locked reading,
   -- using the same scaler/summary formatter as the client and feed. Client
   -- roles cannot execute this function or supply their own item nutrition.
   row_item:=p_items->item_index;
   if row_item is null or row_item->>'name' is distinct from drink->>'name'
    or row_item->>'portion_text' is distinct from trim_scale(ml)::text||' ml'
    or jsonb_typeof(row_item->'nutrition') is distinct from 'object'
    then raise exception 'Selected drink changed' using errcode='22023';end if;
   if exists(select 1 from jsonb_array_elements(row_item#>'{nutrition,micronutrients}') where (value->>'nutrientId')::integer=1057 and (value->>'value')::numeric>1000) then raise exception 'Caffeine portion too large' using errcode='22023';end if;
   items:=items||jsonb_build_array(row_item);item_index:=item_index+1;
  end loop;
 end loop;
 if cardinality(positions)<>jsonb_array_length(d.shots) or exists(select 1 from generate_series(0,jsonb_array_length(d.shots)-1) s where not s=any(positions))
  or jsonb_array_length(items) not between 1 and 40 or jsonb_array_length(p_items)<>item_index then raise exception 'Select the drinks for every photo' using errcode='22023';end if;
 update public.post_upload_drafts set caption=p_caption,eaten_at=p_eaten_at,location=p_location,save_as_meal=p_save_as_meal where id=d.id;
 -- The normal publication checks uploaded originals/feed copies, expiry and the
 -- cleanup lease. Its analyze job never becomes externally visible in this txn.
 result:=public.publish_uploaded_post(p_upload_id,p_user_id);
 update public.posts set render_time_zone=p_render_zone where id=result;
 delete from public.jobs where id=result and post_id=result and kind='analyze' and status='queued';
 perform public.persist_analysis(result,items,p_message);
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
revoke all on function public.publish_composer_drinks(uuid,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,jsonb,jsonb,text) from public,anon,authenticated,service_role;
grant execute on function public.publish_composer_drinks(uuid,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,jsonb,jsonb,text) to service_role;

create function public.publish_photo_drink_operation(p_operation_id uuid,p_user_id uuid,p_request_key text,p_upload_id uuid,p_readings jsonb,p_caption text,p_eaten_at timestamptz,p_location jsonb,p_save_as_meal boolean,p_items jsonb,p_message jsonb,p_expected jsonb,p_render_zone text)
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
  perform 1 from public.posts where id=receipt.post_id for update;
  -- C1 may have committed its receipt before its separate zone save failed.
  -- Repair a missing zone with this explicit retry value; never overwrite one.
  update public.posts set render_time_zone=p_render_zone where id=receipt.post_id and render_time_zone is null;
  if (select render_time_zone from public.posts where id=receipt.post_id) is distinct from p_render_zone then
   raise exception 'The capture time zone changed' using errcode='PT409';
  end if;
  return receipt.post_id;
 end if;
 perform public.require_meal_summary(p_message);
 select * into draft from public.post_upload_drafts where id=p_upload_id and user_id=p_user_id for update;
 if not found then raise exception 'Photo draft not found' using errcode='42501';end if;
 select * into receipt from public.drink_post_operations where upload_id=p_upload_id for update;
 if found then
  if receipt.cancelled then raise exception 'Pending drink removed' using errcode='PT410';end if;
  raise exception 'Photo already belongs to another drink intent' using errcode='PT409';
 end if;
 if draft.published or exists(select 1 from public.posts where id=p_upload_id) then raise exception 'Photo already posted' using errcode='PT409';end if;
 result:=public.publish_composer_drinks(p_upload_id,p_user_id,p_readings,p_caption,p_eaten_at,p_location,p_save_as_meal,p_items,p_message,p_expected,p_render_zone);
 insert into public.drink_post_operations(operation_id,user_id,kind,request_key,upload_id,post_id)values(p_operation_id,p_user_id,'photo',p_request_key,p_upload_id,result);
 return result;
end $$;
revoke all on function public.publish_photo_drink_operation(uuid,uuid,text,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,jsonb,jsonb,text) from public,anon,authenticated,service_role;
grant execute on function public.publish_photo_drink_operation(uuid,uuid,text,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,jsonb,jsonb,text) to service_role;

create function public.correct_barcode_item(p_post uuid,p_user uuid,p_gtin text,p_name text,p_amount numeric,p_unit text,p_nutrition jsonb,p_message jsonb)
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
 if p_message->>'code' is distinct from 'productCorrected' or p_message#>>'{values,name}' is distinct from p_name then raise exception 'Invalid product note' using errcode='22023';end if;
 insert into public.post_comments(post_id,author,message) values(p_post,'model',p_message);
 return fresh;
end $$;
revoke all on function public.correct_barcode_item(uuid,uuid,text,text,numeric,text,jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.correct_barcode_item(uuid,uuid,text,text,numeric,text,jsonb,jsonb) to service_role;

revoke all on function public.protect_summary_pointer() from public,anon,authenticated,service_role;

revoke all on function public.require_meal_summary(jsonb) from public,anon,authenticated,service_role;

revoke all on function public.append_meal_summary(uuid,jsonb) from public,anon,authenticated,service_role;

notify pgrst,'reload schema';
commit;
