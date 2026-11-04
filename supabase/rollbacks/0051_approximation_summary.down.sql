-- Original analysis functions remain unchanged.
drop function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb);
drop function public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean);
notify pgrst,'reload schema';
