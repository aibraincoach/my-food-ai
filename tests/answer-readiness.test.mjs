import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
test('answered old IDs remain tracked through delayed processing and repeated questions',async()=>{
 let now=1000,status='processing',tick;const effects=[],listeners=new Map(),events=[];
 const code=ts.transpileModule(readFileSync(new URL('../src/components/PostReadinessListener.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const channel={on(){return this;},subscribe(){return this;}};
 const db={auth:{getUser:async()=>({data:{user:{id:'owner'}}})},channel:()=>channel,removeChannel(){},from(){let selection;const q={select(s){selection=s;return q;},eq(){return q;},in(){return q;},then(resolve){return Promise.resolve({data:selection==='id,status'?[{id:'older-meal',status}]:[]}).then(resolve);}};return q;}};
 const exports={};vm.runInNewContext(code,{exports,Date:class extends Date{static now(){return now;}},document:{visibilityState:'visible'},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},setInterval:fn=>{tick=fn;return 1;},clearInterval(){},window:{addEventListener(n,fn){listeners.set(n,fn);},removeEventListener(){},dispatchEvent(event){events.push(event);listeners.get(event.type)?.(event);}},require(name){if(name==='react')return{useEffect:fn=>effects.push(fn)};if(name==='next/navigation')return{useRouter:()=>({refresh(){}})};if(name==='@/lib/supabase/client')return{createClient:()=>db};throw Error(name);}});
 exports.default();const cleanup=effects[0]();await new Promise(resolve=>setImmediate(resolve));
 listeners.get('post-answer-resume')({detail:{id:'older-meal'}});
 for(let i=0;i<400;i++){now+=3000;await tick();}assert.equal(events.length,0,'queued answer must not reappear');
 status='needs_input';now+=3000;await tick();assert.equal(events.length,0,'repeated question remains hidden');
 listeners.get('post-answer-resume')({detail:{id:'older-meal'}});status='processing';now+=3000;await tick();assert.equal(events.length,0);
 status='ready';now+=3000;await tick();assert.equal(events.length,2);assert.equal(events[0].type,'post-settled');assert.equal(events[0].detail.id,'older-meal');cleanup();
});
