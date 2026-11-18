import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {refreshAfterReadinessSeed,refreshAfterReady} from '../src/lib/posts/readiness-refresh.ts';
const code=ts.transpileModule(readFileSync(new URL('../src/components/PostReadinessListener.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
async function mount(pathname='/days'){
 let effect,authChanged,refreshes=0,reads=0,owner='user-a',day='today',now=100000,discoveryReads=0,failDiscovery=false,failed=false;const intervals=new Map(),timeouts=new Map(),channels=[],removed=[];let timerId=0;
 const events=new EventTarget(),document=Object.assign(new EventTarget(),{visibilityState:'visible',querySelector:()=>null});
 const db={auth:{getSession:async()=>({data:{session:owner?{user:{id:owner}}:null}}),onAuthStateChange:fn=>{authChanged=fn;return{data:{subscription:{unsubscribe(){authChanged=null;}}}};}},channel:()=>{const c={on(_type,filter,receive){this.filter=filter;this.receive=receive;return this;},subscribe(fn){this.status=fn;channels.push(this);return this;}};return c;},removeChannel:c=>removed.push(c),from(){reads++;return{select(columns){if(columns==='id,status')discoveryReads++;return this;},eq(){return this;},in:async()=>({data:[],error:null}),order(){return this;},limit:async()=>({data:[],error:failDiscovery?{message:'offline'}:null})};}};
 const exports={},FakeDate=class extends Date{constructor(value){super(value??now);}toDateString(){return day;}static now(){return now;}};
 vm.runInNewContext(code,{exports,Map,Promise,Event,CustomEvent,Date:FakeDate,window:events,document,location:{pathname},setInterval:(fn,ms)=>{intervals.set(ms,fn);return ms;},clearInterval:ms=>intervals.delete(ms),setTimeout:(fn,ms)=>{timeouts.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timeouts.delete(id),require(name){if(name==='react')return{useEffect:fn=>effect=fn,useState:()=>[failed,value=>{failed=value}]};if(name==='react/jsx-runtime')return{jsx:(type,props)=>({type,props})};if(name==='next/navigation')return{useRouter:()=>({refresh:()=>refreshes++})};if(name==='@/lib/supabase/client')return{createClient:()=>db};if(name==='@/lib/posts/readiness-refresh')return{refreshAfterReadinessSeed,refreshAfterReady};throw Error(name);}});
 exports.default();const cleanup=effect(),flush=()=>new Promise(r=>setImmediate(r));await flush();
 return{channels,removed,events,document,intervals,timeouts,dayBoundary(){if(intervals.has(60000))intervals.get(60000)();else{const [id,timer]=[...timeouts][0];timeouts.delete(id);timer.fn();}},cleanup,flush,view:()=>exports.default(),discoveryReads:()=>discoveryReads,failed:()=>failed,setNow:value=>now=value,failDiscovery:value=>failDiscovery=value,reads:()=>reads,refreshes:()=>refreshes,setDay:value=>day=value,async auth(id){owner=id;assert.equal(typeof authChanged,'function');authChanged(id?'SIGNED_IN':'SIGNED_OUT',id?{user:{id}}:null);await flush();}};
}
test('ten simulated idle minutes with a pending meal cause no reads or redraws on Home and Days; day change still refreshes once',async()=>{
 for(const path of ['/','/days']){const app=await mount(path);try{app.events.dispatchEvent(new CustomEvent('post-created',{detail:{id:'pending'}}));const reads=app.reads(),refreshes=app.refreshes();for(let elapsed=3000;elapsed<=600000;elapsed+=3000){for(const[ms,fn]of app.intervals)if(elapsed%ms===0)await fn();await app.flush();}assert.equal(app.reads()-reads,0,'idle network reads');assert.equal(app.refreshes()-refreshes,0,'idle redraws');app.channels[0].receive({new:{id:'pending',status:'ready'}});const settled=app.refreshes();assert.equal(settled,refreshes+1);app.setDay('tomorrow');app.dayBoundary();assert.equal(app.refreshes(),settled+1);app.dayBoundary();assert.equal(app.refreshes(),settled+1);}finally{app.cleanup();}}
});
test('readiness channels follow the authenticated account and release on sign-out and unmount',async()=>{
 const app=await mount();try{assert.equal(app.channels.length,1);assert.equal(app.channels[0].filter.filter,'user_id=eq.user-a');assert.equal(app.channels[0].filter.event,'*');let questions=0;app.events.addEventListener('post-readiness',()=>questions++);app.channels[0].receive({new:{id:'question-elsewhere',status:'needs_input'}});assert.equal(questions,1,'an external question INSERT/UPDATE reaches the strip event without a timer');app.channels[0].status('SUBSCRIBED');await app.flush();const before=app.refreshes();app.channels[0].receive({new:{id:'meal',status:'ready'}});assert.equal(app.refreshes(),before+1);await app.auth('user-b');assert.ok(app.removed.includes(app.channels[0]));assert.equal(app.channels.at(-1).filter.filter,'user_id=eq.user-b');const current=app.channels.at(-1);await app.auth(null);assert.ok(app.removed.includes(current));}finally{app.cleanup();}assert.equal(app.intervals.size,0);
});


test('reconnect catch-up runs once per reconnect after the first subscribe, with a 30-second per-tab gap and visible failure',async()=>{
 const app=await mount();try{
  const channel=app.channels[0],initial=app.discoveryReads();channel.status('SUBSCRIBED');await app.flush();assert.equal(app.discoveryReads(),initial,'first subscription adds no catch-up discovery');
  channel.status('CHANNEL_ERROR');channel.status('SUBSCRIBED');await app.flush();assert.equal(app.discoveryReads(),initial+1);channel.status('SUBSCRIBED');await app.flush();assert.equal(app.discoveryReads(),initial+1,'duplicate notification adds no read');
  app.setNow(105000);channel.status('CHANNEL_ERROR');channel.status('SUBSCRIBED');await app.flush();assert.equal(app.discoveryReads(),initial+1,'flapping within 30 seconds adds no read');
  app.setNow(130000);app.failDiscovery(true);channel.status('TIMED_OUT');channel.status('SUBSCRIBED');await app.flush();assert.equal(app.discoveryReads(),initial+2);assert.equal(app.failed(),true,'failed catch-up produces visible state');assert.equal(app.view().props.role,'status');assert.match(app.view().props.children,/could not reconnect.*Refresh/);
  for(let i=0;i<5;i++){app.dayBoundary();await app.flush();}assert.equal(app.discoveryReads(),initial+2,'failed read is never retried by a timer');
 }finally{app.cleanup();}
});
