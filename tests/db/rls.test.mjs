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
    await first.client.auth.signOut({scope:'local'}); await second.client.auth.signOut({scope:'local'});
  }
});

test('second user cannot read another user’s profile, drinks, saved meals or photo objects', async () => {
  const first = await user(1), second = await user(2), db = admin();
  let post, intake, saved, path;
  try {
    post = checked(await db.from('posts').insert({user_id:first.user.id,caption:'Access test 2'}).select('id').single());
    intake = checked(await db.from('intake_logs').insert({user_id:first.user.id,kind:'water',amount:250}).select('id').single());
    saved = checked(await db.from('saved_meals').insert({user_id:first.user.id,name:'Access test',items:[]}).select('id').single());
    assert.equal(checked(await first.client.from('profiles').select('handle').eq('id',first.user.id)).length, 1, 'owner reads own profile');
    assert.deepEqual(checked(await second.client.from('profiles').select('handle').eq('id',first.user.id)), [], 'profiles');
    assert.equal(checked(await first.client.from('intake_logs').select('id').eq('id',intake.id)).length, 1);
    assert.deepEqual(checked(await second.client.from('intake_logs').select('id').eq('id',intake.id)), [], 'intake_logs');
    assert.equal(checked(await first.client.from('saved_meals').select('id').eq('id',saved.id)).length, 1);
    assert.deepEqual(checked(await second.client.from('saved_meals').select('id').eq('id',saved.id)), [], 'saved_meals');
    path=`${first.user.id}/${post.id}/0.jpg`;
    checked(await db.storage.from('media').upload(path,new Uint8Array([255,216,255,217]),{contentType:'image/jpeg'}));
    const ownSigned=await first.client.storage.from('media').createSignedUrl(path,60);
    assert.ok(!ownSigned.error&&ownSigned.data?.signedUrl,'owner can sign the existing fixture');
    const signed = await second.client.storage.from('media').createSignedUrl(path, 60);
    assert.ok(signed.error || !signed.data?.signedUrl, 'another owner’s folder cannot be signed');
  } finally {
    if (path) checked(await db.storage.from('media').remove([path]));
    if (saved) checked(await db.from('saved_meals').delete().eq('id',saved.id));
    if (intake) checked(await db.from('intake_logs').delete().eq('id',intake.id));
    if (post) checked(await db.from('posts').delete().eq('id',post.id));
    await first.client.auth.signOut({scope:'local'}); await second.client.auth.signOut({scope:'local'});
  }
});
