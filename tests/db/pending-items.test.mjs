// TEST_SQL_DATABASE_URL=... node --test tests/db/pending-items.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
test('SQL progress is job-fenced, terminal-cleared, service-only and owner-readable',()=>{
 assert.ok(process.env.TEST_SQL_DATABASE_URL,'Set TEST_SQL_DATABASE_URL to the isolated migrated local database.');
 const out=execFileSync('psql',[process.env.TEST_SQL_DATABASE_URL,'-v','ON_ERROR_STOP=1','-f',fileURLToPath(new URL('./pending-items.sql',import.meta.url))],{encoding:'utf8'});
 assert.match(out,/ROLLBACK/);
});

test('concurrent nutrition completions preserve each other and NULL jobs cannot write',async()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;assert.ok(url);
 const sql=text=>execFileSync('psql',[url,'-v','ON_ERROR_STOP=1','-Atc',text],{encoding:'utf8'});
 const id='70000000-0000-0000-0000-000000000013',owner='70000000-0000-0000-0000-000000000011',job='70000000-0000-0000-0000-000000000018';
 try{
 sql(`insert into auth.users(id) values('${owner}');insert into profiles(id,handle) values('${owner}','progress-concurrent');insert into posts(id,user_id,status,active_job_id) values('${id}','${owner}','processing','${job}');select write_pending_names('${id}','${job}','[{"name":"Rice","kcal":null},{"name":"Egg","kcal":null}]');`);
 await Promise.all([promisify(execFile)('psql',[url,'-v','ON_ERROR_STOP=1','-c',`begin;select write_pending_kcal('${id}','${job}',0,100);select pg_sleep(0.2);commit;`]),promisify(execFile)('psql',[url,'-v','ON_ERROR_STOP=1','-c',`begin;select write_pending_kcal('${id}','${job}',1,80);commit;`])]);
 assert.equal(sql(`select (pending_items->0->>'kcal') || ',' || (pending_items->1->>'kcal') from posts where id='${id}';`).trim(),'100,80');
 sql(`update posts set active_job_id=null where id='${id}';select write_pending_names('${id}',null,'[{"name":"Stale","kcal":1}]');`);
 assert.equal(sql(`select pending_items is null from posts where id='${id}';`).trim(),'t');
 }finally{sql(`delete from auth.users where id='${owner}';`);}
});
