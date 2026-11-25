import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync,spawnSync} from 'node:child_process';
const url=process.env.TEST_SQL_DATABASE_URL;
function args(){assert.ok(url,'Disposable SQL URL required');assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(url).hostname));return ['-XqAt','--dbname',url,'-v','ON_ERROR_STOP=1'];}
const run=input=>execFileSync('psql',args(),{input,encoding:'utf8'});
const old=fs.readFileSync(new URL('../../supabase/migrations/0053_estimate_reader_rollout.sql',import.meta.url),'utf8').split('-- An explicit overload')[0];
const migration=fs.readFileSync(new URL('../../supabase/migrations/0081_single_nutrition_format.sql',import.meta.url),'utf8').replace(/^begin;|^commit;/gm,'');
const absent=`select json_build_object('table',to_regclass('public.nutrition_provenance_format') is null,'converter',to_regprocedure('public.nutrient_provenance_format(jsonb,boolean)') is null,'trigger_function',to_regprocedure('public.enforce_nutrition_provenance_format()') is null,'trigger',not exists(select 1 from pg_trigger where tgname='enforce_nutrition_provenance_format' and tgrelid='public.item_nutrition'::regclass));`;
test('the current database has no format switch, converter or conversion trigger',()=>{
 const state=JSON.parse(run(absent));assert.ok(Object.values(state).every(Boolean));
});
test('0081 refuses an unactivated database before dropping anything',()=>{
 const result=spawnSync('psql',args(),{input:'begin;\n'+old+'\n'+migration+'\nrollback;',encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/requires the recorded compact activation/);
 assert.ok(Object.values(JSON.parse(run(absent))).every(Boolean),'failed fixture transaction rolled back');
});
test('0081 drops the historical machinery only after activation and rolls back as a transaction',()=>{
 const result=run('begin;\n'+old+"\nupdate public.nutrition_provenance_format set compact=true,reader_floor=repeat('a',40) where id;\n"+migration+'\n'+absent+'\nrollback;');
 const state=JSON.parse(result.trim().split('\n').filter(s=>s.startsWith('{')).at(-1));assert.ok(Object.values(state).every(Boolean));
 assert.ok(Object.values(JSON.parse(run(absent))).every(Boolean),'fixture rolled back to the same current state');
});
