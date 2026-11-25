// Isolated schema contract: starts its own loopback PostgreSQL, never loads env.
import {after,before,test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawnSync} from 'node:child_process';
import {importRows,importSql} from '../scripts/lib/mext-import.mjs';

const root=mkdtempSync(path.join(os.tmpdir(),'mext-db-')),pgBin='/usr/pgsql-17/bin';
let port,started=false;
function run(binary,args,input) {
  const result=spawnSync(binary,args,{input,encoding:'utf8',maxBuffer:2*1024*1024});
  if(result.error || result.status!==0) throw Error(`${path.basename(binary)} failed: ${String(result.stderr||result.error).slice(0,1500)}`);
  return result.stdout.trim();
}
function sql(text) {return run('psql',['-X','-qAt','-h','127.0.0.1','-p',String(port),'-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],text);}
const migration=readFileSync(new URL('../supabase/migrations/0085_mext_food_reference.sql',import.meta.url),'utf8');
const rollback=readFileSync(new URL('../supabase/rollback/0085_mext_food_reference.sql',import.meta.url),'utf8');
const fixture=JSON.parse(readFileSync(new URL('./fixtures/mext-source-sample.json',import.meta.url),'utf8'));
const prepared=importSql(importRows(fixture,{}));
before(async()=>{
  const server=net.createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  port=server.address().port;await new Promise(resolve=>server.close(resolve));
  run(path.join(pgBin,'initdb'),['-D',path.join(root,'pg'),'-U','postgres','-A','trust','--locale=C.UTF-8','--encoding=UTF8']);
  run(path.join(pgBin,'pg_ctl'),['-D',path.join(root,'pg'),'-l',path.join(root,'postgres.log'),'-o',`-p ${port} -h 127.0.0.1 -k ${root}`,'start']);started=true;
  sql('create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;grant usage on schema public to anon,authenticated,service_role;create table item_nutrition(source_ref text);create table saved_meals(items jsonb);');
  sql(migration);sql(prepared);
});
after(()=>{
  if(started)run(path.join(pgBin,'pg_ctl'),['-D',path.join(root,'pg'),'-m','fast','stop']);
  rmSync(root,{recursive:true,force:true});
});

test('reference rows are inaccessible to client roles, service role has read only',()=>{
  assert.equal(sql("select has_table_privilege('anon','jp_foods','select'),has_table_privilege('authenticated','jp_foods','select'),has_table_privilege('service_role','jp_foods','select'),has_table_privilege('service_role','jp_foods','update')"),'f|f|t|f');
  assert.equal(sql("select relrowsecurity,(select count(*) from pg_policy where polrelid=c.oid) from pg_class c where oid='jp_foods'::regclass"),'t|0');
  assert.equal(sql("select has_function_privilege('anon','search_mext_foods(text,text)','execute'),has_function_privilege('authenticated','search_mext_foods(text,text)','execute'),has_function_privilege('service_role','search_mext_foods(text,text)','execute')"),'f|f|t');
  assert.equal(sql('set role service_role;select count(*) from jp_foods;'),'22');
});

test('a baked-squid search never returns the ambiguously named boiled row',()=>{
  const ids=sql("select food_number from search_mext_foods('するめいか 焼き','Japanese common squid, baked')").split('\n');
  assert.ok(!ids.includes('10346'));
  assert.ok(!ids.includes('10347'));
  assert.equal(sql("select count(*) from jp_foods where food_number in ('10346','10347') and identity_status='english_name_ambiguous'"),'2');
});

test('trigram candidates include the seven acceptance records and exclude rejected identities',()=>{
  for(const [ja,en,ids] of [['白飯','cooked rice',['01088']],['豚ばら','pork belly',['11129','11277','11153']],['鮭','chum salmon',['10134','10135','10136']]]) {
    const result=sql(`select food_number from search_mext_foods('${ja}','${en}')`).split('\n');
    for(const id of ids)assert.ok(result.includes(id),`${id} must be retrievable`);
    assert.ok(result.length<=12);
  }
  assert.equal(sql("select count(*) from search_mext_foods('押麦','Barley') where identity_status<>'joined'"),'0');
  assert.equal(sql("select count(*) from search_mext_foods('','')"),'0');
});

test('Japanese retrieval alone finds the acceptance foods under the database ctype',()=>{
  const receipt={lc_ctype:sql('select datctype from pg_database where datname=current_database()'),japanese_trigrams:sql("select cardinality(show_trgm('精白米'))"),searches:[]};
  assert.equal(receipt.lc_ctype,'C.UTF-8');
  for(const [term,expected] of [['精白米',['01088']],['ばら',['11129','11277','11153']],['しろさけ',['10134','10135','10136']]]) {
    const found=sql(`select food_number from search_mext_foods('${term}','zzzz qqqq')`).split('\n').filter(Boolean);
    receipt.searches.push({term,found});
    for(const id of expected) assert.ok(found.includes(id),`Japanese-only ${term} must find ${id}; ctype=${receipt.lc_ctype}`);
  }
  receipt.hakuhan=sql("select food_number from search_mext_foods('白飯','zzzz qqqq')").split('\n').filter(Boolean);
  console.info('Japanese-only retrieval:',JSON.stringify(receipt));
  assert.ok(Number(receipt.japanese_trigrams)>0);
});

test('re-import leaves both stored values and import timestamps unchanged',()=>{
  const digest=()=>sql("select md5(string_agg(food_number||record_sha256||imported_at::text,',' order by food_number)) from jp_foods");
  const before=digest();sql(prepared);assert.equal(digest(),before);
  assert.equal(sql("select nutrients->'1106'->>'marker',nutrients->'1106'->>'value' from jp_foods where food_number='01001'"),'Tr|');
});

test('rollback refuses live or saved mext facts, then succeeds before any caller exists',()=>{
  sql("insert into item_nutrition values('mext:01088')");
  assert.throws(()=>sql(rollback),/rollback refused/);
  assert.equal(sql("select to_regclass('jp_foods') is not null"),'t');
  sql("delete from item_nutrition;insert into saved_meals values('[{\"nutrition\":{\"source_ref\":\"mext:01088\"}}]')");
  assert.throws(()=>sql(rollback),/rollback refused/);
  sql('delete from saved_meals;');sql(rollback);
  assert.equal(sql("select to_regclass('jp_foods') is null"),'t');
  assert.equal(sql("select exists(select 1 from pg_extension where extname='pg_trgm')"),'t');
  sql(migration);assert.equal(sql('select count(*) from jp_foods'),'0');
});
