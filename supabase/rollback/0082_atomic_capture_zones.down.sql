-- Revert the C-atomic app BEFORE any optional schema down. Keep stored zones.
-- Prefer retaining this additive schema. RT yes + PM order still required.
begin;
do $$ begin
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('publish_photo_drink_operation','publish_composer_drinks')
  and p.proargnames @> array['p_message']::text[]) then
  raise exception 'Cannot remove0082 beneath0084 structured zone callers' using errcode='22023';
 end if;
end $$;
drop function public.agent_log_meal(uuid,uuid,text,timestamptz,text);
drop function public.publish_copy_operation(uuid,uuid,boolean,timestamptz,text);
drop function public.publish_photo_drink_operation(uuid,uuid,text,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,text,jsonb,text);
drop function public.publish_drink_operation(uuid,uuid,text,timestamptz,text,integer,text,integer,jsonb,text);
drop function public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,text,jsonb,jsonb);
drop function public.require_capture_zone(text);
notify pgrst,'reload schema';
commit;
