import assert from 'node:assert/strict';
import test from 'node:test';
import { admin, user, checked } from './helpers.mjs';
test('second ordinary user cannot read another user’s post or child rows', async () => {
  const first = await user(1), second = await user(2), db = admin();
  let post;
  try {
    post = checked(await db.from('posts').insert({user_id:first.user.id,caption:'Access test'}).select('id').single());
    checked(await db.from('post_media').insert({post_id:post.id,storage_path:'test/rls.jpg',position:0}));
    checked(await db.from('post_items').insert({post_id:post.id,name:'Rice',source:'model'}));
    checked(await db.from('post_comments').insert({post_id:post.id,author:'model',body:'Rice'}));
    checked(await db.from('post_locations').insert({post_id:post.id,lat:0,lng:0,accuracy_m:1}));
    for (const table of ['posts','post_media','post_items','post_comments','post_locations']) {
      const key = table === 'posts' ? 'id' : 'post_id';
      assert.ok(checked(await first.client.from(table).select('*').eq(key,post.id)).length, `${table}: fixture is visible to owner`);
      assert.deepEqual(checked(await second.client.from(table).select('*').eq(key,post.id)), [], table);
    }
    checked(await db.from('jobs').insert({post_id:post.id,kind:'test_noop',status:'finished'}));
    const jobs = await second.client.from('jobs').select('id').eq('post_id',post.id);
    assert.ok(jobs.error || jobs.data?.length === 0, 'jobs must be unreadable');
  } finally {
    if(post) checked(await db.from('posts').delete().eq('id',post.id));
    await first.client.auth.signOut(); await second.client.auth.signOut();
  }
});
