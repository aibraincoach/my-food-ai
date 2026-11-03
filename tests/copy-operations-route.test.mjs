// Local built application + disposable DB only; fixtures use account2, never account1's feed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {signInAsTestUser,signInTestClient} from '../scripts/lib/session.mjs';
import {listFixtureObjects} from './fake-meta/storage-cleanup.mjs';
const checked=result=>{assert.ifError(result.error);return result.data;};
test('actual copy routes deduplicate concurrent/retried copies, bind owners and cancel late publication',async()=>{
 const origin=process.env.APP_URL;for(const endpoint of [origin,process.env.NEXT_PUBLIC_SUPABASE_URL])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(endpoint).hostname));
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}}),{user}=await signInTestClient(2),cookie=await signInAsTestUser(2),other=await signInAsTestUser(1);
 const source=randomUUID(),item=randomUUID(),when=new Date(Date.now()-3600000).toISOString(),operations=[randomUUID(),randomUUID(),randomUUID(),randomUUID()],posts=new Set([source]);let saved,failure;
 const request=async(path,method,body,auth=cookie)=>{const response=await fetch(origin+path,{method,headers:{...(auth?{Cookie:auth}:{}),'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});const result=await response.json();if(result.postId??result.post_id)posts.add(result.postId??result.post_id);return{status:response.status,body:result};};
 const selection=operation_id=>({operation_id,owner_id:user.id,eaten_at:when}),postPath=`/api/posts/${source}/log-again`;
 try{
  checked(await admin.from('posts').insert({id:source,user_id:user.id,caption:'Copy route fixture',eaten_at:when,status:'ready',analysis_initialized_at:new Date().toISOString()}));
  checked(await admin.from('post_items').insert({id:item,post_id:source,name:'Coffee fixture',portion_grams:240,portion_text:'240 ml',source:'user'}));
  checked(await admin.from('item_nutrition').insert({post_item_id:item,calories:2,protein_g:0,carbs_g:0,fat_g:0,micronutrients:[],source_ref:'copy-route-fixture'}));
  checked(await admin.from('intake_logs').insert({post_id:source,user_id:user.id,kind:'caffeine',amount:95,ml:240,label:'Coffee fixture',logged_at:when}));
  const snapshot=await request('/api/saved','POST',{post_id:source});assert.equal(snapshot.status,200);saved=snapshot.body.id;
  const duplicates=await Promise.all(Array.from({length:4},()=>request(postPath,'POST',selection(operations[0]))));assert.ok(duplicates.every(row=>row.status===200),JSON.stringify(duplicates));assert.equal(new Set(duplicates.map(row=>row.body.postId)).size,1);
  const first=duplicates[0].body.postId;assert.equal(checked(await admin.from('posts').select('id').eq('user_id',user.id).eq('source_post_id',source)).length,1);
  assert.equal((await request(postPath,'POST',{...selection(operations[0]),eaten_at:new Date(Date.now()-1800000).toISOString()})).status,409);
  assert.equal((await request(postPath,'POST',selection(operations[0]),other)).status,403);
  const{user:otherUser}=await signInTestClient(1);assert.equal((await request(postPath,'POST',{...selection(operations[0]),owner_id:otherUser.id},other)).status,404);
  assert.equal((await request(postPath,'DELETE',{...selection(operations[0]),owner_id:otherUser.id},other)).status,404);
  assert.equal((await request(postPath,'POST',{operation_id:operations[0],eaten_at:when})).status,403);
  assert.equal((await request(postPath,'POST',{...selection(operations[0]),operation_id:'bad'})).status,400);
  assert.equal((await request(postPath,'POST',selection(operations[0]),null)).status,401);
  checked(await admin.from('posts').delete().eq('user_id',user.id).eq('id',source));
  const retry=await request(postPath,'POST',selection(operations[0]));assert.equal(retry.status,200);assert.equal(retry.body.postId,first,'Lost-response retry does not require the deleted source');
  const savedPath=`/api/saved/${saved}/log`,savedCopies=await Promise.all([request(savedPath,'POST',selection(operations[1])),request(savedPath,'POST',selection(operations[1]))]);assert.ok(savedCopies.every(row=>row.status===200));assert.equal(savedCopies[0].body.postId,savedCopies[1].body.postId);
  const savedPost=savedCopies[0].body.postId,intake=checked(await admin.from('intake_logs').select('kind,amount,ml,source').eq('post_id',savedPost));assert.deepEqual(intake,[{kind:'caffeine',amount:95,ml:240,source:'sheet'}]);
  const wrongCancel=await request(savedPath,'DELETE',{...selection(operations[1]),eaten_at:new Date(Date.now()-1800000).toISOString()});assert.equal(wrongCancel.status,409);assert.equal(checked(await admin.from('posts').select('deleted_at').eq('id',savedPost).single()).deleted_at,null);
  const cancelled=await request(savedPath,'DELETE',selection(operations[1]));assert.equal(cancelled.status,200);assert.equal(cancelled.body.post_id,savedPost);assert.ok(checked(await admin.from('posts').select('deleted_at').eq('id',savedPost).single()).deleted_at);
  assert.equal((await request(savedPath,'POST',selection(operations[1]))).status,410);
  assert.equal((await request(savedPath,'DELETE',selection(operations[2]))).status,200);assert.equal((await request(savedPath,'POST',selection(operations[2]))).status,410);assert.equal((await request(savedPath,'DELETE',selection(operations[2]))).status,200);
  const race=await Promise.all([request(savedPath,'POST',selection(operations[3])),request(savedPath,'DELETE',selection(operations[3]))]);assert.ok([200,410].includes(race[0].status));assert.equal(race[1].status,200);assert.equal((await request(savedPath,'POST',selection(operations[3]))).status,410);
  const receipt=checked(await admin.from('copy_post_operations').select('post_id,cancelled').eq('operation_id',operations[3]).single());assert.equal(receipt.cancelled,true);if(receipt.post_id)assert.ok(checked(await admin.from('posts').select('deleted_at').eq('id',receipt.post_id).single()).deleted_at);
  const legacy=await request(savedPath,'POST',{eaten_at:when});assert.equal(legacy.status,200,'Legacy clients retain their copy contract');
 }catch(error){failure=error;}finally{
  const storageFailures=[];
  const receipts=checked(await admin.from('copy_post_operations').select('post_id').eq('user_id',user.id).in('operation_id',operations));for(const row of receipts)if(row.post_id)posts.add(row.post_id);
  for(const id of posts){try{const objects=await listFixtureObjects(admin.storage.from('media'),`${user.id}/${id}`);if(objects.length)checked(await admin.storage.from('media').remove(objects));}catch(error){storageFailures.push(error);}}
  checked(await admin.from('copy_post_operations').delete().eq('user_id',user.id).in('operation_id',operations));if(saved)checked(await admin.from('saved_meals').delete().eq('user_id',user.id).eq('id',saved));
  checked(await admin.from('posts').delete().eq('user_id',user.id).in('id',[...posts]));assert.equal(checked(await admin.from('posts').select('id').eq('user_id',user.id).in('id',[...posts])).length,0);assert.equal(checked(await admin.from('copy_post_operations').select('operation_id').eq('user_id',user.id).in('operation_id',operations)).length,0);
  if(failure)throw failure;if(storageFailures.length)throw new AggregateError(storageFailures,'Fixture storage cleanup failed after DB rows were removed');
 }
});
