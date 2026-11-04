import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {getPostDetail} from '../src/lib/posts/items.ts';
test('detail signs both initial and leftovers originals in one batch and retains versioned previews',async()=>{
 const owner='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222';
 const photos=['33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444'].map((photo,index)=>({id:photo,post_id:id,kind:'photo',storage_path:`${owner}/${id}/${index}.jpg`,not_eaten:index===1,width:3024,height:4032}));
 const signed=[];
 const db=createClient('https://fixture.invalid','offline',{global:{fetch:async(input,init)=>{
  const u=new URL(input instanceof Request?input.url:String(input));
  if(u.pathname.endsWith('/posts')&&!u.searchParams.has('id'))return Response.json([]);
  if(u.pathname.endsWith('/posts'))return Response.json({id,user_id:owner,caption:'Meal',status:'queued',eaten_at:'2026-11-04T01:00:00Z',created_at:'2026-11-04T01:00:00Z',needs_input:null});
  if(u.pathname.endsWith('/post_media'))return Response.json(photos);
  if(u.pathname.endsWith('/object/sign/media')){const paths=JSON.parse(init.body).paths;signed.push(paths);return Response.json(paths.map(path=>({path,signedURL:`/object/sign/media/${path}?token=fixture`})))}
  if(u.pathname.endsWith('/saved_meals'))return Response.json(null);
  return Response.json([]);
 }}});
 const detail=await getPostDetail(db,id);
 assert.deepEqual(signed,[photos.map(row=>row.storage_path)]);
 assert.equal(detail.photos.length,2);assert.equal(detail.photos[1].not_eaten,true);
 for(let index=0;index<2;index++){
  assert.match(detail.slides[index].url,new RegExp(`/${index}\\.jpg\\?token=fixture$`));
  assert.match(detail.slides[index].previewUrl,/\/v2\.webp$/);
  assert.equal(detail.slides[index].width,3024);assert.equal(detail.slides[index].height,4032);
 }
});
