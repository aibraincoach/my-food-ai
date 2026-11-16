begin;
update public.post_items i set superseded_at = now()
where i.post_id = :'post'::uuid and i.superseded_at is null
  and exists (select 1 from public.posts p where p.id = i.post_id and p.status = 'ready' and p.deleted_at is null
              and p.analysis_initialized_at is not null and p.source_post_id is null)
  and exists (select 1 from public.post_media m where m.post_id = i.post_id and m.kind = 'photo' and not m.not_eaten)
  and not exists (select 1 from public.post_media m where m.post_id = i.post_id and m.kind = 'photo' and m.not_eaten)
  and not exists (select 1 from public.post_comments c where c.post_id = i.post_id and c.author = 'user' and c.reverted_at is null)
  and not exists (select 1 from public.intake_logs l where l.post_id = i.post_id and l.source = 'sheet')
  and not exists (select 1 from public.jobs j where j.post_id = i.post_id and j.status in ('queued', 'running'));
update public.posts p set analysis_initialized_at = null, status = 'queued', fail_reason = null, question = null
where p.id = :'post'::uuid and p.status = 'ready' and p.deleted_at is null and p.analysis_initialized_at is not null
  and not exists (select 1 from public.post_items i where i.post_id = p.id and i.superseded_at is null)
  and exists (select 1 from public.post_items i where i.post_id = p.id and i.superseded_at >= now());
insert into public.jobs (post_id, kind, priority, status, payload)
select p.id, 'analyze', 200, 'queued', '{"operator":"reanalysis"}'::jsonb
from public.posts p
where p.id = :'post'::uuid and p.status = 'queued' and p.analysis_initialized_at is null
  and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
returning left(id::text, 8) as job, left(post_id::text, 8) as post, kind, priority;
commit;
