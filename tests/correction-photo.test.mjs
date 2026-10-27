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
