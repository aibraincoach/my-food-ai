-- Per-account identify provider; hosted Meta remains the default.
alter table public.profiles add column identify_provider text not null default 'meta'
 check (identify_provider in ('meta','open'));
alter table public.model_calls add column model text, add column host text;

-- Existing profile editing policies stay intact. This narrowly scoped RPC also
-- permits an admin owner to change this one preference without weakening the
-- role='user' guard in the general UPDATE policy.
create function public.set_identify_provider(p_provider text) returns text
language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or p_provider not in ('meta','open') or p_provider is null then
  raise exception 'Invalid identify provider' using errcode='22023';
 end if;
 update public.profiles set identify_provider=p_provider where id=auth.uid();
 if not found then raise exception 'Profile not found' using errcode='42501'; end if;
 return p_provider;
end $$;
revoke all on function public.set_identify_provider(text) from public,anon;
grant execute on function public.set_identify_provider(text) to authenticated;
notify pgrst,'reload schema';

-- Successful identification provenance belongs to the committed analysis,
-- never to the latest request trace (a later request can fail or be rolled back).
alter table public.posts add column identify_model text, add column identify_host text;
alter table public.posts add constraint identify_identity_pair check (
 (identify_model is null)=(identify_host is null) and (
 (identify_model is null and identify_host is null) or
 (identify_model='muse-spark-1.3' and identify_host='meta') or
 (identify_model ~ '^meta-models/muse-spark-open(-[[:alnum:]._-]+)?$' and length(identify_model)<=160 and identify_host='baseten')
));
create function public.protect_identify_identity() returns trigger
language plpgsql set search_path=public,pg_temp as $$
begin
 if current_user in ('authenticated','anon') and
  ((tg_op='INSERT' and (new.identify_model is not null or new.identify_host is not null)) or
   (tg_op='UPDATE' and (new.identify_model is distinct from old.identify_model or new.identify_host is distinct from old.identify_host))) then
  raise exception 'Identification identity is server managed' using errcode='42501';
 end if;
 return new;
end $$;
create trigger protect_identify_identity before insert or update on public.posts
 for each row execute function public.protect_identify_identity();
revoke all on function public.protect_identify_identity() from public,anon,authenticated;

create function public.persist_identified_analysis(
 p_post_id uuid,p_job_id uuid,p_items jsonb,p_summary text,p_needs_input jsonb default null,
 p_identify_model text default null,p_identify_host text default null,p_is_label boolean default false
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare initialized timestamptz;
begin
 select analysis_initialized_at into initialized from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 -- Delegate the existing owner fence, initialization marker and item transaction.
 -- A replay is a no-op for the meal and must also be a no-op for its identity.
 if p_is_label then
  perform public.persist_owned_label(p_post_id,p_job_id,p_items,p_summary,p_needs_input);
 else
  perform public.persist_owned_analysis(p_post_id,p_job_id,p_items,p_summary,p_needs_input);
 end if;
 if initialized is null then
  update public.posts set identify_model=p_identify_model,identify_host=p_identify_host
   where id=p_post_id and analysis_initialized_at is not null;
 end if;
end $$;
revoke all on function public.persist_identified_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean) from public,anon,authenticated;
grant execute on function public.persist_identified_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean) to service_role;
notify pgrst,'reload schema';
