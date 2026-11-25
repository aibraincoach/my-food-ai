import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {englishIntl} from './fixtures/english-intl.mjs';
function fixture(hint,{seen=[],deferRead=false,failSave=false}={}) {
 let release;const pending=new Promise(resolve=>{release=resolve});
 const refs=[],effects=[],states=[],saved=[],documentListeners=new Map(),windowListeners=new Map();
 const events=map=>({addEventListener:(name,fn)=>map.set(name,fn),removeEventListener:(name,fn)=>{if(map.get(name)===fn)map.delete(name);}});
 const exports={};
 const path=process.env.HINT_SOURCE??new URL('../src/components/FirstRunHint.tsx',import.meta.url);
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
 assert.equal(code.diagnostics?.length??0,0);
 const db={auth:{getSession:async()=>({data:{session:{user:{id:'local-fixture'}}}})},from:()=>({select:()=>({eq:()=>({single:async()=>{if(deferRead)await pending;return{data:{hints_seen:seen},error:null};}})})})};
 vm.runInNewContext(code.outputText,{exports,document:events(documentListeners),window:events(windowListeners),require:name=>{
  if(name==='next-intl')return englishIntl;
  if(name==='react')return{useRef:value=>{const ref={current:value};refs.push(ref);return ref;},useState:value=>[value,next=>states.push(next)],useEffect:fn=>effects.push(fn)};
  if(name==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name==='@/lib/profile/hints')return{dismissHint:async key=>{saved.push(key);if(failSave)throw Error('save rejected');}};
  if(name==='@/lib/supabase/client')return{createClient:()=>db};
  if(name==='@/components/ui/Tooltip')return{Tooltip:'tooltip'};throw Error(name);
 }});
 const mount=()=>{const start=effects.length;exports.default({hint});const cleanups=effects.slice(start).map(effect=>effect());return()=>cleanups.forEach(fn=>fn?.());};
 const cleanup=mount();
 return {documentListeners,windowListeners,states,saved,cleanup,release,dismiss:()=>refs[0].current(),remount:mount};
}
for(const hint of ['capture','thread','thumbs'])test(`${hint} waits for click, preserves first interaction, saves once and retains keyboard dismissal`,async()=>{
 const f=fixture(hint);await new Promise(resolve=>setImmediate(resolve));assert.ok(f.states.includes(true));
 assert.equal(f.documentListeners.has('pointerdown'),false,'never collapse layout between finger-down and click');
 assert.equal(f.documentListeners.has('click'),true);
 f.documentListeners.get('click')();f.documentListeners.get('click')();await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(f.saved,[hint]);assert.equal(f.states.at(-1),false);
 f.cleanup();assert.equal(f.documentListeners.size,0);
 const keyboard=fixture(hint);await new Promise(resolve=>setImmediate(resolve));keyboard.documentListeners.get('keydown')();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(keyboard.saved,[hint]);keyboard.cleanup();
});
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('shown modes tip saves exactly once on cleanup without an input listener',async()=>{
 const f=fixture('modes');await settle();assert.ok(f.states.includes(true));assert.equal(f.documentListeners.size,0);assert.equal(f.windowListeners.size,0);
 f.cleanup();await settle();assert.deepEqual(f.saved,['modes']);f.cleanup();await settle();assert.deepEqual(f.saved,['modes']);
});
test('modes tip cleaned up before its profile read resolves saves nothing',async()=>{
 const f=fixture('modes',{deferRead:true});f.cleanup();f.release();await settle();assert.equal(f.states.includes(true),false);assert.deepEqual(f.saved,[]);
});
for(const hint of ['capture','thread','thumbs'])test(`${hint} undismissed cleanup saves nothing and releases its claim`,async()=>{
 const f=fixture(hint);await settle();f.cleanup();await settle();assert.deepEqual(f.saved,[]);assert.equal(f.documentListeners.size,0);
 const before=f.states.filter(Boolean).length,close=f.remount();await settle();assert.equal(f.states.filter(Boolean).length,before+1);close();
});
test('Got it saves once with no second save on modes unmount',async()=>{
 const f=fixture('modes');await settle();f.dismiss();await settle();f.cleanup();await settle();assert.deepEqual(f.saved,['modes']);
});
test('already seen modes tip never shows and adds no save',async()=>{
 const f=fixture('modes',{seen:['modes']});await settle();f.cleanup();await settle();assert.equal(f.states.includes(true),false);assert.deepEqual(f.saved,[]);
});
for(const hint of ['capture','thread','thumbs','modes'])test(`${hint} rejected save is not retried and releases the optimistic seen mark and claim`,async()=>{
 const f=fixture(hint,{failSave:true});await settle();f.dismiss();await settle();f.cleanup();await settle();assert.deepEqual(f.saved,[hint]);
 const before=f.states.filter(Boolean).length,close=f.remount();await settle();assert.equal(f.states.filter(Boolean).length,before+1,'failed persistence may show again on the next open');close();
});
