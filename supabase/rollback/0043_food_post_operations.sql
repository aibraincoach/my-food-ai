drop function if exists public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,jsonb);
drop table if exists public.food_post_operations;
notify pgrst,'reload schema';
