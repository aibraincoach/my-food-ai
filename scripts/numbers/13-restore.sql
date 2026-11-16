begin;
update public.post_items set superseded_at = now()
where post_id = :'post'::uuid and superseded_at is null and not (id = any(:'old_ids'::uuid[]))
  and not exists (select 1 from public.jobs j where j.post_id = :'post'::uuid and j.status in ('queued', 'running'));
update public.post_items set superseded_at = null
where post_id = :'post'::uuid and id = any(:'old_ids'::uuid[])
  and not exists (select 1 from public.post_items c where c.post_id = :'post'::uuid and c.superseded_at is null and not (c.id = any(:'old_ids'::uuid[])));
update public.post_comments set body = :'old_summary'
where id = :'summary_comment_id'::uuid and post_id = :'post'::uuid and author = 'model';
insert into public.jobs (post_id, kind, priority, status, payload)
select p.id, 'recompute', 200, 'queued', '{"reason":"drink_sync","operator":"restore"}'::jsonb
from public.posts p where p.id = :'post'::uuid and p.status = 'ready'
  and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
returning left(id::text, 8) as job, kind, payload;
commit;
