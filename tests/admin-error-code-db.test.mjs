import {adminMigrations} from './fixtures/admin-migrations.mjs';
import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{randomUUID}from'node:crypto';import{execFileSync}from'node:child_process';
const url=process.env.TEST_SQL_DATABASE_URL,enabled=process.env.MFA_TEST_DISPOSABLE==='1'&&url&&['127.0.0.1','localhost'].includes(new URL(url).hostname);
const corpus=JSON.parse(fs.readFileSync('tests/fixtures/admin-error-codes.json','utf8'));
const quote=value=>value===null?'null':"'"+value.replaceAll("'","''")+"'";
test('SQL uses the same real-writer error corpus and exact expected projection as TypeScript',{skip:!enabled},()=>{
 const user=randomUUID(),rows=corpus.map(row=>({...row,post:randomUUID()}));
 const sql=`begin;${adminMigrations()}
 insert into auth.users(id,created_at)values('${user}',now());
 insert into public.profiles(id,handle)values('${user}','error_corpus_${user.slice(0,8)}');
 ${rows.map(r=>`insert into public.posts(id,user_id,status,fail_reason)values('${r.post}','${user}','${r.kind===null?'failed':'ready'}',${r.kind===null?quote(r.value):'null'});\n`+(r.kind===null?`insert into public.jobs(post_id,kind,status,error,finished_at)values('${r.post}','correct','error',${quote(r.value)},now());`:`insert into public.model_calls(post_id,kind,started_at,duration_ms,error)values('${r.post}',${quote(r.kind)},now(),1,${quote(r.value)});`)).join('\n')}
 select (public.admin_people('UTC',clock_timestamp(),array['${user}'::uuid],1,'${user}')->'person_errors') || (public.admin_people('UTC',clock_timestamp(),array['${user}'::uuid],2,'${user}')->'person_errors');rollback;`;
 const output=execFileSync('psql',['-XqAt','--dbname',url,'-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',maxBuffer:5e6}).trim(),errors=JSON.parse(output);
 for(const row of rows){for(const kind of row.kind===null?['failedMeal','failedJob']:['failedCall']){const actual=errors.find(e=>e.post_id===row.post&&e.kind===kind);assert.ok(actual,row.source+' '+kind);assert.equal(actual.code,row.expected,row.source+' '+kind);}}
 assert.ok(!output.includes('PRIVATE_'),'private paths and error/class text never leave SQL');
});

test('pure SQL helper matches the post/job corpus and is service-role only',{skip:!enabled||!!process.env.ADMIN_PEOPLE_SQL_SOURCE},()=>{
 const rows=corpus.filter(row=>row.kind===null);
 const sql=`begin;${adminMigrations()}
 select jsonb_build_object('codes',(select jsonb_agg(public.admin_error_code(value) order by n) from(values ${rows.map((r,i)=>`(${i},${quote(r.value)}::text)`).join(',')})corpus(n,value)),
 'grants',jsonb_build_array(has_function_privilege('anon','public.admin_error_code(text)','execute'),has_function_privilege('authenticated','public.admin_error_code(text)','execute'),has_function_privilege('service_role','public.admin_error_code(text)','execute')),
 'immutable',(select provolatile='i' from pg_proc where oid='public.admin_error_code(text)'::regprocedure),
 'path',(select proconfig from pg_proc where oid='public.admin_error_code(text)'::regprocedure));rollback;`;
 const result=JSON.parse(execFileSync('psql',['-XqAt','--dbname',url,'-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8'}));
 assert.deepEqual(result.codes,rows.map(row=>row.expected));assert.deepEqual(result.grants,[false,false,true]);assert.equal(result.immutable,true);assert.deepEqual(result.path,['search_path=public, pg_temp']);
});
