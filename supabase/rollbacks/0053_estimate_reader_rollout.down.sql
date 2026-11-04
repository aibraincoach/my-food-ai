-- Only remove reader preparation after the compact rollback artifact has run.
do $$begin
 if exists(select 1 from public.nutrition_provenance_format where compact) then
  raise exception 'Rollback compact nutrition before removing reader preparation';
 end if;
end $$;
drop trigger enforce_nutrition_provenance_format on public.item_nutrition;
drop function public.enforce_nutrition_provenance_format();
drop function public.nutrient_provenance_format(jsonb,boolean);
drop function public.claim_owned_job(integer,timestamptz);
drop table public.nutrition_provenance_format;
notify pgrst,'reload schema';
