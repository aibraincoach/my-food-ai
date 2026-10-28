-- Card rendering is optional: a meal becomes ready on its nutrition alone. Completing the meal also
-- detaches its old card atomically, under the same post lock and worker-ownership check, so an outdated
-- card is never shown beside new nutrition and the backfill (which selects ready posts without a card)
-- repairs any failed regeneration. Apply after 0013.

-- Ready without a card. Same gates as publish_results_card (status, worker ownership, pending
-- corrections, unanswered question, complete nutrition) minus the card itself. Returns
-- {ready, old_card_path}: old_card_path is the detached card's object, returned only when it is a
-- generated card of this owner's meal, for the caller to delete from storage after the commit.
create function public.complete_post_without_card(p_post_id uuid, p_job_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_status text; v_question jsonb; v_question_sequence bigint; v_owner uuid; v_old text;
begin
  select status, needs_input, user_id into v_status, v_question, v_owner from public.posts where id = p_post_id for update;
  if not found or v_status in ('failed','needs_input') then return jsonb_build_object('ready', false); end if;
  if not public.post_work_matches(p_post_id, p_job_id) then return jsonb_build_object('ready', false); end if;
  if exists (
    select 1 from public.jobs where post_id = p_post_id and kind = 'correct' and status in ('queued','running')
      and not coalesce((payload->>'correction_applied')::boolean, false)
  ) then
    update public.posts set status = case when status in ('processing','needs_input') then status else 'queued' end where id = p_post_id;
    return jsonb_build_object('ready', false);
  end if;
  if v_question is not null then
    select coalesce(max((payload->>'correction_sequence')::bigint), 0) into v_question_sequence
      from public.jobs where post_id = p_post_id and kind = 'correct' and payload->>'needs_input_question' = 'true';
    if not exists (select 1 from public.jobs where post_id = p_post_id and kind = 'correct'
      and payload->>'correction_applied' = 'true' and not coalesce((payload->>'needs_input_question')::boolean, false)
      and (payload->>'correction_sequence')::bigint > v_question_sequence) then
      update public.posts set status = 'needs_input' where id = p_post_id;
      return jsonb_build_object('ready', false);
    end if;
  end if;
  if exists (select 1 from public.current_post_items i left join public.item_nutrition n on n.post_item_id = i.id
    where i.post_id = p_post_id and n.post_item_id is null) then return jsonb_build_object('ready', false); end if;
  update public.posts set status = 'ready', fail_reason = null, needs_input = null where id = p_post_id;
  delete from public.post_media where post_id = p_post_id and kind = 'card' returning storage_path into v_old;
  if v_old is not null and v_old !~ ('^' || v_owner::text || '/' || p_post_id::text ||
    '/cards/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/card[.]png$') then
    v_old := null;
  end if;
  return jsonb_build_object('ready', true, 'old_card_path', v_old);
end;
$$;
revoke all on function public.complete_post_without_card(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_post_without_card(uuid, uuid) to service_role;
