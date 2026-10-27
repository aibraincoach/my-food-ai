create extension if not exists pg_trgm;
alter table public.posts add column search_tsv tsvector;
create index posts_search_idx on public.posts using gin(search_tsv);
create function public.rebuild_post_search() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_table_name='posts' then
    new.search_tsv=to_tsvector('english',coalesce(new.caption,'')||' '||coalesce((select string_agg(name,' ') from post_items where post_id=new.id and superseded_at is null),''));
    return new;
  end if;
  update posts set search_tsv=to_tsvector('english',coalesce(caption,'')||' '||coalesce((select string_agg(name,' ') from post_items where post_id=coalesce(new.post_id,old.post_id) and superseded_at is null),'')) where id=coalesce(new.post_id,old.post_id);
  return coalesce(new,old);
end $$;
create trigger posts_search before insert or update of caption on public.posts for each row execute function public.rebuild_post_search();
create trigger items_search after insert or update or delete on public.post_items for each row execute function public.rebuild_post_search();
update public.posts set caption=caption;

-- Match normalizeStoredNutrition/scaleNutrition for legacy unscaled FDC arrays.
create function public.search_consumed_kcal(stored numeric, nutrients jsonb, grams numeric)
returns numeric language sql immutable set search_path=public as $$
  with entries as (select value,ordinality from jsonb_array_elements(case when jsonb_typeof(nutrients)='array' then nutrients else '[]'::jsonb end) with ordinality),
  shape as (select count(*) n, bool_and(coalesce(value->>'basis'='portion',false)) portion,
    bool_and(coalesce(jsonb_typeof(value->'nutrientId')='number' and jsonb_typeof(value->'nutrientName')='string'
      and jsonb_typeof(value->'unitName')='string' and jsonb_typeof(value->'value')='number',false)) valid from entries),
  energy as (select (value->>'value')::numeric amount, value->>'unitName' unit from entries
    where value->>'nutrientId' in ('1008','2047','2048')
    order by case value->>'nutrientId' when '1008' then 0 when '2047' then 1 else 2 end,ordinality limit 1)
  select case when n=0 or portion is true or valid is not true then stored
    when grams is null or grams<=0 then null
    else (select amount*case when upper(trim(unit))='KJ' then 0.239006 else 1 end*grams/100 from energy) end from shape;
$$;
revoke all on function public.search_consumed_kcal(numeric,jsonb,numeric) from public,anon;
grant execute on function public.search_consumed_kcal(numeric,jsonb,numeric) to authenticated;

create function public.search_own_posts(p_terms text default '',p_from timestamptz default null,p_to timestamptz default null,p_meal text default null,p_big boolean default false,p_latest boolean default false,p_tz text default 'UTC')
returns table(id uuid) language sql stable security invoker set search_path=public as $$
  with totals as (
    select p.id,count(i.id) items,
      case when count(i.id)=0 then 0
        when count(i.id)=count(public.search_consumed_kcal(n.calories,n.micronutrients,i.portion_grams))
          then sum(public.search_consumed_kcal(n.calories,n.micronutrients,i.portion_grams)) else null end kcal
    from posts p left join current_post_items i on i.post_id=p.id left join item_nutrition n on n.post_item_id=i.id
    where p.user_id=auth.uid() and p.status='ready' group by p.id
  ), median as (select percentile_cont(0.5) within group(order by kcal) kcal from totals where items>0 and kcal is not null)
  select p.id from posts p join totals t on t.id=p.id cross join median m
  where p.user_id=auth.uid() and p.status='ready'
    and (p_terms='' or p.search_tsv@@plainto_tsquery('english',p_terms))
    and (p_from is null or p.eaten_at>=p_from) and (p_to is null or p.eaten_at<p_to)
    and (not p_big or t.kcal>=1.5*m.kcal)
    and (p_meal is null or case p_meal
      when 'breakfast' then extract(hour from p.eaten_at at time zone p_tz) between 5 and 10
      when 'lunch' then extract(hour from p.eaten_at at time zone p_tz) between 11 and 14
      when 'dinner' then extract(hour from p.eaten_at at time zone p_tz) between 17 and 22
      when 'snack' then extract(hour from p.eaten_at at time zone p_tz) not between 5 and 14 and extract(hour from p.eaten_at at time zone p_tz) not between 17 and 22
      else false end)
  order by case when p_latest then p.eaten_at else p.created_at end desc,p.id desc limit case when p_latest then 1 else 100 end;
$$;
revoke all on function public.search_own_posts(text,timestamptz,timestamptz,text,boolean,boolean,text) from public,anon;
grant execute on function public.search_own_posts(text,timestamptz,timestamptz,text,boolean,boolean,text) to authenticated;
