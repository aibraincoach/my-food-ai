// npm run test:db (apply migration 0036 on a disposable database first).
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {admin,user,checked} from './helpers.mjs';
import {tsImport} from 'tsx/esm/api';
const {visibleDrinkRows}=await tsImport('../../src/lib/intake/hydration.ts',import.meta.url);

test('soft delete hides owned records and drink totals, retains data, and restores only within the owner window',async()=>{
 const db=admin(),one=await user(1),two=await user(2),id=randomUUID();
 try{
  checked(await db.from('posts').insert({id,user_id:one.user.id,caption:'Soft-delete fixture',status:'ready'}));
  const item=checked(await db.from('post_items').insert({post_id:id,name:'Water',source:'model',portion_grams:250}).select('id').single());
  checked(await db.from('intake_logs').insert({post_id:id,user_id:one.user.id,kind:'water',amount:250,ml:250,label:'Water'}));
  assert.equal(checked(await two.client.rpc('delete_post',{p_post_id:id,p_paths:[]})),false);
  assert.equal(checked(await one.client.rpc('delete_post',{p_post_id:id,p_paths:[]})),true);
  assert.deepEqual(checked(await one.client.from('posts').select('id').eq('id',id)),[]);
  assert.deepEqual(checked(await one.client.from('intake_logs').select('id').eq('post_id',id)),[]);
  assert.ok(checked(await db.from('post_items').select('id').eq('id',item.id).single()));
  assert.deepEqual(await visibleDrinkRows(db,one.user.id,[{post_id:id},{post_id:null}]),[{post_id:null}]);
  assert.equal(checked(await one.client.rpc('list_deleted_posts',{p_user_id:one.user.id})).some(post=>post.id===id),true);
  assert.deepEqual(checked(await two.client.rpc('list_deleted_posts',{p_user_id:one.user.id})),[]);
  assert.equal(checked(await two.client.rpc('restore_post',{p_post_id:id})),false);
  assert.equal(checked(await one.client.rpc('restore_post',{p_post_id:id})),true);
  assert.ok(checked(await one.client.from('posts').select('id').eq('id',id).single()));
  assert.equal(checked(await one.client.from('intake_logs').select('id').eq('post_id',id)).length,1);
  assert.equal(checked(await one.client.rpc('delete_post',{p_post_id:id,p_paths:[]})),true);
  checked(await db.from('posts').update({deleted_at:new Date(Date.now()-31*86400000).toISOString()}).eq('id',id));
  assert.equal(checked(await one.client.rpc('restore_post',{p_post_id:id})),false);
  const forbidden=await one.client.from('posts').update({deleted_at:null}).eq('id',id).select('id');
  assert.deepEqual(forbidden.data??[],[]);
 }finally{await db.from('posts').delete().eq('id',id);}
});

test('purge cascades 31-day records and queues storage cleanup, leaving 29-day records',async()=>{
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname),'Purge integration requires the disposable local database.');
 const db=admin(),one=await user(1),old=randomUUID(),recent=randomUUID();
 try{
  checked(await db.from('posts').insert([{id:old,user_id:one.user.id,caption:'Expired delete',status:'ready',deleted_at:new Date(Date.now()-31*86400000).toISOString()},{id:recent,user_id:one.user.id,caption:'Retained delete',status:'ready',deleted_at:new Date(Date.now()-29*86400000).toISOString()}]));
  const item=checked(await db.from('post_items').insert({post_id:old,name:'Water',source:'model'}).select('id').single());
  checked(await db.from('item_nutrition').insert({post_item_id:item.id,calories:0}));
  const unauthorized=await one.client.rpc('purge_deleted_posts');assert.ok(unauthorized.error);
  checked(await db.rpc('purge_deleted_posts'));
  assert.deepEqual(checked(await db.from('posts').select('id').eq('id',old)),[]);
  assert.deepEqual(checked(await db.from('post_items').select('id').eq('post_id',old)),[]);
  assert.deepEqual(checked(await db.from('item_nutrition').select('post_item_id').eq('post_item_id',item.id)),[]);
  assert.ok(checked(await db.from('posts').select('id').eq('id',recent).single()));
  const cleanup=checked(await db.from('jobs').select('post_id,payload').eq('kind','media_cleanup').eq('payload->>deleted_post_id',old).single());
  assert.equal(cleanup.post_id,null);assert.equal(cleanup.payload.owner_id,one.user.id);assert.deepEqual(cleanup.payload.paths,[]);
 }finally{await db.from('posts').delete().in('id',[old,recent]);await db.from('jobs').delete().eq('payload->>deleted_post_id',old);}
});
