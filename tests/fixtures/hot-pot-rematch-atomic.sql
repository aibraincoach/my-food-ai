 do $test$
 declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();j uuid:=gen_random_uuid();a uuid;b uuid;
  payload jsonb;before_ref text;
 begin
  if has_function_privilege('anon','public.persist_operator_rematch(uuid,uuid,uuid[],jsonb)','EXECUTE')
   or has_function_privilege('authenticated','public.persist_operator_rematch(uuid,uuid,uuid[],jsonb)','EXECUTE')
   or not has_function_privilege('service_role','public.persist_operator_rematch(uuid,uuid,uuid[],jsonb)','EXECUTE') then
   raise exception 'Rematch function role exposure';end if;
  insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'hotpot-atomic-'||u);
  insert into posts(id,user_id,status)values(p,u,'processing');
  insert into post_items(post_id,name,source,portion_text,portion_grams)values(p,'Pork for shabu','model','2 thin slices',70)returning id into a;
  insert into post_items(post_id,name,source,portion_text,portion_grams)values(p,'Broth','model','100 g',100)returning id into b;
  insert into item_nutrition(post_item_id,calories,source_ref)values(a,350,'999'),(b,30,'777');
  insert into jobs(id,post_id,kind,status,payload)values(j,p,'recompute','running','{"operator":"rematch"}');
  update posts set active_job_id=j where id=p;
  payload:=jsonb_build_array(jsonb_build_object('post_item_id',a,'portion_grams',30,'calories',30,'source_ref','888'),
    jsonb_build_object('post_item_id',b,'portion_grams',100,'calories',0,'source_ref','shared-pot:v1:{"kind":"broth","original":{"source_ref":"777","calories":30}}'));
  perform persist_operator_rematch(p,j,array[a,b],payload);
  if (select portion_grams from post_items where id=a)<>30 or(select calories from item_nutrition where post_item_id=a)<>30 then raise exception 'Portion/nutrition not committed';end if;
  if (select calories from item_nutrition where post_item_id=b)<>0 then raise exception 'Broth not zero';end if;
  select source_ref into before_ref from item_nutrition where post_item_id=b;
  begin
   perform persist_operator_rematch(p,j,array[a,b],jsonb_build_array(jsonb_build_object('post_item_id',a,'portion_grams',40,'calories',999),jsonb_build_object('post_item_id',gen_random_uuid(),'portion_grams',1,'calories',1)));
   raise exception 'Foreign item accepted';
  exception when sqlstate '22023' then null;end;
  if (select portion_grams from post_items where id=a)<>30 or(select calories from item_nutrition where post_item_id=a)<>30 then raise exception 'Partial rematch escaped rollback';end if;
  if (select source_ref from item_nutrition where post_item_id=b) is distinct from before_ref then raise exception 'Unrelated source changed';end if;
  begin perform persist_operator_rematch(p,j,array[a],payload);raise exception 'Stale snapshot accepted';
  exception when sqlstate 'PT409' then null;end;
  update jobs set payload='{}' where id=j;
  begin perform persist_operator_rematch(p,j,array[a,b],payload);raise exception 'Non-rematch job accepted';
  exception when sqlstate 'PT409' then null;end;
 end $test$;
