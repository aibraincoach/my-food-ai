-- 0001 already permits needs_input; preserve the existing status constraint.
alter table public.posts add column needs_input jsonb;
create function public.persist_analysis_question(p_post_id uuid,p_items jsonb,p_summary text,p_question jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  perform public.persist_analysis(p_post_id,p_items,p_summary);
  update public.posts set status='needs_input',needs_input=p_question where id=p_post_id;
  if not exists(select 1 from post_comments where post_id=p_post_id and author='model' and body=p_question->>'question') then
    insert into post_comments(post_id,author,body) values(p_post_id,'model',p_question->>'question');
  end if;
end $$;
revoke all on function public.persist_analysis_question(uuid,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.persist_analysis_question(uuid,jsonb,text,jsonb) to service_role;
create function public.persist_correction_question(p_post_id uuid,p_job_id uuid,p_expected uuid[],p_through uuid,p_items jsonb,p_reply text,p_question jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  perform public.persist_correction(p_post_id,p_job_id,p_expected,p_through,p_items,p_reply);
  update public.posts set status='needs_input',needs_input=p_question where id=p_post_id;
  insert into post_comments(post_id,author,body) values(p_post_id,'model',p_question->>'question');
end $$;
revoke all on function public.persist_correction_question(uuid,uuid,uuid[],uuid,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.persist_correction_question(uuid,uuid,uuid[],uuid,jsonb,text,jsonb) to service_role;
