-- Record exactly the rows changed so rollback never clears pre-existing sugar.
create table if not exists public.sugar_total_backfill_0050 (
  post_item_id uuid primary key references public.item_nutrition(post_item_id) on delete cascade,
  previous_sugar_g numeric,
  applied_sugar_g numeric not null
);
alter table public.sugar_total_backfill_0050 enable row level security;
revoke all on public.sugar_total_backfill_0050 from public, anon, authenticated;

-- Fill null sugar from USDA 1063 "Sugars, Total" portion values, without 2000.
with eligible as materialized (
  select n.post_item_id, n.sugar_g as previous_sugar_g,
    (select (m->>'value')::numeric from jsonb_array_elements(n.micronutrients) m
      where (m->>'nutrientId')::int = 1063 and m->>'unitName' = 'G'
        and m->>'basis' = 'portion' and m->>'value' is not null limit 1) as applied_sugar_g
  from public.item_nutrition n
  where n.sugar_g is null and n.calories is not null
    and exists (select 1 from jsonb_array_elements(n.micronutrients) m
      where (m->>'nutrientId')::int = 1063 and m->>'unitName' = 'G'
        and m->>'basis' = 'portion' and m->>'value' is not null)
    and not exists (select 1 from jsonb_array_elements(n.micronutrients) m
      where (m->>'nutrientId')::int = 2000)
  for update of n
), recorded as (
  insert into public.sugar_total_backfill_0050(post_item_id, previous_sugar_g, applied_sugar_g)
  select post_item_id, previous_sugar_g, applied_sugar_g from eligible
  on conflict (post_item_id) do nothing
  returning post_item_id, applied_sugar_g
)
update public.item_nutrition n
set sugar_g = r.applied_sugar_g
from recorded r
where n.post_item_id = r.post_item_id and n.sugar_g is null;
