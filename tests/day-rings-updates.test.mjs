import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {formatCalories} from '../src/lib/nutrition/totals.ts';
const source=readFileSync(new URL('../src/components/DayRings.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
function mount(overrides={}){
 const events=new EventTarget(),effects=[],exports={},jsx=(type,props)=>({type,props});let state,tree;
 const dates={shiftDay:(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);},withZone:x=>x};
 vm.runInNewContext(code,{exports,Date,Intl,Boolean,Array,CustomEvent,window:events,document:{cookie:''},require(name){
  if(name==='react')return{useState:initial=>{state??=initial;return[state,value=>{state=value;}];},useEffect:run=>effects.push(run)};
  if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};
  if(name==='next/navigation')return{useRouter:()=>({refresh(){}})};
  if(name==='next/link')return{default:'a'};
  if(name==='@/lib/posts/days')return dates;
  if(name==='@/lib/nutrition/totals')return{formatCalories};
  if(name==='@/lib/posts/bubble')return{bubbleLinkClass:has=>has?'has-post':'empty'};
  if(name==='@/components/ui/Icon')return{Icon:'icon'};
  throw Error(name);
 }});
 const props={ownerId:'owner',days:[{date:'2026-11-02'}],totals:[{day:'2026-11-02',ready:true,kcal:600}],today:'2026-11-03',zone:Intl.DateTimeFormat().resolvedOptions().timeZone,zoneKnown:true,...overrides};
 const render=next=>{tree=exports.default(next??props);return JSON.stringify(tree);};
 render();const cleanups=effects.splice(0).map(run=>run());
 return{events,props,render,close:()=>cleanups.forEach(fn=>fn?.())};
}
test('rings consume the mounted owner feed snapshot, preserve measured zero and refuse another account',()=>{
 const h=mount();
 h.events.dispatchEvent(new CustomEvent('feed-day-totals',{detail:{userId:'other-owner',days:[{day:'2026-11-02',ready:true,kcal:999}]}}));
 assert.match(h.render(),/600 kcal consumed/);assert.doesNotMatch(h.render(),/999/);
 h.events.dispatchEvent(new CustomEvent('feed-day-totals',{detail:{userId:'owner',days:[{day:'2026-11-02',ready:true,kcal:0}]}}));
 assert.match(h.render(),/0 kcal consumed/);
 h.events.dispatchEvent(new CustomEvent('feed-day-totals',{detail:{userId:'owner',days:[{day:'2026-11-02',ready:true,kcal:null}]}}));
 assert.match(h.render(),/nutrition unavailable/);assert.doesNotMatch(h.render(),/NaN/);
 h.close();
});
test('a new server seed supersedes an old snapshot; deletion clears the former logged-day ring',()=>{
 const h=mount();h.events.dispatchEvent(new CustomEvent('feed-day-totals',{detail:{userId:'owner',days:[{day:'2026-11-02',ready:false,kcal:0}]}}));
 assert.match(h.render(),/no posts/);assert.doesNotMatch(h.render(),/600 kcal consumed/);
 const next={...h.props,totals:[{day:'2026-11-02',ready:true,kcal:450}]};
 assert.match(h.render(next),/450 kcal consumed/);h.close();
});


test('fallback rings stay neutral until this verified owner supplies a fresh whole-day snapshot',()=>{
 const h=mount({pending:true,days:[],totals:[]});
 assert.match(h.render(),/updating/);assert.doesNotMatch(h.render(),/600 kcal consumed/);
 h.events.dispatchEvent(new CustomEvent('feed-day-totals',{detail:{userId:'owner',fresh:false,days:[{day:'2026-11-03',ready:true,kcal:999}]}}));
 assert.match(h.render(),/updating/);assert.doesNotMatch(h.render(),/999/,'a cached partial feed is not an authoritative daily total');
 h.events.dispatchEvent(new CustomEvent('feed-day-totals',{detail:{userId:'other-owner',fresh:true,days:[{day:'2026-11-03',ready:true,kcal:888}]}}));
 assert.doesNotMatch(h.render(),/888/);
 h.events.dispatchEvent(new CustomEvent('feed-day-totals',{detail:{userId:'owner',fresh:true,days:[{day:'2026-11-03',ready:true,kcal:0}]}}));
 assert.match(h.render(),/"children":"0"/);assert.doesNotMatch(h.render(),/updating/);h.close();
 const anonymous=mount({ownerId:null,pending:true,days:[],totals:[]});
 anonymous.events.dispatchEvent(new CustomEvent('feed-day-totals',{detail:{userId:'owner',fresh:true,days:[{day:'2026-11-03',ready:true,kcal:777}]}}));
 assert.doesNotMatch(anonymous.render(),/777/);assert.match(anonymous.render(),/updating/);anonymous.close();
});
