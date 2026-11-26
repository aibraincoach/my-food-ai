import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const code=ts.transpileModule(readFileSync(new URL('../src/components/DeferredEffects.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function mount(readyState='loading') {
  const window=new EventTarget(),document={readyState,documentElement:{dataset:{}}},frames=new Map(),effects=[];let next=0;
  const exports={};
  vm.runInNewContext(code,{exports,window,document,requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id),require(name){if(name==='react')return{useEffect:fn=>effects.push(fn)};throw Error(name);}});
  assert.equal(exports.default(),null);
  const cleanup=effects[0]();
  return{document,frames,cleanup,load:()=>window.dispatchEvent(new Event('load')),frame(){const [id,callback]=frames.entries().next().value;frames.delete(id);callback();}};
}

test('cold effects remain absent until load and one frame enables their shared gate',()=>{
  const f=mount();assert.equal('effects'in f.document.documentElement.dataset,false);assert.equal(f.frames.size,0);
  f.load();assert.equal('effects'in f.document.documentElement.dataset,false);assert.equal(f.frames.size,1);
  f.frame();assert.equal(f.document.documentElement.dataset.effects,'');f.cleanup();
});
test('an already loaded document still waits one frame',()=>{
  const f=mount('complete');assert.equal('effects'in f.document.documentElement.dataset,false);assert.equal(f.frames.size,1);
  f.frame();assert.equal('effects'in f.document.documentElement.dataset,true);f.cleanup();
});
test('cleanup before load removes the listener and cannot enable effects',()=>{
  const f=mount();f.cleanup();f.load();assert.equal(f.frames.size,0);assert.equal('effects'in f.document.documentElement.dataset,false);
});
test('cleanup cancels a pending frame',()=>{
  const f=mount();f.load();assert.equal(f.frames.size,1);f.cleanup();assert.equal(f.frames.size,0);assert.equal('effects'in f.document.documentElement.dataset,false);
});
