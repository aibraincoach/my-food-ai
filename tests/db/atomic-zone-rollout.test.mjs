import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {spawnSync} from 'node:child_process';
test('new zone RPCs are red before0082, additive after it; down keeps old signatures and stored-zone schema',()=>{
 const db=process.env.TEST_SQL_DATABASE_URL;assert.ok(db&&['localhost','127.0.0.1','[::1]'].includes(new URL(db).hostname));
 const migration=fs.readFileSync(new URL('../../supabase/migrations/0082_atomic_capture_zones.sql',import.meta.url),'utf8').replace(/^begin;$/m,'').replace(/^commit;$/m,''),down=fs.readFileSync(new URL('../../supabase/rollback/0082_atomic_capture_zones.down.sql',import.meta.url),'utf8').replace(/^begin;$/m,'').replace(/^commit;$/m,'');
 const input='begin;'+down+String.raw`
 do $test$ begin
 if to_regprocedure('public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,text,jsonb,jsonb)') is not null then raise exception 'Zone signature survived down';end if;
 if to_regprocedure('public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,jsonb,jsonb)') is null then raise exception 'Old running-app signature removed';end if;
 begin perform public.publish_drink_operation(null,null,null,null,null,null,null,null,null,'UTC');raise exception 'New app call worked before migration';exception when undefined_function then null;end;
 end $test$;
 `+migration+String.raw`
 do $test$ begin
 if to_regprocedure('public.publish_food_operation(uuid,uuid,text,timestamptz,text,numeric,jsonb,text,jsonb,jsonb)') is null then raise exception 'New signature missing after apply';end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='posts' and column_name='render_time_zone') then raise exception 'Stored zone schema lost';end if;
 end $test$;rollback;`;
 const r=spawnSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',timeout:10000});assert.ifError(r.error);assert.equal(r.status,0,r.stderr);
});
