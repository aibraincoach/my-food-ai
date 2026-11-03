import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

test('composer drink publication is owner-scoped, atomic, idempotent and scales the chosen item nutrients',()=>{
 assert.ok(process.env.SUPABASE_DB_URL,'Disposable local DB is required');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.SUPABASE_DB_URL).hostname),'Disposable local DB only');
 const migration=readFileSync(new URL('../../supabase/migrations/0040_composer_drinks.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollback/0040_composer_drinks.sql',import.meta.url),'utf8');
 const sql=`begin;set local statement_timeout='20s';
 ${rollback}
 ${migration}
 do $test$
 declare owner_id uuid:=gen_random_uuid();other_id uuid:=gen_random_uuid();stage uuid:=gen_random_uuid();reading uuid;result uuid;selection jsonb;path text;drink jsonb;bad_stage uuid:=gen_random_uuid();bad_reading uuid;items jsonb;expected jsonb;
 begin
 insert into auth.users(id) values(owner_id),(other_id);
 insert into public.profiles(id,handle) values(owner_id,'cd-'||owner_id),(other_id,'cd-'||other_id);
 perform public.reserve_post_upload_with_leftovers(stage,owner_id,'Cola and water',now(),'[{"position":0,"width":390,"height":390}]',null,'{}',false,'Asia/Jakarta');
 path:=owner_id::text||'/'||stage::text||'/0.jpg';
 insert into storage.objects(bucket_id,name,metadata) values('media',path,'{"size":100}'),('media',replace(path,'.jpg','.feed.jpg'),'{"size":50}');
 drink:=jsonb_build_object('name','Coca-Cola, can','ml',330,'grams',330,'kcal',139,'caffeineMg',29.7,'source','read from the can','nutrition',jsonb_build_object('calories',139,'protein_g',0,'carbs_g',35,'fat_g',0,'fibre_g',0,'sugar_g',35,'sodium_mg',10,'source_ref','test-usda','food_category','Soft drinks','micronutrients','[{"nutrientId":1057,"value":29.7,"basis":"portion","unitName":"MG"},{"nutrientId":1051,"value":330,"basis":"portion","unitName":"G"}]'::jsonb));
 insert into public.composer_drink_readings(user_id,upload_id,position,state,all_drinks,drinks)
 values(owner_id,stage,0,'ready',true,jsonb_build_array(drink,drink||'{"name":"Water, glass","ml":300,"grams":null,"nutrition":{"calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"micronutrients":[{"nutrientId":1051,"value":300,"basis":"portion","unitName":"G"}],"food_category":"Water","source_ref":null}}'::jsonb)) returning id into reading;
 begin perform public.correct_composer_drinks(reading,owner_id,'[]',jsonb_build_array(drink));raise exception 'Stale correction accepted';exception when serialization_failure then null;end;
 items:='[{"name":"Coca-Cola, can","portion_text":"165 ml","portion_grams":165,"nutrition":{"calories":69.5,"protein_g":0,"carbs_g":17.5,"fat_g":0,"micronutrients":[{"nutrientId":1057,"value":14.85,"basis":"portion","unitName":"MG"},{"nutrientId":1051,"value":165,"basis":"portion","unitName":"G"}],"food_category":"Soft drinks"}},{"name":"Water, glass","portion_text":"300 ml","portion_grams":null,"nutrition":{"calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"micronutrients":[{"nutrientId":1051,"value":300,"basis":"portion","unitName":"G"}],"food_category":"Water"}}]';
 expected:=jsonb_build_object(reading::text,(select drinks from public.composer_drink_readings where id=reading));
 selection:=jsonb_build_array(jsonb_build_object('reading_id',reading,'selections','[{"index":0,"ml":165},{"index":1,"ml":300}]'::jsonb));
 begin perform public.publish_composer_drinks(stage,other_id,selection,'x',now(),null,false,items,'Consumed: 70 kcal.',expected);raise exception 'Other owner published';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.posts where id=stage) then raise exception 'Refusal changed post';end if;
 result:=public.publish_composer_drinks(stage,owner_id,selection,'Cola and water',now(),null,false,items,'Consumed: 70 kcal.',expected);
 if exists(select 1 from public.composer_drink_readings where upload_id=stage) then raise exception 'Published reading retained a second meal payload';end if;
 if result<>stage or not exists(select 1 from public.posts where id=stage and status='ready' and analysis_initialized_at is not null and identify_model='muse-spark-1.3') then raise exception 'Post not ready atomically';end if;
 if (select count(*) from public.current_post_items where post_id=stage)<>2 then raise exception 'Selected drinks lost';end if;
 if not exists(select 1 from public.current_post_items i join public.item_nutrition n on n.post_item_id=i.id where i.post_id=stage and i.name='Coca-Cola, can' and i.portion_text='165 ml' and n.calories=69.5 and n.micronutrients @> '[{"nutrientId":1057,"value":14.85}]') then raise exception 'Half did not halve calories and measured caffeine';end if;
 if (select count(*) from public.intake_logs where post_id=stage and source='item')<>2 then raise exception 'Intake not atomic';end if;
 if not exists(select 1 from public.intake_logs where post_id=stage and kind='caffeine' and ml=165 and amount=15) then raise exception 'Half caffeine intake wrong';end if;
 if exists(select 1 from public.jobs where post_id=stage and kind='analyze') then raise exception 'Pipeline can overwrite chosen portions';end if;
 if not exists(select 1 from public.post_media where post_id=stage and position=0 and storage_path=path) then raise exception 'Photo is not first slide';end if;
 if public.publish_composer_drinks(stage,owner_id,selection,'ignored duplicate',now(),null,false,items,'Consumed: 70 kcal.',expected)<>stage or (select count(*) from public.current_post_items where post_id=stage)<>2 then raise exception 'Retry not idempotent';end if;
 -- A failed upload rolls back publication and preserves the draft.
 perform public.reserve_post_upload_with_leftovers(bad_stage,owner_id,'x',now(),'[{"position":0,"width":390,"height":390}]',null,'{}',false,'Asia/Jakarta');
 insert into public.composer_drink_readings(user_id,upload_id,position,state,all_drinks,drinks) values(owner_id,bad_stage,0,'ready',true,jsonb_build_array(drink)) returning id into bad_reading;
 begin perform public.publish_composer_drinks(bad_stage,owner_id,jsonb_build_array(jsonb_build_object('reading_id',bad_reading,'selections','[{"index":0,"ml":330}]'::jsonb)),'x',now(),null,false,jsonb_build_array(jsonb_build_object('name','Coca-Cola, can','portion_text','330 ml','portion_grams',330,'nutrition',drink->'nutrition')),'Consumed: 139 kcal.',jsonb_build_object(bad_reading::text,jsonb_build_array(drink)));raise exception 'Incomplete upload accepted';exception when invalid_parameter_value then null;end;
 if exists(select 1 from public.posts where id=bad_stage) or (select published from public.post_upload_drafts where id=bad_stage) then raise exception 'Failed post left partial data';end if;
 if has_table_privilege('authenticated','public.composer_drink_readings','insert') or has_function_privilege('authenticated','public.publish_composer_drinks(uuid,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,text,jsonb)','execute') then raise exception 'Client can forge readings or nutrition';end if;
 end $test$;
 ${rollback}
 do $test$ begin if to_regclass('public.composer_drink_readings') is not null or to_regprocedure('public.publish_composer_drinks(uuid,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,text,jsonb)') is not null then raise exception 'Rollback incomplete';end if;end $test$;
 select 'composer-drinks: passed';rollback;`;
 const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL,'-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',timeout:25000});assert.ifError(result.error);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/composer-drinks: passed/);
});
