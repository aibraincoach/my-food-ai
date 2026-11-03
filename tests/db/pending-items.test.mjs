// TEST_SQL_DATABASE_URL=... node --test tests/db/pending-items.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('SQL progress is job-fenced, terminal-cleared, service-only and owner-readable',()=>{
 assert.ok(process.env.TEST_SQL_DATABASE_URL,'Set TEST_SQL_DATABASE_URL to the isolated migrated local database.');
 const out=execFileSync('psql',[process.env.TEST_SQL_DATABASE_URL,'-v','ON_ERROR_STOP=1','-f',fileURLToPath(new URL('./pending-items.sql',import.meta.url))],{encoding:'utf8'});
 assert.match(out,/ROLLBACK/);
});
