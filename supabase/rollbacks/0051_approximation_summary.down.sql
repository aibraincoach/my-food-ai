-- Original analysis functions remain unchanged.
drop function public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean);
notify pgrst,'reload schema';
