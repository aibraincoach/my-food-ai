import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const code=ts.transpileModule(readFileSync(new URL('../src/components/DeferredEffects.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function mount(readyState='loading',now=1000) {
 const window=new EventTarget(),document={readyState,documentElement:{dataset:{}}},frames=new Map(),timers=new Map(),effects=[];let next=0,settle,without=0;
 const firstPhotoSettled=new Promise(resolve=>{settle=resolve;});const exports={};
 vm.runInNewContext(code,{exports,window,document,performance:{now:()=>now},setTimeout:(fn,delay)=>{timers.set(++next,{fn,delay});return next;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id),require(name){if(name==='react')return{useEffect:fn=>effects.push(fn)};if(name==='@/lib/posts/feed-photo-url')return{firstPhotoSettled,settleWithoutFirstPhoto:()=>{without++;}};throw Error(name);}});
 assert.equal(exports.default(),null);const cleanup=effects[0]();
 return{document,frames,timers,cleanup,settle,without:()=>without,load:()=>window.dispatchEvent(new Event('load')),frame(){const [id,callback]=frames.entries().next().value;frames.delete(id);callback();}};
}
const turn=()=>new Promise(resolve=>setImmediate(resolve));
test('effects wait for load, photo settlement and one frame',async()=>{
 const f=mount();assert.equal('effects'in f.document.documentElement.dataset,false);f.settle();await turn();assert.equal(f.frames.size,0);
 f.load();await turn();assert.equal(f.without(),1);assert.equal(f.frames.size,1);assert.equal('effects'in f.document.documentElement.dataset,false);
 f.frame();assert.equal(f.document.documentElement.dataset.effects,'');assert.equal(f.timers.size,0);f.cleanup();
});
test('load alone does not enable effects until the photo settles',async()=>{
 const f=mount();f.load();await turn();assert.equal(f.frames.size,0);f.settle();await turn();assert.equal(f.frames.size,1);f.frame();assert.equal('effects'in f.document.documentElement.dataset,true);f.cleanup();
});
test('an already loaded document still waits for settlement and one frame',async()=>{
 const f=mount('complete');assert.equal(f.without(),1);assert.equal(f.frames.size,0);f.settle();await turn();assert.equal(f.frames.size,1);f.frame();assert.equal('effects'in f.document.documentElement.dataset,true);f.cleanup();
});
test('the navigation-relative eight-second cap restores effects even without load or settlement',()=>{
 const f=mount('loading',2500);const timer=[...f.timers.values()][0];assert.equal(timer.delay,5500);timer.fn();assert.equal('effects'in f.document.documentElement.dataset,true);f.cleanup();
 const late=mount('complete',9000);assert.equal([...late.timers.values()][0].delay,0);late.cleanup();
});
test('cleanup before load or settlement prevents any later enable',async()=>{
 const f=mount();f.cleanup();f.load();f.settle();await turn();assert.equal(f.frames.size,0);assert.equal(f.timers.size,0);assert.equal('effects'in f.document.documentElement.dataset,false);
 const g=mount();g.load();g.cleanup();g.settle();await turn();assert.equal(g.frames.size,0);
});
test('cleanup cancels the pending frame and cap',async()=>{
 const f=mount();f.load();f.settle();await turn();assert.equal(f.frames.size,1);f.cleanup();assert.equal(f.frames.size,0);assert.equal(f.timers.size,0);assert.equal('effects'in f.document.documentElement.dataset,false);
});
