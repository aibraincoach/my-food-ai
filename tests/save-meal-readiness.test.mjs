import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {beginBookmark,finishBookmark} from '../src/lib/posts/save-optimistic.ts';

// Render the actual surfaces and their actual menu/action children. Unrelated
// widgets and browser effects are inert; button handlers dispatch real events.
function mount(status,saved=false){
 const events=new EventTarget(),savedEvents=[];events.addEventListener('save-meal',e=>savedEvents.push(e.detail));
 const post={id:'post',status,caption:'Meal',eaten_at:'2026-11-04T12:00:00Z',items:[],slides:[],saved_meal_id:saved?'saved-id':null};
 const detail={post,card:post,items:[],slides:[],photo:null,isDrink:false};
 const names=new Set(['PostActions','PostMenu','PostCard','PostDetailHeader','OutlineOverlay','PostDetail']);
 const modules=new Map(),jsx=(type,props)=>({type,props});
 function load(name){
  if(modules.has(name))return modules.get(name);
  const exports={};modules.set(name,exports);
  const source=readFileSync(new URL(`../src/components/${name}.tsx`,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,Date,Intl,Boolean,Array,CustomEvent,AbortSignal,window:events,require(id){
   const component=id.split('/').at(-1);if(names.has(component))return load(component);
   if(id==='react')return{useState:initial=>[typeof initial==='function'?initial():initial,()=>{}],useRef:current=>({current}),useEffect:()=>{},Fragment:'fragment'};
   if(id==='react/jsx-runtime')return{jsx,jsxs:jsx,Fragment:'fragment'};
   if(id==='next/link')return{default:'a'};
   if(id==='next/navigation')return{useRouter:()=>({refresh(){}}),notFound:()=>{throw Error('not found')},redirect:()=>{throw Error('redirect')}};
   if(id==='next/server')return{connection:async()=>{}};
   if(id==='next/headers')return{cookies:async()=>({get:()=>({value:'UTC'})})};
   if(id==='@/lib/supabase/server')return{createClient:async()=>({})};
   if(id==='@/lib/auth/verified-user')return{verifiedUserId:async()=>'owner'};
   if(id==='@/lib/posts/items')return{getPostDetail:async()=>detail,isUuid:()=>true};
   if(id==='@/lib/posts/days')return{validZone:x=>x};
   if(id==='@/lib/posts/save-optimistic')return{beginBookmark,finishBookmark};
   if(id==='@/lib/theme/tokens')return{tokens:{spacing:{phone:390},detail:{}}};
   if(id==='@/components/LocalTime')return{useLocalTime:()=>'',useLocalDate:()=>'',LocalTime:()=>null};
   if(id==='@/components/PostHandle')return{usePostHandle:()=> 'test',AgentAttribution:()=>null};
   if(id==='@/components/useDrinkCard')return{useDrinkCard:()=>null};
   if(id==='@/lib/pipeline/pending-items')return{readPendingItems:()=>[]};
   if(id==='@/lib/posts/feed')return{hasUnavailableFields:()=>false};
   if(id==='@/lib/pipeline/card-data')return{cardDataFromRow:()=>({})};
   if(id==='@/components/Thread')return{default:({desktopActions})=>jsx('thread',{children:desktopActions})};
   return new Proxy({default:()=>null},{get:(object,key)=>key in object?object[key]:()=>null});
  }});
  return exports;
 }
 function render(node){
  if(node==null||typeof node!=='object')return node;
  if(Array.isArray(node))return node.map(render);
  if(typeof node.type==='function')return render(node.type(node.props));
  return{...node,props:{...node.props,children:render(node.props?.children)}};
 }
 function buttons(node){if(node==null||typeof node!=='object')return[];if(Array.isArray(node))return node.flatMap(buttons);return[...(node.type==='button'?[node]:[]),...buttons(node.props?.children)];}
 const surface=async(name)=>render(await load(name).default(name==='PostCard'?{post}:name==='PostDetail'?{id:'post',desktopModal:true}:name==='OutlineOverlay'?{postId:'post',status,initialized:false,items:[],slides:[],photo:null,caption:'Meal',eatenAt:post.eaten_at,saved}:name==='PostDetailHeader'?{postId:'post',caption:'Meal',eatenAt:post.eaten_at,status,saved}:{postId:'post',status,saved,modelCommentId:null,fingerprint:null}));
 return{surface,buttons,savedEvents};
}
for(const surface of ['PostCard','PostDetailHeader','OutlineOverlay','PostDetail']){
 test(`${surface}: processing saves are faded and inert, then ready saves dispatch`,async()=>{
  for(const status of ['queued','processing','needs_input','failed','ready']){
   const h=mount(status),tree=await h.surface(surface);
   const controls=h.buttons(tree).filter(button=>button.props['aria-label']==='Save meal'||button.props.children?.some?.(child=>child?.props?.children==='Save meal'));
   assert.ok(controls.length>0,'actual save controls rendered');
   for(const button of controls){assert.equal(Boolean(button.props.disabled),status!=='ready');if(status!=='ready')assert.match(button.props.className,/text-faint/);button.props.onClick();}
   assert.equal(h.savedEvents.length,status==='ready'?controls.length:0);
  }
 });
}
test('an already-saved processing meal can still be unsaved from actions or menus',async()=>{
 for(const surface of ['PostCard','PostDetailHeader','OutlineOverlay','PostDetail']){
  const h=mount('processing',true),tree=await h.surface(surface);
  const controls=h.buttons(tree).filter(button=>button.props['aria-label']==='Unsave meal'||button.props.children?.some?.(child=>child?.props?.children==='Unsave'));
  assert.ok(controls.length>0);for(const button of controls){assert.equal(Boolean(button.props.disabled),false);button.props.onClick();}assert.equal(h.savedEvents.length,controls.length);
 }
});
test('standalone actions with no known status cannot save an unfinished meal',async()=>{
 const h=mount(undefined),tree=await h.surface('PostActions');const button=h.buttons(tree).find(b=>b.props['aria-label']==='Save meal');assert.equal(button.props.disabled,true);button.props.onClick();assert.equal(h.savedEvents.length,0);
});
