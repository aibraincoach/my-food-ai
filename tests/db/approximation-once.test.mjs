import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

test('approximation migration keeps one label, preserves every estimate basis and rolls back',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(url,'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable database only');
 const migration=readFileSync(new URL('../../supabase/migrations/0053_approximation_once.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollbacks/0053_approximation_once.down.sql',import.meta.url),'utf8');
 const input=`begin;
 create temporary table approximation_once_fixture(kind text, item uuid);
 do $test$
 declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();estimate_item uuid:=gen_random_uuid();closest_item uuid:=gen_random_uuid();
 begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'approximation-once-'||u);
 insert into posts(id,user_id,status)values(p,u,'ready');
 insert into post_items(id,post_id,name,source)values(estimate_item,p,'Estimate migration fixture','model'),(closest_item,p,'Closest migration fixture','model');
 insert into item_nutrition(post_item_id,source_ref,micronutrients)values
 (estimate_item,'estimate:b','[{"nutrientId":1008,"value":5,"approximation":{"kind":"estimate","basis":"b","sourceRef":"estimate:b","per100":10}},{"nutrientId":1003,"value":10,"approximation":{"kind":"estimate","basis":"b","sourceRef":"estimate:b","per100":20}},{"nutrientId":1004,"value":15,"approximation":{"kind":"estimate","basis":"b","sourceRef":"estimate:b","per100":30}}]'),
 (closest_item,'123','[{"nutrientId":1008,"value":5,"approximation":{"kind":"closest","basis":"Plain food","sourceRef":"123"}},{"nutrientId":1003,"value":10,"approximation":{"kind":"closest","basis":"Plain food","sourceRef":"123"}}]');
 insert into approximation_once_fixture values('estimate',estimate_item),('closest',closest_item);
 end $test$;
 ${migration}
 do $test$
 declare es jsonb;cl jsonb;
 begin
 select micronutrients into es from item_nutrition where post_item_id=(select item from approximation_once_fixture where kind='estimate');
 select micronutrients into cl from item_nutrition where post_item_id=(select item from approximation_once_fixture where kind='closest');
 if (select count(*) from jsonb_array_elements(es) e where e ? 'approximation')<>1
 or es->0->'approximation'<>'{"kind":"estimate","basis":"b","sourceRef":"estimate:b"}'::jsonb
 or (select jsonb_agg(e->'per100' order by ord) from jsonb_array_elements(es) with ordinality as t(e,ord))<>'[10,20,30]'::jsonb
 or (select jsonb_agg(e->'value' order by ord) from jsonb_array_elements(es) with ordinality as t(e,ord))<>'[5,10,15]'::jsonb then raise exception 'Estimate provenance, per100 or consumed amounts changed';end if;
 if (select count(*) from jsonb_array_elements(cl) e where e ? 'approximation')<>1
 or exists(select 1 from jsonb_array_elements(cl) e where e ? 'per100')
 or cl->0->'approximation'<>'{"kind":"closest","basis":"Plain food","sourceRef":"123"}'::jsonb then raise exception 'Closest provenance changed';end if;
 end $test$;
 ${rollback}
 do $test$
 declare es jsonb;cl jsonb;
 begin
 select micronutrients into es from item_nutrition where post_item_id=(select item from approximation_once_fixture where kind='estimate');
 select micronutrients into cl from item_nutrition where post_item_id=(select item from approximation_once_fixture where kind='closest');
 if (select count(*) from jsonb_array_elements(es) e where e ? 'approximation')<>3
 or (select jsonb_agg(e->'approximation'->'per100' order by ord) from jsonb_array_elements(es) with ordinality as t(e,ord))<>'[10,20,30]'::jsonb
 or exists(select 1 from jsonb_array_elements(es) e where e ? 'per100') then raise exception 'Estimate rollback did not restore repeated labels and values';end if;
 if (select count(*) from jsonb_array_elements(cl) e where e ? 'approximation')<>2
 or exists(select 1 from jsonb_array_elements(cl) e where e ? 'per100' or (e->'approximation') ? 'per100') then raise exception 'Closest rollback added estimate data';end if;
 end $test$;
 select 'approximation-once-ok';rollback;`;
 const out=execFileSync('psql',['-X',url,'-v','ON_ERROR_STOP=1','-At'],{input,encoding:'utf8'});
 assert.match(out,/approximation-once-ok/);
});
