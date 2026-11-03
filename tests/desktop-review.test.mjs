import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import{readFileSync}from'node:fs';
import{dateInZone,validZone}from'../src/lib/posts/days.ts';
const jsx=(type,props)=>({type,props:props??{}});
function compile(file){return ts.transpileModule(readFileSync(new URL('../src/components/'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('Today uses the active zone and ignores older responses even when aborted transport still resolves',async()=>{
 const effects=[],requests=[],listeners=new Map(),state=[];let index=0;
 const exported={};
 vm.runInNewContext(compile('DesktopToday.tsx'),{exports:exported,Intl,Date,AbortController,fetch:(url,options)=>new Promise(resolve=>requests.push({url,signal:options.signal,resolve})),window:{addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)},require(name){
  if(name==='react')return{useState:initial=>{const slot=index++;state[slot]=initial;return[initial,value=>{state[slot]=value;}]},useEffect:fn=>effects.push(fn)};
  if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};if(name==='@/lib/ui/use-desktop')return{useDesktop:()=>true};if(name==='@/lib/posts/days')return{dateInZone,validZone};if(name==='@/lib/nutrition/totals')return{formatCalories:()=>'',formatNutrition:()=>''};if(name==='next/link')return{default:'a'};throw Error(name);
 }});
 exported.default({zone:'Asia/Jakarta'});const cleanup=effects[0]();assert.equal(new URL(requests[0].url,'http://localhost').searchParams.get('tz'),'Asia/Jakarta');
 listeners.get('post-settled')();assert.equal(requests[0].signal.aborted,true);assert.equal(requests[1].signal.aborted,false);
 requests[1].resolve({ok:true,json:async()=>({day:{date:'newest'}})});await flush();assert.equal(state[0].date,'newest');
 requests[0].resolve({ok:true,json:async()=>({day:{date:'stale'}})});await flush();assert.equal(state[0].date,'newest');
 cleanup();assert.equal(requests[1].signal.aborted,true);assert.equal(listeners.size,0);
});
test('calendar arrow handling leaves rich inputs and controls outside its date grid alone',()=>{
 const exported={};vm.runInNewContext(compile('DesktopDays.tsx'),{exports:exported,Date,require(name){if(name==='react')return{useState:x=>[x,()=>{}]};if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};if(name==='next/link')return{default:'a'};if(name==='@/components/MonthGrid')return{default:'grid',monthName:()=>'',postedLabel:()=>''};return{};}});
 const tree=exported.default({months:{},today:'2026-11-03',earliest:'2026-10-01',zone:'UTC'}),handler=tree.props.onKeyDownCapture;
 for(const where of ['outside','combobox','editable']){let prevented=false;handler({key:'ArrowDown',target:{closest:selector=>selector==='[data-month]'?(where==='outside'?null:{}):where==='outside'?null:{}},preventDefault(){prevented=true},stopPropagation(){throw Error('unrelated control was intercepted')}});assert.equal(prevented,false,where);}
});
test('post modal dismisses only a click that both starts and ends on its backdrop',()=>{
 const exported={},navigation=[];const current={getBoundingClientRect:()=>({left:140,right:1140,top:60,bottom:740})};
 vm.runInNewContext(compile('DesktopWorkspace.tsx'),{exports:exported,URL,window:{location:{href:'http://localhost/?post=meal'}},require(name){if(name==='react')return{useRef:current=>({current}),useState:x=>[x,()=>{}],useEffect(){},useCallback:fn=>fn};if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};if(name==='@/lib/ui/use-desktop')return{useDesktop:()=>true};if(name==='@/lib/ui/scroll-lock')return{};if(name==='next/navigation')return{useRouter:()=>({push:url=>navigation.push(url)}),useSearchParams:()=>new URLSearchParams('post=meal')};throw Error(name);}});
 const tree=exported.default({children:null}),dialog=tree.props.children.find(node=>node?.type==='dialog');
 const event=(x,y,target=current)=>({target,currentTarget:current,clientX:x,clientY:y});
 dialog.props.onPointerDown(event(400,300));dialog.props.onClick(event(100,20));assert.equal(navigation.length,0,'drag from inside cannot dismiss');
 const child={};dialog.props.onPointerDown(event(100,20,child));dialog.props.onClick(event(100,20,child));assert.equal(navigation.length,0,'out-of-bounds child is not the backdrop');
 dialog.props.onPointerDown(event(100,20));dialog.props.onClick(event(100,20));assert.equal(navigation.length,1);
});
