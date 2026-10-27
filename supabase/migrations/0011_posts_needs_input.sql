-- 0001 already permits needs_input; preserve the existing status constraint.
alter table public.posts add column needs_input jsonb;
create function public.persist_analysis_question(p_post_id uuid,p_items jsonb,p_summary text,p_question jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  perform public.persist_analysis(p_post_id,p_items,p_question->>'question');
  update public.posts set status=case when exists (
    select 1 from public.jobs where post_id=p_post_id and kind='correct' and status in ('queued','running')
      and not coalesce((payload->>'correction_applied')::boolean,false)
  ) then 'queued' else 'needs_input' end,needs_input=p_question where id=p_post_id;
  if not exists(select 1 from post_comments where post_id=p_post_id and author='model' and body=p_question->>'question') then
    insert into post_comments(post_id,author,body) values(p_post_id,'model',p_question->>'question');
  end if;
end $$;
revoke all on function public.persist_analysis_question(uuid,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.persist_analysis_question(uuid,jsonb,text,jsonb) to service_role;
create function public.persist_correction_question(p_post_id uuid,p_job_id uuid,p_expected uuid[],p_through uuid,p_items jsonb,p_reply text,p_question jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if not public.persist_correction(p_post_id,p_job_id,p_expected,p_through,p_items,p_question->>'question') then return; end if;
  -- A message arriving during the model call already has follow-up work.
  -- Keep its queued state instead of hiding it behind the older question.
  update public.posts set status=case when exists (
    select 1 from public.jobs where post_id=p_post_id and kind='correct' and status in ('queued','running')
      and not coalesce((payload->>'correction_applied')::boolean,false)
  ) then 'queued' else 'needs_input' end,needs_input=p_question where id=p_post_id;
end $$;
revoke all on function public.persist_correction_question(uuid,uuid,uuid[],uuid,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.persist_correction_question(uuid,uuid,uuid[],uuid,jsonb,text,jsonb) to service_role;

-- Do not publish an older render over a question, even if its item fingerprint matches.
create or replace function public.publish_results_card(p_post_id uuid, p_fingerprint text, p_storage_path text, p_size integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_snapshot jsonb; v_old text; v_position integer; v_owner uuid; v_status text;
begin
  select user_id,status into v_owner,v_status from public.posts where id = p_post_id for update;
  if not found or v_status='needs_input' or exists (
    select 1 from public.jobs where post_id=p_post_id and kind='correct' and status in ('queued','running')
      and not coalesce((payload->>'correction_applied')::boolean,false)
  ) then return jsonb_build_object('published', false); end if;
  v_snapshot := public.results_card_snapshot(p_post_id);
  if v_snapshot->>'fingerprint' is distinct from p_fingerprint or exists (
    select 1 from jsonb_array_elements(v_snapshot->'items') e where e->'nutrition' = 'null'::jsonb
  ) then return jsonb_build_object('published', false); end if;
  if p_storage_path not like v_owner::text || '/' || p_post_id::text || '/cards/%/card.png' or p_size <> 1080 then
    raise exception 'Invalid card path or dimensions';
  end if;
  select storage_path into v_old from public.post_media where post_id = p_post_id and kind = 'card';
  select coalesce(max(position) + 1, 0) into v_position from public.post_media where post_id = p_post_id and kind = 'photo';
  insert into public.post_media(post_id, kind, storage_path, position, width, height)
  values(p_post_id, 'card', p_storage_path, v_position, p_size, p_size)
  on conflict(post_id) where kind = 'card' do update set storage_path = excluded.storage_path,
    position = excluded.position, width = excluded.width, height = excluded.height;
  update public.posts set status = 'ready', fail_reason = null where id = p_post_id;
  return jsonb_build_object('published', true, 'old_path', v_old);
end;
$$;
revoke all on function public.publish_results_card(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.publish_results_card(uuid, text, text, integer) to service_role;

