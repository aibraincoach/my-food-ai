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
 if initialized is null then
  update public.post_comments set body=p_summary
  where id=(select id from public.post_comments where post_id=p_post_id and author='model' order by created_at,id limit 1);
 end if;
end $$;
revoke all on function public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean) from public,anon,authenticated;
grant execute on function public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean) to service_role;
notify pgrst,'reload schema';
