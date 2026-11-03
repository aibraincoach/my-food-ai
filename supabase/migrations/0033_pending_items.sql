-- Progress is ephemeral, owner-readable through existing posts RLS, service-written only.
alter table public.posts add column pending_items jsonb;
create function public.protect_pending_items() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if current_user in ('authenticated','anon') and
   ((TG_OP='INSERT' and new.pending_items is not null) or (TG_OP='UPDATE' and new.pending_items is distinct from old.pending_items)) then
   raise exception 'Analysis progress is service managed';
 end if;
 if new.status in ('ready','failed','needs_input') then new.pending_items:=null; end if;
 if TG_OP='UPDATE' and new.active_job_id is distinct from old.active_job_id then new.pending_items:=null; end if;
 return new;
end $$;
create trigger protect_pending_items before insert or update on public.posts for each row execute function public.protect_pending_items();
revoke all on function public.protect_pending_items() from public,anon,authenticated;
create function public.write_pending_names(p_post_id uuid,p_job_id uuid,p_names jsonb) returns void language sql security definer set search_path=public,pg_temp as $$
 update public.posts set pending_items=p_names where id=p_post_id and p_job_id is not null and active_job_id=p_job_id and status not in ('ready','failed','needs_input');
$$;
create function public.write_pending_kcal(p_post_id uuid,p_job_id uuid,p_index int,p_kcal numeric) returns void language sql security definer set search_path=public,pg_temp as $$
 update public.posts set pending_items=jsonb_set(pending_items,array[p_index::text,'kcal'],coalesce(to_jsonb(p_kcal),'null'::jsonb),false)
 where id=p_post_id and p_job_id is not null and active_job_id=p_job_id and status not in ('ready','failed','needs_input') and p_index>=0 and p_index<jsonb_array_length(pending_items);
$$;
revoke all on function public.write_pending_names(uuid,uuid,jsonb), public.write_pending_kcal(uuid,uuid,int,numeric) from public,anon,authenticated;
grant execute on function public.write_pending_names(uuid,uuid,jsonb), public.write_pending_kcal(uuid,uuid,int,numeric) to service_role;
