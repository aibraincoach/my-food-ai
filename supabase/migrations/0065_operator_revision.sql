-- #985: after an operator re-analysis or re-match (scripts/numbers), the meal's summary comment and
-- its saved-meal copy follow the new numbers. Ordinary analysis, corrections and recomputes are unchanged:
-- every new rule below applies only to a job whose payload carries "operator".
create or replace function public.persist_approximated_analysis(
 p_post_id uuid,p_job_id uuid,p_items jsonb,p_summary text,p_needs_input jsonb default null,
 p_identify_model text default null,p_identify_host text default null,p_is_label boolean default false
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare initialized timestamptz;
begin
 select analysis_initialized_at into initialized from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 -- These functions enforce the active job fence before any item/comment write.
 if p_identify_model is not null then
  perform public.persist_identified_analysis(p_post_id,p_job_id,p_items,p_summary,p_needs_input,p_identify_model,p_identify_host,p_is_label);
 elsif p_is_label then
  perform public.persist_owned_label(p_post_id,p_job_id,p_items,p_summary,p_needs_input);
 else
  perform public.persist_owned_analysis(p_post_id,p_job_id,p_items,p_summary,p_needs_input);
 end if;
 -- A previously committed retry must not rewrite its authoritative summary.
 -- #985: an operator re-analysis (scripts/numbers/12-reanalyse.sql) always rewrites the first comment.
 if initialized is null and (
  exists(select 1 from public.jobs where id=p_job_id and payload ? 'operator') or
  (position(' is taken from the closest USDA record, ' in p_summary)>0 or position(' is a model estimate, ' in p_summary)>0 or position('The model did not treat “' in p_summary)>0 or position('No USDA record matched “' in p_summary)>0)
  or exists(select 1 from public.post_comments where id=(select id from public.post_comments where post_id=p_post_id and author='model' order by created_at,id limit 1)
   and (position(' is taken from the closest USDA record, ' in body)>0 or position(' is a model estimate, ' in body)>0 or position('The model did not treat “' in body)>0 or position('No USDA record matched “' in body)>0))
 ) then
  update public.post_comments set body=p_summary
  where id=(select id from public.post_comments where post_id=p_post_id and author='model' order by created_at,id limit 1);
 end if;
end $$;
revoke all on function public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean) from public,anon,authenticated;
grant execute on function public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean) to service_role;
create or replace function public.refresh_owned_approximation_summary(
 p_post_id uuid,p_job_id uuid,p_summary text,p_expected jsonb
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
 -- Resolve the same current model revision used by feedback, under the post lock.
 revision_comment:=(public.feedback_revision(p_post_id)->>'modelCommentId')::uuid;
 -- Older initial/correction comments stay untouched. Refresh on either side
 -- of the transition so removing the last approximate food clears its label.
 -- #985: an operator re-match (scripts/numbers/11-rematch.sql) always rewrites the comment.
 if not exists(select 1 from public.jobs where id=p_job_id and payload ? 'operator')
  and position(' is taken from the closest USDA record, ' in p_summary)=0 and position(' is a model estimate, ' in p_summary)=0 and position('The model did not treat “' in p_summary)=0 and position('No USDA record matched “' in p_summary)=0
  and not exists(select 1 from public.post_comments where id=revision_comment
   and (position(' is taken from the closest USDA record, ' in body)>0 or position(' is a model estimate, ' in body)>0 or position('The model did not treat “' in body)>0 or position('No USDA record matched “' in body)>0)) then return;end if;
 update public.post_comments set body=p_summary
 where id=revision_comment;
 get diagnostics changed=row_count;
 if changed<>1 then raise exception 'Nutrition summary is missing' using errcode='22023';end if;
end $$;
revoke all on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) to service_role;
-- The saved-meal copy of a meal is rebuilt by the one function that builds it, save_meal_from_post,
-- under the owner's identity as save_ready_meal does. Returns the number of copies refreshed.
create function public.refresh_operator_saved_meal(p_post_id uuid,p_job_id uuid) returns integer
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_post public.posts; v_saved record; v_claims text; refreshed integer:=0;
begin
 select * into v_post from public.posts where id=p_post_id and status='ready' and deleted_at is null for update;
 if not found then return 0;end if;
 if not exists(select 1 from public.jobs where id=p_job_id and post_id=p_post_id and payload ? 'operator') then return 0;end if;
 if not exists(select 1 from public.current_post_items where post_id=p_post_id) then return 0;end if;
 v_claims:=current_setting('request.jwt.claims',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_post.user_id,'role','authenticated')::text,true);
 for v_saved in select id,name from public.saved_meals where source_post_id=p_post_id and user_id=v_post.user_id loop
  perform public.save_meal_from_post(p_post_id,v_saved.name);
  refreshed:=refreshed+1;
 end loop;
 perform set_config('request.jwt.claims',coalesce(v_claims,''),true);
 return refreshed;
end $$;
revoke all on function public.refresh_operator_saved_meal(uuid,uuid) from public,anon,authenticated;
grant execute on function public.refresh_operator_saved_meal(uuid,uuid) to service_role;
