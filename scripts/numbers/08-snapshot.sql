select jsonb_build_object(
  'post', to_jsonb(p) - 'search_tsv',
  'items', (select coalesce(jsonb_agg(to_jsonb(i) || jsonb_build_object('nutrition', to_jsonb(n)) order by i.created_at, i.id), '[]'::jsonb)
            from public.post_items i left join public.item_nutrition n on n.post_item_id = i.id where i.post_id = p.id),
  'intake_logs', (select coalesce(jsonb_agg(to_jsonb(l) order by l.created_at, l.id), '[]'::jsonb) from public.intake_logs l where l.post_id = p.id),
  'comments', (select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at, c.id), '[]'::jsonb) from public.post_comments c where c.post_id = p.id),
  'media', (select coalesce(jsonb_agg(to_jsonb(m) - 'photo_secret' order by m.position, m.id), '[]'::jsonb) from public.post_media m where m.post_id = p.id),
  'saved_meals', (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) from public.saved_meals s where s.source_post_id = p.id),
  'jobs', (select coalesce(jsonb_agg(to_jsonb(j) order by j.created_at), '[]'::jsonb) from public.jobs j where j.post_id = p.id))
from public.posts p
where left(p.id::text, 8) = any(string_to_array(:'prefixes', ','))
order by p.id;
