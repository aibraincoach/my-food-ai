import test from 'node:test';import assert from 'node:assert/strict';
import vm from 'node:vm';import ts from 'typescript';import {readFileSync} from 'node:fs';
import {tabReturnModule,returnToTab} from './fixtures/tab-return-module.mjs';
import {refreshAfterReadinessSeed,refreshAfterReady,staleView} from '../src/lib/posts/readiness-refresh.ts';
const compiled=ts.transpileModule(readFileSync(new URL('../src/components/PostReadinessListener.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const at='2026-11-26T00:00:00+00:00',row=(id,status='ready',created_at=at)=>({id,status,created_at});
async function mount({rendered=[],latest=[],pending=[],seedFailed=false,complete=true,streamed=false}={}){
 let effect,subscribe,refreshes=0,markerPresent=!streamed;const events=new EventTarget(),timers=new Map();
 const list={querySelectorAll:()=>rendered.map(p=>({dataset:{postId:p.id,postStatus:p.status,postCreated:p.created_at}}))};
 const document=Object.assign(new EventTarget(),{visibilityState:'visible',readyState:streamed?'loading':'complete',querySelector:s=>s==='[data-lists-all]'&&complete&&markerPresent?list:null});
 const channel={on(){return this;},subscribe(fn){subscribe=fn;return this;}};
 const db={auth:{getSession:async()=>({data:{session:{user:{id:'owner'}}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},channel:()=>channel,removeChannel(){},from(){let selection,ids=false;const query={select(s){selection=s;return query;},eq(){return query;},is(){return query;},order(){return query;},limit(){return query;},in(column){ids=column==='id';return query;},then(resolve){const data=ids?latest.filter(p=>pending.includes(p.id)):selection==='id'?pending.map(id=>({id})):latest;return Promise.resolve({data,error:selection==='id'&&seedFailed?{message:'seed failed'}:null}).then(resolve);}};return query;}};
 const exports={};vm.runInNewContext(compiled,{exports,Map,Set,Promise,Date,Event,CustomEvent,window:events,document,location:{pathname:complete?'/profile':'/days'},setTimeout:fn=>{timers.set(1,fn);return 1;},clearTimeout:id=>timers.delete(id),require(name){if(name==='react')return{useEffect:fn=>{effect=fn;},useState:v=>[v,()=>{}]};if(name==='react/jsx-runtime')return{jsx:()=>null};if(name==='next-intl')return{useTranslations:()=>key=>key};if(name==='next/navigation')return{useRouter:()=>({refresh(){refreshes++;}})};if(name==='@/lib/client/tab-return')return tabReturnModule(events,document);if(name==='@/lib/posts/readiness-refresh')return{refreshAfterReadinessSeed,refreshAfterReady,staleView};if(name==='@/lib/supabase/client')return{createClient:()=>db};throw Error(name);}});
 exports.default();const cleanup=effect(),flush=()=>new Promise(resolve=>setImmediate(resolve));await flush();return{cleanup,async load(){markerPresent=true;document.readyState='complete';events.dispatchEvent(new Event('load'));await flush();},refreshes:()=>refreshes,async connect(){subscribe('SUBSCRIBED');await flush();},async return(){returnToTab(document);await flush();await flush();}};
}
test('a complete Profile has no unchanged mount, subscription, or return refresh, including a still-pending meal',async()=>{
 for(const status of ['ready','processing']){const posts=[row('a',status)],app=await mount({rendered:posts,latest:posts,pending:status==='processing'?['a']:[]});try{assert.equal(app.refreshes(),0);await app.connect();assert.equal(app.refreshes(),0);await app.return();assert.equal(app.refreshes(),0);}finally{app.cleanup();}}
});
test('seed and discovery coalesce a ready-before-subscribe gap into one rendered-view refresh',async()=>{
 const app=await mount({rendered:[row('a','processing')],latest:[row('a')],pending:[]});try{assert.equal(app.refreshes(),1);await app.connect();assert.equal(app.refreshes(),1,'first subscription does not repeat the same stale snapshot');}finally{app.cleanup();}
});
test('the successful pending seed catches a settlement older than the latest window, but a failed seed does not infer it',async()=>{
 const latest=Array.from({length:20},(_,i)=>row(String(100-i))),old=row('old','processing','2025-01-01T00:00:00+00:00');
 for(const seedFailed of[false,true]){const app=await mount({rendered:[...latest,old],latest,seedFailed});try{assert.equal(app.refreshes(),seedFailed?0:1);await app.connect();assert.equal(app.refreshes(),seedFailed?0:1);}finally{app.cleanup();}}
});
test('an empty complete listing catches its first new post; Days retains its initial refresh',async()=>{
 const profile=await mount({latest:[row('new')]});try{assert.equal(profile.refreshes(),1);}finally{profile.cleanup();}
 const days=await mount({complete:false});try{assert.equal(days.refreshes(),1);await days.connect();assert.equal(days.refreshes(),2,'original first-subscribe gap reconciliation remains');}finally{days.cleanup();}
});

test('a slow streamed complete-list waits for load, then compares once; cleanup removes the load decision',async()=>{
 const app=await mount({rendered:[row('a')],latest:[row('a')],streamed:true});
 try{assert.equal(app.refreshes(),0,'no premature legacy refresh while the marker has not streamed');await app.load();assert.equal(app.refreshes(),0,'unchanged streamed Profile stays current');}finally{app.cleanup();}
 const stale=await mount({rendered:[row('a','processing')],latest:[row('a')],streamed:true});
 try{assert.equal(stale.refreshes(),0);await stale.load();assert.equal(stale.refreshes(),1,'ready gap still settles after the stream arrives');}finally{stale.cleanup();}
 const removed=await mount({rendered:[row('a','processing')],latest:[row('a')],streamed:true});removed.cleanup();await removed.load();assert.equal(removed.refreshes(),0);
});
