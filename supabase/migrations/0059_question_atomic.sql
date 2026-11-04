-- #626: a question beside a published meal (#615) saves in one transaction with the meal's items,
-- its summary, the ready flip and the question's comment. Any failure rolls all of it back, and the
-- analyze job retries from a clean post. Additive: only the new persist path calls it.
create or replace function public.persist_analysis_with_question(
 p_post_id uuid,p_job_id uuid,p_items jsonb,p_summary text,p_question jsonb,
 p_identify_model text default null,p_identify_host text default null,p_is_label boolean default false
) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_question is null or jsonb_typeof(p_question)<>'object' then raise exception 'A question is required' using errcode='22023';end if;
 -- Items, nutrition and summary, behind the same job fence as every other analysis.
 perform public.persist_approximated_analysis(p_post_id,p_job_id,p_items,p_summary,null,p_identify_model,p_identify_host,p_is_label);
 -- A comment that arrived first queued a correction; that correction publishes the meal and answers it.
 if not public.mark_post_ready(p_post_id,p_job_id) then return false;end if;
 update public.posts set question=p_question where id=p_post_id;
 if not exists(select 1 from public.post_comments where post_id=p_post_id and author='model' and body=p_question->>'question') then
  insert into public.post_comments(post_id,author,body) values(p_post_id,'model',p_question->>'question');
 end if;
 return true;
end $$;
revoke all on function public.persist_analysis_with_question(uuid,uuid,jsonb,text,jsonb,text,text,boolean) from public,anon,authenticated;
grant execute on function public.persist_analysis_with_question(uuid,uuid,jsonb,text,jsonb,text,text,boolean) to service_role;
