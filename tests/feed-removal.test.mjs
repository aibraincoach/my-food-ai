import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
test('retiring the last meal clears feed state and rejects an older hydration result',async()=>{
 const effects=[],listeners=new Map(),states=[];let resolveCard;
 const post={id:'meal',status:'processing',created_at:'2026-10-01',items:[],slides:[]};
 const channel={on(){return this;},subscribe(){return this;}};
 const exports={};
 const code=ts.transpileModule(readFileSync(new URL('../src/components/Feed.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,document:{hidden:false,addEventListener(){},removeEventListener(){}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},
 window:{addEventListener(type,fn){listeners.set(type,fn);},removeEventListener(){},dispatchEvent(){}},setInterval:()=>1,clearInterval(){},setTimeout,clearTimeout,
 require(name){
  if(name==='react')return{useEffect:fn=>effects.push(fn),useRef:current=>({current}),useState:initial=>[initial,state=>states.push(state)]};
  if(name==='react/jsx-runtime')return{jsx:()=>null,jsxs:()=>null};
  if(name==='next/navigation')return{useRouter:()=>({replace(){}})};
  if(name==='@/lib/supabase/client')return{createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}}})},channel:()=>channel,removeChannel(){}})};
  if(name==='@/lib/posts/feed')return{FEED_PAGE_SIZE:20,getFeed:async()=>({posts:[post],nextCursor:null}),getPostCard:()=>new Promise(resolve=>{resolveCard=resolve;})};
  if(name==='@/lib/posts/feed-order')return{mergeFeedPosts:(baseline,promoted)=>[...new Map([...baseline,...promoted].map(row=>[row.id,row])).values()],discoveryLostOverlap:()=>false};
  if(name==='@/lib/theme/tokens')return{tokens:{spacing:{'sheet-bottom':1}}};
  if(name.startsWith('@/components/'))return{default:()=>null};
  throw Error(name);
 }});
 exports.default();const cleanups=effects.map(fn=>fn());await new Promise(resolve=>setImmediate(resolve));
 assert.equal(states.at(-1).posts.length,1);
 listeners.get('post-created')({detail:{id:'meal'}});
 listeners.get('post-unavailable')({detail:{id:'meal',reason:'needs_input'}});
 assert.equal(states.at(-1).posts.length,0);
 resolveCard({...post,status:'ready'});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(states.at(-1).posts.length,0,'stale hydration must not resurrect removed meal');
 for(const cleanup of cleanups)cleanup?.();
});
