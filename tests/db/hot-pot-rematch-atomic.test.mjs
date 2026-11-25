import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{execFileSync}from'node:child_process';
test('operator rematch commits portion and nutrition together, fenced to its exact current items and service role',()=>{
 const db=process.env.TEST_SQL_DATABASE_URL;assert.ok(db&&new URL(db).hostname==='127.0.0.1','Disposable loopback database only');
 const migration=fs.readFileSync('supabase/migrations/0078_hot_pot_rematch.sql','utf8');
 const input="begin;\ndrop function if exists public.persist_operator_rematch(uuid,uuid,uuid[],jsonb);\n"+migration+fs.readFileSync('tests/fixtures/hot-pot-rematch-atomic.sql','utf8')+"\nrollback;";
 execFileSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',timeout:15000});
});
