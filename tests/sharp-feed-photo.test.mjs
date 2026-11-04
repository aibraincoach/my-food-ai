import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';
import * as photo from '../src/lib/posts/feed-photo.ts';
import {feedPhotoSrcSet} from '../src/lib/posts/feed-photo-url.ts';
const owner='11111111-1111-4111-8111-111111111111',post='22222222-2222-4222-8222-222222222222',media='33333333-3333-4333-8333-333333333333';
const path=`${owner}/${post}/0.jpg`;
const compiled=ts.transpileModule(readFileSync(new URL('../src/app/api/media/feed/[owner]/[post]/[media]/[variant]/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function route({user={id:owner},row={storage_path:path,kind:'photo'},transform=photo.resizeSharpPhoto,sourceFetch=async()=>{throw Error('unavailable');}}={}){
 const calls={fetch:0,sign:0,select:0,signals:[]};
 const query={select(){calls.select++;return this;},eq(){return this;},async maybeSingle(){return {data:row,error:null};}};
 const makeDb=signal=>({auth:{async getSession(){return {data:{session:user?{access_token:'offline',user}:null}};}},from:()=>query,storage:{from:()=>({async createSignedUrl(){assert.equal(signal.aborted,false,'fallback signing uses a live deadline');calls.sign++;return {data:{signedUrl:'https://storage.example/storage/v1/object/sign/media/owned'}};}})}});
 const exports={};
 vm.runInNewContext(compiled,{exports,require(name){if(name==='@/lib/supabase/server')return {createClient:async signal=>{calls.signals.push(signal);return makeDb(signal);}};if(name==='@/lib/posts/feed-photo')return {...photo,resizeSharpPhoto:transform};throw Error(name);},Response,Request,URL,AbortSignal,Uint8Array,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://storage.example',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'offline'}},fetch:async(...args)=>{calls.fetch++;return sourceFetch(...args);}});
 return {calls,get:(variant='v2-1560.webp',signal)=>exports.GET(new Request(`https://app.example/api/media/feed/${owner}/${post}/${media}/${variant}`,{signal}),{params:Promise.resolve({owner,post,media,variant})})};
}
test('density variants read the original and retain owner-scoped cache identities',async()=>{
 const source=await sharp({create:{width:1920,height:1440,channels:3,background:'#a44c32'}}).jpeg().toBuffer();
 for(const [variant,width,height] of [['v2-1040.webp',1040,780],['v2-1560.webp',1560,1170]]){
  const r=route({sourceFetch:async url=>{assert.equal(url.pathname,`/storage/v1/object/authenticated/media/${path}`);return new Response(source);}}),response=await r.get(variant);
  assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/webp');assert.equal(response.headers.get('cache-control'),'private, max-age=31536000, immutable');assert.equal(response.headers.get('etag'),`"${media}-${variant}"`);
  const metadata=await sharp(Buffer.from(await response.arrayBuffer())).metadata();assert.equal(metadata.width,width);assert.equal(metadata.height,height);
 }
});
test('invalid variants and unowned photos perform no storage access',async()=>{
 for(const [options,variant,status] of [[{},'v2-999.webp',404],[{},'toString',404],[{user:null},'v2-1560.webp',401],[{user:{id:post}},'v2-1560.webp',404],[{row:{storage_path:`${owner}/${post}/../x.jpg`,kind:'photo'}},'v2-1560.webp',404]]){
  const r=route(options);assert.equal((await r.get(variant)).status,status);assert.equal(r.calls.fetch,0);assert.equal(r.calls.sign,0);
 }
});
test('resize, download and abort failures redirect through a fresh signing deadline',async()=>{
 const source=await sharp({create:{width:16,height:16,channels:3,background:'#fff'}}).jpeg().toBuffer();
 for(const mode of ['resize','download','abort-reject','abort-resolve']){
  const controller=new AbortController();
  const r=route({sourceFetch:async()=>{if(mode==='download')throw Error('download');return new Response(source);},transform:async()=>{if(mode.startsWith('abort')){controller.abort();await new Promise(resolve=>setTimeout(resolve,10));if(mode==='abort-resolve')return source;}throw Error('resize');}});
  const response=await r.get('v2-1560.webp',controller.signal);
  assert.equal(response.status,302,mode);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.match(response.headers.get('location'),/^https:\/\/storage\.example\//);assert.equal(r.calls.sign,1);assert.equal(r.calls.signals.length,2);
 }
});
test('legacy v1 and current v2 URLs select the same density candidates',()=>{
 for(const version of ['v1','v2'])assert.equal(feedPhotoSrcSet(`/api/media/feed/a/b/c/${version}.webp`),'/api/media/feed/a/b/c/v2-1040.webp 2x, /api/media/feed/a/b/c/v2-1560.webp 3x');
 assert.equal(feedPhotoSrcSet('https://x/y.jpg'),undefined);
});
