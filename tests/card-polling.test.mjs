import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {readPendingItems} from '../src/lib/pipeline/pending-items.ts';
import {hasUnavailableFields,retainCompleteItems} from '../src/lib/posts/feed.ts';

// Run the real component's effects against a clock and a counted data source.
// No React DOM/layout snapshots; this checks its network/resource behavior.
function harness(status, hidden = false, fields = {}) {
  let now = 1000, reads = 0, gone = false;const retired=[];
  const effects = [], timers = new Map(), refs = [];let timerId = 0;
  const doc = Object.assign(new EventTarget(), { visibilityState: hidden ? 'hidden' : 'visible', hidden });
  const events=new EventTarget();events.addEventListener('post-unavailable',event=>retired.push(event));
  const post = { id: 'meal', status, items: [{id:'rice'}], slides: [], ...fields };
  const exports = {};
  const code=ts.transpileModule(readFileSync(new URL('../src/components/RealtimePost.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code, {exports, Date:class extends Date {static now(){return now;}}, document:doc,
    window:events, CustomEvent,
    AbortSignal,setTimeout:(cb,ms=0)=>{timers.set(++timerId,{at:now+ms,cb});return timerId;},clearTimeout:id=>{timers.delete(id);},
    require(name){
      if(name==='react')return {useState:initial=>[initial,()=>{}],useRef:initial=>{const ref={current:initial};refs.push(ref);return ref;},useEffect:fn=>effects.push(fn)};
      if(name==='react/jsx-runtime')return {jsx:()=>null,Fragment:()=>null};
      if(name==='@/lib/supabase/client')return {createClient:()=>({channel:()=>{throw Error('#1095: a card opens no Realtime channel of its own');},removeChannel(){},from(){const q={select(){return q},eq(){return q},abortSignal(){return q},async maybeSingle(){return{data:{pending_items:[]},error:null}}};return q;}})};
      if(name==='@/lib/pipeline/pending-items')return{readPendingItems};
      if(name==='@/lib/posts/feed')return {hasUnavailableFields,retainCompleteItems,isSettled:s=>!['queued','processing','needs_input'].includes(s),getPostCard:async()=>{reads++;return gone?null:post;}};
      throw Error(name);
    }});
  exports.default({initial:post,renderCard:()=>null});
  const cleanups=effects.map(fn=>fn());
  return {doc,post,retired,focus:()=>events.dispatchEvent(new Event('focus')),remove:()=>{gone=true;events.dispatchEvent(new Event('focus'));},reads:()=>reads,update:()=>events.dispatchEvent(new CustomEvent('post-readiness',{detail:{id:post.id}})),other:()=>events.dispatchEvent(new CustomEvent('post-readiness',{detail:{id:'another-meal'}})),async tick(ms){now+=ms;for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.cb();}await new Promise(resolve=>setImmediate(resolve));},cleanup(){for(const fn of cleanups)fn?.();}};
}
test('missing optional cards make no timed reads; the tab event for this meal makes one (#1095)',async()=>{
 const h=harness('ready');await h.tick(0);const initial=h.reads();assert.equal(initial,1);
 for(let i=0;i<300;i++)await h.tick(2000);assert.equal(h.reads(),initial,'ten idle minutes add no reads');
 h.other();await h.tick(0);assert.equal(h.reads(),initial,'another meal\'s event makes no read');
 h.update();await h.tick(0);assert.equal(h.reads(),initial+1);h.cleanup();
});
test('hidden pages make no reads and active analysis waits for an event or focus',async()=>{
 const hidden=harness('ready',true);await hidden.tick(600000);assert.equal(hidden.reads(),0);hidden.cleanup();
 const active=harness('processing');await active.tick(0);const initial=active.reads();await active.tick(600000);assert.equal(active.reads(),initial);active.focus();await active.tick(0);assert.equal(active.reads(),initial+1);active.cleanup();
});

test('clarification and deleted meals retire instead of polling invisibly; a deletion is found by the read on return (#1095)',async()=>{
 const h=harness('processing');await Promise.resolve();h.post.status='needs_input';h.update();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(h.retired.at(-1).type,'post-unavailable');assert.equal(h.retired.at(-1).detail.reason,'needs_input');
 const reads=h.reads();for(let i=0;i<20;i++)await h.tick(2000);assert.equal(h.reads(),reads);h.cleanup();
 const deleted=harness('processing');await Promise.resolve();deleted.remove();await deleted.tick(0);const before=deleted.reads();await deleted.tick(2000);assert.equal(deleted.reads(),before);assert.equal(deleted.retired.at(-1).detail.reason,'deleted');deleted.cleanup();
});

test('complete server cards skip the mount read; an unavailable revision waits for focus',async()=>{
 const complete={slides:[{kind:'card',url:'card'}],analysisFingerprint:'stable'};
 const good=harness('ready',false,complete);await good.tick(15000);assert.equal(good.reads(),0,'complete ready seed has no mount read or poll');good.update();await Promise.resolve();assert.equal(good.reads(),1,'database changes still refresh');good.cleanup();
 const raced=harness('ready',false,{...complete,analysisFingerprint:null,revisionUnavailable:true});await Promise.resolve();assert.equal(raced.reads(),1,'inconsistent revision is read on mount');await raced.tick(600000);assert.equal(raced.reads(),1,'no timer retries an inconsistent seed');raced.focus();await raced.tick(0);assert.equal(raced.reads(),2,'focus requests one repair');raced.cleanup();
 const empty=harness('ready',false,{items:[],slides:[],analysisFingerprint:null});await empty.tick(15000);assert.equal(empty.reads(),0,'a genuinely empty complete meal is not made to poll');empty.cleanup();
});
