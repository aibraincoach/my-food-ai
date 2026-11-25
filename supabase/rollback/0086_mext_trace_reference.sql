-- Refuse to erase typed provenance. Reverting the matcher keeps the schema.
begin;
set local lock_timeout = '1s';
set local statement_timeout = '5s';
do $$ begin
  if exists(select 1 from public.model_calls where kind='mext' or reference_ref is not null) then
    raise exception '0086 rollback refused: MEXT traces exist' using errcode='55000';
  end if;
end $$;
create or replace function public.retention_trace_candidates(p_now timestamptz)
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

alter table public.model_calls drop constraint model_calls_reference_ref_check;
alter table public.model_calls drop constraint model_calls_kind_check;
alter table public.model_calls add constraint model_calls_kind_check check (kind in ('sam','spark_identify','spark_correct','spark_same_meal','spark_search','fdc','transcribe','spark_label','spark_remainder'));
alter table public.model_calls drop column reference_ref;
commit;
