// Disposable local database/Auth/REST only, with migration0038 installed.
import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {admin,user,checked} from './helpers.mjs';

test('unmark retains the owned photo and queues one rebuild; other users cannot unmark',async()=>{
 for(const key of ['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_DB_URL']){
  assert.ok(process.env[key],`${key} is required`);
  assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env[key]).hostname),`${key} must be disposable local infrastructure`);
 }
 const one=await user(1),two=await user(2),db=admin(),id=randomUUID();
 try{
  checked(await db.from('posts').insert({id,user_id:one.user.id,caption:'Unmark leftovers fixture',status:'ready'}));
  const photos=checked(await db.from('post_media').insert([
   {post_id:id,kind:'photo',not_eaten:false,storage_path:`${one.user.id}/${id}/0.jpg`,position:0,width:1,height:1},
   {post_id:id,kind:'photo',not_eaten:true,storage_path:`${one.user.id}/${id}/1.jpg`,position:1,width:1,height:1}
  ]).select('id,not_eaten,storage_path'));
  const marked=photos.find(p=>p.not_eaten),plain=photos.find(p=>!p.not_eaten);
  const denied=await two.client.rpc('unmark_not_eaten',{p_media_id:marked.id});assert.equal(denied.error?.code,'42501');
  assert.equal(checked(await db.from('post_media').select('not_eaten').eq('id',marked.id).single()).not_eaten,true);
  assert.deepEqual(checked(await db.from('jobs').select('id').eq('post_id',id)),[]);
  const jobId=checked(await one.client.rpc('unmark_not_eaten',{p_media_id:marked.id}));assert.match(jobId,/^[0-9a-f-]{36}$/i);
  const photo=checked(await one.client.from('post_media').select('id,not_eaten,storage_path').eq('id',marked.id).single());
  assert.deepEqual(photo,{id:marked.id,not_eaten:false,storage_path:marked.storage_path});
  assert.equal(checked(await db.from('post_media').select('id').eq('post_id',id)).length,2);
  const jobs=checked(await db.from('jobs').select('id,kind,status,payload').eq('post_id',id));assert.equal(jobs.length,1);
  assert.deepEqual(jobs[0],{id:jobId,kind:'recompute',status:'queued',payload:{reason:'media_removed',media_position:1,media_unmarked:true}});
  assert.equal(checked(await db.from('posts').select('status').eq('id',id).single()).status,'processing');
  const duplicate=await one.client.rpc('unmark_not_eaten',{p_media_id:marked.id});assert.equal(duplicate.error?.code,'55000');
  checked(await db.from('posts').update({status:'ready'}).eq('id',id));
  const unmarked=await one.client.rpc('unmark_not_eaten',{p_media_id:plain.id});assert.equal(unmarked.error?.code,'55000');
  assert.equal(checked(await db.from('jobs').select('id').eq('post_id',id)).length,1);
 }finally{
  checked(await db.from('posts').delete().eq('id',id));
  await one.client.auth.signOut({scope:'local'});await two.client.auth.signOut({scope:'local'});
 }
});
