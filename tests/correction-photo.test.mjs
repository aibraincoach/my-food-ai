import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createRequire} from 'node:module';
const correct=createRequire(import.meta.url)('../src/lib/worker/jobs/correct.ts').default;

test('caption-only correction never sends a generated nutrition card as a meal photo',async()=>{
 const saved=globalThis.fetch,key=process.env.MODEL_API_KEY;let content;
 process.env.MODEL_API_KEY='fixture';
 globalThis.fetch=async(_input,init)=>{content=JSON.parse(init.body).input[0].content;return Response.json({error:{message:'fixture stop'}},{status:400});};
 const db=createClient('http://127.0.0.1:1','fixture',{global:{fetch:async(input,init)=>{
  const url=new URL(input),path=url.pathname;
  if(path.endsWith('/posts'))return Response.json({analysis_initialized_at:'2026-10-27T00:00:00Z'});
  if(path.endsWith('/current_post_items'))return Response.json([]);
  if(path.endsWith('/post_comments'))return Response.json(url.searchParams.has('or')?[]:[{id:'comment',author:'user',body:'Add rice',created_at:'2026-10-27T00:00:00Z'}]);
  if(path.endsWith('/jobs'))return Response.json(init?.method==='PATCH'?{id:'job'}:[]);
  if(path.endsWith('/post_media'))return Response.json(url.searchParams.get('kind')==='eq.photo'?null:{storage_path:'owner/post/cards/render/card.png'});
  throw Error(`Generated card must not be downloaded: ${path}`);
 }}});
 try{
  await assert.rejects(correct(db,{id:'job',post_id:'post',payload:{}}));
  assert.ok(content,'correction reached the model using its caption/thread');
  assert.equal(content.filter(part=>part.type==='input_image').length,0);
 }finally{globalThis.fetch=saved;if(key===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=key;}
});

test('corrections never download historical photo pointers outside the owning meal',async()=>{
 const saved=globalThis.fetch,key=process.env.MODEL_API_KEY;
 process.env.MODEL_API_KEY='fixture';
 try{
  for(const storagePath of ['owner/post/0.jpg','victim/post/0.jpg','owner/other/0.jpg','owner/post/../other/0.jpg']){
   let downloads=0,modelCalls=0;
   globalThis.fetch=async(_input,init)=>{
    if(!JSON.parse(init.body).input)return Response.json([]);
    modelCalls++;return Response.json({error:{message:'fixture stop'}},{status:400});
   };
   const db=createClient('http://127.0.0.1:1','fixture',{global:{fetch:async(input,init)=>{
    const url=new URL(input),path=url.pathname;
    if(path.endsWith('/posts'))return Response.json({user_id:'owner',analysis_initialized_at:'2026-10-27T00:00:00Z'});
    if(path.endsWith('/current_post_items'))return Response.json([]);
    if(path.endsWith('/post_comments'))return Response.json(url.searchParams.has('or')?[]:[{id:'comment',author:'user',body:'Add rice',created_at:'2026-10-27T00:00:00Z'}]);
    if(path.endsWith('/jobs'))return Response.json(init?.method==='PATCH'?{id:'job'}:[]);
    if(path.endsWith('/post_media')){assert.equal(url.searchParams.get('kind'),'eq.photo');assert.equal(url.searchParams.get('not_eaten'),'eq.false');assert.equal(url.searchParams.get('order'),'position.asc');return Response.json([{storage_path:storagePath}]);}
    if(path.includes('/storage/')){downloads++;return new Response(new Uint8Array([1]),{headers:{'Content-Type':'image/jpeg'}});}
    throw Error(`Unexpected fixture path: ${path}`);
   }}});
   await assert.rejects(correct(db,{id:'job',post_id:'post',payload:{}}));
   const expected=storagePath==='owner/post/0.jpg'?1:0;
   assert.equal(downloads,expected);
   assert.equal(modelCalls,expected,'foreign photos must not be passed to the model');
  }
 }finally{globalThis.fetch=saved;if(key===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=key;}
});
