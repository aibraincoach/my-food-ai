import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{randomUUID}from'node:crypto';import{execFileSync}from'node:child_process';
const url=process.env.TEST_SQL_DATABASE_URL,enabled=process.env.MFA_TEST_DISPOSABLE==='1'&&url&&['127.0.0.1','localhost'].includes(new URL(url).hostname);
const corpus=JSON.parse(fs.readFileSync('tests/fixtures/admin-error-codes.json','utf8'));
const quote=value=>value===null?'null':"'"+value.replaceAll("'","''")+"'";
test('SQL uses the same real-writer error corpus and exact expected projection as TypeScript',{skip:!enabled},()=>{
 const user=randomUUID(),rows=corpus.map(row=>({...row,post:randomUUID()}));
 const sql=`begin;drop function if exists public.admin_people(text,timestamptz,uuid[],integer,uuid);
 ${fs.readFileSync(process.env.ADMIN_PEOPLE_SQL_SOURCE??'supabase/migrations/0079_admin_people.sql','utf8')}
 insert into auth.users(id,created_at)values('${user}',now());
 insert into public.profiles(id,handle)values('${user}','error_corpus_${user.slice(0,8)}');
 ${rows.map(r=>`insert into public.posts(id,user_id,status,fail_reason)values('${r.post}','${user}','${r.kind===null?'failed':'ready'}',${r.kind===null?quote(r.value):'null'});\n`+(r.kind===null?`insert into public.jobs(post_id,kind,status,error,finished_at)values('${r.post}','correct','error',${quote(r.value)},now());`:`insert into public.model_calls(post_id,kind,started_at,duration_ms,error)values('${r.post}',${quote(r.kind)},now(),1,${quote(r.value)});`)).join('\n')}
 select public.admin_people('UTC',clock_timestamp(),array['${user}'::uuid],1,'${user}')->'person_errors';rollback;`;
 const output=execFileSync('psql',['-XqAt','--dbname',url,'-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',maxBuffer:5e6}).trim(),errors=JSON.parse(output);
 for(const row of rows){for(const kind of row.kind===null?['failedMeal','failedJob']:['failedCall']){const actual=errors.find(e=>e.post_id===row.post&&e.kind===kind);assert.ok(actual,row.source+' '+kind);assert.equal(actual.code,row.expected,row.source+' '+kind);}}
 assert.ok(!output.includes('PRIVATE_'),'private paths and error/class text never leave SQL');
});
