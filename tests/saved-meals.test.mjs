import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {user} from './db/helpers.mjs';
const migration=readFileSync(new URL('../supabase/migrations/0026_saved_meals.sql',import.meta.url),'utf8');
test('saved meals retain exact nutrition, time and owner access in one transaction',async()=>{
 assert.ok(process.env.SUPABASE_DB_URL,'SUPABASE_DB_URL is required');
 const first=await user(1),second=await user(2);
 assert.match(first.user.id,/^[0-9a-f-]{36}$/);assert.match(second.user.id,/^[0-9a-f-]{36}$/);
 const sql=`\\set ON_ERROR_STOP on
begin;
${migration}
select '${first.user.id}'::uuid as owner_id \\gset
select '${second.user.id}'::uuid as other_id \\gset
select gen_random_uuid() as post_id \\gset
insert into public.posts(id,user_id,caption,status,analysis_initialized_at) values(:'post_id',:'owner_id','Coffee','ready',now());
insert into public.post_items(post_id,name,portion_text,portion_grams,source) values(:'post_id','Coffee','240 ml',null,'user') returning id as item_id \\gset
insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,micronutrients) values(:'item_id',5.125,1.25,2.5,0.75,'[]');
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',:'owner_id','role','authenticated')::text,true);
select public.save_meal_from_post(:'post_id','Coffee') as saved_id \\gset
select public.log_saved_meal(:'saved_id',now()-interval '1 day') as copied_id \\gset
select set_config('run5.copy',:'copied_id',true);
do $$ begin
 if (select sum(n.calories) from public.item_nutrition n join public.current_post_items i on i.id=n.post_item_id where i.post_id=current_setting('run5.copy')::uuid) is distinct from 5.125::numeric then raise exception 'Nutrition changed'; end if;
 if (select status from public.posts where id=current_setting('run5.copy')::uuid)<>'ready' then raise exception 'Copy not ready'; end if;
 if (select eaten_at>now()-interval '23 hours' from public.posts where id=current_setting('run5.copy')::uuid) then raise exception 'Chosen time changed'; end if;
 begin insert into public.saved_meals(user_id,name,items) values(auth.uid(),repeat('x',81),'[]');raise exception 'Accepted long name';exception when check_violation then null;end;
end $$;
select set_config('run5.saved',:'saved_id',true),set_config('run5.post',:'post_id',true);
select set_config('request.jwt.claims',json_build_object('sub',:'other_id','role','authenticated')::text,true);
do $$ begin
 if exists(select 1 from public.saved_meals where id=current_setting('run5.saved')::uuid) then raise exception 'Cross-user saved meal visible';end if;
 begin perform public.log_saved_meal(current_setting('run5.saved')::uuid,now());raise exception 'Cross-user log allowed';exception when insufficient_privilege then null;end;
 begin perform public.log_post_again(current_setting('run5.post')::uuid,now());raise exception 'Cross-user copy allowed';exception when insufficient_privilege then null;end;
end $$;
rollback;`;
 const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:90000});
 await first.client.auth.signOut({scope:'local'});await second.client.auth.signOut({scope:'local'});
 assert.equal(result.status,0,result.stderr);
});
