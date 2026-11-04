import test from 'node:test';
import assert from 'node:assert/strict';
import {admin,user,checked} from './helpers.mjs';
import {signInAsTestUser} from '../../scripts/lib/session.mjs';
import {failureMessage} from '../../src/lib/worker/failure-message.ts';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function mode(value){const response=await fetch(new URL('/__fixture',process.env.MODEL_API_BASE_URL),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:value})});assert.equal(response.status,200);}
async function until(read,predicate){const end=Date.now()+180000;let value,polls=0;while(Date.now()<end){value=await read();if(predicate(value))return value;if(++polls%10===0)await fetch(new URL('/api/jobs/tick',process.env.APP_URL));await pause(500);}assert.fail('Local provider fixture did not settle: '+JSON.stringify(value));}
test('scripted Meta refusal fails a post and the owner retry reaches ready; USDA 429 requeues 120s without an attempt', {timeout:400000},async()=>{
 for(const key of ['APP_URL','NEXT_PUBLIC_SUPABASE_URL','MODEL_API_BASE_URL','SUPABASE_DB_URL'])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env[key]).hostname),'Disposable local '+key+' only');
 const db=admin(),cookie=await signInAsTestUser(1),account=await user(1),ids=[];
 const headers={cookie,'content-type':'application/json'};
 const create=async()=>{const response=await fetch(new URL('/api/posts',process.env.APP_URL),{method:'POST',headers,body:JSON.stringify({caption:'One boiled egg, 50 grams',shots:[]})});assert.equal(response.status,200);const body=await response.json();ids.push(body.postId);return body.postId;};
 const post=id=>db.from('posts').select('id,status,fail_reason').eq('id',id).single().then(checked);
 try{
  await mode('meta-refusal');const refused=await create();const failed=await until(()=>post(refused),p=>p.status==='failed');
  assert.equal(failureMessage(failed.fail_reason),'The analysis service refused this request. Try again.');
  await mode(null);const retry=await fetch(new URL('/api/posts/'+refused+'/retry',process.env.APP_URL),{method:'POST',headers});assert.equal(retry.status,204);
  await until(()=>post(refused),p=>p.status==='ready');
  await mode('fdc-429');const start=Date.now(),limited=await create();
  const jobs=()=>db.from('jobs').select('id,status,attempts,run_after,error').eq('post_id',limited).then(checked);
  const rows=await until(jobs,rows=>rows.some(j=>j.status==='queued'&&Date.parse(j.run_after)>=start+120000));
  const job=rows.find(j=>j.status==='queued'&&Date.parse(j.run_after)>=start+120000);assert.equal(job.attempts,0);
  assert.equal((await post(limited)).fail_reason,'fdc: rate limited');
  console.log(JSON.stringify({refusal:{status:failed.status,text:failureMessage(failed.fail_reason)},retry:{http:retry.status,status:'ready'},usda:{status:job.status,attempts:job.attempts,run_after:job.run_after,minimum_delay_ms:Date.parse(job.run_after)-start,postReason:'fdc: rate limited'}}));
 }finally{await mode(null);for(const id of ids)checked(await db.from('posts').delete().eq('id',id));await account.client.auth.signOut({scope:'local'});}
});
