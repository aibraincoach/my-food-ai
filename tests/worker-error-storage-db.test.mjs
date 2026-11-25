import test from 'node:test';import assert from 'node:assert/strict';import{execFileSync}from'node:child_process';import{randomUUID}from'node:crypto';
import{drainOnce}from'../src/lib/worker/drain.ts';import{MetaApiError}from'../src/lib/meta/client.ts';
const url=process.env.TEST_SQL_DATABASE_URL,enabled=process.env.MFA_TEST_DISPOSABLE==='1'&&url&&['127.0.0.1','localhost'].includes(new URL(url).hostname);
const quote=value=>"'"+value.replaceAll("'","''")+"'";
async function writerMessage(thrown){let message;const db={rpc:async(name,args)=>{if(name==='claim_owned_job')return{data:{id:'fixture',post_id:'fixture',kind:'fixture'},error:null};assert.equal(name,'fail_job');message=args.p_message;return{data:null,error:null};}};await drainOnce(db,{fixture:async()=>{throw thrown;}});return message;}
const synthetic={refusal:[500,'meta: model refused the request.'],invalid:[502,'meta: invalid output.'],budget:[503,'meta: budget exhausted.'],retry:[503,'meta: retry limit reached.'],concurrency:[503,'A correction arrived while completing this attempt.'],snapshot:[503,'Correction snapshot could not be saved.']};
for(const mode of ['meta','non-error','lease-expiry',...Object.keys(synthetic)])test('actual fenced failure storage: '+mode,{skip:!enabled},async()=>{
 const user=randomUUID(),post=randomUUID(),job=randomUUID();const message=mode==='meta'?await writerMessage(new MetaApiError(503,'sam: PRIVATE_BODY /private/photo.jpg alice@example.com',undefined,'',503)):mode==='non-error'?await writerMessage({private:'PRIVATE_BODY'}):synthetic[mode]?await writerMessage(new MetaApiError(...synthetic[mode])):null;
 const sql=`begin;
 insert into auth.users(id)values('${user}');
 insert into public.profiles(id,handle)values('${user}','writer_${user.slice(0,8)}');
 insert into public.posts(id,user_id,status)values('${post}','${user}','processing');
 insert into public.jobs(id,post_id,kind,status,attempts,started_at,payload)values('${job}','${post}','correct','running',3,clock_timestamp()-interval '10 minutes','{"post_ownership":true}');
 update public.posts set active_job_id='${job}' where id='${post}';
 ${mode==='lease-expiry'?`select public.recover_abandoned_jobs(clock_timestamp());`:`select public.fail_job('${job}',${quote(message)},false);`}
 select jsonb_build_object('job',(select error from public.jobs where id='${job}'),'reason',(select fail_reason from public.posts where id='${post}'),'status',(select status from public.posts where id='${post}'));rollback;`;
 const result=JSON.parse(execFileSync('psql',['-XqAt','--dbname',url,'-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8'}).trim());
 const expected=mode==='meta'?'meta: analysis request failed with 503.':mode==='non-error'?'worker error.':mode==='lease-expiry'?'Worker execution expired before completion':'meta: analysis request failed.';
 assert.deepEqual(result,{job:expected,reason:expected,status:'failed'});assert.ok(!JSON.stringify(result).includes('PRIVATE_'));assert.ok(!JSON.stringify(result).includes('alice@example.com'));
});
