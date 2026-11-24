import {englishIntl,englishIntlServer} from './fixtures/english-intl.mjs';
import * as readingFormat from '../src/i18n/format.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {refreshAfterReadinessSeed,refreshAfterReady} from '../src/lib/posts/readiness-refresh.ts';
test('Home settles an already-ready tracked meal when its first subscription connects, without another event or timer',async()=>{
 let effect,subscribed,status='processing',reads=0;const events=new EventTarget(),settled=[];
 events.addEventListener('post-ready',e=>settled.push(e.detail.id));
 const document=Object.assign(new EventTarget(),{visibilityState:'visible',querySelector:s=>s==='[data-home-feed]'?{}:null});
 const channel={on(){return this;},subscribe(fn){subscribed=fn;return this;}};
 const db={auth:{getSession:async()=>({data:{session:{user:{id:'owner'}}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},channel:()=>channel,removeChannel(){},from(){let ids=false,selection;const q={select(s){selection=s;return q;},eq(){return q;},in(column){ids=column==='id';return q;},order(){return q;},limit(){return q;},then(fn){if(ids)reads++;const data=ids?[{id:'meal',status}]:selection==='id'?(status==='processing'?[{id:'meal'}]:[]):[{id:'meal',status}];return Promise.resolve({data,error:null}).then(fn);}};return q;}};
 const exports={},code=ts.transpileModule(readFileSync(new URL('../src/components/PostReadinessListener.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,Event,CustomEvent,window:events,document,location:{pathname:'/'},Date,setTimeout:()=>1,clearTimeout(){},require(name){if(name==='next-intl')return englishIntl;if(name==='next-intl/server')return englishIntlServer;if(name==='@/i18n/format')return readingFormat;if(name==='react')return{useEffect:fn=>effect=fn,useState:v=>[v,()=>{}]};if(name==='react/jsx-runtime')return{jsx:()=>null};if(name==='next/navigation')return{useRouter:()=>({refresh(){}})};if(name==='@/lib/supabase/client')return{createClient:()=>db};if(name==='@/lib/posts/readiness-refresh')return{refreshAfterReadinessSeed,refreshAfterReady};throw Error(name);}});
 exports.default();const cleanup=effect(),flush=()=>new Promise(r=>setImmediate(r));try{await flush();assert.equal(reads,0);status='ready';subscribed('SUBSCRIBED');await flush();assert.deepEqual(settled,['meal']);assert.equal(reads,1,'one exact-ID reconciliation');subscribed('SUBSCRIBED');await flush();assert.equal(reads,1,'duplicate subscribe adds no read');}finally{cleanup();}
});
