create extension if not exists pg_trgm;
alter table public.post_media add column phash bigint;

-- Service-only: the owner is derived from the supplied new post, never caller text.
create function public.meal_prior_candidates(p_post_id uuid)
returns table(post_id uuid, text_score real, photo_score double precision, distance_m double precision)
language sql stable security definer set search_path=public,extensions as $$
  select past.id,
    case when nullif(btrim(current.caption),'') is null then null else greatest(similarity(coalesce(current.caption,''),coalesce(past.caption,'')),
      similarity(coalesce(current.caption,''),coalesce((select string_agg(name,' ') from post_items where post_id=past.id and superseded_at is null),''))) end,
    case when cm.phash is null or pm.phash is null then null else 1-bit_count((cm.phash # pm.phash)::bit(64))/64.0 end,
    case when cl.post_id is null or pl.post_id is null then null else
      6371000*2*asin(sqrt(least(1.0,power(sin(radians(pl.lat-cl.lat)/2),2)+cos(radians(cl.lat))*cos(radians(pl.lat))*power(sin(radians(pl.lng-cl.lng)/2),2)))) end
  from posts current join posts past on past.user_id=current.user_id and past.id<>current.id
  left join lateral (select phash from post_media where post_id=current.id order by position limit 1) cm on true
  left join lateral (select phash from post_media where post_id=past.id order by position limit 1) pm on true
  left join post_locations cl on cl.post_id=current.id
  left join post_locations pl on pl.post_id=past.id
  where current.id=p_post_id and past.status='ready' and past.created_at>=now()-interval '90 days';
$$;
revoke all on function public.meal_prior_candidates(uuid) from public,anon,authenticated;
grant execute on function public.meal_prior_candidates(uuid) to service_role;
