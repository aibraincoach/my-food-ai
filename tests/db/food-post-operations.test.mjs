import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{spawnSync}from'node:child_process';
test('food receipts are atomic, owner-only, idempotent and tombstone removed posts',()=>{
 assert.ok(process.env.SUPABASE_DB_URL);assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.SUPABASE_DB_URL).hostname),'Disposable local DB only');
 const migration=readFileSync(new URL('../../supabase/migrations/0043_food_post_operations.sql',import.meta.url),'utf8'),rollback=readFileSync(new URL('../../supabase/rollback/0043_food_post_operations.sql',import.meta.url),'utf8');
 const sql='begin;set local statement_timeout=\'20s\';\n'+rollback+'\n'+migration+String.raw`
 do $test$ declare owner_id uuid:=gen_random_uuid();other_id uuid:=gen_random_uuid();operation uuid:=gen_random_uuid();bad_operation uuid:=gen_random_uuid();result uuid;retried uuid;before_count bigint;key text:=repeat('a',64);nutrition jsonb:='{"calories":406,"protein_g":8,"carbs_g":45,"fat_g":21,"fibre_g":2,"sugar_g":10,"sodium_mg":300,"source_ref":"fixture"}';
 begin
 insert into auth.users(id)values(owner_id),(other_id);insert into public.profiles(id,handle)values(owner_id,'food-'||owner_id),(other_id,'food-'||other_id);
 result:=public.publish_food_operation(operation,owner_id,key,now(),'Croissant fixture',100,nutrition);
 retried:=public.publish_food_operation(operation,owner_id,key,now(),'Later resolved name',100,nutrition);
 if retried<>result or (select count(*) from public.posts where user_id=owner_id)<>1 then raise exception 'Retry duplicated the committed post';end if;
 if (select status from public.posts where id=result)<>'ready' or (select count(*) from public.current_post_items where post_id=result)<>1 then raise exception 'Receipt committed without ready nutrition';end if;
 if not exists(select 1 from public.current_post_items i join public.item_nutrition n on n.post_item_id=i.id where i.post_id=result and n.calories=406) then raise exception 'Resolved nutrition missing';end if;
 begin perform public.publish_food_operation(operation,other_id,key,now(),'Wrong owner',100,nutrition);raise exception 'Other owner replay accepted';exception when insufficient_privilege then null;end;
 begin perform public.publish_food_operation(operation,owner_id,repeat('b',64),now(),'Changed choice',100,nutrition);raise exception 'Changed selection accepted';exception when sqlstate 'PT409' then null;end;
 select count(*) into before_count from public.posts where user_id=owner_id;
 begin perform public.publish_food_operation(bad_operation,owner_id,key,now(),'Missing pack',100,nutrition,jsonb_build_object('path',owner_id||'/'||gen_random_uuid()||'/0.jpg','width',390,'height',390));raise exception 'Missing photo accepted';exception when invalid_parameter_value then null;end;
 if exists(select 1 from public.food_post_operations where operation_id=bad_operation) or (select count(*) from public.posts where user_id=owner_id)<>before_count then raise exception 'Failed publication left partial receipt/post';end if;
 delete from public.posts where id=result;
 begin perform public.publish_food_operation(operation,owner_id,key,now(),'Deleted retry',100,nutrition);raise exception 'Deleted post resurrected';exception when sqlstate 'PT410' then null;end;
 if has_table_privilege('authenticated','public.food_post_operations','insert') or has_function_privilege('authenticated','public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,jsonb)','execute') then raise exception 'Client can forge resolved nutrition or receipts';end if;
 end $test$;
 `+rollback+String.raw`
 do $test$ begin if to_regclass('public.food_post_operations') is not null or to_regprocedure('public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,jsonb)') is not null then raise exception 'Rollback incomplete';end if;end $test$;
 select 'food-operations: passed';rollback;`;
 const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL,'-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',timeout:25000});assert.ifError(result.error);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/food-operations: passed/);
});
