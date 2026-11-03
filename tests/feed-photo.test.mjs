// node --import tsx --test tests/feed-photo.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';
import * as photo from '../src/lib/posts/feed-photo.ts';
import {smallFeedPhotoUrl} from '../src/lib/posts/feed-photo-url.ts';
import {createClient} from '@supabase/supabase-js';
import {getFeed,getFirstFeedPhoto} from '../src/lib/posts/feed.ts';

const owner='11111111-1111-4111-8111-111111111111',post='22222222-2222-4222-8222-222222222222',media='33333333-3333-4333-8333-333333333333';
const path=`${owner}/${post}/0.jpg`;
const routeSource=readFileSync(new URL('../src/app/api/media/feed/[owner]/[post]/[media]/v1.webp/route.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(routeSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function route({user={id:owner},row={storage_path:path,kind:'photo'},authThrows=false,transform=photo.resizeFeedPhoto,sourceFetch}={}) {
 const filters=[],calls={auth:0,select:0,fetch:0,sign:0};
 const query={select(){calls.select++;return this;},eq(k,v){filters.push([k,v]);return this;},async maybeSingle(){return {data:row,error:null};}};
 const db={auth:{async getUser(){calls.auth++;if(authThrows)throw Error('private diagnostic');return {data:{user},error:null};},async getSession(){return {data:{session:{access_token:'offline-token'}}};}},from(){return query;},storage:{from(){return {async createSignedUrl(){calls.sign++;return {data:{signedUrl:'https://storage.example/storage/v1/object/sign/media/owned'},error:null};}};}}};
 const exports={};
 vm.runInNewContext(compiled,{exports,require(name){if(name==='@/lib/supabase/server')return {createClient:async()=>db};if(name==='@/lib/posts/feed-photo')return {...photo,resizeFeedPhoto:transform};throw Error(name);},Response,Request,URL,AbortSignal,Uint8Array,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://storage.example',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'offline'}},fetch:async(...args)=>{calls.fetch++;return sourceFetch(...args);}});
 return {get:async(params={owner,post,media},search='')=>exports.GET(new Request(`https://app.example${smallFeedPhotoUrl(owner,post,media)}${search}`),{params:Promise.resolve(params)}),calls,filters};
}

test('route rejects invalid, signed-out, cross-owner, deleted and foreign-path media before storage',async()=>{
 for(const [setup,params,search,status] of [
  [{},{owner:'bad',post,media},'',404], [{},{owner,post,media},'?q=1',404],
  [{user:null},{owner,post,media},'',401], [{user:{id:post}},{owner,post,media},'',404],
  [{row:null},{owner,post,media},'',404], [{row:{storage_path:`${post}/${post}/0.jpg`,kind:'photo'}},{owner,post,media},'',404],
  [{row:{storage_path:path,kind:'card'}},{owner,post,media},'',404], [{authThrows:true},{owner,post,media},'',503],
 ]) {
  const r=route(setup),response=await r.get(params,search);
  assert.equal(response.status,status);assert.equal(r.calls.fetch,0);assert.equal(r.calls.sign,0);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
 }
});

test('authorized route binds both media and post, uses fixed storage origin and emits a small private WebP',async()=>{
 const source=await sharp({create:{width:1080,height:1080,channels:3,background:'#a44c32'}}).jpeg().toBuffer();
 const r=route({sourceFetch:async(url,init)=>{assert.equal(url.origin,'https://storage.example');assert.equal(url.pathname,`/storage/v1/object/authenticated/media/${owner}/${post}/0.feed.jpg`);assert.equal(init.redirect,'error');assert.equal(init.headers.Authorization,'Bearer offline-token');return new Response(source);}});
 const response=await r.get(),body=Buffer.from(await response.arrayBuffer());
 assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/webp');assert.equal(response.headers.get('x-content-type-options'),'nosniff');
 assert.deepEqual(r.filters,[['id',media],['post_id',post]]);assert.equal(r.calls.fetch,1);assert.equal(r.calls.sign,0);
 const info=await sharp(body).metadata();assert.equal(info.width,512);assert.equal(info.height,512);assert.ok(body.length<=50_000);
});

test('authorized transform failure retains bounded JPEG; download failure redirects only after ownership lookup',async()=>{
 const source=await sharp({create:{width:16,height:16,channels:3,background:'#fff'}}).jpeg().toBuffer();
 let r=route({sourceFetch:async()=>new Response(source),transform:async()=>{throw Error('native failure');}});
 let response=await r.get();assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/jpeg');assert.deepEqual(Buffer.from(await response.arrayBuffer()),source);
 r=route({sourceFetch:async()=>{throw Error('timeout');}});response=await r.get();assert.equal(response.status,302);assert.equal(r.calls.select,1);assert.equal(r.calls.sign,1);assert.match(response.headers.get('location'),/^https:\/\/storage\.example\//);
});

test('stream byte and decoded pixel limits are enforced; owner paths cannot traverse',async()=>{
 assert.equal(photo.feedPhotoPath(`${owner}/${post}/../x.jpg`,owner,post),null);
 assert.equal(photo.feedPhotoPath(`other/${post}/0.jpg`,owner,post),null);
 assert.equal(smallFeedPhotoUrl(owner,post,'../x'),null);
 await assert.rejects(photo.readFeedSource(new Response(new Uint8Array(4),{headers:{'content-length':String(photo.MAX_FEED_SOURCE_BYTES+1)}})),/large/);
 await assert.rejects(photo.readFeedSource(new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(photo.MAX_FEED_SOURCE_BYTES));c.enqueue(new Uint8Array(1));c.close();}}))),/large/);
 await assert.rejects(photo.readFeedSource(new Response('not JPEG')),/JPEG/);
 const oversized=await sharp({create:{width:1500,height:1500,channels:3,background:'#fff'}}).jpeg().toBuffer();
 await assert.rejects(photo.resizeFeedPhoto(oversized),/pixel limit/i);
});

test('native work is limited to four concurrent requests and release is idempotent',()=>{
 const releases=Array.from({length:4},()=>photo.reserveFeedPhoto());
 try {assert.ok(releases.every(Boolean));assert.equal(photo.reserveFeedPhoto(),null);releases[0]();releases[0]();const slot=photo.reserveFeedPhoto();assert.ok(slot);assert.equal(photo.reserveFeedPhoto(),null);slot();}
 finally {releases.forEach(release=>release?.());}
});

test('SSR seed and first batch slide use the same private identity; only other photos are signed',async()=>{
 const nextPost='44444444-4444-4444-8444-444444444444',nextMedia='55555555-5555-4555-8555-555555555555';
 const rows=[post,nextPost].map((id,index)=>({id,user_id:owner,status:'queued',caption:'Meal',created_at:'2026-11-03T01:00:00Z',eaten_at:`2026-11-0${3-index}T01:00:00Z`}));
 const pictures=[{id:media,post_id:post,storage_path:path,kind:'photo',position:0},{id:nextMedia,post_id:nextPost,storage_path:`${owner}/${nextPost}/0.jpg`,kind:'photo',position:0}];
 let signed=0;
 const db=createClient('https://fixture.invalid','offline',{global:{fetch:async(input,init)=>{
  const url=new URL(input instanceof Request?input.url:String(input));
  if(url.pathname.endsWith('/posts'))return Response.json(url.searchParams.get('select').includes('post_media')?[{...rows[0],post_media:[pictures[0]]}]:rows);
  if(url.pathname.endsWith('/post_media'))return Response.json(pictures);
  if(url.pathname.endsWith('/saved_meals'))return Response.json([]);
  if(url.pathname.includes('/object/sign/media')){
   signed++;const body=JSON.parse(init.body);assert.deepEqual(body.paths,[`${owner}/${nextPost}/0.feed.jpg`]);
   return Response.json(body.paths.map(path=>({path,signedURL:`/object/sign/media/${path}?token=offline`})));
  }
  throw Error('Unexpected read '+url.pathname);
 }}});
 const preloads=[],page=await getFeed(db,owner,null,'UTC',6,{summaries:false,onFirstPhoto:url=>preloads.push(url)}),seed=await getFirstFeedPhoto(db,owner);
 assert.equal(page.posts[0].photoUrl,smallFeedPhotoUrl(owner,post,media));assert.equal(seed.photoUrl,page.posts[0].photoUrl);assert.deepEqual(preloads,[seed.photoUrl]);
 assert.match(page.posts[1].photoUrl,/0\.feed\.jpg/);assert.equal(signed,1);
});
