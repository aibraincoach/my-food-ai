// Local built application + disposable DB only. A photo's address needs no sign-in; its secret is the only check.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {signInTestClient} from '../scripts/lib/session.mjs';
const checked=result=>{assert.ifError(result.error);return result.data;};
test('a photo address opens only with its secret, and never for a deleted meal',async()=>{
 const origin=process.env.APP_URL;for(const endpoint of [origin,process.env.NEXT_PUBLIC_SUPABASE_URL])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(endpoint).hostname));
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}}),{user}=await signInTestClient(2);
 const post=randomUUID(),path=`${user.id}/${post}/0.jpg`;
 const get=async file=>{const response=await fetch(origin+'/p/'+file,{redirect:'manual',signal:AbortSignal.timeout(30000)});await response.arrayBuffer();return response;};
 const refused=async(file,why)=>{const response=await get(file);assert.equal(response.status,404,why);assert.equal(response.headers.get('cache-control'),'no-store',why);};
 try{
  checked(await admin.from('posts').insert({id:post,user_id:user.id,caption:'Photo address fixture',eaten_at:new Date().toISOString(),status:'ready',analysis_initialized_at:new Date().toISOString()}));
  checked(await admin.storage.from('media').upload(path,await readFile(new URL('../scripts/fixtures/plate2.jpg',import.meta.url)),{contentType:'image/jpeg',upsert:true}));
  const photo=checked(await admin.from('post_media').insert({post_id:post,storage_path:path,position:0,width:390,height:390,kind:'photo'}).select('id,photo_secret').single());
  assert.match(photo.photo_secret,/^[0-9a-f]{32}$/,'the migration gives every photo a secret');
  const good=`${photo.id}_${photo.photo_secret}_640.webp`;
  const open=await get(good);assert.equal(open.status,200,'the right secret opens the photo without sign-in');assert.equal(open.headers.get('content-type'),'image/webp');assert.match(open.headers.get('cache-control'),/^public, /);
  await refused(`${photo.id}_${'0'.repeat(32)}_640.webp`,'a wrong secret is refused');
  await refused(`${photo.id}_${photo.photo_secret}_700.webp`,'a width that is not offered is refused');
  await refused(good+'?x=1','an address with a query is refused');
  await refused(`${randomUUID()}_${photo.photo_secret}_640.webp`,'the secret opens no other photo');
  checked(await admin.from('posts').update({deleted_at:new Date().toISOString()}).eq('id',post));
  await refused(good,'a deleted meal\'s photo is refused');
 }finally{await admin.storage.from('media').remove([path]);checked(await admin.from('posts').delete().eq('id',post));}
});
