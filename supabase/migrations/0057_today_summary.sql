-- One aggregate read for Home's Today column: ready nutrition and pending counts for the caller's local day.
create or replace function public.today_summary(p_zone text)
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with caller as (
    select auth.uid() as user_id, (timezone(p_zone, now()))::date as today
  ),
  today_posts as (
    select p.id, p.status
    from public.posts p
    join caller c on c.user_id is not null and p.user_id = c.user_id
    where p.deleted_at is null
      and p.status in ('ready', 'queued', 'processing', 'needs_input')
      and (timezone(p_zone, p.eaten_at))::date = c.today
  ),
  ready_nutrition as (
    select
      n.calories,
      n.protein_g,
      n.carbs_g,
      n.fat_g
    from today_posts tp
    join public.posts p on p.id = tp.id and tp.status = 'ready'
    join public.current_post_items i on i.post_id = p.id
    left join public.item_nutrition n on n.post_item_id = i.id
  ),
  sums as (
    select
      count(*) filter (where calories is not null) as known_cal,
      count(*) filter (where calories is null) as missing_cal,
      coalesce(sum(calories::numeric) filter (where calories is not null), 0) as kcal,
      coalesce(sum(protein_g::numeric) filter (where protein_g is not null), 0) as protein_g,
      coalesce(sum(carbs_g::numeric) filter (where carbs_g is not null), 0) as carbs_g,
      coalesce(sum(fat_g::numeric) filter (where fat_g is not null), 0) as fat_g
    from ready_nutrition
  )
  select case
    when (select user_id from caller) is null then null::jsonb
    else jsonb_build_object(
      'date', (select today from caller),
      'kcal', case when (select known_cal from sums) = 0 and (select missing_cal from sums) > 0 then null else (select kcal from sums) end,
      'protein_g', (select protein_g from sums),
      'carbs_g', (select carbs_g from sums),
      'fat_g', (select fat_g from sums),
      'posted', (select count(*)::int from today_posts where status = 'ready'),
      'pending', (select count(*)::int from today_posts where status <> 'ready')
    )
  end;
$$;

grant execute on function public.today_summary(text) to authenticated;
