import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {createClient} from '@supabase/supabase-js';import {signInAsTestUser,signInTestClient} from '../scripts/lib/session.mjs';
const checked=r=>{assert.ifError(r.error);return r.data;};
test('every failure of the question dismiss route answers JSON with an error (#627)',{timeout:60000},async()=>{
 for(const k of['APP_URL','NEXT_PUBLIC_SUPABASE_URL'])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env[k]).hostname));
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
 const {user}=await signInTestClient(1),cookie=await signInAsTestUser(1),otherCookie=await signInAsTestUser(2),origin=process.env.APP_URL;
 const dismiss=(id,auth)=>fetch(`${origin}/api/posts/${id}/question`,{method:'DELETE',headers:auth?{Cookie:auth}:{}});
 const post=checked(await db.from('posts').insert({user_id:user.id,status:'ready',question:{short:'Clarification needed',question:'Which beer is it?',options:['Lager']}}).select('id').single());
 try{
  const anonymous=await dismiss(post.id,'');assert.equal(anonymous.status,401);assert.deepEqual(await anonymous.json(),{error:'Sign in required.'});
  for(const [id,auth] of [['not-a-meal',cookie],[randomUUID(),cookie],[post.id,otherCookie]]){const r=await dismiss(id,auth);assert.equal(r.status,404);assert.deepEqual(await r.json(),{error:'Meal not found.'});}
  assert.notEqual(checked(await db.from('posts').select('question').eq('id',post.id).single()).question,null);
  assert.equal((await dismiss(post.id,cookie)).status,204);
  assert.equal(checked(await db.from('posts').select('question').eq('id',post.id).single()).question,null);
 }finally{checked(await db.from('posts').delete().eq('id',post.id).eq('user_id',user.id));}
});
