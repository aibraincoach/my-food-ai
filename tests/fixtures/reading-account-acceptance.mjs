// Extend the owned loopback capture fixture for Days/account/admin wording.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const out=process.env.CAPTURE_CHECK_OUT,db=process.env.TEST_SQL_DATABASE_URL,url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!out||[db,url,process.env.APP_URL].some(v=>!v||new URL(v).hostname!=='127.0.0.1'))throw Error('Loopback disposable fixture only');
const f=JSON.parse(await fs.readFile(out+'/fixture-ledger.json'));
if(!/^[a-f0-9-]{36}$/.test(f.user)||!/^text1287-[a-f0-9]+@example.com$/.test(f.email)||!/^text1287_[a-f0-9]{8}$/.test(f.handle))throw Error('Owned capture ledger required');
const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const sql=query=>execFileSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input:query,encoding:'utf8'}).trim();
const mode=process.argv[2]??'extend';
if(mode==='verify-cleanup'){
 if(!f.accountReading)throw Error('Extended ledger required');
 const row=JSON.parse(sql(`select json_build_object('agents',(select count(*)from agent_tokens where user_id='${f.user}'),'activity',(select count(*)from agent_activity where user_id='${f.user}'),'searchTraces',(select count(*)from model_calls where post_id is null and kind='spark_search' and position('${f.handle}' in request_text)>0))`));
 if(Object.values(row).some(Boolean))throw Error('Extended cleanup is not zero');
 await fs.writeFile(out+'/account-cleanup.json',JSON.stringify(row,null,2));console.log(JSON.stringify({extendedCleanupVerified:true,absent:row}));
}else{
 const owner=await admin.auth.admin.getUserById(f.user);if(owner.data.user?.email!==f.email)throw Error('Fixture ownership mismatch');
if(mode==='extend'){
 if(f.accountReading)throw Error('Already extended');
 const nutrition=JSON.stringify({calories:180,protein_g:4,carbs_g:42,fat_g:1,fibre_g:1,sugar_g:0,sodium_mg:10,micronutrients:[]});
 const create=(name,date)=>{const id=sql(`select public.create_food_post('${f.user}','${date}','${name}',150,'${nutrition}'::jsonb);`);if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Invalid fixture post ID');return id;};
 f.old=create('検証用の古い食事','2026-10-15T12:00:00Z');f.deleted=create('検証用の削除した食事','2026-11-23T12:00:00Z');
 sql(`update posts set status='ready',created_at=eaten_at where user_id='${f.user}';update posts set caption='検証用の食事',eaten_at='2026-11-24T12:00:00Z',created_at='2026-11-24T12:00:00Z' where id='${f.post}' and user_id='${f.user}';update post_items set name='検証用のご飯' where post_id='${f.post}';update posts set deleted_at='2026-11-24T12:30:00Z' where id='${f.deleted}' and user_id='${f.user}';update profiles set role='admin' where id='${f.user}';`);
 f.agentSeeds=[];
 for(const [index,name]of['検証用のエージェント','検証用の無効なエージェント'].entries()){
  const hash=createHash('sha256').update(randomUUID()).digest('hex');
  const id=sql(`insert into agent_tokens(user_id,name,token_hash,token_last4,created_at,last_used_at,revoked_at)values('${f.user}','${name}','${hash}','1234','2026-11-22T12:00:00Z','2026-11-24T12:00:00Z',${index?"'2026-11-24T13:00:00Z'":'null'})returning id;`);
  if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Invalid agent ID');f.agentSeeds.push(id);
  for(const [i,action]of ['posted','read','corrected','listed'].entries())sql(`insert into agent_activity(user_id,token_id,action,post_id,meal_count,created_at)values('${f.user}','${id}','${action}',${action==='listed'?'null':"'"+f.post+"'"},2,'2026-11-24T12:0${i}:00Z');`);
 }
 sql(`insert into model_calls(post_id,kind,started_at,duration_ms,input_tokens,output_tokens,request_text,response_text,fdc_id,error)values('${f.post}','spark_identify','2026-11-24T12:00:00Z',123,20,30,'検証用リクエスト','検証用レスポンス',12345,'検証用エラー');`);
 f.accountReading=true;await fs.writeFile(out+'/fixture-ledger.json',JSON.stringify(f,null,2),{mode:0o600});
 console.log(JSON.stringify({extended:true,posts:3,agents:2,localSyntheticAdmin:true}));
}else if(mode==='reset-ui'){
 if(!f.accountReading||!f.agentSeeds?.every(id=>/^[a-f0-9-]{36}$/.test(id)))throw Error('Extended fixture required');
 for(const result of [
  await admin.from('agent_tokens').delete().eq('user_id',f.user).not('id','in','('+f.agentSeeds.join(',')+')'),
  await admin.from('agent_tokens').update({revoked_at:null}).eq('user_id',f.user).eq('id',f.agentSeeds[0]),
  await admin.from('posts').update({deleted_at:'2026-11-24T12:30:00Z'}).eq('user_id',f.user).eq('id',f.deleted),
 ])if(result.error)throw result.error;
 console.log(JSON.stringify({ownedUiReset:true}));
}else if(mode==='cleanup-traces'){
 const removed=JSON.parse(sql(`with gone as(delete from model_calls where post_id is null and kind='spark_search' and position('${f.handle}' in request_text)>0 returning id)select coalesce(json_agg(id),'[]')from gone`));
 await fs.writeFile(out+'/owned-search-trace-cleanup.json',JSON.stringify({removed},null,2));console.log(JSON.stringify({ownedSearchTracesRemoved:removed.length}));
}else if(mode==='reset'){
 if(!f.accountReading||!f.agentSeeds?.every(id=>/^[a-f0-9-]{36}$/.test(id)))throw Error('Extended fixture required');
 // Remove only tokens made by this fixture's UI between base/head contexts.
 sql(`delete from model_calls where post_id is null and kind='spark_search' and position('${f.handle}' in request_text)>0;delete from agent_tokens where user_id='${f.user}' and id not in(${f.agentSeeds.map(id=>"'"+id+"'").join(',')});update agent_tokens set revoked_at=null where id='${f.agentSeeds[0]}' and user_id='${f.user}';update posts set deleted_at='2026-11-24T12:30:00Z' where id='${f.deleted}' and user_id='${f.user}';`);
 console.log(JSON.stringify({fixtureReset:true}));
}else throw Error('Use extend or reset; core capture-acceptance owns final sign-out/cleanup');

}
