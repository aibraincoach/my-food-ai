// node --import tsx --test tests/feed-cache-lifecycle.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {retainCompleteItems,hasUnavailableFields} from '../src/lib/posts/feed.ts';
import {mergeFeedPosts,discoveryLostOverlap} from '../src/lib/posts/feed-order.ts';
import {readFeedCache,writeFeedCache,clearFeedCache} from '../src/lib/posts/feed-cache.ts';

const jsx=(type,props)=>({type,props:props??{}});
const turn=()=>new Promise(resolve=>setImmediate(resolve));
const compile=path=>ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const meal=(id='meal',calories=100)=>({id,caption:'Rice',status:'ready',created_at:'2026-11-03T00:00:00Z',eaten_at:'2026-11-03T00:00:00Z',photoUrl:null,slides:[],items:[{id:'food',name:'Rice',calories}],analysisFingerprint:`revision-${calories}`});
const nextDay=(day,step)=>{const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+step);return date.toISOString().slice(0,10);};
const days={dateInZone:value=>new Date(value).toISOString().slice(0,10),shiftDay:nextDay,validZone:()=> 'UTC',getDayTotals:async()=>[],getLoggedDates:async()=>[]};

// Render the actual async Home/Suspense children, retaining DOM attributes.
// Only browser leaf components are stubbed; HomeFeed's success/failure policy
// and CachedFeedFallback's real external-store snapshot both execute.
async function serverHome(seedRead){
 const exported={};
 const noop=()=>null;
 const require=name=>{
  if(name==='react')return{Suspense:({children})=>children,cache:fn=>fn};
  if(name==='react-dom')return{preload(){}};
  if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};
  if(name==='next/server')return{connection:async()=>{}};
  if(name==='next/link')return{default:({children})=>children};
  if(name==='next/headers')return{cookies:async()=>({get:()=>({value:'UTC'})})};
  if(name==='@/lib/supabase/server')return{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}}})}})};
  if(name==='@/lib/posts/feed')return{getFeed:seedRead,getFirstFeedPhoto:async()=>null};
  if(name==='@/lib/posts/days')return days;
  if(name==='@/components/DesktopWorkspace')return{default:({children})=>children};
  if(name==='@/components/Feed')return{default:noop,CachedFeedFallback:noop};
  if(name.startsWith('@/components/'))return{default:noop};
  throw Error('Unexpected page dependency '+name);
 };
 vm.runInNewContext(compile('../src/app/(tabs)/page.tsx'),{exports:exported,require,AbortSignal,Date,setTimeout,clearTimeout});
 async function render(node){
  if(Array.isArray(node))return Promise.all(node.map(render));
  if(!node||typeof node!=='object')return node;
  if(typeof node.type==='function')return render(await node.type(node.props));
  return{...node,props:{...node.props,children:await render(node.props.children)}};
 }
 return render(await exported.default({searchParams:Promise.resolve({})}));
}
function attribute(tree,name){
 if(Array.isArray(tree))return tree.some(node=>attribute(node,name));
 if(!tree||typeof tree!=='object')return false;
 const value=tree.props?.[name];
 return (value!==undefined&&value!==false)||attribute(tree.props?.children,name);
}
function fallbackFor(tree){
 const exported={};
 vm.runInNewContext(compile('../src/components/Feed.tsx'),{exports:exported,document:{querySelector(selector){return selector.split(',').some(part=>{const name=/^\[([^\]]+)\]$/.exec(part.trim())?.[1];return name&&attribute(tree,name);})?{}:null;}},require(name){
  if(name==='react')return{useSyncExternalStore:(_subscribe,snapshot)=>snapshot()};
  if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};
  if(name==='@/lib/posts/feed')return{retainCompleteItems,hasUnavailableFields};
  return{};
 }});
 return exported.CachedFeedFallback();
}

test('a failed server seed does not retire the independently hydrated cached feed',async()=>{
 const tree=await serverHome(async()=>{throw Error('temporary feed failure');});
 const fallback=fallbackFor(tree);
 assert.ok(fallback,'the cached feed boundary must remain mounted when the server read failed');
 assert.equal(fallback.props.fallbackOnly,true);
});
test('an authoritative empty server feed retires an obsolete cached snapshot',async()=>{
 const tree=await serverHome(async()=>({posts:[],days:[],nextCursor:null}));
 assert.equal(fallbackFor(tree),null,'a genuinely empty current feed must replace the old cached meals');
});

async function mountedFeed(initialPosts,{cachedPosts,failPage=false}={}){
 const listeners=new Map(),effects=[],states=[];const storage=new Map();
 const priorStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),priorWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
 const events=new EventTarget();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{get length(){return storage.size;},key:index=>[...storage.keys()][index]??null,getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}});
 Object.defineProperty(globalThis,'window',{configurable:true,value:events});
 clearFeedCache();
 if(cachedPosts)writeFeedCache('owner',{posts:cachedPosts,savedAt:Date.now()});
 let current=initialPosts[0];
 const cache={cached:null,save:posts=>writeFeedCache('owner',{posts,savedAt:Date.now()})};
 const channel={on(){return this;},subscribe(){return this;}};
 const exported={};
 vm.runInNewContext(compile('../src/components/Feed.tsx'),{exports:exported,URLSearchParams,AbortSignal,Date,
  fetch:async()=>{if(failPage)throw Error('temporary server failure');return{ok:true,status:200,json:async()=>({posts:initialPosts,days:[],nextCursor:null})};},
  document:{hidden:false,addEventListener(){},removeEventListener(){}},
  window:{addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type),dispatchEvent(){}},
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},
  require(name){
   if(name==='react')return{useEffect:fn=>effects.push(fn),useRef:value=>({current:value}),useState:initial=>{let value=initial;return[initial,next=>{value=typeof next==='function'?next(value):next;states.push(value);}];}};
   if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};
   if(name==='next/navigation')return{useRouter:()=>({replace(){}})};
   if(name==='@/lib/supabase/client')return{createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{id:'owner'}}}})},channel:()=>channel,removeChannel(){}})};
   if(name==='@/lib/posts/feed')return{FEED_PAGE_SIZE:20,retainCompleteItems,hasUnavailableFields,getPostCard:async()=>current};
   if(name==='@/lib/posts/feed-order')return{mergeFeedPosts,discoveryLostOverlap};
   if(name==='@/lib/posts/feed-cache')return{readFeedCache,writeFeedCache,clearFeedCache};
   if(name==='@/lib/posts/feed-cache-mutations')return{claimFeedCacheEvents:()=>()=>{}};
   if(name==='@/lib/posts/days')return days;
   if(name==='@/components/LocalTime')return{useDeviceTimeZone:()=>''};
   if(name==='@/components/useCachedFeed')return{useCachedFeed:()=>cache};
   if(name==='@/components/useUploads')return{useUploads:()=>[]};
   if(name==='@/lib/posts/upload-manager')return{uploadManager:{list:()=>[]}};
   if(name==='@/lib/theme/tokens')return{tokens:{spacing:{'sheet-bottom':1}}};
   if(name.startsWith('@/components/'))return{default:()=>null};
   throw Error('Unexpected feed dependency '+name);
  }});
 exported.default();const cleanups=effects.map(fn=>fn());await turn();await turn();
 return{setCard(value){current=value;},emit(type,id,extra={}){assert.ok(listeners.has(type),'real feed listener must be mounted');listeners.get(type)({detail:{id,...extra}});},snapshot:()=>readFeedCache('owner')?.posts,readyState:()=>states.findLast(state=>state?.kind==='ready'),cleanup(){for(const cleanup of cleanups)cleanup?.();clearFeedCache();if(priorStorage)Object.defineProperty(globalThis,'localStorage',priorStorage);else delete globalThis.localStorage;if(priorWindow)Object.defineProperty(globalThis,'window',priorWindow);else delete globalThis.window;}};
}

test('deleting a cached meal persists its removal and a failed delete can restore it',async()=>{
 const first=meal(),other=meal('other',200);const app=await mountedFeed([first,other]);
 try{
  assert.equal(app.snapshot().length,2);
  app.emit('post-deleted',first.id);await turn();
  assert.deepEqual(app.snapshot().map(post=>post.id),['other'],'reopening must not resurrect a successfully removed cached meal');
  app.emit('post-restore',first.id,{post:first});await turn();
  assert.equal(app.snapshot().length,2,'rolling back a failed delete must repair the persisted snapshot too');
 }finally{app.cleanup();}
});
test('accepted corrections invalidate stale cached nutrition and persist the later ready revision',async()=>{
 const first=meal();const app=await mountedFeed([first]);
 try{
  assert.equal(app.snapshot()[0].items[0].calories,100);
  app.setCard({...first,status:'processing',items:[],analysisFingerprint:null});app.emit('post-updated',first.id);await turn();await turn();
  assert.equal(app.snapshot()[0].status,'processing');
  assert.equal(app.snapshot()[0].items.length,0,'a reopen during correction cannot show the old estimate as current');
  app.setCard(meal(first.id,300));app.emit('post-ready',first.id);await turn();await turn();
  assert.equal(app.snapshot()[0].status,'ready');assert.equal(app.snapshot()[0].items[0].calories,300);
 }finally{app.cleanup();}
});

test('the unseeded main feed keeps the owner cache when fresh loading fails',async()=>{
 const prior=meal('cached-meal',150);const app=await mountedFeed([],{cachedPosts:[prior],failPage:true});
 try{
  assert.equal(app.readyState()?.posts[0]?.id,prior.id,'a missed hook notification cannot strand the main feed after the server boundary retires');
  assert.equal(app.snapshot()[0].items[0].calories,150,'failed revalidation must leave the valid saved snapshot intact');
 }finally{app.cleanup();}
});
