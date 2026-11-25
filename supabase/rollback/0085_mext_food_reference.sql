-- Run only by a separate PM order, before any app emits mext: source refs.
-- Once mext: facts exist, keep this reference table for portion edits/readers.
begin;
set local lock_timeout = '1s';
set local statement_timeout = '5s';
do $$ begin
  if exists (select 1 from public.item_nutrition where source_ref like 'mext:%')
    or exists (select 1 from public.saved_meals s,
      lateral jsonb_array_elements(s.items) i
      where i->'nutrition'->>'source_ref' like 'mext:%') then
    raise exception '0085 rollback refused: mext source facts exist' using errcode='55000';
  end if;
end $$;
drop function public.search_mext_foods(text,text);
drop table public.jp_foods;
-- pg_trgm may serve other readers; it is never dropped by this rollback.
commit;
