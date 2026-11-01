import {absentMigration} from './fixtures/absent-migration.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';

test('an owner attaches verified staged media once and a no-text photo correction preserves history without a forged user comment',{skip:!process.env.SUPABASE_DB_URL},async()=>{
 const ids=[];
 for(const prefix of ['TEST_USER','TEST_USER2']){
  const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await client.auth.signInWithPassword({email:process.env[`${prefix}_EMAIL`],password:process.env[`${prefix}_PASSWORD`]});assert.ifError(error);ids.push(data.user.id);
 }
 const migrations=['0025_barcode_corrections.sql','0026_saved_meals.sql','0027_not_eaten.sql'].map(file=>absentMigration(readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'),file)).join('\n');
 const script=`\\set ON_ERROR_STOP on
begin;
${migrations}
select '${ids[0]}'::uuid as owner,'${ids[1]}'::uuid as other,gen_random_uuid() as stage \\gset
select public.create_food_post(:'owner',now(),'Coffee',100,'{"calories":5}') as post \\gset
insert into public.post_media(post_id,storage_path,position,width,height,kind) values(:'post',:'owner'||'/'||:'post'||'/0.jpg',0,390,390,'photo');
select :'owner'||'/'||:'stage'||'/0.jpg' as source \\gset
insert into storage.objects(bucket_id,name) values('media',:'source'),('media',replace(:'source','.jpg','.feed.jpg'));
insert into jobs(post_id,kind,priority,status,run_after,payload) values(null,'media_cleanup',200,'queued',now()+interval '3 hours',jsonb_build_object('owner_id',:'owner','deleted_post_id',:'stage','paths',jsonb_build_array(:'source',replace(:'source','.jpg','.feed.jpg'))));
select (public.prepare_post_photo_attachment(:'post',:'owner',:'source',false)).id as reservation \\gset
select target_path as target from public.post_photo_attachments where id=:'reservation' \\gset
insert into storage.objects(bucket_id,name) values('media',:'target'),('media',replace(:'target','.jpg','.feed.jpg'));
select public.complete_post_photo_attachment(:'reservation',:'owner',390,390) as media \\gset
select public.complete_post_photo_attachment(:'reservation',:'owner',390,390)=:'media'::uuid as retry_ok \\gset
\\if :retry_ok
\\else
select 1/0 as attachment_retry_failed;
\\endif
select count(*)=1 as once_ok from jobs where post_id=:'post' and kind='correct' \\gset
\\if :once_ok
\\else
select 1/0 as duplicate_photo_job;
\\endif
select id as job from jobs where post_id=:'post' and kind='correct' \\gset
update jobs set status='running',payload=payload||'{"post_ownership":true,"correction_from_sequence":0,"correction_pending_ids":[]}'::jsonb where id=:'job';
update posts set active_job_id=:'job' where id=:'post';
select id as original from current_post_items where post_id=:'post' \\gset
select public.persist_photo_correction(:'post',:'job',array[:'original'::uuid],jsonb_build_array(jsonb_build_object('name','Coffee','portion_text','100 g','portion_grams',100,'supersedes',:'original','nutrition',jsonb_build_object('calories',5))),'Meal items and portions are unchanged. Consumed 5 kcal.');
select (select count(*)=2 from post_items where post_id=:'post') and (select count(*)=1 from post_comments where post_id=:'post' and author='model') and (select count(*)=0 from post_comments where post_id=:'post' and author='user') as history_ok \\gset
\\if :history_ok
\\else
select 1/0 as photo_history_failed;
\\endif
select public.create_drink_post(:'owner',now(),'water',330,'Water',0,'{"portion_unit":"ml","calories":0}') as drink \\gset
select set_config('attachment.test_drink',:'drink',true),set_config('attachment.test_owner',:'owner',true);
select set_config('attachment.test_post',:'post',true),set_config('attachment.test_other',:'other',true),set_config('attachment.test_source',:'source',true);
do $check$ begin
 begin perform public.prepare_post_photo_attachment(current_setting('attachment.test_drink')::uuid,current_setting('attachment.test_owner')::uuid,current_setting('attachment.test_source'),false);raise exception 'drink entered meal correction path';exception when sqlstate '55000' then null;end;
 if (select status from public.posts where id=current_setting('attachment.test_drink')::uuid)<>'ready' then raise exception 'Drink record changed';end if;
 begin perform public.prepare_post_photo_attachment(current_setting('attachment.test_post')::uuid,current_setting('attachment.test_other')::uuid,current_setting('attachment.test_source'),false);raise exception 'foreign post accepted';exception when insufficient_privilege then null;end;
end $check$;
rollback;
\\echo added_photo_data_passed`;
 const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:script,encoding:'utf8',timeout:90000});assert.ifError(result.error);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/added_photo_data_passed/);
});
