-- Reader-first rollout for #573. Apply before deploying the dual reader.
-- Existing readers keep their format until the explicit compact activation.
create table public.nutrition_provenance_format (
 id boolean primary key default true check(id),
 compact boolean not null default false,
 reader_floor text check(reader_floor ~ '^[0-9a-f]{40}$'),
 check(not compact or reader_floor is not null)
);
insert into public.nutrition_provenance_format(id,compact)values(true,false);
alter table public.nutrition_provenance_format enable row level security;
revoke all on public.nutrition_provenance_format from public,anon,authenticated,service_role;
grant select on public.nutrition_provenance_format to service_role;

-- All labels are bound to the source row. Per100 is nutrient data, not a label.
create function public.nutrient_provenance_format(entries jsonb, compact boolean)
returns jsonb language sql immutable set search_path=public,pg_temp as $$
 with label as (
  select e->'approximation' as tag from jsonb_array_elements(entries) with ordinality as t(e,ord)
  where e ? 'approximation' order by ord limit 1
 ), nutrient_values as (
  select e,ord,l.tag,
   case when (e->'approximation') ? 'per100' then e->'approximation'->'per100'
    when e ? 'per100' then e->'per100' else null end as per100
  from jsonb_array_elements(entries) with ordinality as t(e,ord) cross join label l
 )
 select coalesce(jsonb_agg(
  (e-'approximation'-'per100')
  || case when compact then
    (case when ord=1 then jsonb_build_object('approximation',tag-'per100') else '{}'::jsonb end)
    || (case when per100 is not null then jsonb_build_object('per100',per100) else '{}'::jsonb end)
   else jsonb_build_object('approximation',(tag-'per100')
    || (case when per100 is not null then jsonb_build_object('per100',per100) else '{}'::jsonb end))
   end order by ord),entries) from nutrient_values
$$;
revoke all on function public.nutrient_provenance_format(jsonb,boolean) from public,anon,authenticated;
grant execute on function public.nutrient_provenance_format(jsonb,boolean) to service_role;

create function public.enforce_nutrition_provenance_format() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare compact boolean;
begin
 select f.compact into compact from public.nutrition_provenance_format f where id;
 -- This also protects old-reader rollbacks against still-live new writers.
 if new.micronutrients @> '[{"approximation":{}}]'::jsonb then
  new.micronutrients:=public.nutrient_provenance_format(new.micronutrients,coalesce(compact,false));
 end if;
 return new;
end $$;
revoke all on function public.enforce_nutrition_provenance_format() from public,anon,authenticated,service_role;
create trigger enforce_nutrition_provenance_format before insert or update of micronutrients
on public.item_nutrition for each row execute function public.enforce_nutrition_provenance_format();

-- An explicit overload identifies a reader that understands both formats.
-- The old no-argument/timestamp API stays usable throughout preparation.
create function public.claim_owned_job(p_reader_format integer,p_now timestamptz default now()) returns public.jobs
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_reader_format<>2 then raise exception 'Unknown nutrition reader format' using errcode='22023';end if;
 return public.claim_post_job(p_now,true);
end $$;
revoke all on function public.claim_owned_job(integer,timestamptz) from public,anon,authenticated;
grant execute on function public.claim_owned_job(integer,timestamptz) to service_role;
notify pgrst,'reload schema';
