import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{execFileSync}from'node:child_process';
const url=process.env.TEST_SQL_DATABASE_URL,enabled=process.env.MFA_TEST_DISPOSABLE==='1'&&url&&['127.0.0.1','localhost'].includes(new URL(url).hostname);
const run=sql=>execFileSync('psql',['-XqAt','--dbname',url,'-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
test('0080 rollback restores the aggregate before removing its helper; reapply works',{skip:!enabled},()=>{
 const before=run("select md5(prosrc) from pg_proc where oid='public.admin_people(text,timestamptz,uuid[],integer,uuid)'::regprocedure");
 const result=JSON.parse(run(`begin;${fs.readFileSync('supabase/rollbacks/0080_admin_error_summaries.sql','utf8')}
 select jsonb_build_object('helperAbsent',to_regprocedure('public.admin_error_code(text)')is null,'restored',(select position('admin_error_code' in prosrc)=0 from pg_proc where oid='public.admin_people(text,timestamptz,uuid[],integer,uuid)'::regprocedure));
 ${fs.readFileSync('supabase/migrations/0080_admin_error_summaries.sql','utf8')}
 rollback;`));
 assert.deepEqual(result,{helperAbsent:true,restored:true});assert.equal(run("select md5(prosrc) from pg_proc where oid='public.admin_people(text,timestamptz,uuid[],integer,uuid)'::regprocedure"),before);
});
test('0080 repeated apply fails loudly and anon/authenticated cannot execute its helper',{skip:!enabled},()=>{
 assert.throws(()=>run('begin;'+fs.readFileSync('supabase/migrations/0080_admin_error_summaries.sql','utf8')+'rollback;'),error=>/already exists/.test(String(error.stderr)));
 for(const role of ['anon','authenticated'])assert.throws(()=>run(`begin;set local role ${role};select public.admin_error_code('worker error.');rollback;`),error=>/permission denied/.test(String(error.stderr)));
 assert.equal(run("begin;set local role service_role;select public.admin_error_code('worker error.');rollback;"),'worker');
});
