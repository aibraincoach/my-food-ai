// Disposable local Auth/REST/database and this branch's built app only.
import assert from 'node:assert/strict';
import test from 'node:test';
import {admin,user,checked} from './helpers.mjs';
import {signInAsTestUser} from '../../scripts/lib/session.mjs';

test('feedback route conceals other owners, returns current stale revision and saves current feedback',async()=>{
 for(const key of ['APP_URL','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_DB_URL']){
  assert.ok(process.env[key],`${key} is required`);
  assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env[key]).hostname),`${key} must be disposable local infrastructure`);
 }
 const owner=await user(1),other=await user(2),db=admin();let post;
 try{
  const cookie=await signInAsTestUser(1),otherCookie=await signInAsTestUser(2);
  post=checked(await db.from('posts').insert({user_id:owner.user.id,caption:'Feedback route fixture',status:'ready'}).select('id').single());
  const comment=checked(await db.from('post_comments').insert({post_id:post.id,author:'model',body:'Rice'}).select('id').single());
  checked(await db.from('post_items').insert({post_id:post.id,name:'Rice',source:'model'}));
  const revision=checked(await owner.client.rpc('feedback_revision',{p_post_id:post.id}));
  assert.equal(revision.modelCommentId,comment.id);
  const send=(session,fingerprint)=>fetch(new URL(`/api/posts/${post.id}/feedback`,process.env.APP_URL),{
   method:'POST',headers:{cookie:session,'Content-Type':'application/json'},
   body:JSON.stringify({verdict:'up',modelCommentId:comment.id,fingerprint}),signal:AbortSignal.timeout(15000)
  });
  const hidden=await send(otherCookie,revision.fingerprint);assert.equal(hidden.status,404);assert.deepEqual(await hidden.json(),{error:'Meal not found.'});
  const stale=revision.fingerprint==='0'.repeat(32)?'1'.repeat(32):'0'.repeat(32);
  const conflict=await send(cookie,stale);assert.equal(conflict.status,409);
  const body=await conflict.json();assert.equal(body.revision.fingerprint,revision.fingerprint);assert.equal(body.revision.modelCommentId,comment.id);
  assert.deepEqual(checked(await db.from('post_feedback').select('post_id').eq('post_id',post.id)),[]);
  const saved=await send(cookie,revision.fingerprint);assert.equal(saved.status,204);
  const row=checked(await owner.client.from('post_feedback').select('verdict,model_comment_id,item_fingerprint').eq('post_id',post.id).single());
  assert.deepEqual(row,{verdict:'up',model_comment_id:comment.id,item_fingerprint:revision.fingerprint});
 }finally{
  if(post)checked(await db.from('posts').delete().eq('id',post.id));
  await owner.client.auth.signOut({scope:'local'});await other.client.auth.signOut({scope:'local'});
 }
});
