// Run after applying 0036 on the test database:
// node --env-file=.env.local --test --test-concurrency=1 tests/db/delete-and-remove.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {admin,user,checked} from './helpers.mjs';

test('correction and leftovers removal enforce ownership and photo type',async()=>{
 const db=admin(),one=await user(1),two=await user(2),id=randomUUID();let exactJob;
 try{
  checked(await db.from('posts').insert({id,user_id:one.user.id,caption:'Removal access fixture',status:'ready'}));
  const comment=checked(await db.from('post_comments').insert({post_id:id,author:'user',body:'Use 100 grams.'}).select('id').single());
  const photos=checked(await db.from('post_media').insert([{post_id:id,kind:'photo',not_eaten:false,storage_path:`${one.user.id}/${id}/0.jpg`,position:0,width:1,height:1},{post_id:id,kind:'photo',not_eaten:true,storage_path:`${one.user.id}/${id}/1.jpg`,position:1,width:1,height:1}]).select('id,not_eaten'));
  const plain=photos.find(row=>!row.not_eaten),leftovers=photos.find(row=>row.not_eaten);
  assert.equal(checked(await two.client.rpc('revert_correction',{p_comment_id:comment.id})),false);
  assert.equal(checked(await two.client.rpc('remove_post_media',{p_media_id:leftovers.id})),false);
  assert.equal(checked(await one.client.rpc('remove_post_media',{p_media_id:plain.id})),false);
  const forbidden=await one.client.from('post_comments').update({body:'Changed'}).eq('id',comment.id);assert.equal(forbidden.error?.code,'42501');
  assert.equal(checked(await one.client.rpc('remove_post_media',{p_media_id:leftovers.id})),true);
  const cleanup=checked(await db.from('jobs').select('id,payload').eq('kind','media_cleanup').eq('payload->>removed_media_id',leftovers.id).single());exactJob=cleanup.id;
  assert.equal(cleanup.payload.exact,true);assert.equal(cleanup.payload.paths.length,2);
  assert.equal(checked(await db.from('posts').select('status').eq('id',id).single()).status,'processing');
  assert.equal(checked(await one.client.rpc('revert_correction',{p_comment_id:comment.id})),false);
  checked(await db.from('posts').update({status:'ready'}).eq('id',id));
  assert.equal(checked(await one.client.rpc('revert_correction',{p_comment_id:comment.id})),true);
  assert.ok(checked(await db.from('post_comments').select('reverted_at').eq('id',comment.id).single()).reverted_at);
 }finally{await db.from('posts').delete().eq('id',id);if(exactJob)await db.from('jobs').delete().eq('id',exactJob);}
});
