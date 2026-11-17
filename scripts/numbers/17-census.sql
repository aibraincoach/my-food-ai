-- #990: what the other accounts and the saved meals hold, before any of them is worked. Read-only, one SELECT, no
-- psql variable. One row per account with at least one ready meal: the account's first 8 characters only, its ready
-- meals, the copies among them (a meal logged again from another, source_post_id), its saved meals, and the saved
-- meals whose meal is deleted or gone. Run 14-rule-failures.sql with each account's id for its failing meals.
select left(u.id::text, 8) as account,
       count(p.id) filter (where p.status = 'ready' and p.deleted_at is null) as ready_meals,
       count(p.id) filter (where p.status = 'ready' and p.deleted_at is null and p.source_post_id is not null) as copies,
       (select count(*) from public.saved_meals s where s.user_id = u.id) as saved_meals,
       (select count(*) from public.saved_meals s where s.user_id = u.id
          and not exists (select 1 from public.posts q where q.id = s.source_post_id and q.deleted_at is null)) as saved_without_meal
from public.profiles u
join public.posts p on p.user_id = u.id
group by u.id
having count(p.id) filter (where p.status = 'ready' and p.deleted_at is null) > 0
order by ready_meals desc, account;
