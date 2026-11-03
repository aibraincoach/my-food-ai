// Disposable full local stack only:
// node --env-file=.env.local --test tests/db/identify-after.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {signInAsTestUser} from '../../scripts/lib/session.mjs';
import {user as testUser} from './helpers.mjs';
const local=value=>['localhost','127.0.0.1','[::1]'].includes(new URL(value).hostname);
test('a fresh local scripted-Meta meal commits its model with nutrition and exposes that identity to its owner',{timeout:140000},async()=>{
 for(const key of ['APP_URL','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_DB_URL','MODEL_API_BASE_URL']){assert.ok(process.env[key],`${key} is required`);assert.ok(local(process.env[key]),`${key} must be a disposable local service`);}
 assert.ok(process.env.SUPABASE_SECRET_KEY);
 const owner=await testUser(2);
 const preference=await owner.client.from('profiles').select('identify_provider').eq('id',owner.user.id).single();assert.equal(preference.error,null);assert.equal(preference.data.identify_provider,'meta','This local gate must use only the scripted Meta provider.');
 const cookie=await signInAsTestUser(2),db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const caption=`One boiled egg, 50 grams. Identity fixture ${randomUUID()}`;let id,owned=false;
 try{
  const response=await fetch(new URL('/api/posts',process.env.APP_URL),{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify({operation_id:randomUUID(),capture_intent:'text',caption,shots:[]}),signal:AbortSignal.timeout(15000)});assert.equal(response.status,200);id=(await response.json()).postId;assert.match(id,/^[0-9a-f-]{36}$/i);
  const fixture=await db.from('posts').select('caption').eq('id',id).single();assert.equal(fixture.error,null);assert.equal(fixture.data.caption,caption);owned=true;
  let row;const deadline=Date.now()+110000;
  while(Date.now()<deadline){const result=await db.from('posts').select('status,identify_model,identify_host').eq('id',id).single();assert.equal(result.error,null);row=result.data;if(['ready','failed','needs_input'].includes(row.status))break;await new Promise(r=>setTimeout(r,250));}
  assert.equal(row?.status,'ready');assert.equal(row.identify_model,'muse-spark-1.3');assert.equal(row.identify_host,'meta');
  const detail=await fetch(new URL(`/posts/${id}`,process.env.APP_URL),{headers:{cookie},signal:AbortSignal.timeout(30000)});assert.equal(detail.status,200);const text=await detail.text();assert.ok(text.includes('Identified by Muse Spark 1.3'),'owned detail must name the committed identity');
 }finally{if(id&&owned){const result=await db.from('posts').delete().eq('id',id).eq('caption',caption);assert.equal(result.error,null);const remaining=await db.from('posts').select('id').eq('id',id);assert.equal(remaining.error,null);assert.equal(remaining.data.length,0);}await owner.client.auth.signOut({scope:'local'});}
});
