import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

function harness() {
  const source=readFileSync(new URL('../src/components/OutlineOverlay.tsx',import.meta.url),'utf8');
  const ast=ts.createSourceFile('OutlineOverlay.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const found=[];
  function visit(node){
    if(ts.isCallExpression(node)&&node.expression.getText(ast)==='useEffect'&&node.arguments[0]&&node.arguments[0].getText(ast).includes('.select("status")'))found.push(node.arguments[0].getText(ast));
    ts.forEachChild(node,visit);
  }
  visit(ast);assert.equal(found.length,1,'execute the real meal-status effect');
  const output=ts.transpileModule('export const effect='+found[0],{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const document=Object.assign(new EventTarget(),{visibilityState:'visible'}),window=new EventTarget(),replaced=[],timers=new Map();let reads=0,refreshes=0,row={status:'processing'},timerId=0;
  const exports={};
  const db={channel(){throw Error('only the tab owns a posts channel');},from(table){assert.equal(table,'posts');const q={select(){return q;},eq(_key,id){assert.equal(id,'meal');return q;},async maybeSingle(){reads++;return {data:row,error:null};}};return q;}};
  vm.runInNewContext(output,{exports,document,window,CustomEvent,postId:'meal',status:'needs_input',waiting:false,setWaiting(){},createClient:()=>db,router:{replace:path=>replaced.push(path),refresh:()=>refreshes++},setTimeout:(cb,ms)=>{timers.set(++timerId,{cb,ms});return timerId;},clearTimeout:id=>timers.delete(id)});
  const cleanup=exports.effect();
  return {document,reads:()=>reads,refreshes:()=>refreshes,replaced,missing(){row=null;},event(name,id){window.dispatchEvent(new CustomEvent(name,{detail:{id}}));},async flush(){await new Promise(resolve=>setImmediate(resolve));},async visible(){document.visibilityState='visible';document.dispatchEvent(new Event('visibilitychange'));await this.flush();},async idle(){for(let n=0;n<600;n++){for(const timer of timers.values())timer.cb();await this.flush();}},cleanup};
}
test('the meal page refreshes once for its own tab event and ignores another meal',async()=>{
  const h=harness();h.event('post-readiness','other');await h.flush();assert.equal(h.reads(),0);h.event('post-readiness','meal');await h.flush();assert.equal(h.reads(),1);assert.equal(h.refreshes(),1);h.cleanup();
});
test('a same-tab deletion leaves the meal page only for its own id',()=>{
  const h=harness();h.event('post-deleted','other');assert.equal(h.replaced.length,0);h.event('post-deleted','meal');assert.deepEqual(h.replaced,['/']);h.cleanup();
});
test('a discarded needs-input meal with no event is found missing on visibility return',async()=>{
  const h=harness();h.missing();h.document.visibilityState='hidden';h.document.dispatchEvent(new Event('visibilitychange'));await h.flush();assert.equal(h.reads(),0);await h.visible();assert.equal(h.reads(),1);assert.deepEqual(h.replaced,['/']);h.cleanup();
});
test('ten simulated idle minutes make no meal-page read',async()=>{
  const h=harness();await h.idle();assert.equal(h.reads(),0);assert.equal(h.refreshes(),0);h.cleanup();h.event('post-readiness','meal');await h.flush();assert.equal(h.reads(),0,'cleanup removes the event listener');
});
