-- Known nutrient subtotals remain searchable; incomplete records do not enter comparative ranking.
create or replace function public.search_own_posts(p_terms text default '',p_from timestamptz default null,p_to timestamptz default null,p_meal text default null,p_big boolean default false,p_latest boolean default false,p_tz text default 'UTC',p_rank text default 'recent')
returns table(id uuid) language sql stable security invoker set search_path=public as $$
  with totals as (
    select p.id,count(i.id) items,
      case when count(i.id)=0 then 0 else sum(public.search_consumed_kcal(n.calories,n.micronutrients,i.portion_grams)) end kcal,
      count(i.id)=count(public.search_consumed_kcal(n.calories,n.micronutrients,i.portion_grams)) complete
    from posts p left join current_post_items i on i.post_id=p.id left join item_nutrition n on n.post_item_id=i.id
    where p.user_id=auth.uid() and p.status='ready' group by p.id
  ), median as (select percentile_cont(0.5) within group(order by kcal) kcal from totals where items>0 and complete and kcal is not null)
  select p.id from posts p join totals t on t.id=p.id cross join median m
  where p.user_id=auth.uid() and p.status='ready'
    and (p_terms='' or p.search_tsv@@websearch_to_tsquery('english',p_terms))
    and (p_from is null or p.eaten_at>=p_from) and (p_to is null or p.eaten_at<p_to)
    and (not p_big or (t.complete and t.kcal>=1.5*m.kcal))
    -- A superlative ranks complete, non-empty meals by consumed calories; it is not the global 'big' threshold.
    and (p_rank<>'largest' or (t.items>0 and t.complete and t.kcal is not null))
    and (p_meal is null or case p_meal
      when 'breakfast' then extract(hour from p.eaten_at at time zone p_tz) between 5 and 10
      when 'lunch' then extract(hour from p.eaten_at at time zone p_tz) between 11 and 14
      when 'dinner' then extract(hour from p.eaten_at at time zone p_tz) between 17 and 22
      when 'snack' then extract(hour from p.eaten_at at time zone p_tz) not between 5 and 14 and extract(hour from p.eaten_at at time zone p_tz) not between 17 and 22
      else false end)
  -- Food date, not creation date, so a backfilled meal cannot displace a recently eaten one.
  -- One row more than the page the app shows, so it can say the list was cut.
  order by case when p_rank='largest' then t.kcal end desc nulls last,p.eaten_at desc,p.id desc limit case when p_latest then 1 else 25 end;
$$;
revoke all on function public.search_own_posts(text,timestamptz,timestamptz,text,boolean,boolean,text,text) from public,anon;
grant execute on function public.search_own_posts(text,timestamptz,timestamptz,text,boolean,boolean,text,text) to authenticated;
