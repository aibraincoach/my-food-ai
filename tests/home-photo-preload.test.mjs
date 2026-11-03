import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {homePhotoPreload} from '../src/lib/posts/home-photo-preload.ts';
import {smallFeedPhotoUrl} from '../src/lib/posts/feed-photo-url.ts';

const owner='11111111-1111-4111-8111-111111111111', post='22222222-2222-4222-8222-222222222222', media='33333333-3333-4333-8333-333333333333';
const row={id:post,user_id:owner,post_media:[{id:post,kind:'photo',position:3},{id:owner,kind:'card',position:0},{id:media,kind:'photo',position:1}]};
function database(result={data:row,error:null},hang=false) {
 const calls=[];let signal;
 const query={};
 for(const method of ['select','is','eq','neq','or','order','limit'])query[method]=(...args)=>{calls.push([method,...args]);return query;};
 query.abortSignal=value=>{signal=value;return query;};
 query.maybeSingle=async()=>{if(hang)return new Promise(()=>{});if(result instanceof Error)throw result;return result;};
 return {db:{from(table){calls.push(['from',table]);return query;}},calls,get signal(){return signal;}};
}
test('home hint matches the SSR private URL and selects the first ordered photo with feed visibility filters',async()=>{
 const mock=database();
 assert.equal(await homePhotoPreload(mock.db,'/',owner),`<${smallFeedPhotoUrl(owner,post,media)}>; rel=preload; as=image; fetchpriority=high; crossorigin=anonymous`);
 assert.deepEqual(mock.calls,[['from','posts'],['select','id,user_id,post_media(id,kind,position)'],['is','deleted_at',null],['eq','user_id',owner],['neq','status','needs_input'],['or','needs_input.is.null,status.eq.failed'],['order','eaten_at',{ascending:false}],['order','id',{ascending:false}],['limit',1]]);
});
test('owner mismatch, no row, no photo, invalid identity and read failures fail open',async()=>{
 for(const result of [{data:null},{data:{...row,user_id:post}},{data:{...row,post_media:[]}},{data:{...row,id:'bad'}},{data:{...row,post_media:[{id:'bad',kind:'photo',position:0}]}},{data:row,error:{message:'private diagnostic'}},new Error('private diagnostic')]) {
  assert.equal(await homePhotoPreload(database(result).db,'/',owner),null);
 }
 for(const [pathname,user] of [['/search',owner],['/days',owner],['/',undefined],['/','invalid']]) {
  const mock=database();assert.equal(await homePhotoPreload(mock.db,pathname,user),null);assert.equal(mock.calls.length,0);
 }
});
test('deadline physically aborts and returns even if the transport ignores cancellation',async()=>{
 const mock=database(undefined,true),start=performance.now();
 assert.equal(await homePhotoPreload(mock.db,'/',owner),null);
 assert.ok(performance.now()-start>=300);assert.ok(performance.now()-start<1000);assert.equal(mock.signal.aborted,true);
});

test('actual middleware calls hint only for authenticated home and appends it to the session response',async()=>{
 const source=readFileSync(new URL('../src/middleware.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 for(const [pathname,user] of [['/',{id:owner}],['/search',{id:owner}],['/days',{id:owner}],['/',null]]) {
  const response=new Response(null,{headers:{Link:'</existing>; rel=preconnect'}});let hints=0;
  const exports={};
  vm.runInNewContext(compiled,{exports,process:{env:{}},URL,require(name){
   if(name==='@/lib/auth/verified-user-header')return {VERIFIED_USER_HEADER:'x-mfa-verified-user'};
   if(name==='@/lib/auth/media-session-epoch')return {mediaSessionEpoch:()=>null};
   if(name==='next/server')return {NextResponse:{redirect:()=>new Response(null,{status:307})}};
   if(name==='@supabase/ssr')return {createServerClient:()=>({auth:{getUser:async()=>({data:{user}}),getSession:async()=>({data:{session:null}})}})};
   if(name==='@/lib/auth/admin-access')return {};
   if(name==='@/lib/auth/session-cookies')return {sessionCookieBridge:()=>({response,cookies:{},apply:r=>r,refreshRequestHeaders:()=>{}})};
   if(name==='@/lib/posts/home-photo-preload')return {homePhotoPreload:async()=>{hints++;return '<test>; rel=preload';}};
   throw Error(name);
  }});
  const result=await exports.middleware({url:`https://app.example${pathname}`,nextUrl:{pathname},headers:new Headers()});
  assert.equal(hints,pathname==='/'&&user?1:0);
  if(hints){assert.equal(result.headers.get('link'),'</existing>; rel=preconnect, <test>; rel=preload');assert.equal(result.headers.get('cache-control'),'private, no-store');}
 }
});
