// node --test tests/media-session.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import ts from 'typescript';
const OWNER='10000000-0000-4000-8000-000000000001',FIRST='30000000-0000-4000-8000-000000000003',SECOND='40000000-0000-4000-8000-000000000004';
const pure={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/lib/auth/media-session-epoch.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:pure,Date,atob});
const code=ts.transpileModule(fs.readFileSync(new URL('../src/lib/posts/media-session.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const session=(epoch=FIRST,claims={})=>({user:{id:OWNER},access_token:'header.'+Buffer.from(JSON.stringify({sub:OWNER,session_id:epoch,exp:Math.floor(Date.now()/1000)+3600,...claims})).toString('base64url')+'.private-signature'});
function client({images=[]}={}){
 const entries=new Map(),sent=[],warmFetches=[];let current=session(),receive,subscriptions=0,unsubscribes=0;
 const workerEvents=new Map(),windowEvents=new Map();const exported={};
 vm.runInNewContext(code,{exports:exported,Date,atob,queueMicrotask,URL,location:{href:'https://app.example/'},setTimeout,clearTimeout,
  document:{images,addEventListener(){},removeEventListener(){}},
  fetch:async(url,init)=>{warmFetches.push({url:String(url),init});return{ok:true,arrayBuffer:async()=>new ArrayBuffer(0)};},
  MessageChannel:class{constructor(){this.port1={onmessage:null,close(){}};this.port2={postMessage:data=>this.port1.onmessage?.({data}),close(){}};}},
  localStorage:{getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)},
  navigator:{serviceWorker:{controller:{postMessage:(data,ports)=>{sent.push(data);if(data.type==='media-session')queueMicrotask(()=>ports?.[0]?.postMessage({type:'media-session-accepted'}));}},addEventListener:(name,fn)=>workerEvents.set(name,fn),removeEventListener:name=>workerEvents.delete(name)}},
  window:{addEventListener:(name,fn)=>windowEvents.set(name,fn),removeEventListener:name=>windowEvents.delete(name)},
  require(name){if(name==='@/lib/auth/media-session-epoch')return pure;assert.equal(name,'@/lib/supabase/client');return{createClient:()=>({auth:{getSession:async()=>({data:{session:current}}),onAuthStateChange(fn){subscriptions++;receive=fn;return{data:{subscription:{unsubscribe(){unsubscribes++;}}}};}}})};}
 });
 return{api:exported,entries,sent,warmFetches,get subscriptions(){return subscriptions;},get unsubscribes(){return unsubscribes;},setSession(value){current=value;},auth(event,value){current=value;receive(event,value);},async turn(){await new Promise(resolve=>setImmediate(resolve));},controller(){workerEvents.get('controllerchange')?.();}};
}
test('session identity requires an unexpired matching sub/session UUID and never returns the JWT',()=>{
 const c=client(),valid=session();assert.deepEqual(JSON.parse(JSON.stringify(c.api.mediaSessionEpoch(valid))),{epoch:FIRST,userId:OWNER});
 for(const invalid of [null,session('not-uuid'),session(FIRST,{sub:SECOND}),session(FIRST,{exp:1}),{user:{id:OWNER},access_token:'malformed'}])assert.equal(c.api.mediaSessionEpoch(invalid),null);
 assert.equal(JSON.stringify(c.api.mediaSessionEpoch(valid)).includes(valid.access_token),false);
});
test('overlapping feed/profile boundaries share one listener and logout blocks the old initial session',async()=>{
 const c=client(),leaveA=c.api.connectMediaSession(),leaveB=c.api.connectMediaSession();await c.turn();
 assert.equal(c.subscriptions,1);assert.equal(c.api.activeMediaUserId(),OWNER);
 const privacy=c.api.blockMediaSession();assert.ok(privacy.blocked.includes(FIRST));assert.equal(c.api.activeMediaUserId(),null);
 c.auth('INITIAL_SESSION',session());assert.equal(c.sent.at(-1).transition,'INITIAL_SESSION');assert.ok(c.sent.at(-1).blocked.includes(FIRST));
 c.auth('SIGNED_IN',session());assert.ok(c.sent.at(-1).blocked.includes(FIRST),'a repeated SIGNED_IN cannot erase the worker tombstone');
 leaveA();assert.equal(c.unsubscribes,0);leaveB();assert.equal(c.unsubscribes,1);
 assert.ok(c.sent.every(data=>!JSON.stringify(data).includes('private-signature')));
});
test('a genuinely new server-cookie session is distinguished from an old INITIAL_SESSION',async()=>{
 const c=client(),leave=c.api.connectMediaSession();await c.turn();c.api.blockMediaSession();
 c.auth('INITIAL_SESSION',session(SECOND));assert.equal(c.sent.at(-1).transition,'NEW_SESSION');assert.equal(c.sent.at(-1).epoch,SECOND);assert.equal(c.api.activeMediaUserId(),OWNER);leave();
});
test('SIGNED_OUT preserves the known blocked UUID instead of losing it with the null session',async()=>{
 const c=client(),leave=c.api.connectMediaSession();await c.turn();c.auth('SIGNED_OUT',null);
 assert.equal(c.sent.at(-1).type,'clear-media');assert.equal(c.sent.at(-1).epoch,FIRST);assert.equal(c.sent.at(-1).locked,false);assert.equal(c.api.activeMediaUserId(),null);leave();
});
test('controller replacement rereads shared logout history instead of replaying a stale activation',async()=>{
 const c=client(),leave=c.api.connectMediaSession();await c.turn();
 c.entries.set('mfa-media-blocked-sessions-v1',JSON.stringify({blocked:[FIRST],locked:false}));c.controller();await c.turn();
 assert.equal(c.sent.at(-1).transition,'INITIAL_SESSION');assert.ok(c.sent.at(-1).blocked.includes(FIRST));leave();
});

test('a newly controlling worker warms a photo already loaded before installation, without sending tokens',async()=>{
 const url=`https://storage.example/storage/v1/object/sign/media/${OWNER}/post/photo.feed.jpg?token=photo-capability`;
 const c=client({images:[{complete:true,naturalWidth:1080,currentSrc:url}]}),leave=c.api.connectMediaSession();await c.turn();await c.turn();
 assert.equal(c.warmFetches.length,1);assert.equal(c.warmFetches[0].init.cache,'force-cache');assert.equal(c.warmFetches[0].init.credentials,'omit');assert.equal(c.warmFetches[0].init.mode,'cors');
 assert.ok(c.sent.every(message=>!JSON.stringify(message).includes('photo-capability')),'the signed URL stays in its authenticated fetch, not control messages');leave();
});
test('resized photos warm only exact owned same-origin routes and retain cookie authentication',async()=>{
 const url=`https://app.example/api/media/feed/${OWNER}/${FIRST}/${SECOND}/v1.webp`;
 const invalid=[url.replace('app.example','foreign.example'),url.replace(OWNER,SECOND),url+'?token=alias',url.replace(FIRST,'bad-post'),url.replace(SECOND,'bad-media'),url+'/',url.replace('/v1.webp','/v2.webp')];
 const c=client({images:[url,...invalid].map(currentSrc=>({complete:true,naturalWidth:640,currentSrc}))}),leave=c.api.connectMediaSession();await c.turn();await c.turn();
 assert.equal(c.warmFetches.length,1);assert.equal(c.warmFetches[0].url,url);assert.equal(c.warmFetches[0].init.credentials,'same-origin');assert.equal(c.warmFetches[0].init.mode,'cors');assert.equal(c.warmFetches[0].init.cache,'force-cache');
 c.auth('SIGNED_OUT',null);c.controller();await c.turn();assert.equal(c.warmFetches.length,1);leave();
});
