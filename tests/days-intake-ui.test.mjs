import {formatDate} from '../src/i18n/format.ts';
import {englishIntl} from './fixtures/english-intl.mjs';
import {cardGapWording} from '../src/i18n/card.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import * as days from '../src/lib/posts/days.ts';
import * as nutrition from '../src/lib/nutrition/totals.ts';
import * as intake from '../src/lib/intake/intake.ts';
import {tokens} from '../src/lib/theme/tokens.ts';
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
const turn=()=>new Promise(resolve=>setImmediate(resolve));
function mount(file,{fetch=()=>{throw Error('unexpected read');},desktop=false}={}) {
 const slots=[];let cursor=0;
 const hooks={useState(initial){const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;return[slots[index],value=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];},useRef(current){const index=cursor++;return slots[index]??=( {current});},useCallback:fn=>fn,useEffect(){},useSyncExternalStore:(_s,_r,server)=>server()};
 const exports={};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../src/components/${file}.tsx`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,fetch,console,matchMedia:()=>({matches:false}),requestAnimationFrame:fn=>fn(),window:{history:{replaceState(){}},location:{pathname:'/days'}},document:{getElementById:()=>null},require(name){
  if(name==='@/i18n/format')return{formatDate};if(name==='next-intl')return englishIntl;if(name==='@/i18n/card')return{cardGapWording};
  if(name==='react')return hooks;if(name==='react/jsx-runtime')return jsx;
  if(name==='@/lib/posts/days')return days;if(name==='@/lib/nutrition/totals')return nutrition;if(name==='@/lib/intake/intake')return intake;if(name==='@/lib/theme/tokens')return{tokens};
  if(name==='next/navigation')return{useRouter:()=>({refresh(){}})};
  if(name==='@/lib/ui/use-desktop')return{useDesktop:()=>desktop};
  if(name==='@/components/LocalTime')return{useDeviceTimeZone:()=> 'UTC'};
  if(name==='@/lib/time/local')return{formatLocalTime:()=> '12:00 PM'};
  if(name==='@/components/MonthGrid')return{formatDayKcal:n=>String(n)};
  if(name==='@/components/StoryPlayer')return{__esModule:true,default:'StoryPlayer',dayPostName:post=>post.caption};
  if(name==='next/link'||name.startsWith('@/components/'))return{__esModule:true,default:name,Icon:'Icon',TopBar:'TopBar',ResultsCard:'ResultsCard'};
  throw Error(name);
 }});
 return props=>{cursor=0;return exports.default(props);};
}
function nodes(tree){if(!tree||typeof tree!=='object')return[];if(Array.isArray(tree))return tree.flatMap(nodes);return[tree,...nodes(tree.props?.children)];}
function text(tree){if(tree==null||typeof tree==='boolean')return'';if(Array.isArray(tree))return tree.map(text).join(' ');return typeof tree==='object'?text(tree.props?.children):String(tree);}
const date='2026-11-02',month='2026-11';
const day={date,posts:[{id:'meal',caption:'Rice',items:[],totals:nutrition.sumNutrition([]),eatenAt:date+'T12:00:00Z',photoUrl:null}],totals:nutrition.sumNutrition([]),intake:null,pending:0};
test('StoryPlayer keeps meals, shows failed drinks and reads again only after Try again',()=>{
 let reads=0;const render=mount('StoryPlayer');
 const props={day,zone:'UTC',onClose(){},onDay:actual=>{assert.equal(actual,date);reads++;},cell:()=>undefined};
 let tree=render(props);assert.match(text(tree),/Couldn’t load drinks\./);assert.match(text(tree),/Rice/);assert.equal(reads,0);
 nodes(tree).find(node=>node.type==='button'&&text(node)==='Try again').props.onClick();assert.equal(reads,1);
 tree=render({...props,day:{...day,intake:{water:500,caffeine:0}}});assert.doesNotMatch(text(tree),/Couldn’t load drinks/);assert.match(text(tree),/500/);
 tree=render({...props,day:{...day,intake:intake.emptyIntake()}});assert.doesNotMatch(text(tree),/Couldn’t load drinks|Try again/);
});
test('month failure keeps meal cells and explicit Try again replaces unavailable state',async()=>{
 let reads=0;const summary={days:[{day:date,posts:1,pending:0,ready:true,kcal:100}],posted:1};
 const render=mount('DaysView',{fetch:async()=>{reads++;return Response.json(summary);}});
 const props={initialMonths:{[month]:summary},initialMonthErrors:[month],earliest:date,today:date,zone:'UTC'};
 let tree=render(props);assert.match(text(tree),/Couldn’t load monthly drinks\./);assert.equal(reads,0);
 assert.equal(nodes(tree).find(node=>node.type==='@/components/PhoneCalendar').props.months[month].days[0].posts,1);
 nodes(tree).find(node=>node.type==='button'&&text(node)==='Try again').props.onClick();await turn();
 assert.equal(reads,1);tree=render(props);assert.doesNotMatch(text(tree),/Couldn’t load monthly drinks/);
});
test('an older month HTTP failure shows preserved meals and waits for a pressed retry',async()=>{
 let reads=0;const older='2026-10';const summary={days:[{day:'2026-10-02',posts:1,pending:0,ready:true,kcal:100}],posted:1};
 const render=mount('DaysView',{fetch:async()=>{reads++;return reads===1?Response.json({month:older,summary,error:'Couldn’t load monthly drinks.'},{status:503}):Response.json({days:[],posted:0});}});
 const props={initialMonths:{[month]:{days:[],posted:0}},earliest:'2026-10-01',today:date,zone:'UTC'};
 let tree=render(props);nodes(tree).find(node=>node.type==='@/components/PhoneCalendar').props.onOlder();await turn();
 tree=render(props);assert.match(text(tree),/2026-10\s+· Couldn’t load monthly drinks\./);
 assert.equal(nodes(tree).find(node=>node.type==='@/components/PhoneCalendar').props.months[older].days[0].posts,1);
 await turn();assert.equal(reads,1);
 nodes(tree).find(node=>node.type==='button'&&text(node)==='Try again').props.onClick();await turn();
 tree=render(props);assert.equal(reads,2);assert.doesNotMatch(text(tree),/Couldn’t load monthly drinks/);
 assert.equal(nodes(tree).find(node=>node.type==='@/components/PhoneCalendar').props.months[older].days.length,0,'successful empty month is authoritative');
});
test('desktop month view also exposes the unavailable state and a user retry',async()=>{
 let reads=0;const summary={days:[],posted:0};
 const render=mount('DaysView',{desktop:true,fetch:async()=>{reads++;return Response.json(summary);}});
 const props={initialMonths:{[month]:summary},initialMonthErrors:[month],earliest:date,today:date,zone:'UTC'};
 let tree=render(props);assert.match(text(tree),/Couldn’t load monthly drinks/);assert.equal(reads,0);
 nodes(tree).find(node=>node.type==='button'&&text(node)==='Try again').props.onClick();await turn();
 tree=render(props);assert.equal(reads,1);assert.doesNotMatch(text(tree),/Couldn’t load monthly drinks/);
});
