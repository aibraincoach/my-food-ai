-- #1368 A: one current nutrition format. Applied history stays untouched.
-- Production apply is held for RT written yes and the PM's exact order.
-- Apply ONLY AFTER the reviewed single-format application is deployed green.
-- The compact flag below is a data-format assertion, not a deployment gate.
begin;
set local lock_timeout='1s';
set local statement_timeout='5s';
do $$begin
 if not exists(select 1 from public.nutrition_provenance_format where id and compact and reader_floor is not null) then
  raise exception 'Single-format migration requires the recorded compact activation';
 end if;
end $$;
drop trigger enforce_nutrition_provenance_format on public.item_nutrition;
drop function public.enforce_nutrition_provenance_format();
drop function public.nutrient_provenance_format(jsonb,boolean);
drop table public.nutrition_provenance_format;
notify pgrst,'reload schema';
commit;
