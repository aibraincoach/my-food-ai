import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {refreshAfterReadinessSeed,refreshAfterReady} from '../src/lib/posts/readiness-refresh.ts';
const code=ts.transpileModule(readFileSync(new URL('../src/components/PostReadinessListener.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
async function mount(pathname='/days'){
 let effect,authChanged,refreshes=0,reads=0,owner='user-a',day='today';const intervals=new Map(),channels=[],removed=[];
 const events=new EventTarget(),document=Object.assign(new EventTarget(),{visibilityState:'visible',querySelector:()=>null});
 const db={auth:{getSession:async()=>({data:{session:owner?{user:{id:owner}}:null}}),onAuthStateChange:fn=>{authChanged=fn;return{data:{subscription:{unsubscribe(){authChanged=null;}}}};}},channel:()=>{const c={on(_type,filter,receive){this.filter=filter;this.receive=receive;return this;},subscribe(fn){this.status=fn;channels.push(this);return this;}};return c;},removeChannel:c=>removed.push(c),from(){reads++;return{select(){return this;},eq(){return this;},in:async()=>({data:[],error:null}),order(){return this;},limit:async()=>({data:[],error:null})};}};
 const exports={},FakeDate=class extends Date{toDateString(){return day;}};
 vm.runInNewContext(code,{exports,Map,Promise,Event,CustomEvent,Date:FakeDate,window:events,document,location:{pathname},setInterval:(fn,ms)=>{intervals.set(ms,fn);return ms;},clearInterval:ms=>intervals.delete(ms),require(name){if(name==='react')return{useEffect:fn=>effect=fn};if(name==='next/navigation')return{useRouter:()=>({refresh:()=>refreshes++})};if(name==='@/lib/supabase/client')return{createClient:()=>db};if(name==='@/lib/posts/readiness-refresh')return{refreshAfterReadinessSeed,refreshAfterReady};throw Error(name);}});
 exports.default();const cleanup=effect(),flush=()=>new Promise(r=>setImmediate(r));await flush();
 return{channels,removed,events,document,intervals,cleanup,flush,reads:()=>reads,refreshes:()=>refreshes,setDay:value=>day=value,async auth(id){owner=id;assert.equal(typeof authChanged,'function');authChanged(id?'SIGNED_IN':'SIGNED_OUT',id?{user:{id}}:null);await flush();}};
}
test('five simulated idle minutes cause no discovery reads or redraws on Home and Days; day change still refreshes once',async()=>{
 for(const path of ['/','/days']){const app=await mount(path);try{const reads=app.reads(),refreshes=app.refreshes();for(let elapsed=3000;elapsed<=300000;elapsed+=3000){for(const[ms,fn]of app.intervals)if(elapsed%ms===0)await fn();await app.flush();}assert.equal(app.reads()-reads,0,'idle network reads');assert.equal(app.refreshes()-refreshes,0,'idle redraws');app.setDay('tomorrow');app.intervals.get(60000)();assert.equal(app.refreshes(),refreshes+1);app.intervals.get(60000)();assert.equal(app.refreshes(),refreshes+1);}finally{app.cleanup();}}
});
test('readiness channels follow the authenticated account and release on sign-out and unmount',async()=>{
 const app=await mount();try{assert.equal(app.channels.length,1);assert.equal(app.channels[0].filter.filter,'user_id=eq.user-a');assert.equal(app.channels[0].filter.event,'*');let questions=0;app.events.addEventListener('post-readiness',()=>questions++);app.channels[0].receive({new:{id:'question-elsewhere',status:'needs_input'}});assert.equal(questions,1,'an external question INSERT/UPDATE reaches the strip event without a timer');app.channels[0].status('SUBSCRIBED');await app.flush();const before=app.refreshes();app.channels[0].receive({new:{id:'meal',status:'ready'}});assert.equal(app.refreshes(),before+1);await app.auth('user-b');assert.ok(app.removed.includes(app.channels[0]));assert.equal(app.channels.at(-1).filter.filter,'user_id=eq.user-b');const current=app.channels.at(-1);await app.auth(null);assert.ok(app.removed.includes(current));}finally{app.cleanup();}assert.equal(app.intervals.size,0);
});
