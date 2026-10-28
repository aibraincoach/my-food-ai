-- Card rendering is optional: a meal becomes ready on its nutrition alone, and a failed render
-- invalidates the old card through an owner- and worker-checked RPC. Apply after 0013.

-- Ready without a card. Same gates as publish_results_card (status, worker ownership, pending
-- corrections, unanswered question, complete nutrition) minus the card itself.
create function public.complete_post_without_card(p_post_id uuid, p_job_id uuid default null)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_status text; v_question jsonb; v_question_sequence bigint;
begin
  select status, needs_input into v_status, v_question from public.posts where id = p_post_id for update;
  if not found or v_status in ('failed','needs_input') then return false; end if;
  if not public.post_work_matches(p_post_id, p_job_id) then return false; end if;
  if exists (
    select 1 from public.jobs where post_id = p_post_id and kind = 'correct' and status in ('queued','running')
      and not coalesce((payload->>'correction_applied')::boolean, false)
  ) then
    update public.posts set status = case when status in ('processing','needs_input') then status else 'queued' end where id = p_post_id;
    return false;
  end if;
  if v_question is not null then
    select coalesce(max((payload->>'correction_sequence')::bigint), 0) into v_question_sequence
      from public.jobs where post_id = p_post_id and kind = 'correct' and payload->>'needs_input_question' = 'true';
    if not exists (select 1 from public.jobs where post_id = p_post_id and kind = 'correct'
      and payload->>'correction_applied' = 'true' and not coalesce((payload->>'needs_input_question')::boolean, false)
      and (payload->>'correction_sequence')::bigint > v_question_sequence) then
      update public.posts set status = 'needs_input' where id = p_post_id;
      return false;
    end if;
  end if;
  if exists (select 1 from public.current_post_items i left join public.item_nutrition n on n.post_item_id = i.id
    where i.post_id = p_post_id and n.post_item_id is null) then return false; end if;
  update public.posts set status = 'ready', fail_reason = null, needs_input = null where id = p_post_id;
  return true;
end;
$$;
revoke all on function public.complete_post_without_card(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_post_without_card(uuid, uuid) to service_role;

-- Remove the stored card pointer after a failed regeneration, so the feed shows live nutrition and the
-- backfill job recreates the card. The post is locked, the caller must still own the meal's work, and
-- only the exact generation it read (p_expected_path) is removed. The returned path is the only object
-- a caller may delete from storage, and only when it is a generated card of this owner's meal.
create function public.invalidate_results_card(p_post_id uuid, p_job_id uuid, p_expected_path text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid; v_removed text;
begin
  select user_id into v_owner from public.posts where id = p_post_id for update;
  if not found then return null; end if;
  if not public.post_work_matches(p_post_id, p_job_id) then return null; end if;
  delete from public.post_media where post_id = p_post_id and kind = 'card' and storage_path = p_expected_path
    returning storage_path into v_removed;
  if v_removed is null then return null; end if;
  if v_removed !~ ('^' || v_owner::text || '/' || p_post_id::text ||
    '/cards/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/card[.]png$') then
    return null;
  end if;
  return v_removed;
end;
$$;
revoke all on function public.invalidate_results_card(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.invalidate_results_card(uuid, uuid, text) to service_role;
