import {englishIntl,englishIntlServer} from './fixtures/english-intl.mjs';
import * as readingFormat from '../src/i18n/format.ts';
import {verifiedUserCookie} from '../src/lib/auth/verified-cookie.ts';
import {sumNutrition} from '../src/lib/nutrition/totals.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createElement} from 'react';
import {preload} from 'react-dom';
import {renderToReadableStream} from 'react-dom/server';
import {feedPhotoSrcSet,smallFeedPhotoUrl,firstPhotoSources} from '../src/lib/posts/feed-photo-url.ts';
const owner='11111111-1111-4111-8111-111111111111',post='22222222-2222-4222-8222-222222222222',media='33333333-3333-4333-8333-333333333333';
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;

test('middleware makes no photo query or HTTP image preload while preserving auth and cache headers',async()=>{
 const compiled=compile(readFileSync(new URL('../src/middleware.ts',import.meta.url),'utf8'));
 for(const [pathname,user] of [['/',{id:owner}],['/search',{id:owner}],['/days',{id:owner}],['/',null]]){
  const response=new Response(null,{headers:{Link:'</existing>; rel=preconnect'}});let photoReads=0;
  const exports={};
  vm.runInNewContext(compiled,{exports,AbortSignal,console:{info(){}},process:{env:{}},URL,require(name){
 if(name==='next-intl')return englishIntl;
 if(name==='next-intl/server')return englishIntlServer;
 if(name==='@/i18n/format')return readingFormat;

   if(name==='@/i18n/locales')return{isLocale:value=>value==='en'||value==='ja'};
   if(name==='@/lib/auth/verified-cookie')return{verifiedUserCookie};
   if(name==='@/lib/auth/verified-user-header')return{VERIFIED_USER_HEADER:'x-mfa-verified-user'};
   if(name==='@/lib/auth/media-session-epoch')return{mediaSessionEpoch:()=>null};
   if(name==='next/server')return{NextResponse:{redirect:()=>new Response(null,{status:307})}};
   if(name==='@supabase/ssr')return{createServerClient:()=>({auth:{getUser:async()=>({data:{user}}),getSession:async()=>({data:{session:null}}),getClaims:async()=>({data:{claims:user?{sub:user.id}:null}})},from(table){if(table==='profiles')return{select:columns=>{assert.equal(columns,'id,role');return{eq:()=>{const query={abortSignal(signal){assert.ok(signal);return query;},maybeSingle:async()=>({data:{id:user.id,role:'user'},error:null})};return query;}}}};photoReads++;throw Error('No photo read belongs in middleware');}})};
   if(name==='@/lib/auth/admin-access')return{};
   if(name==='@/lib/auth/post-access')return{};
   if(name==='@/lib/auth/session-cookies')return{sessionCookieBridge:()=>({response,cookies:{setAll(){}},apply:r=>r,refreshRequestHeaders:()=>{}})};
   throw Error(name);
  }});
  const result=await exports.middleware({url:`https://app.example${pathname}`,nextUrl:new URL(`https://app.example${pathname}`),headers:new Headers()});
  assert.equal(photoReads,0);
  if(user){assert.equal(result.headers.get('link'),'</existing>; rel=preconnect');if(pathname==='/')assert.equal(result.headers.get('cache-control'),'private, no-store');}
  else assert.equal(result.status,307);
 }
});

test('Home HTML preload and first image expose the same single 640 candidate without a second base-only hint',async()=>{
 const url=smallFeedPhotoUrl(owner,post,media,'a'.repeat(32)),preloads=[],exports={};
 const source=readFileSync(new URL('../src/app/(tabs)/page.tsx',import.meta.url),'utf8')+'\nexport {HomeFirstPhoto,homeSeed};';
 vm.runInNewContext(compile(source),{exports,Date,Promise,Array,AbortSignal,setTimeout,clearTimeout,require(name){
 if(name==='next-intl')return englishIntl;
 if(name==='next-intl/server')return englishIntlServer;
 if(name==='@/i18n/format')return readingFormat;

  if(name==='react')return{cache:fn=>fn,Suspense:()=>null};
  if(name==='react-dom')return{preload:(href,options)=>preloads.push({href,...options})};
  if(name==='react/jsx-runtime')return{jsx:(type,props)=>typeof type==='function'?type(props):({type,props}),jsxs:(type,props)=>({type,props})};
  if(name==='@/lib/posts/feed-photo-url')return{feedPhotoSrcSet,firstPhotoSources};
  if(name==='@/components/Carousel')return{FirstPhoto:({url,alt})=>({type:'img',props:{...firstPhotoSources(url),crossOrigin:'anonymous',alt}})};
  if(name==='next/server')return{connection:async()=>{}};
  if(name==='next/headers')return{cookies:async()=>({get:()=>({value:'UTC'})}),headers:async()=>({get:()=>null})};
  if(name==='@/lib/auth/verified-user')return{verifiedUserId:async()=>owner};
  if(name==='@/lib/supabase/server')return{createClient:async()=>({})};
  if(name==='@/lib/posts/days')return{validZone:()=> 'UTC',dateInZone:()=> '2026-11-03',shiftDay:(_,step)=>String(step)};
  if(name==='@/lib/posts/feed')return{getFeed:async(_db,_owner,_cursor,_zone,_size,options)=>{options.onFirstPhoto(url);return{posts:[{id:post,caption:'Rice',eaten_at:'2026-11-03T10:00:00Z',photoUrl:url}],days:[],nextCursor:null};}};
  if(name==='@/lib/posts/home-today')return{readToday:async()=>({view:{date:'2026-11-03',posts:[],totals:{}},total:{day:'2026-11-03',kcal:0,ready:false,missing:[],known:0,posts:[]}})};
  if(name==='next/link'||name.startsWith('@/components/'))return{default:name};
  if(name==='@/lib/posts/today-view')return{};
  if(name==='@/lib/nutrition/totals')return{sumNutrition};
  throw Error(name);
 }});
 const tree=await exports.HomeFirstPhoto();
 function findImage(node){if(Array.isArray(node))return node.map(findImage).find(Boolean);if(node?.type==='img')return node.props;return node?.props?findImage(node.props.children):undefined;}
 const image=findImage(tree);assert.ok(image);
 assert.equal(image.src,firstPhotoSources(url).src);assert.equal(image.srcSet,firstPhotoSources(url).srcSet);
 assert.equal(image.srcSet,firstPhotoSources(url).src+' 1x','the first card has one candidate even on a dense display');
 assert.equal(preloads.length,2,'independent streams both describe the same responsive resource for React to deduplicate');
 for(const preload of preloads){assert.equal(preload.href,firstPhotoSources(url).src);assert.equal(preload.imageSrcSet,image.srcSet);assert.equal(preload.crossOrigin,image.crossOrigin);assert.equal(preload.as,'image');}
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
