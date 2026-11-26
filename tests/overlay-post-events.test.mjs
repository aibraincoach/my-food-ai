import {tabReturnModule,returnToTab} from './fixtures/tab-return-module.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

function harness(renderedSlides=[],renderedItems=[]) {
  const source=readFileSync(new URL('../src/components/OutlineOverlay.tsx',import.meta.url),'utf8');
  const ast=ts.createSourceFile('OutlineOverlay.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const found=[];
  function visit(node){
    if(ts.isCallExpression(node)&&node.expression.getText(ast)==='useEffect'&&node.arguments[0]&&node.arguments[0].getText(ast).includes('.select("status,analysis_initialized_at,fail_reason,caption,eaten_at,post_media(id,not_eaten),post_items(id,gtin,not_eaten_calories)")'))found.push(node.arguments[0].getText(ast));
    ts.forEachChild(node,visit);
  }
  visit(ast);assert.equal(found.length,1,'execute the real meal-status effect');
  const output=ts.transpileModule('export const effect='+found[0],{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const document=Object.assign(new EventTarget(),{visibilityState:'visible'}),window=new EventTarget(),replaced=[],timers=new Map();let reads=0,revisionReads=0,refreshes=0,row={caption:'Meal',eaten_at:'2026-11-25T12:00:00Z',post_items:[],post_media:[],analysis_initialized_at:null,fail_reason:null,status:'processing'},timerId=0;
  let revision={fingerprint:'initial',modelCommentId:'initial-model'};
  const exports={};
  const db={channel(){throw Error('only the tab owns a posts channel');},from(table){assert.equal(table,'posts');const q={select(){return q;},eq(_key,id){assert.equal(id,'meal');return q;},is(){return q;},async maybeSingle(){reads++;return {data:row,error:null};}};return q;}};
  vm.runInNewContext(output,{exports,document,window,CustomEvent,postId:'meal',items:renderedItems,slides:renderedSlides,caption:'Meal',eatenAt:'2026-11-25T12:00:00Z',status:'needs_input',initializedAt:null,failReason:null,fingerprint:'initial',modelCommentId:'initial-model',latestRevision:async()=>{revisionReads++;return revision;},onTabReturn:tabReturnModule(window,document).onTabReturn,waiting:false,setWaiting(){},createClient:()=>db,router:{replace:path=>replaced.push(path),refresh:()=>refreshes++},setTimeout:(cb,ms)=>{timers.set(++timerId,{cb,ms});return timerId;},clearTimeout:id=>timers.delete(id)});
  const cleanup=exports.effect();
  return {document,reads:()=>reads,refreshes:()=>refreshes,revisionReads:()=>revisionReads,replaced,change(values){row={...row,...values};},unchanged(){row={caption:'Meal',eaten_at:'2026-11-25T12:00:00Z',post_items:[],post_media:[],status:'needs_input',analysis_initialized_at:null,fail_reason:null};},edit(){revision={...revision,fingerprint:'edited'};},missing(){row=null;},event(name,id){window.dispatchEvent(new CustomEvent(name,{detail:{id}}));},async flush(){await new Promise(resolve=>setImmediate(resolve));},async visible(){returnToTab(document);await this.flush();},async idle(){for(let n=0;n<600;n++){for(const timer of timers.values())timer.cb();await this.flush();}},cleanup};
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

test('an unchanged return checks status and revision once without refreshing RSC; a hidden edit refreshes',async()=>{const h=harness();try{h.unchanged();await h.visible();assert.equal(h.reads(),1);assert.equal(h.revisionReads(),1);assert.equal(h.refreshes(),0);h.edit();await h.visible();assert.equal(h.reads(),2);assert.equal(h.refreshes(),1);}finally{h.cleanup();}});

for(const [name,change]of [['caption',{caption:'Changed caption'}],['time',{eaten_at:'2026-11-25T13:00:00Z'}],['photo added',{post_media:[{id:'photo',not_eaten:false}]}],['photo removed',{post_media:[]}],['photo not-eaten',{post_media:[{id:'photo',not_eaten:true}]}]])test(`a hidden ${name} change refreshes the rendered overlay`,async()=>{const h=harness(name==='photo removed'||name==='photo not-eaten'?[{id:'photo',not_eaten:false}]:[]);try{h.unchanged();h.change(change);await h.visible();assert.equal(h.refreshes(),1);}finally{h.cleanup();}});

for(const [name,change]of [['barcode',{gtin:'1234567890123',not_eaten_calories:0}],['leftover calories',{gtin:null,not_eaten_calories:25}]])test(`a hidden in-place ${name} change refreshes`,async()=>{const h=harness([],[{id:'item',gtin:null,not_eaten_calories:0}]);try{h.unchanged();h.change({post_items:[{id:'item',...change}]});await h.visible();assert.equal(h.refreshes(),1);}finally{h.cleanup();}});
