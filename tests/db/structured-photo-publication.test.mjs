import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const source=readFileSync(new URL('../../supabase/migrations/0084_structured_comment_messages.sql',import.meta.url),'utf8');
const input=String.raw`do $test$ declare u uuid:=gen_random_uuid();upload uuid:=gen_random_uuid();operation uuid:=gen_random_uuid();r uuid;p uuid;again uuid;summary uuid;choices jsonb;expected jsonb;items jsonb;drinks jsonb;before_count integer;
 n jsonb:='{"calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"micronutrients":[]}';
 message jsonb:='{"code":"mealSummary","values":{"kind":"consumed","totals":{"calories":0,"protein_g":0,"carbs_g":0,"fat_g":0},"approximations":[],"unavailable":[]}}';
 begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'structured-photo-'||u);
 -- Bad zones and bad structured codes never create a post, comment or receipt.
 begin perform publish_photo_drink_operation(operation,u,repeat('a',64),upload,'[]','Water',now(),null,false,'[]',message,'{}','+01:00');raise exception 'Offset zone accepted';exception when sqlstate 'PT400' then null;end;
 begin perform publish_photo_drink_operation(operation,u,repeat('a',64),upload,'[]','Water',now(),null,false,'[]',null::jsonb,'{}','Asia/Tokyo');raise exception 'Null summary accepted';exception when invalid_parameter_value then null;end;
 begin perform publish_photo_drink_operation(operation,u,repeat('a',64),upload,'[]','Water',now(),null,false,'[]','{"code":"editRemoved","values":{"name":null}}'::jsonb,'{}','Asia/Tokyo');raise exception 'Bad summary code accepted';exception when invalid_parameter_value then null;end;
 if exists(select 1 from posts where user_id=u) or exists(select 1 from drink_post_operations where user_id=u) then raise exception 'Refused publication wrote rows';end if;
 perform reserve_post_upload_with_leftovers(upload,u,'Water',now(),'[{"position":0,"width":390,"height":390}]',null,'{}',false,'Asia/Jakarta');
 select count(*) into before_count from posts where user_id=u;
 begin perform publish_composer_drinks(upload,u,null,null,null,null,false,null,null::jsonb,null,'Asia/Tokyo');raise exception 'Null composer summary accepted';exception when invalid_parameter_value then null;end;
 begin perform publish_composer_drinks(upload,u,null,null,null,null,false,null,'{"code":"editRemoved","values":{"name":null}}'::jsonb,null,'Asia/Tokyo');raise exception 'Invalid composer summary accepted';exception when invalid_parameter_value then null;end;
 if (select count(*) from posts where user_id=u)<>before_count or exists(select 1 from post_comments c join posts p on p.id=c.post_id where p.user_id=u) or exists(select 1 from drink_post_operations where user_id=u) or (select published from post_upload_drafts where id=upload) then raise exception 'Invalid summary left publication rows';end if;
 insert into storage.objects(bucket_id,name,metadata)values('media',u||'/'||upload||'/0.jpg','{"size":100}'),('media',u||'/'||upload||'/0.feed.jpg','{"size":50}');
 drinks:=jsonb_build_array(jsonb_build_object('name','Water','ml',300,'grams',null,'kcal',0,'caffeineMg',0,'source','photo estimate','nutrition',n));
 insert into composer_drink_readings(user_id,upload_id,position,state,all_drinks,drinks)values(u,upload,0,'ready',true,drinks)returning id into r;
 choices:=jsonb_build_array(jsonb_build_object('reading_id',r,'selections','[{"index":0,"ml":150}]'::jsonb));expected:=jsonb_build_object(r::text,drinks);
 items:=jsonb_build_array(jsonb_build_object('name','Water','portion_text','150 ml','portion_grams',null,'nutrition',n));
 p:=publish_photo_drink_operation(operation,u,repeat('a',64),upload,choices,'Water',now(),null,false,items,message,expected,'Asia/Tokyo');
 select summary_comment_id into summary from posts where id=p;
 if (select render_time_zone from posts where id=p) is distinct from 'Asia/Tokyo' or summary is null
 or (select c.message from post_comments c where c.id=summary) is distinct from message or (select body from post_comments where id=summary) is not null then raise exception 'Zone/message/pointer were not committed together';end if;
 update posts set render_time_zone=null where id=p;
 again:=publish_photo_drink_operation(operation,u,repeat('a',64),upload,null,'Water',now(),null,false,null,null::jsonb,null,'Asia/Tokyo');
 if again<>p or (select render_time_zone from posts where id=p) is distinct from 'Asia/Tokyo' or (select count(*) from post_comments where post_id=p)<>1 then raise exception 'Replay repair or summary dedupe failed';end if;
 update posts set render_time_zone=null where id=p;
 again:=publish_composer_drinks(upload,u,null,null,null,null,false,null,null::jsonb,null,'Asia/Tokyo');
 if again<>p or (select render_time_zone from posts where id=p) is distinct from 'Asia/Tokyo' or (select count(*) from post_comments where post_id=p)<>1 then raise exception 'Published composer null-message replay failed';end if;
 begin perform publish_composer_drinks(upload,u,null,null,null,null,false,null,null::jsonb,null,'Europe/London');raise exception 'Changed composer zone accepted';exception when sqlstate 'PT409' then null;end;
 begin perform publish_photo_drink_operation(operation,u,repeat('a',64),upload,null,'Water',now(),null,false,null,null::jsonb,null,'Europe/London');raise exception 'Changed zone accepted';exception when sqlstate 'PT409' then null;end;
 if has_function_privilege('authenticated','public.publish_photo_drink_operation(uuid,uuid,text,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,jsonb,jsonb,text)','execute')
 or not has_function_privilege('service_role','public.publish_photo_drink_operation(uuid,uuid,text,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,jsonb,jsonb,text)','execute') then raise exception 'Structured photo grants changed';end if;
 end $test$;`;
function run(prefix=''){
 const db=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(db&&new URL(db).hostname==='127.0.0.1'&&process.env.MFA_TEST_DISPOSABLE==='1','Own disposable stack required');
 const r=spawnSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input:"begin;set local statement_timeout='8s';"+prefix+input+'rollback;',encoding:'utf8',timeout:15000});assert.ifError(r.error);return r;
}
test('both-parameter photo publication commits zone, message and own pointer atomically and repairs receipt retries',()=>{const r=run();assert.equal(r.status,0,r.stderr);});
test('removing the structured composer zone write goes red on the shared publication check',()=>{
 const a=source.indexOf('create function public.publish_composer_drinks'),b=source.indexOf('revoke all on function public.publish_composer_drinks',a);
 const mutation=source.slice(a,b).replace('create function','create or replace function').replace(' update public.posts set render_time_zone=p_render_zone where id=result;','');
 assert.notEqual(mutation,source.slice(a,b));const r=run(mutation);assert.notEqual(r.status,0);assert.match(r.stderr,/Zone\/message\/pointer were not committed together/);
});
