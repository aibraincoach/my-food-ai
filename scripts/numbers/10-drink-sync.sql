insert into public.jobs (post_id, kind, priority, status, payload)
select p.id, 'recompute', 200, 'queued', '{"reason":"drink_sync"}'::jsonb
from public.posts p
where left(p.id::text, 8) in ('8535b793', '8b728c7e', '8ab2eccb')
  and p.status = 'ready' and p.deleted_at is null
  and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
returning left(id::text, 8) as job, left(post_id::text, 8) as post, kind, payload;
