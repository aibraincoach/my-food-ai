// TEST_SQL_DATABASE_URL=... node --test tests/db/feedback-revisions.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
test('feedback_revisions preserves fingerprints, owner scope and grants',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;assert.ok(url,'Set TEST_SQL_DATABASE_URL to the isolated migrated local database.');
 const sql=text=>execFileSync('psql',[url,'-v','ON_ERROR_STOP=1','-qAtc',text],{encoding:'utf8'}).trim();
 const users=sql('select id from public.profiles order by id limit 2').split('\n');
 assert.equal(users.length,2,'The disposable database needs its two local test users.');
 const ids=Array.from({length:3},()=>randomUUID());
 const list=ids.map(id=>`'${id}'::uuid`).join(',');
 const result=sql(`begin;
 insert into public.posts(id,user_id,status) values ('${ids[0]}','${users[0]}','failed'),('${ids[1]}','${users[0]}','failed'),('${ids[2]}','${users[1]}','failed');
 select set_config('request.jwt.claim.sub','${users[0]}',true) is not null;
 set local role authenticated;
 select count(*),bool_and(revision=public.feedback_revision(post_id)) from public.feedback_revisions(array[${list}]);
 reset role;
 select has_function_privilege('authenticated','public.feedback_revisions(uuid[])','execute'),has_function_privilege('service_role','public.feedback_revisions(uuid[])','execute'),has_function_privilege('anon','public.feedback_revisions(uuid[])','execute');
 rollback;`);
 assert.equal(result,'t\n2|t\nt|t|f');
});
