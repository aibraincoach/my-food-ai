-- #1226: refresh the current comment when a nutrition gap appears, changes or is filled.
-- SQL only: apply only with owner authorization, after 0075. No backfill.
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
  and position('Nutrition unavailable: ' in p_summary)=0 and position('Calories unavailable for ' in p_summary)=0 and position('Missing ' in p_summary)=0
  and position(' is taken from the closest USDA record, ' in p_summary)=0 and position(' is a model estimate, ' in p_summary)=0 and position('The model did not treat “' in p_summary)=0 and position('No USDA record matched “' in p_summary)=0
  and not exists(select 1 from public.post_comments where id=revision_comment
   and (position('Nutrition unavailable: ' in body)>0 or position('Calories unavailable for ' in body)>0 or position('Missing ' in body)>0 or position(' is taken from the closest USDA record, ' in body)>0 or position(' is a model estimate, ' in body)>0 or position('The model did not treat “' in body)>0 or position('No USDA record matched “' in body)>0)) then return;end if;
 -- #989: a meal with no model comment (a barcode or label meal) has no summary to rewrite. Before 0066 an
 -- operator re-match of such a meal failed here with "Nutrition summary is missing".
 if revision_comment is null then return;end if;
 update public.post_comments set body=p_summary
 where id=revision_comment;
 get diagnostics changed=row_count;
 if changed<>1 then raise exception 'Nutrition summary is missing' using errcode='22023';end if;
end $$;
revoke all on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) to service_role;
