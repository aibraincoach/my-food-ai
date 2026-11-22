import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function fixture(hint) {
 const effects=[],states=[],saved=[],documentListeners=new Map(),windowListeners=new Map();
 const events=map=>({addEventListener:(name,fn)=>map.set(name,fn),removeEventListener:(name,fn)=>{if(map.get(name)===fn)map.delete(name);}});
 const exports={};
 const path=process.env.HINT_SOURCE??new URL('../src/components/FirstRunHint.tsx',import.meta.url);
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
 assert.equal(code.diagnostics?.length??0,0);
 const db={auth:{getSession:async()=>({data:{session:{user:{id:'local-fixture'}}}})},from:()=>({select:()=>({eq:()=>({single:async()=>({data:{hints_seen:[]},error:null})})})})};
 vm.runInNewContext(code.outputText,{exports,document:events(documentListeners),window:events(windowListeners),require:name=>{
  if(name==='react')return{useRef:value=>({current:value}),useState:value=>[value,next=>states.push(next)],useEffect:fn=>effects.push(fn)};
  if(name==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name==='@/lib/profile/hints')return{dismissHint:async key=>{saved.push(key);}};
  if(name==='@/lib/supabase/client')return{createClient:()=>db};
  if(name==='@/components/ui/Tooltip')return{Tooltip:'tooltip'};throw Error(name);
 }});
 exports.default({hint});const cleanups=effects.map(effect=>effect());
 return {documentListeners,windowListeners,states,saved,cleanup:()=>cleanups.forEach(fn=>fn?.())};
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
test('the modes tip still waits for a real capture-shot, not arbitrary click or pointerdown',async()=>{
 const f=fixture('modes');await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.documentListeners.size,0);assert.equal(f.windowListeners.has('capture-shot'),true);
 f.windowListeners.get('capture-shot')();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(f.saved,['modes']);f.cleanup();assert.equal(f.windowListeners.size,0);
});
