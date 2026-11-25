// Full migrated disposable DB only. Every seeded row is rolled back.
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const url=process.env.TEST_SQL_DATABASE_URL;
test('saved and log-again copies preserve exact MEXT identity and null-valued markers',()=>{
 assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');assert.ok(['127.0.0.1','localhost'].includes(new URL(url).hostname));
 const input=`begin;set local lock_timeout='1s';set local statement_timeout='5s';
 do $test$ declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();i uuid:=gen_random_uuid();s uuid;c uuid;
 nutrients jsonb:='[{"nutrientId":1008,"nutrientName":"Energy","unitName":"KCAL","basis":"portion","value":null,"marker":"trace"},{"nutrientId":2000,"nutrientName":"Sugars","unitName":"G","basis":"portion","value":null,"marker":"not_measured"}]';
 begin
 insert into auth.users(id) values(u);insert into profiles(id,handle) values(u,'mext-'||u);
 insert into posts(id,user_id,status,render_time_zone) values(p,u,'ready','Asia/Tokyo');
 insert into post_items(id,post_id,name,portion_grams,source) values(i,p,'Rice',100,'model');
 insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,micronutrients,source_ref) values(i,null,2,30,0,nutrients,'mext:01088');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 s:=save_meal_from_post(p,'Saved MEXT meal');
 if not exists(select 1 from saved_meals where id=s and items->0->'nutrition'->>'source_ref'='mext:01088' and items->0->'nutrition'->'micronutrients'=nutrients) then raise exception 'Saved snapshot lost markers or identity';end if;
 c:=copy_owned_saved_meal(s,now());
 if not exists(select 1 from current_post_items j join item_nutrition n on n.post_item_id=j.id where j.post_id=c and n.source_ref='mext:01088' and n.calories is null and n.micronutrients=nutrients)then raise exception 'Saved copy lost markers or identity';end if;
 c:=copy_owned_post(p,now());
 if not exists(select 1 from current_post_items j join item_nutrition n on n.post_item_id=j.id where j.post_id=c and n.source_ref='mext:01088' and n.calories is null and n.micronutrients=nutrients)then raise exception 'Log-again copy lost markers or identity';end if;
 end $test$;rollback;`;
 const r=spawnSync('psql',['-XqAt','--dbname',url,'-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',timeout:15000});assert.ifError(r.error);assert.equal(r.status,0,r.stderr);
});
