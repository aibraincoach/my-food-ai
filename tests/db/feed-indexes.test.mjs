// TEST_SQL_DATABASE_URL=... node --test tests/db/feed-indexes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
test('feed reads of media and comments by post have an index',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;assert.ok(url,'Set TEST_SQL_DATABASE_URL to the isolated migrated local database.');
 const out=execFileSync('psql',[url,'-v','ON_ERROR_STOP=1','-Atc',"select indexname from pg_indexes where schemaname='public' and indexname in ('post_media_post_id_idx','post_comments_post_id_idx') order by 1"],{encoding:'utf8'});
 assert.deepEqual(out.trim().split('\n'),['post_comments_post_id_idx','post_media_post_id_idx']);
});
