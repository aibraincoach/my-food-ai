-- Owner panel metadata only. No new telemetry and no writes.
-- 0078 is reserved by the independent hot-pot change.
create function public.admin_people(p_zone text, p_now timestamptz, p_ids uuid[], p_page integer default 1, p_person uuid default null)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if p_now is null or p_zone is null or not exists(select 1 from pg_timezone_names where name=p_zone)
    or p_page is null or p_page<1 or p_page>100000 or p_ids is null or cardinality(p_ids)>50 then
  raise exception 'Invalid panel bounds' using errcode='22023';
 end if;
 with bounds as (
  select (p_now at time zone p_zone)::date today,
   (((p_now at time zone p_zone)::date-29)::timestamp at time zone p_zone) first_at,
   (((p_now at time zone p_zone)::date-6)::timestamp at time zone p_zone) week_at,
   ((p_now at time zone p_zone)::date::timestamp at time zone p_zone) today_at
 ), live_posts as materialized (
  select id,user_id,created_at,status,fail_reason from public.posts where deleted_at is null and created_at<=p_now
 ), activity as materialized (
  select user_id,created_at at from live_posts
  union all select p.user_id,c.created_at from public.post_comments c join live_posts p on p.id=c.post_id where c.author='user' and c.created_at<=p_now
  union all select user_id,created_at from public.intake_logs where created_at<=p_now
  union all select user_id,created_at from public.agent_activity where action in ('posted','corrected') and created_at<=p_now
 ), errors as materialized (
  -- Error text is never returned: only a recognised upstream prefix/status.
  -- Failed posts have no failure timestamp: their creation time is the only stored time.
  select id,user_id,id post_id,created_at at,'failedMeal' kind,substring(fail_reason from '^(fdc:[0-9]{3}|meta:[0-9]{3})(?![0-9])') code from live_posts where status='failed'
  union all select j.id,p.user_id,p.id,coalesce(j.finished_at,j.started_at,j.created_at),'failedJob',substring(j.error from '^(fdc:[0-9]{3}|meta:[0-9]{3})(?![0-9])') from public.jobs j join live_posts p on p.id=j.post_id where j.status='error' and coalesce(j.finished_at,j.started_at,j.created_at)<=p_now
  union all select c.id,p.user_id,p.id,c.started_at,'failedCall',substring(c.error from '^(fdc:[0-9]{3}|meta:[0-9]{3})(?![0-9])') from public.model_calls c join live_posts p on p.id=c.post_id where c.error is not null and c.started_at<=p_now
  union all select id,user_id,null::uuid,created_at,'freezeReport',null::text from public.freeze_reports where created_at<=p_now
 ), groups as (
  select 'signup' kind,u.id,u.created_at at from auth.users u,bounds b where u.created_at>=b.today_at and u.created_at<=p_now
  union all select 'today',user_id,max(at) from activity,bounds where at>=today_at group by user_id
  union all select 'week',user_id,max(at) from activity,bounds where at>=week_at group by user_id
  union all select 'error',user_id,max(at) from errors,bounds where at>=week_at group by user_id
 ), group_pages as (
  select g.*,p.handle,row_number()over(partition by kind order by at desc,g.id) position from groups g left join public.profiles p on p.id=g.id
 ), days as (select today-n as day from bounds cross join generate_series(0,29) n),
 signup_days as (select (u.created_at at time zone p_zone)::date as day,count(*) n from auth.users u,bounds b where u.created_at>=b.first_at and u.created_at<=p_now group by 1),
 meal_days as (select (p.created_at at time zone p_zone)::date as day,count(*) n from live_posts p,bounds b where p.created_at>=b.first_at group by 1),
 active_days as (select (a.at at time zone p_zone)::date as day,count(distinct user_id) n from activity a,bounds b where a.at>=b.first_at group by 1),
 agent_days as (select (a.created_at at time zone p_zone)::date as day,
  count(*)filter(where action='read') reads,count(*)filter(where action='listed') lists,count(*)filter(where action in ('posted','corrected')) writes
  from public.agent_activity a,bounds b where a.created_at>=b.first_at and a.created_at<=p_now group by 1),
 daily as (
  select d.day,coalesce(s.n,0) signups,coalesce(m.n,0) meals,coalesce(a.n,0) active,
   coalesce(g.reads,0) agent_reads,coalesce(g.lists,0) agent_lists,coalesce(g.writes,0) agent_writes
  from days d left join signup_days s using(day) left join meal_days m using(day) left join active_days a using(day) left join agent_days g using(day)
 ), selected as (select unnest(p_ids) id union select p_person where p_person is not null), metadata as (
  select s.id,p.handle,(select max(at) from activity where user_id=s.id) last_activity,
   (select count(*) from live_posts where user_id=s.id) meals,
   (select count(*) from errors,bounds where user_id=s.id and at>=week_at) errors,
   (select count(*) from public.post_comments c join live_posts x on x.id=c.post_id where x.user_id=s.id and c.author='user' and c.created_at<=p_now) comments,
   (select count(*) from public.jobs j join live_posts x on x.id=j.post_id where x.user_id=s.id and j.kind='correct' and j.status='finished' and j.payload->>'correction_applied'='true' and j.finished_at<=p_now) corrections,
   (select count(*) from public.agent_tokens where user_id=s.id and revoked_at is null) live_tokens,
   (select max(created_at) from public.agent_activity where user_id=s.id and created_at<=p_now) agent_last_used
  from selected s left join public.profiles p on p.id=s.id
 ), person_errors as (
  select e.id,e.post_id,e.at,e.kind,e.code from errors e,bounds b where user_id=p_person and at>=first_at order by at desc,id limit 50 offset ((p_page-1)::bigint*50)
 ), person_agent as (
  select d.day,
   count(*)filter(where a.action='read') reads,count(*)filter(where a.action='listed') lists,count(*)filter(where a.action in ('posted','corrected')) writes
  from days d left join public.agent_activity a on a.user_id=p_person and (a.created_at at time zone p_zone)::date=d.day and a.created_at<=p_now group by d.day
 )
 select jsonb_build_object(
  'counts',(select jsonb_object_agg(kind,n) from (select k.kind,count(g.id) n from (values('signup'),('today'),('week'),('error')) k(kind) left join groups g using(kind) group by k.kind) c),
  'groups',coalesce((select jsonb_agg(jsonb_build_object('kind',kind,'id',id,'handle',handle,'at',at) order by kind,position) from group_pages where position>((p_page-1)::bigint*50) and position<=p_page::bigint*50),'[]'::jsonb),
  'daily',(select jsonb_agg(to_jsonb(d) order by day) from daily d),
  'metadata',coalesce((select jsonb_agg(to_jsonb(m)) from metadata m),'[]'::jsonb),
  'person_errors',coalesce((select jsonb_agg(to_jsonb(e)) from person_errors e),'[]'::jsonb),
  'person_error_count',(select count(*) from errors,bounds where user_id=p_person and at>=first_at),
  'person_agent',(select jsonb_agg(to_jsonb(a) order by day) from person_agent a)
 ) into result;
 return result;
end $$;
revoke all on function public.admin_people(text,timestamptz,uuid[],integer,uuid) from public,anon,authenticated;
grant execute on function public.admin_people(text,timestamptz,uuid[],integer,uuid) to service_role;
