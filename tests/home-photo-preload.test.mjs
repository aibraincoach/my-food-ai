import {verifiedUserCookie} from '../src/lib/auth/verified-cookie.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createElement} from 'react';
import {preload} from 'react-dom';
import {renderToReadableStream} from 'react-dom/server';
import {feedPhotoSrcSet,smallFeedPhotoUrl} from '../src/lib/posts/feed-photo-url.ts';
const owner='11111111-1111-4111-8111-111111111111',post='22222222-2222-4222-8222-222222222222',media='33333333-3333-4333-8333-333333333333';
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;

test('middleware makes no photo query or HTTP image preload while preserving auth and cache headers',async()=>{
 const compiled=compile(readFileSync(new URL('../src/middleware.ts',import.meta.url),'utf8'));
 for(const [pathname,user] of [['/',{id:owner}],['/search',{id:owner}],['/days',{id:owner}],['/',null]]){
  const response=new Response(null,{headers:{Link:'</existing>; rel=preconnect'}});let photoReads=0;
  const exports={};
  vm.runInNewContext(compiled,{exports,console:{info(){}},process:{env:{}},URL,require(name){
   if(name==='@/lib/auth/verified-cookie')return{verifiedUserCookie};
   if(name==='@/lib/auth/verified-user-header')return{VERIFIED_USER_HEADER:'x-mfa-verified-user'};
   if(name==='@/lib/auth/media-session-epoch')return{mediaSessionEpoch:()=>null};
   if(name==='next/server')return{NextResponse:{redirect:()=>new Response(null,{status:307})}};
   if(name==='@supabase/ssr')return{createServerClient:()=>({auth:{getUser:async()=>({data:{user}}),getSession:async()=>({data:{session:null}})},from(){photoReads++;throw Error('No photo read belongs in middleware');}})};
   if(name==='@/lib/auth/admin-access')return{};
   if(name==='@/lib/auth/session-cookies')return{sessionCookieBridge:()=>({response,cookies:{setAll(){}},apply:r=>r,refreshRequestHeaders:()=>{}})};
   throw Error(name);
  }});
  const result=await exports.middleware({url:`https://app.example${pathname}`,nextUrl:{pathname,protocol:'https:'},headers:new Headers()});
  assert.equal(photoReads,0);
  if(user){assert.equal(result.headers.get('link'),'</existing>; rel=preconnect');if(pathname==='/')assert.equal(result.headers.get('cache-control'),'private, no-store');}
  else assert.equal(result.status,307);
 }
});

test('Home HTML preload and first image expose identical density candidates without a second base-only hint',async()=>{
 const url=smallFeedPhotoUrl(owner,post,media),preloads=[],exports={};
 const source=readFileSync(new URL('../src/app/(tabs)/page.tsx',import.meta.url),'utf8')+'\nexport {HomeFirstPhoto,homeSeed};';
 vm.runInNewContext(compile(source),{exports,Date,Promise,Array,AbortSignal,setTimeout,clearTimeout,require(name){
  if(name==='react')return{cache:fn=>fn,Suspense:()=>null};
  if(name==='react-dom')return{preload:(href,options)=>preloads.push({href,...options})};
  if(name==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name==='@/lib/posts/feed-photo-url')return{feedPhotoSrcSet};
  if(name==='next/server')return{connection:async()=>{}};
  if(name==='next/headers')return{cookies:async()=>({get:()=>({value:'UTC'})})};
  if(name==='@/lib/auth/verified-user')return{verifiedUserId:async()=>owner};
  if(name==='@/lib/supabase/server')return{createClient:async()=>({})};
  if(name==='@/lib/posts/days')return{validZone:()=> 'UTC',dateInZone:()=> '2026-11-03',shiftDay:(_,step)=>String(step)};
  if(name==='@/lib/posts/feed')return{getFirstFeedPhoto:async()=>({id:post,photoUrl:url,caption:'Rice',eaten_at:'2026-11-03T10:00:00Z'}),getFeed:async(_db,_owner,_cursor,_zone,_size,options)=>{options.onFirstPhoto(url);return{posts:[],days:[],nextCursor:null};}};
  if(name==='next/link'||name.startsWith('@/components/'))return{default:name};
  if(name==='@/lib/posts/today-view')return{};
  throw Error(name);
 }});
 const tree=await exports.HomeFirstPhoto();await exports.homeSeed();
 function findImage(node){if(Array.isArray(node))return node.map(findImage).find(Boolean);if(node?.type==='img')return node.props;return node?.props?findImage(node.props.children):undefined;}
 const image=findImage(tree);assert.ok(image);
 assert.equal(image.src,url);assert.equal(image.srcSet,feedPhotoSrcSet(url));
 assert.ok(image.srcSet.startsWith(image.src+' 1x, '),'the preload includes the img implicit1x candidate explicitly');
 assert.equal(preloads.length,2,'independent streams both describe the same responsive resource for React to deduplicate');
 for(const preload of preloads){assert.equal(preload.href,image.src);assert.equal(preload.imageSrcSet,image.srcSet);assert.equal(preload.crossOrigin,image.crossOrigin);assert.equal(preload.as,'image');}
});


test('React emits one responsive HTML preload and no base image Link header for duplicated stream hints',async()=>{
 const url=smallFeedPhotoUrl(owner,post,media),srcSet=feedPhotoSrcSet(url);let headers;
 function ResponsivePhoto(){
  const options={as:'image',crossOrigin:'anonymous',imageSrcSet:srcSet,fetchPriority:'high'};
  preload(url,options);preload(url,options);
  return createElement('img',{src:url,srcSet,crossOrigin:'anonymous',fetchPriority:'high',alt:'Meal'});
 }
 const stream=await renderToReadableStream(createElement(ResponsivePhoto),{onHeaders:value=>{headers=value;}});
 const html=await new Response(stream).text();
 assert.equal(headers.get('link'),null,'responsive hints must not request the base URL via an HTTP header');
 const links=html.match(/<link\b[^>]*>/g)??[];
 assert.equal(links.length,1,'duplicate server streams and the img share one preload resource');
 assert.ok(links[0].includes('rel="preload"'));assert.ok(links[0].includes('imageSrcSet="'+srcSet+'"'));
 assert.equal(/\bhref=/.test(links[0]),false,'the HTML preload selects srcset instead of also fetching a base href');
});
