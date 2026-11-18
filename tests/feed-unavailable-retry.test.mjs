// node --import tsx --test tests/feed-unavailable-retry.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {retainCompleteItems,isSettled,hasUnavailableFields} from '../src/lib/posts/feed.ts';
test('a failed optional card read waits for focus before recovering its nutrition',async()=>{
 const effects=[],states=[];const timers=new Map(),events=new EventTarget();let timerId=0,calls=0,recovered=false,stateIndex=0,now=100000;
 const initial={id:'meal',status:'ready',itemsUnavailable:true,mediaUnavailable:true,items:[{id:'known',name:'Rice',calories:90}],slides:[],analysisFingerprint:'same'};
 const channel={on(){return this;},subscribe(){return this;}};
 const code=ts.transpileModule(readFileSync(new URL('../src/components/RealtimePost.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,Date:{now:()=>now},document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},window:events,CustomEvent,setTimeout(fn,ms=0){timers.set(++timerId,{fn,at:now+ms});return timerId;},clearTimeout:id=>timers.delete(id),
 require(name){
  if(name==='react')return{useState(initial){const index=stateIndex++;states[index]=initial;return[initial,next=>{states[index]=typeof next==='function'?next(states[index]):next;}];},useRef:current=>({current}),useEffect:fn=>effects.push(fn)};
  if(name==='react/jsx-runtime')return{jsx:()=>null,Fragment:Symbol()};
  if(name==='@/lib/supabase/client')return{createClient:()=>({channel:()=>channel,removeChannel(){}})};
  if(name==='@/lib/pipeline/pending-items')return{readPendingItems:()=>[]};
  if(name==='@/lib/posts/feed')return{retainCompleteItems,isSettled,hasUnavailableFields,getPostCard:async()=>{calls++;return recovered?{...initial,itemsUnavailable:false,mediaUnavailable:false,items:[{id:'food',name:'Rice',calories:100}]}:initial;}};
  throw Error(name);
 }});
 exports.default({initial,renderCard:()=>null});const cleanups=effects.map(fn=>fn());await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls,1);
 for(let elapsed=0;elapsed<600000;elapsed+=1000){now+=1000;for(const[id,timer]of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}await new Promise(resolve=>setImmediate(resolve));}
 assert.equal(calls,1,'ten simulated minutes add no timed read');recovered=true;events.dispatchEvent(new Event('focus'));await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls,2);assert.equal(states[1].current.itemsUnavailable,false);assert.equal(states[1].current.items[0].calories,100);
 for(const cleanup of cleanups)cleanup?.();
});
