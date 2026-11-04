-- Re-analysis keeps its first model comment; refresh it in the same owned
-- transaction as the closest-record nutrition, before ready is visible.
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
 if initialized is null and (
  position(' is taken from the closest USDA record, ' in p_summary)>0
  or exists(select 1 from public.post_comments where id=(select id from public.post_comments where post_id=p_post_id and author='model' order by created_at,id limit 1)
   and position(' is taken from the closest USDA record, ' in body)>0)
 ) then
  update public.post_comments set body=p_summary
  where id=(select id from public.post_comments where post_id=p_post_id and author='model' order by created_at,id limit 1);
 end if;
end $$;
revoke all on function public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean) from public,anon,authenticated;
grant execute on function public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean) to service_role;
-- Recompute may have written nutrition before a failed summary attempt. Its
-- retry can repair the label only while it still owns the same current items.
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
 if position(' is taken from the closest USDA record, ' in p_summary)=0
  and not exists(select 1 from public.post_comments where id=revision_comment
   and position(' is taken from the closest USDA record, ' in body)>0) then return;end if;
 update public.post_comments set body=p_summary
 where id=revision_comment;
 get diagnostics changed=row_count;
 if changed<>1 then raise exception 'Nutrition summary is missing' using errcode='22023';end if;
end $$;
revoke all on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) to service_role;
notify pgrst,'reload schema';
