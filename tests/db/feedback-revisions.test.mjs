// TEST_SQL_DATABASE_URL=... node --test tests/db/feedback-revisions.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
test('feedback_revisions returns exactly feedback_revision for each post',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;assert.ok(url,'Set TEST_SQL_DATABASE_URL to the isolated migrated local database.');
 const sql=text=>execFileSync('psql',[url,'-v','ON_ERROR_STOP=1','-Atc',text],{encoding:'utf8'}).trim();
 const id=sql("select id from public.posts order by created_at desc limit 1");
 assert.ok(id,'The migrated local database needs one post.');
 assert.equal(sql(`select revision::text from public.feedback_revisions(array['${id}'::uuid])`),sql(`select public.feedback_revision('${id}'::uuid)::text`));
});
