import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Run the real component's effects against a clock and a counted data source.
// No React DOM/layout snapshots; this checks its network/resource behavior.
function harness(status, hidden = false) {
  let now = 1000, reads = 0, update;
  const effects = [], intervals = [], refs = [];
  const doc = { visibilityState: hidden ? 'hidden' : 'visible', addEventListener() {}, removeEventListener() {} };
  const post = { id: 'meal', status, items: [{id:'rice'}], slides: [] };
  const channel = { on(_name,_filter,cb) { update=cb;return this; }, subscribe() {return this;} };
  const exports = {};
  const code=ts.transpileModule(readFileSync(new URL('../src/components/RealtimePost.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code, {exports, Date:class extends Date {static now(){return now;}}, document:doc,
    window:{dispatchEvent(){},addEventListener(){},removeEventListener(){}}, CustomEvent:class {},
    setInterval:cb=>{intervals.push(cb);return cb;},clearInterval(){},
    require(name){
      if(name==='react')return {useState:initial=>[initial,()=>{}],useRef:initial=>{const ref={current:initial};refs.push(ref);return ref;},useEffect:fn=>effects.push(fn)};
      if(name==='react/jsx-runtime')return {jsx:()=>null,Fragment:()=>null};
      if(name==='@/lib/supabase/client')return {createClient:()=>({channel:()=>channel,removeChannel(){}})};
      if(name==='@/lib/posts/feed')return {isSettled:s=>!['queued','processing','needs_input'].includes(s),getPostCard:async()=>{reads++;return post;}};
      throw Error(name);
    }});
  exports.default({initial:post,renderCard:()=>null});
  const cleanups=effects.map(fn=>fn());
  return {doc,reads:()=>reads,update:()=>update(),async tick(ms){now+=ms;for(const cb of intervals)cb();await Promise.resolve();await Promise.resolve();},cleanup(){for(const fn of cleanups)fn?.();}};
}
test('missing optional cards back off and stop automatic hydration, but realtime still updates',async()=>{
 const h=harness('ready');
 for(let i=0;i<300;i++)await h.tick(2000);
 assert.ok(h.reads()<30,`expected bounded reads, received ${h.reads()}`);
 const stopped=h.reads();await h.tick(120000);assert.equal(h.reads(),stopped);
 h.update();await Promise.resolve();assert.equal(h.reads(),stopped+1,'late realtime publication remains live');h.cleanup();
});
test('hidden pages make no reads; active analysis retains two-second fallback',async()=>{
 const hidden=harness('ready',true);for(let i=0;i<30;i++)await hidden.tick(2000);assert.equal(hidden.reads(),0);hidden.cleanup();
 const active=harness('processing');await Promise.resolve();for(let i=0;i<5;i++)await active.tick(2000);assert.ok(active.reads()>=5);active.cleanup();
});
