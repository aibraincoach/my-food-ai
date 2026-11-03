drop function if exists public.cancel_food_operation(uuid,uuid);
drop function if exists public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,jsonb);
drop function if exists public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,jsonb,jsonb);
drop table if exists public.food_post_operations;
notify pgrst,'reload schema';
