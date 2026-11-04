import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {createClient} from '@supabase/supabase-js';import {signInAsTestUser,signInTestClient} from '../scripts/lib/session.mjs';
const checked=r=>{assert.ifError(r.error);return r.data;};
test('a photo reservation costs one post hit however often the composer re-sends it (#471)',{timeout:90000},async()=>{
 for(const k of['APP_URL','NEXT_PUBLIC_SUPABASE_URL'])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env[k]).hostname));
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
 const {user}=await signInTestClient(1),cookie=await signInAsTestUser(1),origin=process.env.APP_URL;
 const hour=new Date();hour.setUTCMinutes(0,0,0);const bucket=hour.toISOString(),prior=checked(await db.from('user_call_hits').select('*').eq('user_id',user.id).eq('route','post').eq('hour',bucket));
 const reserve=id=>fetch(origin+'/api/posts',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({operation_id:id,capture_intent:'photo',caption:'Cap check',eaten_at:new Date().toISOString(),shots:[{position:0,width:390,height:390}]})});
 const used=async()=>checked(await db.from('user_call_hits').select('hits').eq('user_id',user.id).eq('route','post').eq('hour',bucket).maybeSingle())?.hits??0;
 const ids=[];
 try{
  checked(await db.from('user_call_hits').upsert({user_id:user.id,route:'post',hour:bucket,hits:0},{onConflict:'user_id,route,hour'}));
  for(let n=0;n<10;n++){const id=randomUUID();ids.push(id);for(let call=0;call<3;call++){const r=await reserve(id);assert.equal(r.status,200,`photo ${n+1} request ${call+1}`);}}
  assert.equal(await used(),10,'ten photos sent three times each cost ten hits');
  checked(await db.from('user_call_hits').update({hits:40}).eq('user_id',user.id).eq('route','post').eq('hour',bucket));
  assert.equal((await reserve(ids[0])).status,200,'a known reservation is never refused at the cap');
  const fresh=randomUUID();ids.push(fresh);assert.equal((await reserve(fresh)).status,429,'a new meal past the cap is refused');
 }finally{
  if(ids.length)checked(await db.from('post_upload_drafts').delete().eq('user_id',user.id).in('id',ids));
  checked(await db.from('user_call_hits').delete().eq('user_id',user.id).eq('route','post').eq('hour',bucket));if(prior.length)checked(await db.from('user_call_hits').upsert(prior,{onConflict:'user_id,route,hour'}));
 }
});
