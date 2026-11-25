import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const db=process.env.TEST_SQL_DATABASE_URL;
const input=String.raw`do $test$ declare u uuid:=gen_random_uuid(); token uuid:=gen_random_uuid(); operation uuid; source_post uuid; p uuid; replay uuid; upload uuid:=gen_random_uuid();reading uuid; saved uuid; zone text; kind integer; before_count integer; before_receipts integer; before_intake integer; before_corrections integer; choices jsonb; expected jsonb; items jsonb; drinks jsonb;key text:=repeat('a',64);n jsonb:='{"calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fibre_g":0,"sugar_g":0,"sodium_mg":0,"micronutrients":[{"nutrientId":1051,"value":300,"basis":"portion","unitName":"G"}]}';
begin
 insert into auth.users(id)values(u);insert into public.profiles(id,handle)values(u,'zone-'||u);
 insert into public.agent_tokens(id,user_id,name,token_hash,token_last4)values(token,u,'Zone fixture',token::text,'0000');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 select count(*) into before_count from public.posts where user_id=u;
 select count(*) into before_receipts from (select operation_id from public.food_post_operations where user_id=u union all select operation_id from public.drink_post_operations where user_id=u union all select operation_id from public.copy_post_operations where user_id=u) r;
 select count(*) into before_intake from public.intake_logs where user_id=u;
 select count(*) into before_corrections from public.barcode_corrections where user_id=u;
 foreach zone in array array[null,'+01:00','-0530','EST','GMT+1','Bad/Zone'] loop
  for kind in 1..5 loop
   begin
    if kind=1 then perform public.publish_food_operation(gen_random_uuid(),u,key,now(),'Food',50,n,zone);
    elsif kind=2 then perform public.publish_drink_operation(gen_random_uuid(),u,key,now(),'water',300,'Water',0,n,zone);
    elsif kind=3 then perform public.publish_photo_drink_operation(gen_random_uuid(),u,key,upload,'[]','Photo',now(),null,false,'[]','Summary','{}',zone);
    elsif kind=4 then perform public.publish_copy_operation(gen_random_uuid(),gen_random_uuid(),false,now(),zone);
    else perform public.agent_log_meal(u,token,'Food',now(),zone);end if;
    raise exception 'Invalid zone accepted by function %',kind;
   exception when sqlstate 'PT400' then null;end;
  end loop;
 end loop;
 if (select count(*) from public.posts where user_id=u)<>before_count or (select count(*) from public.intake_logs where user_id=u)<>before_intake
 or (select count(*) from public.barcode_corrections where user_id=u)<>before_corrections
 or (select count(*) from (select operation_id from public.food_post_operations where user_id=u union all select operation_id from public.drink_post_operations where user_id=u union all select operation_id from public.copy_post_operations where user_id=u)r)<>before_receipts then raise exception 'Rejected zone left a publication write';end if;
 -- Each publication checks the explicit zone, writes it atomically, repairs C1's null replay, then refuses changed zones.
 for kind in 1..4 loop
  operation:=gen_random_uuid();
  if kind=1 then p:=public.publish_food_operation(operation,u,key,now(),'Food',50,n,'Asia/Tokyo');source_post:=p;
  elsif kind=2 then p:=public.publish_drink_operation(operation,u,key,now(),'water',300,'Water',0,n,'Asia/Tokyo');
  elsif kind=3 then
   perform public.reserve_post_upload_with_leftovers(upload,u,'Water',now(),'[{"position":0,"width":390,"height":390}]',null,'{}',false,'Asia/Jakarta');
   insert into storage.objects(bucket_id,name,metadata)values('media',u||'/'||upload||'/0.jpg','{"size":100}'),('media',u||'/'||upload||'/0.feed.jpg','{"size":50}');
   drinks:=jsonb_build_array(jsonb_build_object('name','Water','ml',300,'grams',null,'kcal',0,'caffeineMg',0,'source','photo estimate','nutrition',n));
   insert into public.composer_drink_readings(user_id,upload_id,position,state,all_drinks,drinks)values(u,upload,0,'ready',true,drinks)returning id into reading;
   choices:=jsonb_build_array(jsonb_build_object('reading_id',reading,'selections','[{"index":0,"ml":150}]'::jsonb));expected:=jsonb_build_object(reading::text,drinks);
   items:=jsonb_build_array(jsonb_build_object('name','Water','portion_text','150 ml','portion_grams',null,'nutrition',n));
   p:=public.publish_photo_drink_operation(operation,u,key,upload,choices,'Water',now(),null,false,items,'Summary',expected,'Asia/Tokyo');
  else p:=public.publish_copy_operation(operation,source_post,false,now(),'Asia/Tokyo');end if;
  if (select render_time_zone from public.posts where id=p) is distinct from 'Asia/Tokyo' then raise exception 'Atomic stored zone missing for %',kind;end if;
  update public.posts set render_time_zone=null where id=p;
  foreach zone in array array['Asia/Tokyo','Europe/London'] loop
   begin
    if kind=1 then replay:=public.publish_food_operation(operation,u,key,now(),'Food',50,n,zone);
    elsif kind=2 then replay:=public.publish_drink_operation(operation,u,key,now(),'water',300,'Water',0,n,zone);
    elsif kind=3 then replay:=public.publish_photo_drink_operation(operation,u,key,upload,choices,'Water',now(),null,false,'[]','Summary','{}',zone);
    else replay:=public.publish_copy_operation(operation,source_post,false,(select eaten_at from public.copy_post_operations where operation_id=operation),zone);end if;
    if zone<>'Asia/Tokyo' then raise exception 'Different non-null zone accepted for %',kind;end if;
    if replay<>p or (select render_time_zone from public.posts where id=p)<>'Asia/Tokyo' then raise exception 'C1 missing-zone receipt not repaired for %',kind;end if;
   exception when sqlstate 'PT409' then if zone='Asia/Tokyo' then raise exception 'C1 receipt repair rejected';end if;end;
  end loop;
 end loop;
 p:=public.agent_log_meal(u,token,'Agent food',now(),'Asia/Tokyo');
 if (select render_time_zone from public.posts where id=p)<>'Asia/Tokyo' then raise exception 'Agent zone not stored';end if;
 if not has_function_privilege('authenticated','public.publish_copy_operation(uuid,uuid,boolean,timestamptz,text)','execute')
 or has_function_privilege('authenticated','public.agent_log_meal(uuid,uuid,text,timestamptz,text)','execute') then raise exception 'Zone overload grant mismatch';end if;
end $test$;`;
function run(prefix=''){
 assert.ok(db&&['localhost','127.0.0.1','[::1]'].includes(new URL(db).hostname),'Disposable migrated database required');
 return spawnSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input:"begin;set local statement_timeout='8s';"+prefix+input+'rollback;',encoding:'utf8',timeout:15000});
}
test('all atomic zone writers reject invalid values without writes; repair C1 null replays; preserve first real zone',()=>{const r=run();assert.ifError(r.error);assert.equal(r.status,0,r.stderr);});
test('the replay repair test goes red when WHERE-null repair is removed',()=>{
 const source=fs.readFileSync(new URL('../../supabase/migrations/0082_atomic_capture_zones.sql',import.meta.url),'utf8');
 const a=source.indexOf('create function public.publish_food_operation'),b=source.indexOf('revoke all on function public.publish_food_operation',a);
 const mutation=source.slice(a,b).replace('create function','create or replace function').replace('  update public.posts set render_time_zone=p_render_zone where id=receipt.post_id and render_time_zone is null;','');
 const r=run(mutation);assert.ifError(r.error);assert.notEqual(r.status,0);assert.match(r.stderr,/C1 receipt repair rejected/);
});

test('0082 refuses a message-first schema before defining any zone function',()=>{
 assert.ok(db&&['localhost','127.0.0.1','[::1]'].includes(new URL(db).hostname));
 const source=fs.readFileSync(new URL('../../supabase/migrations/0082_atomic_capture_zones.sql',import.meta.url),'utf8');
 const guard=source.slice(source.indexOf('do $$'),source.indexOf('create function public.require_capture_zone'));
 assert.ok(guard.includes('p_message'));
 const r=spawnSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input:"begin;create function public.publish_photo_drink_operation(p_message jsonb) returns uuid language sql as $$select null::uuid$$;"+guard+'rollback;',encoding:'utf8',timeout:10000});
 assert.ifError(r.error);assert.notEqual(r.status,0);assert.match(r.stderr,/0082 must precede 0084/);
});
