create extension if not exists pg_trgm;
alter table public.posts add column search_tsv tsvector;
create index posts_search_idx on public.posts using gin(search_tsv);
create function public.rebuild_post_search() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_table_name='posts' then
    new.search_tsv=to_tsvector('english',coalesce(new.caption,'')||' '||coalesce((select string_agg(name,' ') from post_items where post_id=new.id and superseded_at is null),''));
    return new;
  end if;
  update posts set search_tsv=to_tsvector('english',caption||' '||coalesce((select string_agg(name,' ') from post_items where post_id=coalesce(new.post_id,old.post_id) and superseded_at is null),'')) where id=coalesce(new.post_id,old.post_id);
  return coalesce(new,old);
end $$;
create trigger posts_search before insert or update of caption on public.posts for each row execute function public.rebuild_post_search();
create trigger items_search after insert or update or delete on public.post_items for each row execute function public.rebuild_post_search();
update public.posts set caption=caption;

create function public.search_own_posts(p_terms text default '',p_from timestamptz default null,p_to timestamptz default null,p_meal text default null,p_big boolean default false,p_latest boolean default false)
returns table(id uuid) language sql stable security invoker set search_path=public as $$
  with totals as (
    select p.id,coalesce(sum(n.calories),0) kcal from posts p left join current_post_items i on i.post_id=p.id left join item_nutrition n on n.post_item_id=i.id where p.user_id=auth.uid() group by p.id
  ), median as (select percentile_cont(0.5) within group(order by kcal) kcal from totals)
  select p.id from posts p join totals t on t.id=p.id cross join median m
  where p.user_id=auth.uid() and p.status='ready'
    and (p_terms='' or p.search_tsv@@plainto_tsquery('english',p_terms))
    and (p_from is null or p.eaten_at>=p_from) and (p_to is null or p.eaten_at<p_to)
    and (not p_big or t.kcal>=1.5*m.kcal)
    and (p_meal is null or case p_meal
      when 'breakfast' then extract(hour from p.eaten_at) between 5 and 10
      when 'lunch' then extract(hour from p.eaten_at) between 11 and 14
      when 'dinner' then extract(hour from p.eaten_at) between 17 and 22
      when 'snack' then extract(hour from p.eaten_at) not between 5 and 14 and extract(hour from p.eaten_at) not between 17 and 22
      else false end)
  order by p.created_at desc limit case when p_latest then 1 else 100 end;
$$;
revoke all on function public.search_own_posts(text,timestamptz,timestamptz,text,boolean,boolean) from public,anon;
grant execute on function public.search_own_posts(text,timestamptz,timestamptz,text,boolean,boolean) to authenticated;
