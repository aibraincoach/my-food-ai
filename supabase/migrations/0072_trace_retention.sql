-- #1098: retention for model and USDA trace rows (public.model_calls), run by scripts/retention/run.mjs in small
-- batches with a pause between them. A trace row is deleted 45 days after its call started, except:
--   * a USDA decision behind a meal's current food: a kind 'fdc' row without an error whose fdc_id is the record a
--     current (not superseded) food of that meal stores in item_nutrition.source_ref. Repeating a meal reads these
--     to trust and copy its numbers (src/lib/pipeline/prior.ts), and the numbers revisit relies on them;
--   * the failed open-model identify of a meal that fell back to Meta: the meal's card reads it
--     (src/lib/posts/items.ts, host 'baseten', kind 'spark_identify', with an error).
-- A deleted trace row cannot be restored. What was deleted is counted in retention_summary, per day, rule and kind.

-- Candidates are found by start time without scanning the whole table.
create index model_calls_started on public.model_calls (started_at);

create function public.retention_trace_candidates(p_now timestamptz)
returns table (id uuid, rule text, kind text, day date, started_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select c.id, 'older_45d', c.kind, (c.started_at at time zone 'UTC')::date, c.started_at
  from public.model_calls c
  where c.started_at < p_now - interval '45 days'
    and not (c.kind = 'fdc' and c.error is null and c.fdc_id > 0 and exists (
      select 1 from public.post_items i join public.item_nutrition n on n.post_item_id = i.id
      where i.post_id = c.post_id and i.superseded_at is null and n.source_ref = c.fdc_id::text))
    -- A pre-0032 NULL host is not proof of the Baseten exception.
    and not coalesce((c.kind = 'spark_identify' and c.host = 'baseten' and c.error is not null and exists (
      select 1 from public.posts p where p.id = c.post_id and p.identify_host = 'meta')), false)
$$;

-- Dry run: what the rule would remove now, per kind and day, and what the two exceptions keep. Deletes nothing.
create function public.retention_traces_dry_run(p_now timestamptz default clock_timestamp())
returns table (rule text, kind text, day date, would_delete bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  select c.rule, c.kind, c.day, count(*) from public.retention_trace_candidates(p_now) c group by 1, 2, 3 order by 3, 1, 2
$$;

-- One batch: at most p_limit rows, oldest first, each counted in retention_summary. Returns the number deleted.
create function public.retention_traces_batch(p_limit integer)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare v_deleted integer;
begin
  if p_limit is null or p_limit < 1 or p_limit > 1000 then raise exception 'Batch size must be 1 to 1000' using errcode = '22023'; end if;
  with picked as (
    select c.id, c.rule, c.kind, c.day from public.retention_trace_candidates(clock_timestamp()) c
    order by c.started_at, c.id limit p_limit
  ), gone as (
    delete from public.model_calls m using picked where m.id = picked.id returning picked.rule, picked.kind, picked.day
  ), counted as (
    insert into public.retention_summary (table_name, rule, day, kind, deleted)
    select 'model_calls', g.rule, g.day, g.kind, count(*) from gone g group by g.rule, g.day, g.kind
    returning deleted
  )
  select coalesce(sum(deleted), 0) into v_deleted from counted;
  return v_deleted;
end $$;

revoke all on function public.retention_trace_candidates(timestamptz) from public, anon, authenticated;
revoke all on function public.retention_traces_dry_run(timestamptz) from public, anon, authenticated;
revoke all on function public.retention_traces_batch(integer) from public, anon, authenticated;
