// node --import tsx --test tests/feed-unavailable-retry.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {retainCompleteItems,isSettled} from '../src/lib/posts/feed.ts';
test('a ready card with an unavailable item snapshot keeps polling and recovers its actual nutrition',async()=>{
 const effects=[],states=[];let interval,calls=0,recovered=false,stateIndex=0;
 const initial={id:'meal',status:'ready',itemsUnavailable:true,items:[],slides:[],analysisFingerprint:'same'};
 const channel={on(){return this;},subscribe(){return this;}};
 const code=ts.transpileModule(readFileSync(new URL('../src/components/RealtimePost.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,Date,document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},window:{addEventListener(){},removeEventListener(){},dispatchEvent(){}},CustomEvent:class{},setInterval(fn){interval=fn;return 1;},clearInterval(){},
 require(name){
  if(name==='react')return{useState(initial){const index=stateIndex++;states[index]=initial;return[initial,next=>{states[index]=typeof next==='function'?next(states[index]):next;}];},useRef:current=>({current}),useEffect:fn=>effects.push(fn)};
  if(name==='react/jsx-runtime')return{jsx:()=>null,Fragment:Symbol()};
  if(name==='@/lib/supabase/client')return{createClient:()=>({channel:()=>channel,removeChannel(){}})};
  if(name==='@/lib/posts/feed')return{retainCompleteItems,isSettled,getPostCard:async()=>{calls++;return recovered?{...initial,itemsUnavailable:false,items:[{id:'food',name:'Rice',calories:100}]}:initial;}};
  throw Error(name);
 }});
 exports.default({initial,renderCard:()=>null});const cleanups=effects.map(fn=>fn());await new Promise(resolve=>setImmediate(resolve));
 assert.equal(typeof interval,'function','ready is not terminal while item reads are unavailable');assert.equal(calls,1);
 recovered=true;interval();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls,2);assert.equal(states[1].current.itemsUnavailable,false);assert.equal(states[1].current.items[0].calories,100);
 for(const cleanup of cleanups)cleanup?.();
});
