import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {user} from './db/helpers.mjs';
import {remainderRule} from '../src/lib/pipeline/remainder-rule.ts';
const estimate=(remaining,counts={})=>({index:0,remaining_grams:remaining,total_count:null,remaining_count:null,unit:null,...counts});
test('not-eaten difference clamps the photographed amount and preserves count records',()=>{
 assert.deepEqual(remainderRule(800,estimate(300,{total_count:8,remaining_count:3,unit:'slices'})),{consumedGrams:500,notEatenGrams:300,countText:'5 of 8 slices',notEatenCountText:'3 slices',consumedText:'5 of 8 slices',notEatenText:'3 slices'});
 assert.equal(remainderRule(100,estimate(200)).consumedGrams,0);
 assert.equal(remainderRule(100,estimate(-20)).consumedGrams,100);
 assert.equal(remainderRule(100,estimate(25)).countText,null);
 assert.equal(remainderRule(100,estimate(25)).notEatenText,'25 g');
 assert.equal(remainderRule(100,estimate(25,{total_count:2,remaining_count:3,unit:'pieces'})).countText,null);
 assert.throws(()=>remainderRule(Number.NaN,estimate(10)));
});
test('not-eaten revision keeps history, exact nutrition, retry idempotency and owner access',async()=>{
 assert.ok(process.env.SUPABASE_DB_URL,'SUPABASE_DB_URL is required');
 const owner=await user(1),other=await user(2);
 const migrations=['0025_barcode_corrections.sql','0026_saved_meals.sql','0027_not_eaten.sql'].map(name=>readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8')).join('\n');
 const sql=`\\set ON_ERROR_STOP on
begin;
${migrations}
select '${owner.user.id}'::uuid as owner_id \\gset
select '${other.user.id}'::uuid as other_id \\gset
select gen_random_uuid() as post_id,gen_random_uuid() as job_id \\gset
insert into public.posts(id,user_id,caption,status,analysis_initialized_at) values(:'post_id',:'owner_id','Meal','processing',now());
insert into public.jobs(id,post_id,kind,status,payload) values(:'job_id',:'post_id','remainder','running','{"post_ownership":true}');
update public.posts set active_job_id=:'job_id' where id=:'post_id';
insert into public.post_media(post_id,storage_path,position,width,height) values(:'post_id',:'owner_id'||'/'||:'post_id'||'/0.jpg',0,100,100);
insert into public.post_media(post_id,storage_path,position,width,height,not_eaten) values(:'post_id',:'owner_id'||'/'||:'post_id'||'/1.jpg',1,100,100,true) returning id as photo_id \\gset
insert into public.post_items(post_id,name,portion_grams,source) values(:'post_id','Meal',100,'model') returning id as item_id \\gset
insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,micronutrients) values(:'item_id',200,10,20,5,'[]');
select jsonb_build_array(jsonb_build_object('old_id',:'item_id','portion_grams',60,'portion_text','60 g','not_eaten_grams',40,'count_text','3 of 5 pieces','not_eaten_count_text','2 pieces','nutrition',jsonb_build_object('calories',120,'protein_g',6,'carbs_g',12,'fat_g',3,'micronutrients','[]'::jsonb)))::text as replacement \\gset
select public.apply_post_remainder(:'post_id',:'job_id',:'photo_id',array[:'item_id'::uuid],:'replacement'::jsonb,'Not eaten: 2 pieces · 80 kcal. Consumed: 3 of 5 pieces · 120 kcal.');
select public.apply_post_remainder(:'post_id',:'job_id',:'photo_id',array[:'item_id'::uuid],:'replacement'::jsonb,'Duplicate reply must not appear.');
select set_config('run5.post',:'post_id',true),set_config('run5.item',:'item_id',true);
do $$ begin
 if (select not_eaten from public.post_media where post_id=current_setting('run5.post')::uuid and position=0) then raise exception 'First photo default changed';end if;
 if (select portion_grams from public.current_post_items where post_id=current_setting('run5.post')::uuid) is distinct from 60::numeric then raise exception 'Consumed grams differ';end if;
 if (select n.calories from public.item_nutrition n join public.current_post_items i on i.id=n.post_item_id where i.post_id=current_setting('run5.post')::uuid) is distinct from 120::numeric then raise exception 'Consumed nutrition differs';end if;
 if (select count(*) from public.post_comments where post_id=current_setting('run5.post')::uuid)<>1 then raise exception 'Reply duplicated on retry';end if;
 if not exists(select 1 from public.post_items where id=current_setting('run5.item')::uuid and superseded_at is not null) then raise exception 'History lost';end if;
 begin update public.post_media set not_eaten=true where post_id=current_setting('run5.post')::uuid and position=0;raise exception 'First photo accepted';exception when check_violation or unique_violation then null;end;
end $$;
update public.jobs set payload=payload-'remainder_applied' where id=:'job_id';
select set_config('run5.job',:'job_id',true),set_config('run5.photo',:'photo_id',true),set_config('run5.replacement',:'replacement',true);
do $$ begin
 begin perform public.apply_post_remainder(current_setting('run5.post')::uuid,current_setting('run5.job')::uuid,current_setting('run5.photo')::uuid,array[current_setting('run5.item')::uuid],current_setting('run5.replacement')::jsonb,'Stale revision');raise exception 'Stale revision accepted';exception when serialization_failure then null;end;
end $$;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',:'other_id','role','authenticated')::text,true);
do $$ begin
 if exists(select 1 from public.post_media where post_id=current_setting('run5.post')::uuid) or exists(select 1 from public.current_post_items where post_id=current_setting('run5.post')::uuid) then raise exception 'Cross-user remainder visible';end if;
end $$;
reset role;
rollback;
`;
 const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:90000});
 assert.equal(result.status,0,result.stderr||'Database difference test failed');
});
