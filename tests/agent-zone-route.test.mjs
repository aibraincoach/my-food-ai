import test from 'node:test';import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';import {signInTestClient} from '../scripts/lib/session.mjs';
import {createToken} from '../src/lib/agents/tokens.ts';
test('real agent API requires time_zone and atomically stores its canonical name without a missing-zone post',{timeout:30000},async()=>{
 for(const k of ['APP_URL','NEXT_PUBLIC_SUPABASE_URL'])assert.equal(new URL(process.env[k]).hostname,'127.0.0.1');
 const {user}=await signInTestClient(1),db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
 const token=await createToken(user.id,'Atomic zone HTTP fixture',db);let post;
 const count=async()=>{const r=await db.from('posts').select('*',{count:'exact',head:true}).eq('user_id',user.id);assert.ifError(r.error);return r.count;};
 const send=body=>fetch(process.env.APP_URL+'/api/agent/meals',{method:'POST',headers:{Authorization:'Bearer '+token.token,'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  const before=await count();
  for(const time_zone of [undefined,'+01:00','EST','Bad/Zone']){const r=await send({caption:'Local rice fixture',time_zone});assert.equal(r.status,400);assert.equal((await r.json()).error,'A valid time zone is required to save this meal.');assert.equal(await count(),before);}
  const r=await send({caption:'Local rice fixture',time_zone:'asia/tokyo'}),body=await r.json();post=body.id;assert.equal(r.status,201,JSON.stringify(body));
  const stored=await db.from('posts').select('render_time_zone').eq('id',post).single();assert.ifError(stored.error);assert.equal(stored.data.render_time_zone,'Asia/Tokyo');
 }finally{
  if(post){await db.from('jobs').delete().eq('post_id',post);await db.from('posts').delete().eq('id',post);}
  const removed=await db.from('agent_tokens').delete().eq('id',token.id);assert.ifError(removed.error);
 }
});
