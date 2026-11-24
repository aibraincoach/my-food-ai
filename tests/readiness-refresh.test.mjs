import {englishIntl,englishIntlServer} from './fixtures/english-intl.mjs';
import * as readingFormat from '../src/i18n/format.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {refreshAfterReadinessSeed,refreshAfterReady} from '../src/lib/posts/readiness-refresh.ts';
test('Home reconciliation avoids both redundant seed RSC refreshes; other tabs and absent feed still retry',()=>{
 assert.equal(refreshAfterReadinessSeed('/',true),false);
 assert.equal(refreshAfterReadinessSeed('/',false),true);
 assert.equal(refreshAfterReadinessSeed('/days',false),true);
 assert.equal(refreshAfterReadinessSeed('/profile',true),true);
});
test('ready metadata hydration does not refresh SSR; pending completion and unknown/real updates still do',()=>{
 assert.equal(refreshAfterReady(false,false,'ready'),false);
 assert.equal(refreshAfterReady(false,true,'ready'),true);
 assert.equal(refreshAfterReady(false,false,'queued'),true);
 assert.equal(refreshAfterReady(false,false,undefined),true);
 assert.equal(refreshAfterReady(true,false,'ready'),true);
});

test('mounted readiness observer skips initial Home reloads but still refreshes an observed completion and other tabs',async()=>{
 const vm=await import('node:vm'),ts=await import('typescript'),{readFileSync}=await import('node:fs');
 const code=ts.default.transpileModule(readFileSync(new URL('../src/components/PostReadinessListener.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.default.ModuleKind.CommonJS,target:ts.default.ScriptTarget.ES2022,jsx:ts.default.JsxEmit.ReactJSX}}).outputText;
 async function mount(home,shell=false){
  const events=new EventTarget(),document=Object.assign(new EventTarget(),{visibilityState:'visible',querySelector:selector=>selector==='[data-shell]'?(shell?{}:null):home?{}:null}),exports={};let effect,refreshes=0,pendingRows=[],subscribed,revalidations=0,day=null;const FakeDate=class extends Date{toDateString(){return day??super.toDateString();}};const timers=new Map();events.addEventListener('feed-revalidate',()=>revalidations++);
  const channel={on(){return this;},subscribe(fn){subscribed=fn;return this;}};
  const db={auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user:{id:'owner'}}}),getSession:async()=>({data:{session:{user:{id:'owner'}}}})},channel:()=>channel,removeChannel:async()=>{},from:()=>({select:()=>{
   const query={eq(){return this;},in:async()=>({data:pendingRows,error:null}),order(){return this;},limit:async()=>({data:[{id:'meal',status:'ready'}],error:null})};return query;
  }})};
  vm.default.runInNewContext(code,{exports,Map,Date:FakeDate,Promise,Event,CustomEvent,window:events,document,location:{pathname:home?'/':'/days'},setTimeout:(run)=>{timers.set(1,run);return 1;},clearTimeout:id=>timers.delete(id),require(name){if(name==='next-intl')return englishIntl;if(name==='next-intl/server')return englishIntlServer;if(name==='@/i18n/format')return readingFormat;
   if(name==='react')return{useEffect:run=>{effect=run;},useState:initial=>[initial,()=>{}]};
   if(name==='react/jsx-runtime')return{jsx:()=>null};
   if(name==='next/navigation')return{useRouter:()=>({refresh(){refreshes++;}})};
   if(name==='@/lib/supabase/client')return{createClient:()=>db};
   if(name==='@/lib/posts/readiness-refresh')return{refreshAfterReadinessSeed,refreshAfterReady};
   throw Error(name);
  }});
  exports.default();const cleanup=effect(),tick=()=>new Promise(resolve=>setImmediate(resolve));await tick();
  return{events,refreshes:()=>refreshes,revalidations:()=>revalidations,visible:()=>document.dispatchEvent(new Event('visibilitychange')),minute:()=>timers.get(1)(),setDay:value=>{day=value;},setPending:rows=>{pendingRows=rows;},reconnect:async()=>{subscribed('SUBSCRIBED');await tick();},cleanup,tick};
 }
 const home=await mount(true);assert.equal(home.refreshes(),0);await home.reconnect();assert.equal(home.refreshes(),0);
 home.events.dispatchEvent(new CustomEvent('post-ready',{detail:{id:'meal'}}));assert.equal(home.refreshes(),0);
 home.setPending([{id:'pending-meal'}]);await home.reconnect();
 home.events.dispatchEvent(new CustomEvent('post-ready',{detail:{id:'pending-meal'}}));assert.equal(home.refreshes(),1);home.cleanup();
 const other=await mount(false);assert.equal(other.refreshes(),1);await other.reconnect();assert.equal(other.refreshes(),2);other.visible();assert.equal(other.refreshes(),3);other.cleanup();
 const shell=await mount(true,true);assert.equal(shell.refreshes(),0);
 shell.visible();shell.minute();assert.equal(shell.revalidations(),0,'Home with only finished meals makes no minute or return-to-tab refresh');assert.equal(shell.refreshes(),0);
 shell.setPending([{id:'pending-shell-meal'}]);await shell.reconnect();
 shell.visible();shell.minute();assert.equal(shell.revalidations(),1,'a waiting meal refreshes on visibility, not the minute');shell.events.dispatchEvent(new CustomEvent('post-ready',{detail:{id:'pending-shell-meal'}}));
 assert.equal(shell.revalidations(),2);assert.equal(shell.refreshes(),0,'the active shell updates its API reader rather than replacing the page');
 shell.visible();shell.minute();assert.equal(shell.revalidations(),2,'once the meal is finished the refreshes stop again');
 shell.setDay('Tue Jan 02 2024');shell.minute();assert.equal(shell.revalidations(),3,'a new local day refreshes Home once');shell.minute();assert.equal(shell.revalidations(),3);shell.cleanup();
});
