-- Restore only this migration's changes, preserving subsequently edited values.
update public.item_nutrition n
set sugar_g = b.previous_sugar_g
from public.sugar_total_backfill_0050 b
where n.post_item_id = b.post_item_id and n.sugar_g = b.applied_sugar_g;
drop trigger invalidate_sugar_total_backfill_0050 on public.item_nutrition;
drop function public.invalidate_sugar_total_backfill_0050();
drop table public.sugar_total_backfill_0050;
