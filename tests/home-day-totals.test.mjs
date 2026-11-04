// node --import tsx --test tests/home-day-totals.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';
import { getFeed } from '../src/lib/posts/feed.ts';

const owner='00000000-0000-4000-8000-000000000001';

test('parallel Home streams share one totals read and pass that snapshot into Feed',async()=>{
  const days=[{day:'2026-11-03',kcal:300,ready:true}];
  let totalCalls=0,authCalls=0;
  const source=readFileSync(new URL('../src/app/(tabs)/page.tsx',import.meta.url),'utf8')+'\nexport {HomeDays,HomeFeed};';
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};
  vm.runInNewContext(code,{exports,Date,Promise,Array,Boolean,AbortSignal,setTimeout,clearTimeout,console,require(name){
    if(name==='react')return {cache(fn){let promise;return()=>promise??=fn();},Suspense:()=>null};
    if(name==='react/jsx-runtime')return{jsx:(component,props)=>({component,props}),jsxs:(component,props)=>({component,props})};
    if(name==='@/lib/posts/feed-photo-url')return{feedPhotoSrcSet:()=>undefined};
    if(name==='react-dom')return{preload(){}};
    if(name==='next/server')return{connection:async()=>{}};
    if(name==='next/headers')return{cookies:async()=>({get:()=>({value:'UTC'})}),headers:async()=>({get:()=>null})};
    if(name==='@/lib/posts/home-today')return{homeToday:async()=>({date:'2026-11-03',posts:[],totals:{}})};
    if(name==='@/lib/auth/verified-user')return{verifiedUserId:async()=>owner};
    if(name==='@/lib/supabase/server')return{createClient:async()=>({auth:{getUser:async()=>{authCalls++;throw Error('second Auth read');}}})};
    if(name==='@/lib/posts/days')return{validZone:()=> 'UTC',dateInZone:()=> '2026-11-03',shiftDay:(_,n)=>String(n),getEarliestPostDate:async()=>null,getLoggedDates:async()=>[],getDayTotals:async()=>{totalCalls++;await new Promise(resolve=>setImmediate(resolve));return days;}};
    if(name==='@/lib/nutrition/totals')return{sumNutrition:()=>({})};
    if(name==='@/lib/posts/feed')return{getFeed:async()=>({posts:[],days:[],nextCursor:null})};
    if(name==='next/link'||name.startsWith('@/components/'))return{default:name};
    throw Error(name);
  }});
  const [rings,feed]=await Promise.all([exports.HomeDays(),exports.HomeFeed()]);
  assert.equal(totalCalls,1);
  assert.equal(authCalls,0,'verified middleware identity avoids a second server Auth call');
  assert.deepEqual(rings.props.totals,days);
  assert.deepEqual(Array.from(feed.props.children.props.initialPage.days),days);
});

test('Home feed and Today each perform one read per render',async()=>{
  let feedCalls=0,todayCalls=0;
  const source=readFileSync(new URL('../src/app/(tabs)/page.tsx',import.meta.url),'utf8')+'\nexport {HomeFeed,HomeToday};';
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};
  vm.runInNewContext(code,{exports,Date,Promise,Array,Boolean,AbortSignal,setTimeout,clearTimeout,console,require(name){
    if(name==='react')return {cache(fn){let promise;return()=>promise??=fn();},Suspense:()=>null};
    if(name==='react/jsx-runtime')return{jsx:(component,props)=>({component,props}),jsxs:(component,props)=>({component,props})};
    if(name==='@/lib/posts/feed-photo-url')return{feedPhotoSrcSet:()=>undefined};
    if(name==='react-dom')return{preload(){}};
    if(name==='next/server')return{connection:async()=>{}};
    if(name==='next/headers')return{cookies:async()=>({get:()=>({value:'UTC'})}),headers:async()=>({get:()=>null})};
    if(name==='@/lib/auth/verified-user')return{verifiedUserId:async()=>owner};
    if(name==='@/lib/supabase/server')return{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:owner}}})}})};
    if(name==='@/lib/posts/days')return{validZone:()=> 'UTC',dateInZone:()=> '2026-11-03',shiftDay:(_,n)=>String(n),getDayTotals:async()=>[]};
    if(name==='@/lib/posts/home-today')return{homeToday:async()=>{todayCalls++;return {date:'2026-11-03',posts:[],totals:{}};}};
    if(name==='@/lib/posts/feed')return{getFeed:async()=>{feedCalls++;return {posts:[],days:[],nextCursor:null};}};
    if(name==='next/link'||name.startsWith('@/components/'))return{default:name};
    throw Error(name);
  }});
  await Promise.all([exports.HomeFeed(),exports.HomeToday()]);
  assert.equal(feedCalls,1);
  assert.equal(todayCalls,1);
});

test('feed refresh skips known days without removing meal or hydration reads; missing dates still load',async()=>{
  const rows=[{id:owner,user_id:owner,eaten_at:'2026-11-03T10:00:00Z',created_at:'2026-11-03T10:00:00Z',caption:'Rice',status:'queued'}];
  const calls=[];
  const db=createClient('https://fixture.invalid','fixture-key',{global:{fetch:async input=>{
    const u=new URL(String(input instanceof Request?input.url:input));calls.push(u);
    if(u.pathname.endsWith('/posts')&&u.searchParams.get('status')==='neq.needs_input')return Response.json(rows);
    return Response.json([]);
  }}});
  const known=await getFeed(db,owner,null,'UTC',6,{knownDays:['2026-11-03']});
  const dayReads=()=>calls.filter(u=>u.pathname.endsWith('/posts')&&u.searchParams.get('select')?.includes('current_post_items(name,portion_grams'));
  assert.equal(known.posts.length,1);
  assert.deepEqual(known.days,[]);
  assert.equal(dayReads().length,0);
  assert.ok(calls.some(u=>u.pathname.endsWith('/intake_logs')),'hydration is still refreshed');
  calls.length=0;
  const missing=await getFeed(db,owner,null,'UTC',6,{knownDays:['2026-11-02']});
  assert.equal(dayReads().length,1);
  assert.equal(missing.days[0].day,'2026-11-03');
});

test('feed API validates the known-date boundary and retains its independent Auth check',async()=>{
  const source=readFileSync(new URL('../src/app/api/feed/route.ts',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  let authCalls=0,readCalls=0,options;
  const exports={};
  vm.runInNewContext(code,{exports,Date,Promise,URL,Set,Number,AbortSignal,setTimeout,clearTimeout,console,require(name){
    if(name==='next/server')return{NextResponse:{json:(body,init)=>Response.json(body,init)}};
    if(name==='next/headers')return{cookies:async()=>({get:()=>({value:'UTC'})}),headers:async()=>({get:()=>null})};
    if(name==='@/lib/posts/home-today')return{homeToday:async()=>({date:'2026-11-03',posts:[],totals:{}})};
    if(name==='@/lib/supabase/server')return{createClient:async()=>({auth:{getUser:async()=>{authCalls++;return{data:{user:{id:owner}},error:null};}}})};
    if(name==='@/lib/posts/days')return{validZone:()=> 'UTC',validDate:day=>/^2026-11-0[1-3]$/.test(day)};
    if(name==='@/lib/posts/feed')return{FEED_PAGE_SIZE:20,getFeed:async(...args)=>{readCalls++;options=args[5];return{posts:[],days:[],nextCursor:null};}};
    if(name==='@/lib/posts/feed-cursor')return{};
    throw Error(name);
  }});
  const valid=await exports.GET(new Request('https://app.invalid/api/feed?known_days=2026-11-03,2026-11-03'));
  assert.equal(valid.status,200);
  assert.deepEqual([...options.knownDays],['2026-11-03']);
  const invalid=await exports.GET(new Request('https://app.invalid/api/feed?known_days=2026-02-30'));
  assert.equal(invalid.status,400);
  assert.equal(readCalls,1);
  assert.equal(authCalls,2,'API auth is never skipped based on a page header or known dates');
});
