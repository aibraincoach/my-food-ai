import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const migration=readFileSync(new URL('../../supabase/migrations/0084_structured_comment_messages.sql',import.meta.url),'utf8');
const down=readFileSync(new URL('../../supabase/rollback/0084_structured_comment_messages.down.sql',import.meta.url),'utf8');
const zone=readFileSync(new URL('../../supabase/migrations/0082_atomic_capture_zones.sql',import.meta.url),'utf8');
const zoneDown=readFileSync(new URL('../../supabase/rollback/0082_atomic_capture_zones.down.sql',import.meta.url),'utf8');
const inner=s=>s.replace(/^begin;$/m,'').replace(/^commit;$/m,'');
function run(sql){
 const db=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(db&&new URL(db).hostname==='127.0.0.1'&&process.env.MFA_TEST_DISPOSABLE==='1','Own disposable stack required');
 const r=spawnSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input:'begin;set local statement_timeout=\'8s\';'+sql+'rollback;',encoding:'utf8',timeout:15000});
 assert.ifError(r.error);return r;
}
test('0084 without0082 refuses before any new column or function;0082 then0084 composes one both-parameter photo overload',()=>{
 const r=run(inner(down)+inner(zoneDown)+`
 do $test$ begin
  begin execute $apply$${inner(migration)}$apply$;raise exception 'Missing0082 accepted';
  exception when invalid_parameter_value then
   if sqlerrm not like '0084 requires applied 0082%' then raise;end if;
  end;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='post_comments' and column_name='message')
   or exists(select 1 from pg_proc where proname='append_meal_summary') then raise exception 'Guard left schema writes';end if;
 end $test$;
 `+inner(zone)+inner(migration)+`
 do $test$ begin
  if (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='publish_photo_drink_operation' and p.proargnames @> array['p_message','p_render_zone']::text[])<>1 then raise exception 'Both-parameter photo overload missing or ambiguous';end if;
  if to_regprocedure('public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,text,jsonb,jsonb)') is null then raise exception 'Final food zone signature lost';end if;
 end $test$;`);
 assert.equal(r.status,0,r.stderr);
});
test('schema down refuses structured rows without erasing them; safe empty-schema down preserves old text/zone overloads',()=>{
 const r=run(`do $test$ declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();c uuid;begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'rollback-'||u);
 insert into posts(id,user_id,status)values(p,u,'ready');
 c:=append_meal_summary(p,'{"code":"mealSummary","values":{"kind":"consumed"}}');
 begin execute $down$${inner(down)}$down$;raise exception 'Unsafe schema down accepted';
 exception when invalid_parameter_value then if sqlerrm not like 'Cannot remove 0084 after structured messages exist%' then raise;end if;end;
 if (select summary_comment_id from posts where id=p) is distinct from c or not exists(select 1 from post_comments where id=c and message is not null) then raise exception 'Rollback erased message data';end if;
 delete from posts where id=p;delete from auth.users where id=u;
 end $test$;`+inner(down)+`
 do $test$ begin
 if to_regprocedure('public.persist_analysis(uuid,jsonb,text)') is null or to_regprocedure('public.publish_photo_drink_operation(uuid,uuid,text,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,text,jsonb,text)') is null then raise exception 'Old signatures lost';end if;
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='post_comments' and column_name='message') then raise exception 'Safe down left message column';end if;
 end $test$;`);
 assert.equal(r.status,0,r.stderr);
});
