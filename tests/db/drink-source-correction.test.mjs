import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {correctedPhotoDrink} from '../../src/lib/intake/drink-correction.ts';

test('entered caffeine reaches the real publication intake and daily amount; corrections leave no old micros',()=>{
 assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');
 assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.SUPABASE_DB_URL).hostname));
 const before={name:'Cola',ml:200,kcal:80,caffeineMg:20,grams:210,source:'read from the can',nutrition:{calories:80,protein_g:0,carbs_g:20,fat_g:0,fibre_g:0,sugar_g:20,sodium_mg:0,micronutrients:[{nutrientId:1092,value:25,basis:'portion'}],source_ref:'123',food_category:'Soft drinks'}};
 const correction={name:'Coffee',pack_amount:200,pack_unit:'ml',caffeine_mg:75,per_100:{calories:1,protein_g:0,carbs_g:0,fat_g:0,fibre_g:null,sugar_g:null,sodium_mg:null}};
 const drink=correctedPhotoDrink(before,correction,'00000000-0000-4000-8000-000000000001');
 const quoted=value=>"'"+JSON.stringify(value).replaceAll("'","''")+"'::jsonb";
 const items=[{name:drink.name,portion_text:'200 ml',portion_grams:null,nutrition:drink.nutrition}];
 const sql=`begin;set local statement_timeout='10s';
 do $test$ declare u uuid:=gen_random_uuid();stage uuid:=gen_random_uuid();r uuid;saved uuid;copied uuid;ref text;d jsonb:=${quoted(drink)};p text;result uuid;
 begin
 insert into auth.users(id) values(u);insert into profiles(id,handle) values(u,'sources-'||u);
 perform reserve_post_upload_with_leftovers(stage,u,'source proof',now(),'[{"position":0,"width":390,"height":390}]',null,'{}',false,'UTC');
 p:=u::text||'/'||stage::text||'/0.jpg';
 insert into storage.objects(bucket_id,name,metadata) values('media',p,'{"size":100}'),('media',replace(p,'.jpg','.feed.jpg'),'{"size":50}');
 insert into composer_drink_readings(user_id,upload_id,position,state,all_drinks,drinks) values(u,stage,0,'ready',true,jsonb_build_array(d)) returning id into r;
 result:=publish_photo_drink_operation(p_operation_id=>gen_random_uuid(),p_user_id=>u,p_request_key=>repeat('a',64),p_upload_id=>stage,p_readings=>jsonb_build_array(jsonb_build_object('reading_id',r,'selections','[{"index":0,"ml":200}]'::jsonb)),p_caption=>'source proof',p_eaten_at=>now(),p_location=>null,p_save_as_meal=>false,p_items=>${quoted(items)},p_summary=>'Consumed: 2 kcal.',p_expected=>jsonb_build_object(r::text,jsonb_build_array(d)));
 if result<>stage then raise exception 'wrong publication';end if;
 if (select sum(amount) from intake_logs where user_id=u and kind='caffeine')<>75 then raise exception 'daily caffeine not entered value';end if;
 if exists(select 1 from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=stage and (n.source_ref not like 'user:drink-correction:%' or n.micronutrients @> '[{"nutrientId":1092}]')) then raise exception 'old supplier or potassium survived';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 foreach ref in array array[d->'nutrition'->>'source_ref','barcode-own:123','barcode:123'] loop
  update item_nutrition set source_ref=ref where post_item_id in (select id from current_post_items where post_id=stage);
  saved:=save_meal_from_post(stage,'Saved source proof');
  copied:=copy_owned_saved_meal(saved,now());
  if (select n.source_ref from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=copied) is distinct from ref then raise exception 'saved copy lost source ref';end if;
  copied:=copy_owned_post(stage,now());
  if (select n.source_ref from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=copied) is distinct from ref then raise exception 'log-again lost source ref';end if;
 end loop;
 end $test$;rollback;`;
 const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL,'-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',timeout:15000});
 assert.equal(result.status,0,result.stderr);
});
