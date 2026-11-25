import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const url=process.env.TEST_SQL_DATABASE_URL;
function run(prefix=''){
 assert.ok(url&&['127.0.0.1','localhost','[::1]'].includes(new URL(url).hostname),'Owned disposable SQL database required');
 const sql=`begin;set local statement_timeout='5s';${prefix}
 do $test$ declare owner_id uuid:=gen_random_uuid(); operation uuid:=gen_random_uuid(); published_id uuid; replay uuid;
 nutrition jsonb:='{"calories":120,"gtin":"00016000275683","micronutrients":[]}';
 correction jsonb:='{"gtin":"00016000275683","serving_amount":30,"serving_unit":"g","per_100":{"calories":400}}';
 begin
 insert into auth.users(id)values(owner_id);insert into public.profiles(id,handle)values(owner_id,'atomic_'||owner_id);
 published_id:=public.publish_food_operation(operation,owner_id,repeat('a',64),now(),'Verified label',30,nutrition,null,correction);
 if not exists(select 1 from public.barcode_corrections where user_id=owner_id and gtin=correction->>'gtin' and source='label' and per_100->>'calories'='400')then raise exception 'Atomic correction missing';end if;
 if not exists(select 1 from public.food_post_operations where operation_id=operation and user_id=owner_id and food_post_operations.post_id=published_id)then raise exception 'Atomic receipt missing';end if;
 update public.barcode_corrections set name='Newer explicit correction' where user_id=owner_id and gtin=correction->>'gtin';
 replay:=public.publish_food_operation(operation,owner_id,repeat('a',64),now(),'Verified label',30,nutrition,null,correction);
 if replay<>published_id or (select name from public.barcode_corrections where user_id=owner_id and gtin=correction->>'gtin')<>'Newer explicit correction' then raise exception 'Replay rewrote a correction';end if;
 end $test$;rollback;`;
 return spawnSync('psql',['-XqAt','--dbname',url,'-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',timeout:15000});
}
test('one food operation atomically records its label correction and receipt, without a second write',()=>{
 const r=run();assert.ifError(r.error);assert.equal(r.status,0,r.stderr);
});
test('the atomic correction guard goes red when the operation correction step is removed',()=>{
 const source=fs.readFileSync(new URL('../../supabase/migrations/0043_food_post_operations.sql',import.meta.url),'utf8'),definition=source.slice(source.indexOf('create function public.publish_food_operation'),source.indexOf('revoke all on function public.publish_food_operation'));
 const a=definition.indexOf(' if p_barcode_correction is not null then'),b=definition.indexOf(' end if;',a)+9;assert.ok(a>0&&b>a);const mutant=(definition.slice(0,a)+definition.slice(b)).replace('create function','create or replace function');const r=run(mutant);assert.ifError(r.error);assert.notEqual(r.status,0);assert.match(r.stderr,/Atomic correction missing/);
});
