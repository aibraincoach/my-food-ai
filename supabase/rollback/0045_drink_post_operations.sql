drop function if exists public.cancel_drink_operation(uuid,uuid,uuid);
drop function if exists public.publish_photo_drink_operation(uuid,uuid,text,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,text,jsonb);
drop function if exists public.publish_drink_operation(uuid,uuid,text,timestamptz,text,integer,text,integer,jsonb);
drop table if exists public.drink_post_operations;
notify pgrst,'reload schema';
