drop function if exists public.correct_composer_drinks(uuid,uuid,jsonb,jsonb);
drop function if exists public.publish_composer_drinks(uuid,uuid,jsonb,text,timestamptz,jsonb,boolean);
drop table if exists public.composer_drink_readings;
