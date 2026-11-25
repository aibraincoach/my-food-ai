// Public access must retain the authenticated route's source byte/deadline protections.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as photo from '../src/lib/posts/feed-photo.ts';
const id='11111111-1111-4111-8111-111111111111',secret='a'.repeat(32);
const source=ts.transpileModule(readFileSync(new URL('../src/app/p/[file]/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function route(fetchSource,{expire=false}={}){
 const signals=[],deadlines=[],releases=[],transforms=[],fetches=[];
 const timer=new AbortController(),controller=new AbortController();
 const exports={};
 const db=signal=>({from(table){return{select(){return this;},eq(){return this;},async maybeSingle(){return{data:table==='posts'?{deleted_at:null}:{post_id:id,storage_path:`${id}/meal/0.jpg`,kind:'photo',photo_secret:secret}};}};},storage:{from:()=>({createSignedUrl:async()=>{assert.equal(signal.aborted,false,'fallback gets a fresh deadline');return{data:{signedUrl:'https://storage.fixture/original'}};}})}});
 vm.runInNewContext(source,{exports,Response,Request,URL,Uint8Array,Buffer,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://storage.fixture',SUPABASE_SECRET_KEY:'fixture-service-role'}},AbortSignal:{any:AbortSignal.any,timeout(ms){deadlines.push(ms);return ms===6000?timer.signal:AbortSignal.timeout(ms);}},fetch:async(url,options)=>{fetches.push({url,options});if(expire)timer.abort();return fetchSource(url,options);},require(name){if(name==='@/lib/supabase/admin')return{createAdminClient:signal=>{signals.push(signal);return db(signal);}};if(name==='@/lib/posts/feed-photo')return{...photo,reserveFeedPhoto:()=>()=>releases.push(true),resizeSharpPhoto:async bytes=>{transforms.push(bytes.length);return Buffer.from('webp');}};throw Error(name);}});
 return{signals,deadlines,releases,transforms,fetches,controller,get:()=>exports.GET(new Request(`https://app.fixture/p/${id}_${secret}_640.webp`,{signal:controller.signal}),{params:Promise.resolve({file:`${id}_${secret}_640.webp`})})};
}
test('public photo uses the shared eight-MiB reader and returns cacheable output for a valid source',async()=>{
 const r=route(async()=>new Response(new Uint8Array([255,216,255,1]))),res=await r.get();assert.equal(res.status,200);assert.equal(res.headers.get('content-type'),'image/webp');assert.deepEqual(r.transforms,[4]);assert.equal(r.releases.length,1);assert.deepEqual(r.deadlines,[6000]);assert.equal(r.fetches[0].options.signal,r.signals[0]);assert.equal(r.fetches[0].options.redirect,'error');
});
for(const declared of [true,false])test(`oversized ${declared?'declared':'streamed'} source is cancelled before resizing and returns visible no-store failure`,async()=>{
 let cancelled=false;
 const r=route(async()=>new Response(new ReadableStream({pull(controller){controller.enqueue(new Uint8Array(photo.MAX_ORIGINAL_SOURCE_BYTES+1));},cancel(){cancelled=true;}}),{headers:declared?{'content-length':String(photo.MAX_ORIGINAL_SOURCE_BYTES+1)}:{}}));
 const res=await r.get();assert.equal(res.status,503);assert.equal(res.headers.get('cache-control'),'no-store');assert.equal(res.headers.get('location'),null);assert.equal(cancelled,true);assert.deepEqual(r.transforms,[]);assert.equal(r.releases.length,1);assert.deepEqual(r.deadlines,[6000]);
});
for(const mode of ['deadline','disconnect'])test(`${mode} cancels the source fetch and releases the reservation`,async()=>{
 const r=route(async(_url,{signal})=>{if(mode==='disconnect')r.controller.abort();assert.equal(signal.aborted,true);throw signal.reason;},{expire:mode==='deadline'});
 const res=await r.get();assert.equal(res.status,503);assert.equal(res.headers.get('location'),null);assert.equal(res.headers.get('cache-control'),'no-store');assert.equal(r.releases.length,1);assert.deepEqual(r.transforms,[]);assert.equal(r.signals.length,1);
});
