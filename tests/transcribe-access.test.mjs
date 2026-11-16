// Local built application + disposable DB only. No model call: every case stops before transcription.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {signInAsTestUser,signInTestClient} from '../scripts/lib/session.mjs';
const checked=result=>{assert.ifError(result.error);return result.data;};
test('transcribe needs sign-in, checks ownership when a post is named, and accepts no post',async()=>{
 const origin=process.env.APP_URL;for(const endpoint of [origin,process.env.NEXT_PUBLIC_SUPABASE_URL])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(endpoint).hostname));
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}}),{user}=await signInTestClient(2),cookie=await signInAsTestUser(2),other=await signInAsTestUser(1);
 const post=randomUUID();
 const send=async(fields,auth)=>{const form=new FormData();form.append('audio',new Blob([new Uint8Array(10)],{type:'audio/wav'}),'clip.wav');form.append('draftId',randomUUID());for(const [key,value] of Object.entries(fields))form.append(key,value);const response=await fetch(origin+'/api/transcribe',{method:'POST',headers:auth?{Cookie:auth}:{},body:form,signal:AbortSignal.timeout(30000)});return{status:response.status,body:await response.json()};};
 try{
  checked(await admin.from('posts').insert({id:post,user_id:user.id,caption:'Transcribe access fixture',eaten_at:new Date().toISOString(),status:'ready',analysis_initialized_at:new Date().toISOString()}));
  assert.equal((await send({},null)).status,401,'no sign-in is refused');
  assert.equal((await send({postId:'bad'},cookie)).status,400,'a malformed post id is refused');
  const foreign=await send({postId:post},other);assert.equal(foreign.status,404,'another account cannot name this post');assert.equal(foreign.body.error,'Post not found.');
  const own=await send({postId:post},cookie);assert.equal(own.status,400);assert.equal(own.body.error,'Send a WAV recording up to two minutes.','the owner passes the post check');
  const none=await send({},cookie);assert.equal(none.status,400);assert.equal(none.body.error,'Send a WAV recording up to two minutes.','no post passes the post check');
 }finally{checked(await admin.from('posts').delete().eq('id',post));}
});
